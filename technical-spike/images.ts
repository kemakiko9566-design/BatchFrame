import { layout, type ImageDocument } from '../packages/core/layout';
import { render } from '../packages/renderer-canvas/render';
export async function decode(blob: Blob): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const image = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      return { image, width: image.width, height: image.height, close: () => image.close() };
    } catch { /* Use native image decoding on mobile browsers when needed. */ }
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    image.src = url; await image.decode();
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}
export function canvasBlob(canvas: HTMLCanvasElement, quality = .95): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob?.type === 'image/jpeg' ? resolve(blob) : reject(new Error('无法生成 JPEG 图片')), 'image/jpeg', quality));
}
export async function renderPhoto(blob: Blob, settings: Omit<ImageDocument, 'width' | 'height'>) {
  const decoded = await decode(blob);
  const canvas = document.createElement('canvas');
  try {
    const graph = layout({ width: decoded.width, height: decoded.height, ...settings });
    canvas.width = graph.width; canvas.height = graph.height;
    render(graph, decoded.image, canvas);
    return { blob: await canvasBlob(canvas), width: graph.width, height: graph.height };
  } finally { decoded.close(); canvas.width = canvas.height = 1; }
}
export async function thumbnail(blob: Blob) {
  const decoded = await decode(blob);
  const canvas = document.createElement('canvas');
  try {
    const scale = Math.min(1, 800 / Math.max(decoded.width, decoded.height));
    canvas.width = Math.max(1, Math.round(decoded.width * scale)); canvas.height = Math.max(1, Math.round(decoded.height * scale));
    canvas.getContext('2d')!.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);
    return { blob: await canvasBlob(canvas, .88), width: decoded.width, height: decoded.height };
  } finally { decoded.close(); canvas.width = canvas.height = 1; }
}
