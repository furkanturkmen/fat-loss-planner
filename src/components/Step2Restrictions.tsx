"use client";

import { useEffect, useState } from "react";
import { getRestrictions, setRestrictions } from "@/lib/storage";
import { X } from "lucide-react";
import { toast } from "sonner";

const SUGGESTIONS = [
  "raw onion",
  "mushrooms",
  "fish",
  "eggplant",
  "turkey breast",
  "shellfish",
  "alcohol",
  "pork",
  "gelatin",
];

export default function Step2Restrictions() {
  const [loaded, setLoaded] = useState(false);
  const [dietType, setDietType] = useState("none");
  const [avoid, setAvoid] = useState<string[]>([]);
  const [input, setInput] = useState("");

  // Load saved restrictions once
  useEffect(() => {
    const saved = getRestrictions();
    setDietType(saved?.type || "none");
    setAvoid(saved?.avoid || []);
    setLoaded(true);
  }, []);

  // Persist whenever user changes anything
  useEffect(() => {
    if (!loaded) return;
    setRestrictions({
      type: dietType,
      avoid: Array.from(new Set(avoid.map((s) => s.trim()).filter(Boolean))),
    });
  }, [loaded, dietType, avoid]);

  if (!loaded) return <div className="text-sm text-gray-500">Loading preferences…</div>;

  const addTag = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (avoid.some((a) => a.toLowerCase() === v.toLowerCase())) {
      setInput("");
      return;
    }
    const next = [...avoid, v];
    setAvoid(next);
    setInput("");
    toast.success(`Added "${v}" to avoids`);
  };

  const removeTag = (val: string) => {
    const next = avoid.filter((x) => x.toLowerCase() !== val.toLowerCase());
    setAvoid(next);
    toast.success(`Removed "${val}"`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && avoid.length) {
      removeTag(avoid[avoid.length - 1]);
    }
  };

  const clearAll = () => {
    setAvoid([]);
    toast.success("Cleared all avoids");
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Diet & Restrictions</h2>

      {/* Diet type */}
      <div>
        <label className="block font-medium mb-1">Diet Type</label>
        <select
          className="w-full border p-2 rounded"
          value={dietType}
          onChange={(e) => setDietType(e.target.value)}
        >
          <option value="none">No preference</option>
          <option value="halal">Halal</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="lowcarb">Low Carb</option>
          <option value="mediterranean">Mediterranean</option>
        </select>
      </div>

      {/* Avoid list */}
      <div className="space-y-2">
        <label className="block font-medium">Ingredients to Avoid</label>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {avoid.length === 0 && (
            <span className="text-xs text-gray-500">None yet — add some below.</span>
          )}
          {avoid.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs bg-gray-50"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-600"
                aria-label={`Remove ${tag}`}
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Input */}
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Type an ingredient and press Enter (e.g., onions, mushrooms)…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs px-2 py-1 rounded-full border hover:bg-gray-100"
            >
              + {s}
            </button>
          ))}
        </div>

        {/* Clear all */}
        {avoid.length > 0 && (
          <div>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
