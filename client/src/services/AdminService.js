import { api } from "../api/axiosInstance";
import { getErrorMessage } from "./AuthServices";

async function call(promise, fallback) {
    try {
      const res = await promise;
      return res.data;  
    } catch (error) {
        throw new Error(getErrorMessage(error, fallback))
    };
};

export async function getCategories() {
    const data = await call(api.get("/categories") , "Could not load categories.");
    return Array.isArray(data) ? data : data.items ?? [];
};

export const getProducts = (params) => call(api.get("/admin/products" , { params }) , "Could not load products.");
export const createProduct = (body) => call(api.post("/products" , body) , "Could not create the product.");
export const updateProduct = (id , body) => call(api.patch(`/products/${id}` , body) , "Could not update the product.");
export const deactiveProduct = (id) => call(api.delete(`/products/${id}`) , "Could not delete the product.");

export const getOrders = (params) => call(api.get("/admin/orders" , { params }) , "Could not load orders.");
export const updateOrderStatus = (id , status) => 
        call(api.patch(`/admin/orders/${id}/status` , { status }) , "Could not update the status.");