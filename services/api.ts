
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

//     // ✅ CORRECTION : Gérer les routes admin ET user
//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         const currentPath = window.location.pathname;
        
//         // ✅ Déterminer si on est sur une route admin ou user
//         const isAdminRoute = currentPath.startsWith('/admin');
//         const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
        
//         // Si on n'est PAS sur une page de login
//         if (!isLoginPage) {
//           localStorage.removeItem('accessToken');
//           localStorage.removeItem('refreshToken');
//           localStorage.removeItem('user');
          
//           // ✅ Rediriger vers la bonne page de login selon le contexte
//           window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
//           throw new Error('Session expirée');
//         }
//       }
      
//       // Sur la page de login, on garde le vrai message d'erreur du backend
//       throw new Error(data.message || 'Identifiants incorrects');
//     }

//     // Gestion des autres erreurs HTTP
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
// // ✅ FONCTION POUR FORMDATA (Upload de fichiers)
// // ============================================================================
// async function requestFormData<T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
//   const headers: HeadersInit = {};

//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   const config: RequestInit = {
//     method,
//     headers,
//     body: formData,
//   };

//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, config);
//     const data = await response.json();
    
//     // ✅ CORRECTION : Gérer les routes admin ET user
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
// // ✅ FONCTION POUR TÉLÉCHARGER DES FICHIERS (Blob)
// // ============================================================================
// async function requestBlob(endpoint: string): Promise<Blob> {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
//   const headers: HeadersInit = {};

//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   const config: RequestInit = {
//     method: 'GET',
//     headers,
//   };

//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, config);
    
//     // ✅ CORRECTION : Gérer les routes admin ET user
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

//     if (!response.ok) {
//       throw new Error('Erreur lors du téléchargement du fichier');
//     }

//     return await response.blob();
//   } catch (error: any) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// // ============================================================================
// // ✅ EXPORT DE L'API AVEC TOUTES LES MÉTHODES
// // ============================================================================
// export const api = {
//   get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
//   post: <T>(endpoint: string, body: any) => request<T>(endpoint, 'POST', body),
//   put: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PUT', body),
//   patch: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PATCH', body),
//   delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
  
//   postFormData: <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData, 'POST'),
//   putFormData: <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData, 'PUT'),
  
//   getBlob: (endpoint: string) => requestBlob(endpoint),
  
// };



const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(endpoint: string, method: RequestMethod = 'GET', body?: any): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    const data = await response.json();

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAdminRoute = currentPath.startsWith('/admin');
        const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
        
        if (!isLoginPage) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
          throw new Error('Session expirée');
        }
      }
      throw new Error(data.message || 'Identifiants incorrects');
    }

    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// FORMDATA (Upload de fichiers)
// ============================================================================
async function requestFormData<T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config: RequestInit = { method, headers, body: formData };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAdminRoute = currentPath.startsWith('/admin');
        const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
        
        if (!isLoginPage) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
          throw new Error('Session expirée');
        }
      }
      throw new Error(data.message || 'Identifiants incorrects');
    }

    if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);
    return data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// BLOB (Téléchargement de fichiers binaires — Excel, PDF...)
// ============================================================================
async function requestBlob(endpoint: string): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers });
    
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAdminRoute = currentPath.startsWith('/admin');
        const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
        if (!isLoginPage) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
        }
      }
      throw new Error('Session expirée');
    }

    if (!response.ok) throw new Error('Erreur lors du téléchargement du fichier');
    return await response.blob();
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// ✅ NOUVEAU — TEXT (Export Sage .TXT, eTax .CSV — réponse texte brute)
// ============================================================================
async function requestText(endpoint: string): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAdminRoute = currentPath.startsWith('/admin');
        const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');
        if (!isLoginPage) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = isAdminRoute ? '/admin/login' : '/auth/login';
        }
      }
      throw new Error('Session expirée');
    }

    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    return await response.text();
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// EXPORT API — TOUTES LES MÉTHODES
// ============================================================================
export const api = {
  // ── Méthodes JSON standard ───────────────────────────────────────────────
  get:    <T>(endpoint: string)              => request<T>(endpoint, 'GET'),
  post:   <T>(endpoint: string, body: any)   => request<T>(endpoint, 'POST', body),
  put:    <T>(endpoint: string, body: any)   => request<T>(endpoint, 'PUT', body),
  patch:  <T>(endpoint: string, body: any)   => request<T>(endpoint, 'PATCH', body),
  delete: <T>(endpoint: string)              => request<T>(endpoint, 'DELETE'),

  // ── FormData (upload fichiers) ───────────────────────────────────────────
  postFormData: <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData, 'POST'),
  putFormData:  <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData, 'PUT'),

  // ── Téléchargements ──────────────────────────────────────────────────────
  getBlob: (endpoint: string) => requestBlob(endpoint),   // Excel, PDF...
  getText: (endpoint: string) => requestText(endpoint),   // ✅ Sage .TXT, eTax .CSV
};