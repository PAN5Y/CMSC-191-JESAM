import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env or .env.local"
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const seededPublicArticles = [
  {
    title: "Climate Resilience Planning for Upland Farming Communities",
    authors: ["Santos, M.A.", "Reyes, J.P.", "Navarro, C.L."],
    abstract:
      "This paper evaluates how upland farming communities adapt to rainfall variability through diversified cropping, localized forecasting, and cooperative planning. The findings highlight practical resilience measures that can be scaled through regional policy support.",
    keywords: ["climate resilience", "upland farming", "adaptation", "policy"],
    status: "Published",
    classification: "Land",
    doi: "10.47125/jesam.2026.27.1.01",
    issue_assignment: "Volume 27 Issue 1",
    created_at: "2026-01-12T08:30:00.000Z",
    published_at: "2026-02-18T09:00:00.000Z",
    metrics: {
      views: 186,
      downloads: 74,
      citations: 3,
    },
  },
  {
    title: "Microplastic Pathways Across Estuarine Water Systems in Luzon",
    authors: ["Garcia, L.M.", "Tan, S.Y.", "David, P.R."],
    abstract:
      "The study traces microplastic transport across estuarine systems in Luzon using seasonal sampling and sediment comparison. Results show recurring hotspots near urban discharge corridors and identify monitoring priorities for coastal management.",
    keywords: ["microplastics", "estuaries", "water quality", "Luzon"],
    status: "Published",
    classification: "Water",
    doi: "10.47125/jesam.2026.27.1.02",
    issue_assignment: "Volume 27 Issue 1",
    created_at: "2026-01-18T10:15:00.000Z",
    published_at: "2026-02-20T09:00:00.000Z",
    metrics: {
      views: 241,
      downloads: 102,
      citations: 6,
    },
  },
  {
    title: "Urban Heat Exposure Mapping Near Public School Corridors",
    authors: ["Cruz, R.D.", "Lim, K.W.", "Fernandez, A.B."],
    abstract:
      "Using remote sensing and field validation, this article maps heat exposure around public school corridors in Metro Manila. The paper identifies high-risk time windows and recommends low-cost shading and ventilation interventions.",
    keywords: ["urban heat", "remote sensing", "schools", "air"],
    status: "Published",
    classification: "Air",
    doi: "10.47125/jesam.2026.27.1.03",
    issue_assignment: "Volume 27 Issue 1",
    created_at: "2026-01-25T07:45:00.000Z",
    published_at: "2026-02-25T09:00:00.000Z",
    metrics: {
      views: 319,
      downloads: 128,
      citations: 8,
    },
  },
  {
    title: "Community Waste Segregation Behavior in Flood-Prone Barangays",
    authors: ["Villanueva, E.P.", "Lopez, R.M."],
    abstract:
      "This article examines how household waste segregation behavior changes in flood-prone barangays when local ordinances, peer influence, and collection reliability vary across communities. The findings emphasize governance and trust as major determinants of environmental participation.",
    keywords: ["communities", "waste management", "governance", "behavior"],
    status: "Published",
    classification: "People",
    doi: "10.47125/jesam.2026.27.1.04",
    issue_assignment: "Volume 27 Issue 1",
    created_at: "2026-01-29T11:00:00.000Z",
    published_at: "2026-02-28T09:00:00.000Z",
    metrics: {
      views: 167,
      downloads: 59,
      citations: 2,
    },
  },
];

async function getExistingManuscriptByTitle(title) {
  const { data, error } = await supabase
    .from("manuscripts")
    .select("id, title, doi")
    .eq("title", title)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getExistingManuscriptByDoi(doi) {
  if (!doi) {
    return null;
  }

  const { data, error } = await supabase
    .from("manuscripts")
    .select("id, title, doi")
    .eq("doi", doi)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function findExistingManuscript(article) {
  const [titleMatch, doiMatch] = await Promise.all([
    getExistingManuscriptByTitle(article.title),
    getExistingManuscriptByDoi(article.doi),
  ]);

  if (titleMatch && doiMatch && titleMatch.id !== doiMatch.id) {
    throw new Error(
      `Conflicting manuscript matches for "${article.title}" and DOI "${article.doi}".`
    );
  }

  if (doiMatch) {
    return doiMatch;
  }

  if (titleMatch) {
    return titleMatch;
  }

  return null;
}

async function ensureMetricsRow(manuscriptId, metrics) {
  const { data: existingMetrics, error: metricsFetchError } = await supabase
    .from("article_metrics")
    .select("id")
    .eq("manuscript_id", manuscriptId)
    .limit(1)
    .maybeSingle();

  if (metricsFetchError) {
    throw metricsFetchError;
  }

  if (existingMetrics) {
    const { error: metricsUpdateError } = await supabase
      .from("article_metrics")
      .update(metrics)
      .eq("manuscript_id", manuscriptId);

    if (metricsUpdateError) {
      throw metricsUpdateError;
    }

    return "updated";
  }

  const { error: metricsInsertError } = await supabase
    .from("article_metrics")
    .insert([{ manuscript_id: manuscriptId, ...metrics }]);

  if (metricsInsertError) {
    throw metricsInsertError;
  }

  return "inserted";
}

async function seedPublicArchive() {
  console.log("Seeding public journals demo data...");

  for (const article of seededPublicArticles) {
    const existing = await findExistingManuscript(article);
    let manuscriptId = existing?.id;

    if (!manuscriptId) {
      const { data: insertedManuscript, error: insertError } = await supabase
        .from("manuscripts")
        .insert([
          {
            title: article.title,
            authors: article.authors,
            abstract: article.abstract,
            keywords: article.keywords,
            status: article.status,
            classification: article.classification,
            doi: article.doi,
            issue_assignment: article.issue_assignment,
            created_at: article.created_at,
            published_at: article.published_at,
          },
        ])
        .select("id")
        .single();

      if (insertError || !insertedManuscript) {
        throw insertError ?? new Error(`Failed to insert ${article.title}`);
      }

      manuscriptId = insertedManuscript.id;
      console.log(`Inserted manuscript: ${article.title}`);
    } else {
      const { error: updateError } = await supabase
        .from("manuscripts")
        .update({
          authors: article.authors,
          abstract: article.abstract,
          keywords: article.keywords,
          status: article.status,
          classification: article.classification,
          doi: article.doi,
          issue_assignment: article.issue_assignment,
          published_at: article.published_at,
        })
        .eq("id", manuscriptId);

      if (updateError) {
        throw updateError;
      }

      console.log(`Updated manuscript: ${article.title}`);
    }

    const metricsResult = await ensureMetricsRow(manuscriptId, article.metrics);
    console.log(`${metricsResult} metrics: ${article.title}`);
  }

  console.log("Public journals demo data ready.");
}

seedPublicArchive().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
