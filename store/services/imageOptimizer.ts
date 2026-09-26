/**
 * Client-Side Image Optimizer
 *
 * Resizes and compresses image files directly in the browser before upload to prevent
 * excessive JVM heap memory consumption (e.g., 48MP uncompressed bitmap spikes) on
 * memory-constrained backends (like 512MB RAM containers).
 */

export interface ImageOptimizerOptions {
  /** Maximum width or height in pixels. Defaults to 1920. */
  maxDimension?: number;
  /** Compression quality between 0 and 1. Defaults to 0.85 (85%). */
  quality?: number;
  /** Preferred target format. Defaults to 'image/jpeg', or 'image/webp' if source is webp. */
  preferredFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface OptimizedImageResult {
  optimizedFile: File;
  previewUrl: string;
  sizeStr: string;
  originalSizeStr: string;
  width: number;
  height: number;
  isResized: boolean;
}

/**
 * Format bytes into a clean, human-readable string (KB or MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Calculate scaled dimensions that never upscale and maintain strict aspect ratio.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number = 1920
): { width: number; height: number; isResized: boolean } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: Math.max(1, origWidth), height: Math.max(1, origHeight), isResized: false };
  }

  // Never upscale smaller images
  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { width: origWidth, height: origHeight, isResized: false };
  }

  const scale = Math.min(maxDimension / origWidth, maxDimension / origHeight);
  return {
    width: Math.max(1, Math.round(origWidth * scale)),
    height: Math.max(1, Math.round(origHeight * scale)),
    isResized: true,
  };
}

/**
 * Detect whether a canvas has transparent pixels (e.g., in a PNG).
 */
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    // Step by 40 to check across the entire image quickly without checking all 8M channels
    for (let i = 3; i < imgData.length; i += 40) {
      if (imgData[i] < 250) {
        return true;
      }
    }
  } catch {
    // If getImageData fails due to security/context, assume no transparency
    return false;
  }
  return false;
}

/**
 * Resize an image to maximum 1920px (preserving aspect ratio, never upscaling)
 * and compress to JPEG or WebP at 80-85% quality before returning a standard File.
 */
export async function resizeAndCompressImage(
  file: File,
  options: ImageOptimizerOptions = {}
): Promise<OptimizedImageResult> {
  const maxDim = options.maxDimension ?? 1920;
  const quality = options.quality ?? 0.85;
  const origSizeStr = formatFileSize(file.size);

  // If running on server or environment without canvas, return original
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      optimizedFile: file,
      previewUrl: '',
      sizeStr: origSizeStr,
      originalSizeStr: origSizeStr,
      width: 0,
      height: 0,
      isResized: false,
    };
  }

  // Animated GIFs: bypass canvas resizing to preserve animation frames
  if (file.type.toLowerCase() === 'image/gif') {
    const previewUrl = URL.createObjectURL(file);
    return {
      optimizedFile: file,
      previewUrl,
      sizeStr: origSizeStr,
      originalSizeStr: origSizeStr,
      width: 0,
      height: 0,
      isResized: false,
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const { width: targetWidth, height: targetHeight, isResized } = calculateTargetDimensions(
          img.width,
          img.height,
          maxDim
        );

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: true });

        if (!ctx) {
          resolve({
            optimizedFile: file,
            previewUrl: objectUrl,
            sizeStr: origSizeStr,
            originalSizeStr: origSizeStr,
            width: img.width,
            height: img.height,
            isResized: false,
          });
          return;
        }

        // Apply high-quality bicubic/bilinear smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image scaled to target dimensions
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Determine optimal format
        let exportFormat = options.preferredFormat;
        if (!exportFormat) {
          const isSourcePng = file.type.toLowerCase().includes('png');
          const isSourceWebp = file.type.toLowerCase().includes('webp');

          if (isSourceWebp) {
            exportFormat = 'image/webp';
          } else if (isSourcePng) {
            // If transparent, keep PNG (or WebP if supported); if solid, convert to JPEG for high compression
            const transparent = hasTransparency(ctx, targetWidth, targetHeight);
            exportFormat = transparent ? 'image/png' : 'image/jpeg';
          } else {
            exportFormat = 'image/jpeg';
          }
        }

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (blob && (blob.size < file.size || isResized)) {
              // Adjust filename extension to match output format
              let newFileName = file.name;
              if (exportFormat === 'image/jpeg' && !file.name.match(/\.(jpe?g)$/i)) {
                newFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
              } else if (exportFormat === 'image/webp' && !file.name.match(/\.webp$/i)) {
                newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
              }

              const optimizedFile = new File([blob], newFileName, {
                type: blob.type || exportFormat,
                lastModified: Date.now(),
              });

              const optSizeStr = formatFileSize(blob.size);
              const previewUrl = URL.createObjectURL(optimizedFile);

              resolve({
                optimizedFile,
                previewUrl,
                sizeStr: optSizeStr,
                originalSizeStr: origSizeStr,
                width: targetWidth,
                height: targetHeight,
                isResized,
              });
            } else {
              // If compression didn't produce smaller file and dimensions were already <= maxDim
              resolve({
                optimizedFile: file,
                previewUrl: URL.createObjectURL(file),
                sizeStr: origSizeStr,
                originalSizeStr: origSizeStr,
                width: img.width,
                height: img.height,
                isResized: false,
              });
            }
          },
          exportFormat,
          quality
        );
      } catch (err) {
        console.error('Error during canvas image optimization', err);
        resolve({
          optimizedFile: file,
          previewUrl: objectUrl,
          sizeStr: origSizeStr,
          originalSizeStr: origSizeStr,
          width: img.width,
          height: img.height,
          isResized: false,
        });
      }
    };

    img.onerror = () => {
      resolve({
        optimizedFile: file,
        previewUrl: objectUrl,
        sizeStr: origSizeStr,
        originalSizeStr: origSizeStr,
        width: 0,
        height: 0,
        isResized: false,
      });
    };

    img.src = objectUrl;
  });
}
