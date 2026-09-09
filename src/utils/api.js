// Central axios-like fetch wrapper for the MS PRO API
const isElectron = typeof window !== 'undefined' && (window.isElectron || window.location.protocol === 'file:');
const DEFAULT_PROD_URL = isElectron ? 'https://mts-decor-measurment-sheet-software.onrender.com/api' : '/api';
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? DEFAULT_PROD_URL : (isElectron ? 'https://mts-decor-measurment-sheet-software.onrender.com/api' : 'http://localhost:5001/api'));

function getToken() {
  try {
    const raw = localStorage.getItem('MS_PRO_AUTH_V1');
    return raw ? JSON.parse(raw).token : null;
  } catch { return null; }
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      const isPublicPath = path.startsWith('/sign') || 
                           path.startsWith('/review') || 
                           path.startsWith('/engineer') || 
                           path.startsWith('/site-review') || 
                           path.startsWith('/login') || 
                           path.startsWith('/c/') || 
                           path.startsWith('/construction') || 
                           path.startsWith('/download') || 
                           path.startsWith('/apps');
      if (!isPublicPath) {
        localStorage.removeItem('MS_PRO_AUTH_V1');
        window.location.replace('/login');
      }
    }
    throw new Error(data.message || 'API ERROR');
  }
  return data;
}

export const api = {
  get:    (path)        => request('GET', path),
  post:   (path, body)  => request('POST', path, body),
  put:    (path, body)  => request('PUT', path, body),
  delete: (path)        => request('DELETE', path),
};

export { BASE_URL, getToken };
