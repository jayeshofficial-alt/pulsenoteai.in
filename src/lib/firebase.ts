import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  onSnapshot,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FeatureSettingsDoc, UserFirestoreData, TeamDoc, CustomTemplateDoc, PartnerLeadDoc } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged, type FirebaseUser };

// If custom firestoreDatabaseId is provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Admin Email Allowlist
export const ADMIN_EMAILS = ['jayeshofficial@gmail.com', 'contact@pulsenoteai.in'];

export function isPulseNoteAdmin(email?: string | null, emailVerified?: boolean): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(clean);
}

// Revenue Dashboard Admin Allowlist — ONLY these emails may open the
// Admin Subscription & Revenue Dashboard (client gate; server re-verifies).
// NOTE: contact@pulsenoteai.in is included alongside the requested
// contact@pulsenoteai.com because the whole codebase uses the .in address.
// Remove it if access must be restricted to exactly the two addresses below.
export const REVENUE_ADMIN_EMAILS = [
  'jayeshofficial@gmail.com',
  'contact@pulsenoteai.com',
  'contact@pulsenoteai.in',
];

export function isRevenueAdmin(email?: string | null): boolean {
  if (!email) return false;
  return REVENUE_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      await ensureUserDocument(user);
    }
    return user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  if (result.user) {
    await ensureUserDocument(result.user);
  }
  return result.user;
}

export async function signUpWithEmail(email: string, pass: string, displayName?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (result.user) {
    await ensureUserDocument(result.user, displayName);
  }
  return result.user;
}

export async function logOut() {
  return signOut(auth);
}

async function ensureUserDocument(user: FirebaseUser, customName?: string) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // Initialize with Free plan, 0 notes used, 0 credits
      const initialData: UserFirestoreData = {
        plan: 'free',
        notesUsedThisMonth: 0,
        monthResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        credits: 0,
        referralCode: user.uid.slice(0, 8).toUpperCase(),
      };
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: customName || user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        ...initialData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        displayName: customName || user.displayName || snap.data()?.displayName || 'User',
        photoURL: user.photoURL || snap.data()?.photoURL || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (e) {
    console.warn('ensureUserDocument notice:', e);
  }
}

// -------------------------------------------------------------
// Settings: Feature Switches (Image & Video Generation)
// -------------------------------------------------------------
export function subscribeToFeatureSettings(
  callback: (settings: FeatureSettingsDoc) => void
): () => void {
  const settingsRef = doc(db, 'settings', 'features');
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as FeatureSettingsDoc;
        callback({
          imageGenerationEnabled: Boolean(data.imageGenerationEnabled),
          videoGenerationEnabled: Boolean(data.videoGenerationEnabled),
          updatedBy: data.updatedBy || 'system',
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        // Default both to false as required
        callback({
          imageGenerationEnabled: false,
          videoGenerationEnabled: false,
          updatedBy: 'system',
          updatedAt: new Date().toISOString(),
        });
      }
    },
    (err) => {
      console.warn('Feature settings listener warning:', err);
      // Fallback safe default
      callback({
        imageGenerationEnabled: false,
        videoGenerationEnabled: false,
        updatedBy: 'system',
        updatedAt: new Date().toISOString(),
      });
    }
  );
}

export async function updateFeatureSettings(
  imageGenerationEnabled: boolean,
  videoGenerationEnabled: boolean,
  adminEmail: string
) {
  const settingsRef = doc(db, 'settings', 'features');
  const payload: FeatureSettingsDoc = {
    imageGenerationEnabled,
    videoGenerationEnabled,
    updatedBy: adminEmail,
    updatedAt: new Date().toISOString(),
  };

  // 1. Write to Firestore directly
  await setDoc(settingsRef, payload, { merge: true });

  // 2. Also notify server-side route
  try {
    const token = await auth.currentUser?.getIdToken();
    await fetch('/api/admin/features', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('Server features sync warning:', e);
  }
}

// -------------------------------------------------------------
// Real-time User Profile & Plan Subscription
// -------------------------------------------------------------
export function subscribeToUserProfile(
  uid: string,
  callback: (userData: UserFirestoreData & { id: string; email: string; displayName?: string }) => void
): () => void {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        callback({
          id: uid,
          email: d.email || '',
          displayName: d.displayName || '',
          plan: d.plan || 'free',
          notesUsedThisMonth: typeof d.notesUsedThisMonth === 'number' ? d.notesUsedThisMonth : 0,
          monthResetAt: d.monthResetAt || new Date().toISOString(),
          credits: typeof d.credits === 'number' ? d.credits : 0,
          teamId: d.teamId,
          referralCode: d.referralCode || uid.slice(0, 8).toUpperCase(),
          referredBy: d.referredBy,
        });
      }
    },
    (err) => {
      console.warn('User profile listener warning:', err);
    }
  );
}

// -------------------------------------------------------------
// Team Accounts
// -------------------------------------------------------------
export function subscribeToTeam(
  teamId: string,
  callback: (team: TeamDoc | null) => void
): () => void {
  const teamRef = doc(db, 'teams', teamId);
  return onSnapshot(teamRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as TeamDoc);
    } else {
      callback(null);
    }
  });
}

export async function createTeamAccount(
  name: string,
  seats: number,
  ownerUid: string,
  ownerEmail: string
): Promise<string> {
  const teamRef = doc(collection(db, 'teams'));
  const teamData: Omit<TeamDoc, 'id'> = {
    ownerUid,
    name,
    seats,
    members: [ownerEmail],
    createdAt: new Date().toISOString(),
  };
  await setDoc(teamRef, teamData);
  // Link to user profile
  await setDoc(doc(db, 'users', ownerUid), { teamId: teamRef.id }, { merge: true });
  return teamRef.id;
}

export async function inviteTeamMember(teamId: string, newMemberEmail: string) {
  const teamRef = doc(db, 'teams', teamId);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) throw new Error('Team does not exist');
  const team = snap.data() as TeamDoc;
  const cleanEmail = newMemberEmail.toLowerCase().trim();
  if (team.members?.includes(cleanEmail)) {
    throw new Error('This user is already a member of the team');
  }
  if ((team.members?.length || 0) >= (team.seats || 3)) {
    throw new Error(`Team seat limit reached (${team.seats} seats). Upgrade seats to add more members.`);
  }
  const updatedMembers = [...(team.members || []), cleanEmail];
  await setDoc(teamRef, { members: updatedMembers }, { merge: true });
}

export async function removeTeamMember(teamId: string, memberEmail: string) {
  const teamRef = doc(db, 'teams', teamId);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) throw new Error('Team does not exist');
  const team = snap.data() as TeamDoc;
  const cleanEmail = memberEmail.toLowerCase().trim();
  const updatedMembers = (team.members || []).filter((m) => m !== cleanEmail);
  await setDoc(teamRef, { members: updatedMembers }, { merge: true });
}

// -------------------------------------------------------------
// Custom Templates
// -------------------------------------------------------------
export function subscribeToCustomTemplates(
  userId: string,
  teamId: string | undefined,
  callback: (templates: CustomTemplateDoc[]) => void
): () => void {
  // Listen to user's templates
  const userTemplatesRef = collection(db, 'users', userId, 'customTemplates');
  return onSnapshot(userTemplatesRef, async (snap) => {
    const list: CustomTemplateDoc[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CustomTemplateDoc));

    // If part of a team, also fetch shared team templates
    if (teamId) {
      try {
        const teamTplSnap = await getDocs(collection(db, 'teams', teamId, 'templates'));
        teamTplSnap.forEach((td) => {
          list.push({ id: td.id, ...td.data(), isTeamShared: true } as CustomTemplateDoc);
        });
      } catch (te) {
        console.warn('Team templates fetch notice:', te);
      }
    }

    callback(list);
  });
}

export async function saveCustomTemplate(
  userId: string,
  template: Omit<CustomTemplateDoc, 'id'>,
  teamId?: string
) {
  if (template.isTeamShared && teamId) {
    const teamTplRef = doc(collection(db, 'teams', teamId, 'templates'));
    await setDoc(teamTplRef, { ...template, ownerUid: userId, createdAt: new Date().toISOString() });
    return teamTplRef.id;
  }

  const tplRef = doc(collection(db, 'users', userId, 'customTemplates'));
  await setDoc(tplRef, { ...template, ownerUid: userId, createdAt: new Date().toISOString() });
  return tplRef.id;
}

export async function deleteCustomTemplate(userId: string, templateId: string, teamId?: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'customTemplates', templateId));
  } catch {}
  if (teamId) {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'templates', templateId));
    } catch {}
  }
}

// -------------------------------------------------------------
// Partner Leads
// -------------------------------------------------------------
export async function submitPartnerLead(lead: PartnerLeadDoc) {
  const col = collection(db, 'partnerLeads');
  await addDoc(col, {
    ...lead,
    createdAt: new Date().toISOString(),
  });
}

// -------------------------------------------------------------
// Chat Thread & Document Persistence
// -------------------------------------------------------------
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

export async function loadUserThreadsFromFirestore(userId: string) {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'users', userId, 'threads'));
    const snapshot = await getDocs(q);
    const threads: any[] = [];
    snapshot.forEach((docSnap) => {
      threads.push(docSnap.data());
    });
    return threads.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (e) {
    console.warn('Could not load user threads from Firestore:', e);
    return [];
  }
}

export async function deleteThreadFromFirestore(userId: string, threadId: string) {
  if (!userId || !threadId) return;
  try {
    const threadRef = doc(db, 'users', userId, 'threads', threadId);
    await deleteDoc(threadRef);
  } catch (e) {
    console.warn('Could not delete thread from Firestore:', e);
  }
}

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

export async function loadUserDocumentsFromFirestore(userId: string) {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'users', userId, 'documents'));
    const snapshot = await getDocs(q);
    const docs: any[] = [];
    snapshot.forEach((docSnap) => {
      docs.push(docSnap.data());
    });
    return docs.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (e) {
    console.warn('Could not load user documents from Firestore:', e);
    return [];
  }
}

export async function deleteDocumentFromFirestore(userId: string, docId: string) {
  if (!userId || !docId) return;
  try {
    const docRef = doc(db, 'users', userId, 'documents', docId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Could not delete document from Firestore:', e);
  }
}
