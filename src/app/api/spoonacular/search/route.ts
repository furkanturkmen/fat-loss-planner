import { NextResponse } from "next/server";

const BASE = "https://api.spoonacular.com/recipes/complexSearch";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") || "";
  const cuisine = url.searchParams.get("cuisine") || "";
  const number = url.searchParams.get("number") || "12";
  const halalApprox = url.searchParams.get("halalApprox") === "true";
  const exclude = url.searchParams.get("exclude") || ""; // comma-separated
  const include = url.searchParams.get("include") || "";

  const key = process.env.SPOONACULAR_KEY;
  if (!key) return NextResponse.json({ error: "Missing SPOONACULAR_KEY" }, { status: 500 });

  // “Halal (approx)” exclusion list (expand any time)
  const halalExcludes = halalApprox
    ? [
        "pork","bacon","ham","prosciutto","pepperoni","salami","chorizo","mortadella","pancetta","lard",
        "wine","beer","rum","whiskey","vodka","brandy","gin","sake","vermouth","cognac","bourbon","baileys",
        "gelatin"
      ]
    : [];

  const excludeIngredients = [...new Set(
    [...(exclude ? exclude.split(",") : []), ...halalExcludes].map(s => s.trim()).filter(Boolean)
  )].join(",");

  const qs = new URLSearchParams({
    apiKey: key,
    query,
    cuisine, // comma-separated ok
    number,
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    instructionsRequired: "true",
    sort: "healthiness",
  });
  if (excludeIngredients) qs.set("excludeIngredients", excludeIngredients);
  if (include) qs.set("includeIngredients", include);

  const upstream = await fetch(`${BASE}?${qs.toString()}`, { cache: "no-store" });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
