import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase.from("manuscripts").select("id, title, status");
  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  console.log("Total manuscripts:", data?.length);
  const published = data?.filter(d => d.status === "Published") || [];
  console.log("Published manuscripts:", published.length);
  
  if (data && data.length > 0) {
    const statuses = new Set(data.map(d => d.status));
    console.log("Unique statuses found in DB:", Array.from(statuses));
  }
}

check();
