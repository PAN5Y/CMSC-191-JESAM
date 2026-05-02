interface ManuscriptPdfViewerProps {
  fileUrl?: string | null;
  title?: string;
  className?: string;
}

const isPdfUrl = (value: string) => {
  const base = value.split("?")[0]?.toLowerCase() ?? "";
  return base.endsWith(".pdf");
};

const ManuscriptPdfViewer = ({
  fileUrl,
  title = "Manuscript file",
  className,
}: ManuscriptPdfViewerProps) => {
  if (!fileUrl) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-4 text-sm text-muted-foreground">
          No manuscript file uploaded yet.
        </div>
      </div>
    );
  }

  if (!isPdfUrl(fileUrl)) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Embedded preview is available for PDF files only.</p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-amber-900 underline"
          >
            Open uploaded manuscript in a new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          Open in new tab
        </a>
      </div>
      <iframe
        title={title}
        src={fileUrl}
        className="h-[520px] w-full rounded-md border border-border bg-background"
      />
    </div>
  );
};

export default ManuscriptPdfViewer;
