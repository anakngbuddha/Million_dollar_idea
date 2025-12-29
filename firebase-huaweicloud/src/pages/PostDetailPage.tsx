import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../services/communityService';
import { 
  getPostById, 
  voteOnPost, 
  deletePost, 
  updatePost,
  createComment,
  getPostComments
} from '../services/communityService';
import type { Comment as CommentType } from '../services/communityService';
import CommentComponent from '../components/Comment';
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  Save,
  ArrowLeft,
  Plus,
  X,
} from 'lucide-react';
import '../styles/DashboardPage.css';
import './PostDetailPage.css';

const PostDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { user, loading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [userVote, setUserVote] = useState(0);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (postId && user) {
      loadPost();
      loadComments();
    }
  }, [postId, user]);

  const loadPost = async () => {
    if (!postId) return;
    
    try {
      setIsLoading(true);
      const fetchedPost = await getPostById(postId);
      if (fetchedPost) {
        setPost(fetchedPost);
        setEditedTitle(fetchedPost.title);
        setEditedContent(fetchedPost.content);
        setUserVote(fetchedPost.userVotes?.[user?.uid || ''] || 0);
        setUpvotes(fetchedPost.upvotes);
        setDownvotes(fetchedPost.downvotes);
      } else {
        navigate('/community');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      navigate('/community');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    
    try {
      const fetchedComments = await getPostComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!post || !user) return;

    try {
      const newVote = userVote === (voteType === 'upvote' ? 1 : -1) ? 0 : (voteType === 'upvote' ? 1 : -1);
      const actionType = newVote === 0 ? 'remove' : voteType;
      
      await voteOnPost(post.id, user.uid, actionType as any);
      
      if (userVote === 1) setUpvotes(upvotes - 1);
      if (userVote === -1) setDownvotes(downvotes - 1);
      
      if (newVote === 1) setUpvotes(upvotes + (userVote === -1 ? 2 : 1));
      if (newVote === -1) setDownvotes(downvotes + (userVote === 1 ? 2 : 1));
      
      setUserVote(newVote);
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  const handleEdit = async () => {
    if (!post || !editedTitle.trim() || !editedContent.trim()) return;
    
    try {
      setIsLoading(true);
      await updatePost(post.id, {
        title: editedTitle,
        content: editedContent,
      });
      setIsEditing(false);
      await loadPost();
    } catch (error) {
      console.error('Error editing post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    if (window.confirm('Are you sure you want to delete this post and all comments?')) {
      try {
        setIsLoading(true);
        await deletePost(post.id);
        navigate('/community');
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentContent.trim() || !user || !postId) return;

    try {
      setIsLoading(true);
      await createComment(
        postId,
        user.uid,
        user.displayName || 'Anonymous',
        user.email || '',
        commentContent
      );
      
      setCommentContent('');
      setIsCommenting(false);
      await loadComments();
      await loadPost();
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Error creating comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentDeleted = async () => {
    await loadComments();
    await loadPost();
  };

  if (loading || isLoading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(233, 69, 96, 0.3)',
            borderTop: '3px solid #e94560',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !post) {
    return null;
  }

  return (
    <AppLayout>
    <div className="dashboard-container">
      <div className="dashboard-layout">
        {/* Main Content */}
        <main className="main-content">
          {/* Back Button */}
          <button 
            className="back-button"
            onClick={() => navigate('/community')}
          >
            <ArrowLeft size={18} />
            Back to Community
          </button>

          {/* Post Detail Container */}
          <div className="post-detail-container">
            <div className="post-detail-votes">
              <button
                onClick={() => handleVote('upvote')}
                className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
                disabled={isLoading}
                title="Upvote"
              >
                <ChevronUp size={24} />
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
                <ChevronDown size={24} />
              </button>
            </div>

            <div className="post-detail-content">
              <div className="post-detail-header">
                <div className="post-author-info">
                  <span className="post-author">{post.userName}</span>
                  <span className="post-time">
                    {new Date(post.createdAt.toDate()).toLocaleDateString()} at {new Date(post.createdAt.toDate()).toLocaleTimeString()}
                  </span>
                </div>
                {user.uid === post.userId && (
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
                    rows={8}
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
                  <h1 className="post-detail-title">{post.title}</h1>
                  <p className="post-detail-text">{post.content}</p>
                </>
              )}

              <div className="post-detail-stats">
                <span className="stat">
                  <MessageSquare size={18} />
                  {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                </span>
                <span className="stat">
                  <ThumbsUp size={18} />
                  {upvotes} upvotes
                </span>
                <span className="stat">
                  <ThumbsDown size={18} />
                  {downvotes} downvotes
                </span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="comments-section-detail">
            <div className="comments-header">
              <h2>
                <MessageSquare size={20} />
                Comments ({comments.length})
              </h2>
              <button
                onClick={() => setIsCommenting(!isCommenting)}
                className="add-comment-btn-header"
              >
                <Plus size={16} />
                Add Comment
              </button>
            </div>

            {isCommenting && (
              <div className="comment-form-detail">
                <textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  disabled={isLoading}
                  className="comment-textarea"
                  rows={4}
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
            )}

            <div className="comments-list-detail">
              {comments.length === 0 ? (
                <div className="no-comments-detail">
                  <MessageSquare size={48} strokeWidth={1.5} />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentComponent
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    currentUserId={user.uid}
                    onCommentDeleted={handleCommentDeleted}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </AppLayout>
  );
};

export default PostDetailPage;
