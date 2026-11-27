import toast from "react-hot-toast";
import { FaBoxOpen } from "react-icons/fa";
import { GoArrowUpRight } from "react-icons/go";
import { IoIosArrowRoundForward } from "react-icons/io";
import { PiHeartStraight, PiTrash } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";  

function Basket() {
  const navigate = useNavigate();
  const { cart, setCartQuantity, removeFromCart, addToWishlist, checkout, cartCount } = useShop();
  const basketElement = cart.items;
  
  const handleIncrease = (item) => setCartQuantity(item.productId, item.quantity + 1);
  const handleDecrease = (item) => setCartQuantity(item.productId, item.quantity - 1);
  const handleRemoveBasket = (productId) => removeFromCart(productId);
  const handleAddFav = (productId) => addToWishlist(productId);

  const calculateTotal = () => cart.total.toFixed(2);
  const getTotalItems = () => cartCount;

  const handleCheckout = async () => {
    if (basketElement.length === 0) return;
    const order = await checkout();
    if (order) {
      toast.success(`Order #${order.id} placed!`);
      navigate("/userDashboard");
    };
};

  return (
    <>
      <div>
        <div className="flex flex-wrap gap-20 justify-around dark:bg-gray-800 p-22 h-full dark:text-[#01b4bc]">
          <div>
            <h1 className="capitalize text-[2.5rem] font-bold p-10 dark:bg-gray-800 dark:text-[#01b4bc]">
              your shopping basket ({getTotalItems()} items)
            </h1>
            {!basketElement || basketElement.length === 0 ? (
              <div className="h-[70dvh] p-10">
                <div className="border relative p-10 mt-10 border-violet-600 rounded">
                  <div className="absolute top-[-20px] left-[48%]">
                    <img
                      src="https://img.freepik.com/free-vector/hurt-face-emoji-illustration_23-2151345562.jpg?t=st=1757850347~exp=1757853947~hmac=6dd5fab34acab5af159da841b7842ababd86f8cdaa576bbeb62ca58db0dbbbbd&w=1480"
                      className="w-[50px]"
                      alt=""
                    />
                  </div>
                  <p className="text-center">
                    Your shopping basket is empty at the moment
                  </p>
                  <img
                    src="https://fast-images.static-thomann.de/pics//images/basket/emptyBasket.jpg"
                    className="m-auto rotate-180"
                    alt="sad emoji image"
                  />
                </div>
              </div>
            ) : (
              basketElement.map((item) => (
                <div
                  className="p-10 dark:bg-gray-800 dark:text-[#01b4bc]"
                  key={item.productId}
                >
                  <div>
                    <hr className="border-neutral-300" />
                  </div>
                  <div className="container flex flex-wrap">
                    <div className="p-5 w-100">
                      <div className="p-5 shadow rounded">
                        <img
                          src={item.image}
                          className="w-full"
                          alt={item.name}
                        />
                      </div>
                      <div className="px-5">
                        <p className="leading-10">
                          <span className="font-bold">{item.brand}</span>{" "}
                          {item.name}
                        </p>
                        <p className="text-green-500 font-semibold">
                          {item.stock > 0 ? "In stock" : "Out of stock"}
                        </p>
                        <div className="py-5 flex gap-5">
                          <div className="cursor-pointer hover:text-violet-700">
                            <PiTrash
                              onClick={() => handleRemoveBasket(item.productId)}
                              size={25}
                            />
                          </div>
                          <div className="flex gap-1 cursor-pointer hover:text-violet-700">
                            <PiHeartStraight onClick={() => handleAddFav(item.productId)} size={25} />
                            <p>Move</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 justify-end">
                          <div className="text-end">
                            <p className="font-bold">
                              <span className="font-semibold">
                                Price : {item.lineTotal}
                              </span>
                              $
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end py-5 items-center">
                            <button
                              onClick={() => handleIncrease(item)}
                              className="px-3 py-2 bg-violet-600 rounded dark:bg-gray-900 dark:hover:bg-[#01b4bc] dark:hover:text-gray-900 cursor-pointer text-white font-bold"
                            >
                              +
                            </button>
                            <p className="font-semibold">
                              {item.quantity}
                            </p>
                            <button
                              onClick={() => handleDecrease(item)}
                              className="px-3 py-2 bg-violet-600 rounded cursor-pointer dark:bg-gray-900 dark:hover:bg-[#01b4bc] dark:hover:text-gray-900 text-white font-bold"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-[#f3f3f3]  flex flex-col gap-6 mt-20 dark:bg-gray-800 rounded w-[500px] p-6">
            <h4 className="font-bold text-center text-[2rem]">Total</h4>

            {/* BURADA TOTAL GÖSTƏRİLİR */}
            <div className="text-center dark:border p-2">
              <div className="flex justify-between px-5 py-2">
                <span className="text-lg">Subtotal:</span>
                <span className="text-lg font-semibold">
                  ${calculateTotal()}
                </span>
              </div>
              <div className="flex justify-between px-5 py-2">
                <span className="text-lg">Items:</span>
                <span className="text-lg font-semibold">{getTotalItems()}</span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between px-5 py-3 bg-violet-100 dark:bg-gray-800 rounded dark:border">
                <span className="text-xl font-bold">Grand Total:</span>
                <span className="text-xl font-bold text-violet-600 dark:text-[#01b4bc]">
                  ${calculateTotal()}
                </span>
              </div>
            </div>

            <p className="text-center border p-2 rounded">
              The prices shown exclude VAT
            </p>
            <div>
              <button onClick={handleCheckout} className="uppercase flex items-center justify-center bg-black dark:bg-gray-900  dark:hover:bg-[#01b4bc] dark:hover:text-gray-900 dark:text-white text-white p-2 m-auto w-[50%] rounded-full cursor-pointer hover:bg-[#7f01f3] transition-all duration-500 font-bold">
                <p>to checkout</p>
                <IoIosArrowRoundForward size={30} />
              </button>
            </div>

            <div className="flex flex-col w-full border border-neutral-200 dark:border-[#01b4bc] rounded">
              <div className="flex items-center gap-5 p-2">
                <FaBoxOpen size={60} />
                <p className="font-semibold ex-sm:text-[2rem] md:text-[2rem] sm:text-[2rem] lg:text-lg xl:text-lg">
                  Standard Delivery
                </p>
              </div>
              <div className="p-5">
                <p className="ex-sm:text-[1.5rem] md:text-[1.5rem] sm:text-[1.5rem] lg:text-lg xl:text-lg">
                  All items in your shopping basket are in stock and can be
                  shipped immediately
                </p>
              </div>
              <div className="bg-[#f5f5f5] dark:bg-gray-800 flex w-full mt-5 p-3 gap-2 items-center hover:text-violet-600 cursor-pointer">
                <p className="ex-sm:text-[2rem] md:text-[2rem] sm:text-[2rem] lg:text-lg xl:text-lg">
                  Shipping information
                </p>
                <GoArrowUpRight className="ex-sm:text-[2rem] md:text-[2rem] sm:text-[2rem] lg:text-lg xl:text-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Basket;
