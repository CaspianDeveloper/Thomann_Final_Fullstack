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
    const parseErr = err as { status?: number; type?: string; expose?: boolean };
    if(parseErr.expose && typeof parseErr.status === "number" && parseErr.status < 500) {
        const invalidJson = parseErr.type === "entity.parse.failed";
        return res.status(parseErr.status).json({
            error: {
                code: invalidJson ? "INVALID_JSON" : "BAD_REQUEST",
                message: invalidJson ? "Malformed JSON body" : "Bad request",
            },
        });
    };
    
    console.error(err); 
    res.status(500).json({
        error: { code: "INTERNAL_ERROR"  , message: "Something went wrong" },
    });
};