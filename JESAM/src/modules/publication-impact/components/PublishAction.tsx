import { useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Mail, Share2, FileCode2 } from "lucide-react";
import type { Manuscript } from "../types";
import type { ReadinessStatus } from "../types";
import { downloadMetadataXML } from "@/lib/xml-export";

interface PublishActionProps {
  manuscript: Manuscript;
  isPublished: boolean;
  readiness: ReadinessStatus;
  onPublish: () => Promise<boolean>;
}

const UKDR_DEPOSIT_URL =
  "https://www.ukdr.uplb.edu.ph/do/email_editor/?context=jesam";

export default function PublishAction({
  manuscript,
  isPublished,
  readiness,
  onPublish,
}: PublishActionProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishComplete, setPublishComplete] = useState(isPublished);
  const [checklist, setChecklist] = useState({
    socialMedia: false,
    emailBlast: false,
  });

  const handlePublish = async () => {
    setIsPublishing(true);

    // Execute all 4 parallel publish actions
    const [publishResult] = await Promise.all([
      // 1. Update manuscript status to Published
      onPublish(),

      // 2. Open UKDR deposit link in new tab (Assisted Manual Deposit)
      new Promise<void>((resolve) => {
        window.open(UKDR_DEPOSIT_URL, "_blank");
        resolve();
      }),

      // 3. Download XML metadata for indexing services
      new Promise<void>((resolve) => {
        downloadMetadataXML(manuscript);
        resolve();
      }),
    ]);

    setIsPublishing(false);

    if (publishResult) {
      setPublishComplete(true);
    }
  };

  // Published state — show summary card
  if (publishComplete) {
    return (
      <div className="bg-gradient-to-r from-[#2e7d32] to-[#43a047] rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-['Newsreader',serif] text-[28px] leading-[36px] mb-2">
              ✓ Article Published
            </h3>
            <p className="text-white/80 font-['Public_Sans',sans-serif]">
              Article is live. Complete the dissemination checklist below.
            </p>
          </div>
          <CheckCircle2 className="size-12 text-white/40" />
        </div>

        {/* Post-publish dissemination checklist */}
        <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm space-y-3">
          <h4 className="text-sm font-['Public_Sans',sans-serif] font-medium mb-3">
            Dissemination Checklist
          </h4>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checklist.socialMedia}
              onChange={(e) =>
                setChecklist((c) => ({ ...c, socialMedia: e.target.checked }))
              }
              className="size-4 accent-[#F5C344] rounded"
            />
            <Share2 className="size-4 text-white/80" />
            <span className="text-sm font-['Public_Sans',sans-serif]">
              Social Media promotional blast posted
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checklist.emailBlast}
              onChange={(e) =>
                setChecklist((c) => ({ ...c, emailBlast: e.target.checked }))
              }
              className="size-4 accent-[#F5C344] rounded"
            />
            <Mail className="size-4 text-white/80" />
            <span className="text-sm font-['Public_Sans',sans-serif]">
              Email announcement sent to subscribers
            </span>
          </label>
        </div>

        {/* Links to parallel outputs */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <a
            href={UKDR_DEPOSIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-lg text-sm font-['Public_Sans',sans-serif] hover:bg-white/20 transition-colors"
          >
            <ExternalLink className="size-4" />
            UKDR Deposit Page
          </a>
          <button
            onClick={() => downloadMetadataXML(manuscript)}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-lg text-sm font-['Public_Sans',sans-serif] hover:bg-white/20 transition-colors"
          >
            <FileCode2 className="size-4" />
            Download XML Again
          </button>
        </div>
      </div>
    );
  }

  // Pre-publish state
  return (
    <div className="bg-gradient-to-r from-[#3f4b7e] to-[#5a67a3] rounded-lg shadow-lg p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-['Newsreader',serif] text-[28px] leading-[36px] mb-2">
            Ready to Publish
          </h3>
          <p className="text-white/80 font-['Public_Sans',sans-serif]">
            {readiness.isReady
              ? "All requirements met — Click to publish"
              : "Complete all requirements above to enable publication"}
          </p>
          {readiness.isReady && (
            <p className="text-white/60 font-['Public_Sans',sans-serif] text-xs mt-2">
              Publishing will: update status, open UKDR deposit, and download XML metadata
            </p>
          )}
        </div>
        <button
          onClick={handlePublish}
          disabled={!readiness.isReady || isPublishing}
          className={`px-8 py-4 rounded-lg font-['Public_Sans',sans-serif] text-[18px] transition-all ${
            !readiness.isReady
              ? "bg-white/20 text-white/60 cursor-not-allowed"
              : "bg-[#F5C344] text-[#3f4b7e] hover:bg-[#F5C344]/90 shadow-xl cursor-pointer hover:scale-105"
          }`}
        >
          {isPublishing ? (
            <span className="flex items-center gap-2">
              <div className="size-5 border-2 border-[#3f4b7e]/30 border-t-[#3f4b7e] rounded-full animate-spin" />
              Publishing...
            </span>
          ) : (
            "Publish Article"
          )}
        </button>
      </div>
      {!readiness.isReady && (
        <div className="mt-4 p-4 bg-white/10 rounded backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-white/90 mt-0.5" />
            <div className="text-sm text-white/90 font-['Public_Sans',sans-serif]">
              <strong>Actions required:</strong> Please complete all items in
              the Pre-Publication Checklist above.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
