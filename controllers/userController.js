const User = require("../models/usersModel");
const { Storage } = require("@google-cloud/storage");

//依id取得使用者資料
const getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const userProfile = await User.findById({ _id: id });
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ message: "Cannot get userProfile" });
  }
};

//更新使用者資料
const updateProfile = async (req, res) => {
  const id = req.params.id;

  if (req.user.id !== id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    if (!id) {
      res.status(400).json({ message: "Id is required" });
      return;
    }

    let url = undefined;
    if (req.file) {
      const storageOpts = { projectId: process.env.GOOGLE_PROJECT_ID };
      if (process.env.GOOGLE_CREDENTIALS_JSON) {
        storageOpts.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      }
      const storage = new Storage(storageOpts);
      const bucketName = process.env.BUCKET_NAME;
      const fileName = encodeURIComponent(req.file.originalname);
      const objectName = `user/${id}/${fileName}`;
      await storage.bucket(bucketName).file(objectName).save(req.file.buffer);
      url = `${process.env.GOOGLE_CLOUD_STORAGE_BASE_URL}${bucketName}/${objectName}`;
    }

    const ALLOWED_FIELDS = ["name", "bio", "birthDate", "profilePicture", "igLink"];
    const updateFields = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] !== undefined) updateFields[key] = req.body[key];
    }
    if (url !== undefined) {
      updateFields.profilePicture = url;
    }

    const userProfile = await User.findByIdAndUpdate(
      id,
      updateFields,
      { new: true },
    );
    res.json(userProfile);
  } catch (err) {
    res.status(400).json({ message: "Cannot update this profile" });
  }
};

const addFavorites = async (req, res) => {
  const { id } = req.params;
  const { placeId } = req.body;

  if (req.user.id !== id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.favorites.includes(placeId)) {
      user.favorites.push(placeId);
      await user.save();
    }
    res.status(200).json({ message: "Restaurant added to favorites", favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: "Cannot add favorite" });
  }
};

const delFavorites = async (req, res) => {
  const { id } = req.params;
  const { placeId } = req.body;

  if (req.user.id !== id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.favorites = user.favorites.filter((fav) => fav !== placeId);
    await user.save();
    res.status(200).json({ message: "Restaurant removed from favorites", favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: "Cannot remove favorite" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  addFavorites,
  delFavorites,
};
