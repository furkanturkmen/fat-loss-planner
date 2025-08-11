"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getProfile, setProfile, setOnboardingComplete } from "@/lib/storage";
import { toast } from "sonner";
import { User, Ruler, Weight, Target, Camera } from "lucide-react";
import Link from "next/link";

type Gender = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active";
type Goal = "fatloss" | "maintain" | "muscle";

export default function ProfilePage() {
  const [loaded, setLoaded] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [gender, setGender] = useState<Gender>("male");
  const [activity, setActivity] = useState<Activity>("light");
  const [goal, setGoal] = useState<Goal>("fatloss");
  const [avatar, setAvatar] = useState<string>("");

  const dirtyRef = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = getProfile();
    setName(p.name || "");
    setAge(p.age ?? "");
    setHeight(p.height ?? "");
    setWeight(p.weight ?? "");
    setGender((p.gender as Gender) || "male");
    setActivity((p.activity as Activity) || "light");
    setGoal((p.goal as Goal) || "fatloss");
    setAvatar(p.avatar || "");
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    dirtyRef.current = true;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setProfile({
        name,
        age: typeof age === "string" ? undefined : age,
        height: typeof height === "string" ? undefined : height,
        weight: typeof weight === "string" ? undefined : weight,
        gender,
        activity,
        goal,
        avatar,
      });
      dirtyRef.current = false;
    //   toast.success("Profile saved");
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [loaded, name, age, height, weight, gender, activity, goal, avatar]);

  const handleAvatarUpload = (file: File) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;
    setAvatar(base64);
    setProfile({ avatar: base64 });
    toast.success("Avatar updated"); // ✅ pretty confirmation
  };
  reader.readAsDataURL(file);
};

  const rerunOnboarding = () => {
    setOnboardingComplete(false);
    toast("Onboarding unlocked. Go back to Home to re-run the steps.");
  };

  if (!loaded) return <div className="p-6 text-sm text-gray-500">Loading profile…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <Button variant="outline" onClick={rerunOnboarding}>
          <Link
        href="/"
        onClick={(e) => {
          const ok = window.confirm("Re-run onboarding? You’ll keep your data; this only re-opens the steps.");
          if (!ok) e.preventDefault();
          else setOnboardingComplete(false);
        }}>Re-run Onboarding</Link>
        </Button>
      </header>

      <section className="rounded-2xl border bg-white dark:bg-neutral-900 p-4 md:p-6 space-y-4">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500">
                <User className="w-10 h-10" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full cursor-pointer">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAvatarUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Profile Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" /> Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <Label>Gender</Label>
            <select
              className="w-full border rounded-md p-2 bg-background"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4" /> Age (years)
            </Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Height (cm)
            </Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Weight className="w-4 h-4" /> Weight (kg)
            </Label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Activity</Label>
            <select
              className="w-full border rounded-md p-2 bg-background"
              value={activity}
              onChange={(e) => setActivity(e.target.value as Activity)}
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div>
            <Label>Goal</Label>
            <select
              className="w-full border rounded-md p-2 bg-background"
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
            >
              <option value="fatloss">Fat Loss</option>
              <option value="maintain">Maintain</option>
              <option value="muscle">Muscle Gain</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                if (saveTimeout.current) clearTimeout(saveTimeout.current);
                setProfile({
                  name,
                  age: typeof age === "string" ? undefined : age,
                  height: typeof height === "string" ? undefined : height,
                  weight: typeof weight === "string" ? undefined : weight,
                  gender,
                  activity,
                  goal,
                  avatar,
                });
                toast.success("Profile saved");
              }}
              className="w-full"
            >
              Save Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
