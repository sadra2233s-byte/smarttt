import oauthConfig from '../../firebase-applet-config.json';
import { AppState } from '../types';

const DRIVE_FILE_NAME = 'smart_planner_backup.json';

// In-memory token cache with fallback to sessionStorage for persistent session
let cachedAccessToken: string | null = null;
let cachedEmail: string | null = null;

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken || localStorage.getItem('google_drive_access_token');
}

export function setGoogleAccessToken(token: string | null) {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem('google_drive_access_token', token);
  } else {
    localStorage.removeItem('google_drive_access_token');
  }
}

export function getActiveGoogleEmail(): string | null {
  return cachedEmail || localStorage.getItem('google_drive_email');
}

export function setActiveGoogleEmail(email: string | null) {
  cachedEmail = email;
  if (email) {
    localStorage.setItem('google_drive_email', email);
  } else {
    localStorage.removeItem('google_drive_email');
  }
}

export function getStoredClientId(): string {
  return localStorage.getItem('google_drive_client_id') || '391522338784-642sdg0ssfnd6luc8f7lea6oihs1hhq7.apps.googleusercontent.com';
}

export function setStoredClientId(clientId: string) {
  if (clientId.trim()) {
    localStorage.setItem('google_drive_client_id', clientId.trim());
  } else {
    localStorage.removeItem('google_drive_client_id');
  }
}

export function logoutGoogleDrive() {
  setGoogleAccessToken(null);
  setActiveGoogleEmail(null);
}

// Dynamically load Google Identity Services script
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    
    // Check if script is already added to document
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

// Authenticate directly using Google Identity Services (GIS) Token Client Flow (Implicit Flow)
// This uses a popup window communicating directly with Google, avoiding any middleman and redirect_uri mismatch issues!
export async function requestGisToken(clientId: string, promptConsent: boolean = true): Promise<{ email: string; token: string }> {
  await loadGisScript();

  return new Promise((resolve, reject) => {
    try {
      if (!(window as any).google?.accounts?.oauth2) {
        throw new Error('کتابخانه ورود گوگل بارگذاری نشد. لطفاً چند لحظه بعد مجدداً تلاش کنید.');
      }

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error || 'خطا در احراز هویت با گوگل.'));
            return;
          }
          if (!response.access_token) {
            reject(new Error('توکن دسترسی معتبر از گوگل دریافت نشد.'));
            return;
          }

          const token = response.access_token;
          
          try {
            // Get user email directly from Google UserInfo API
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            let email = getActiveGoogleEmail() || 'حساب گوگل';
            if (userInfoRes.ok) {
              const userInfo = await userInfoRes.json();
              if (userInfo.email) email = userInfo.email;
            }
            
            setGoogleAccessToken(token);
            setActiveGoogleEmail(email);

            resolve({ email, token });
          } catch (profileErr) {
            // Fallback if profile info fetch fails
            setGoogleAccessToken(token);
            const fallbackEmail = getActiveGoogleEmail() || 'حساب گوگل';
            setActiveGoogleEmail(fallbackEmail);
            resolve({ email: fallbackEmail, token });
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err.message || 'خطا در ارتباط با گوگل.'));
        }
      });

      client.requestAccessToken({ prompt: promptConsent ? 'consent' : '' });
    } catch (err: any) {
      reject(new Error(err.message || 'خطا در راه‌اندازی احراز هویت گوگل.'));
    }
  });
}

// Find existing backup file ID in Google Drive
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
export async function saveToGoogleDrive(state: AppState, isRetry: boolean = false): Promise<boolean> {
  let token = getGoogleAccessToken();
  if (!token) {
    // Attempt silent auto-refresh if previously logged in
    if (!isRetry && getActiveGoogleEmail()) {
      try {
        const renewed = await requestGisToken(getStoredClientId(), false);
        token = renewed.token;
      } catch {
        throw new Error('نشست گوگل شما منقضی شده است. لطفاً روی دکمه «تمدید نشست» کلیک کنید.');
      }
    } else {
      throw new Error('ابتدا باید به حساب گوگل خود متصل شوید.');
    }
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
      setGoogleAccessToken(null); // Clear expired token, keep active email
      if (!isRetry) {
        try {
          const renewed = await requestGisToken(getStoredClientId(), false);
          return await saveToGoogleDrive(state, true);
        } catch {
          throw new Error('نشست گوگل شما منقضی شده است. لطفاً روی دکمه «تمدید نشست» کلیک کنید.');
        }
      }
      throw new Error('نشست گوگل شما منقضی شده است. لطفاً روی دکمه «تمدید نشست» کلیک کنید.');
    }
    if (err.message === 'INSUFFICIENT_SCOPE') {
      throw new Error('عدم تایید دسترسی به گوگل درایو. حتما هنگام اتصال تیک دسترسی را فعال کنید.');
    }
    throw err;
  }
}

// Load state from Google Drive JSON file
export async function loadFromGoogleDrive(isRetry: boolean = false): Promise<AppState | null> {
  let token = getGoogleAccessToken();
  if (!token) {
    // Attempt silent auto-refresh if previously logged in
    if (!isRetry && getActiveGoogleEmail()) {
      try {
        const renewed = await requestGisToken(getStoredClientId(), false);
        token = renewed.token;
      } catch {
        throw new Error('نشست گوگل شما منقضی شده است. لطفاً روی دکمه «تمدید نشست» کلیک کنید.');
      }
    } else {
      throw new Error('ابتدا باید به حساب گوگل خود متصل شوید.');
    }
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
      setGoogleAccessToken(null); // Clear expired token, keep active email
      if (!isRetry) {
        try {
          const renewed = await requestGisToken(getStoredClientId(), false);
          return await loadFromGoogleDrive(true);
        } catch {
          throw new Error('نشست گوگل شما منقضی شده است. لطفاً روی دکمه «تمدید نشست» کلیک کنید.');
        }
      }
      throw new Error('نشست گوگل شما منقضی شده است. لطفاً روی دکمه «تمدید نشست» کلیک کنید.');
    }
    if (err.message === 'INSUFFICIENT_SCOPE') {
      throw new Error('عدم تایید دسترسی به گوگل درایو. حتما هنگام اتصال تیک دسترسی را فعال کنید.');
    }
    throw err;
  }
}
