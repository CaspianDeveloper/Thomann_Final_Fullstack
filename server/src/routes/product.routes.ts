import { Router } from "express";
import * as controller from "../controllers/product.controller";

export const productRoutes = Router();

productRoutes.get("/" , controller.list);
productRoutes.get("/:id" , controller.getOne);