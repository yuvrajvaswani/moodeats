const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS || 15000);
const DEPLOY_MARKER = process.env.DEPLOY_MARKER || "moodfoods-backend-boot-v2";

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions =
  allowedOrigins.length > 0
    ? {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(new Error("Not allowed by CORS"));
        },
      }
    : undefined;

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.get("/health", (req, res) => {
  const dbState = require("mongoose").connection.readyState;

  res.json({
    status: "ok",
    service: "moodfoods-backend",
    database: dbState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/user", userRoutes);

const startServer = async () => {
  console.log(`Boot marker: ${DEPLOY_MARKER}`);
  console.log(`Node environment: ${process.env.NODE_ENV || "development"}`);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const tryConnectDB = async () => {
    const connected = await connectDB();

    if (!connected) {
      console.warn(`Retrying MongoDB connection in ${DB_RETRY_MS / 1000}s...`);
      setTimeout(tryConnectDB, DB_RETRY_MS);
    }
  };

  tryConnectDB();
};

startServer();
