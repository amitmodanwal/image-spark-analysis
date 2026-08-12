import type { UploadedImage } from "@/types/analysis";

const CLOUD_NAME = import.meta.env['VITE_CLOUDINARY_CLOUD_NAME'] as string | undefined;
const UPLOAD_PRESET = import.meta.env['VITE_CLOUDINARY_UPLOAD_PRESET'] as string | undefined;

export const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type.toLowerCase())) {
    return "Unsupported format. Use JPG, JPEG, PNG or WEBP.";
  }
  if (file.size > MAX_BYTES) {
    return "Image is too large. Maximum size is 10 MB.";
  }
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

async function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/**
 * Uploads an image to Cloudinary using an unsigned upload preset.
 * When Cloudinary is not configured, falls back to an inline data URL so the
 * app stays usable locally. No API secret is ever used in the browser.
 */
export async function uploadImage(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadedImage> {
  const validationError = validateImage(file);
  if (validationError) throw new Error(validationError);

  if (!cloudinaryConfigured) {
    onProgress(40);
    const dataUrl = await readAsDataUrl(file);
    const { width, height } = await imageSize(dataUrl);
    onProgress(100);
    return {
      secure_url: dataUrl,
      public_id: `local/${file.name}`,
      width,
      height,
      format: file.type.split("/")[1] ?? "jpg",
    };
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET as string);

  return new Promise<UploadedImage>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.timeout = 60_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.ontimeout = () => reject(new Error("Upload timed out. Check your connection and retry."));
    xhr.onerror = () => reject(new Error("Upload failed. Could not reach Cloudinary."));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
          resolve({
            secure_url: body.secure_url,
            public_id: body.public_id,
            width: body.width,
            height: body.height,
            format: body.format,
          });
        } else {
          reject(new Error(body?.error?.message ?? "Cloudinary rejected this upload."));
        }
      } catch {
        reject(new Error("Unexpected response from Cloudinary."));
      }
    };
    xhr.send(formData);
  });
}
