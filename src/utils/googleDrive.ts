import { AppState } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const DEFAULT_CLIENT_ID = 
  ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || 
  firebaseConfig.oAuthClientId || 
  '220867813659-u1klh3q50rkvui3cafhvfoglng44u136.apps.googleusercontent.com';
const DRIVE_FILE_NAME = 'smart_planner_backup.json';

export function getStoredClientId(): string {
  return localStorage.getItem('google_drive_client_id') || DEFAULT_CLIENT_ID;
}

export function setStoredClientId(clientId: string) {
  if (clientId.trim()) {
    localStorage.setItem('google_drive_client_id', clientId.trim());
  } else {
    localStorage.removeItem('google_drive_client_id');
  }
}

export function getGoogleAccessToken(): string | null {
  return localStorage.getItem('google_drive_access_token');
}

export function setGoogleAccessToken(token: string) {
  if (token) {
    localStorage.setItem('google_drive_access_token', token);
  } else {
    localStorage.removeItem('google_drive_access_token');
  }
}

export function getActiveGoogleEmail(): string | null {
  return localStorage.getItem('google_drive_email');
}

export function setActiveGoogleEmail(email: string | null) {
  if (email) {
    localStorage.setItem('google_drive_email', email);
  } else {
    localStorage.removeItem('google_drive_email');
  }
}

export function logoutGoogleDrive() {
  localStorage.removeItem('google_drive_access_token');
  localStorage.removeItem('google_drive_email');
  signOut(auth).catch((e) => console.error('خطا در خروج از فایربیس:', e));
}

// Authenticate using Firebase Auth Google Auth Provider
export async function requestGisToken(_clientId: string): Promise<{ email: string; token: string }> {
  const provider = new GoogleAuthProvider();
  // Add required scopes
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('توکن دسترسی دریافت نشد.');
    }
    const token = credential.accessToken;
    const email = result.user.email || 'حساب گوگل';
    return { email, token };
  } catch (error: any) {
    console.error('خطای احراز هویت با گوگل:', error);
    throw new Error(error.message || 'خطا در برقراری اتصال با گوگل.');
  }
}

// Find existing backup file ID
async function findBackupFileId(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('EXPIRED_TOKEN');
    if (res.status === 403) throw new Error('INSUFFICIENT_SCOPE');
    throw new Error(`خطای جستجوی فایل (${res.status})`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

// Save the state as a single JSON file in Google Drive
export async function saveToGoogleDrive(state: AppState): Promise<boolean> {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('ابتدا باید به حساب گوگل خود متصل شوید.');
  }

  try {
    const fileId = await findBackupFileId(token);
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
    };

    if (fileId) {
      // Patch file content
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('EXPIRED_TOKEN');
        if (res.status === 403) throw new Error('INSUFFICIENT_SCOPE');
        throw new Error(`خطای به‌روزرسانی فایل در گوگل درایو (${res.status})`);
      }
      return true;
    } else {
      // Create new file
      const boundary = 'smart_planner_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadataPart = JSON.stringify(metadata);
      const mediaPart = JSON.stringify(state);

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        metadataPart +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        mediaPart +
        closeDelimiter;

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('EXPIRED_TOKEN');
        if (res.status === 403) throw new Error('INSUFFICIENT_SCOPE');
        throw new Error(`خطای ایجاد فایل در گوگل درایو (${res.status})`);
      }
      return true;
    }
  } catch (err: any) {
    if (err.message === 'EXPIRED_TOKEN') {
      logoutGoogleDrive();
      throw new Error('توکن منقضی شده است. لطفا دوباره متصل شوید.');
    }
    if (err.message === 'INSUFFICIENT_SCOPE') {
      throw new Error('عدم تایید دسترسی به گوگل درایو. حتما هنگام اتصال تیک دسترسی را فعال کنید.');
    }
    throw err;
  }
}

// Load state from Google Drive JSON file
export async function loadFromGoogleDrive(): Promise<AppState | null> {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('ابتدا باید به حساب گوگل خود متصل شوید.');
  }

  try {
    const fileId = await findBackupFileId(token);
    if (!fileId) {
      return null;
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('EXPIRED_TOKEN');
      if (res.status === 403) throw new Error('INSUFFICIENT_SCOPE');
      throw new Error(`خطای دریافت فایل از درایو (${res.status})`);
    }

    const data = await res.json();
    return data as AppState;
  } catch (err: any) {
    if (err.message === 'EXPIRED_TOKEN') {
      logoutGoogleDrive();
      throw new Error('توکن منقضی شده است. لطفا دوباره متصل شوید.');
    }
    if (err.message === 'INSUFFICIENT_SCOPE') {
      throw new Error('عدم تایید دسترسی به گوگل درایو. حتما هنگام اتصال تیک دسترسی را فعال کنید.');
    }
    throw err;
  }
}
