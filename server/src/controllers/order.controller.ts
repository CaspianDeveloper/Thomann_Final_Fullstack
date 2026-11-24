import type { Request, Response } from "express";
import { createOrderSchema , listOrdersQuerySchema } from "../schemas/order.schema";
import { idParamSchema } from "../schemas/product.schema";
import * as orderService from "../services/order.service";

export async function create(req: Request, res: Response) {
    // Body göndərilməyəndə Express 5-də req.body undefined olur.
    const input = createOrderSchema.parse(req.body ?? {});
    res.status(201).json(await orderService.createOrder(req.user!.sub , input));
};

export async function list(req: Request, res: Response) {
    const q = listOrdersQuerySchema.parse(req.query);
    res.json(await orderService.listOrders(req.user!.sub, q));
};


export async function getOne(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await orderService.getOrder(req.user!.sub, id));
};

export async function cancel(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    res.json(await orderService.cancelOrder(req.user!.sub, id));
};