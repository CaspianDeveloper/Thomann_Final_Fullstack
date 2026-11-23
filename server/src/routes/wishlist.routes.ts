import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as c from "../controllers/wishlist.controller";

export const wishlistRoutes = Router();
wishlistRoutes.use(requireAuth);
wishlistRoutes.get("/", c.getWishlist);
wishlistRoutes.post("/" , c.addItem);
wishlistRoutes.delete("/:productId" , c.removeItem);