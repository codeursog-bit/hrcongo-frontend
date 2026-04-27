// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// async function request<T>(endpoint: string, method: RequestMethod = 'GET', body?: any): Promise<T> {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
//   const headers: HeadersInit = {
//     'Content-Type': 'application/json',
//   };

//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   const config: RequestInit = {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : undefined,
//   };

//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, config);
    
//     const data = await response.json();

//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         const currentPath = window.location.pathname;
//         const isAdminRoute = currentPath.startsWith('/admin');
//         const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
        
//         if (!isLoginPage) {
//           localStorage.removeItem('accessToken');
//           localStorage.removeItem('refreshToken');
//           localStorage.removeItem('user');
//           window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
//           throw new Error('Session expirée');
//         }
//       }
//       throw new Error(data.message || 'Identifiants incorrects');
//     }

//     if (!response.ok) {
//       throw new Error(data.message || `Erreur ${response.status}`);
//     }

//     return data;
//   } catch (error: any) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// // ============================================================================
// // FORMDATA (Upload de fichiers)
// // ============================================================================
// async function requestFormData<T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
//   const headers: HeadersInit = {};
//   if (token) headers['Authorization'] = `Bearer ${token}`;

//   const config: RequestInit = { method, headers, body: formData };

//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, config);
//     const data = await response.json();
    
//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         const currentPath = window.location.pathname;
//         const isAdminRoute = currentPath.startsWith('/admin');
//         const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
        
//         if (!isLoginPage) {
//           localStorage.removeItem('accessToken');
//           localStorage.removeItem('refreshToken');
//           localStorage.removeItem('user');
//           window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
//           throw new Error('Session expirée');
//         }
//       }
//       throw new Error(data.message || 'Identifiants incorrects');
//     }

//     if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);
//     return data;
//   } catch (error: any) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// // ============================================================================
// // BLOB (Téléchargement de fichiers binaires — Excel, PDF...)
// // ============================================================================
// async function requestBlob(endpoint: string): Promise<Blob> {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
//   const headers: HeadersInit = {};
//   if (token) headers['Authorization'] = `Bearer ${token}`;

//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers });
    
//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         const currentPath = window.location.pathname;
//         const isAdminRoute = currentPath.startsWith('/admin');
//         const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
//         if (!isLoginPage) {
//           localStorage.removeItem('accessToken');
//           localStorage.removeItem('refreshToken');
//           localStorage.removeItem('user');
//           window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
//         }
//       }
//       throw new Error('Session expirée');
//     }

//     if (!response.ok) throw new Error('Erreur lors du téléchargement du fichier');
//     return await response.blob();
//   } catch (error: any) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// // ============================================================================
// // ✅ NOUVEAU — TEXT (Export Sage .TXT, eTax .CSV — réponse texte brute)
// // ============================================================================
// async function requestText(endpoint: string): Promise<string> {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
//   const headers: HeadersInit = {};
//   if (token) headers['Authorization'] = `Bearer ${token}`;

//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers });

//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         const currentPath = window.location.pathname;
//         const isAdminRoute = currentPath.startsWith('/admin');
//         const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
//         if (!isLoginPage) {
//           localStorage.removeItem('accessToken');
//           localStorage.removeItem('refreshToken');
//           localStorage.removeItem('user');
//           window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
//         }
//       }
//       throw new Error('Session expirée');
//     }

//     if (!response.ok) throw new Error(`Erreur ${response.status}`);
//     return await response.text();
//   } catch (error: any) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// // ============================================================================
// // EXPORT API — TOUTES LES MÉTHODES
// // ============================================================================
// export const api = {
//   // ── Méthodes JSON standard ───────────────────────────────────────────────
//   get:    <T>(endpoint: string)              => request<T>(endpoint, 'GET'),
//   post:   <T>(endpoint: string, body: any)   => request<T>(endpoint, 'POST', body),
//   put:    <T>(endpoint: string, body: any)   => request<T>(endpoint, 'PUT', body),
//   patch:  <T>(endpoint: string, body: any)   => request<T>(endpoint, 'PATCH', body),
//   delete: <T>(endpoint: string)              => request<T>(endpoint, 'DELETE'),

//   // ── FormData (upload fichiers) ───────────────────────────────────────────
//   postFormData: <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData, 'POST'),
//   putFormData:  <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData, 'PUT'),

//   // ── Téléchargements ──────────────────────────────────────────────────────
//   getBlob: (endpoint: string) => requestBlob(endpoint),   // Excel, PDF...
//   getText: (endpoint: string) => requestText(endpoint),   // ✅ Sage .TXT, eTax .CSV
// };







// ============================================================================
// 📁 services/api.ts — Client HTTP sécurisé avec cookies HttpOnly
// ============================================================================
// Les tokens JWT voyagent désormais dans des cookies HttpOnly gérés par le
// navigateur. Ce fichier n'a plus besoin de lire/écrire localStorage pour
// les tokens — credentials: 'include' suffit à tout envoyer automatiquement.
//
// Ce qui reste en localStorage : { user } (prénom, rôle, companyId)
// → données d'affichage uniquement, pas sensibles
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ─── Gestion centralisée des 401 ─────────────────────────────────────────────
function handle401() {
  if (typeof window === 'undefined') return;
  const path        = window.location.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const isLoginPage  = path.includes('/login') || path.includes('/register');
  if (!isLoginPage) {
    // Nettoyer uniquement les données d'affichage (pas les tokens — ils sont en cookie)
    localStorage.removeItem('user');
    window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
  }
}

// ─── Requête JSON standard ────────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  method:   RequestMethod = 'GET',
  body?:    any,
): Promise<T> {
  const config: RequestInit = {
    method,
    credentials: 'include',          // ← envoie les cookies HttpOnly automatiquement
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Essai de parse JSON (certaines réponses d'erreur peuvent ne pas être du JSON)
    let data: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (response.status === 401) {
      handle401();
      const isLoginPage = typeof window !== 'undefined' &&
        (window.location.pathname.includes('/login') ||
         window.location.pathname.includes('/register'));
      throw new Error(
        isLoginPage
          ? (data.message || 'Identifiants incorrects')
          : 'Session expirée',
      );
    }

    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    // Ne pas logger les erreurs 401 (normales lors d'une déconnexion)
    if (!error.message?.includes('Session expirée') &&
        !error.message?.includes('Identifiants')) {
      console.error(`API Error [${method} ${endpoint}]:`, error.message);
    }
    throw error;
  }
}

// ─── FormData (upload fichiers) ───────────────────────────────────────────────
async function requestFormData<T>(
  endpoint:  string,
  formData:  FormData,
  method:    'POST' | 'PUT' = 'POST',
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      credentials: 'include',  // cookies automatiques
      body: formData,
      // Pas de Content-Type → le navigateur le gère avec le boundary multipart
    });

    const data = await response.json();

    if (response.status === 401) {
      handle401();
      throw new Error('Session expirée');
    }
    if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);
    return data as T;
  } catch (error: any) {
    console.error(`API FormData Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// ─── Blob (Excel, PDF, fichiers binaires) ─────────────────────────────────────
async function requestBlob(endpoint: string): Promise<Blob> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method:      'GET',
      credentials: 'include',
    });

    if (response.status === 401) {
      handle401();
      throw new Error('Session expirée');
    }
    if (!response.ok) throw new Error('Erreur lors du téléchargement du fichier');
    return await response.blob();
  } catch (error: any) {
    console.error(`API Blob Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// ─── Text (Sage .TXT, eTax .CSV) ──────────────────────────────────────────────
async function requestText(endpoint: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method:      'GET',
      credentials: 'include',
    });

    if (response.status === 401) {
      handle401();
      throw new Error('Session expirée');
    }
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    return await response.text();
  } catch (error: any) {
    console.error(`API Text Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// ─── Export API ───────────────────────────────────────────────────────────────
export const api = {
  // JSON standard
  get:    <T>(endpoint: string)              => request<T>(endpoint, 'GET'),
  post:   <T>(endpoint: string, body: any)   => request<T>(endpoint, 'POST', body),
  put:    <T>(endpoint: string, body: any)   => request<T>(endpoint, 'PUT', body),
  patch:  <T>(endpoint: string, body: any)   => request<T>(endpoint, 'PATCH', body),
  delete: <T>(endpoint: string)              => request<T>(endpoint, 'DELETE'),

  // Upload fichiers
  postFormData: <T>(endpoint: string, fd: FormData) => requestFormData<T>(endpoint, fd, 'POST'),
  putFormData:  <T>(endpoint: string, fd: FormData) => requestFormData<T>(endpoint, fd, 'PUT'),

  // Téléchargements
  getBlob: (endpoint: string) => requestBlob(endpoint),
  getText: (endpoint: string) => requestText(endpoint),
};