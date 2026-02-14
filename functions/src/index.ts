// functions/src/index.ts

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { addHours, isAfter, subMinutes, isSameDay } from "date-fns";

import { MedicationSchedule, MedicationStatus } from "./types/domain";

admin.initializeApp();

/**
 * 타임존을 고려하여 '오늘'의 특정 시간 Date 객체를 구합니다.
 */
function getTargetDate(timeStr: string, timezone: string): Date {
  const now = new Date();
  const todayStr = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const target = toDate(`${todayStr} ${timeStr}:00`, { timeZone: timezone });
  return target;
}

export const medReminderCron = onSchedule("every 5 minutes", async (event) => {
  const db = admin.firestore();
  const now = new Date();
  const nowTs = Timestamp.now();
  
  const tokenCache = new Map<string, string[]>();

  console.log("--- [CRON START] ---", now.toISOString());

  try {
    const allSchedulesSnap = await db.collectionGroup("schedules").get();
    console.log(`[CHECK] 총 조회된 약 스케줄 수: ${allSchedulesSnap.size}개`);

    if (allSchedulesSnap.empty) {
      console.log("[INFO] 처리할 스케줄이 없습니다.");
      return;
    }

    for (const scheduleDoc of allSchedulesSnap.docs) {
      const schedule = scheduleDoc.data() as MedicationSchedule;
      const medId = scheduleDoc.id;
      
      const householdRef = scheduleDoc.ref.parent.parent;
      if (!householdRef) {
        console.log(`[SKIP] 상위 가구 정보를 찾을 수 없음: ${medId}`);
        continue;
      }
      const hid = householdRef.id;
      const logPrefix = `[${hid} / ${medId}]`;

      // 1. 토큰 확인
      let allTokens = tokenCache.get(hid);
      if (!allTokens) {
        console.log(`${logPrefix} 가구 토큰 조회 중...`);
        const membersSnap = await db.collection(`households/${hid}/members`).get();
        allTokens = [];
        membersSnap.forEach(m => {
          const data = m.data();
          if (data.pushTokens) allTokens?.push(...data.pushTokens);
        });
        tokenCache.set(hid, allTokens);
      }

      if (allTokens.length === 0) {
        console.log(`${logPrefix} 등록된 푸시 토큰이 없어 스킵합니다.`);
        continue;
      }

      // 2. 상태 확인
      const statusRef = db.doc(`households/${hid}/status/${medId}`);
      const statusSnap = await statusRef.get();
      const status = statusSnap.data() as MedicationStatus | undefined;

      const morningTarget = getTargetDate(schedule.morningTime, schedule.timezone);
      const eveningTarget = getTargetDate(schedule.eveningTime, schedule.timezone);
      
      const targets = [
        { date: morningTarget, label: "아침", slot: "morning" },
        { date: eveningTarget, label: "저녁", slot: "evening" }
      ];

      for (const t of targets) {
        const slotPrefix = `${logPrefix} (${t.label})`;
        
        const triggerStart = subMinutes(t.date, schedule.reminderMinutes);
        const triggerEnd = addHours(t.date, 2); 

        // [조건 1: 시간 체크]
        const isTimeStarted = isAfter(now, triggerStart);
        const isTimeExpired = isAfter(now, triggerEnd);

        // [조건 2: 복용 체크]
        const takenAtRaw = t.slot === "morning" ? status?.morningTakenAt : status?.eveningTakenAt;
        let isTakenToday = false;
        if (takenAtRaw) {
          const takenDate = typeof takenAtRaw === 'number' ? new Date(takenAtRaw) : (takenAtRaw as any).toDate();
          isTakenToday = isSameDay(takenDate, t.date);
        }

        // [조건 3: 재알림 간격 체크]
        let lastAlertDate = new Date(0);
        if (status?.lastReminderAt) {
          lastAlertDate = (status.lastReminderAt as any).toDate 
            ? (status.lastReminderAt as any).toDate() 
            : new Date(status.lastReminderAt as any);
        }
        const retryWindow = subMinutes(now, 14);
        const isRecentlyAlerted = !isAfter(retryWindow, lastAlertDate);

        // 상세 분석 로그
        console.log(`${slotPrefix} 체크 결과: 
          - 설정시간: ${t.date.toISOString()} (알림시작: ${triggerStart.toISOString()})
          - 현재시간: ${now.toISOString()}
          - [시간여부] 시작됨: ${isTimeStarted}, 만료됨: ${isTimeExpired}
          - [복용여부] 오늘먹었나: ${isTakenToday}
          - [최근알림] 15분이내보냈나: ${isRecentlyAlerted} (마지막알림: ${lastAlertDate.toISOString()})`);

        if (isTimeStarted && !isTimeExpired && !isTakenToday && !isRecentlyAlerted) {
          console.log(`🚀 ${slotPrefix} 모든 조건 충족! 발송을 시작합니다.`);
          
          const message: admin.messaging.MulticastMessage = {
            tokens: allTokens,
            data: {
              title: "MadMed",
              body: `${t.label} 약 먹일 시간이에요.`,
              medId: medId,
              hid: hid,
              link: "/dashboard"
            },
            apns: { payload: { aps: { contentAvailable: true, sound: "default" } } }
          };

          try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`✅ ${slotPrefix} 발송 성공: ${response.successCount}건 (실패: ${response.failureCount}건)`);
            await statusRef.set({ lastReminderAt: nowTs }, { merge: true });
          } catch (error) {
            console.error(`❌ ${slotPrefix} FCM 발송 중 치명적 에러:`, error);
          }
        } else {
          // 왜 발송되지 않았는지 간단히 요약 로그
          const reason = isTakenToday ? "이미 복용함" : 
                        !isTimeStarted ? "아직 알림 시간 전" :
                        isTimeExpired ? "알림 유효 시간 지남" :
                        isRecentlyAlerted ? "방금 알림을 보냄(간격 유지)" : "알 수 없는 이유";
          console.log(`[PASS] ${slotPrefix} 발송 생략 (이유: ${reason})`);
        }
      }
    }
  } catch (err) {
    console.error("!!! [CRON FATAL ERROR] !!!", err);
  }

  console.log("--- [CRON END] ---");
});


export const dailyResetCron = onSchedule({
  schedule: "0 0 * * *", // 매일 자정 실행
  timeZone: "America/Vancouver", // 밴쿠버 기준 자정
}, async (event) => {
  const db = admin.firestore();
  
  try {
    // 모든 status 컬렉션을 찾아 복용 기록(morning/eveningTakenAt)을 null로 초기화
    const statusSnap = await db.collectionGroup("status").get();
    
    const batch = db.batch();
    statusSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        morningTakenAt: null,
        eveningTakenAt: null,
        // lastReminderAt은 알림 간격 조절용이므로 굳이 지우지 않아도 됩니다.
      });
    });
    
    await batch.commit();
    console.log(`[RESET] ${statusSnap.size}개의 복용 상태를 초기화했습니다.`);
  } catch (error) {
    console.error("[RESET ERROR]", error);
  }
});