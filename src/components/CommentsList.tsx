import { useState, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMissionStore } from '@/store';
import type { Comment } from '@/shared/types';

export function CommentsList({ taskId }: { taskId: string }) {
  const { comments, setComments, addComment } = useMissionStore();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const taskComments = comments[taskId] || [];

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/comments`)
      .then(r => r.json())
      .then((data: Comment[]) => setComments(taskId, data))
      .catch(() => {});
  }, [taskId, setComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), author_name: 'Operator' }),
      });
      if (res.ok) {
        const comment = await res.json();
        addComment(taskId, comment);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5" />
        Comments ({taskComments.length})
      </h4>

      {/* Comment list */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {taskComments.length === 0 ? (
          <p className="text-xs text-text-muted py-3 text-center">No comments yet</p>
        ) : (
          taskComments.map((comment) => (
            <div key={comment.id} className="bg-bg-elevated/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">{comment.author_name}</span>
                <span className="text-[10px] text-text-muted">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="p-2 bg-accent text-bg-deep rounded-lg hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
