import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (err , _req , res , _next) => {
    if(err instanceof ZodError) {
        return res.status(400).json({
            error: { code: "VALIDATION_ERROR" , message: "Invalid input" , details: err.issues},
        });
    };
    if(err instanceof AppError) {
        return res.status(err.status).json({
            error: { code: err.code , message: err.message , details: err.details },
        });
    };
    console.error(err); 
    res.status(500).json({
        error: { code: "INTERNAL_ERROR"  , message: "Something went wrong" },
    });
};