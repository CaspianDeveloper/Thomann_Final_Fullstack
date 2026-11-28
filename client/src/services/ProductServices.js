import { api } from "../api/axiosInstance";
import { getErrorMessage } from "./AuthServices";

// Köhnə datada olan qısa başlıq (head_categ) yeni bazada saxlanılmır, Header üçün burada qalır.
const HEAD_LABELS = {
    "Guitars and Basses": "Guit/Bass",
    "Drums and Percussion": "Drums",
    "Studio and Recording Equipment": "Studio",
    "Effect and Signal Processors": "Effect/Signal",
    "Acoustic Guitar Amps": "Amplifiers",
    "Traditional Instruments": "Traditional",
    "Sheet Music": "Sheet",
    "Cables and Connectors": "Cables",
    "Broadcast & Video": "Video",
    "Home Audio": "Audio",
    "Cases, Racks and Bags": "Accessories",
    "DJ Equipment": "DJ",
    "PA Equipment": "PA"
};

const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£" };

// Yeni API məhsulunu komponentlərin gözlədiyi köhnə formata çevirlməsi.
export function mapProduct(p, catImages = {}) {
    const categoryName = p.category?.name ?? "";
    const images = p.images ?? [];
    const thumbs = {};
    for (let i = 0; i < 6; i++) {
        thumbs[`thumb_img_${i + 1}`] = images[i] ?? p.image;
    };

    return {
        id: p.id,
        name: p.name,
        category: categoryName,
        head_categ: HEAD_LABELS[categoryName] ?? categoryName,
        cat_img: catImages[categoryName] ?? "",
        subCategory: p.subCategory,
        brand: p.brand,
        brand_img: p.brandImg,
        price: p.price,
        currency: p.currency,
        currency_symbl: CURRENCY_SYMBOLS[p.currency] ?? "$",
        description: p.description,
        characterics: p.specs ?? {},
        availability: p.availability,
        rating: p.rating,
        reviews_count: p.reviewCount,
        image: p.image,
        stock: p.stock,
        ...thumbs
    };
};

async function getCategoryImages() {
    try {
        const { data } = await api.get("/categories");
        const list = Array.isArray(data) ? data : data.items ?? [];
        return Object.fromEntries(list.map((c) => [c.name, c.imageUrl]));
    } catch {
        return {};
    }
};

// Server səhifələmə ilə işləyir (max limit 50), buna görə bütün səhifələr toplanır.
export async function getAllProducts() {
    const catImages = await getCategoryImages();
    const all = [];
    let page = 1;
    let totalPages = 1;

    do {
        const  { data } = await api.get("/products" , { params: { page, limit: 50 } });
        all.push(...data.items);
        totalPages = data.totalPages;
        page += 1;
    } while (page <= totalPages);

    return all.map((p) => mapProduct(p, catImages));
};

export async function getCategoryList() {
    const { data } = await api.get("/categories");
    return Array.isArray(data) ? data : data.items ?? [];
};

// Serverdən bir səhifə məhsul (səhifələmə + axtarış + kateqoriya filtri)
export async function getProductsPage({ page = 1 , limit = 12, search, category, sort}) {
    try {
        const { data } = await api.get("/products" , {
            params: { page, limit, search, category, sort }
        });

        return {
            items: data.items.map((p) => mapProduct(p)),
            page: data.page,
            totalPages: data.totalPages,
            total: data.total
        };
    } catch (error) {
        throw new Error(getErrorMessage(error, "Could not load products."));
    }
};
