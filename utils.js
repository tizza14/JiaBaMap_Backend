const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { Storage } = require("@google-cloud/storage");
const googleClientId = process.env.GOOGLE_CLIENT_ID;

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    issuer: "jiabamap",
    expiresIn: "7d",
  });
}

async function parseGoogleIdToken(token) {
  if (!googleClientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: googleClientId,
  });
  const payload = ticket.getPayload();
  return payload;
}

function createStorage() {
  try {
    const opts = { projectId: process.env.GOOGLE_PROJECT_ID };
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      opts.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } else {
      console.warn("GOOGLE_CREDENTIALS_JSON is missing. Image upload features may fail.");
    }
    return new Storage(opts);
  } catch (error) {
    console.error("Failed to initialize Google Cloud Storage:", error.message);
    return null; // Return null so callers can handle the unavailability
  }
}

async function uploadPhotos(files) {
  const storage = createStorage();
  if (!storage) {
    throw new Error("Cloud Storage is not configured correctly.");
  }
  const photoUrls = [];
  for (const file of files) {
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) throw new Error("BUCKET_NAME is not configured.");
    const fileName = encodeURIComponent(file.originalname);
    const objectName = `restaurant/comment/${fileName}`;
    await storage.bucket(bucketName).file(objectName).save(file.buffer);
    const url = `${process.env.GOOGLE_CLOUD_STORAGE_BASE_URL}${bucketName}/${objectName}`;
    photoUrls.push(url);
  }
  return photoUrls;
}

async function uploadMenuPhotos(files) {
  const storage = createStorage();
  if (!storage) {
    throw new Error("Cloud Storage is not configured correctly.");
  }
  const photoUrls = [];
  for (const file of files) {
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) throw new Error("BUCKET_NAME is not configured.");
    const fileName = encodeURIComponent(file.originalname);
    const objectName = `store/menu/${fileName}`;
    await storage.bucket(bucketName).file(objectName).save(file.buffer);
    const url = `${process.env.GOOGLE_CLOUD_STORAGE_BASE_URL}${bucketName}/${objectName}`;
    photoUrls.push(url);
  }
  return photoUrls;
}

module.exports = {
  generateToken,
  parseGoogleIdToken,
  createStorage,
  uploadPhotos,
  uploadMenuPhotos,
};
