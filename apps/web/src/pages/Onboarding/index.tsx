import { Link } from "react-router-dom";

export function OnboardingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome to MadMed</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm text-gray-600">
          지금은 <span className="font-medium">mock data</span>로 화면 흐름만
          <br />
          다음 단계에서 Firebase Auth/Firestore 붙이기
        </p>

        <div className="flex gap-2">
          <Link
            to="/household"
            className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white"
          >
            Start (Household)
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm"
          >
            Skip to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
