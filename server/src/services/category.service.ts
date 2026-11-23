import { ConflictError, NotFoundError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { slugify } from "../lib/slug";
import type { CreateCategoryInput, UpdateCategoryInput } from "../schemas/category.schema";

export async function listCategories() {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: { where: { isActive: true }}} } },
    });

    return categories.map(( { _count, ...c } ) => ({ ...c, productCount: _count.products }));
};

export async function createCategory(input: CreateCategoryInput) {
    try {
        return await prisma.category.create({
            data: { name: input.name, slug: slugify(input.name), imageUrl: input.imageUrl ?? null },
        });
    } catch (e) {
        if ((e as { code?: string }).code === "P2002") throw new ConflictError("Category already exists");
        throw e;
    }
};

export async function updateCategory(id: number, input: UpdateCategoryInput) {
    const data: { name?: string; slug?: string; imageUrl?: string | null} = {};
    if (input.name !== undefined) {
        data.name = input.name;
        data.slug = slugify(input.name);
    };

    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;

    try {
        return await prisma.category.update({ where: { id }, data });
    } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === "P2025") throw new NotFoundError("Category not found");
        if (code === "P2002") throw new ConflictError("Category already exists");
        throw e;
    };
};

export async function deleteCategory(id: number) {
    // qayda: 5 məhsulu olan kateqoriya silinmir  (passiv məhsullar da sayılır)
    const products = await prisma.product.count({ where: { categoryId: id } });
    if (products  > 0) throw new ConflictError("Category has products");
    const { count } = await prisma.category.deleteMany({ where: { id } });
    if (count === 0) throw new NotFoundError("Category not found");
};