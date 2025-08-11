"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getRestrictions,
  getRecipes,
  setRecipes,
  getWeeklyPlan,
  setWeeklyPlan,
  type DayPlan,
} from "@/lib/storage";
import { toast } from "sonner"; // at top

type SpoonResult = {
  id: number;
  title: string;
  image: string;
  nutrition?: { nutrients: { name: string; amount: number; unit: string }[] };
};

function toRecipe(r: SpoonResult) {
  const n = r?.nutrition?.nutrients || [];
  const find = (name: string) => n.find((x) => x.name.toLowerCase() === name.toLowerCase());
  const kcal = Math.round(find("Calories")?.amount || 0);
  const protein = Math.round(find("Protein")?.amount || 0);
  const fat = Math.round(find("Fat")?.amount || 0);
  const carbs = Math.round(find("Carbohydrates")?.amount || 0);
  return { id: String(r.id), name: r.title, kcal, protein, carbs, fat, tags: [] as string[] };
}

export default function RecipesPage() {
  // SSR-safe localStorage usage: load after mount
  const [saved, setSaved] = useState(getRecipes()); // fine; replaced in useEffect to be safe
  useEffect(() => setSaved(getRecipes()), []);

  // form state
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [include, setInclude] = useState("");
  const [exclude, setExclude] = useState("");
  const [halalApprox, setHalalApprox] = useState(true);

  // seed excludes from Restrictions after mount
  useEffect(() => {
    const r = getRestrictions();
    if (r?.avoid?.length) setExclude(r.avoid.join(","));
    if (r?.type && r.type.toLowerCase() === "halal") setHalalApprox(true);
  }, []);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpoonResult[]>([]);

  const search = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/spoonacular/search", window.location.origin);
      if (q) url.searchParams.set("query", q);
      if (cuisine) url.searchParams.set("cuisine", cuisine);
      url.searchParams.set("number", "12");
      url.searchParams.set("halalApprox", String(halalApprox));
      if (include) url.searchParams.set("include", include);
      if (exclude) url.searchParams.set("exclude", exclude);

      const res = await fetch(url.toString());
      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } finally {
      setLoading(false);
    }
  };

 const addToLibrary = (r: SpoonResult) => {
  const recipe = toRecipe(r);
  const updated = [...saved, recipe];
  setSaved(updated);
  setRecipes(updated);
  toast.success(`Saved • ${recipe.name}`);
};

const addToPlan = (r: SpoonResult, dayIndex: number, slot: "breakfast" | "lunch" | "dinner") => {
  const recipe = toRecipe(r);
  const plan = getWeeklyPlan();
  while (plan.length < 7) plan.push({ breakfast: {}, lunch: {}, dinner: {} } as any);
  plan[dayIndex] = { ...plan[dayIndex], [slot]: recipe } as DayPlan;
  setWeeklyPlan(plan);
  toast.success(`Added to Day ${dayIndex + 1} • ${slot}: ${recipe.name}`);
};


  const dayOptions = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recipe Finder</h1>
        <Link href="/planner" className="text-sm underline">Go to Planner →</Link>
      </div>

      {/* Search form */}
      <div className="rounded-xl border p-4 bg-white dark:bg-neutral-900 space-y-3">
        <div className="grid md:grid-cols-2 gap-2">
          <input
            className="border p-2 rounded"
            placeholder='Search (e.g. "chicken rice")'
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <input
            className="border p-2 rounded"
            placeholder="Cuisine (comma separated)"
            value={cuisine} onChange={(e) => setCuisine(e.target.value)}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-2">
          <input
            className="border p-2 rounded"
            placeholder="Include ingredients"
            value={include} onChange={(e) => setInclude(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Exclude ingredients"
            value={exclude} onChange={(e) => setExclude(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={halalApprox}
              onChange={(e) => setHalalApprox(e.target.checked)}
            />
            Halal (approx) — excludes pork/alcohol/gelatin
          </label>
        </div>
        <button
          onClick={search}
          className="px-4 py-2 rounded bg-emerald-600 text-white"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Results */}
      {!!results.length && (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((r) => {
            const rec = toRecipe(r);
            return (
              <div key={r.id} className="border rounded-xl p-3 bg-white dark:bg-neutral-900">
                <div className="flex gap-3">
                  {r.image && (
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {rec.kcal} kcal • {rec.protein}g P • {rec.carbs}g C • {rec.fat}g F
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() => addToLibrary(r)}
                        className="px-3 py-1 rounded border"
                      >
                        Save
                      </button>

                      <span className="opacity-70">Add to:</span>
                      <select onChange={(e) => e.currentTarget.value && addToPlan(r, Number(e.currentTarget.value), "breakfast")}>
                        <option value="">Breakfast…</option>
                        {dayOptions.map((d) => <option key={d} value={d}>Day {d + 1}</option>)}
                      </select>
                      <select onChange={(e) => e.currentTarget.value && addToPlan(r, Number(e.currentTarget.value), "lunch")}>
                        <option value="">Lunch…</option>
                        {dayOptions.map((d) => <option key={d} value={d}>Day {d + 1}</option>)}
                      </select>
                      <select onChange={(e) => e.currentTarget.value && addToPlan(r, Number(e.currentTarget.value), "dinner")}>
                        <option value="">Dinner…</option>
                        {dayOptions.map((d) => <option key={d} value={d}>Day {d + 1}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Saved library */}
      {!!saved.length && (
        <div className="rounded-xl border p-4 bg-white dark:bg-neutral-900">
          <div className="font-medium mb-2">Saved Recipes</div>
          <ul className="text-sm list-disc list-inside">
            {saved.map((r, i) => (
              <li key={i}>
                {r.name} — {r.kcal} kcal • {r.protein}g P • {r.carbs}g C • {r.fat}g F
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
