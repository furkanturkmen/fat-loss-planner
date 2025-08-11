"use client";

import { useEffect, useState } from "react";
import { getProfile, setProfile } from "@/lib/storage";

export default function Step1Character() {
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState("light");
  const [goal, setGoal] = useState("fatloss");

  useEffect(() => {
    const saved = getProfile();
    setName(saved.name || "");
    setAge(saved.age);
    setHeight(saved.height);
    setWeight(saved.weight);
    setGender(saved.gender || "male");
    setActivity(saved.activity || "light");
    setGoal(saved.goal || "fatloss");
    setLoaded(true);
  }, []);

  // Only start auto-saving AFTER initial load, to avoid SSR flicker
  useEffect(() => {
    if (!loaded) return;
    setProfile({ name, age, height, weight, gender, activity, goal });
  }, [loaded, name, age, height, weight, gender, activity, goal]);

  if (!loaded) return <div className="text-sm text-gray-500">Loading profile…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Details</h2>
      <input className="w-full border p-2 rounded" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <input className="border p-2 rounded" type="number" placeholder="Age" value={age ?? ""} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : undefined)} />
        <input className="border p-2 rounded" type="number" placeholder="Height (cm)" value={height ?? ""} onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)} />
        <input className="border p-2 rounded" type="number" placeholder="Weight (kg)" value={weight ?? ""} onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : undefined)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select className="border p-2 rounded" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="male">Male</option><option value="female">Female</option>
        </select>
        <select className="border p-2 rounded" value={activity} onChange={(e) => setActivity(e.target.value)}>
          <option value="sedentary">Sedentary</option><option value="light">Light</option>
          <option value="moderate">Moderate</option><option value="active">Active</option>
        </select>
        <select className="border p-2 rounded" value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option value="fatloss">Fat Loss</option><option value="maintain">Maintain</option><option value="muscle">Muscle Gain</option>
        </select>
      </div>
    </div>
  );
}
