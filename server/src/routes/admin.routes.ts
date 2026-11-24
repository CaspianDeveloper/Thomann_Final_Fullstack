import { Router } from "express";
import * as productController from "../controllers/product.controller";
import * as orderController from "../controllers/order.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";


export const adminRoutes = Router();


adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/products" , productController.adminList);
adminRoutes.get("/orders" , orderController.adminList);
adminRoutes.get("/orders/:id" , orderController.adminGetOne);
adminRoutes.patch("/orders/:id/status", orderController.adminUpdateStatus);