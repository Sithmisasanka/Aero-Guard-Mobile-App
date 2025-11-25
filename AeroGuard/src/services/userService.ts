import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, firestore } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Small exponential backoff retry helper for Firestore writes
async function withRetries<T>(fn: () => Promise<T>, retries = 3, baseDelay = 300): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt += 1;
      const isLast = attempt > retries;
      console.warn(`Firestore operation failed (attempt ${attempt}):`, err?.message || err);
      if (isLast) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying Firestore operation in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

export type StoredUser = {
  id: string;
  name: string;
  email?: string;
  createdAt: number;
};

const USERS_KEY = 'aeroguard_users';
const CURRENT_USER_KEY = 'aeroguard_current_user';

export async function listUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch (e) {
    console.warn('Failed parsing users list', e);
    return [];
  }
}

export async function saveUser(user: StoredUser): Promise<void> {
  // ensure id
  const toSave = { ...user, id: user.id || Date.now().toString() };

  // persist locally first (immediate response)
  const users = await listUsers();
  const others = users.filter(u => u.id !== toSave.id);
  const next = [toSave, ...others];
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(next));
  await setCurrentUserAndNotify(toSave);

  // try write to Firestore (best-effort, non-blocking)
  // Prefer the explicitly initialized `firestore` instance (with RN settings), fallback to `db`
  const activeDb = firestore || db;

  if (activeDb) {
    try {
      console.log('Attempting to save user to Firestore:', toSave.id);
      await withRetries(() => setDoc(doc(activeDb, 'users', toSave.id), toSave, { merge: true }));
      console.log('User saved to Firestore successfully');
    } catch (e: any) {
      console.warn('Firestore saveUser failed after retries, user saved locally:', e?.message || e);
      // Don't throw error - local save succeeded
    }
  } else {
    console.log('Firestore not available, user saved locally only');
  }
}

export async function removeUser(id: string): Promise<void> {
  // try delete from Firestore (best-effort)
  const activeDb2 = firestore || db;
  try {
    if (activeDb2) {
      await withRetries(() => deleteDoc(doc(activeDb2, 'users', id)));
    } else {
      console.log('Firestore not available for delete operation');
    }
  } catch (e) {
    console.warn('Firestore delete failed after retries, continuing:', e);
  }

  const users = await listUsers();
  const next = users.filter(u => u.id !== id);
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(next));
  const current = await getCurrentUser();
  if (current?.id === id) {
    await setCurrentUserAndNotify(null);
  }
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  // try local first
  const users = await listUsers();
  const found = users.find(u => u.id === id);
  if (found) {
    console.log('User found locally:', found.name);
    return found;
  }

  // fallback to Firestore if available
  const activeDb = firestore || db;
  if (activeDb) {
    try {
      console.log('Checking Firestore for user:', id);
      const snap = await getDoc(doc(activeDb, 'users', id));
      if (snap.exists()) {
        const user = snap.data() as StoredUser;
        console.log('User found in Firestore:', user.name);
        return user;
      }
    } catch (e: any) {
      console.warn('Firestore getUserById failed:', (e as any)?.message || e);
    }
  } else {
    console.log('Firestore not available for user lookup');
  }

  console.log('User not found:', id);
  return null;
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const local = await listUsers();
  if (local.length) return local;

  try {
    const activeDb = firestore || db;
    if (!activeDb) {
      console.log('Firestore not available for getAllUsers');
      return [];
    }
    const snaps = await getDocs(collection(activeDb, 'users'));
    return snaps.docs.map(d => d.data() as StoredUser);
  } catch (e) {
    console.warn('Firestore getAllUsers failed:', e);
    return [];
  }
}

export async function setCurrentUser(user: StoredUser | null): Promise<void> {
  if (!user) {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export async function getCurrentUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch (e) {
    console.warn('Failed parsing current user', e);
    return null;
  }
}

// Simple in-memory subscription for current user changes
type UserChangeCallback = (user: StoredUser | null) => void;
const listeners: UserChangeCallback[] = [];

export function onUserChange(cb: UserChangeCallback) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// wrap setCurrentUser to notify listeners
export async function setCurrentUserAndNotify(user: StoredUser | null): Promise<void> {
  if (!user) {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } else {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  // notify
  listeners.forEach((l) => {
    try {
      l(user);
    } catch (e) {
      console.warn('userService listener error', e);
    }
  });
}
