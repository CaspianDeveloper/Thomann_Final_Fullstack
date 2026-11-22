import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/auth.routes.js";

export const app = express();

app.use(cors( { origin: process.env.CLIENT_URL ?? "http://localhost:5173" } ));
app.use(express.json({ limit:"100kb" }));

app.get("/health" , (_req , res) => {
    res.json({ status: "Ok" });
});

app.use("/auth" , authRoutes);

app.use(errorHandler);