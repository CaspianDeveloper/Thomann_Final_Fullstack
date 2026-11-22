import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors( { origin: process.env.CLIENT_URL ?? "http://localhost:5173" } ));
app.use(express.json({ limit:"100kb" }));

app.get("/health" , (_req , res) => {
    res.json({ status: "Ok" });
});

app.use(errorHandler);