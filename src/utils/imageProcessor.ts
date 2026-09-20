
/**
 * מעבד תמונות בצד הלקוח:
 * 1. תמיכה בצילומי מובייל כבדים (עד 25MB)
 * 2. שיטת טעינה מרובת-שלבים (URL.createObjectURL + ArrayBuffer + FileReader)
 * 3. שינוי גודל (Resize) חכם תוך שמירה על יחס גובה-רוחב
 * 4. המרה ל-WebP עם גיבוי מלא ל-JPEG (עבור דפדפני Safari ומובייל ישנים)
 * 5. כיווץ איכות ללא דליפות זיכרון
 */

/**
 * טוען אלמנט תמונה בבטחה מתוך File או Blob בעזרת אסטרטגיות שונות
 */
const loadImageFromFile = async (file: File | Blob): Promise<{ img: HTMLImageElement; cleanup: () => void }> => {
  // Strategy 1: URL.createObjectURL (Fastest, zero memory duplication)
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = objectUrl;
      });

      if (loaded && img.naturalWidth > 0 && img.naturalHeight > 0) {
        return {
          img,
          cleanup: () => {
            try {
              URL.revokeObjectURL(objectUrl);
            } catch {
              // ignore
            }
          }
        };
      }
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn('URL.createObjectURL strategy failed, trying arrayBuffer...', err);
    }
  }

  // Strategy 2: ArrayBuffer -> Blob -> URL.createObjectURL
  if (file.arrayBuffer) {
    try {
      const buffer = await file.arrayBuffer();
      const mimeType = file.type || 'image/jpeg';
      const blob = new Blob([buffer], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = objectUrl;
      });

      if (loaded && img.naturalWidth > 0 && img.naturalHeight > 0) {
        return {
          img,
          cleanup: () => {
            try {
              URL.revokeObjectURL(objectUrl);
            } catch {
              // ignore
            }
          }
        };
      }
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn('ArrayBuffer strategy failed, trying FileReader...', err);
    }
  }

  // Strategy 3: FileReader.readAsDataURL
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          return reject(new Error('תוכן הקובץ אינו בפורמט תקין.'));
        }
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            resolve({ img, cleanup: () => {} });
          } else {
            reject(new Error('טעינת התמונה נכשלה. ממדי התמונה אינם תקינים.'));
          }
        };
        img.onerror = () => reject(new Error('טעינת התמונה נכשלה. הקובץ עשוי להיות פגום.'));
        img.src = result;
      };
      reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה. נסה לבחור את התמונה מחדש.'));
      reader.readAsDataURL(file);
    } catch (err: any) {
      reject(new Error(`קריאת הקובץ נכשלה: ${err?.message || 'שגיאה לא צפויה'}`));
    }
  });
};

export const processImage = async (
  file: File | Blob, 
  maxWidth = 1600, 
  quality = 0.85,
  targetSizeKB = 800
): Promise<{ blob: Blob; dataUrl: string }> => {
  // ולידציה בסיסית לגודל קובץ מקורי (עד 25MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('הקובץ גדול מדי. הגודל המקסימלי המותר הוא 25MB.');
  }

  const { img, cleanup } = await loadImageFromFile(file);

  try {
    const canvas = document.createElement('canvas');
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxWidth) {
      height = Math.round((maxWidth / width) * height);
      width = maxWidth;
    }

    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('לא ניתן ליצור הקשר Canvas לעיבוד התמונה.');
    }

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Compress iteratively to target size with fallback between WebP and JPEG
    let currentQuality = Math.min(1.0, Math.max(0.2, quality));
    let bestBlob: Blob | null = null;
    let bestDataUrl: string = '';
    let mimeType = 'image/webp';

    // Check if webp is supported on canvas
    const testDataUrl = canvas.toDataURL('image/webp', 0.8);
    if (!testDataUrl.startsWith('data:image/webp')) {
      mimeType = 'image/jpeg';
    }

    // Try compress
    for (let attempts = 0; attempts < 4; attempts++) {
      try {
        const dataUrl = canvas.toDataURL(mimeType, currentQuality);
        // Create blob from dataURL for maximum cross-browser reliability
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });

        bestBlob = blob;
        bestDataUrl = dataUrl;

        if (blob.size <= targetSizeKB * 1024 || currentQuality <= 0.3) {
          break;
        }
        currentQuality = Math.max(0.25, currentQuality - 0.2);
      } catch (e) {
        console.warn('Canvas conversion attempt error:', e);
        if (mimeType === 'image/webp') {
          mimeType = 'image/jpeg';
        } else {
          break;
        }
      }
    }

    if (bestBlob && bestDataUrl) {
      return { blob: bestBlob, dataUrl: bestDataUrl };
    }

    // Ultimate fallback: direct jpeg dataURL
    const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const byteString = atob(fallbackDataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const fallbackBlob = new Blob([ab], { type: 'image/jpeg' });

    return { blob: fallbackBlob, dataUrl: fallbackDataUrl };
  } finally {
    cleanup();
  }
};

/**
 * כיווץ תמונת Base64 (שימושי לצילומי מצלמה)
 */
export const compressBase64Image = async (
  base64: string,
  maxWidth = 1024,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxWidth) {
        height = Math.round((maxWidth / width) * height);
        width = maxWidth;
      }

      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(base64);
      }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = base64;
  });
};
