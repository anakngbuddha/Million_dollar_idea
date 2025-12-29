import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== MODULE TYPES ====================
export interface ModuleFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: Timestamp;
  fileSize: number;
  fileType: string;
  publicId?: string; // Cloudinary public ID for direct downloads
  resourceType?: string; // Cloudinary resource type (image, video, raw, auto)
  format?: string; // Cloudinary format/extension (pdf, docx, jpg, etc)
}

export interface Module {
  id?: string;
  classroomId: string;
  title: string;
  description?: string;
  fileUrl?: string; // Legacy single file
  fileName?: string; // Legacy single file
  fileType?: string; // Legacy single file
  files?: ModuleFile[]; // Array of files for multi-file support
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  order?: number; // For ordering modules
}

// ==================== ASSIGNMENT TYPES ====================
export interface SubmissionFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: Timestamp;
  fileSize: number;
  publicId?: string; // Cloudinary public ID for direct downloads
  resourceType?: string; // Cloudinary resource type (image, video, raw, auto)
  format?: string; // Cloudinary format/extension (pdf, docx, jpg, etc)
}

export interface AssignmentSubmission {
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: Timestamp;
  submissionUrl?: string;
  submissionText?: string;
  submissionFiles?: SubmissionFile[]; // Array of uploaded files
  score?: number;
  maxScore: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'pending'; // pending = not submitted yet
}

export interface Assignment {
  id?: string;
  classroomId: string;
  title: string;
  description: string;
  instructions?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  attachmentResourceType?: string; // Cloudinary resource type for attachment
  attachmentPublicId?: string; // Cloudinary public ID for assignment attachment
  attachmentFormat?: string; // Cloudinary format/extension (pdf, docx, jpg, etc)
  dueDate: Timestamp;
  maxScore: number;
  assignedBy: string;
  assignedByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo: 'all' | string[]; // 'all' for all students, or array of student IDs
  submissions: AssignmentSubmission[];
}

// ==================== CLASSROOM QUIZ TYPES ====================
export interface QuizSubmissionFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: Timestamp;
  fileSize: number;
  publicId?: string; // Cloudinary public ID for direct downloads
  resourceType?: string; // Cloudinary resource type (image, video, raw, auto)
  format?: string; // Cloudinary format/extension (pdf, docx, jpg, etc)
}

export interface ClassroomQuiz {
  id?: string;
  classroomId: string;
  quizId: string; // Reference to the original quiz in customQuizzes collection
  quizTitle: string;
  assignedBy: string;
  assignedByName: string;
  createdAt: Timestamp;
  dueDate?: Timestamp;
  assignedTo: 'all' | string[]; // 'all' for all students, or array of student IDs
  submissionFiles?: QuizSubmissionFile[]; // Files attached to quiz (e.g., resources)
}

// ==================== MODULE FUNCTIONS ====================

/**
 * Create a new module
 */
export const createModule = async (module: Module, userId: string): Promise<string> => {
  try {
    // Verify user is a member of the classroom and is authorized
    const classroomRef = doc(db, 'classrooms', module.classroomId);
    const classroomSnap = await getDoc(classroomRef);
    
    if (!classroomSnap.exists()) {
      throw new Error('Classroom not found');
    }

    const classroomData = classroomSnap.data();
    if (!classroomData.members.includes(userId)) {
      throw new Error('You are not a member of this classroom');
    }

    const moduleData = {
      ...module,
      uploadedBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'modules'), moduleData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

/**
 * Get all modules for a classroom
 */
export const getClassroomModules = async (classroomId: string): Promise<Module[]> => {
  try {
    const q = query(
      collection(db, 'modules'),
      where('classroomId', '==', classroomId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Module));
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
};

/**
 * Delete a module
 */
export const deleteModule = async (moduleId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'modules', moduleId));
  } catch (error) {
    console.error('Error deleting module:', error);
    throw error;
  }
};

/**
 * Update a module
 */
export const updateModule = async (
  moduleId: string,
  updates: Partial<Module>
): Promise<void> => {
  try {
    const moduleRef = doc(db, 'modules', moduleId);
    await updateDoc(moduleRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating module:', error);
    throw error;
  }
};

// ==================== ASSIGNMENT FUNCTIONS ====================

/**
 * Create a new assignment
 */
export const createAssignment = async (
  assignment: Assignment
): Promise<string> => {
  try {
    const assignmentData = {
      ...assignment,
      submissions: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'assignments'), assignmentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

/**
 * Get all assignments for a classroom
 */
export const getClassroomAssignments = async (
  classroomId: string
): Promise<Assignment[]> => {
  try {
    const q = query(
      collection(db, 'assignments'),
      where('classroomId', '==', classroomId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Assignment));
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

/**
 * Get assignments for a specific student
 */
export const getStudentAssignments = async (
  classroomId: string,
  studentId: string
): Promise<Assignment[]> => {
  try {
    const assignments = await getClassroomAssignments(classroomId);

    // Filter assignments assigned to this student
    return assignments.filter((a) => {
      if (a.assignedTo === 'all') return true;
      return Array.isArray(a.assignedTo) && a.assignedTo.includes(studentId);
    });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    throw error;
  }
};

/**
 * Submit an assignment
 */
export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  studentName: string,
  studentEmail: string,
  submission: {
    submissionUrl?: string;
    submissionText?: string;
    submissionFiles?: SubmissionFile[];
  }
): Promise<void> => {
  try {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);

    if (!assignmentSnap.exists()) {
      throw new Error('Assignment not found');
    }

    const assignment = assignmentSnap.data() as Assignment;
    const submissions = assignment.submissions || [];

    // Check if student already submitted
    const existingSubmissionIndex = submissions.findIndex(
      (s) => s.studentId === studentId
    );

    const submissionData: AssignmentSubmission = {
      studentId,
      studentName,
      studentEmail,
      submittedAt: Timestamp.now(),
      ...submission,
      maxScore: assignment.maxScore,
      status: 'submitted',
    };

    if (existingSubmissionIndex !== -1) {
      // Update existing submission - preserve existing files and add new ones
      if (submission.submissionFiles) {
        const existingFiles = submissions[existingSubmissionIndex].submissionFiles || [];
        submissionData.submissionFiles = [...existingFiles, ...submission.submissionFiles];
      }
      submissions[existingSubmissionIndex] = submissionData;
    } else {
      // Add new submission
      submissions.push(submissionData);
    }

    await updateDoc(assignmentRef, {
      submissions,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    throw error;
  }
};

/**
 * Grade an assignment submission
 */
export const gradeAssignmentSubmission = async (
  assignmentId: string,
  studentId: string,
  score: number,
  feedback?: string
): Promise<void> => {
  try {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);

    if (!assignmentSnap.exists()) {
      throw new Error('Assignment not found');
    }

    const assignment = assignmentSnap.data() as Assignment;
    const submissions = assignment.submissions || [];

    const submissionIndex = submissions.findIndex(
      (s) => s.studentId === studentId
    );

    if (submissionIndex === -1) {
      throw new Error('Submission not found');
    }

    submissions[submissionIndex].score = score;
    submissions[submissionIndex].feedback = feedback;
    submissions[submissionIndex].status = 'graded';

    await updateDoc(assignmentRef, {
      submissions,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error grading assignment:', error);
    throw error;
  }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (
  assignmentId: string
): Promise<Assignment | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'assignments', assignmentId));

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Assignment;
    }

    return null;
  } catch (error) {
    console.error('Error fetching assignment:', error);
    throw error;
  }
};

// ==================== CLASSROOM QUIZ FUNCTIONS ====================

/**
 * Assign a quiz to a classroom (make it "classroom-shareable")
 */
export const assignQuizToClassroom = async (
  quizId: string,
  classroomId: string,
  quizTitle: string,
  assignedById: string,
  assignedByName: string,
  assignedTo: 'all' | string[],
  dueDate?: Timestamp,
  submissionFiles?: QuizSubmissionFile[]
): Promise<string> => {
  try {
    const classroomQuiz: ClassroomQuiz = {
      classroomId,
      quizId,
      quizTitle,
      assignedBy: assignedById,
      assignedByName,
      createdAt: Timestamp.now(),
      assignedTo,
      dueDate,
      submissionFiles,
    };

    const docRef = await addDoc(collection(db, 'classroomQuizzes'), classroomQuiz);
    return docRef.id;
  } catch (error) {
    console.error('Error assigning quiz to classroom:', error);
    throw error;
  }
};

/**
 * Get all quizzes assigned to a classroom
 */
export const getClassroomQuizzes = async (
  classroomId: string
): Promise<ClassroomQuiz[]> => {
  try {
    const q = query(
      collection(db, 'classroomQuizzes'),
      where('classroomId', '==', classroomId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ClassroomQuiz));
  } catch (error) {
    console.error('Error fetching classroom quizzes:', error);
    throw error;
  }
};

/**
 * Get quizzes assigned to a specific student
 */
export const getStudentClassroomQuizzes = async (
  classroomId: string,
  studentId: string
): Promise<ClassroomQuiz[]> => {
  try {
    const quizzes = await getClassroomQuizzes(classroomId);

    // Filter quizzes assigned to this student
    return quizzes.filter((q) => {
      if (q.assignedTo === 'all') return true;
      return Array.isArray(q.assignedTo) && q.assignedTo.includes(studentId);
    });
  } catch (error) {
    console.error('Error fetching student classroom quizzes:', error);
    throw error;
  }
};

/**
 * Remove a quiz from classroom assignment
 */
export const removeQuizFromClassroom = async (
  classroomQuizId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'classroomQuizzes', classroomQuizId));
  } catch (error) {
    console.error('Error removing quiz from classroom:', error);
    throw error;
  }
};

/**
 * Update classroom quiz assignment
 */
export const updateClassroomQuizAssignment = async (
  classroomQuizId: string,
  updates: Partial<ClassroomQuiz>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'classroomQuizzes', classroomQuizId), updates);
  } catch (error) {
    console.error('Error updating classroom quiz assignment:', error);
    throw error;
  }
};

// ==================== EXPORT FUNCTIONS ====================

/**
 * Get assignment records for export (PDF/Excel)
 */
export const getAssignmentExportData = async (
  assignmentId: string
): Promise<{
  assignment: Assignment;
  submissions: AssignmentSubmission[];
}> => {
  try {
    const assignment = await getAssignmentById(assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    return {
      assignment,
      submissions: assignment.submissions || [],
    };
  } catch (error) {
    console.error('Error getting assignment export data:', error);
    throw error;
  }
};
