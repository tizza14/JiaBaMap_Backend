const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const http = require("http");
let swaggerUi, swaggerDocument;
try {
  swaggerUi = require("swagger-ui-express");
  swaggerDocument = require("./swagger-output.json");
} catch {
  // swagger-ui-express is a devDependency; not available in production
}

require("dotenv").config();

const notificationRouter = require("./routes/notification");
const restaurantsRouter = require("./routes/restaurants");
const commentsRouter = require("./routes/comments");
const articlelistRouter = require("./routes/articlelist");
const userRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const menuRouter = require("./routes/menu");
const storeRouter = require("./routes/store");
const orderRouter = require("./routes/order");
const linepayRouter = require("./routes/linepay");
const cartRouter = require("./routes/cart");

const parseAllowedOrigins = () => {
  const main = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173";
  const extra = process.env.CORS_EXTRA_ORIGINS || "";
  return [...main.split(","), ...extra.split(",")]
    .map((o) => o.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

// Initialize MongoDB connection (in-memory for dev, real URI for production)
const { seedDevData } = require("./seeds/seedTestAccount");

const connectDB = async () => {
  let uri = process.env.MONGO_URI;
  let isInMemory = false;
  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGO_URI is required in production");
    }
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    isInMemory = true;
    console.log("Using in-memory MongoDB:", uri);
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected successfully");
  if (isInMemory) await seedDevData();
};

let dbReady = false;
connectDB()
  .then(() => { dbReady = true; })
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
const server = http.createServer(app);

const { initializeSocket } = require("./socketConfig");
initializeSocket(server);

if (swaggerUi && swaggerDocument) {
  const buildSwaggerDocument = (req) => ({
    ...swaggerDocument,
    host: req.get("host"),
    schemes: [req.protocol],
  });
  app.use("/api-docs", swaggerUi.serve);
  app.get(["/api-docs", "/api-docs/"], (req, res, next) => {
    swaggerUi.setup(buildSwaggerDocument(req))(req, res, next);
  });
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error(`[CORS Error] Origin ${origin} not allowed. Allowed:`, allowedOrigins);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState; // 0=disconnected 1=connected 2=connecting
  if (dbState === 1) {
    return res.status(200).json({ status: "ok" });
  }
  const stateLabel = ["disconnected", "connected", "connecting", "disconnecting"][dbState] ?? "unknown";
  return res.status(503).json({ status: "error", db: stateLabel });
});

app.use("/restaurants", restaurantsRouter);
app.use("/comments", commentsRouter);
app.use("/articles", articlelistRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/notification", notificationRouter);
app.use("/menu", menuRouter);
app.use("/uploads", express.static("uploads"));
app.use("/store", storeRouter);
app.use("/order", orderRouter);
app.use("/payments/linepay", linepayRouter);
app.use("/cart", cartRouter);

if (require.main === module) {
  const port = process.env.PORT || 3200;

  // Startup Environment Checks
  const essentialVars = ["JWT_SECRET", "API_KEY", "MONGO_URI"];
  essentialVars.forEach((v) => {
    if (!process.env[v]) {
      console.warn(`WARNING: Essential environment variable "${v}" is missing!`);
    }
  });

  server
    .listen(port, () => {
      console.log(`Server is running on port ${port}`);
    })
    .on("error", (err) => {
      console.error("Error starting server:", err);
    });
}

module.exports = { app, server };
