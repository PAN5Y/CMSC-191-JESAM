export interface PublicArticleDownloadAttemptResult {
  ok: boolean;
  message: string;
}

function buildDownloadRequestUrl(downloadUrl: string) {
  const url = new URL(downloadUrl);

  if (!url.searchParams.has("download")) {
    url.searchParams.set("download", "1");
  }

  return url.toString();
}

export async function attemptPublicArticleDownload(
  downloadUrl: string
): Promise<PublicArticleDownloadAttemptResult> {
  const requestUrl = buildDownloadRequestUrl(downloadUrl);

  try {
    const response = await fetch(requestUrl, { method: "HEAD" });

    if (!response.ok) {
      return {
        ok: false,
        message:
          "The public file could not be reached right now. Please try the download again in a moment.",
      };
    }

    const anchor = document.createElement("a");
    anchor.href = requestUrl;
    anchor.rel = "noopener noreferrer";
    anchor.download = "";
    anchor.click();

    return {
      ok: true,
      message: "Download started.",
    };
  } catch {
    return {
      ok: false,
      message:
        "The public file could not be reached right now. Please try the download again in a moment.",
    };
  }
}
