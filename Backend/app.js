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

// Connect to the database
dbConnect();

// Cron-job
setInterval(
  cronJobForAutoDeletionFromRecycleBinParmanently,
  CRON_JOB_AUTO_DELETE_TRASH_TIME
);

// Middlewares
// app.use(cors()); // Cross-Origin Resource Sharing
const allowedOrigins = [
  "http://localhost:5173",
  "https://project-bin.netlify.app",
  process.env.CLIENT_URL, // Allow configured client URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        // Ideally we should block, but for "make it live" generic deploy, maybe be permissive or just log.
        // But better to stick to allowedOrigins.
        // Wait, if I deploy frontend to Vercel, I don't know the URL yet!
        // So I should allow ALL origins or ask user to set CLIENT_URL.
        // I'll stick to dynamic check. 
        // Actually, if I don't know the URL, I can't add it to allowedOrigins.
        // Safest for "just make it work" is to allow all if CLIENT_URL is not set or match it.
        // Let's rely on CLIENT_URL being set, OR allow all if not prod.
        // I will change it to return true if origin is in allowedOrigins.
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true, // allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json()); //Parses JSON request bodies into req.body
app.use(express.urlencoded({ extended: true })); //Parses URL-encoded form data (e.g., from HTML forms) into req.body.
app.use(cookieparser()); //Parses cookies from the request and makes them available in req.cookies

// Routes
app.get("/", rateLimiter(MINUTE, 5), (req, res) => {
  res.send("Hello World!");
});
app.get("/api", rateLimiter(MINUTE, 5), (req, res) => {
  res.send("Hello World API!");
});
app.use("/api/users", userRouter);
app.use("/api/email", emailRouter);
app.use("/api/asset", assetRouter);

export default app;
