import jsQR from 'jsqr';

export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function toCanvas(img: CanvasImageSource, maxSize = 2048): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  let w = (img as HTMLImageElement).naturalWidth || (img as any).width;
  let h = (img as HTMLImageElement).naturalHeight || (img as any).height;
  if (w > maxSize || h > maxSize) {
    if (w > h) {
      h = Math.round((h * maxSize) / w);
      w = maxSize;
    } else {
      w = Math.round((w * maxSize) / h);
      h = maxSize;
    }
  }
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function enhanceContrast(src: HTMLCanvasElement, contrast = 25): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  const srcCtx = src.getContext('2d');
  if (!ctx || !srcCtx) throw new Error('Canvas context not available');

  const imageData = srcCtx.getImageData(0, 0, src.width, src.height);
  const d = imageData.data;
  // Contrast algorithm
  const c = (contrast / 100) + 1; // factor
  const intercept = 128 * (1 - c);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] * c + intercept));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * c + intercept));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * c + intercept));
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function extractQrRegionAndEnhance(file: File): Promise<Blob> {
  const img = await loadImageFile(file);
  const baseCanvas = toCanvas(img, 1600);
  const ctx = baseCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  const imageData = ctx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);

  const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
  if (!result || !result.location) {
    // If cannot detect, just return resized original as PNG
    return await new Promise((resolve) => baseCanvas.toBlob(b => resolve(b as Blob), 'image/png', 1));
  }

  const pts = result.location;
  const xs = [pts.topLeftCorner.x, pts.topRightCorner.x, pts.bottomLeftCorner.x, pts.bottomRightCorner.x];
  const ys = [pts.topLeftCorner.y, pts.topRightCorner.y, pts.bottomLeftCorner.y, pts.bottomRightCorner.y];
  let minX = Math.max(0, Math.min(...xs));
  let maxX = Math.min(baseCanvas.width, Math.max(...xs));
  let minY = Math.max(0, Math.min(...ys));
  let maxY = Math.min(baseCanvas.height, Math.max(...ys));

  // Add padding around QR area
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.15);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(baseCanvas.width, maxX + pad);
  maxY = Math.min(baseCanvas.height, maxY + pad);

  const cropW = Math.max(1, Math.round(maxX - minX));
  const cropH = Math.max(1, Math.round(maxY - minY));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Canvas context not available');
  cropCtx.drawImage(baseCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  // Enhance contrast slightly for print clarity
  const enhanced = enhanceContrast(cropCanvas, 30);

  return new Promise((resolve) => enhanced.toBlob(b => resolve(b as Blob), 'image/png', 1));
}
