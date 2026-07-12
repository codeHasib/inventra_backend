import mongoose from "mongoose";
import { app } from "../src/app";

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");
  await mongoose.connect(uri);
  isConnected = true;
};

connectDB().catch(console.error);

export default app;
