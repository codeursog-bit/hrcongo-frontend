import { api } from '@/services/api';
import { DEMO_MODE } from '@/lib/demo/config';

export async function prepareLogo(file: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error('Choisissez un fichier PNG, JPEG ou WebP de 10 Mo maximum.');
  }
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 600 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de redimensionner cette image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let url = canvas.toDataURL('image/webp', 0.88);
    if (url.length > 400_000) url = canvas.toDataURL('image/webp', 0.65);
    if (url.length > 400_000) throw new Error('Le logo préparé dépasse 300 Ko.');
    return url;
  } finally {
    image.close();
  }
}

export async function logoColors(url: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, 32, 32);
  const counts = new Map<string, number>();
  const { data } = context.getImageData(0, 0, 32, 32);
  for (let i = 0; i < data.length; i += 4) {
    const rgb = [data[i], data[i + 1], data[i + 2]];
    if (data[i + 3] < 180 || Math.min(...rgb) > 235) continue;
    const code = '#' + rgb.map(value => Math.min(255, Math.round(value / 32) * 32).toString(16).padStart(2, '0')).join('');
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([color]) => color);
}

export async function uploadDocumentLogo(assetUrl: string, docType = 'PAYSLIP') {
  if (DEMO_MODE || !assetUrl.startsWith('data:')) return assetUrl;
  const blob = await (await fetch(assetUrl)).blob();
  const suffix = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpeg' : 'webp';
  const form = new FormData();
  form.append('logo', blob, `logo.${suffix}`);
  const result = await api.postFormData<{ logo: string }>(`/document-layouts/${docType}/upload-logo`, form);
  return result.logo;
}
