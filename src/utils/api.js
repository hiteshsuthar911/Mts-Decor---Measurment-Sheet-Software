// Central axios-like fetch wrapper for the MS PRO API
const isCapacitor = typeof window !== 'undefined' && (
  window.Capacitor !== undefined ||
  window.location.protocol === 'capacitor:' ||
  window.location.protocol === 'ionic:' ||
  (window.location.hostname === 'localhost' && !window.location.port)
);
const isElectron = typeof window !== 'undefined' && (window.isElectron || window.location.protocol === 'file:');
const isNativeApp = isCapacitor || isElectron;

const PROD_API_URL = 'https://mts-decor-measurment-sheet-software.onrender.com/api';
const DEFAULT_PROD_URL = isNativeApp ? PROD_API_URL : '/api';
const BASE_URL = import.meta.env.VITE_API_URL || (isNativeApp ? PROD_API_URL : (import.meta.env.PROD ? DEFAULT_PROD_URL : 'http://localhost:5001/api'));

function getToken() {
  try {
    const raw = localStorage.getItem('MS_PRO_AUTH_V1');
    return raw ? JSON.parse(raw).token : null;
  } catch { return null; }
}

async function request(method, path, body) {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  
  const res = await fetch(url, {
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
      const currentPath = window.location.pathname || '';
      const isPublicPath = currentPath.startsWith('/sign') || 
                           currentPath.startsWith('/review') || 
                           currentPath.startsWith('/engineer') || 
                           currentPath.startsWith('/site-review') || 
                           currentPath.startsWith('/login') || 
                           currentPath.startsWith('/c/') || 
                           currentPath.startsWith('/construction') || 
                           currentPath.startsWith('/download') || 
                           currentPath.startsWith('/apps');
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

export { BASE_URL, getToken, isNativeApp };
