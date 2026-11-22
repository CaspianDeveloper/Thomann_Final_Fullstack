import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export const requireAuth: RequestHandler = async (req, _res , next) => {
    const header = req.headers.authorization;
    if(!header?.startsWith("Bearer ")) throw new UnauthorizedError();

    let sub:string | undefined;
    try {
        const payload = jwt.verify(header.slice(7) , process.env.JWT_SECRET!);
        sub = typeof payload === "string" ? undefined : payload.sub;
    } catch {
        throw new UnauthorizedError("Invalid or expired token");
    };

    const user = await prisma.user.findUnique({
        where: {id: Number(sub)},
        select: {id: true, role: true},
    });
    if(!user) throw new UnauthorizedError();

    req.user = { sub: user.id , role: user.role};
    next();
};

export const requireAdmin: RequestHandler = (req , _res , next) => {
    if(req.user?.role !== "ADMIN") throw new ForbiddenError();
    next();
};