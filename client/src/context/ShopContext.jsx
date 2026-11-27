/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import * as shop from "../services/ShopServices";

const shopData = createContext();
export const useShop = () => useContext(shopData);

const EMPTY_CART = { items: [], total: 0 };

function  ShopContext({ children }) {
    const { userJson } = useAuth();
    const navigate = useNavigate();
    const [cart , setCart] = useState(EMPTY_CART);
    const [wishlist, setWishlist] = useState([]);

    // İstifadəçi dəyişəndə (login/logout) səbət və sevimliləri serverdən yenidən yüklə.
    useEffect(() => {
        if (!userJson) {
            setCart(EMPTY_CART);
            setWishlist([]);
            return;
        };
        shop.getCart().then(setCart).catch((e) => toast.error(e.message));
        shop.getWishlist().then(setWishlist).catch((e) => toast.error(e.message));
    }, [userJson?.id]); // eslint-disable-line react-hooks/exhaustive-deps  
    
    function requireLogin() {
        if (userJson) return true;
        toast.error("Please sign in first.");
        navigate("/register/sign-in");
        return false;
    };

    async function run(action, successMessage) {
        try {
            const result = await action();
            if (successMessage) toast.success(successMessage);
            return result;
        } catch (error) {
            toast.error(error.message);
            return null;
        };
    };

    async function addToCart(productId, quantity = 1) {
        if (!requireLogin()) return;
        const data = await run(() => shop.addCartItem(productId, quantity) , "Added to basket!");
        if (data) setCart(data);
    };

    async function setCartQuantity(productId, quantity) {
        if (quantity < 1) return;
        const data = await run(() => shop.updateCartItem(productId, quantity));
        if (data) setCart(data);
    };

    async function  removeFromCart(productId) {
        const ok = await run(async () => {
            await shop.removeCartItem(productId);
            return true;
        }, "Product deleted!");
        if (ok) setCart(await shop.getCart());
    };

    async function addToWishlist(productId) {
        if (!requireLogin()) return;
        const items = await run(() => shop.addWishlistItem(productId) , "Added to wislist!");
        if (items) setWishlist(items);
    };

    async function removeFromWishlist(productId) {
        const ok = await run(async () => {
            await shop.removeWishlistItem(productId);
            return true;
        }, "Wishlist item deleted!");
        if (ok) setWishlist((list) => list.filter((i) => i.productId !== productId));
    };  

    async function checkout(){
        const order = await run(() => shop.createOrder());
        if (order) setCart(EMPTY_CART);
        return order;
    };

    const value = {
        cart,
        wishlist,
        cartCount: cart.items.reduce((sum , i) => sum + i.quantity, 0),
        wishCount: wishlist.length,
        isInWishlist: (productId) => wishlist.some((i) => i.productId === productId),
        addToCart,
        setCartQuantity,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
        checkout
    };

    return <shopData.Provider value={value}>{children}</shopData.Provider>
};

export default ShopContext;
