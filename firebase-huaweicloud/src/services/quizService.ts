import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type QuestionType = 'multiple-choice' | 'multiple-answer' | 'true-false' | 'fill-in-blank';
export type QuizVisibility = 'private' | 'public' | 'shared';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number | boolean | string;
  correctAnswers?: number[];
  explanation?: string;
  points: number;
}

export interface CustomQuiz {
  id?: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  questions: QuizQuestion[];
  visibility: QuizVisibility;
  sharedWith?: string[];
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
}

export interface QuizAttempt {
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  answers: Array<{
    questionId: number;
    question: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
  }>;
  completedAt: Timestamp;
  timeSpent: number; // in seconds
}

export interface UserQuizStats {
  userId: string;
  totalAttempts: number;
  totalScore: number;
  averageScore: number;
  quizzes: {
    [quizId: string]: {
      attempts: number;
      bestScore: number;
      lastAttempt: Timestamp;
    };
  };
}

/**
 * Save quiz completion results to Firestore
 */
export const saveQuizResult = async (
  userId: string,
  quizId: string,
  quizTitle: string,
  score: number,
  maxScore: number,
  answers: Array<{
    questionId: number;
    question: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
  }>,
  timeSpent: number = 0
): Promise<string> => {
  try {
    console.log('[quizService] Saving quiz result:', {
      userId,
      quizId,
      quizTitle,
      score,
      maxScore,
      answersCount: answers.length,
      timeSpent,
    });

    const quizAttempt: Omit<QuizAttempt, 'id'> = {
      userId,
      quizId,
      quizTitle,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      answers,
      completedAt: Timestamp.now(),
      timeSpent,
    };

    const docRef = await addDoc(collection(db, 'quizAttempts'), quizAttempt);
    console.log('[quizService] Quiz result saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[quizService] Error saving quiz result:', error);
    throw error;
  }
};

/**
 * Get all quiz attempts for a user
 */
export const getUserQuizAttempts = async (userId: string): Promise<QuizAttempt[]> => {
  try {
    if (!userId) {
      console.warn('[quizService] getUserQuizAttempts called without userId');
      return [];
    }

    console.log('[quizService] Fetching quiz attempts for user:', userId);

    const q = query(
      collection(db, 'quizAttempts'),
      where('userId', '==', userId)
    );

    console.log('[quizService] Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('[quizService] Query executed. Document count:', querySnapshot.size);

    const attempts: QuizAttempt[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('[quizService] Processing document:', doc.id, data);
      attempts.push({
        ...data,
        completedAt: data.completedAt,
      } as QuizAttempt);
    });

    // Sort client-side to avoid requiring composite index
    attempts.sort((a, b) => {
      const aTime = a.completedAt.toMillis ? a.completedAt.toMillis() : (a.completedAt instanceof Date ? a.completedAt.getTime() : 0);
      const bTime = b.completedAt.toMillis ? b.completedAt.toMillis() : (b.completedAt instanceof Date ? b.completedAt.getTime() : 0);
      return bTime - aTime; // descending order
    });

    console.log(`[quizService] Loaded ${attempts.length} quiz attempts for user ${userId}:`, attempts);
    return attempts;
  } catch (error: any) {
    console.error('[quizService] Error fetching user quiz attempts:', error);
    console.error('[quizService] Error code:', error.code);
    console.error('[quizService] Error message:', error.message);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

/**
 * Get quiz attempts for a specific quiz and user
 */
export const getQuizAttempts = async (
  userId: string,
  quizId: string
): Promise<QuizAttempt[]> => {
  try {
    const q = query(
      collection(db, 'quizAttempts'),
      where('userId', '==', userId),
      where('quizId', '==', quizId)
    );

    const querySnapshot = await getDocs(q);
    const attempts: QuizAttempt[] = [];

    querySnapshot.forEach((doc) => {
      attempts.push({
        ...doc.data(),
        completedAt: doc.data().completedAt,
      } as QuizAttempt);
    });

    // Sort client-side
    attempts.sort((a, b) => {
      const aTime = a.completedAt.toMillis ? a.completedAt.toMillis() : (a.completedAt instanceof Date ? a.completedAt.getTime() : 0);
      const bTime = b.completedAt.toMillis ? b.completedAt.toMillis() : (b.completedAt instanceof Date ? b.completedAt.getTime() : 0);
      return bTime - aTime; // descending order
    });

    return attempts;
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return [];
  }
};

/**
 * Get user quiz statistics
 */
export const getUserQuizStats = async (userId: string): Promise<UserQuizStats | null> => {
  try {
    const attempts = await getUserQuizAttempts(userId);

    if (attempts.length === 0) {
      return null;
    }

    const stats: UserQuizStats = {
      userId,
      totalAttempts: attempts.length,
      totalScore: 0,
      averageScore: 0,
      quizzes: {},
    };

    let totalScore = 0;

    attempts.forEach((attempt) => {
      totalScore += attempt.score;

      if (!stats.quizzes[attempt.quizId]) {
        stats.quizzes[attempt.quizId] = {
          attempts: 0,
          bestScore: 0,
          lastAttempt: attempt.completedAt,
        };
      }

      stats.quizzes[attempt.quizId].attempts += 1;
      stats.quizzes[attempt.quizId].bestScore = Math.max(
        stats.quizzes[attempt.quizId].bestScore,
        attempt.score
      );
      stats.quizzes[attempt.quizId].lastAttempt = attempt.completedAt;
    });

    stats.totalScore = totalScore;
    stats.averageScore = Math.round(totalScore / attempts.length);

    return stats;
  } catch (error) {
    console.error('Error fetching user quiz stats:', error);
    throw error;
  }
};

/**
 * Get best quiz attempt for a quiz
 */
export const getBestQuizAttempt = async (
  userId: string,
  quizId: string
): Promise<QuizAttempt | null> => {
  try {
    const attempts = await getQuizAttempts(userId, quizId);

    if (attempts.length === 0) {
      return null;
    }

    return attempts.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  } catch (error) {
    console.error('Error fetching best quiz attempt:', error);
    throw error;
  }
};

/**
 * Create a new custom quiz
 */
export const createCustomQuiz = async (
  quiz: Omit<CustomQuiz, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const quizData: any = {
      ...quiz,
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(quizData).forEach(key => {
      if (quizData[key] === undefined) {
        delete quizData[key];
      }
    });

    const docRef = await addDoc(collection(db, 'customQuizzes'), quizData);
    console.log('[quizService] Custom quiz created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[quizService] Error creating custom quiz:', error);
    throw error;
  }
};

/**
 * Update an existing custom quiz
 */
export const updateCustomQuiz = async (
  quizId: string,
  updates: Partial<Omit<CustomQuiz, 'id' | 'createdAt' | 'creatorId'>>
): Promise<void> => {
  try {
    const quizRef = doc(db, 'customQuizzes', quizId);
    await updateDoc(quizRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    console.log('[quizService] Custom quiz updated:', quizId);
  } catch (error) {
    console.error('[quizService] Error updating custom quiz:', error);
    throw error;
  }
};

/**
 * Delete a custom quiz
 */
export const deleteCustomQuiz = async (quizId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'customQuizzes', quizId));
    console.log('[quizService] Custom quiz deleted:', quizId);
  } catch (error) {
    console.error('[quizService] Error deleting custom quiz:', error);
    throw error;
  }
};

/**
 * Get a custom quiz by ID
 */
export const getCustomQuiz = async (quizId: string): Promise<CustomQuiz | null> => {
  try {
    const quizRef = doc(db, 'customQuizzes', quizId);
    const quizSnap = await getDoc(quizRef);

    if (!quizSnap.exists()) {
      return null;
    }

    return {
      id: quizSnap.id,
      ...quizSnap.data(),
    } as CustomQuiz;
  } catch (error) {
    console.error('[quizService] Error fetching custom quiz:', error);
    throw error;
  }
};

/**
 * Get all custom quizzes created by a user
 */
export const getUserCustomQuizzes = async (userId: string): Promise<CustomQuiz[]> => {
  try {
    const q = query(
      collection(db, 'customQuizzes'),
      where('creatorId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const quizzes: CustomQuiz[] = [];

    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data(),
      } as CustomQuiz);
    });

    quizzes.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    return quizzes;
  } catch (error) {
    console.error('[quizService] Error fetching user custom quizzes:', error);
    return [];
  }
};

/**
 * Get all public custom quizzes
 */
export const getPublicCustomQuizzes = async (): Promise<CustomQuiz[]> => {
  try {
    const q = query(
      collection(db, 'customQuizzes'),
      where('visibility', '==', 'public')
    );

    const querySnapshot = await getDocs(q);
    const quizzes: CustomQuiz[] = [];

    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data(),
      } as CustomQuiz);
    });

    quizzes.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return quizzes;
  } catch (error) {
    console.error('[quizService] Error fetching public custom quizzes:', error);
    return [];
  }
};

/**
 * Get custom quizzes shared with a user
 */
export const getSharedCustomQuizzes = async (userId: string): Promise<CustomQuiz[]> => {
  try {
    const q = query(
      collection(db, 'customQuizzes'),
      where('sharedWith', 'array-contains', userId)
    );

    const querySnapshot = await getDocs(q);
    const quizzes: CustomQuiz[] = [];

    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data(),
      } as CustomQuiz);
    });

    quizzes.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    return quizzes;
  } catch (error) {
    console.error('[quizService] Error fetching shared custom quizzes:', error);
    return [];
  }
};
