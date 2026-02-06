import { Link } from "react-router-dom";

export function OnboardingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome to MadMed</h1>

      <div className="rounded-xl border p-4 space-y-3">

        <div className="flex gap-2">
          <Link
            to="/household"
            className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white"
          >
            Start (Household)
          </Link>

        </div>
      </div>
    </div>
  );
}
