"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProfile, setProfile,
  getRestrictions, setRestrictions,
  setOnboardingComplete,
  getWeeklyPlan, setWeeklyPlan,
  type DayPlan, type Profile
} from "@/lib/storage";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, Shield, User } from "lucide-react";

/** --- Minimal hardcoded pool (halal-friendly, fish-free) --- */
type Recipe = { id?: string; name: string; kcal: number; protein: number; carbs: number; fat: number; tags?: string[]; mealType: "breakfast"|"lunch"|"dinner" };
const POOL: Recipe[] = [
  // breakfasts
  { name:"Greek Yogurt Power Bowl", kcal:350, protein:36, carbs:30, fat:10, tags:[], mealType:"breakfast" },
  { name:"Protein Oats", kcal:400, protein:35, carbs:50, fat:9, tags:[], mealType:"breakfast" },
  { name:"Egg & Avocado Toast", kcal:340, protein:20, carbs:25, fat:14, tags:[], mealType:"breakfast" },
  { name:"Cottage Cheese + Fruit", kcal:350, protein:33, carbs:28, fat:10, tags:[], mealType:"breakfast" },

  // lunch
  { name:"Chicken Rice Bowl", kcal:500, protein:42, carbs:50, fat:15, tags:[], mealType:"lunch" },
  { name:"Mediterranean Chicken Salad", kcal:480, protein:42, carbs:20, fat:20, tags:[], mealType:"lunch" },
  { name:"Beef Bulgur Bowl", kcal:500, protein:42, carbs:55, fat:14, tags:[], mealType:"lunch" },
  { name:"Shawarma Salad + pita", kcal:480, protein:38, carbs:40, fat:15, tags:[], mealType:"lunch" },

  // dinner
  { name:"Beef Stir-fry Noodles", kcal:550, protein:42, carbs:65, fat:14, tags:[], mealType:"dinner" },
  { name:"Chicken Curry + Rice", kcal:540, protein:40, carbs:60, fat:13, tags:[], mealType:"dinner" },
  { name:"Pasta w/ Lean Beef", kcal:520, protein:42, carbs:60, fat:12, tags:[], mealType:"dinner" },
  { name:"Lamb Kofta Plate", kcal:540, protein:40, carbs:50, fat:15, tags:[], mealType:"dinner" },
];

function cls(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"welcome"|"character"|"restrictions"|"generating">("welcome");

  // character state
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [gender, setGender] = useState<"male"|"female"| "">("");
  const [activity, setActivity] = useState<"sedentary"|"light"|"moderate"|"active">("light");
  const [goal, setGoal] = useState<"fatloss"|"maintain"|"muscle">("fatloss");

  // restrictions state
  const [dietType, setDietType] = useState("none");
  const [avoid, setAvoid] = useState<string[]>([]);
  const [avoidInput, setAvoidInput] = useState("");

  // load any pre-existing (if user restarted onboarding)
  useEffect(() => {
    const p = getProfile();
    setName(p?.name ?? "");
    setAge((p?.age as any) ?? "");
    setHeight((p?.height as any) ?? "");
    setWeight((p?.weight as any) ?? "");
    setGender(((p?.gender as any) ?? "") as any);
    setActivity(((p?.activity as any) ?? "light") as any);
    setGoal(((p?.goal as any) ?? "fatloss") as any);

    const r = getRestrictions();
    setDietType(r?.type || "none");
    setAvoid(r?.avoid || []);
  }, []);

  const validCharacter = useMemo(() => {
    const okName = name.trim().length >= 2;
    const okAge = typeof age === "number" && age >= 14 && age <= 90;
    const okH = typeof height === "number" && height >= 120 && height <= 230;
    const okW = typeof weight === "number" && weight >= 35 && weight <= 250;
    const okG = gender === "male" || gender === "female";
    return okName && okAge && okH && okW && okG;
  }, [name, age, height, weight, gender]);

  const saveCharacter = () => {
    const payload: Partial<Profile> = {
      name: name.trim(),
      age: typeof age === "string" ? undefined : age,
      height: typeof height === "string" ? undefined : height,
      weight: typeof weight === "string" ? undefined : weight,
      gender: (gender || undefined) as any,
      activity, goal
    };
    setProfile(payload);
    toast.success("Saved profile");
    setStep("restrictions");
  };

  const addTag = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (avoid.some(a => a.toLowerCase() === v.toLowerCase())) return;
    setAvoid([...avoid, v]);
    setAvoidInput("");
  };
  const removeTag = (val: string) => setAvoid(avoid.filter(x => x.toLowerCase() !== val.toLowerCase()));

  const onGenerate = async () => {
    // save restrictions
    setRestrictions({ type: dietType, avoid: Array.from(new Set(avoid)) });

    // show spinner
    setStep("generating");

    // simulate brief “Building Character…” then “Generating plan…”
    await new Promise(r => setTimeout(r, 700));

    // very simple generator: pick random B/L/D per day, filter by avoids and very rough diet
    const forbidden = new Set(
      (avoid || []).map(s => s.toLowerCase().trim())
        .concat(dietType.toLowerCase() === "halal" ? ["pork","bacon","ham","alcohol","gelatin"] : [])
    );

    const pick = (type: Recipe["mealType"]) => {
      const options = POOL.filter(p => p.mealType === type && ![p.name.toLowerCase(), ...(p.tags||[])]
        .some(tag => Array.from(forbidden).some(f => tag.includes(f))));
      return options[Math.floor(Math.random() * options.length)];
    };

    const week: DayPlan[] = Array.from({ length: 7 }, () => ({
      breakfast: pick("breakfast"),
      lunch: pick("lunch"),
      dinner: pick("dinner"),
    }));

    setWeeklyPlan(week);
    await new Promise(r => setTimeout(r, 600));

    setOnboardingComplete(true);
    localStorage.setItem("planJustGenerated", "1");
    toast.success("Your week plan is ready!");
    router.replace("/planner");
  };

  // Modal shell
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
          {step !== "welcome" && (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white">
              <User className="w-4 h-4" />
            </span>
          )}
          <div className="font-semibold">
            {step === "welcome" && "Welcome"}
            {step === "character" && "Build Your Profile"}
            {step === "restrictions" && "Diet & Restrictions"}
            {step === "generating" && "Please wait…"}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {step === "welcome" && (
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Welcome to your Fat-Loss Planner</h1>
              <p className="text-gray-600">
                We’ll personalize a 7-day plan based on your profile, diet, and preferences.
              </p>
              <button
                onClick={() => setStep("character")}
                className="inline-flex items-center gap-2 px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Get started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "character" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input className="w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select className="w-full border rounded px-3 py-2" value={gender} onChange={(e)=>setGender(e.target.value as any)}>
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input className="w-full border rounded px-3 py-2" inputMode="numeric" value={age} onChange={(e)=>setAge(e.target.value===""?"":Number(e.target.value))} placeholder="29" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height (cm)</label>
                  <input className="w-full border rounded px-3 py-2" inputMode="numeric" value={height} onChange={(e)=>setHeight(e.target.value===""?"":Number(e.target.value))} placeholder="178" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input className="w-full border rounded px-3 py-2" inputMode="numeric" value={weight} onChange={(e)=>setWeight(e.target.value===""?"":Number(e.target.value))} placeholder="96" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Activity</label>
                  <select className="w-full border rounded px-3 py-2" value={activity} onChange={(e)=>setActivity(e.target.value as any)}>
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Goal</label>
                  <select className="w-full border rounded px-3 py-2" value={goal} onChange={(e)=>setGoal(e.target.value as any)}>
                    <option value="fatloss">Fat Loss</option>
                    <option value="maintain">Maintain</option>
                    <option value="muscle">Build Muscle</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep("welcome")}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded border"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={saveCharacter}
                  disabled={!validCharacter}
                  className={cls(
                    "inline-flex items-center gap-2 px-5 py-2 rounded text-white",
                    validCharacter ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
                  )}
                >
                  Save & Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === "restrictions" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Diet Type</label>
                <select className="w-full border rounded px-3 py-2" value={dietType} onChange={(e)=>setDietType(e.target.value)}>
                  <option value="none">No preference</option>
                  <option value="halal">Halal</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="lowcarb">Low Carb</option>
                  <option value="mediterranean">Mediterranean</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Ingredients to Avoid</label>
                <div className="flex flex-wrap gap-2">
                  {avoid.length === 0 && (
                    <span className="text-xs text-gray-500">None yet — add below.</span>
                  )}
                  {avoid.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs bg-gray-50">
                      {tag}
                      <button onClick={()=>removeTag(tag)} className="hover:text-red-600" aria-label={`Remove ${tag}`}>✕</button>
                    </span>
                  ))}
                </div>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Type an ingredient and press Enter (e.g., mushrooms)…"
                  value={avoidInput}
                  onChange={(e)=>setAvoidInput(e.target.value)}
                  onKeyDown={(e)=>{
                    if (e.key==="Enter" || e.key===",") {
                      e.preventDefault();
                      addTag(avoidInput);
                    }
                    if (e.key==="Backspace" && !avoidInput && avoid.length) {
                      removeTag(avoid[avoid.length-1]);
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {["raw onion","mushrooms","fish","eggplant","turkey breast","pork","alcohol","gelatin"].map(s=>(
                    <button key={s} type="button" onClick={()=>addTag(s)} className="text-xs px-2 py-1 rounded-full border hover:bg-gray-100">+ {s}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep("character")}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded border"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={onGenerate}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Shield className="w-4 h-4" /> Generate week plan
                </button>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <div className="text-base font-medium">Building Character…</div>
              <div className="text-sm text-gray-600">Personalizing your macros and meals</div>
            </div>
          )}
        </div>

        {/* Footer progress */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <StepDot active={step==="welcome"} done={step!=="welcome"} />
            <StepDot active={step==="character"} done={step==="restrictions" || step==="generating"} />
            <StepDot active={step==="restrictions"} done={step==="generating"} />
            <StepDot active={step==="generating"} done={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <span
      className={cls(
        "inline-block w-2.5 h-2.5 rounded-full",
        done ? "bg-emerald-500" : active ? "bg-blue-600" : "bg-gray-300"
      )}
    />
  );
}
