import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import type { Post } from '../services/communityService';
import { getPosts, createPost } from '../services/communityService';
import PostComponent from '../components/Post';
import {
  Plus,
  MessageSquarePlus,
  TrendingUp,
  UserCheck,
  Lightbulb,
  Target,
  FileText,
} from 'lucide-react';
import '../styles/DashboardPage.css';
import './CommunityPage.css';

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);


  if (loading) {
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

  if (!user) {
    return null;
  }


  // Load initial posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (isNew = true) => {
    try {
      setIsLoading(true);
      if (isNew) {
        const { posts: fetchedPosts, lastVisible } = await getPosts(10);
        setPosts(fetchedPosts);
        setLastDoc(lastVisible);
        setHasMore(fetchedPosts.length === 10);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!lastDoc || !hasMore || isLoading) return;

    try {
      setIsLoading(true);
      const { posts: fetchedPosts, lastVisible } = await getPosts(10, lastDoc);
      setPosts([...posts, ...fetchedPosts]);
      setLastDoc(lastVisible);
      setHasMore(fetchedPosts.length === 10);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    if (!user) {
      alert('You must be logged in to create a post');
      return;
    }

    try {
      setIsLoading(true);
      await createPost(
        user.uid,
        user.displayName || 'Anonymous',
        user.email || '',
        postTitle,
        postContent
      );

      setPostTitle('');
      setPostContent('');
      setIsCreatingPost(false);

      // Reload posts
      await loadPosts(true);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostDeleted = async () => {
    await loadPosts(true);
  };

  return (
    <div className="dashboard-container">
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} />

        {/* Main Content */}
        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          
          {/* Header Section */}
          <div className="content-header">
            <div className="header-top">
              <div>
                <h1>Community Forum</h1>
                <p>Share your thoughts, ask questions, and connect with other learners.</p>
              </div>
              <button
                onClick={() => setIsCreatingPost(true)}
                className="header-cta-btn"
                disabled={isLoading}
              >
                <Plus size={18} />
                New Post
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="community-grid">
            {/* Create Post Section - Now in a Modal/Overlay Style */}
            {isCreatingPost && (
              <div className="post-creation-overlay">
                <div className="post-creation-modal">
                  <div className="modal-header">
                    <h2>Create a New Post</h2>
                    <button
                      className="modal-close"
                      onClick={() => {
                        setIsCreatingPost(false);
                        setPostTitle('');
                        setPostContent('');
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="post-title">Post Title</label>
                      <input
                        id="post-title"
                        type="text"
                        placeholder="Give your post a clear, descriptive title"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        disabled={isLoading}
                        className="post-title-input"
                        maxLength={200}
                      />
                      <div className="char-count">{postTitle.length}/200 characters</div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="post-content">Content</label>
                      <textarea
                        id="post-content"
                        placeholder="Share your thoughts, questions, or insights..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        disabled={isLoading}
                        className="post-content-input"
                        rows={8}
                      />
                      <div className="char-hint">Be descriptive and constructive</div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      onClick={() => {
                        setIsCreatingPost(false);
                        setPostTitle('');
                        setPostContent('');
                      }}
                      className="btn-secondary"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      className="btn-primary"
                      disabled={!postTitle.trim() || !postContent.trim() || isLoading}
                    >
                      {isLoading ? 'Publishing...' : 'Publish Post'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="posts-feed-container">
              {/* Empty State */}
              {posts.length === 0 && !isLoading && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <MessageSquarePlus size={48} strokeWidth={1.5} />
                  </div>
                  <h3>No posts yet</h3>
                  <p>Be the first to start a discussion! Share your thoughts with the community.</p>
                  <button
                    onClick={() => setIsCreatingPost(true)}
                    className="btn-primary"
                  >
                    <Plus size={18} />
                    Create First Post
                  </button>
                </div>
              )}

              {/* Posts List */}
              {posts.length > 0 && (
                <div className="posts-list">
                  {posts.map((post) => (
                    <PostComponent
                      key={post.id}
                      post={post}
                      currentUserId={user.uid}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="load-more-section">
                      <button
                        onClick={loadMorePosts}
                        disabled={isLoading}
                        className="btn-outline"
                      >
                        {isLoading ? 'Loading more...' : 'Load More Posts'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoading && posts.length === 0 && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading posts...</p>
                </div>
              )}
            </div>

            {/* Sidebar - Stats and Info */}
            <aside className="community-sidebar">
              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <TrendingUp size={18} />
                  <h3>Community Stats</h3>
                </div>
                <div className="stat-item">
                  <div className="stat-label">
                    <FileText size={16} />
                    <span>Total Posts</span>
                  </div>
                  <strong>{posts.length}</strong>
                </div>
                <div className="stat-item">
                  <div className="stat-label">
                    <UserCheck size={16} />
                    <span>Active Users</span>
                  </div>
                  <strong>∞</strong>
                </div>
              </div>

              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <Lightbulb size={18} />
                  <h3>Tips</h3>
                </div>
                <ul className="tips-list">
                  <li>Be respectful and constructive</li>
                  <li>Search before posting</li>
                  <li>Include relevant details</li>
                  <li>Follow community guidelines</li>
                </ul>
              </div>

              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <Target size={18} />
                  <h3>Getting Started</h3>
                </div>
                <p>New to the community? Read our guidelines and make your first post today!</p>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CommunityPage;
