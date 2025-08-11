// src/lib/storage.ts

// ---------- Types ----------
export interface Profile {
  name?: string;
  age?: number;      // years
  height?: number;   // cm
  weight?: number;   // kg
  gender?: string;   // "male" | "female"
  activity?: string; // "sedentary" | "light" | "moderate" | "active"
  goal?: string;     // "fatloss" | "maintain" | "muscle"
  avatar?: string;   // base64 or data URL
}

export interface Restrictions {
  avoid: string[];   // ingredients to avoid (e.g. ["mushrooms","fish"])
  type: string;      // e.g. "halal" | "vegetarian" | "none"
}

export interface Recipe {
  id?: string;
  name: string;
  kcal: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  tags?: string[];
}

export interface DayPlan {
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
}

export interface AppData {
  profile: Profile;
  restrictions: Restrictions;
  weeklyPlan: DayPlan[]; // <-- always an array
  recipes: Recipe[];
  onboardingComplete: boolean;
}

// Add this near the top
export const STORAGE_EVENT = "app-storage";

// ---------- Storage Core ----------
const STORAGE_KEY = "appData.v1";

const defaults: AppData = {
  profile: {
    name: "",
    gender: "male",
    activity: "light",
    goal: "fatloss",
    avatar: "",
  },
  restrictions: {
    avoid: [],
    type: "none",
  },
  weeklyPlan: [],
  recipes: [],
  onboardingComplete: false,
};

function load(): AppData {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

function save(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // 🔔 let the app know something changed
  window.dispatchEvent(new Event(STORAGE_EVENT));
}
// ---------- Public API ----------

// Whole app object (read-only snapshot)
export function getApp(): AppData {
  return load();
}

// Profile
export function getProfile(): Profile {
  return load().profile;
}
export function setProfile(partial: Partial<Profile>) {
  const data = load();
  data.profile = { ...data.profile, ...partial };
  save(data);
}

// Restrictions
export function getRestrictions(): Restrictions {
  return load().restrictions;
}
export function setRestrictions(input: Partial<Restrictions>) {
  const data = load();
  data.restrictions = { ...data.restrictions, ...input, avoid: input.avoid ?? data.restrictions.avoid };
  save(data);
}

// Weekly plan
export function getWeeklyPlan(): DayPlan[] {
  return load().weeklyPlan || [];
}
export function setWeeklyPlan(plan: DayPlan[]) {
  const data = load();
  data.weeklyPlan = plan;
  save(data);
}

// Recipes
export function getRecipes(): Recipe[] {
  return load().recipes || [];
}
export function setRecipes(list: Recipe[]) {
  const data = load();
  data.recipes = list;
  save(data);
}

// Onboarding
export function getOnboardingComplete(): boolean {
  return !!load().onboardingComplete;
}
export function setOnboardingComplete(value: boolean) {
  const data = load();
  data.onboardingComplete = value;
  save(data);
}

// Validation
export function isProfileComplete(): boolean {
  const p = load().profile;
  return !!(p?.name && p?.age && p?.height && p?.weight);
}

// Utilities
export function resetAll() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// --- Avoid helpers ---
export function setAvoids(list: string[]) {
  const data = load();
  data.restrictions.avoid = Array.from(
    new Set(list.map(s => s.trim()).filter(Boolean))
  );
  save(data);
}

export function addAvoid(item: string) {
  const cur = load();
  const next = Array.from(new Set([...(cur.restrictions.avoid || []), item.trim()])).filter(Boolean);
  cur.restrictions.avoid = next;
  save(cur);
}

export function removeAvoid(item: string) {
  const cur = load();
  cur.restrictions.avoid = (cur.restrictions.avoid || []).filter(x => x.toLowerCase() !== item.toLowerCase());
  save(cur);
}
