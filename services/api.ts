const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(endpoint: string, method: RequestMethod = 'GET', body?: any): Promise<T> {
  // On récupère le token stocké lors du login
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
    
    // ✅ CORRECTION : Parse le JSON AVANT de vérifier le statut
    const data = await response.json();

    // ✅ Si c'est un 401 et qu'on n'est PAS sur la page de login, rediriger
    if (response.status === 401) {
      // Si on est sur /auth/login, c'est une erreur de credentials, pas de session
      const isLoginPage = typeof window !== 'undefined' && 
                          (window.location.pathname.includes('/auth/login') || 
                           window.location.pathname.includes('/auth/register'));
      
      if (!isLoginPage && typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        throw new Error('Session expirée');
      }
      
      // ✅ Sur la page de login, on garde le vrai message d'erreur du backend
      throw new Error(data.message || 'Identifiants incorrects');
    }

    // ✅ Gestion des autres erreurs HTTP
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
// ✅ NOUVELLE FONCTION POUR FORMDATA (Upload de fichiers)
// ============================================================================
async function requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // ⚠️ PAS de Content-Type pour FormData (le navigateur le gère automatiquement)

  const config: RequestInit = {
    method: 'POST',
    headers,
    body: formData,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Parse le JSON avant de vérifier le statut
    const data = await response.json();
    
    // Si non autorisé (Token expiré ou invalide)
    if (response.status === 401) {
      const isLoginPage = typeof window !== 'undefined' && 
                          (window.location.pathname.includes('/auth/login') || 
                           window.location.pathname.includes('/auth/register'));
      
      if (!isLoginPage && typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        throw new Error('Session expirée');
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
// ✅ NOUVELLE FONCTION POUR TÉLÉCHARGER DES FICHIERS (Blob)
// ============================================================================
async function requestBlob(endpoint: string): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: 'GET',
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Si non autorisé (Token expiré ou invalide)
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const isLoginPage = window.location.pathname.includes('/auth/login') || 
                           window.location.pathname.includes('/auth/register');
        
        if (!isLoginPage) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
      }
      throw new Error('Session expirée');
    }

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement du fichier');
    }

    return await response.blob();
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// ✅ EXPORT DE L'API AVEC TES MÉTHODES ORIGINALES + LES NOUVELLES
// ============================================================================
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PUT', body),
  patch: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PATCH', body),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
  
  // ✅ NOUVELLES MÉTHODES POUR L'IMPORT EXCEL
  postFormData: <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData),
  getBlob: (endpoint: string) => requestBlob(endpoint),
};


// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// async function request<T>(endpoint: string, method: RequestMethod = 'GET', body?: any): Promise<T> {
//   // On récupère le token stocké lors du login
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
    
//     // Si non autorisé (Token expiré ou invalide)
//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         // Ne pas effacer immédiatement si on est déjà sur login pour éviter les boucles infinies
//         if (!window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/auth/register')) {
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('user');
//             window.location.href = '/auth/login';
//         }
//       }
//       throw new Error('Session expirée');
//     }

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Erreur API');
//     }

//     return data;
//   } catch (error: any) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// // ============================================================================
// // ✅ NOUVELLE FONCTION POUR FORMDATA (Upload de fichiers)
// // ============================================================================
// async function requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
//   const headers: HeadersInit = {};

//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   // ⚠️ PAS de Content-Type pour FormData (le navigateur le gère automatiquement)

//   const config: RequestInit = {
//     method: 'POST',
//     headers,
//     body: formData,
//   };

//   try {
//     const response = await fetch(`${API_URL}${endpoint}`, config);
    
//     // Si non autorisé (Token expiré ou invalide)
//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         // Ne pas effacer immédiatement si on est déjà sur login pour éviter les boucles infinies
//         if (!window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/auth/register')) {
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('user');
//             window.location.href = '/auth/login';
//         }
//       }
//       throw new Error('Session expirée');
//     }

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Erreur API');
//     }

//     return data;
//   } catch (error: any) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// // ============================================================================
// // ✅ NOUVELLE FONCTION POUR TÉLÉCHARGER DES FICHIERS (Blob)
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
    
//     // Si non autorisé (Token expiré ou invalide)
//     if (response.status === 401) {
//       if (typeof window !== 'undefined') {
//         // Ne pas effacer immédiatement si on est déjà sur login pour éviter les boucles infinies
//         if (!window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/auth/register')) {
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('user');
//             window.location.href = '/auth/login';
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
// // ✅ EXPORT DE L'API AVEC TES MÉTHODES ORIGINALES + LES NOUVELLES
// // ============================================================================
// export const api = {
//   get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
//   post: <T>(endpoint: string, body: any) => request<T>(endpoint, 'POST', body),
//   put: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PUT', body),
//   patch: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PATCH', body),
//   delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
  
//   // ✅ NOUVELLES MÉTHODES POUR L'IMPORT EXCEL
//   postFormData: <T>(endpoint: string, formData: FormData) => requestFormData<T>(endpoint, formData),
//   getBlob: (endpoint: string) => requestBlob(endpoint),
// };
