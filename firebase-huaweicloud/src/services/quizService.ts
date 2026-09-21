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
export type QuizVisibility = 'private' | 'public' | 'shared' | 'classroom';

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
  authorId?: string;
  questions: QuizQuestion[];
  visibility: QuizVisibility;
  sharedWith?: string[];
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
  isClassroomShareable?: boolean;
  classroomId?: string;
  attemptRestriction?: 'unlimited' | 'once' | 'limited';
  attemptLimit?: number;
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
  timeSpent: number;
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

/** Remove undefined values at every nested level before sending data to Firestore. */
const removeUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefined(item)) as T;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, removeUndefined(nestedValue)])
    ) as T;
  }

  return value;
};

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
    return docRef.id;
  } catch (error) {
    console.error('[quizService] Error saving quiz result:', error);
    throw error;
  }
};

export const getUserQuizAttempts = async (userId: string): Promise<QuizAttempt[]> => {
  try {
    if (!userId) return [];
    const q = query(collection(db, 'quizAttempts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const attempts: QuizAttempt[] = [];
    querySnapshot.forEach((snapshot) => {
      attempts.push({ ...snapshot.data(), completedAt: snapshot.data().completedAt } as QuizAttempt);
    });
    attempts.sort((a, b) => {
      const aTime = a.completedAt.toMillis ? a.completedAt.toMillis() : (a.completedAt instanceof Date ? a.completedAt.getTime() : 0);
      const bTime = b.completedAt.toMillis ? b.completedAt.toMillis() : (b.completedAt instanceof Date ? b.completedAt.getTime() : 0);
      return bTime - aTime;
    });
    return attempts;
  } catch (error) {
    console.error('[quizService] Error fetching user quiz attempts:', error);
    return [];
  }
};

export const getQuizAttempts = async (userId: string, quizId: string): Promise<QuizAttempt[]> => {
  try {
    const q = query(collection(db, 'quizAttempts'), where('userId', '==', userId), where('quizId', '==', quizId));
    const querySnapshot = await getDocs(q);
    const attempts: QuizAttempt[] = [];
    querySnapshot.forEach((snapshot) => {
      attempts.push({ ...snapshot.data(), completedAt: snapshot.data().completedAt } as QuizAttempt);
    });
    attempts.sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());
    return attempts;
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return [];
  }
};

export const getUserQuizStats = async (userId: string): Promise<UserQuizStats | null> => {
  const attempts = await getUserQuizAttempts(userId);
  if (attempts.length === 0) return null;

  const stats: UserQuizStats = { userId, totalAttempts: attempts.length, totalScore: 0, averageScore: 0, quizzes: {} };
  attempts.forEach((attempt) => {
    stats.totalScore += attempt.score;
    if (!stats.quizzes[attempt.quizId]) {
      stats.quizzes[attempt.quizId] = { attempts: 0, bestScore: 0, lastAttempt: attempt.completedAt };
    }
    stats.quizzes[attempt.quizId].attempts += 1;
    stats.quizzes[attempt.quizId].bestScore = Math.max(stats.quizzes[attempt.quizId].bestScore, attempt.score);
    stats.quizzes[attempt.quizId].lastAttempt = attempt.completedAt;
  });
  stats.averageScore = Math.round(stats.totalScore / attempts.length);
  return stats;
};

export const getBestQuizAttempt = async (userId: string, quizId: string): Promise<QuizAttempt | null> => {
  const attempts = await getQuizAttempts(userId, quizId);
  return attempts.length === 0 ? null : attempts.reduce((best, current) => current.score > best.score ? current : best);
};

export const createCustomQuiz = async (
  quiz: Omit<CustomQuiz, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const quizData = removeUndefined({ ...quiz, createdAt: now, updatedAt: now });
    const docRef = await addDoc(collection(db, 'customQuizzes'), quizData);
    console.log('[quizService] Custom quiz created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[quizService] Error creating custom quiz:', error);
    throw error;
  }
};

export const updateCustomQuiz = async (
  quizId: string,
  updates: Partial<Omit<CustomQuiz, 'id' | 'createdAt' | 'creatorId'>>
): Promise<void> => {
  try {
    const quizRef = doc(db, 'customQuizzes', quizId);
    await updateDoc(quizRef, removeUndefined({ ...updates, updatedAt: Timestamp.now() }));
    console.log('[quizService] Custom quiz updated:', quizId);
  } catch (error) {
    console.error('[quizService] Error updating custom quiz:', error);
    throw error;
  }
};

export const deleteCustomQuiz = async (quizId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'customQuizzes', quizId));
    console.log('[quizService] Custom quiz deleted:', quizId);
  } catch (error) {
    console.error('[quizService] Error deleting custom quiz:', error);
    throw error;
  }
};

export const getCustomQuiz = async (quizId: string): Promise<CustomQuiz | null> => {
  try {
    const quizSnap = await getDoc(doc(db, 'customQuizzes', quizId));
    return quizSnap.exists() ? ({ id: quizSnap.id, ...quizSnap.data() } as CustomQuiz) : null;
  } catch (error) {
    console.error('[quizService] Error fetching custom quiz:', error);
    throw error;
  }
};

export const getUserCustomQuizzes = async (userId: string): Promise<CustomQuiz[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'customQuizzes'), where('creatorId', '==', userId)));
    const quizzes: CustomQuiz[] = [];
    querySnapshot.forEach((snapshot) => quizzes.push({ id: snapshot.id, ...snapshot.data() } as CustomQuiz));
    quizzes.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    return quizzes;
  } catch (error) {
    console.error('[quizService] Error fetching user custom quizzes:', error);
    return [];
  }
};

export const getPublicCustomQuizzes = async (): Promise<CustomQuiz[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'customQuizzes'), where('visibility', '==', 'public')));
    const quizzes: CustomQuiz[] = [];
    querySnapshot.forEach((snapshot) => quizzes.push({ id: snapshot.id, ...snapshot.data() } as CustomQuiz));
    quizzes.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return quizzes;
  } catch (error) {
    console.error('[quizService] Error fetching public custom quizzes:', error);
    return [];
  }
};

export const getSharedCustomQuizzes = async (userId: string): Promise<CustomQuiz[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'customQuizzes'), where('sharedWith', 'array-contains', userId)));
    const quizzes: CustomQuiz[] = [];
    querySnapshot.forEach((snapshot) => quizzes.push({ id: snapshot.id, ...snapshot.data() } as CustomQuiz));
    quizzes.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    return quizzes;
  } catch (error) {
    console.error('[quizService] Error fetching shared custom quizzes:', error);
    return [];
  }
};

export const getAllQuizAttempts = async (quizId: string): Promise<QuizAttempt[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'quizAttempts'), where('quizId', '==', quizId)));
    const attempts: QuizAttempt[] = [];
    querySnapshot.forEach((snapshot) => attempts.push({ ...snapshot.data(), completedAt: snapshot.data().completedAt } as QuizAttempt));
    attempts.sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());
    return attempts;
  } catch (error) {
    console.error('[quizService] Error fetching quiz attempts:', error);
    return [];
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('[quizService] Error fetching user profile:', error);
    return null;
  }
};

export const getUserProfiles = async (userIds: string[]) => {
  try {
    const profiles: { [key: string]: any } = {};
    for (const userId of userIds) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) profiles[userId] = userDoc.data();
    }
    return profiles;
  } catch (error) {
    console.error('[quizService] Error fetching user profiles:', error);
    return {};
  }
};
