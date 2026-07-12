import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/error.middleware";
import { getAuth } from "./config/better-auth";
import routes from "./routes/index";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.BETTER_AUTH_URL,
    credentials: true,
  }),
);
app.use(compression());

let toNodeHandlerFn: any = null;
let authInitPromise: Promise<void> | null = null;

app.use("/api/auth", async (req, res, next) => {
  if (!toNodeHandlerFn) {
    if (!authInitPromise) {
      authInitPromise = (async () => {
        const auth = await getAuth();
        const { toNodeHandler } = await import("better-auth/node");
        toNodeHandlerFn = toNodeHandler(auth);
      })();
    }
    await authInitPromise;
  }
  toNodeHandlerFn(req, res, next);
});

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
  skip: (req) => req.originalUrl.startsWith("/api/auth"),
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
