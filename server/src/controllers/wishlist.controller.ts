import type { Request, Response } from "express";
import { addWishlistItemSchema } from "../schemas/wishlist.schema";
import { productIdParamSchema } from "../schemas/common.schema";
import * as wishlistService from "../services/wishlist.service";

export async function getWishlist(req: Request, res: Response) {
    res.json({ items: await wishlistService.getWishlist(req.user!.sub) });
};



export async function addItem(req: Request, res: Response) {
    const { productId } = addWishlistItemSchema.parse(req.body);
    const { created } = await wishlistService.addItem(req.user!.sub, productId);
    res.status(created ? 201 : 200).json({ items: await wishlistService.getWishlist(req.user!.sub) });
};

export async function removeItem(req: Request, res: Response) {
    const { productId } = productIdParamSchema.parse(req.params);
    await wishlistService.removeItem(req.user!.sub, productId);
    res.status(204).send();
};
