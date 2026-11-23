import { Router } from "express";
import * as controller from "../controllers/category.controller";

export const categoryRoutes = Router();

categoryRoutes.get("/", controller.list);