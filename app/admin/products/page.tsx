"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: number;
  productCode: string;
  productName: string;
  description: string | null;
  isActive: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoadingData(true);

      const response = await fetch("/api/products");
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products);
      }
    } catch {
      setError("Gagal mengambil data product");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productCode,
          productName,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal menambahkan product");
        return;
      }

      setMessage("Product berhasil ditambahkan");

      setProductCode("");
      setProductName("");
      setDescription("");

      await loadProducts();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Master Product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Kelola data product produksi
        </p>
      </div>

      {/* Form */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Add Product
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          {/* Product Code */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product Code
            </label>

            <input
              type="text"
              value={productCode}
              onChange={(event) =>
                setProductCode(event.target.value)
              }
              placeholder="Contoh: PRD-001"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* Product Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product Name
            </label>

            <input
              type="text"
              value={productName}
              onChange={(event) =>
                setProductName(event.target.value)
              }
              placeholder="Nama product"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Deskripsi product (opsional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Message */}
          <div className="md:col-span-2">
            {message && (
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Product Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Product List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Product Code</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loadingData ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Belum ada product
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-600">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {product.productCode}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {product.productName}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {product.description || "-"}
                    </td>

                    <td className="px-6 py-4">
                      {product.isActive ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}