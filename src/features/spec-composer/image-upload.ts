import { validateImageUpload } from "./image-validation";

/**
 * Validates an uploaded image file, then reads it into a data URL. Throws
 * (the validation message, or a generic read failure) instead of silently
 * resolving, so callers can show the error directly via toast.error.
 */
export async function readImageUpload(file: File): Promise<string> {
  await validateImageUpload(file);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("This image could not be read."));
    };
    reader.onerror = () => reject(new Error("This image could not be read."));
    reader.readAsDataURL(file);
  });
}
