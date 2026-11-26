import rateLimit from "express-rate-limit";

// Hər IP üçün 15 dəqiqədə 20 login/register cəhdi
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test", // testlər yüzlərlə sorğu göndərir
    handler: (_req, res) => {
        res.status(429).json({
            error: { code: "TOO_MANY_REQUESTS", message: "Too many attemps, please try again later" },
        });
    },
});