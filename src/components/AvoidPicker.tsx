"use client";
import { useEffect, useState } from "react";
import { getRestrictions } from "@/lib/storage";
import { addAvoid, removeAvoid, setAvoids } from "@/lib/storage";
import { X } from "lucide-react";
import { toast } from "sonner";

const SUGGESTIONS = [
  "raw onion","mushrooms","fish","eggplant","turkey breast",
  "shellfish","alcohol","pork","gelatin"
];

export default function AvoidPicker() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState("");

  // Load once (no auto-prefill elsewhere)
  useEffect(() => {
    const r = getRestrictions();
    setItems(r?.avoid || []);
  }, []);

  const commit = (list: string[]) => {
    setItems(list);
    setAvoids(list);
    toast.success("Saved avoids");
  };

  const onAdd = (raw: string) => {
    const val = raw.trim();
    if (!val) return;
    const next = Array.from(new Set([...items, val]));
    commit(next);
    setInput("");
  };

  const onRemove = (val: string) => {
    const next = items.filter(x => x.toLowerCase() !== val.toLowerCase());
    commit(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      onAdd(input);
    }
    if (e.key === "Backspace" && !input && items.length) {
      onRemove(items[items.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Ingredients to avoid</label>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {items.map((tag) => (
          <span key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs bg-gray-50">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="hover:text-red-600"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type an ingredient and press Enter…"
        className="w-full border rounded px-3 py-2"
      />

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onAdd(s)}
            className="text-xs px-2 py-1 rounded-full border hover:bg-gray-100"
          >
            + {s}
          </button>
        ))}
      </div>

      {/* Clear all */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={() => commit([])}
          className="text-xs text-red-600 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
