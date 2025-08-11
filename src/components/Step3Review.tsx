"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProfile,
  getRestrictions,
  setWeeklyPlan,
  setOnboardingComplete,
  Recipe,
  DayPlan,
} from "@/lib/storage";

const ALL_MEALS: Recipe[] = [
  { name: "Omelette & Toast", kcal: 380, protein: 24, carbs: 30, fat: 16 },
  { name: "Greek Yogurt & Fruit", kcal: 300, protein: 28, carbs: 30, fat: 6 },
  { name: "Avocado Toast", kcal: 320, protein: 10, carbs: 34, fat: 14 },
  { name: "Chicken Rice Bowl", kcal: 520, protein: 42, carbs: 60, fat: 12 },
  { name: "Beef Stir-fry", kcal: 540, protein: 40, carbs: 55, fat: 16 },
  { name: "Lentil Soup", kcal: 320, protein: 18, carbs: 44, fat: 6 },
  { name: "Pasta Bolognese", kcal: 600, protein: 32, carbs: 75, fat: 18 },
  { name: "Shawarma Salad", kcal: 480, protein: 38, carbs: 22, fat: 22 },
  { name: "Chicken Couscous", kcal: 550, protein: 40, carbs: 62, fat: 14 },
  { name: "Cottage Cheese Bowl", kcal: 280, protein: 26, carbs: 20, fat: 8 },
];

export default function Step3Review({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState<string>("");
  const [avoid, setAvoid] = useState<string[]>([]);
  const [plan, setPlan] = useState<DayPlan[]>([]);

  useEffect(() => {
    const p = getProfile();
    const r = getRestrictions();
    setName(p.name || "");
    setAvoid(r.avoid || []);
    setLoaded(true);
  }, []);

  const filteredMeals = useMemo(() => {
    const avoids = (avoid || []).map((s) => s.toLowerCase());
    return ALL_MEALS.filter((m) => avoids.every((term) => !m.name.toLowerCase().includes(term)));
  }, [avoid]);

  const randomize = () => {
    if (filteredMeals.length < 3) {
      setPlan([]);
      return;
    }
    const newPlan: DayPlan[] = Array.from({ length: 7 }, () => {
      const picks = [...filteredMeals].sort(() => 0.5 - Math.random());
      return { breakfast: picks[0], lunch: picks[1], dinner: picks[2] };
    });
    setPlan(newPlan);
  };

  useEffect(() => {
    if (!loaded) return;
    randomize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, filteredMeals.length]);

  if (!loaded) return <div className="text-sm text-gray-500">Preparing your plan…</div>;

  const saveAndFinish = () => {
    setWeeklyPlan(plan);
    setOnboardingComplete(true);
    router.replace("/planner");
  };

  const dayTotals = (d: DayPlan) => ({
    kcal: d.breakfast.kcal + d.lunch.kcal + d.dinner.kcal,
    protein: d.breakfast.protein + d.lunch.protein + d.dinner.protein,
    carbs: d.breakfast.carbs + d.lunch.carbs + d.dinner.carbs,
    fat: d.breakfast.fat + d.lunch.fat + d.dinner.fat,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review your weekly plan</h2>
      <p className="text-sm text-gray-600">Hi {name || "there"} — here’s your 7-day plan.</p>

      {plan.length === 0 && (
        <div className="text-red-600 text-sm">Not enough meals with current restrictions.</div>
      )}

      {plan.map((d, idx) => {
        const t = dayTotals(d);
        return (
          <div key={idx} className="border rounded p-3 bg-white space-y-1">
            <div className="font-medium">Day {idx + 1}</div>
            <ul className="text-sm list-disc list-inside">
              <li>Breakfast: {d.breakfast.name} ({d.breakfast.kcal} kcal)</li>
              <li>Lunch: {d.lunch.name} ({d.lunch.kcal} kcal)</li>
              <li>Dinner: {d.dinner.name} ({d.dinner.kcal} kcal)</li>
            </ul>
            <div className="text-xs text-gray-600">
              Total: {t.kcal} kcal • {t.protein}g P • {t.carbs}g C • {t.fat}g F
            </div>
          </div>
        );
      })}

      <div className="flex gap-2">
        <button onClick={onBack} className="px-4 py-2 rounded border">Back</button>
        <button onClick={randomize} className="px-4 py-2 rounded border">Randomize again</button>
        <button
          onClick={saveAndFinish}
          disabled={plan.length === 0}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          Save & go to Planner
        </button>
      </div>
    </div>
  );
}
