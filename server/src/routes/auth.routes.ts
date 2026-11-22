import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

export const authRoutes = Router();
authRoutes.post("/register" , controller.register);
authRoutes.post("/login" , controller.login);
authRoutes.get("/me" , requireAuth,controller.me);