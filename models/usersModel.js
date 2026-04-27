const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 定義使用者資料結構
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    igLink: {
      type: String,
    },
    favorites: [
      {
        type: String,
      },
    ]
  },
  {
    timestamps: true,
  },
);

// 密碼加密
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 密碼比對驗證
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
