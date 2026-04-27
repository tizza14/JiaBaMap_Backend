const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { Storage } = require("@google-cloud/storage");
const googleClientId = process.env.GOOGLE_CLIENT_ID;

function generateToken(payload) {
  console.log(payload);
  return jwt.sign(payload, process.env.JWT_SECRET, {
    issuer: "jiabamap",
    // FIXME
    // expiresIn: "1 day",
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

async function uploadPhotos(files) {
  const storage = new Storage({
    projectId: process.env.GOOGLE_PROJECT_ID,
  });
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
  const storage = new Storage({
    projectId: process.env.GOOGLE_PROJECT_ID,
  });
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
