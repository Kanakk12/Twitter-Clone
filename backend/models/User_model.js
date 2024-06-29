// models/User.js
const mongoose = require("mongoose");

// user schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String,
    default:"https://tse1.mm.bing.net/th?id=OIP.SxuyKL-Ca-_bXp1TC4c4-gHaF3&pid=Api&P=0&h=180"},
    location: { type: String },
    dateOfBirth: { type: Date },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

mongoose.model("UserModel", userSchema);
