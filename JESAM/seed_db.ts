import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// If anon fails, we'll try to insert using it anyway, or we can just mock the frontend temporarily.
// Let's use the actual DB.

async function seed() {
  const dummyArticles = [
    {
      title: "Coastal Water Quality Assessment using AI and Remote Sensing",
      abstract: "This study evaluates the coastal water quality using satellite imagery and machine learning models. We found significant correlations between spectral indices and actual pollutant concentrations.",
      authors: ["Dr. Jane Smith", "Mark Dela Cruz"],
      keywords: ["coastal", "AI", "remote sensing", "water quality"],
      classification: "Water",
      status: "Published",
      reference_code: "JESAM-2024-001",
      file_url: "https://example.com/dummy.pdf",
      issue_assignment: "Vol. 27 No. 1"
    },
    {
      title: "Impacts of Urbanization on Forest Ecology in the Philippines",
      abstract: "An analysis of urban sprawl and its effects on the biodiversity and ecological balance of surrounding forest reserves over the last two decades.",
      authors: ["Juan Perez", "Maria Santos"],
      keywords: ["forest ecology", "urbanization", "biodiversity"],
      classification: "Land",
      status: "Published",
      reference_code: "JESAM-2023-089",
      file_url: null,
      issue_assignment: "Vol. 26 No. 2"
    },
    {
      title: "Climate Policy Implementation in Coastal Communities",
      abstract: "Reviewing the effectiveness of local government climate policies and their reception by indigenous and coastal populations.",
      authors: ["Alex Reyes"],
      keywords: ["policy", "climate", "coastal"],
      classification: "People",
      status: "Published",
      reference_code: "JESAM-2023-042",
      file_url: "https://example.com/dummy2.pdf",
      issue_assignment: "Vol. 26 No. 1"
    }
  ];

  console.log("Inserting dummy articles...");
  for (const article of dummyArticles) {
    const { data, error } = await supabase
      .from("manuscripts")
      .insert([article]);
    if (error) {
      console.error("Error inserting", article.title, error);
    } else {
      console.log("Inserted:", article.title);
    }
  }
}

seed();
