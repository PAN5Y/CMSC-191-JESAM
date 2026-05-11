export type PublicRecoveryStateKind =
  | "journal-listing"
  | "article-search"
  | "journal-detail"
  | "article-detail";

export function getPublicRecoveryCopy(kind: PublicRecoveryStateKind) {
  switch (kind) {
    case "journal-listing":
      return {
        title: "Public journals could not be loaded",
        description:
          "The listing is temporarily unavailable. You can retry the request without leaving the public dashboard.",
        primaryActionLabel: "Retry Listing",
      };
    case "article-search":
      return {
        title: "Search results could not be loaded",
        description:
          "You can still browse the journals below, but this search could not be completed right now.",
        primaryActionLabel: "Retry Search",
      };
    case "journal-detail":
      return {
        title: "Journal detail could not be loaded",
        description:
          "The journal page is temporarily unavailable. You can retry the request or return to the public journal listing.",
        primaryActionLabel: "Retry Detail",
      };
    case "article-detail":
      return {
        title: "Paper details could not be loaded",
        description:
          "The paper page is temporarily unavailable. You can retry the request or return to the public browse flow.",
        primaryActionLabel: "Retry Detail",
      };
  }
}
