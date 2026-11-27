import emptyImg from "../assets/empty_favoruite.png";
import { PiShoppingCartLight, PiTrash } from "react-icons/pi";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

function Favoruite() {
  const { wishlist, removeFromWishlist , addToCart} = useShop();

  return (
    <>
      <div className="dark:bg-gray-90">
        <h1 className="font-bold text-4xl underline underline-offset-12 p-5 dark:bg-gray-800 dark:text-[#01b4bc]">
          My Wishlist
        </h1>
        {wishlist.length === 0 ? (
          <div className="p-5 dark:bg-gray-800">
            <div className="p-5 my-10">
              <img src={emptyImg} className="m-auto rounded-[20px]" alt="" />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-5 justify-center cursor-pointer dark:bg-gray-900">
            {wishlist.map((item, i) => (
              <div className="border dark:border-[#01b4bc] dark:text-[#01b4bc] rounded p-5 my-20" key={i}>
                <Link to={`/details/${item.productId}`}>
                  <img src={item.image} className="w-50 m-auto" alt={item.name} />
                </Link>
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-[1.2rem]">{item.name}</p>
                  <p className="text-[1.2rem]">{item.brand}</p>
                  <p className="text-[1.2rem]">{item.price}</p>
                  {!item.isActive && <p class="text-red-500">Not available</p>}
                </div>
                <div className="gap-3 flex justify-end py-3">
                  <button className="cursor-pointer" onClick={() => removeFromWishlist(item.productId)}>
                    <PiTrash size={30} />
                  </button>
                  <button className="cursor-pointer" disabled={!item.isActive} onClick={() => addToCart(item.productId)}>
                    <PiShoppingCartLight size={30} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Favoruite;
