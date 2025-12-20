/**
 * Utility for compressing images before upload
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 1,
};

/**
 * Compresses an image file and returns a compressed Blob
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> => {
  const { maxWidth, maxHeight, quality, maxSizeMB } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth! || height > maxHeight!) {
          const ratio = Math.min(maxWidth! / width, maxHeight! / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality adjustment
        const compressWithQuality = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              // If still too large and quality can be reduced, try again
              const maxBytes = maxSizeMB! * 1024 * 1024;
              if (blob.size > maxBytes && currentQuality > 0.3) {
                compressWithQuality(currentQuality - 0.1);
              } else {
                resolve(blob);
              }
            },
            "image/jpeg",
            currentQuality
          );
        };

        compressWithQuality(quality!);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Create object URL from file
    const url = URL.createObjectURL(file);
    img.src = url;

    // Cleanup URL after image loads
    img.onload = ((originalOnload) => {
      return function (this: HTMLImageElement, ev: Event) {
        URL.revokeObjectURL(url);
        if (originalOnload) {
          originalOnload.call(this, ev);
        }
      };
    })(img.onload);
  });
};

/**
 * Compresses an image Blob and returns a compressed Blob
 */
export const compressBlob = async (
  blob: Blob,
  options: CompressionOptions = {}
): Promise<Blob> => {
  const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
  return compressImage(file, options);
};

/**
 * Checks if a file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};

/**
 * Formats file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
