import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { cancelOrder , getOrders } from "../services/ShopServices";

const STATUS_COLORS = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELED: "bg-red-100 text-red-800"
};

function MyOrders() {
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");

    const load = useCallback(() => {
        getOrders({ page, limit: 5, status: status || undefined })
                .then(setData)
                .catch((e) => toast.error(e.message));
    },[page, status]);

    useEffect(() => { load(); }, [load]);

    async function handleCancel(id) {
        if (!window.confirm(`Cancel order #${id}?`)) return;
        try {
            await cancelOrder(id);
            toast.success("Order canceled");
            load();
        } catch (e) {
            toast.error(e.message);
        };
    };

    return (
        <div id="orders" className="mt-10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="capitalize text-xl font-semibold">my orders</h2>
                <select 
                 value={status}
                 onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                 className="border rounded p-2 dark:bg-gray-800 dark:border-[#01b4bc]"
                >
                    <option value="">All statuses</option>
                    {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {!data ? <p className="py-5">Loading...</p> : data.items.length === 0 ? (
                <p className="py-5">No orders yet.</p>
            ) : (
                <div className="flex flex-col gap-4 mt-5">
                    {data.items.map((order) => (
                        <div key={order.id} className="border rounded p-4 dark:border-[#01b4bc]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="font-bold">Order #{order.id}</p>
                                <span className={`px-3 py-1 rounded text-sm ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                                <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                                <p className="font-bold">${order.total}</p>
                                {order.status === "PENDING" && (
                                    <button onClick={() => handleCancel(order.id)} className="px-3 py-1 rounded bg-black text-white cursor-pointer">
                                        Cancel
                                    </button>
                                )}
                            </div>
                            <ul className="mt-3 text-sm list-disc pl-5">
                                {order.items.map((i) => (
                                    <li key={i.productId}>{i.productName} x {i.quantity} - ${i.lineTotal}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-5">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer">Prev</button>
                    <span>Page {data.page} / {data.totalPages}</span>
                    <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer">Next</button>
                </div>
            )}
        </div> 
    )
};

export default MyOrders;