import type { RequestHandler } from "express";
import * as categoryService from "../services/category.service";
import { idParamSchema } from "../schemas/product.schema";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema";


export const list: RequestHandler = async (_req , res) => {
    res.json(await categoryService.listCategories());
};

export const create: RequestHandler = async (req ,res) => {
    const input = createCategorySchema.parse(req.body);
    res.status(201).json(await categoryService.createCategory(input));
};

export const update: RequestHandler = async (req , res) => {
    const { id } = idParamSchema.parse(req.params);
    const input = updateCategorySchema.parse(req.body);
    res.json(await categoryService.updateCategory(id, input));
};

export const remove: RequestHandler = async (req ,res) => {
    const { id } = idParamSchema.parse(req.params);
    await categoryService.deleteCategory(id);
    res.status(204).end();
};





