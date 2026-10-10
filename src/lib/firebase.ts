import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged, type FirebaseUser };

// If custom firestoreDatabaseId is provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper functions for auth & sync
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  }
}

export async function logOut() {
  return signOut(auth);
}

// Save chat thread to Firestore
export async function saveThreadToFirestore(userId: string, thread: any) {
  if (!userId || !thread?.id) return;
  try {
    const threadRef = doc(db, 'users', userId, 'threads', thread.id);
    await setDoc(
      threadRef,
      {
        id: thread.id,
        title: thread.title || 'Untitled Session',
        modelRole: thread.modelRole || 'general',
        lens: thread.lens || 'universal',
        messages: thread.messages || [],
        createdAt: thread.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Could not save thread to Firestore:', e);
  }
}

// Load chat threads for user
export async function loadUserThreadsFromFirestore(userId: string) {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'users', userId, 'threads'));
    const snapshot = await getDocs(q);
    const threads: any[] = [];
    snapshot.forEach((docSnap) => {
      threads.push(docSnap.data());
    });
    return threads.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (e) {
    console.warn('Could not load user threads from Firestore:', e);
    return [];
  }
}

// Delete chat thread from Firestore
export async function deleteThreadFromFirestore(userId: string, threadId: string) {
  if (!userId || !threadId) return;
  try {
    const threadRef = doc(db, 'users', userId, 'threads', threadId);
    await deleteDoc(threadRef);
  } catch (e) {
    console.warn('Could not delete thread from Firestore:', e);
  }
}

// Save generated clinical note or enterprise document to Firestore
export async function saveDocumentToFirestore(userId: string, docData: any) {
  if (!userId || !docData?.id) return;
  try {
    const docRef = doc(db, 'users', userId, 'documents', docData.id);
    await setDoc(
      docRef,
      {
        id: docData.id,
        title: docData.title || 'Untitled Document',
        industry: docData.industry || 'general',
        rawInput: docData.rawInput || '',
        markdownReport: docData.markdownReport || '',
        createdAt: docData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Could not save document to Firestore:', e);
  }
}

// Load documents for user
export async function loadUserDocumentsFromFirestore(userId: string) {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'users', userId, 'documents'));
    const snapshot = await getDocs(q);
    const docs: any[] = [];
    snapshot.forEach((docSnap) => {
      docs.push(docSnap.data());
    });
    return docs.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (e) {
    console.warn('Could not load user documents from Firestore:', e);
    return [];
  }
}

// Delete document from Firestore
export async function deleteDocumentFromFirestore(userId: string, docId: string) {
  if (!userId || !docId) return;
  try {
    const docRef = doc(db, 'users', userId, 'documents', docId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Could not delete document from Firestore:', e);
  }
}
