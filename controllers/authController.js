const User = require("../models/usersModel");
const Store = require("../models/storeModel");
const jwt = require("jsonwebtoken");
const { parseGoogleIdToken, generateToken } = require("../utils");
const bcrypt = require("bcryptjs");

const verifyToken = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    res.status(401).json({ msg: "Token is invalid. Please login again." });
    return;
  }

  const token = authorizationHeader.split(" ")[1];
  const isValid = jwt.verify(token, process.env.JWT_SECRET);
  if (!isValid) {
    res.status(401).json({ msg: "Token is invalid. Please login again." });
    return;
  }

  const payload = jwt.decode(token);
  req.body.id = payload.id;
  next();
};

// ── 一般用戶：Google OAuth ──────────────────────────────────────────
const googleLogin = async (req, res) => {
  const token = req.body.credential;
  let payload;
  try {
    payload = await parseGoogleIdToken(token);
  } catch (err) {
    return res.status(401).json({ message: "Google 驗證失敗" });
  }

  const googleId = payload["sub"];
  const email = payload["email"];
  const name = payload["name"];
  const profilePicture = payload["picture"];

  let user = await User.findOne({ googleId });
  if (!user) {
    // 若同 email 已有本地帳號，合併 googleId
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      user.profilePicture = user.profilePicture || profilePicture;
      await user.save();
    } else {
      user = await User.create({ googleId, name, email, profilePicture });
    }
  }

  const accessToken = generateToken({ id: user._id });
  res.json({ token: accessToken });
};

// ── 一般用戶：Email 註冊 ───────────────────────────────────────────
const userRegister = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "請填寫姓名、Email 和密碼" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "此 Email 已被使用" });
    }

    const user = await User.create({ name, email, password });
    const accessToken = generateToken({ id: user._id });
    res.status(201).json({ token: accessToken });
  } catch (error) {
    console.error("userRegister error:", error);
    res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
  }
};

// ── 一般用戶：Email 登入 ───────────────────────────────────────────
const userLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "請填寫 Email 和密碼" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "此 Email 尚未註冊，請先建立帳號" });
    }
    if (!user.password) {
      return res.status(401).json({ message: "此帳號使用 Google 登入，請改用 Google 登入方式" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: "密碼錯誤，請再試一次" });
    }

    const accessToken = generateToken({ id: user._id });
    res.json({ token: accessToken });
  } catch (error) {
    console.error("userLogin error:", error);
    res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
  }
};

// ── 店家：登入 ─────────────────────────────────────────────────────
const storeLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const store = await Store.findOne({ username });
    if (!store) {
      return res.status(404).json({ message: "帳號不存在" });
    }

    const isPasswordValid = await bcrypt.compare(password, store.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "密碼錯誤，請再試一次" });
    }

    const accessToken = generateToken({ id: store._id, placeId: store.placeId });
    res.status(200).json({ token: accessToken });
  } catch (error) {
    console.error("storeLogin error:", error);
    res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
  }
};

// ── 店家：註冊 ─────────────────────────────────────────────────────
const storeRegister = async (req, res) => {
  const { username, password, storeName, contactEmail, contactPhone, storeAddress } = req.body;
  if (!username || !password || !storeName) {
    return res.status(400).json({ message: "請填寫帳號、密碼和店名" });
  }

  try {
    const existing = await Store.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "此帳號名稱已被使用" });
    }

    const store = await Store.create({
      username,
      password,
      storeName,
      contactEmail,
      contactPhone,
      storeAddress,
    });

    const accessToken = generateToken({ id: store._id, placeId: store.placeId });
    res.status(201).json({ token: accessToken });
  } catch (error) {
    console.error("storeRegister error:", error);
    res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
  }
};

module.exports = {
  verifyToken,
  googleLogin,
  userRegister,
  userLogin,
  storeLogin,
  storeRegister,
};
