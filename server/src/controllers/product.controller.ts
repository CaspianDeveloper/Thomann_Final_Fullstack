import type { RequestHandler } from "express";
import { idParamSchema , listProductsQuerySchema } from "../schemas/product.schema";
import * as productService from "../services/product.service";

export const list: RequestHandler = async (req , res) => {
    const query = listProductsQuerySchema.parse(req.query);
    res.json(await productService.listProducts(query));
};

export const getOne: RequestHandler = async (req ,res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await productService.getProduct(id));
};

