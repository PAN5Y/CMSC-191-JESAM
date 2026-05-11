import { getGaSummary } from "./ga-summary-core.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const range = typeof req.query.range === "string" ? req.query.range : "30d";
    const summary = await getGaSummary(range, process.env);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(summary);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to read Google Analytics data",
    });
  }
}
