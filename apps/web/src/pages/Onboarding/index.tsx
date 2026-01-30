// household 만들기 || 합류

import { Link } from "react-router-dom";

export function OnboardingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to MadMed</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm text-gray-600">
          MVP: mock data로 화면만 먼저
        </p>

        <Link
          to="/dashboard"
          className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
