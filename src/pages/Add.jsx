import React, { useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

// Categories that need size-based stock
const SIZED_CATEGORIES = ["Shirt", "Jeans", "Combo", "Tshirt"];

// Size keys per category — must match what getAvailableSizes() returns on frontend
const SIZE_KEYS = {
  Shirt:  ["S", "M", "L", "XL"],
  Tshirt: ["S", "M", "L", "XL"],
  Combo:  ["S", "M", "L", "XL"],
  Jeans:  ["28", "30", "32", "34"],
};

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Shirt");
  const [subCategory, setSubCategory] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);

  // ✅ Stock states
  const [simpleStock, setSimpleStock] = useState("");
  const [sizeStock, setSizeStock] = useState({ S: "", M: "", L: "", XL: "" });

  const isSizedCategory = SIZED_CATEGORIES.includes(category);
  // Get correct size keys for the current category
  const currentSizeKeys = SIZE_KEYS[category] || ["S", "M", "L", "XL"];

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!name || !description || !price || !category || !subCategory) {
      return toast.error("Please fill all required fields!");
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes));

      // ✅ Append stock based on category type
      if (isSizedCategory) {
        const stockObj = {};
        currentSizeKeys.forEach(k => {
          stockObj[k] = Number(sizeStock[k]) || 0;
        });
        formData.append("stock", JSON.stringify(stockObj));
      } else {
        formData.append("stock", JSON.stringify(Number(simpleStock) || 0));
      }

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(`${backendUrl}/api/product/add`, formData, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setName("");
        setDescription("");
        setPrice("");
        setSubCategory("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setSizes([]);
        setSimpleStock("");
        const keys = SIZE_KEYS[category] || ["S", "M", "L", "XL"];
        const fresh = {};
        keys.forEach(k => fresh[k] = "");
        setSizeStock(fresh);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10 pt-12 sm:pt-16">
      <div className="w-full min-h-screen flex justify-center items-start py-6 sm:py-10 bg-gradient-to-b from-white to-gray-100">
        <form
          onSubmit={onSubmitHandler}
          className="w-full max-w-3xl bg-white/80 backdrop-blur-md shadow-xl border border-gray-300 rounded-2xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 flex flex-col gap-4 sm:gap-6"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-wide text-center text-black uppercase mb-4 sm:mb-6">
            Add New Product
          </h2>

          {/* Image Upload Section */}
          <div>
            <p className="mb-3 text-gray-800 font-medium text-sm sm:text-base">Upload Product Images</p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((num) => (
                <label
                  key={num}
                  htmlFor={`image${num}`}
                  className="cursor-pointer border border-gray-300 hover:border-black transition rounded-xl w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex justify-center items-center overflow-hidden bg-white/60 hover:bg-gray-100"
                >
                  <img
                    className="object-cover w-full h-full"
                    src={
                      !eval(`image${num}`)
                        ? assets.upload_area
                        : URL.createObjectURL(eval(`image${num}`))
                    }
                    alt=""
                  />
                  <input
                    type="file"
                    id={`image${num}`}
                    hidden
                    onChange={(e) => eval(`setImage${num}`)(e.target.files[0])}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <p className="mb-2 text-gray-800 font-medium text-sm sm:text-base">Product Name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:border-black"
              type="text"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Product Description */}
          <div>
            <p className="mb-2 text-gray-800 font-medium text-sm sm:text-base">Product Description</p>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:border-black"
              rows="3"
              placeholder="Write product details"
              required
            />
          </div>

          {/* Category, Subcategory and Price */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
            <div className="flex-1">
              <p className="mb-2 text-gray-800 font-medium text-sm sm:text-base">Category</p>
              <select
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  // Reset stock with correct keys for new category
                  const keys = SIZE_KEYS[newCat] || ["S", "M", "L", "XL"];
                  const fresh = {};
                  keys.forEach(k => fresh[k] = "");
                  setSizeStock(fresh);
                  setSimpleStock("");
                }}
                value={category}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:border-black"
              >
                <option value="Shirt">Shirt</option>
                <option value="Jeans">Jeans</option>
                <option value="Combo">Combo</option>
                <option value="Tshirt">Tshirt</option>
                <option value="Bags">Bags</option>
                <option value="Perfumes">Perfumes</option>
              </select>
            </div>

            <div className="flex-1">
              <p className="mb-2 text-gray-800 font-medium text-sm sm:text-base">Subcategory</p>
              <input
                onChange={(e) => setSubCategory(e.target.value)}
                value={subCategory}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:border-black"
                type="text"
                placeholder="e.g. Slim Fit, Leather"
                required
              />
            </div>

            <div className="flex-1">
              <p className="mb-2 text-gray-800 font-medium text-sm sm:text-base">Price</p>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:border-black"
                type="number"
                placeholder="e.g. 2999"
                required
              />
            </div>
          </div>

          {/* ✅ STOCK INPUT SECTION */}
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="mb-3 text-gray-800 font-semibold text-sm sm:text-base flex items-center gap-2">
              📦 Stock Quantity
            </p>

            {isSizedCategory ? (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Enter available stock per size for <span className="font-semibold text-gray-700">{category}</span>:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentSizeKeys.map((s) => (
                    <div key={s}>
                      <label className="block text-xs font-bold text-gray-600 mb-1 text-center uppercase">
                        Size {s}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={sizeStock[s] ?? ""}
                        onChange={(e) =>
                          setSizeStock((prev) => ({ ...prev, [s]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:border-black bg-white"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Enter total stock for <span className="font-semibold text-gray-700">{category}</span>:
                </p>
                <input
                  type="number"
                  min="0"
                  value={simpleStock}
                  onChange={(e) => setSimpleStock(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black bg-white"
                  placeholder="e.g. 50"
                />
              </div>
            )}
          </div>

          {/* Bestseller Checkbox */}
          <div className="flex items-center gap-3 mt-2">
            <input
              onChange={() => setBestseller((prev) => !prev)}
              checked={bestseller}
              type="checkbox"
              id="bestseller"
              className="w-4 h-4 sm:w-5 sm:h-5 accent-black cursor-pointer"
            />
            <label htmlFor="bestseller" className="text-sm sm:text-base text-gray-800 cursor-pointer font-medium">
              Mark as Bestseller
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-6 sm:mt-8 w-full sm:w-48 mx-auto py-2 sm:py-3 bg-black text-white text-base sm:text-lg tracking-wide rounded-full shadow-md hover:bg-white hover:text-black border border-black transition-all duration-300"
          >
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default Add;