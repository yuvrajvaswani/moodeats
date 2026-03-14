const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { sendAccountCreatedEmail } = require("../config/mailer");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res) => {
  try {
    const { name, email, password, heightCm, weightKg } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    const parsedHeight = Number(heightCm);
    const parsedWeight = Number(weightKg);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!passwordRule.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters and include both letters and numbers" });
    }

    if (!Number.isFinite(parsedHeight) || parsedHeight < 80 || parsedHeight > 260) {
      return res.status(400).json({ message: "Height must be between 80 and 260 cm" });
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight < 20 || parsedWeight > 400) {
      return res.status(400).json({ message: "Weight must be between 20 and 400 kg" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name?.trim() || "",
      email: normalizedEmail,
      password: hashedPassword,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
    });

    const token = createToken(user._id);

    sendAccountCreatedEmail({ toEmail: user.email, name: user.name }).catch((emailError) => {
      if (emailError.code === "RESEND_TEST_MODE_RECIPIENT_RESTRICTED") {
        console.warn(emailError.message);
        return;
      }

      console.error("Failed to send account-created email:", emailError.message);
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (name?.trim() && !user.name) {
      user.name = name.trim();
      await user.save();
    }

    const token = createToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: "Google account verification failed" });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name?.trim() || "";

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-12) + Date.now().toString();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
      });
    } else if (!user.name && name) {
      user.name = name;
      await user.save();
    }

    const token = createToken(user._id);

    return res.json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Google login failed" });
  }
};

module.exports = { register, login, googleLogin };
