// scripts/migrate-mock-data.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 1. Initialize Supabase Client
// Replace these with your actual Supabase project URL and Service Role Key.
// IMPORTANT: Use the Service Role Key for migrations, not the public anon key, 
// to bypass Row Level Security (RLS) during the initial data load.

dotenv.config({ path: '.env.local' }); // Load your env variables

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using the powerful key
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Your Mock Data (Adapted slightly for the migration)
const initialManuscripts = [
    {
        id: "JESAM-2026-0405",
        title: "Carbon Sequestration Potential of Native Hardwood Species in the ASEAN Region",
        authors: ["Santos, M.A.", "Reyes, J.P.", "Nguyen, T.H."],
        abstract: "This study examines the carbon sequestration capacity of five native hardwood species across Southeast Asian forests, contributing to climate change mitigation strategies.",
        keywords: ["Carbon sequestration", "Hardwood species", "Climate change", "ASEAN forestry"],
        status: "ready_for_production", // Maps to 'Accepted' or 'In Production'
        classification: "Land",
        doi: "10.47125/jesam.2026.27.1.05",
        submittedDate: "2026-03-15",
        fileUploaded: true,
    },
    {
        id: "JESAM-2026-0398",
        title: "Microplastic Contamination in Coastal Waters of Manila Bay",
        authors: ["Garcia, L.M.", "Tan, S.Y."],
        abstract: "An assessment of microplastic pollution levels and sources in Manila Bay coastal ecosystems.",
        keywords: ["Microplastics", "Marine pollution", "Manila Bay"],
        status: "missing_doi", // Maps to 'Accepted'
        classification: "Water",
        submittedDate: "2026-03-10",
        fileUploaded: true,
    },
    {
        id: "JESAM-2026-0387",
        title: "Urban Heat Island Effect in Metro Manila: A Remote Sensing Approach",
        authors: ["Cruz, R.D.", "Lim, K.W.", "Fernandez, A.B."],
        abstract: "Using satellite imagery to analyze urban heat distribution patterns and mitigation opportunities.",
        keywords: ["Urban heat island", "Remote sensing", "Urban planning"],
        status: "published", // Maps to 'Published'
        classification: "Air",
        doi: "10.47125/jesam.2026.27.1.03",
        submittedDate: "2026-02-20",
        fileUploaded: true,
        metrics: {
            views: 342,
            downloads: 128,
            citations: 5,
            altmetric: 8.3,
        },
    },
    {
        id: "JESAM-2026-0412",
        title: "Biodiversity Assessment of Mangrove Ecosystems in Southern Philippines",
        authors: ["Reyes, M.C.", "Santos, D.L."],
        abstract: "Comprehensive survey of flora and fauna diversity in mangrove forests with conservation recommendations.",
        keywords: ["Biodiversity", "Mangroves", "Conservation", "Philippines"],
        status: "ready_for_production", // Maps to 'Accepted'
        classification: "People",
        submittedDate: "2026-03-22",
        fileUploaded: false,
    },
];

// 3. Helper Function to Map Status
// This maps your mock status strings to the standard Supabase schema we defined.
function mapStatus(mockStatus) {
    switch (mockStatus) {
        case 'published': return 'Published';
        case 'ready_for_production': return 'In Production';
        case 'missing_doi': return 'Accepted';
        case 'correction_pending': return 'Return to Revision';
        default: return 'Accepted';
    }
}

// 4. Migration Execution
async function migrateData() {
    console.log('Starting migration...');

    // Optionally pass an author's User ID to link these mock manuscripts to them
    const submitterId = process.argv[2] || null;
    if (submitterId) {
        console.log(`Linking manuscripts to submitter_id: ${submitterId}`);
    } else {
        console.log('No submitter_id provided. Manuscripts will be unassigned.');
    }

    for (const ms of initialManuscripts) {
        // Prepare the manuscript record
        const manuscriptRecord = {
            // Note: We are ignoring the 'JESAM-2026-0405' string ID here because 
            // the Supabase schema expects a UUID. Supabase will auto-generate it.
            submitter_id: submitterId,
            title: ms.title,
            abstract: ms.abstract,
            authors: ms.authors, // Supabase jsonb handles JS arrays automatically
            keywords: ms.keywords, // Supabase jsonb handles JS arrays automatically
            status: mapStatus(ms.status),
            doi: ms.doi || null,
            created_at: new Date(ms.submittedDate).toISOString(),
            published_at: ms.status === 'published' ? new Date().toISOString() : null,
            // You can add a 'classification' column to your Supabase schema if needed, 
            // or just rely on keywords.
        };

        // Insert Manuscript
        const { data: insertedManuscript, error: insertError } = await supabase
            .from('manuscripts')
            .insert([manuscriptRecord])
            .select() // Return the inserted row to get the generated UUID
            .single();

        if (insertError) {
            console.error(`Error inserting manuscript "${ms.title}":`, insertError);
            continue; // Skip to the next one
        }

        console.log(`Inserted manuscript: ${insertedManuscript.id}`);

        // If it has metrics, insert those using the newly generated UUID
        if (ms.metrics) {
            const metricsRecord = {
                manuscript_id: insertedManuscript.id, // Use the real UUID
                views: ms.metrics.views,
                downloads: ms.metrics.downloads,
                citations: ms.metrics.citations,
                // altmetric isn't in our base schema, but you could add it to the table
            };

            const { error: metricsError } = await supabase
                .from('article_metrics')
                .insert([metricsRecord]);

            if (metricsError) {
                console.error(`Error inserting metrics for ${insertedManuscript.id}:`, metricsError);
            } else {
                console.log(`Inserted metrics for: ${insertedManuscript.id}`);
            }
        }
    }
    console.log('Migration complete!');
}

migrateData();