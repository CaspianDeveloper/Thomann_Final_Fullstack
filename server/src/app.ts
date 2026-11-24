import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { categoryRoutes } from "./routes/category.routes.js";
import { productRoutes } from "./routes/product.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { cartRoutes } from "./routes/cart.routes.js";
import { wishlistRoutes } from "./routes/wishlist.routes.js";
import { orderRoutes } from "./routes/order.routes.js";


export const app = express();

app.use(cors( { origin: process.env.CLIENT_URL ?? "http://localhost:5173" } ));

app.use(express.json({ limit:"100kb" }));

app.get("/health" , (_req , res) => {
    res.json({ status: "Ok" });
});

app.use("/orders" , orderRoutes);

app.use("/auth" , authRoutes);

app.use("/categories" , categoryRoutes);

app.use("/products" , productRoutes);

app.use("/cart" , cartRoutes);

app.use("/wishlist" , wishlistRoutes);

app.use("/admin" , adminRoutes);

app.use(errorHandler);