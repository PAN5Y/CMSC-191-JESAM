import { useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Pencil, Trash2, Send, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useComments } from "../hooks/useComments";
import type { ArticleComment } from "@/types";

interface ArticleCommentsProps {
  manuscriptId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CommentItem({
  comment,
  currentUserId,
  onEdit,
  onDelete,
}: {
  comment: ArticleComment;
  currentUserId: string | undefined;
  onEdit: (comment: ArticleComment) => void;
  onDelete: (id: string) => void;
}) {
  const isOwner = currentUserId === comment.user_id;
  const displayName = comment.profiles?.full_name ?? "Anonymous";
  const role = comment.profiles?.role ?? "";

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="size-9 rounded-full bg-[#3f4b7e] text-white flex items-center justify-center text-xs font-semibold shrink-0 font-['Public_Sans',sans-serif]">
        {getInitials(displayName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 font-['Public_Sans',sans-serif]">
            {displayName}
          </span>
          {role && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e8eaf6] text-[#3f4b7e] font-['Public_Sans',sans-serif] uppercase tracking-wide">
              {role.replace(/_/g, " ")}
            </span>
          )}
          <span className="text-xs text-gray-400 font-['Public_Sans',sans-serif]">
            {timeAgo(comment.created_at)}
            {comment.is_edited && " · edited"}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1 leading-relaxed font-['Public_Sans',sans-serif] whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start mt-0.5">
          <button
            onClick={() => onEdit(comment)}
            className="p-1.5 text-gray-400 hover:text-[#3f4b7e] rounded hover:bg-[#e8eaf6] transition-colors"
            title="Edit comment"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(comment.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            title="Delete comment"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArticleComments({ manuscriptId }: ArticleCommentsProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, editComment, deleteComment } = useComments(manuscriptId);

  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<ArticleComment | null>(null);
  const [editText, setEditText] = useState("");

  const handleSubmit = async () => {
    if (!user || !newText.trim()) return;
    setSubmitting(true);
    const success = await addComment(user.id, newText);
    if (success) setNewText("");
    setSubmitting(false);
  };

  const handleEditSave = async () => {
    if (!editingComment || !editText.trim()) return;
    setSubmitting(true);
    await editComment(editingComment.id, editText);
    setEditingComment(null);
    setEditText("");
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    await deleteComment(id);
  };

  const startEdit = (comment: ArticleComment) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="size-5 text-[#3f4b7e]" />
        <h2 className="font-['Newsreader',serif] text-[20px] text-gray-900">
          Discussion
        </h2>
        {comments.length > 0 && (
          <span className="ml-auto text-sm text-gray-400 font-['Public_Sans',sans-serif]">
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Comments list */}
      <div className="space-y-5 mb-6">
        {loading && (
          <p className="text-sm text-gray-400 font-['Public_Sans',sans-serif]">
            Loading comments…
          </p>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-sm text-gray-400 font-['Public_Sans',sans-serif] text-center py-4">
            No comments yet. Be the first to start the discussion.
          </p>
        )}

        {comments.map((comment) =>
          editingComment?.id === comment.id ? (
            /* Inline edit form */
            <div key={comment.id} className="flex gap-3">
              <div className="size-9 rounded-full bg-[#3f4b7e] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {getInitials(comment.profiles?.full_name ?? "?")}
              </div>
              <div className="flex-1">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-['Public_Sans',sans-serif] focus:outline-none focus:ring-2 focus:ring-[#3f4b7e]/30 focus:border-[#3f4b7e] resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    disabled={submitting || !editText.trim()}
                    onClick={handleEditSave}
                    className="px-3 py-1.5 bg-[#3f4b7e] text-white text-xs rounded font-['Public_Sans',sans-serif] hover:bg-[#3f4b7e]/90 disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingComment(null); setEditText(""); }}
                    className="px-3 py-1.5 text-xs text-gray-500 rounded hover:bg-gray-100 font-['Public_Sans',sans-serif] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          )
        )}
      </div>

      {/* Input area / guest prompt */}
      {user ? (
        <div className="border-t border-gray-100 pt-5">
          <div className="flex gap-3">
            <div className="size-9 rounded-full bg-[#F5C344] text-[#3f4b7e] flex items-center justify-center text-xs font-bold shrink-0 font-['Public_Sans',sans-serif]">
              {getInitials(user.email ?? "U")}
            </div>
            <div className="flex-1">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    void handleSubmit();
                  }
                }}
                placeholder="Share your thoughts on this article…"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-['Public_Sans',sans-serif] focus:outline-none focus:ring-2 focus:ring-[#3f4b7e]/30 focus:border-[#3f4b7e] resize-none placeholder:text-gray-400"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-gray-400 font-['Public_Sans',sans-serif]">
                  Cmd+Enter to submit
                </span>
                <button
                  disabled={submitting || !newText.trim()}
                  onClick={() => void handleSubmit()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#3f4b7e] text-white text-sm font-['Public_Sans',sans-serif] rounded-lg hover:bg-[#3f4b7e]/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="size-3.5" />
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between p-4 bg-[#f5f7ff] rounded-lg border border-[#e8eaf6]">
            <p className="text-sm text-gray-600 font-['Public_Sans',sans-serif]">
              Log in to join the conversation
            </p>
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3f4b7e] text-white text-sm font-['Public_Sans',sans-serif] rounded-lg hover:bg-[#3f4b7e]/90 transition-colors"
            >
              <LogIn className="size-3.5" />
              Log in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
