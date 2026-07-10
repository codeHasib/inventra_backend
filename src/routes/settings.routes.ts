import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import {
  getProfileHandler,
  updateProfileHandler,
} from "../controllers/settings.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.get("/profile", getProfileHandler);

router.patch("/profile", updateProfileHandler);

export default router;
