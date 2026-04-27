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
  console.log(`Token: ${token}`);
  const isValid = jwt.verify(token, process.env.JWT_SECRET);
  if (!isValid) {
    res.status(401).json({ msg: `Token is invalid. Please login again.` });
    return;
  }

  const payload = jwt.decode(token);
  const id = payload.id;

  req.body.id = id;

  next();
};

const googleLogin = async (req, res, _next) => {
  const token = req.body.credential;
  let payload;
  try {
    payload = await parseGoogleIdToken(token);
  } catch (err) {
    console.log(`Failed to get the payload from the token: ${error}`);
    res.status(401).send();
    return;
  }
  const googleId = payload["sub"];
  const email = payload["email"];
  const name = payload["name"];
  const profilePicture = payload["picture"];

  let user = await User.findOne({ googleId });
  if (!user) {
    user = new User({
      googleId,
      name,
      email,
      profilePicture,
    });
    await user.save();
  }

  const accessToken = generateToken({
    id: user._id,
    // name: user.name,
    // profilePicture: user.profilePicture,
  });

  res.json({
    token: accessToken,
  });
};

const storeLogin = async (req, res, _next) => {
  const { username, password } = req.body;

  try {
    const store = await Store.findOne({ username });
    if (!store) {
      return res.status(404).json({ message: "帳號不存在" });
    }

    const isPasswordValid = await bcrypt.compare(password, store.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "密碼錯誤" });
    }

    const accessToken = generateToken({
      id: store._id,
      placeId: store.placeId,
    });

    return res.status(200).json({
      token: accessToken,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
  }
};

module.exports = {
  googleLogin,
  verifyToken,
  storeLogin,
};
