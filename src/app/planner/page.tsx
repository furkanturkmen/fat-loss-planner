// src/app/planner/page.tsx
"use client";

import { useMemo, useEffect, useState } from "react";
import { useProfile, useWeeklyPlan } from "@/lib/useAppData";
import { calcTargets } from "@/lib/nutrition";
import { toast } from "sonner";

/* ---------- helpers ---------- */
function safeNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}
function dayTotals(d: any) {
  const b = d?.breakfast ?? {};
  const l = d?.lunch ?? {};
  const di = d?.dinner ?? {};
  return {
    kcal: safeNum(b.kcal) + safeNum(l.kcal) + safeNum(di.kcal),
    protein: safeNum(b.protein) + safeNum(l.protein) + safeNum(di.protein),
    carbs: safeNum(b.carbs) + safeNum(l.carbs) + safeNum(di.carbs),
    fat: safeNum(b.fat) + safeNum(l.fat) + safeNum(di.fat),
  };
}
function KPITile({
  label,
  value,
  unit,
  token, // "kcal" | "protein" | "carbs" | "fat"
}: {
  label: string;
  value: string | number;
  unit?: string;
  token: "kcal" | "protein" | "carbs" | "fat";
}) {
  return (
    <div className={`kpi kpi--${token} kpi-tile p-3`}>
      <div className="text-xl font-semibold text-gray-700">{label}</div>
      <div className="text-l">
        {value} {unit}
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  token, // "kcal" | "protein" | "carbs" | "fat"
}: {
  label: string;
  value: number;
  target: number;
  token: "kcal" | "protein" | "carbs" | "fat";
}) {
  const [tooltipX, setTooltipX] = useState(0);

  const raw = Math.round((value / Math.max(1, target)) * 100); // can exceed 100
  const fill = Math.max(0, Math.min(100, raw));                 // cap at 100
  const over = Math.max(0, raw - 100);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTooltipX(Math.max(0, Math.min(e.clientX - r.left, r.width)));
  };

  return (
    <div className={`space-y-1 macro macro--${token}`}>
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{Math.round(value)}/{target}</span>
      </div>

      <div
        className={`group relative w-full h-5 rounded`}
        style={{
          background: "var(--macro-track)",
          boxShadow: over > 0 ? "0 0 0 2px var(--macro-over-ring) inset" : undefined,
        }}
        role="progressbar"
        aria-valuenow={Math.min(raw, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
        onMouseMove={onMove}
      >
        {/* filled part */}
        <div
          className="h-5 rounded transition-[width] duration-300"
          style={{ width: `${fill}%`, background: "var(--macro-bar)" }}
        />

        {/* centered % (always white with soft shadow for readability) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-semibold text-white pointer-events-none"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,.45)" }}
        >
          {raw}%
        </div>

        {/* follow-cursor tooltip */}
        <div
          className="absolute -top-8 z-10 bg-gray-900 text-white text-[11px] rounded px-2 py-1 whitespace-nowrap
                     pointer-events-none opacity-0 group-hover:opacity-100 transition"
          style={{ left: tooltipX, transform: "translateX(-50%)" }}
        >
          {`${Math.round(value)} / ${target} (${raw}%)`}
        </div>
      </div>

      {over > 0 && (
        <div className="text-[11px] text-red-600 mt-0.5">
          Over by {over}% — consider swapping or shrinking this meal.
        </div>
      )}
    </div>
  );
}

/* ---------- page ---------- */
export default function PlannerPage() {
  // data
  const profile = useProfile();       // null until hydrated
  const weeklyPlan = useWeeklyPlan(); // null until hydrated

  // one-time toast right after onboarding
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("planJustGenerated") === "1") {
      toast.success("Plan generated! You can swap meals or randomize any day.", { duration: 3500 });
      localStorage.removeItem("planJustGenerated");
    }
  }, []);

  // targets & plan (safe defaults pre-hydration)
  const targets = useMemo(() => calcTargets((profile as any) ?? {}), [profile]);
  const plan = useMemo(() => (Array.isArray(weeklyPlan) ? weeklyPlan : []), [weeklyPlan]);

  const weeklyAvg = useMemo(() => {
    if (!plan.length) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const sum = plan.reduce(
      (acc, d) => {
        const t = dayTotals(d);
        return {
          kcal: acc.kcal + t.kcal,
          protein: acc.protein + t.protein,
          carbs: acc.carbs + t.carbs,
          fat: acc.fat + t.fat,
        };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      kcal: Math.round(sum.kcal / plan.length),
      protein: Math.round(sum.protein / plan.length),
      carbs: Math.round(sum.carbs / plan.length),
      fat: Math.round(sum.fat / plan.length),
    };
  }, [plan]);

  const hydrated = !!profile && !!weeklyPlan;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Welcome header */}
      <h1 className="text-2xl font-bold">
        Welcome{profile?.name ? `, ${profile.name}` : ""} 👋
      </h1>

      {/* Targets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile token="kcal"    label="Calories" value={targets.kcal}    unit="kcal" />
        <KPITile token="protein" label="Protein"  value={targets.protein} unit="g" />
        <KPITile token="carbs"   label="Carbs"    value={targets.carbs}   unit="g" />
        <KPITile token="fat"     label="Fat"      value={targets.fat}     unit="g" />
      </div>

      {/* Weekly averages vs targets */}
      <div className="border rounded p-4 bg-white space-y-2">
        <div className="text-sm font-medium">Weekly Averages (per day)</div>
        <div className="text-xs text-gray-600">
          {weeklyAvg.kcal} kcal • {weeklyAvg.protein}g P • {weeklyAvg.carbs}g C • {weeklyAvg.fat}g F
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
          <MacroBar label="Kcal"    value={weeklyAvg.kcal}    target={targets.kcal}    token="kcal" />
          <MacroBar label="Protein" value={weeklyAvg.protein} target={targets.protein} token="protein" />
          <MacroBar label="Carbs"   value={weeklyAvg.carbs}   target={targets.carbs}   token="carbs" />
          <MacroBar label="Fat"     value={weeklyAvg.fat}     target={targets.fat}     token="fat" />
        </div>
      </div>

      {/* Plan list */}
      {!hydrated ? (
        <div className="p-4 text-sm text-gray-500 border rounded bg-white">Loading planner…</div>
      ) : plan.length === 0 ? (
        <p className="text-sm text-gray-500">No plan found. Please re-run onboarding or add recipes.</p>
      ) : (
        <div className="space-y-4">
          {plan.map((day: any, i: number) => {
            const t = dayTotals(day);
            return (
              <div key={i} className="border rounded p-4 bg-white space-y-2">
                <h2 className="font-medium">Day {i + 1}</h2>
                <ul className="text-sm list-disc list-inside">
                  <li>Breakfast: {day?.breakfast?.name ?? "—"}</li>
                  <li>Lunch: {day?.lunch?.name ?? "—"}</li>
                  <li>Dinner: {day?.dinner?.name ?? "—"}</li>
                </ul>
                <div className="text-xs text-gray-600">
                  {t.kcal} kcal • {t.protein}g P • {t.carbs}g C • {t.fat}g F
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <MacroBar label="Kcal"    value={t.kcal}    target={targets.kcal}    token="kcal" />
                  <MacroBar label="Protein" value={t.protein} target={targets.protein} token="protein" />
                  <MacroBar label="Carbs"   value={t.carbs}   target={targets.carbs}   token="carbs" />
                  <MacroBar label="Fat"     value={t.fat}     target={targets.fat}     token="fat" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
