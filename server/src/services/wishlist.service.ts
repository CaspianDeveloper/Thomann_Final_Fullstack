import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";

export async function getWishlist(userId: number) {
    const rows = await prisma.wishlistItem.findMany({
        where: { userId },
        orderBy: { id: "asc" },
        include: {
            product: {
                select: { id: true, name: true, brand: true, image: true, price: true, stock: true, isActive: true },
            },
        },
    });

    return rows.map((r) => ({
        productId: r.productId,
        name: r.product.name,
        brand: r.product.brand,
        image: r.product.image,
        price: Number(r.product.price),
        isActive: r.product.isActive,
    }));
};


export async function addItem(userId: number, productId: number) {
    const product = await prisma.product.findFirst({
        where: { id: productId, isActive: true },
        select: { id: true },
    });

    if (!product) throw new NotFoundError("Product not found");

    const { count } = await prisma.wishlistItem.createMany({
        data: [{ userId, productId }],
        skipDuplicates: true,
    });

    return { created: count === 1 };
};


export async function removeItem(userId: number, productId: number) {
    const { count } = await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    if (count === 0) throw new NotFoundError("Wishlist item not found");
};