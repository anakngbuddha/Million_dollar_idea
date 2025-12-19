import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

// Google Sign In/Sign Up - No verification needed
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create or update user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Google accounts are pre-verified, so no verification needed
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        authProvider: 'google', // Track authentication provider
        emailVerified: true, // Google accounts are automatically verified
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ New Google user created: ${user.email}`);
    } else {
      // Existing user, just update last login
      await updateDoc(userRef, {
        updatedAt: new Date(),
      });
      console.log(`✅ Google user signed in: ${user.email}`);
    }

    return user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
};

// Email/Password Sign Up - Send verification link
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName,
    });

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: user.photoURL || null,
      authProvider: 'email', // Track authentication provider
      emailVerified: false, // Email users must verify via link
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send Firebase email verification link
    await sendEmailVerification(user);
    
    console.log(`📧 Sign up successful for ${email}. Verification link sent to email.`);

    return user;
  } catch (error) {
    console.error('Sign Up Error:', error);
    throw error;
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Get user data to check verification status
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    // Check if email is verified - email/password users MUST verify
    if (!userData?.emailVerified) {
      console.log(`📧 Email verification required for ${email}`);
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    console.log(`✅ User ${email} signed in successfully`);
    return user;
  } catch (error) {
    console.error('Sign In Error:', error);
    throw error;
  }
};

// Check if email is verified after clicking verification link
export const verifyEmailAfterLink = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Reload user to get latest emailVerified status from Firebase
    await user.reload();

    if (user.emailVerified) {
      // Update Firestore to mark as verified
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        emailVerified: true,
        updatedAt: new Date(),
      });
      console.log(`✅ Email verified for ${user.email}`);
    } else {
      throw new Error('Email is not verified yet. Please check your email and click the verification link.');
    }
  } catch (error) {
    console.error('Email Verification Error:', error);
    throw error;
  }
};

// Resend verification link
export const resendVerificationLink = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Google users don't need verification
    if (userData?.authProvider === 'google') {
      throw new Error('Google users do not need email verification');
    }

    // Send new verification link
    await sendEmailVerification(user);
    console.log(`📧 New verification link sent to ${user.email}`);
  } catch (error) {
    console.error('Resend Verification Link Error:', error);
    throw error;
  }
};

// Sign Out
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

// Password Reset
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password Reset Error:', error);
    throw error;
  }
};

// Resend Email Verification
export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Resend Email Verification Error:', error);
    throw error;
  }
};

// Get Current User
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user is verified
export const isUserVerified = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    return userData?.emailVerified === true;
  } catch (error) {
    console.error('Error checking user verification:', error);
    return false;
  }
};
