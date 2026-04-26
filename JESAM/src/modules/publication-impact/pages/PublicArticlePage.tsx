import { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  Download,
  Calendar,
  Tag,
  Users as UsersIcon,
  Globe,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Manuscript } from "../types";

export default function PublicArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from("manuscripts")
        .select("*, metrics:article_metrics(*)")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("Article not found");
      } else {
        setManuscript({
          ...data,
          metrics: Array.isArray(data.metrics)
            ? data.metrics[0] || null
            : data.metrics,
        } as Manuscript);
      }
      setLoading(false);
    }

    fetchArticle();
  }, [id]);

  const handleDownload = async () => {
    if (!manuscript?.file_url || !id) return;

    // Increment download counter
    const { data: current } = await supabase
      .from("article_metrics")
      .select("downloads")
      .eq("manuscript_id", id)
      .single();

    if (current) {
      await supabase
        .from("article_metrics")
        .update({ downloads: (current.downloads || 0) + 1 })
        .eq("manuscript_id", id);
    }

    // Open PDF
    window.open(manuscript.file_url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="size-8 border-3 border-[#3f4b7e]/20 border-t-[#3f4b7e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            Loading article...
          </p>
        </div>
      </div>
    );
  }

  if (error || !manuscript) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="size-16 text-[#9e9e9e] mx-auto mb-4" />
          <h1 className="font-['Newsreader',serif] text-[28px] text-[#1a1c1c] mb-2">
            Article Not Found
          </h1>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif]">
            The article you're looking for does not exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header Bar */}
      <header className="bg-[#3f4b7e] text-white">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="size-5 text-[#F5C344]" />
            <span className="text-xs text-white/60 uppercase tracking-wider font-['Public_Sans',sans-serif]">
              Journal of Environmental Science and Management
            </span>
          </div>
          <h1 className="font-['Newsreader',serif] text-[32px] leading-[40px]">
            {manuscript.title}
          </h1>
          <p className="text-white/70 font-['Newsreader',serif] italic text-[18px] mt-2">
            {manuscript.authors.join(", ")}
          </p>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        {/* Metadata Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {manuscript.doi && (
              <div className="flex items-start gap-2">
                <Tag className="size-4 text-[#3f4b7e] mt-0.5" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                    DOI
                  </div>
                  <a
                    href={`https://doi.org/${manuscript.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#3f4b7e] font-['Public_Sans',sans-serif] hover:underline"
                  >
                    {manuscript.doi}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="size-4 text-[#3f4b7e] mt-0.5" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                  Published
                </div>
                <div className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                  {manuscript.published_at
                    ? new Date(manuscript.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Pending"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <UsersIcon className="size-4 text-[#3f4b7e] mt-0.5" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                  Classification
                </div>
                <div className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                  {manuscript.classification}
                </div>
              </div>
            </div>
            {manuscript.metrics && (
              <div className="flex items-start gap-2">
                <Download className="size-4 text-[#3f4b7e] mt-0.5" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-['Public_Sans',sans-serif]">
                    Downloads
                  </div>
                  <div className="text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif]">
                    {manuscript.metrics.downloads.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Abstract */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6 mb-6">
          <h2 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c] mb-4">
            Abstract
          </h2>
          <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] leading-relaxed">
            {manuscript.abstract}
          </p>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-6 mb-6">
          <h2 className="font-['Newsreader',serif] text-[20px] text-[#1a1c1c] mb-4">
            Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {manuscript.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-[#f5f5f5] text-sm text-[#1a1c1c] font-['Public_Sans',sans-serif] rounded-full border border-[#e0e0e0]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Download Button */}
        {manuscript.file_url && (
          <div className="bg-gradient-to-r from-[#3f4b7e] to-[#5a67a3] rounded-lg shadow-lg p-8 text-center">
            <Download className="size-12 text-white/40 mx-auto mb-4" />
            <h3 className="font-['Newsreader',serif] text-[24px] text-white mb-2">
              Full Article (PDF)
            </h3>
            <p className="text-white/70 font-['Public_Sans',sans-serif] text-sm mb-6">
              Download the complete article in PDF format
            </p>
            <button
              onClick={handleDownload}
              className="px-8 py-3 bg-[#F5C344] text-[#3f4b7e] font-['Public_Sans',sans-serif] font-medium rounded-lg hover:bg-[#F5C344]/90 transition-all hover:scale-105 shadow-lg"
            >
              Download PDF
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-[#9e9e9e] font-['Public_Sans',sans-serif]">
          <p>
            © {new Date().getFullYear()} Journal of Environmental Science and
            Management
          </p>
          <p>
            University of the Philippines Los Baños · School of Environmental
            Science and Management
          </p>
        </footer>
      </main>
    </div>
  );
}
