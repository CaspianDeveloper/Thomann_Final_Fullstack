import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { LiaEdit } from "react-icons/lia";
import { RiDeleteBin6Line } from "react-icons/ri";
import * as admin from "../services/AdminService";

const STATUSES = ["PENDING" , "PAID", "SHIPPED" , "DELIVERED" , "CANCELED"];
// Backend ilə eyni status maşını (server yenə də yoxlayır)
const NEXT_STATUS = {
  PENDING: ["PAID" , "CANCELED"],
  PAID: ["SHIPPED" , "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: []
};

const EMPTY_FORM = {
  name: "", image: "", description: "", brand: "", subcategory: "",
  price: "", stock: "0", categoryId: "", isActive: true
};

function Pager({ data, onChange }) {
  if (!data || data.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-5">
      <button disabled={data.page <= 1} onClick={() => onChange(data.page -1)} className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer">Prev</button>
      <span>Page {data.page} / {data.totalPages} ({data.total} total)</span>
      <button disabled={data.page >= data.totalPages} onClick={() => onChange(data.page + 1)} className="px-3 py-1 border rounded disabled:opacity-40 cursor-pointer">Next</button>
    </div>
  );
};

/* -------------- Products ------------- */
function ProductsTab() {
  const [data , setData] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search , setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [popUp, setPopUp] = useState({ open: false, id: null });
  const [form , setForm] = useState(EMPTY_FORM);

  const load = useCallback(() => {
    admin.getProducts({ page, limit: 10, search: search || undefined })
          .then(setData)
          .catch((e) => toast.error(e.message));
  },[page, search]);

  useEffect(() => { load(); } , [load]);
  useEffect(() => { admin.getCategories().then(setCategories).catch(() => {}); }, []);

  const handleValues = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };  

  function openCreate() {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "" });
    setPopUp({ open: true, id: null });
  };

  function openEdit(p) {
    setForm({
      name: p.name, image: p.image ?? "", description: p.description ?? "",
      brand: p.brand ?? "", subcategory: p.subcategory ?? "",
      price: String(p.price), stock: String(p.stock),
      categoryId: p.categoryId ?? p.category?.id ?? "", isActive: p.isActive
    });

    setPopUp({ open: true, id: p.id });
  };

  async function handleSubmit() {
    if (!form.name || !form.image || !form.description || !form.brand || form.price === "" || !form.categoryId) {
      return toast.error("Please fill all required fileds!");
    };

    const body = {
      name: form.name.trim(),
      image: form.image.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      subcategory: form.subcategory.trim() || null,
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: Number(form.categoryId),
      isActive: form.isActive
    };

    try {
      if (popUp.id) {
        await admin.updateProduct(popUp.id, body);
        toast.success("Product updated");
      }else {
        await admin.createProduct(body);
        toast.success("Product created");
      };
      setPopUp({ open: false, id: null });
      load();
    } catch (e) {
        toast.error(e.message);
    };    
  };

  async function handleDelete(p) {
    if (!window.confirm(`Deactive "${p.name}"? (it will be hidden from the shop)`)) return;
    try {
      await admin.deactiveProduct(p.id);
      toast.success("Product deactivated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const input = "border p-3 rounded w-full";

  return (
    <>
      {popUp.open && (
        <div className="inset-0 bg-black/50 flex fixed justify-center items-center z-50 overflow-auto">
          <div className="bg-white flex flex-col gap-3 w-150 max-w-[95vw] p-5 rounded">
            <div className="flex justify-between items-center">
              <h1 className="text-[1.6rem] capitalize">{popUp.id ? "edit product" : "add new product"}</h1>
              <button onClick={() => setPopUp({ open: false, id: null })} className="cursor-pointer"><IoClose size={35} /></button>
            </div>
            <input className={input} name="name" placeholder="Name" value={form.name} onChange={handleValues} />
            <input className={input} name="image" placeholder="Image URL (https://...)" value={form.image} onChange={handleValues} />
            <input className={input} name="description" placeholder="Description" value={form.description} onChange={handleValues} />
            <input className={input} name="brand" placeholder="Brand" value={form.brand} onChange={handleValues} />
            <input className={input} name="subcategory" placeholder="Subcategory" value={form.subcategory} onChange={handleValues} />
            <select className={input} name="categoryId" value={form.categoryId} onChange={handleValues}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-3">
              <input className={input} name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={handleValues} />
              <input className={input} name="stock" type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={handleValues} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleValues} /> Active (visible in the shop)
            </label>
            <button onClick={handleSubmit} className="capitalize bg-black text-white p-3 rounded cursor-pointer">
              {popUp.id ? "save changes" : "create product"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 py-4">
        <button onClick={openCreate} className="capitalize cursor-pointer p-3 rounded bg-black text-white">add new product</button>
        <form 
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}
        >
          <input className="border p-2 rounded" placeholder="Search products..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button className="px-3 border rounded cursor-pointer">Search</button>
        </form>
      </div>

      <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
              <thead className="bg-gray-200">
                <tr className="text-left">
                  <th className="p-3">ID</th><th className="p-3">Image</th><th className="p-3">Name</th>
                  <th className="p-3">Category</th><th className="p-3">Brand</th>
                  <th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th>
                  <th className="p-3">Status</th><th className="p-3">Operations</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3">{p.id}</td>
                    <td className="p-3 w-24">{p.image && <img src={p.image} alt={p.name} />}</td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.category?.name}</td>
                    <td className="p-3">{p.brand}</td>
                    <td className="p-3 text-right">${p.price}</td>
                    <td className="p-3 text-right">{p.stock}</td>
                    <td className="p-3">{p.isActive ? "Active" : <span className="text-red-600">Inactive</span>}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                          <span onClick={() => openEdit(p)} className="cursor-pointer"><LiaEdit size={26} /></span>
                          <span onClick={() => handleDelete(p)} className="cursor-pointer"><RiDeleteBin6Line size={26} /></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
      </div>
      <Pager data={data} onChange={setPage} />
    </>
  );
};


/* ----------------- Orders ---------------- */
function OrdersTab() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    admin.getOrders({ page, limit: 10, status: status || undefined })
          .then(setData)
          .catch((e) => toast.error(e.message));
  },[page, status]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(order, next) {
    if (!window.confirm(`Change order #${order.id} from ${order.status} to ${next}?`)) return;
    try {
      await admin.updateOrderStatus(order.id, next);
      toast.success(`Order #${order.id} -> ${next}`);
      load();
    } catch (e) {
        toast.error(e.message)
    }
  };

  return (
    <>
      <div className="py-4">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border p-2 rounded">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
      </div>
      <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
              <thead className="bg-gray-200">
                <tr className="text-left">
                  <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Date</th>
                  <th className="p-3">Items</th><th className="p-3 text-right">Total</th>
                  <th className="p-3">Status</th><th className="p-3">Change status</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((o) => (
                  <tr key={o.id} className="border-b align-top">
                      <td className="p-3">${o.id}</td>
                      <td className="p-3">{o.user?.firstName} {o.user?.lastName}<br /><span className="text-gray-500">{o.user?.email}</span></td>
                      <td className="p-3">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="p-3">{o.items.map((i) => <div key={i.productId}>{i.productName} x {i.quantity}</div>)}</td>
                      <td className="p-3">${o.total}</td>
                      <td className="p-3">{o.status}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {NEXT_STATUS[o.status].length === 0 && <span className="text-gray-500">Final</span>}
                          {NEXT_STATUS[o.status].map((next) => (
                            <button key={next} onClick={() => changeStatus(o, next)} className="px-2 py-1 rounded bg-black text-white cursor-pointer">
                              → {next} 
                            </button>
                          ))}
                        </div>
                      </td>
                  </tr>  
                ))}
              </tbody>
          </table>
      </div>
      <Pager data={data} onChange={setPage} />
    </>
  );
};


/* ---------------- Page -------------------- */
function Admin() {
    const [tab, setTab] = useState("products");
    const tabClass = (name) => 
        `px-4 py-2 rounded cursor-pointer ${tab === name ? "bg-black text-white" : "border"}`;

    return (
      <div className="container p-2 mx-auto sm:p-4">
          <div className="py-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold capitalize">admin panel</h2>
              <Link to="Thomann" className="underline">← Back to shop</Link>
          </div>
          <div className="flex gap-3">
              <button className={tabClass("products")} onClick={() => setTab("products")}>Products</button>
              <button className={tabClass("orders")} onClick={() => setTab("orders")}>Orders</button>
          </div>
          {tab === "products" ? <ProductsTab /> : <OrdersTab />}
      </div>
    )
};

export default Admin;