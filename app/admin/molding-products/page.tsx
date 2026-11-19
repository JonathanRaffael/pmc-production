
"use client";

import { useEffect, useMemo, useState } from "react";

type MoldingProduct = {
  id: number;
  computerCode: string;
  productName: string;
  productDescription: string | null;
  hardnessRequirements: string | null;
  colorRequirements: string | null;
  rawMaterialRequirements: string | null;
  shotWeight: number | string;
  setupWeight: number | string;
  cavity: number;
  materialSetup: number | string;
  vulcanization: number | string;
  materialRemoval: number | string;
  productionTime: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormData = {
  computerCode: string;
  productName: string;
  productDescription: string;
  hardnessRequirements: string;
  colorRequirements: string;
  rawMaterialRequirements: string;
  shotWeight: string;
  setupWeight: string;
  cavity: string;
  materialSetup: string;
  vulcanization: string;
  materialRemoval: string;
  productionTime: string;
};

const initialForm: FormData = {
  computerCode: "",
  productName: "",
  productDescription: "",
  hardnessRequirements: "",
  colorRequirements: "",
  rawMaterialRequirements: "",
  shotWeight: "",
  setupWeight: "0",
  cavity: "",
  materialSetup: "",
  vulcanization: "",
  materialRemoval: "",
  productionTime: "8",
};

const PAGE_SIZE = 10;

export default function MoldingProductsPage() {
  const [products, setProducts] = useState<MoldingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [error, setError] = useState("");

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/molding-products", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Gagal mengambil data molding product"
        );
      }

      setProducts(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Fetch molding products error:", error);
      setProducts([]);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data molding product"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter((product) =>
      [
        product.computerCode,
        product.productName,
        product.productDescription,
        product.hardnessRequirements,
        product.colorRequirements,
        product.rawMaterialRequirements,
      ].some((value) => value?.toLowerCase().includes(keyword))
    );
  }, [products, search]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  function updateForm(field: keyof FormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(product: MoldingProduct) {
    setEditingId(product.id);

    setForm({
      computerCode: product.computerCode,
      productName: product.productName,
      productDescription: product.productDescription ?? "",
      hardnessRequirements: product.hardnessRequirements ?? "",
      colorRequirements: product.colorRequirements ?? "",
      rawMaterialRequirements: product.rawMaterialRequirements ?? "",
      shotWeight: String(product.shotWeight ?? ""),
      setupWeight: String(product.setupWeight ?? "0"),
      cavity: String(product.cavity ?? ""),
      materialSetup: String(product.materialSetup ?? ""),
      vulcanization: String(product.vulcanization ?? ""),
      materialRemoval: String(product.materialRemoval ?? ""),
      productionTime: String(product.productionTime ?? "8"),
    });

    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  }

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.computerCode.trim()) {
      setError("Computer Code wajib diisi.");
      return;
    }

    if (!form.productName.trim()) {
      setError("Product Name wajib diisi.");
      return;
    }

    const values = {
      shotWeight: Number(form.shotWeight),
      setupWeight: Number(form.setupWeight || 0),
      cavity: Number(form.cavity),
      materialSetup: Number(form.materialSetup),
      vulcanization: Number(form.vulcanization),
      materialRemoval: Number(form.materialRemoval),
      productionTime: Number(form.productionTime),
    };

    if (
      Object.values(values).some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      setError(
        "Semua parameter produksi harus berupa angka valid dan tidak boleh negatif."
      );
      return;
    }

    if (values.shotWeight <= 0) {
      setError("Shot Weight harus lebih besar dari 0.");
      return;
    }

    if (!Number.isInteger(values.cavity) || values.cavity <= 0) {
      setError("Cavity harus berupa bilangan bulat lebih besar dari 0.");
      return;
    }

    if (values.productionTime <= 0) {
      setError("Production Time harus lebih besar dari 0.");
      return;
    }

    const payload = {
      computerCode: form.computerCode.trim(),
      productName: form.productName.trim(),
      productDescription: form.productDescription.trim() || null,
      hardnessRequirements: form.hardnessRequirements.trim() || null,
      colorRequirements: form.colorRequirements.trim() || null,
      rawMaterialRequirements: form.rawMaterialRequirements.trim() || null,

      shotWeight: values.shotWeight,
      setupWeight: values.setupWeight,
      cavity: values.cavity,
      materialSetup: values.materialSetup,
      vulcanization: values.vulcanization,
      materialRemoval: values.materialRemoval,
      productionTime: values.productionTime,
    };

    try {
      setSaving(true);
      setError("");

      const url = editingId
        ? `/api/molding-products/${editingId}`
        : "/api/molding-products";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Gagal menyimpan molding product"
        );
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);

      await fetchProducts();
    } catch (error) {
      console.error("Save molding product error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan molding product"
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  function confirmDelete(id: number) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (deleteId === null) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `/api/molding-products/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Gagal menghapus molding product"
        );
      }

      setDeleteOpen(false);
      setDeleteId(null);

      await fetchProducts();
    } catch (error) {
      console.error("Delete molding product error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menghapus molding product"
      );

      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  // =====================================================
  // TOGGLE STATUS
  // =====================================================

  async function toggleStatus(product: MoldingProduct) {
    try {
      setError("");

      const response = await fetch(
        `/api/molding-products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !product.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Gagal mengubah status"
        );
      }

      await fetchProducts();
    } catch (error) {
      console.error("Toggle molding product status error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status"
      );
    }
  }

  // =====================================================
  // FORMAT NUMBER
  // =====================================================

  function formatNumber(value: number | string) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "-";

    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 4,
    }).format(number);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-full bg-slate-50">
      {/* HEADER */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Molding Products
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Master data produk untuk Molding Production Target.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>

              Add Molding Product
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {error && !modalOpen && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SEARCH */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search computer code, product name..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="text-sm text-slate-500">
              Total:{" "}
              <span className="font-semibold text-slate-800">
                {filteredProducts.length}
              </span>{" "}
              product
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1700px] w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {[
                    "No.",
                    "Computer Code",
                    "Product Name",
                    "Description",
                    "Hardness",
                    "Color",
                    "Raw Material",
                    "Shot Weight (KG)",
                    "Setup Weight (KG)",
                    "Cavity",
                    "Material Setup",
                    "Vulcanization",
                    "Material Removal",
                    "Production Time (H)",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={16}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-4 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-6 w-6 text-slate-400"
                        >
                          <path d="m21 8-9-5-9 5 9-5Z" />
                          <path d="m3 12 9 5 9-5" />
                          <path d="m3 16 9 5 9-5" />
                        </svg>
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No molding products found
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Belum ada data molding product.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="font-semibold text-slate-800">
                          {product.computerCode}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="font-semibold text-slate-800">
                          {product.productName}
                        </span>
                      </td>

                      <td className="max-w-[220px] px-4 py-4 text-sm text-slate-600">
                        {product.productDescription || "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {product.hardnessRequirements || "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {product.colorRequirements || "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {product.rawMaterialRequirements || "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatNumber(product.shotWeight)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatNumber(product.setupWeight)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatNumber(product.cavity)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatNumber(product.materialSetup)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatNumber(product.vulcanization)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatNumber(product.materialRemoval)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {formatNumber(product.productionTime)} h
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(product)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.isActive
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />

                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => confirmDelete(product.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v5" />
                              <path d="M14 11v5" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          {!loading && filteredProducts.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredProducts.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredProducts.length}
                </span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .filter(
                    (pageNumber) =>
                      totalPages <= 5 ||
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      Math.abs(pageNumber - currentPage) <= 1
                  )
                  .map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        currentPage === pageNumber
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}

      {modalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Molding Product" : "Add Molding Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Masukkan data master produk molding.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(92vh-150px)] overflow-y-auto"
            >
              <div className="space-y-8 p-6">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* PRODUCT INFORMATION */}

                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Product Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Informasi dasar produk molding.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormInput
                      label="Computer Code"
                      required
                      value={form.computerCode}
                      onChange={(value) =>
                        updateForm("computerCode", value)
                      }
                      placeholder="Contoh: RRU15913300DST"
                    />

                    <FormInput
                      label="Product Name"
                      required
                      value={form.productName}
                      onChange={(value) =>
                        updateForm("productName", value)
                      }
                      placeholder="Contoh: PF14815-5T"
                    />

                    <FormTextarea
                      label="Product Description"
                      value={form.productDescription}
                      onChange={(value) =>
                        updateForm("productDescription", value)
                      }
                      placeholder="Contoh: Rubber Foot"
                    />

                    <FormInput
                      label="Hardness Requirements"
                      value={form.hardnessRequirements}
                      onChange={(value) =>
                        updateForm("hardnessRequirements", value)
                      }
                      placeholder="Contoh: 50±5A"
                    />

                    <FormInput
                      label="Color Requirements"
                      value={form.colorRequirements}
                      onChange={(value) =>
                        updateForm("colorRequirements", value)
                      }
                      placeholder="Contoh: Black"
                    />

                    <FormInput
                      label="Raw Material Requirements"
                      value={form.rawMaterialRequirements}
                      onChange={(value) =>
                        updateForm("rawMaterialRequirements", value)
                      }
                      placeholder="Contoh: SH1050U"
                    />
                  </div>
                </section>

                {/* MATERIAL PARAMETERS */}

                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Material Parameters
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Parameter berat material dalam satuan KG.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormInput
                      label="Shot Weight (KG)"
                      required
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      value={form.shotWeight}
                      onChange={(value) =>
                        updateForm("shotWeight", value)
                      }
                      placeholder="Contoh: 0.125"
                    />

                    <FormInput
                      label="Setup Weight (KG)"
                      type="number"
                      step="0.000001"
                      min="0"
                      value={form.setupWeight}
                      onChange={(value) =>
                        updateForm("setupWeight", value)
                      }
                      placeholder="Contoh: 0.500"
                    />
                  </div>
                </section>

                {/* PRODUCTION PARAMETERS */}

                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Production Parameters
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Parameter dasar perhitungan produksi molding.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormInput
                      label="Cavity (PCS)"
                      required
                      type="number"
                      step="1"
                      min="1"
                      value={form.cavity}
                      onChange={(value) =>
                        updateForm("cavity", value)
                      }
                      placeholder="Contoh: 4"
                    />

                    <FormInput
                      label="Material Setup"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.materialSetup}
                      onChange={(value) =>
                        updateForm("materialSetup", value)
                      }
                      placeholder="Durasi setup"
                    />

                    <FormInput
                      label="Vulcanization"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.vulcanization}
                      onChange={(value) =>
                        updateForm("vulcanization", value)
                      }
                      placeholder="Durasi vulcanization"
                    />

                    <FormInput
                      label="Material Removal"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.materialRemoval}
                      onChange={(value) =>
                        updateForm("materialRemoval", value)
                      }
                      placeholder="Durasi material removal"
                    />

                    <FormInput
                      label="Production Time (Hours/Day)"
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.productionTime}
                      onChange={(value) =>
                        updateForm("productionTime", value)
                      }
                      placeholder="Contoh: 8"
                    />
                  </div>
                </section>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6 text-red-500"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v5" />
                <path d="M14 11v5" />
              </svg>
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Delete Molding Product?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Data molding product ini akan dihapus secara permanen.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteId(null);
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// FORM INPUT
// =====================================================

type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
};

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  step,
  min,
}: FormInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

// =====================================================
// FORM TEXTAREA
// =====================================================

type FormTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: FormTextareaProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
