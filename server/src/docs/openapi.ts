import { nullable, z } from "zod";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";
import { addCartItemSchema, updateCartItemSchema } from "../schemas/cart.schema"; 
import { addWishlistItemSchema } from "../schemas/wishlist.schema";
import { createOrderSchema, updateOrderStatusSchema } from "../schemas/order.schema";
import { maximum, minimum } from "zod/mini";

type Json = Record<string, unknown>;
type Resp = string | { description: string; ref: string };

// Zod sxemini OpenAPI JSON Schema-ya çevirir ($schema açarı atılır).
function toJson(schema: z.ZodType): Json {
    const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, {
        target: "openapi-3.0",
        io: "input",
        unrepresentable: "any",
    }) as Json;
    return rest;
};

const ref = (name: string): Json => ({$ref: `#/components/schemas/${name}`});

function responses(r: Record<string, Resp>): Json {
    const out: Json = {};
    for (const [code, value] of Object.entries(r)) {
        const description = typeof value === "string" ? value : value.description;

        if (code === "204") {
            out[code] = { description };
        }else if (code.startsWith("2")) {
            const schema = typeof value === "string" ? { type: "object" } : ref(value.ref);
            out[code] = { description, content: { "application/json": { schema } } };
        }else {
            out[code] = { description, content: { "application/json": { schema: ref("Error") } } };
        };
    };

    return out;
};

interface OpInput {
    tag: string;
    summary: string;
    auth?: boolean;
    parameters?: Json[];
    body?: z.ZodType;
    bodyRequired?: boolean;
    responses: Record<string, Resp>;
};

function op(i: OpInput): Json {
    return {
        tags: [i.tag],
        summary: i.summary,
        ...(i.auth ? { security: [{ bearerAuth: [] }] } : {}),
        ...(i.parameters ? { parameters: i.parameters } : {}),
        ...(i.body 
            ? {
                requestBody: { 
                    required: i.bodyRequired ?? true,
                    content: { "application/json": { schema: toJson(i.body) }, } ,
            },
         }
     : {}),
     responses: responses(i.responses),
    };
};


const pathInt = (name: string): Json => ({
    name,
    in: "path",
    required: true,
    schema: { type: "integer", minimum: 1 },
});

const query = (name: string, schema: Json, description?: string): Json => ({
    name,
    in: "query",
    schema,
    ...(description ? { description } : {}),
});

const pageQuery = [
    query("page" , { type: "integer", minimum: 1, default: 1 }),
    query("limit" , { type: "integer" , minimum: 1, maximum: 50, default: 10 }),
];

const orderStatuses = ["PENDING" , "PAID" , "SHIPPED" , "DELIVERED", "CANCELED"];
const orderSorts = ["newest" , "oldest" , "total_asc" , "total_desc"];

const E400 = "Validation error";
const E401 = "Missing or invalid token";
const E403 = "Admin role required";
const E404 = "Not found";

export const openapi: Json = {
    openapi: "3.0.3",
    info: {
        title: "Thomann Shop API",
        version: "1.0.0",
        description: 
            "REST API of an online musical-instruments shop: catalog, cart, wishlist, orders and admin managment. " + 
            "Authenticate with POST /auth/login, then click Authorize and paste the token. " + 
            "All errors share one format: { error: { code, message, details? } }.",
    },
    servers: [{ url: "/" , description: "Current server" }],
    tags: [
        { name: "System" },
        { name: "Auth" },
        { name: "Categories" },
        { name: "Products" },
        { name: "Cart" },
        { name: "Wishlist" },
        { name: "Orders" }, 
        { name: "Admin" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http" , scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    error: {
                        type: "object",
                        properties: {
                            code: { type: "string", example: "VALIDATION_ERROR" },
                            message: { type: "string" },
                            details: { type: "array", items: { type: "object" } },
                        },
                        required: ["code" , "message"],
                    },
                },
            },
            Product: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    description: { type: "string" },
                    brand: { type: "string" },
                    subcategory: { type: "string", nullable: true },
                    price: { type: "number", example: 689 },
                    currency: { type: "string", example: "USD" },
                    stock: { type: "integer" },
                    rating: { type: "number", nullable: true },
                    reviewsCount: { type: "integer" },
                    image: { type: "string", format: "url" },
                    images: { type: "array", items: { type: "string", format: "url" } },
                    brandImg: { type: "string", format: "url", nullable: true },
                    specs: { type: "object" },
                    isActive: { type: "boolean" },
                    categoryId: { type: "integer" },
                    category: {
                        type: "object",
                        properties: {
                            id: { type: "integer" },
                            name: { type: "string" },
                            slug: { type: "string" },
                        },
                    },
                },
            },
            OrderItem: {
                type: "object",
                properties: {
                    productId: { type: "integer" },
                    productName: { type: "string" },
                    unitPrice: { type: "number" },
                    quantity: { type: "integer" },
                    lineTotal: { type: "number" },
                },
            },
            Order: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    status: { type: "string" , enum: orderStatuses },
                    total: { type: "number" },
                    shippingAddress: { type: "object" },
                    createdAt: { type: "string", format: "date-time" },
                    items: { type: "array", items: ref("OrderItem") },
                },
            },
        },
    },
    paths: {
        "/health": {
            get: op({ tag: "System", summary: "Health check", responses: { "200": "Server is up" } }),
        },
        "/auth/register": {
            post: op({
                tag: "Auth",
                summary: "Log in and receive a JWT",
                body: registerSchema,
                responses: { "201": "User created" , "400": E400, "409": "Email already registered" },
            }),
        },
        "/auth/login": {
            post: op({
                tag: "Auth",
                summary: "Log in and receive a JWT",
                body: loginSchema,
                responses: { "200": "Token issued" , "400": E400, "401": "Invalid email or password" },
            }),
        },
        "auth/me": {
            get: op({
                tag: "Auth",
                summary: "Current user profile",
                auth: true,
                responses: { "200": "Profile", "401": E401 },
            }),
        },
        
        "/categories": {
            get: op({ tag: "Categories", summary: "List categories with product counts" , responses: { "200": "OK" } }),
            post: op({
                tag: "Categories",
                summary: "Create a category (admin)",
                auth: true,
                body: createCategorySchema,
                responses: { "201": "Created", "400": E400, "401": E401, "403": E403, "409": "Name or slug already exists" },
            }),
        },
        "/categories/{id}": {
            patch: op({
                tag: "Categories",
                summary: "Update a category (admin)",
                auth: true,
                parameters: [pathInt("id")],
                body: updateCategorySchema,
                responses: { "200": "Updated", "400": E400, "401": E401, "403": E403, "404": E404, "409": "Name or slug already exists" },
            }),
            delete: op({
                tag: "Categories",
                summary: "Delete a category (admin). Refused while it has products",
                auth: true,
                parameters: [pathInt("id")],
                responses: { "204": "Deleted", "401": E401, "403": E403, "404": E404, "409": "Category still has products" },
            }),
        },
        "/products": {
            get: op({
                tag: "Products",
                summary: "List active products with pagination, filters and sorting",
                parameters: [
                    query("page" , { type: "integer" , minimum: 1, default: 1 }),
                    query("search" , { type: "string" }, "Match on product name"),
                    query("limit" , { type: "integer" , minimum: 1, maximum: 50, default: 12}),
                    query("category", { type: "string" }, "Category slug"),
                    query("brand" , { type: "string" }),
                    query("minPrice" , { type: "number", minimum: 0 }),
                    query("maxPrice" , { type: "number", minimum: 0 }),
                    query("sort" , {
                        type: "string",
                        enum: ["newest" , "price_asc" , "price_desc" , "name_asc" , "rating_desc"],
                        default: "newest",
                    }),
                ],
                responses: { "200": "Paginated products" , "400": E400 },
            }),
            post: op({
                tag: "Products",
                summary: "Create a product (admin)",
                auth: true,
                body: createProductSchema,
                responses: { "201": { description: "Created" , ref: "Product" }, "400": E400 ,"401": E401, "403": E403, "404": "Category not found" }
            }),
        },
        "/products/{id}": {
            get: op({
                tag: "Products",
                summary: "Get one active product",
                parameters: [pathInt("id")],
                responses: { "200": { description: "OK", ref: "Product" } , "400": E400, "404": E404 },
            }),
            patch: op({
                tag: "Products",
                summary: "Update a product (admin)",
                auth: true,
                parameters: [pathInt("id")],
                body: updateProductSchema,
                responses: { "200": { description: "Updated", ref: "Product" }, "400": E400, "401": E401, "403": E403, "404": E404 },
            }),
            delete: op({
                tag: "Products",
                summary: "Deactive a product (admin). Soft delete: isActive=false",
                auth: true,
                parameters: [pathInt("id")],
                responses: { "204": "Deactivated" , "401": E401, "403": E403, "404": E404 },
            }),
        },
        "/cart": {
            get: op({ tag: "Cart", summary: "My cart with line totals" , auth: true, responses: { "200": "OK", "401": E401 } }),
        },
        "/cart/items": {
            post: op({
                tag: "Cart",
                summary: "Add a product (existing product: quantity increases)",
                auth: true,
                body: addCartItemSchema,
                responses: {
                    "201": "Item added",
                    "200": "Quantity increased",
                    "400": E400,
                    "401": E401,
                    "404": "Product not found or inactive",
                    "409": "Not enough stock",
                },
            }),
        },
        "/cart/items/{productId}": {
            patch: op({
                tag: "Cart",
                summary: "Remove a cart item",
                auth: true,
                parameters: [pathInt("productId")],
                body: updateCartItemSchema,
                responses: { "200": "Updated", "400": E400, "401": E401, "404": E404, "409": "Not enough stock" },
            }),
            delete: op({
                tag: "Cart",
                summary: "Remove a cart item",
                auth: true,
                parameters: [pathInt("productId")],
                responses: { "204": "Removed", "401": E401, "404": E404 },
            }),
        },
        "/wishlist": {
            get: op({ tag: "Wishlist", summary: "My wishlist", auth: true, responses: { "200": "OK", "401": E401 } }),
            post: op({
                tag: "Wishlist",
                summary: "Add a product to my wishlist",
                auth: true,
                body: addWishlistItemSchema,
                responses: { "201": "Added", "200": "Already in wishlist", "400": E400, "401": E401, "404": "Product not found or inactive" },
            }),
        },  
        "/wishlist/{productId}": {
            delete: op({
                tag: "Wishlist",
                summary: "Remove a product from my wishlist",
                auth: true,
                parameters: [pathInt("productId")],
                responses: { "204": "Removed", "401": E401, "404": E404},
            }),
        },
        "/orders": {
            post: op({
                tag: "Orders",
                summary: "Place an order from my cart (one transaction; server computes prices)",
                auth: true,
                body: createOrderSchema,
                bodyRequired: false,
                responses: {
                    "201": { description: "Order created", ref: "Order" },
                    "400": "Empty cart or validation error",
                    "401": E401,
                    "409": "Product inactive or out of stock",
                },
            }),
            get: op({
                tag: "Orders",
                summary: "My orders with pagination, status filter and sorting",
                auth: true,
                parameters: [
                    ...pageQuery,
                    query("status", { type: "string" , enum: orderStatuses }),
                    query("sort" , { type: "string", enum: orderSorts, default: "newest" }),
                ],
                responses: { "200": "Paginated orders" , "400": E400, "401": E401 },
            }),
        },
        "/orders/{id}": {
            get: op({
                tag: "Orders",
                summary: "One of my orders (someone else's order: 404)",
                auth: true,
                parameters: [pathInt("id")],
                responses: { "200": { description: "OK", ref: "Order" } , "401": E401, "404": E404},
            }),
        },
        "/orders/{id}/cancel": {
            post: op({
                tag: "Orders",
                summary: "Cancel any PENDING order and restore stock",
                auth: true,
                parameters: [pathInt("id")],
                responses: { "200": { description: "Canceled", ref: "Order" }, "401": E401, "404": E404 ,"409": "Only PENDING orders can be canceled"},
            }),
        },
        "/admin/products": {
            get: op({
                tag: "Admin",
                summary: "List all products including inactive (admin)",
                auth: true,
                parameters: pageQuery,
                responses: { "200": "OK", "401": E401, "403": E403 },
            }),
        },
        "/admin/orders": {
            get: op({
                tag: "Admin",
                summary: "List all orders (admin)",
                auth: true,
                parameters: [
                    ...pageQuery,
                    query("status" , { type: "string", enum: orderStatuses }),
                    query("userId" , { type: "integer", minumum: 1 }),
                    query("sort" , { type: "string", enum: orderSorts, default: "newest" }),
                ],
                responses: { "200": "Paginated orders with user info", "400": E400, "401": E401, "403": E403 },
            }),
        },
        "/admin/orders/{id}": {
            get: op({
                tag: "Admin",
                summary: "Get any order (admin)",
                auth: true,
                parameters: [pathInt("id")],
                responses: { "200": { description: "OK", ref: "Order" }, "401": E401, "403": E403, "404": E404 },
            }),
        },
        "/admin/orders/{id}/status": {
            patch: op({
                tag: "Admin",
                summary: "Change order status. Forward only: PENDING->PAID->SHIPPED->DELIVERED; CANCELED from PEDING/PAID restores stock",
                auth: true,
                parameters: [pathInt("id")],
                body: updateOrderStatusSchema,
                responses: { "200": { description: "Updated", ref: "Order" }, "400": E400, "401": E401, "403": E403, "404": E404, "409": "Illegal status transition" },
            }),
        },
    },
};

