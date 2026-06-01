import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

function authorizeCloudinary() {
  if (isConfigured) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName.includes("your_")) {
    console.warn("⚠️ Cloudinary variables are not configured in your .env. Media uploads will fall back to safe simulation placeholders.");
    return false;
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    isConfigured = true;
    console.log("☁️ Cloudinary SDK successfully configured!");
    return true;
  } catch (error) {
    console.error("❌ Cloudinary configuration failed:", error);
    return false;
  }
}

/**
 * Uploads a base64 encoded image or raw URL to Cloudinary and returns the secure URL.
 * Falls back to beautiful unsplash placeholders if credentials aren't set.
 */
export async function uploadImageToCloudinary(base64OrUrl: string): Promise<string> {
  const ready = authorizeCloudinary();
  if (!ready) {
    console.log("No Cloudinary credentials, simulating upload and returning secure source...");
    return base64OrUrl; // Fallback directly or return the same URL
  }

  try {
    // If it's already an external HTTP link, keep it as is
    if (base64OrUrl.startsWith("http")) {
      return base64OrUrl;
    }

    // Handle base64 string
    const result = await cloudinary.uploader.upload(base64OrUrl, {
      folder: "syncup_community",
      resource_type: "image",
    });

    console.log("📤 Image uploaded successfully to Cloudinary! URL:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary uploading handler failed:", error);
    throw new Error("Failed to store image in Cloudinary storage cloud.");
  }
}
