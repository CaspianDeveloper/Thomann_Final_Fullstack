import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as c from "../controllers/order.controller";

export const orderRoutes = Router();

orderRoutes.use(requireAuth);
orderRoutes.post("/" , c.create);
orderRoutes.get("/" , c.list);
orderRoutes.get("/:id" , c.getOne);
orderRoutes.post("/:id/cancel" , c.cancel);