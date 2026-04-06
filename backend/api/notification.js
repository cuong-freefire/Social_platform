import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controller/notificationController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.patch("/:id/read", verifyToken, markAsRead);
router.patch("/read-all", verifyToken, markAllAsRead);

export default router;
