export function calculateTargets(profile: any) {
  const weight = parseFloat(profile.weight);
  const height = parseFloat(profile.height);
  const age = parseFloat(profile.age);
  let bmr = 10 * weight + 6.25 * height - 5 * age + (profile.gender === "male" ? 5 : -161);
  const activity: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  let tdee = bmr * (activity[profile.activity] || 1.375);
  if (profile.goal === "fatloss") tdee -= 500; else if (profile.goal === "muscle") tdee += 250;
  const protein = Math.round(weight * 2);
  return { calories: Math.round(tdee), protein };
}
