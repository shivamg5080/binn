import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import emailRouter from "./routes/email.routes.js";
import assetRouter from "./routes/asset.routes.js";
import { dbConnect } from "./db/db.js";
import { MINUTE, rateLimiter } from "./middlewares/rate-limiter.middleware.js";
import {
  CRON_JOB_AUTO_DELETE_TRASH_TIME,
  cronJobForAutoDeletionFromRecycleBinParmanently,
} from "./models/fileFolder.model.js";

const app = express();

// Database connection promise (for serverless)
let dbConnected = false;
const ensureDbConnected = async () => {
  if (!dbConnected) {
    await dbConnect();
    dbConnected = true;
  }
};

// Ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Cron-job (only run in non-serverless environment)
if (process.env.NODE_ENV !== "production") {
  setInterval(
    cronJobForAutoDeletionFromRecycleBinParmanently,
    CRON_JOB_AUTO_DELETE_TRASH_TIME
  );
}

// CORS - Allow all origins for now (simplest fix)
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

// Routes
app.get("/", rateLimiter(MINUTE, 5), (req, res) => {
  res.send("Hello World!");
});
app.use("/users", userRouter);
app.use("/email", emailRouter);
app.use("/asset", assetRouter);

export default app;
