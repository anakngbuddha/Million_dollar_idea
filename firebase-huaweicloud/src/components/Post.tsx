import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Post,
  Comment as CommentType,
} from '../services/communityService';
import {
  voteOnPost,
  deletePost,
  updatePost,
  createComment,
  getPostComments,
} from '../services/communityService';
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
} from 'lucide-react';
import CommentComponent from './Comment';
import './Post.css';

interface PostProps {
  post: Post;
  currentUserId: string;
  onPostDeleted: () => void;
}

const PostComponent: React.FC<PostProps> = ({
  post,
  currentUserId,
  onPostDeleted,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState<CommentType[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userVote, setUserVote] = useState(post.userVotes?.[currentUserId] || 0);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const fetchedComments = await getPostComments(post.id);
      setComments(fetchedComments);
      setShowComments(true);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    try {
      setIsLoading(true);
      const newVote = userVote === (voteType === 'upvote' ? 1 : -1) ? 0 : (voteType === 'upvote' ? 1 : -1);
      const actionType = newVote === 0 ? 'remove' : voteType;
      
      await voteOnPost(post.id, currentUserId, actionType as any);
      
      // Update local state
      if (userVote === 1) setUpvotes(upvotes - 1);
      if (userVote === -1) setDownvotes(downvotes - 1);
      
      if (newVote === 1) setUpvotes(upvotes + (userVote === -1 ? 2 : 1));
      if (newVote === -1) setDownvotes(downvotes + (userVote === 1 ? 2 : 1));
      
      setUserVote(newVote);
    } catch (error) {
      console.error('Error voting on post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) return;
    
    try {
      setIsLoading(true);
      await updatePost(post.id, {
        title: editedTitle,
        content: editedContent,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post and all comments?')) {
      try {
        setIsLoading(true);
        await deletePost(post.id);
        onPostDeleted();
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentContent.trim()) return;

    try {
      setIsLoading(true);
      const { auth } = await import('../config/firebase');
      const user = auth.currentUser;
      
      if (user) {
        await createComment(
          post.id,
          user.uid,
          user.displayName || 'Anonymous',
          user.email || '',
          commentContent
        );
        
        setCommentContent('');
        setIsCommenting(false);
        // Reload comments
        const fetchedComments = await getPostComments(post.id);
        setComments(fetchedComments);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentDeleted = async () => {
    const fetchedComments = await getPostComments(post.id);
    setComments(fetchedComments);
  };

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }
    navigate(`/community/post/${post.id}`);
  };

  return (
    <div className="post-container" onClick={handlePostClick} style={{ cursor: 'pointer' }}>
      <div className="post-votes">
        <button
          onClick={() => handleVote('upvote')}
          className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
          disabled={isLoading}
          title="Upvote"
        >
          <ChevronUp size={20} />
        </button>
        <div className="vote-count">
          {upvotes - downvotes}
        </div>
        <button
          onClick={() => handleVote('downvote')}
          className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
          disabled={isLoading}
          title="Downvote"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="post-content">
        <div className="post-header">
          <div className="post-author-info">
            <span className="post-author">{post.userName}</span>
            <span className="post-time">
              {new Date(post.createdAt.toDate()).toLocaleDateString()}
            </span>
          </div>
          {currentUserId === post.userId && (
            <div className="post-actions">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="post-action-btn edit"
                disabled={isLoading}
              >
                {isEditing ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit</>}
              </button>
              <button
                onClick={handleDelete}
                className="post-action-btn delete"
                disabled={isLoading}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="post-edit-form">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Post title"
              disabled={isLoading}
              className="edit-title-input"
            />
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Post content"
              disabled={isLoading}
              className="edit-content-input"
            />
            <div className="post-edit-actions">
              <button
                onClick={handleEdit}
                className="post-edit-save"
                disabled={!editedTitle.trim() || !editedContent.trim() || isLoading}
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(post.title);
                  setEditedContent(post.content);
                }}
                className="post-edit-cancel"
                disabled={isLoading}
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="post-title">{post.title}</h2>
            <p className="post-text">{post.content}</p>
          </>
        )}

        <div className="post-footer">
          <div className="post-stats">
            <span className="stat">
              <MessageSquare size={16} />
              {post.commentCount} comments
            </span>
            <span className="stat">
              <ThumbsUp size={16} />
              {upvotes} upvotes
            </span>
            <span className="stat">
              <ThumbsDown size={16} />
              {downvotes} downvotes
            </span>
          </div>
          <button
            onClick={() => {
              if (!showComments) {
                loadComments();
              } else {
                setShowComments(false);
              }
            }}
            className="comments-toggle-btn"
            disabled={isLoading}
          >
            {showComments ? 'Hide comments' : 'Show comments'}
          </button>
        </div>

        {showComments && (
          <div className="comments-section">
            {isCommenting ? (
              <div className="comment-form">
                <textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  disabled={isLoading}
                  className="comment-textarea"
                />
                <div className="comment-form-actions">
                  <button
                    onClick={handleCommentSubmit}
                    className="comment-submit"
                    disabled={!commentContent.trim() || isLoading}
                  >
                    <MessageSquare size={16} />
                    {isLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCommenting(false);
                      setCommentContent('');
                    }}
                    className="comment-cancel"
                    disabled={isLoading}
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCommenting(true)}
                className="add-comment-btn"
                disabled={isLoading}
              >
                <Plus size={16} /> Add Comment
              </button>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <CommentComponent
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    currentUserId={currentUserId}
                    onCommentDeleted={handleCommentDeleted}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComponent;
