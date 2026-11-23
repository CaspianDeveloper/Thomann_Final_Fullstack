import { prisma } from "../lib/prisma";
import { ConflictError , NotFoundError } from "../lib/errors";
import type { AddCartItemInput } from "../schemas/cart.schema";

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getCart(userId: number) {

    const rows = await prisma.cartItem.findMany({
        where: { userId },
        orderBy: { id: "asc" },
        include: {
            product: {
                select: { id: true, name: true, brand: true, image: true, price: true, stock: true, isActive: true},
            },
        },
    });

    const items = rows.map((r) => {
        const unitPrice = Number(r.product.price);

        return {
            productId: r.productId,
            name: r.product.name,
            brand: r.product.brand,
            image: r.product.image,
            unitPrice,
            quantity: r.quantity,
            lineTotal: round2(unitPrice * r.quantity),
            stock: r.product.stock,
            isActive: r.product.isActive, 
        };
    });

    return { items, total: round2(items.reduce((s ,i) => s + i.lineTotal, 0)) };
};

async function findActiveProduct(productId: number) {
    const product = await prisma.product.findFirst({
        where: { id: productId, isActive: true },
        select: { id: true, stock: true },
    });

    if (!product) throw new NotFoundError("Product not found");
    
    return product;
};

export async function addItem(userId: number, input: AddCartItemInput) {
    const product = await findActiveProduct(input.productId);
    const key = { userId_productId: { userId, productId: input.productId } };

    const existing = await prisma.cartItem.findUnique({ where: key });
    const newQty = (existing?.quantity ?? 0) + input.quantity;
    if (newQty > product.stock) throw new ConflictError("Not enough stock");

    await prisma.cartItem.upsert({
        where: key,
        create: { userId, productId: input.productId, quantity: input.quantity },
        update: { quantity: newQty }
    });

    return { created: !existing };
};

export async function updateItem(userId: number, productId: number, quantity: number) {
    
    const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
    });

    if (!existing) throw new NotFoundError("Cart item not found");

    const product = await findActiveProduct(productId);

    if (quantity > product.stock) throw new ConflictError("Not enough stock");

    await prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity },
    });
};


export async function removeItem(userId: number , productId: number) {
    const { count } = await prisma.cartItem.deleteMany({ where: { userId, productId } });
    if (count === 0) throw new NotFoundError("Cart item not found");
};
