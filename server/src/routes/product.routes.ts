import { Router } from "express";
import * as controller from "../controllers/product.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";

export const productRoutes = Router();


productRoutes.get("/" , controller.list);
productRoutes.get("/:id" , controller.getOne);
productRoutes.post("/" , requireAuth, requireAdmin, controller.create);
productRoutes.patch("/:id" , requireAuth, requireAdmin, controller.update);
productRoutes.delete("/:id" , requireAuth, requireAdmin, controller.remove);