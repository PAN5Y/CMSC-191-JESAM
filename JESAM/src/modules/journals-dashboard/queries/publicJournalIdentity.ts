export function derivePublicJournalIdentity(
  journalId: string,
  journalTitle?: string | null,
  journalDescription?: string,
  institution?: string,
  issn?: string | null,
  accessLabel?: string
) {
  return {
    id: journalId,
    title:
      journalTitle?.trim() ||
      "Journal of Environmental Science and Management",
    description:
      journalDescription?.trim() ||
      "Public archive of JESAM-published environmental research with journal-level context for readers before they move into article detail.",
    institution:
      institution?.trim() ||
      "University of the Philippines Los Banos - School of Environmental Science and Management",
    issn: issn ?? null,
    accessLabel:
      accessLabel?.trim() || "Public metadata / downloadable papers vary by article",
  };
}
