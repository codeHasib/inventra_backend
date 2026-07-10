import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/error.middleware";
import routes from "./routes/index";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later" },
});
app.use("/api", limiter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Inventra AI Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);

app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: "Route not found",
  });
});

app.use(errorHandler);
