import { AppState } from '../types';

// Default Client ID for the Google OAuth Client
const DEFAULT_CLIENT_ID = 
  ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || 
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
}

// Authenticate using standard client-side Google OAuth 2.0 Implicit Flow with a popup
export async function requestGisToken(clientId: string): Promise<{ email: string; token: string }> {
  return new Promise((resolve, reject) => {
    // Construct authorized redirect URI (points to static callback page)
    const redirectUri = `${window.location.origin}/oauth-callback.html`;
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&prompt=consent` +
      `&select_account=true`;

    const width = 540;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      'google_oauth_popup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error('پنجره بازشو توسط مرورگر مسدود شد. لطفا اجازه باز شدن پاپ‌آپ (Pop-ups) را در مرورگر خود بدهید.'));
      return;
    }

    const messageListener = (event: MessageEvent) => {
      // Validate origin to ensure security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        cleanup();
        resolve({
          token: event.data.accessToken,
          email: event.data.email
        });
      } else if (event.data?.type === 'GOOGLE_OAUTH_FAILURE') {
        cleanup();
        reject(new Error(event.data.error || 'اتصال ناموفق بود. خطایی رخ داد.'));
      }
    };

    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('اتصال متوقف شد. پنجره ورود توسط شما یا مرورگر بسته شد.'));
      }
    }, 1000);

    const cleanup = () => {
      window.removeEventListener('message', messageListener);
      clearInterval(checkClosedInterval);
    };

    window.addEventListener('message', messageListener);
  });
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
