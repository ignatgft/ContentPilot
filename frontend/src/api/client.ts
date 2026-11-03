const API_BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const SESSION_EXPIRED_EVENT = 'cp:session-expired';

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data?.token) {
      localStorage.setItem('token', data.token);
      return data.token as string;
    }
  } catch {
    // network failure — treat as refresh failure
  }
  return null;
}

async function renewSessionOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('/api/') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `Ошибка сервера (${response.status})`;
    throw new ApiError(response.status, errorMsg);
  }

  return data as T;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Endpoints that are part of the auth session itself must not trigger a refresh loop
  const isAuthAction =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/register') ||
    endpoint.startsWith('/auth/google') ||
    endpoint.startsWith('/auth/refresh');

  try {
    return await doRequest<T>(endpoint, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !isAuthAction) {
      // Access token likely expired (15 min) — try to silently rotate it via
      // the httpOnly refresh cookie, then replay the original request once.
      const newToken = await renewSessionOnce();
      if (newToken) {
        return await doRequest<T>(endpoint, options);
      }

      // Refresh failed — the session is really over.
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw err;
  }
}
