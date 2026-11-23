import type { RequestHandler } from "express";
import { createProductSchema, idParamSchema , listProductsQuerySchema, updateProductSchema } from "../schemas/product.schema";
import * as productService from "../services/product.service";

export const list: RequestHandler = async (req , res) => {
    const query = listProductsQuerySchema.parse(req.query);
    res.json(await productService.listProducts(query));
};

export const getOne: RequestHandler = async (req ,res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await productService.getProduct(id));
};

export const adminList: RequestHandler = async (req, res) => {
    const query = listProductsQuerySchema.parse(req.query);
    res.json(await productService.listProducts(query, { admin: true }));
};

export const create: RequestHandler = async (req , res) => {
    const input = createProductSchema.parse(req.body);
    res.status(201).json(await productService.createProduct(input));
};

export const update: RequestHandler = async (req ,res) => {
    const { id } = idParamSchema.parse(req.params);
    const input = updateProductSchema.parse(req.body);
    res.json(await productService.updateProduct(id , input));
};

export const remove: RequestHandler = async (req ,res) => {
    const { id } = idParamSchema.parse(req.params);
    await productService.deactiveProduct(id);
    res.status(204).end();
};