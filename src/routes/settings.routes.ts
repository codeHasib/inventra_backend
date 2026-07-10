import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getProfileHandler,
  updateProfileHandler,
} from "../controllers/settings.controller";

const router = Router();

router.use(requireAuth);

router.get("/profile", getProfileHandler);

router.patch("/profile", updateProfileHandler);

export default router;
