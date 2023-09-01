const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const deviceSchema = new mongoose.Schema({
  uuid: { type: String, required: true },
  devicename: { type: String, required: true },
  devicelocation: String,
  latitude: Number,
  longitude: Number,
  publicip: String,
});

const loginDetailSchema = new mongoose.Schema({
  ip: String,
  location: String,
  latitude: Number,
  longitude: Number,
  uuid: String,
  datetime: { type: Date, default: Date.now },
});

const abnormalLoginSchema = new mongoose.Schema({
  ip: String,
  location: String,
  latitude: Number,
  longitude: Number,
  uuid: String,
  loginAttempts: { type: Number, default: 0 },
  lastLogin: Date,
});

const serverAuthSchema = new mongoose.Schema({
  servertype: { type: String, required: true },
  ip: { type: String, required: true },
  port: { type: Number, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  alloweduuid: String,
});

const endUserSchema = new mongoose.Schema({
  UserName: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 50,
  },
  Password: { type: String, required: true, minlength: 8 },
  devices: [deviceSchema],
  serverauths: [serverAuthSchema],
  logindetails: [loginDetailSchema],
  abnormalLogins: [abnormalLoginSchema],
  isBlocked: { type: Boolean, default: false },
});

// Hash the user's password before saving
endUserSchema.pre("save", async function (next) {
  if (!this.isModified("Password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.Password = await bcrypt.hash(this.Password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare hashed password for login
endUserSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.Password);
  } catch (error) {
    throw error;
  }
};

// Generate JWT token
endUserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, UserName: this.UserName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
  return token;
};

const EndUser = mongoose.model("EndUser", endUserSchema);

module.exports = EndUser;
