import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, RotateCcw, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/components/ui/use-mobile";
import type { PublicArticleDetail } from "../types";
import {
  buildPublicArticleAssistantContext,
  buildPublicArticleAssistantShortcuts,
  buildPublicArticleAssistantWelcome,
  formatRelatedResultMeta,
} from "../queries/publicArticleAssistantContext";
import { usePublicArticleAssistantChat } from "../hooks/usePublicArticleAssistantChat";
import { ArticleAssistantComposer } from "./ArticleAssistantComposer";

interface ArticleAssistantPanelProps {
  article: PublicArticleDetail;
}

function ArticleAssistantMessages({
  articleId,
  articleTitle,
}: {
  articleId: string;
  articleTitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-[1.35rem] rounded-tl-sm border border-[#d8deef] bg-white px-4 py-3 shadow-sm">
        <p
          className="whitespace-pre-wrap text-sm leading-6 text-slate-700"
          style={{ fontFamily: "'Public Sans', sans-serif" }}
        >
          {articleTitle}
        </p>
      </div>
      <div className="rounded-[1.15rem] border border-[#ddd3c1] bg-[#fff8ea] px-4 py-3">
        <p
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5a3d]"
          style={{ fontFamily: "'Public Sans', sans-serif" }}
        >
          Related papers
        </p>
        <p
          className="mt-2 text-sm leading-6 text-slate-700"
          style={{ fontFamily: "'Public Sans', sans-serif" }}
        >
          No related public JESAM papers are attached to this message.
        </p>
      </div>
      <Button asChild variant="outline" className="w-fit">
        <a href={`/journals/articles/${articleId}`}>Open article</a>
      </Button>
    </div>
  );
}

export function ArticleAssistantPanel({ article }: ArticleAssistantPanelProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const canUseAssistant = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const contextualPrompt = useMemo(
    () => buildPublicArticleAssistantContext(article),
    [article]
  );
  const welcomeMessage = useMemo(
    () => buildPublicArticleAssistantWelcome(article),
    [article]
  );
  const shortcuts = useMemo(
    () => buildPublicArticleAssistantShortcuts(article),
    [article]
  );

  const { messages, isLoading, sendMessage, clearChat } =
    usePublicArticleAssistantChat({
      articleId: article.id,
      contextualPrompt,
      welcomeMessage,
    });

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const surface = (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,#f9fbff_0%,#f3ede2_100%)]">
      <div className="border-b border-[#d8deef] bg-white/94 px-5 py-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5a3d]">
              Article Assistant
            </p>
            <h3 className="font-['Newsreader',serif] text-2xl text-[#1d2548]">
              Ask about this article
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Uses only the public article details on this page and public JESAM archive results.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-[#d8deef] bg-[#f8faff] px-3 py-3">
            <p className="mr-auto text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Assistant controls
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-[#d8deef] bg-white"
              onClick={() => clearChat()}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
            {isMobile ? (
              <Button
                type="button"
                variant="outline"
                className="border-[#d8deef] bg-white"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            ) : (
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#d8deef] bg-white"
                >
                  Close
                </Button>
              </SheetClose>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="rounded-[1.2rem] border border-[#ddd3c1] bg-[#fff8ea] px-4 py-3 text-sm leading-6 text-[#5f4d31]">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="size-4" />
            Public-safe guidance only
          </div>
          <p className="mt-2">
            This assistant is assistive, not authoritative. It does not use hidden editorial data or unpublished content.
          </p>
        </div>
      </div>

      {!canUseAssistant ? (
        <div className="px-5 py-5">
          <div className="rounded-[1.4rem] border border-[#d8deef] bg-white px-4 py-4 shadow-sm">
            <p className="font-['Newsreader',serif] text-xl text-[#1d2548]">
              Assistant unavailable
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The article assistant is not configured in this environment right now. The rest of the article page remains fully available.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="px-5 pt-4">
            <div className="flex flex-wrap gap-2">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessage(shortcut.prompt)}
                  className="rounded-full border border-[#d8deef] bg-white px-3 py-1.5 text-xs font-medium text-[#24315f] transition hover:border-[#bcc8e3] hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              {messages.map((message) =>
                message.role === "assistant" ? (
                  <div key={message.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#24315f] text-white">
                        <Bot className="size-4" />
                      </div>
                      <div className="max-w-[92%] rounded-[1.4rem] rounded-tl-sm border border-[#d8deef] bg-white px-4 py-3 shadow-sm">
                        <p
                          className="whitespace-pre-wrap text-sm leading-6 text-slate-700"
                          style={{ fontFamily: "'Public Sans', sans-serif" }}
                        >
                          {message.text}
                        </p>
                        {message.isStreaming ? (
                          <div className="mt-2 flex items-center gap-1.5 text-slate-400">
                            <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {message.relatedResults && message.relatedResults.length > 0 ? (
                      <div className="ml-11 rounded-[1.2rem] border border-[#ddd3c1] bg-[#fff8ea] px-4 py-4">
                        <div className="flex items-center gap-2 text-[#6a5a3d]">
                          <Search className="size-4" />
                          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                            Related papers
                          </p>
                        </div>
                        <div className="mt-3 space-y-3">
                          {message.relatedResults.map((result) => (
                            <Link
                              key={result.articleId}
                              to={`/journals/articles/${result.articleId}`}
                              state={{
                                returnTo: `/journals/articles/${article.id}`,
                                returnLabel: "Back to Article",
                                journalId: result.journalId,
                                journalTitle: result.journalTitle,
                              }}
                              className="block rounded-[1rem] border border-[#e6dcc8] bg-white px-3 py-3 transition hover:border-[#cbb991] hover:shadow-sm"
                            >
                              <p className="font-['Newsreader',serif] text-lg text-[#1d2548]">
                                {result.title}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#6a5a3d]">
                                {formatRelatedResultMeta(result)}
                              </p>
                              {result.abstractExcerpt ? (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {result.abstractExcerpt}
                                </p>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[82%] rounded-[1.4rem] rounded-br-sm bg-[#24315f] px-4 py-3 text-white shadow-sm">
                      <p
                        className="whitespace-pre-wrap text-sm leading-6"
                        style={{ fontFamily: "'Public Sans', sans-serif" }}
                      >
                        {message.text}
                      </p>
                    </div>
                  </div>
                )
              )}
              <div ref={scrollAnchorRef} />
            </div>
          </div>

          <ArticleAssistantComposer onSend={sendMessage} isLoading={isLoading} />
        </>
      )}
    </div>
  );

  return (
    <>
      <Card className="border-[#dce3f3] bg-[linear-gradient(180deg,#ffffff,#eef3ff)] shadow-[0_18px_44px_rgba(36,49,95,0.08)]">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2 text-[#24315f]">
            <Sparkles className="size-4" />
            <p className="text-sm font-medium uppercase tracking-[0.18em]">
              Article Assistant
            </p>
          </div>
          <CardTitle className="font-['Newsreader',serif] text-2xl text-[#24315f]">
            Ask about this article
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600">
            Open a bounded assistant for this paper. It stays inside the public article flow and only uses public-safe context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            className="w-full bg-[#24315f] text-white hover:bg-[#1d2548]"
            onClick={() => setOpen(true)}
          >
            <Bot className="size-4" />
            Ask about this article
          </Button>
          <p className="text-xs leading-5 text-slate-500">
            Best for clarifying the abstract, summary, keywords, or finding related public JESAM papers.
          </p>
        </CardContent>
      </Card>

      {isMobile ? (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[88vh] border-[#d8deef]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Article Assistant</DrawerTitle>
              <DrawerDescription>Ask about this article.</DrawerDescription>
            </DrawerHeader>
            {surface}
            <div className="border-t border-[#d8deef] px-4 py-3">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="w-full">
                  Close assistant
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-full border-l border-[#d8deef] p-0 sm:max-w-[26rem] [&_[data-slot=sheet-close]]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Article Assistant</SheetTitle>
              <SheetDescription>Ask about this article.</SheetDescription>
            </SheetHeader>
            {surface}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
