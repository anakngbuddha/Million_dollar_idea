import React, { useState } from 'react';
import type { Reply } from '../services/communityService';
import { voteOnReply, deleteReply, updateReply } from '../services/communityService';
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Save,
  X,
  User as UserIcon,
  Clock,
} from 'lucide-react';
import './Reply.css';

interface ReplyProps {
  reply: Reply;
  postId: string;
  commentId: string;
  currentUserId: string;
  onReplyDeleted: () => void;
}

const ReplyComponent: React.FC<ReplyProps> = ({
  reply,
  postId,
  commentId,
  currentUserId,
  onReplyDeleted,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [isLoading, setIsLoading] = useState(false);
  const [userVote, setUserVote] = useState(reply.userVotes?.[currentUserId] || 0);
  const [upvotes, setUpvotes] = useState(reply.upvotes);
  const [downvotes, setDownvotes] = useState(reply.downvotes);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      setIsLoading(true);
      const newVote = userVote === (voteType === 'upvote' ? 1 : -1) ? 0 : (voteType === 'upvote' ? 1 : -1);
      const actionType = newVote === 0 ? 'remove' : voteType;
      
      await voteOnReply(postId, commentId, reply.id, currentUserId, actionType as any);
      
      // Update local state
      if (userVote === 1) setUpvotes(upvotes - 1);
      if (userVote === -1) setDownvotes(downvotes - 1);
      
      if (newVote === 1) setUpvotes(upvotes + (userVote === -1 ? 2 : 1));
      if (newVote === -1) setDownvotes(downvotes + (userVote === 1 ? 2 : 1));
      
      setUserVote(newVote);
    } catch (error) {
      console.error('Error voting on reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editedContent.trim()) return;
    
    try {
      setIsLoading(true);
      await updateReply(postId, commentId, reply.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        setIsLoading(true);
        await deleteReply(postId, commentId, reply.id);
        onReplyDeleted();
      } catch (error) {
        console.error('Error deleting reply:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="reply-container">
      <div className="reply-header">
        <div className="reply-author-info">
          <div className="reply-author">
            <UserIcon size={14} />
            <span>{reply.userName}</span>
          </div>
          <div className="reply-time">
            <Clock size={12} />
            <span>{new Date(reply.createdAt.toDate()).toLocaleDateString()}</span>
          </div>
        </div>
        {currentUserId === reply.userId && (
          <div className="reply-actions">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="reply-action-btn edit"
              disabled={isLoading}
            >
              {isEditing ? <><X size={12} /> Cancel</> : <><Edit2 size={12} /> Edit</>}
            </button>
            <button
              onClick={handleDelete}
              className="reply-action-btn delete"
              disabled={isLoading}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="reply-content">
        {isEditing ? (
          <div className="reply-edit-form">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={isLoading}
            />
            <div className="reply-edit-actions">
              <button
                onClick={handleEdit}
                className="reply-edit-save"
                disabled={!editedContent.trim() || isLoading}
              >
                <Save size={14} /> Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(reply.content);
                }}
                className="reply-edit-cancel"
                disabled={isLoading}
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p>{reply.content}</p>
        )}
      </div>

      <div className="reply-footer">
        <div className="reply-votes">
          <button
            onClick={() => handleVote('upvote')}
            className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
            disabled={isLoading}
            title="Upvote"
          >
            <ChevronUp size={14} /> {upvotes}
          </button>
          <button
            onClick={() => handleVote('downvote')}
            className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
            disabled={isLoading}
            title="Downvote"
          >
            <ChevronDown size={14} /> {downvotes}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyComponent;
