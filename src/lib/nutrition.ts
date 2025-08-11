import { Profile } from "@/lib/storage";

export function calcTargets(profile: Profile) {
  if (!profile.age || !profile.height || !profile.weight) {
    return { kcal: 2000, protein: 75, carbs: 250, fat: 70 }; // fallback
  }

  // Mifflin-St Jeor BMR
  const bmr =
    profile.gender === "female"
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;

  // Activity factor
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };
  const tdee = bmr * (activityFactors[profile.activity || "light"] || 1.375);

  // Goal adjustment
  let goalCalories = tdee;
  if (profile.goal === "fatloss") goalCalories -= 500;
  if (profile.goal === "muscle") goalCalories += 300;

  // Macros (percent split: 25% protein, 50% carbs, 25% fat)
  const protein = Math.round((goalCalories * 0.25) / 4);
  const carbs = Math.round((goalCalories * 0.5) / 4);
  const fat = Math.round((goalCalories * 0.25) / 9);

  return {
    kcal: Math.round(goalCalories),
    protein,
    carbs,
    fat,
  };
}
