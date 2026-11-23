import { prisma } from "../lib/prisma";

export async function listCategories() {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: { where: { isActive: true }}} } },
    });

    return categories.map(( { _count, ...c } ) => ({ ...c, productCount: _count.products }));
};

