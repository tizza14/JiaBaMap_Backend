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
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: googleClientId,
  });
  const payload = ticket.getPayload();
  return payload;
}

function createStorage() {
  const opts = { projectId: process.env.GOOGLE_PROJECT_ID };
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    opts.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  }
  return new Storage(opts);
}

async function uploadPhotos(files) {
  const storage = createStorage();
  const photoUrls = [];
  for (const file of files) {
    const bucketName = process.env.BUCKET_NAME;
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
  const photoUrls = [];
  for (const file of files) {
    const bucketName = process.env.BUCKET_NAME;
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
  uploadPhotos,
  uploadMenuPhotos,
};
