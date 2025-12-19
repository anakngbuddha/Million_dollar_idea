import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types
export interface Post {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  commentCount: number;
  upvotes: number;
  downvotes: number;
  userVotes?: {
    [userId: string]: number; // 1 for upvote, -1 for downvote, 0 for neutral
  };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  replyCount: number;
  upvotes: number;
  downvotes: number;
  parentCommentId?: string; // For replies to comments
  userVotes?: {
    [userId: string]: number;
  };
}

export interface Reply {
  id: string;
  postId: string;
  commentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  upvotes: number;
  downvotes: number;
  userVotes?: {
    [userId: string]: number;
  };
}

// Get a single post by ID
export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      return {
        id: postSnap.id,
        ...postSnap.data(),
      } as Post;
    }
    return null;
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
};

// Create a new post
export const createPost = async (
  userId: string,
  userName: string,
  userEmail: string,
  title: string,
  content: string
): Promise<string> => {
  try {
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      userId,
      userName,
      userEmail,
      title,
      content,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      commentCount: 0,
      upvotes: 0,
      downvotes: 0,
      userVotes: {},
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Get all posts with pagination
export const getPosts = async (pageSize: number = 10, lastDoc?: any): Promise<{posts: Post[]; lastVisible: any}> => {
  try {
    const postsRef = collection(db, 'posts');
    let q;

    if (lastDoc) {
      q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      q = query(postsRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Post));

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return { posts, lastVisible };
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

// Get posts by user
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Post));
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
};

// Get single post
export const getPost = async (postId: string): Promise<Post | null> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const snapshot = await getDoc(postRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Post;
    }
    return null;
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
};

// Update post
export const updatePost = async (
  postId: string,
  updates: { title?: string; content?: string }
): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete post and all associated comments/replies
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete post
    const postRef = doc(db, 'posts', postId);
    batch.delete(postRef);

    // Delete all comments for this post
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const commentsSnapshot = await getDocs(commentsRef);
    
    for (const commentDoc of commentsSnapshot.docs) {
      batch.delete(commentDoc.ref);
      
      // Delete all replies for this comment
      const repliesRef = collection(db, 'posts', postId, 'comments', commentDoc.id, 'replies');
      const repliesSnapshot = await getDocs(repliesRef);
      for (const replyDoc of repliesSnapshot.docs) {
        batch.delete(replyDoc.ref);
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Vote on post
export const voteOnPost = async (
  postId: string,
  userId: string,
  voteType: 'upvote' | 'downvote' | 'remove'
): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postData = await getDoc(postRef);

    if (!postData.exists()) {
      throw new Error('Post not found');
    }

    const post = postData.data();
    const userVotes = post.userVotes || {};
    const currentVote = userVotes[userId] || 0;
    let newUpvotes = post.upvotes || 0;
    let newDownvotes = post.downvotes || 0;

    // Remove previous vote
    if (currentVote === 1) {
      newUpvotes = Math.max(0, newUpvotes - 1);
    } else if (currentVote === -1) {
      newDownvotes = Math.max(0, newDownvotes - 1);
    }

    // Add new vote
    if (voteType === 'upvote') {
      newUpvotes += 1;
      userVotes[userId] = 1;
    } else if (voteType === 'downvote') {
      newDownvotes += 1;
      userVotes[userId] = -1;
    } else {
      userVotes[userId] = 0;
    }

    await updateDoc(postRef, {
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVotes,
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    throw error;
  }
};

// Create comment on post
export const createComment = async (
  postId: string,
  userId: string,
  userName: string,
  userEmail: string,
  content: string
): Promise<string> => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const docRef = await addDoc(commentsRef, {
      postId,
      userId,
      userName,
      userEmail,
      content,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      replyCount: 0,
      upvotes: 0,
      downvotes: 0,
      userVotes: {},
    });

    // Update comment count on post
    const postRef = doc(db, 'posts', postId);
    const postData = await getDoc(postRef);
    if (postData.exists()) {
      const commentCount = (postData.data().commentCount || 0) + 1;
      await updateDoc(postRef, { commentCount });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Get comments for a post
export const getPostComments = async (postId: string): Promise<Comment[]> => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Comment));
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

// Update comment
export const updateComment = async (
  postId: string,
  commentId: string,
  content: string
): Promise<void> => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Delete comment and all replies
export const deleteComment = async (
  postId: string,
  commentId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete comment
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    batch.delete(commentRef);

    // Delete all replies
    const repliesRef = collection(db, 'posts', postId, 'comments', commentId, 'replies');
    const repliesSnapshot = await getDocs(repliesRef);
    for (const replyDoc of repliesSnapshot.docs) {
      batch.delete(replyDoc.ref);
    }

    await batch.commit();

    // Update comment count on post
    const postRef = doc(db, 'posts', postId);
    const postData = await getDoc(postRef);
    if (postData.exists()) {
      const commentCount = Math.max(0, (postData.data().commentCount || 0) - 1);
      await updateDoc(postRef, { commentCount });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Vote on comment
export const voteOnComment = async (
  postId: string,
  commentId: string,
  userId: string,
  voteType: 'upvote' | 'downvote' | 'remove'
): Promise<void> => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentData = await getDoc(commentRef);

    if (!commentData.exists()) {
      throw new Error('Comment not found');
    }

    const comment = commentData.data();
    const userVotes = comment.userVotes || {};
    const currentVote = userVotes[userId] || 0;
    let newUpvotes = comment.upvotes || 0;
    let newDownvotes = comment.downvotes || 0;

    if (currentVote === 1) {
      newUpvotes = Math.max(0, newUpvotes - 1);
    } else if (currentVote === -1) {
      newDownvotes = Math.max(0, newDownvotes - 1);
    }

    if (voteType === 'upvote') {
      newUpvotes += 1;
      userVotes[userId] = 1;
    } else if (voteType === 'downvote') {
      newDownvotes += 1;
      userVotes[userId] = -1;
    } else {
      userVotes[userId] = 0;
    }

    await updateDoc(commentRef, {
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVotes,
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    throw error;
  }
};

// Create reply to comment
export const createReply = async (
  postId: string,
  commentId: string,
  userId: string,
  userName: string,
  userEmail: string,
  content: string
): Promise<string> => {
  try {
    const repliesRef = collection(
      db,
      'posts',
      postId,
      'comments',
      commentId,
      'replies'
    );
    const docRef = await addDoc(repliesRef, {
      postId,
      commentId,
      userId,
      userName,
      userEmail,
      content,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      upvotes: 0,
      downvotes: 0,
      userVotes: {},
    });

    // Update reply count on comment
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentData = await getDoc(commentRef);
    if (commentData.exists()) {
      const replyCount = (commentData.data().replyCount || 0) + 1;
      await updateDoc(commentRef, { replyCount });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

// Get replies for a comment
export const getCommentReplies = async (
  postId: string,
  commentId: string
): Promise<Reply[]> => {
  try {
    const repliesRef = collection(
      db,
      'posts',
      postId,
      'comments',
      commentId,
      'replies'
    );
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Reply));
  } catch (error) {
    console.error('Error getting replies:', error);
    throw error;
  }
};

// Update reply
export const updateReply = async (
  postId: string,
  commentId: string,
  replyId: string,
  content: string
): Promise<void> => {
  try {
    const replyRef = doc(
      db,
      'posts',
      postId,
      'comments',
      commentId,
      'replies',
      replyId
    );
    await updateDoc(replyRef, {
      content,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating reply:', error);
    throw error;
  }
};

// Delete reply
export const deleteReply = async (
  postId: string,
  commentId: string,
  replyId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete reply
    const replyRef = doc(
      db,
      'posts',
      postId,
      'comments',
      commentId,
      'replies',
      replyId
    );
    batch.delete(replyRef);

    await batch.commit();

    // Update reply count on comment
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentData = await getDoc(commentRef);
    if (commentData.exists()) {
      const replyCount = Math.max(0, (commentData.data().replyCount || 0) - 1);
      await updateDoc(commentRef, { replyCount });
    }
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw error;
  }
};

// Vote on reply
export const voteOnReply = async (
  postId: string,
  commentId: string,
  replyId: string,
  userId: string,
  voteType: 'upvote' | 'downvote' | 'remove'
): Promise<void> => {
  try {
    const replyRef = doc(
      db,
      'posts',
      postId,
      'comments',
      commentId,
      'replies',
      replyId
    );
    const replyData = await getDoc(replyRef);

    if (!replyData.exists()) {
      throw new Error('Reply not found');
    }

    const reply = replyData.data();
    const userVotes = reply.userVotes || {};
    const currentVote = userVotes[userId] || 0;
    let newUpvotes = reply.upvotes || 0;
    let newDownvotes = reply.downvotes || 0;

    if (currentVote === 1) {
      newUpvotes = Math.max(0, newUpvotes - 1);
    } else if (currentVote === -1) {
      newDownvotes = Math.max(0, newDownvotes - 1);
    }

    if (voteType === 'upvote') {
      newUpvotes += 1;
      userVotes[userId] = 1;
    } else if (voteType === 'downvote') {
      newDownvotes += 1;
      userVotes[userId] = -1;
    } else {
      userVotes[userId] = 0;
    }

    await updateDoc(replyRef, {
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVotes,
    });
  } catch (error) {
    console.error('Error voting on reply:', error);
    throw error;
  }
};

// Search posts by title
export const searchPosts = async (searchTerm: string): Promise<Post[]> => {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    const posts = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Post))
      .filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return posts;
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
};

// Get user's forum contribution count (posts + comments)
export const getUserForumContributions = async (userId: string): Promise<number> => {
  try {
    let totalContributions = 0;

    // Count user's posts
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, where('userId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    totalContributions += postsSnapshot.size;

    // Count user's comments across all posts
    const allPostsSnapshot = await getDocs(postsRef);
    for (const postDoc of allPostsSnapshot.docs) {
      const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
      const commentsQuery = query(commentsRef, where('userId', '==', userId));
      const commentsSnapshot = await getDocs(commentsQuery);
      totalContributions += commentsSnapshot.size;
    }

    return totalContributions;
  } catch (error) {
    console.error('Error getting user forum contributions:', error);
    throw error;
  }
};
