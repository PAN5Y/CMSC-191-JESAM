import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ArticleComment } from "@/types";

export function useComments(manuscriptId: string | undefined) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!manuscriptId) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("article_comments")
      .select("*, profiles(full_name, role)")
      .eq("manuscript_id", manuscriptId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setComments((data ?? []) as ArticleComment[]);
    }
    setLoading(false);
  }, [manuscriptId]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  // Real-time subscription
  useEffect(() => {
    if (!manuscriptId) return;

    const channel = supabase
      .channel(`article_comments:${manuscriptId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "article_comments",
          filter: `manuscript_id=eq.${manuscriptId}`,
        },
        () => {
          void fetchComments();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [manuscriptId, fetchComments]);

  const addComment = useCallback(
    async (userId: string, content: string): Promise<boolean> => {
      if (!manuscriptId || !content.trim()) return false;

      const { error: insertError } = await supabase
        .from("article_comments")
        .insert({ manuscript_id: manuscriptId, user_id: userId, content: content.trim() });

      if (insertError) {
        setError(insertError.message);
        return false;
      }
      return true;
    },
    [manuscriptId]
  );

  const editComment = useCallback(
    async (commentId: string, content: string): Promise<boolean> => {
      const { error: updateError } = await supabase
        .from("article_comments")
        .update({ content: content.trim(), is_edited: true })
        .eq("id", commentId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }
      return true;
    },
    []
  );

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from("article_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    // Optimistic remove
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    return true;
  }, []);

  return { comments, loading, error, addComment, editComment, deleteComment, refetch: fetchComments };
}
