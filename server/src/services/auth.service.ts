import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { ConflictError , NotFoundError , UnauthorizedError } from "../lib/errors";
import type { LoginInput , RegisterInput } from "../schemas/auth.schema";

function signToken (userId: number): string{
    const secret = process.env.JWT_SECRET;
    if(!secret) throw new Error("JWT_SECRET is not set");
    return jwt.sign({} , secret , { subject: String(userId) , expiresIn: "2h" });
};

function toPublic<T extends { passwordHash: string}>(user: T) {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
};

export async function register (input: RegisterInput) {
   const { password, company, ...rest } = input;
   const exists = await prisma.user.findUnique({ where: {email: rest.email} });
   if(exists) throw new ConflictError("Email already registered");

   const passwordHash = await argon2.hash(password);
   try {
        const user = await prisma.user.create({ data: {...rest, company: company ?? null, passwordHash} });
        return { user: toPublic(user), token: signToken(user.id) };
   } catch (e) {
        if((e as {code?: string}).code === "P2002") {
            throw new ConflictError("Email already registered");
        };
        throw e;
   }
};

export async function login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: {email: input.email} });
    // eyni mesaj: email və ya parol səhvdirsə, hansının olduğu dəqiq açılmır.
    if(!user || !(await argon2.verify(user.passwordHash, input.password))) {
        throw new UnauthorizedError("Invalid email or password");
    };

    const updated  = await prisma.user.update({
        where: {id: user.id},
        data: {lastLoginAt: new Date()},
    });
    return { user: toPublic(updated) , token: signToken(user.id) };
};

export async function getProfile(userId: number) {
    const user = await prisma.user.findUnique({ where: {id: userId} });
    if(!user) throw new NotFoundError("User not found");
    return toPublic(user);
};

