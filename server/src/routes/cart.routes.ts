import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as c from "../controllers/cart.controller";

export const cartRoutes = Router();

cartRoutes.use(requireAuth);
cartRoutes.get("/" , c.getCart);
cartRoutes.post("/items" , c.addItem);
cartRoutes.patch("/items/:productId" , c.updateItem);
cartRoutes.delete("/items/:productId" , c.removeItem);