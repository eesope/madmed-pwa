// apps/web/src/pages/Household/index.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHouseholdId } from "../../app/householdStore";
import {
  createHouseholdWithCode,
  joinHousehold,
  normalizeHouseholdCode,
} from "../../services/householdService";

export function HouseholdPage() {
  const navigate = useNavigate();
  const { householdId, setHouseholdId, clearHouseholdId } = useHouseholdId();

  const [mode, setMode] = useState<"create" | "join">("join");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const normalizedCode = useMemo(() => normalizeHouseholdCode(code), [code]);

  async function onCreate() {
    setError("");
    setBusy(true);
    try {
      const { id } = await createHouseholdWithCode(normalizedCode);
      setHouseholdId(id);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create household.");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    setError("");
    setBusy(true);
    try {
      const { id } = await joinHousehold(normalizedCode);
      setHouseholdId(id);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Failed to join household.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Household</h1>

      {householdId ? (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="text-sm text-gray-600">Currently connected</div>
          <div className="font-mono text-sm">{householdId}</div>

          <button onClick={clearHouseholdId} className="text-sm underline">
            Disconnect (mock)
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border p-4 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("join")}
            className={[
              "rounded-lg px-3 py-2 text-sm border",
              mode === "join" ? "bg-black text-white border-black" : "hover:bg-gray-50",
            ].join(" ")}
          >
            Join
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={[
              "rounded-lg px-3 py-2 text-sm border",
              mode === "create" ? "bg-black text-white border-black" : "hover:bg-gray-50",
            ].join(" ")}
          >
            Create
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {mode === "join" ? "Enter existing household code" : "Choose a new household code"}
          </label>
          <input
            value={normalizedCode}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. DOMI-2026"
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
          />
          <div className="text-xs text-gray-500">
            Allowed: A-Z, 0-9, hyphen (-). Example: DOMI-2026
          </div>

          {mode === "join" ? (
            <button
              onClick={onJoin}
              disabled={busy || !normalizedCode}
              className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Joining..." : "Join household"}
            </button>
          ) : (
            <button
              onClick={onCreate}
              disabled={busy || !normalizedCode}
              className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Creating..." : "Create household"}
            </button>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
