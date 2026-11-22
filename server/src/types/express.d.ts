declare global {
    namespace Express {
        interface Request {
            user?: { sub: number; role: "USER" | "ADMIN"};
        }
    };
};

export {};