const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// 店家專用 middleware：JWT 內必須含有 placeId（店家登入時才會帶入）
const storeAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "未提供 Token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(403).json({ message: "無效的店家 Token" });
    }

    req.store = { id: decoded.id, placeId: decoded.placeId };
    next();
  } catch (error) {
    res.status(401).json({ message: "Token 無效或已過期" });
  }
};

module.exports = { authMiddleware, storeAuthMiddleware };
