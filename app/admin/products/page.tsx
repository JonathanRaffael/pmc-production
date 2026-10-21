"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: number;

  productCode: string;
  productName: string;
  description: string | null;

  isActive: boolean;

  shotWeight: number | null;
  shotWeightUnit: string | null;

  quantityUnit: string | null;

  productionTarget8H: number | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  // =====================================================
  // PRODUCT FORM
  // =====================================================

  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");

  const [shotWeight, setShotWeight] = useState("");
  const [shotWeightUnit, setShotWeightUnit] =
    useState("KG");

  const [quantityUnit, setQuantityUnit] =
    useState("PCS");

  // =====================================================
  // PRODUCTION TARGET
  // =====================================================

  const [productionTarget8H, setProductionTarget8H] =
    useState("");

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] = useState(false);

  const [loadingData, setLoadingData] =
    useState(true);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  async function loadProducts() {
    try {
      setLoadingData(true);
      setError("");

      const response = await fetch(
        "/api/products",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("PRODUCT API:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch products"
        );
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );
    } catch (error) {
      console.error(
        "Load products error:",
        error
      );

      setError(
        "Gagal mengambil data product"
      );

      setProducts([]);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // =====================================================
  // SUBMIT PRODUCT
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // =================================================
      // CLEAN DATA
      // =================================================

      const cleanProductCode =
        productCode.trim().toUpperCase();

      const cleanProductName =
        productName.trim();

      const cleanDescription =
        description.trim();

      // =================================================
      // VALIDATE PRODUCT
      // =================================================

      if (!cleanProductCode) {
        setError(
          "Product code wajib diisi."
        );
        return;
      }

      if (!cleanProductName) {
        setError(
          "Product name wajib diisi."
        );
        return;
      }

      // =================================================
      // PARSE SHOT WEIGHT
      // =================================================

      const parsedShotWeight =
        Number(shotWeight);

      if (
        shotWeight.trim() === "" ||
        !Number.isFinite(
          parsedShotWeight
        ) ||
        parsedShotWeight <= 0
      ) {
        setError(
          "Shot weight harus lebih dari 0."
        );
        return;
      }

      // =================================================
      // PARSE TARGET 8H
      // =================================================

      const parsedTarget8H =
        Number(productionTarget8H);

      if (
        productionTarget8H.trim() === "" ||
        !Number.isFinite(
          parsedTarget8H
        ) ||
        parsedTarget8H <= 0
      ) {
        setError(
          "Production target / 8H wajib diisi dan harus lebih dari 0."
        );
        return;
      }

      // =================================================
      // SEND TO API
      // =================================================

      const response = await fetch(
        "/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            productCode:
              cleanProductCode,

            productName:
              cleanProductName,

            description:
              cleanDescription || null,

            shotWeight:
              parsedShotWeight,

            shotWeightUnit:
              shotWeightUnit,

            quantityUnit:
              quantityUnit,

            productionTarget8H:
              parsedTarget8H,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "POST PRODUCT RESPONSE:",
        data
      );

      if (!response.ok) {
        setError(
          data.message ||
            "Gagal menambahkan product"
        );

        return;
      }

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        "Product dan production target berhasil ditambahkan."
      );

      // =================================================
      // RESET FORM
      // =================================================

      setProductCode("");
      setProductName("");
      setDescription("");

      setShotWeight("");
      setShotWeightUnit("KG");

      setQuantityUnit("PCS");

      setProductionTarget8H("");

      // =================================================
      // RELOAD DATA
      // =================================================

      await loadProducts();
    } catch (error) {
      console.error(
        "SUBMIT PRODUCT ERROR:",
        error
      );

      setError(
        "Tidak dapat terhubung ke server."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Master Product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Kelola data product produksi
        </p>
      </div>

      {/* =================================================
          FORM
      ================================================= */}

      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Add Product
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          {/* =================================================
              PRODUCT CODE
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product Code
            </label>

            <input
              type="text"
              value={productCode}
              onChange={(event) =>
                setProductCode(
                  event.target.value
                )
              }
              placeholder="Contoh: RTU09236500RW5T"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* =================================================
              PRODUCT NAME
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product Name
            </label>

            <input
              type="text"
              value={productName}
              onChange={(event) =>
                setProductName(
                  event.target.value
                )
              }
              placeholder="Nama product"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Deskripsi product"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* =================================================
              SHOT WEIGHT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Shot Weight
            </label>

            <input
              type="number"
              step="0.000001"
              min="0"
              value={shotWeight}
              onChange={(event) =>
                setShotWeight(
                  event.target.value
                )
              }
              placeholder="Contoh: 0.348"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <p className="mt-1 text-xs text-gray-400">
              Berat shot weight product
            </p>
          </div>

          {/* =================================================
              SHOT WEIGHT UNIT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Shot Weight Unit
            </label>

            <select
              value={shotWeightUnit}
              onChange={(event) =>
                setShotWeightUnit(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="KG">
                Kilogram
              </option>

              <option value="GRAM">
                Gram
              </option>
            </select>
          </div>

          {/* =================================================
              PRODUCTION TARGET / 8H
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Production Target / 8H
            </label>

            <input
              type="number"
              step="0.01"
              min="0"
              value={
                productionTarget8H
              }
              onChange={(event) =>
                setProductionTarget8H(
                  event.target.value
                )
              }
              placeholder="Contoh: 4800"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />

            <p className="mt-1 text-xs text-gray-400">
              Target produksi dalam 8 jam
            </p>
          </div>

          {/* =================================================
              QUANTITY UNIT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Production Quantity Unit
            </label>

            <select
              value={quantityUnit}
              onChange={(event) =>
                setQuantityUnit(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="PCS">
                PCS
              </option>

              <option value="METER">
                Meter
              </option>
            </select>
          </div>

          {/* =================================================
              MESSAGE + BUTTON
          ================================================= */}

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
              {loading
                ? "Menyimpan..."
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* =================================================
          PRODUCT TABLE
      ================================================= */}

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
                <th className="px-6 py-4">
                  No
                </th>

                <th className="px-6 py-4">
                  Product Code
                </th>

                <th className="px-6 py-4">
                  Product Name
                </th>

                <th className="px-6 py-4">
                  Description
                </th>

                <th className="px-6 py-4">
                  Shot Weight
                </th>

                <th className="px-6 py-4">
                  Target / 8H
                </th>

                <th className="px-6 py-4">
                  Quantity Unit
                </th>

                <th className="px-6 py-4">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loadingData ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Belum ada product
                  </td>
                </tr>
              ) : (
                products.map(
                  (
                    product,
                    index
                  ) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50"
                    >
                      {/* NO */}

                      <td className="px-6 py-4 text-gray-600">
                        {index + 1}
                      </td>

                      {/* CODE */}

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {
                          product.productCode
                        }
                      </td>

                      {/* NAME */}

                      <td className="px-6 py-4 text-gray-700">
                        {
                          product.productName
                        }
                      </td>

                      {/* DESCRIPTION */}

                      <td className="px-6 py-4 text-gray-500">
                        {product.description ||
                          "-"}
                      </td>

                      {/* SHOT WEIGHT */}

                      <td className="px-6 py-4 text-gray-700">
                        {product.shotWeight !==
                          null &&
                        product.shotWeight !==
                          undefined
                          ? `${product.shotWeight} ${
                              product.shotWeightUnit ||
                              "KG"
                            }`
                          : "-"}
                      </td>

                      {/* TARGET */}

                      <td className="px-6 py-4 font-medium text-gray-700">
                        {product.productionTarget8H !==
                          null &&
                        product.productionTarget8H !==
                          undefined
                          ? product.productionTarget8H
                          : "-"}
                      </td>

                      {/* QUANTITY UNIT */}

                      <td className="px-6 py-4 text-gray-700">
                        {product.quantityUnit ||
                          "-"}
                      </td>

                      {/* STATUS */}

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
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}