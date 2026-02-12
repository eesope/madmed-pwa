import { Link } from "react-router-dom";

export function OnboardingPage() {
  return (
    /* min-h-[80vh]를 주어 화면의 대부분을 차지하게 하고 수직 중앙 정렬(justify-center) */
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-10">
      
      {/* 스플래시 이미지 (가운데 삽입) */}
      <div className="flex flex-col items-center space-y-4">
        <img 
          src="/pwa-512.png" 
          alt="MadMed Logo" 
          className="w-48 h-48 object-contain"
        />
      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-full flex justify-center">
        <Link
          to="/household"
          className="w-full max-w-[200px] text-center rounded-xl bg-dark-teal px-6 py-4 text-lg font-semibold text-white shadow-md active:scale-95 transition-transform"
        >
          Set Household
        </Link>
      </div>
    </div>
  );
}