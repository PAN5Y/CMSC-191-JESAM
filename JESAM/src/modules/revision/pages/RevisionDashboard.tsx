import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import type { AutomatedCheckSnapshot } from "@/types";
import { RevisionAutomatedChecks } from "../components/RevisionAutomatedChecks";
import {
  intakeReturnedAuthorResubmitGoesToFormatQueue,
  manuscriptAwaitingEditorialReReviewAfterRevision,
  manuscriptHasRevisionUploads,
  manuscriptNeedsEditorToStartPostRevisionRound,
  manuscriptNeedsRevisionAction,
  useRevision,
} from "../hooks/useRevision";

const EDITOR_ROLES = new Set([
  "associate_editor",
  "managing_editor",
  "editor_in_chief",
  "system_admin",
]);

export default function RevisionDashboard() {
  const { role } = useAuth();
  const { manuscripts, submitRevision, grantExtension } = useRevision();
  const [selectedId, setSelectedId] = useState("");
  const [authorNote, setAuthorNote] = useState("");
  const [responseLetter, setResponseLetter] = useState("");
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionCheckResult, setRevisionCheckResult] = useState<{
    checks: AutomatedCheckSnapshot;
    pass: boolean;
    similarityScore: number;
  } | null>(null);
  const [extensionReason, setExtensionReason] = useState("");

  const onRevisionChecksResult = useCallback(
    (
      r: {
        checks: AutomatedCheckSnapshot;
        pass: boolean;
        similarityScore: number;
      } | null
    ) => {
      setRevisionCheckResult(r);
    },
    []
  );

  const selected = useMemo(
    () => manuscripts.find((m) => m.id === selectedId) ?? manuscripts[0],
    [manuscripts, selectedId]
  );

  const selectedNeedsAction = selected ? manuscriptNeedsRevisionAction(selected) : false;
  const selectedHasUploads = selected ? manuscriptHasRevisionUploads(selected) : false;
  const selectedPostRevisionPeerReview = selected
    ? manuscriptAwaitingEditorialReReviewAfterRevision(selected)
    : false;
  const isEditorialUser = role ? EDITOR_ROLES.has(role) : false;

  const revisionRounds = selected?.submission_metadata?.revision_cycle?.rounds ?? [];
  const extensionGrants = selected?.submission_metadata?.revision_extension_grants ?? [];
  const selectedIntakeFormatResubmit = selected
    ? intakeReturnedAuthorResubmitGoesToFormatQueue(selected)
    : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Revision Cycle</h1>
          <p className="text-gray-600 mt-1">
            Versioned author uploads and extensions. If you were returned during <strong>intake</strong> (format or
            EIC) before external review, your resubmitted file goes back to <strong>handling-editor format verification</strong>.
            After peer review has started, a new file returns to <strong>Peer Review</strong> for editorial coordination
            and recorded decisions.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Revision queue and history</h3>
          <p className="text-xs text-gray-500 mb-2">
            Action required while status is revision; after you submit, your uploads stay listed here for traceability.
          </p>
          <div className="space-y-2">
            {manuscripts.map((m) => {
              const needs = manuscriptNeedsRevisionAction(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left p-3 border rounded ${
                    (selected?.id ?? manuscripts[0]?.id) === m.id
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{m.reference_code ?? m.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{m.title}</p>
                  <p className="text-xs mt-1">
                    {needs ? (
                      <span className="text-amber-800 font-medium">Action required</span>
                    ) : (
                      <span className="text-gray-500">History · {m.status}</span>
                    )}
                  </p>
                </button>
              );
            })}
            {manuscripts.length === 0 && (
              <p className="text-sm text-gray-500">No revision activity yet for your account.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2 space-y-5">
          {!selected ? (
            <p className="text-sm text-gray-500">Select a manuscript to open revision actions.</p>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selected.title}</h2>
                <p className="text-sm text-gray-600">Current status: {selected.status}</p>
                {selectedPostRevisionPeerReview && (
                  <div className="text-sm text-gray-800 mt-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 space-y-2">
                    <p className="font-medium text-indigo-950">Next step: peer review (editorial handling)</p>
                    {selected && manuscriptNeedsEditorToStartPostRevisionRound(selected) && (
                      <p>
                        The manuscript is back in <strong>Peer Review</strong>, but the <em>same</em> review
                        round still shows the earlier <strong>revise</strong> decision. Editors must{" "}
                        <strong>start the next peer-review round</strong> when they want reviewers to evaluate
                        your new file (proposal §2.5)—that unlocks invitations for the new round.
                      </p>
                    )}
                    {selected &&
                      !manuscriptNeedsEditorToStartPostRevisionRound(selected) &&
                      selected.status === "Peer Review" && (
                        <p>
                          Editors have opened the next peer-review round. Reviewers will be invited for the
                          current file version; track progress from{" "}
                          <Link to="/author" className="font-medium underline underline-offset-2">
                            My submissions
                          </Link>
                          .
                        </p>
                      )}
                    <p>
                      Editorial staff coordinate structured reviews and record a human decision (accept,
                      revise again, reject, or additional reviewer)—not an automatic jump to acceptance or
                      production.
                    </p>
                    {role === "author" && (
                      <p className="text-indigo-900">
                        You will be notified when the desk needs another action. Track status from{" "}
                        <Link to="/author" className="font-medium underline underline-offset-2">
                          My submissions
                        </Link>
                        .
                      </p>
                    )}
                    {isEditorialUser && (
                      <p>
                        <Link
                          to="/peer-review"
                          className="font-medium text-indigo-800 underline underline-offset-2"
                        >
                          Open Peer Review workspace
                        </Link>{" "}
                        to start the post-revision round when appropriate, then invite reviewers and record a
                        decision when policy is met.
                      </p>
                    )}
                  </div>
                )}
                {!selectedNeedsAction && selectedHasUploads && !selectedPostRevisionPeerReview && (
                  <p className="text-sm text-gray-700 mt-2 rounded-md bg-slate-100 border border-slate-200 px-3 py-2">
                    Revision file(s) are on record. This manuscript is not currently in the peer-review stage
                    with a pending editorial round; use the submission queue or publication tools as appropriate
                    for its status ({selected.status}).
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Revision uploads (one row per file)</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Each version is stored when you upload a revised manuscript; extensions are listed separately.
                </p>
                <div className="space-y-2">
                  {revisionRounds.map((round) => (
                    <div key={round.id} className="border border-gray-200 rounded p-3">
                      <p className="text-sm font-medium text-gray-900">Revision {round.round}</p>
                      <p className="text-xs text-gray-600">{new Date(round.submittedAt).toLocaleString()}</p>
                      {round.fileUrl ? (
                        <a
                          href={round.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-700 hover:underline mt-1 inline-block"
                        >
                          Open revised manuscript file
                        </a>
                      ) : null}
                      <p className="text-sm text-gray-700 mt-1">{round.authorNote}</p>
                      {round.responseLetter ? (
                        <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap border-t border-gray-100 pt-2">
                          {round.responseLetter}
                        </p>
                      ) : null}
                      {round.extensionGranted && (
                        <p className="text-xs text-amber-700 mt-1">
                          Extension granted (legacy): {round.extensionReason ?? "No reason recorded"}
                        </p>
                      )}
                    </div>
                  ))}
                  {revisionRounds.length === 0 && (
                    <p className="text-sm text-gray-500">No revision upload recorded yet.</p>
                  )}
                </div>
              </div>

              {extensionGrants.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Deadline extensions</h3>
                  <ul className="space-y-2 text-sm">
                    {extensionGrants.map((g) => (
                      <li key={g.id} className="border border-amber-100 bg-amber-50/50 rounded p-3">
                        <p className="text-xs text-gray-600">{new Date(g.grantedAt).toLocaleString()}</p>
                        <p className="text-gray-800 mt-1">{g.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {role === "author" && selectedNeedsAction && selectedIntakeFormatResubmit && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                  <p className="font-medium">Intake resubmission</p>
                  <p className="mt-1 text-amber-900">
                    You have not yet entered external peer review for this manuscript. After you submit the revised
                    file and checks pass, it will return to the <strong>format verification</strong> queue—not directly
                    to reviewers.
                  </p>
                </div>
              )}

              {role === "author" && selectedNeedsAction && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Submit revised manuscript</h3>
                  <label className="block text-sm text-gray-700">
                    Revised manuscript file (PDF)
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="mt-1 block w-full text-sm text-gray-600"
                      onChange={(e) => {
                        setRevisionFile(e.target.files?.[0] ?? null);
                        setRevisionCheckResult(null);
                      }}
                    />
                  </label>
                  <RevisionAutomatedChecks
                    file={revisionFile}
                    manuscriptKey={selected.id}
                    onResult={onRevisionChecksResult}
                  />
                  <textarea
                    value={authorNote}
                    onChange={(e) => setAuthorNote(e.target.value)}
                    placeholder="Revision summary"
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <textarea
                    value={responseLetter}
                    onChange={(e) => setResponseLetter(e.target.value)}
                    placeholder="Response-to-reviewers letter (optional; can also attach in PDF only)"
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={
                      !authorNote.trim() ||
                      !revisionFile ||
                      !revisionCheckResult?.pass
                    }
                    onClick={() =>
                      void (async () => {
                        if (!revisionFile || !revisionCheckResult?.pass) return;
                        const ok = await submitRevision(selected, {
                          authorNote,
                          responseLetter: responseLetter.trim() || undefined,
                          file: revisionFile,
                          automatedChecks: revisionCheckResult.checks,
                          similarityScore: revisionCheckResult.similarityScore,
                        });
                        if (ok) {
                          setAuthorNote("");
                          setResponseLetter("");
                          setRevisionFile(null);
                          setRevisionCheckResult(null);
                        }
                      })()
                    }
                    className="px-4 py-2 bg-gray-900 text-white rounded disabled:opacity-50"
                  >
                    Submit revision
                  </button>
                </div>
              )}

              {(role === "associate_editor" || role === "managing_editor" || role === "editor_in_chief" || role === "system_admin") &&
                selectedNeedsAction && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Grant extension</h3>
                  <textarea
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="Reason for extension"
                    rows={2}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={!extensionReason.trim()}
                    onClick={() => void grantExtension(selected, extensionReason)}
                    className="px-4 py-2 bg-amber-600 text-white rounded disabled:opacity-50"
                  >
                    Grant extension
                  </button>
                </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
