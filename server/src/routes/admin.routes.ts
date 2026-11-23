import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";


export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/products" , productController.adminList);