"use client";

import { FormEvent, useState } from "react";

type ProductFormProps = {
  onProductCreated?: () => void;
};

export default function ProductForm({
  onProductCreated,
}: ProductFormProps) {
  // =====================================================
  // FORM STATE
  // =====================================================

  const [productCode, setProductCode] =
    useState("");

  const [productName, setProductName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [shotWeight, setShotWeight] =
    useState("");

  const [shotWeightUnit, setShotWeightUnit] =
    useState("KG");

  const [quantityUnit, setQuantityUnit] =
    useState("PCS");

  const [productionTarget8H, setProductionTarget8H] =
    useState("");

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // =====================================================
  // SUBMIT
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
        productCode
          .trim()
          .toUpperCase();

      const cleanProductName =
        productName.trim();

      const cleanDescription =
        description.trim();

      // =================================================
      // VALIDATE PRODUCT CODE
      // =================================================

      if (!cleanProductCode) {
        setError(
          "Product code wajib diisi."
        );
        return;
      }

      // =================================================
      // VALIDATE PRODUCT NAME
      // =================================================

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
      // PARSE PRODUCTION TARGET
      // =================================================

      const parsedTarget8H =
        Number(
          productionTarget8H
        );

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
      // SEND API
      // =================================================

      const response =
        await fetch(
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
                cleanDescription ||
                null,

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

      // =================================================
      // API ERROR
      // =================================================

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
      // REFRESH PRODUCT LIST
      // =================================================

      if (onProductCreated) {
        onProductCreated();
      }
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
    <div className="rounded-xl bg-white p-6 shadow-sm">

      {/* =================================================
          TITLE
      ================================================= */}

      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Add Product
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Tambahkan product baru ke master product.
        </p>
      </div>

      {/* =================================================
          FORM
      ================================================= */}

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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            PRODUCTION TARGET
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            MESSAGE
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

          {/* =================================================
              BUTTON
          ================================================= */}

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
  );
}