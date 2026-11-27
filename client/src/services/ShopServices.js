import { api } from "../api/axiosInstance";
import { getErrorMessage } from "./AuthServices";

async function call(promise, fallback) {
    try {
        const res = await promise;
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, fallback));
    };
};

export const cancelOrder = (id) => call(api.post(`/orders/${id}/cancel`) , "Could not cancel the order.");  

export const getCart = () => call(api.get("/cart") , "Could not load the cart.");
export const addCartItem = (productId, quantity = 1) => 
        call(api.post("/cart/items" , { productId, quantity }), "Could not add the cart.");
export const updateCartItem = (productId, quantity) => 
        call(api.patch(`/cart/items/${productId}` , { quantity }), "Could not update the cart.");
export const removeCartItem = (productId) => 
        call(api.delete(`/cart/items/${productId}`) , "Could not remove the item.");

export const getWishlist = async () => {
    const data = await call(api.get("/wishlist") , "Could not load the wishlist.");
    return data.items;
};

export const addWishlistItem = async (productId) => {
    const data = await call(api.post("/wishlist" , { productId }) , "Could not add to wishlist.");
    return data.items;
};

export const removeWishlistItem = async (productId) => 
        call(api.delete(`/wishlist/${productId}`) , "Could not remove the item.");

export const createOrder = () => call(api.post("/orders" , {}) , "Checkout failed.");
export const getOrders = (params) => call(api.get("/orders" , { params }), "Could not load orders.");  