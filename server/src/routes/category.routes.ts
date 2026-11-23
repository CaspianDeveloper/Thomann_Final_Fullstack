import { Router } from "express";
import * as controller from "../controllers/category.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";

export const categoryRoutes = Router();

categoryRoutes.get("/", controller.list);
categoryRoutes.post("/" , requireAuth, requireAdmin, controller.create);
categoryRoutes.patch("/:id" , requireAuth, requireAdmin, controller.update);
categoryRoutes.delete("/:id" , requireAuth, requireAdmin, controller.remove);
