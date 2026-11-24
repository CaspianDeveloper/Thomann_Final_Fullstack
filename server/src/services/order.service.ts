import { prisma } from "../lib/prisma";
import { BadRequestError , ConflictError , NotFoundError } from "../lib/errors";
import type { CreateOrderInput , ListOrdersQuery } from "../schemas/order.schema";

const round2 = (n:number) => Math.round(n * 100) / 100;

const orderInclude = { items: { orderBy: { id: "asc" as const } } };

function toOrderDto(order: any) {
    return {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        items: order.items.map((i: any) => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: Number(i.unitPrice),
            quantity: i.quantity,
            lineTotal: round2(Number(i.unitPrice) * i.quantity),
        })),
    };
};


export async function createOrder(userId: number, input: CreateOrderInput) {
    const order = await prisma.$transaction(async (tx) => {
        // productId üzrə sıralama: paralel sifarişlərdə deadlock riskini azaldır
        const cartItems = await tx.cartItem.findMany({
            where: { userId },
            orderBy: { productId: "asc" },
            include: { product: true },
        });
        
        if (cartItems.length === 0) throw new BadRequestError("Cart is empty");

        let totalCents = 0;
        const lines  = [];

        for (const ci of cartItems) {
            // Şərtli yeniləmə: stock kifayət etmirsə və ya məhsul deaktivdirsə, 0 sətir yenilənir.
            const { count } = await tx.product.updateMany({
                where: { id: ci.productId, isActive: true, stock: { gte: ci.quantity } },
                data: { stock: { decrement: ci.quantity } },
            });

            if (count === 0) {
                throw new ConflictError(`Product "${ci.product.name}" is unvaliable or out of stock`)
            };

            // Qiymət bazadan götürülür , müştəridən yox (qayda 2)
            totalCents += Math.round(Number(ci.product.price) * 100) * ci.quantity;
            lines.push({
                productId: ci.productId,
                productName: ci.product.name,
                unitPrice: ci.product.price,
                quantity: ci.quantity,
            });
        }

        const shippingAddress = 
            input.shippingAdress ?? 
            (await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { streetNum: true, postalCode: true, town: true, country: true },
            }));

        const created = await tx.order.create({
            data: {
                userId,
                total: totalCents / 100,
                shippingAddress,
                items: { create: lines },
            },
            include: orderInclude,
        });

        await tx.cartItem.deleteMany({ where: { userId } });
        return created;
    });

    return toOrderDto(order);
};



export async function listOrders(userId: number, q: ListOrdersQuery) {
    const where = { userId, ...(q.status ? { status: q.status } : {}) };
    const orderBy = 
        q.sort === "oldest" ? { createdAt: "asc" as const }
        : q.sort === "total_asc" ? { total: "asc" as const }
        : q.sort === "total_desc" ? { total: "desc" as const }
        : { createdAt: "desc" as const };
    
    const [total , rows] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            orderBy,
            skip: (q.page - 1) * q.limit,
            take: q.limit,
            include: orderInclude,
        }),
    ]);

    return {
        items: rows.map(toOrderDto),
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
    };
};

export async function getOrder(userId: number, id: number) {
    // userId where-də: başqasının sifarişi -> 404 (qayda 4)
    const order = await prisma.order.findFirst({ where: { id , userId }, include: orderInclude });

    if (!order) throw new NotFoundError("Order not found");

    return toOrderDto(order);
};

export async function cancelOrder(userId: number, id: number) {
    await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
            where: { id, userId },
            include: { items: { orderBy: { productId: "asc" } } },
        });

        if (!order) throw new NotFoundError("Order not found");

        // Şərtli status dəyişikliyi: yalnız PENDING ləğv oluna bilər (qayda 6)
        const { count } = await tx.order.updateMany({
            where: { id, status: "PENDING" },
            data: { status: "CANCELED" },
        });

        if (count === 0) throw new ConflictError("Only PENDING orders can be canceled");

        // Stock yalnız count === 1 olanda , bir dəfə qaytarılır.
        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
            });
        }
    });

    return getOrder(userId, id);
};

