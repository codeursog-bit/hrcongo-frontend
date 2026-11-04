export async function recruitmentTestRequest<T>(jobId: string, candidateId: string, submit = false, body?: unknown): Promise<T> {
  const key = `recruitment-test:${candidateId}`;
  const fragmentToken = new URLSearchParams(window.location.hash.slice(1)).get('access_token');
  if (fragmentToken) {
    sessionStorage.setItem(key, fragmentToken);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  const token = sessionStorage.getItem(key);
  if (!token) throw new Error('Accès au test manquant. Utilisez le lien transmis après votre candidature ou par le recruteur.');
  const path = submit ? `/public/jobs/${jobId}/candidates/${candidateId}/submit-test` : `/public/jobs/${jobId}/test-questions`;
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${path}`, {
    method: submit ? 'POST' : 'GET', credentials: 'omit',
    headers: { Authorization: `Bearer ${token}`, ...(submit ? { 'Content-Type': 'application/json' } : {}) },
    ...(submit ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Le test est momentanément indisponible.');
  return data;
}
