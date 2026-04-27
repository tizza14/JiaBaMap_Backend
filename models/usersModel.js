const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String, // 只有本地帳號才有，Google 登入不設密碼
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // 允許多筆 null（本地帳號沒有 googleId）
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
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
