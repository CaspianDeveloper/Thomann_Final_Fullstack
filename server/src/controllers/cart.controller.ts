import type { Request , Response } from "express";
import { addCartItemSchema, updateCartItemSchema } from "../schemas/cart.schema";
import { productIdParamSchema } from "../schemas/common.schema";
import * as cartService from "../services/cart.service";


export async function getCart(req: Request, res: Response) {
    res.json(await cartService.getCart(req.user!.sub));
};


export async  function addItem(req: Request, res: Response) {
    const input = addCartItemSchema.parse(req.body);
    const { created } = await cartService.addItem(req.user!.sub, input);
    res.status(created ? 201 : 200).json(await cartService.getCart(req.user!.sub));
};

export async function updateItem(req: Request, res: Response) {
    const { productId } = productIdParamSchema.parse(req.params);
    const { quantity } = updateCartItemSchema.parse(req.body);
    await cartService.updateItem(req.user!.sub, productId, quantity);
    res.json(await cartService.getCart(req.user!.sub));
};

export async function removeItem(req: Request, res: Response) {
    const { productId } = productIdParamSchema.parse(req.params);
    await cartService.removeItem(req.user!.sub, productId);
    res.status(204).send();
};