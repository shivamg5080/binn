import mongoose from "mongoose";

// In Vercel serverless, env vars are already available via process.env
// dotenv.config() is not needed and may cause issues

export const dbConnect = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected to database");
      return;
    }

    const uri = process.env.Mongodb_URI;
    if (!uri) {
      throw new Error("Mongodb_URI environment variable is not set");
    }

    await mongoose.connect(uri);
    console.log("Connected to database");
  } catch (error) {
    console.error("Database connection error:", error.message);
    throw error;
  }
};
