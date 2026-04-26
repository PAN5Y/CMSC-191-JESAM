import {
  Globe,
  Archive,
  Share2,
  Database,
  Copy,
  Mail,
  ExternalLink,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Manuscript } from "../types";
import { downloadMetadataXML } from "@/lib/xml-export";

interface PostPublicationActionsProps {
  manuscript: Manuscript;
  onShowArticlePreview: () => void;
  onExportMetadata: () => void;
}

const UKDR_DEPOSIT_URL =
  "https://www.ukdr.uplb.edu.ph/do/email_editor/?context=jesam";

export default function PostPublicationActions({
  manuscript,
  onShowArticlePreview,
}: PostPublicationActionsProps) {
  const [checklist, setChecklist] = useState({
    socialMedia: false,
    emailBlast: false,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/article/public/${manuscript.id}`
    );
    toast.success("Article link copied to clipboard");
  };

  const generateDepositSummary = (): string => {
    return [
      `Title: ${manuscript.title}`,
      `Authors: ${manuscript.authors.join(", ")}`,
      `DOI: ${manuscript.doi || "N/A"}`,
      `Classification: ${manuscript.classification}`,
      `Published: ${manuscript.published_at || "Pending"}`,
      `Issue: ${manuscript.issue_assignment || "Online-First"}`,
      `Abstract: ${manuscript.abstract}`,
      `Keywords: ${manuscript.keywords.join(", ")}`,
    ].join("\n");
  };

  const handleCopyDepositSummary = () => {
    navigator.clipboard.writeText(generateDepositSummary());
    toast.success("Deposit summary copied to clipboard");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#e0e0e0] p-8">
      <div className="mb-6">
        <h3 className="font-['Newsreader',serif] text-[24px] text-[#1a1c1c] leading-[32px] mb-2">
          Post-Publication Actions
        </h3>
        <p className="text-sm text-[#6b7280] font-['Public_Sans',sans-serif] flex items-center gap-2">
          <span className="size-2 bg-[#2e7d32] rounded-full" />
          Article is live — manage dissemination and archival
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Public Article Page */}
        <button
          onClick={onShowArticlePreview}
          className="p-5 bg-gradient-to-br from-[#f5f5f5] to-white border border-[#e0e0e0] rounded-lg hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between mb-3">
            <Globe className="size-6 text-[#3f4b7e]" />
            <span className="text-[10px] uppercase tracking-wider text-[#2e7d32] font-['Public_Sans',sans-serif] bg-[#e8f5e9] px-2 py-1 rounded">
              LIVE
            </span>
          </div>
          <h4 className="font-['Newsreader',serif] text-[16px] text-[#1a1c1c] mb-2 group-hover:text-[#3f4b7e] transition-colors">
            Public Article Page →
          </h4>
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-3">
            View live article page with full text and metadata
          </p>
          <div className="text-xs font-['Public_Sans',sans-serif] text-[#3f4b7e] break-all">
            /article/public/{manuscript.id}
          </div>
        </button>

        {/* Repository Submission (UKDR) */}
        <div className="p-5 bg-gradient-to-br from-[#f5f5f5] to-white border border-[#e0e0e0] rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <Archive className="size-6 text-[#3f4b7e]" />
            <span className="text-[10px] uppercase tracking-wider text-[#f57c00] font-['Public_Sans',sans-serif] bg-[#fff8e1] px-2 py-1 rounded">
              MANUAL
            </span>
          </div>
          <h4 className="font-['Newsreader',serif] text-[16px] text-[#1a1c1c] mb-2">
            Assisted Manual Deposit
          </h4>
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-3">
            Go to UKDR to submit article to the institutional repository
          </p>
          <div className="space-y-2">
            <button
              onClick={handleCopyDepositSummary}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#f5f5f5] border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] transition-colors"
            >
              <Copy className="size-4" />
              Copy Metadata Summary
            </button>
            <a
              href={UKDR_DEPOSIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 bg-[#3f4b7e] hover:bg-[#3f4b7e]/90 text-white rounded text-sm font-['Public_Sans',sans-serif] transition-colors"
            >
              <ExternalLink className="size-4" />
              Open UKDR Deposit
            </a>
          </div>
        </div>

        {/* Dissemination Checklist */}
        <div className="p-5 bg-gradient-to-br from-[#fff8e1] to-white border border-[#F5C344] rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <Share2 className="size-6 text-[#F5C344]" />
            <span className="text-[10px] uppercase tracking-wider text-[#f57c00] font-['Public_Sans',sans-serif] bg-[#fff8e1] px-2 py-1 rounded">
              CHECKLIST
            </span>
          </div>
          <h4 className="font-['Newsreader',serif] text-[16px] text-[#1a1c1c] mb-3">
            Promotional Dissemination
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] cursor-pointer hover:bg-[#f5f5f5] transition-colors">
              <input
                type="checkbox"
                checked={checklist.socialMedia}
                onChange={(e) =>
                  setChecklist((c) => ({ ...c, socialMedia: e.target.checked }))
                }
                className="accent-[#F5C344]"
              />
              {checklist.socialMedia && <CheckCircle2 className="size-4 text-[#2e7d32]" />}
              Social Media blast posted
            </label>
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] cursor-pointer hover:bg-[#f5f5f5] transition-colors">
              <input
                type="checkbox"
                checked={checklist.emailBlast}
                onChange={(e) =>
                  setChecklist((c) => ({ ...c, emailBlast: e.target.checked }))
                }
                className="accent-[#F5C344]"
              />
              {checklist.emailBlast && <CheckCircle2 className="size-4 text-[#2e7d32]" />}
              Email announcement sent
            </label>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#f5f5f5] border border-[#e0e0e0] rounded text-sm font-['Public_Sans',sans-serif] text-[#1a1c1c] transition-colors"
            >
              <Copy className="size-4" />
              Copy Share Link
            </button>
          </div>
        </div>

        {/* Indexing Export */}
        <div className="p-5 bg-gradient-to-br from-[#e8eaf6] to-white border border-[#3f4b7e] rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <Database className="size-6 text-[#3f4b7e]" />
            <span className="text-[10px] uppercase tracking-wider text-[#3f4b7e] font-['Public_Sans',sans-serif] bg-[#e8eaf6] px-2 py-1 rounded">
              EXPORT
            </span>
          </div>
          <h4 className="font-['Newsreader',serif] text-[16px] text-[#1a1c1c] mb-3">
            Indexing Services Export
          </h4>
          <p className="text-xs text-[#6b7280] font-['Public_Sans',sans-serif] mb-3">
            Download XML metadata for indexing services
          </p>
          <button
            onClick={() => downloadMetadataXML(manuscript)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#3f4b7e] hover:bg-[#3f4b7e]/90 text-white rounded text-sm font-['Public_Sans',sans-serif] transition-colors"
          >
            <Download className="size-4" />
            Download XML
          </button>
          <div className="mt-2 flex gap-2 text-[10px] font-['Public_Sans',sans-serif] text-[#9e9e9e] justify-center">
            <span>Crossref</span>
            <span>•</span>
            <span>DOAJ</span>
            <span>•</span>
            <span>Scopus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
