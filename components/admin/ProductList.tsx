"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

// =====================================================
// TYPES
// =====================================================

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

type EditForm = {
  productCode: string;

  productName: string;

  description: string;

  shotWeight: string;

  shotWeightUnit: string;

  quantityUnit: string;

  target8H: string;

  isActive: boolean;
};

// =====================================================
// PROPS
// =====================================================

type ProductListProps = {
  products: Product[];

  loading?: boolean;

  onRefresh?: () => Promise<void> | void;
};

// =====================================================
// CONSTANT
// =====================================================

const ITEMS_PER_PAGE = 10;

// =====================================================
// COMPONENT
// =====================================================

export default function ProductList({
  products,
  loading = false,
  onRefresh,
}: ProductListProps) {
  // ===================================================
  // SEARCH & FILTER
  // ===================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">(
      "ALL"
    );

  const [currentPage, setCurrentPage] =
    useState(1);

  // ===================================================
  // EDIT
  // ===================================================

  const [editOpen, setEditOpen] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm>({
      productCode: "",
      productName: "",
      description: "",
      shotWeight: "",
      shotWeightUnit: "KG",
      quantityUnit: "PCS",
      target8H: "",
      isActive: true,
    });

  const [saving, setSaving] =
    useState(false);

  // ===================================================
  // DELETE
  // ===================================================

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  // ===================================================
  // MESSAGE
  // ===================================================

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ===================================================
  // FILTER PRODUCTS
  // ===================================================

  const filteredProducts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return products.filter((product) => {
      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      const matchesSearch =
        keyword === "" ||
        product.productCode
          .toLowerCase()
          .includes(keyword) ||
        product.productName
          .toLowerCase()
          .includes(keyword) ||
        (product.description ?? "")
          .toLowerCase()
          .includes(keyword);

      // -----------------------------------------------
      // STATUS
      // -----------------------------------------------

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          product.isActive) ||
        (statusFilter === "INACTIVE" &&
          !product.isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    statusFilter,
  ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProducts.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedProducts =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      const end =
        start + ITEMS_PER_PAGE;

      return filteredProducts.slice(
        start,
        end
      );
    }, [
      filteredProducts,
      currentPage,
    ]);

  // ===================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ===================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
  ]);

  // ===================================================
  // FIX CURRENT PAGE
  // ===================================================

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // ===================================================
  // CLEAR MESSAGE
  // ===================================================

  function clearMessages() {
    setMessage("");
    setError("");
  }

  // ===================================================
  // OPEN EDIT
  // ===================================================

  function openEdit(product: Product) {
    clearMessages();

    setEditingProduct(product);

    setEditForm({
      productCode:
        product.productCode ?? "",

      productName:
        product.productName ?? "",

      description:
        product.description ?? "",

      shotWeight:
        product.shotWeight !== null &&
        product.shotWeight !== undefined
          ? String(product.shotWeight)
          : "",

      shotWeightUnit:
        product.shotWeightUnit ||
        "KG",

      quantityUnit:
        product.quantityUnit ||
        "PCS",

      target8H:
        product.productionTarget8H !==
          null &&
        product.productionTarget8H !==
          undefined
          ? String(
              product.productionTarget8H
            )
          : "",

      isActive:
        product.isActive,
    });

    setEditOpen(true);
  }

  // ===================================================
  // CLOSE EDIT
  // ===================================================

  function closeEdit() {
    if (saving) return;

    setEditOpen(false);

    setEditingProduct(null);
  }

  // ===================================================
  // UPDATE EDIT FORM
  // ===================================================

  function updateEditForm(
    field: keyof EditForm,
    value:
      | string
      | boolean
  ) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // ===================================================
  // SUBMIT EDIT
  // ===================================================

  async function handleEditSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    clearMessages();

    // =================================================
    // CLEAN DATA
    // =================================================

    const productCode =
      editForm.productCode
        .trim()
        .toUpperCase();

    const productName =
      editForm.productName.trim();

    const description =
      editForm.description.trim();

    const shotWeight =
      Number(editForm.shotWeight);

    const target8H =
      Number(editForm.target8H);

    // =================================================
    // VALIDATION
    // =================================================

    if (!productCode) {
      setError(
        "Product code wajib diisi."
      );

      return;
    }

    if (!productName) {
      setError(
        "Product name wajib diisi."
      );

      return;
    }

    if (
      !Number.isFinite(
        shotWeight
      ) ||
      shotWeight <= 0
    ) {
      setError(
        "Shot weight harus lebih dari 0."
      );

      return;
    }

    if (
      !Number.isFinite(
        target8H
      ) ||
      target8H < 0
    ) {
      setError(
        "Production target / 8H tidak valid."
      );

      return;
    }

    // =================================================
    // SEND PATCH
    // =================================================

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/products/${editingProduct.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productCode,

              productName,

              description:
                description || null,

              shotWeight,

              shotWeightUnit:
                editForm.shotWeightUnit,

              quantityUnit:
                editForm.quantityUnit,

              target8H,

              isActive:
                editForm.isActive,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "PATCH PRODUCT RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal memperbarui product."
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        "Product berhasil diperbarui."
      );

      setEditOpen(false);

      setEditingProduct(null);

      // =================================================
      // REFRESH
      // =================================================

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error(
        "EDIT PRODUCT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui product."
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // OPEN DELETE
  // ===================================================

  function openDelete(product: Product) {
    clearMessages();

    setDeletingProduct(product);

    setDeleteOpen(true);
  }

  // ===================================================
  // CLOSE DELETE
  // ===================================================

  function closeDelete() {
    if (deleting) return;

    setDeleteOpen(false);

    setDeletingProduct(null);
  }

  // ===================================================
  // DELETE PRODUCT
  // ===================================================

  async function handleDelete() {
    if (!deletingProduct) {
      return;
    }

    clearMessages();

    try {
      setDeleting(true);

      const response =
        await fetch(
          `/api/products/${deletingProduct.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      console.log(
        "DELETE PRODUCT RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal menonaktifkan product."
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        `Product "${deletingProduct.productCode}" berhasil dinonaktifkan.`
      );

      setDeleteOpen(false);

      setDeletingProduct(null);

      // =================================================
      // REFRESH
      // =================================================

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menonaktifkan product."
      );
    } finally {
      setDeleting(false);
    }
  }

  // ===================================================
  // REFRESH
  // ===================================================

  async function handleRefresh() {
    clearMessages();

    try {
      if (onRefresh) {
        await onRefresh();

        setMessage(
          "Data product berhasil diperbarui."
        );
      }
    } catch (error) {
      console.error(
        "REFRESH PRODUCT ERROR:",
        error
      );

      setError(
        "Gagal memperbarui data product."
      );
    }
  }

  // ===================================================
  // PAGINATION RANGE
  // ===================================================

  const paginationPages =
    useMemo(() => {
      const pages: number[] = [];

      const maxVisible = 5;

      let start = Math.max(
        1,
        currentPage -
          Math.floor(
            maxVisible / 2
          )
      );

      let end = Math.min(
        totalPages,
        start + maxVisible - 1
      );

      if (
        end - start + 1 <
        maxVisible
      ) {
        start = Math.max(
          1,
          end - maxVisible + 1
        );
      }

      for (
        let page = start;
        page <= end;
        page++
      ) {
        pages.push(page);
      }

      return pages;
    }, [
      currentPage,
      totalPages,
    ]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* =================================================
          MAIN PRODUCT LIST
      ================================================= */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  Product List
                </h2>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {filteredProducts.length}{" "}
                  Product
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Kelola master product produksi
              </p>
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h5"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 20v-5h-5"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.07 9A7.99 7.99 0 0119 5.34M19 15a7.99 7.99 0 01-13.93 3.66"
                />
              </svg>

              Refresh
            </button>
          </div>

          {/* =================================================
              SEARCH + FILTER
          ================================================= */}

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            {/* SEARCH */}

            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path
                  d="m20 20-3.5-3.5"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product code, name, description..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </div>

            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "ALL"
                    | "ACTIVE"
                    | "INACTIVE"
                )
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:w-44"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>

          {/* MESSAGE */}

          {message && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12l4 4L19 6"
                />
              </svg>

              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path
                  d="M12 8v4"
                  strokeLinecap="round"
                />

                <path
                  d="M12 16h.01"
                  strokeLinecap="round"
                />
              </svg>

              <span>{error}</span>
            </div>
          )}
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  No
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Product
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Shot Weight
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Target / 8H
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Unit
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                      <p className="mt-3 text-sm text-gray-500">
                        Loading products...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedProducts.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-7 w-7 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle
                            cx="11"
                            cy="11"
                            r="7"
                          />

                          <path
                            d="m20 20-3.5-3.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      <h3 className="mt-4 font-semibold text-gray-900">
                        Product tidak ditemukan
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Coba ubah kata pencarian
                        atau filter status.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(
                  (
                    product,
                    index
                  ) => {
                    const rowNumber =
                      (currentPage - 1) *
                        ITEMS_PER_PAGE +
                      index +
                      1;

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="group transition hover:bg-gray-50"
                      >
                        {/* NO */}

                        <td className="px-6 py-4 text-gray-500">
                          {rowNumber}
                        </td>

                        {/* PRODUCT */}

                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {
                                product.productCode
                              }
                            </div>

                            <div className="mt-1 text-sm text-gray-500">
                              {
                                product.productName
                              }
                            </div>
                          </div>
                        </td>

                        {/* DESCRIPTION */}

                        <td className="max-w-xs px-6 py-4">
                          <p
                            className="truncate text-gray-500"
                            title={
                              product.description ||
                              ""
                            }
                          >
                            {product.description ||
                              "-"}
                          </p>
                        </td>

                        {/* SHOT WEIGHT */}

                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">
                            {product.shotWeight !==
                              null &&
                            product.shotWeight !==
                              undefined
                              ? product.shotWeight
                              : "-"}
                          </span>

                          {product.shotWeight !==
                            null &&
                            product.shotWeight !==
                              undefined && (
                              <span className="ml-1 text-xs text-gray-500">
                                {product.shotWeightUnit ||
                                  "KG"}
                              </span>
                            )}
                        </td>

                        {/* TARGET */}

                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">
                            {product.productionTarget8H !==
                              null &&
                            product.productionTarget8H !==
                              undefined
                              ? product.productionTarget8H.toLocaleString(
                                  "id-ID"
                                )
                              : "-"}
                          </span>
                        </td>

                        {/* UNIT */}

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {product.quantityUnit ||
                              "-"}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">
                          {product.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />

                              Inactive
                            </span>
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2 opacity-100 transition lg:opacity-70 lg:group-hover:opacity-100">
                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  product
                                )
                              }
                              title="Edit product"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  d="M12 20h9"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            {/* DELETE */}

                            {product.isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDelete(
                                    product
                                  )
                                }
                                title="Deactivate product"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M3 6h18"
                                    strokeLinecap="round"
                                  />

                                  <path
                                    d="M8 6V4h8v2"
                                    strokeLinecap="round"
                                  />

                                  <path
                                    d="M19 6l-1 14H6L5 6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  <path
                                    d="M10 11v5M14 11v5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            FOOTER / PAGINATION
        ================================================= */}

        {!loading &&
          filteredProducts.length >
            0 && (
            <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              {/* INFO */}

              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {(currentPage - 1) *
                      ITEMS_PER_PAGE +
                    1}
                </span>{" "}
                -
                <span className="font-semibold text-gray-800">
                  {" "}
                  {Math.min(
                    currentPage *
                      ITEMS_PER_PAGE,
                    filteredProducts.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {
                    filteredProducts.length
                  }
                </span>
              </div>

              {/* PAGINATION */}

              <div className="flex items-center gap-1">
                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>

                {/* FIRST */}

                {paginationPages[0] >
                  1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          1
                        )
                      }
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      1
                    </button>

                    {paginationPages[0] >
                      2 && (
                      <span className="px-1 text-gray-400">
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* PAGE NUMBERS */}

                {paginationPages.map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition ${
                        currentPage ===
                        page
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* LAST */}

                {paginationPages[
                  paginationPages.length -
                    1
                ] <
                  totalPages && (
                  <>
                    {paginationPages[
                      paginationPages.length -
                        1
                    ] <
                      totalPages -
                        1 && (
                      <span className="px-1 text-gray-400">
                        ...
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          totalPages
                        )
                      }
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* NEXT */}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ===================================================
          EDIT MODAL
      =================================================== */}

      {editOpen &&
        editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Edit Product
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Update informasi master
                    product
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeEdit
                  }
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleEditSubmit
                }
              >
                <div className="max-h-[70vh] overflow-y-auto p-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* PRODUCT CODE */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Product Code
                      </label>

                      <input
                        type="text"
                        value={
                          editForm.productCode
                        }
                        onChange={(
                          event
                        ) =>
                          updateEditForm(
                            "productCode",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* PRODUCT NAME */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Product Name
                      </label>

                      <input
                        type="text"
                        value={
                          editForm.productName
                        }
                        onChange={(
                          event
                        ) =>
                          updateEditForm(
                            "productName",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* DESCRIPTION */}

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Description
                      </label>

                      <textarea
                        rows={3}
                        value={
                          editForm.description
                        }
                        onChange={(
                          event
                        ) =>
                          updateEditForm(
                            "description",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* SHOT WEIGHT */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Shot Weight
                      </label>

                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        value={
                          editForm.shotWeight
                        }
                        onChange={(
                          event
                        ) =>
                          updateEditForm(
                            "shotWeight",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* SHOT WEIGHT UNIT */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Shot Weight Unit
                      </label>

                      <select
                        value={
                          editForm.shotWeightUnit
                        }
                        onChange={(
                          event
                        ) =>
                          updateEditForm(
                            "shotWeightUnit",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="KG">
                          Kilogram
                        </option>

                        <option value="GRAM">
                          Gram
                        </option>
                      </select>
                    </div>

                    {/* TARGET */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Production Target / 8H
                      </label>

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={
                          editForm.target8H
                        }
                        onChange={(
                          event
                        ) =>
                          updateEditForm(
                            "target8H",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* QUANTITY UNIT */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Production Quantity Unit
                      </label>

                      <select
                        value={
                          editForm.quantityUnit
                        }
                        onChange={(
                          event
                        ) =>
                          updateEditForm(
                            "quantityUnit",
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="PCS">
                          PCS
                        </option>

                        <option value="METER">
                          Meter
                        </option>
                      </select>
                    </div>

                    {/* STATUS */}

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Status
                      </label>

                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={
                            editForm.isActive
                          }
                          onChange={(
                            event
                          ) =>
                            updateEditForm(
                              "isActive",
                              event
                                .target
                                .checked
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            Active Product
                          </div>

                          <div className="text-xs text-gray-500">
                            Product dapat digunakan
                            dalam proses produksi.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* EDIT ERROR */}

                  {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                {/* FOOTER */}

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeEdit
                    }
                    disabled={saving}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* ===================================================
          DELETE CONFIRMATION
      =================================================== */}

      {deleteOpen &&
        deletingProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              {/* ICON */}

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M3 6h18"
                    strokeLinecap="round"
                  />

                  <path
                    d="M8 6V4h8v2"
                    strokeLinecap="round"
                  />

                  <path
                    d="M19 6l-1 14H6L5 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* TEXT */}

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Deactivate Product?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Product{" "}
                <span className="font-semibold text-gray-800">
                  {
                    deletingProduct.productCode
                  }
                </span>{" "}
                akan dinonaktifkan dan tidak
                akan dianggap sebagai product
                aktif.
              </p>

              <div className="mt-4 rounded-xl bg-yellow-50 px-4 py-3 text-xs leading-5 text-yellow-700">
                Data product tidak benar-benar
                dihapus dari database. Sistem
                menggunakan soft delete dengan
                mengubah status menjadi
                inactive.
              </div>

              {/* ERROR */}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* BUTTON */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeDelete
                  }
                  disabled={deleting}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleDelete
                  }
                  disabled={deleting}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting
                    ? "Deactivating..."
                    : "Deactivate Product"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}