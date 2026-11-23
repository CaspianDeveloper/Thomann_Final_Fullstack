import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import type { Prisma } from "../../generated/prisma/client";
import type { ListProductsQuery } from "../schemas/product.schema";

const ORDER_BY: Record<ListProductsQuery["sort"] , Prisma.ProductOrderByWithRelationInput> = {
    newest: { createdAt: "desc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    name_asc: { name: "asc" },
    rating_desc: { rating: "desc" },
};

function avaliabilityOf(stock: number) {
    if (stock <= 0) return "out_of_stock";
    if (stock <= 5) return "limited_stock";
    return "in_stock";
};

// price Decimaldır, JSON-da string çıxmasın deyə numberə çevirilir.
function toProductDto<T extends {price : {toNumber(): number}; stock: number}> (p: T) {
    return { ...p , price: p.price.toNumber(), avaliability: avaliabilityOf(p.stock)};
};

const categorySelect = { select: {id: true, name: true , slug: true} } as const;

export async function listProducts(q: ListProductsQuery) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (q.category) where.category = { slug: q.category };
    if (q.brand) where.brand = { equals: q.brand, mode: "insensitive" };
    if (q.search) {
        where.OR = [
            {name: {contains: q.search, mode: "insensitive"}},
            {brand: {contains: q.search, mode: "insensitive"}},
            {subcategory: {contains: q.search, mode: "insensitive"}}
        ];
    };

    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
        where.price = {
            ...(q.minPrice !== undefined ? {gte: q.minPrice} : {}),
            ...(q.maxPrice !== undefined ? {lte: q.maxPrice} : {}),
        };
    };

    const [items , total] = await prisma.$transaction([
        prisma.product.findMany({
            where,
            orderBy: [ORDER_BY[q.sort], {id: "asc"}], // id: səhifələmə sabit qalır.
            skip: (q.page - 1) * q.limit,
            take: q.limit,
            include: { category: categorySelect },
        }),
        prisma.product.count({ where }),
    ]);

    return {
        items: items.map(toProductDto),
        page: q.page,
        limit: q.limit,
        total,
        totalPage: Math.ceil(total / q.limit)
    };
};

export async function getProduct(id: number) {
    const product = await prisma.product.findFirst({
        where: { id, isActive: true },
        include: { category: categorySelect }, 
    });

    if (!product) throw new NotFoundError("Product not found");
    return toProductDto(product);
}