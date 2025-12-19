import React, { useState } from 'react';
import type {
  Comment as CommentType,
  Reply,
} from '../services/communityService';
import {
  voteOnComment,
  deleteComment,
  updateComment,
  createReply,
  getCommentReplies,
} from '../services/communityService';
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Save,
  X,
  Reply as ReplyIcon,
  MessageCircle,
  User as UserIcon,
  Clock,
} from 'lucide-react';
import ReplyComponent from './Reply';
import './Comment.css';

interface CommentProps {
  comment: CommentType;
  postId: string;
  currentUserId: string;
  onCommentDeleted: () => void;
}

const CommentComponent: React.FC<CommentProps> = ({
  comment,
  postId,
  currentUserId,
  onCommentDeleted,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userVote, setUserVote] = useState(comment.userVotes?.[currentUserId] || 0);
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [downvotes, setDownvotes] = useState(comment.downvotes);

  const loadReplies = async () => {
    try {
      setIsLoading(true);
      const fetchedReplies = await getCommentReplies(postId, comment.id);
      setReplies(fetchedReplies);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      setIsLoading(true);
      const newVote = userVote === (voteType === 'upvote' ? 1 : -1) ? 0 : (voteType === 'upvote' ? 1 : -1);
      const actionType = newVote === 0 ? 'remove' : voteType;
      
      await voteOnComment(postId, comment.id, currentUserId, actionType as any);
      
      // Update local state
      if (userVote === 1) setUpvotes(upvotes - 1);
      if (userVote === -1) setDownvotes(downvotes - 1);
      
      if (newVote === 1) setUpvotes(upvotes + (userVote === -1 ? 2 : 1));
      if (newVote === -1) setDownvotes(downvotes + (userVote === 1 ? 2 : 1));
      
      setUserVote(newVote);
    } catch (error) {
      console.error('Error voting on comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editedContent.trim()) return;
    
    try {
      setIsLoading(true);
      await updateComment(postId, comment.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment and all replies?')) {
      try {
        setIsLoading(true);
        await deleteComment(postId, comment.id);
        onCommentDeleted();
      } catch (error) {
        console.error('Error deleting comment:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    try {
      setIsLoading(true);
      const { auth } = await import('../config/firebase');
      const user = auth.currentUser;
      
      if (user) {
        await createReply(
          postId,
          comment.id,
          user.uid,
          user.displayName || 'Anonymous',
          user.email || '',
          replyContent
        );
        
        setReplyContent('');
        setIsReplying(false);
        // Reload replies and show them
        const fetchedReplies = await getCommentReplies(postId, comment.id);
        setReplies(fetchedReplies);
        setShowReplies(true);
        // Update parent to refresh comment count
        onCommentDeleted();
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyDeleted = async () => {
    const fetchedReplies = await getCommentReplies(postId, comment.id);
    setReplies(fetchedReplies);
  };

  return (
    <div className="comment-container">
      <div className="comment-header">
        <div className="comment-author-info">
          <div className="comment-author">
            <UserIcon size={16} />
            <span>{comment.userName}</span>
          </div>
          <div className="comment-time">
            <Clock size={14} />
            <span>{new Date(comment.createdAt.toDate()).toLocaleDateString()}</span>
          </div>
        </div>
        {currentUserId === comment.userId && (
          <div className="comment-actions">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="comment-action-btn edit"
              disabled={isLoading}
            >
              {isEditing ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit</>}
            </button>
            <button
              onClick={handleDelete}
              className="comment-action-btn delete"
              disabled={isLoading}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={isLoading}
            />
            <div className="comment-edit-actions">
              <button
                onClick={handleEdit}
                className="comment-edit-save"
                disabled={!editedContent.trim() || isLoading}
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(comment.content);
                }}
                className="comment-edit-cancel"
                disabled={isLoading}
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p>{comment.content}</p>
        )}
      </div>

      <div className="comment-footer">
        <div className="comment-votes">
          <button
            onClick={() => handleVote('upvote')}
            className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
            disabled={isLoading}
            title="Upvote"
          >
            <ChevronUp size={16} /> {upvotes}
          </button>
          <button
            onClick={() => handleVote('downvote')}
            className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
            disabled={isLoading}
            title="Downvote"
          >
            <ChevronDown size={16} /> {downvotes}
          </button>
        </div>
        <button
          onClick={() => setIsReplying(!isReplying)}
          className="reply-btn"
          disabled={isLoading}
        >
          {isReplying ? <><X size={14} /> Cancel</> : <><ReplyIcon size={14} /> Reply</>}
        </button>
        {comment.replyCount > 0 && (
          <button
            onClick={loadReplies}
            className="show-replies-btn"
            disabled={isLoading}
          >
            <MessageCircle size={14} />
            {showReplies ? `Hide ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}` : `Show ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
          </button>
        )}
      </div>

      {isReplying && (
        <div className="reply-form">
          <textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            disabled={isLoading}
          />
          <div className="reply-form-actions">
            <button
              onClick={handleReplySubmit}
              className="reply-submit"
              disabled={!replyContent.trim() || isLoading}
            >
              <ReplyIcon size={16} />
              {isLoading ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              className="reply-cancel"
              disabled={isLoading}
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {showReplies && (
        <div className="replies-section">
          {replies.map((reply) => (
            <ReplyComponent
              key={reply.id}
              reply={reply}
              postId={postId}
              commentId={comment.id}
              currentUserId={currentUserId}
              onReplyDeleted={handleReplyDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentComponent;
