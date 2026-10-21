"use client";

import { FormEvent, useEffect, useState } from "react";

type Area = {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
};

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD AREAS
  // =====================================================

  async function loadAreas() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/areas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal mengambil data area."
        );
      }

      setAreas(
        Array.isArray(data.areas)
          ? data.areas
          : []
      );
    } catch (error) {
      console.error("Load areas error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data area."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAreas();
  }, []);

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!code.trim()) {
      setError("Area code wajib diisi.");
      return;
    }

    if (!name.trim()) {
      setError("Area name wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal menyimpan area."
        );
      }

      setMessage("Area berhasil ditambahkan.");

      setCode("");
      setName("");

      await loadAreas();
    } catch (error) {
      console.error("Save area error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan area."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Production Areas
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Kelola master production area
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FORM */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Add Area
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Area Code
              </label>

              <input
                type="text"
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="Contoh: MIX"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Area Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Contoh: Mixing"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {message && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Menyimpan..."
                : "Add Area"}
            </button>
          </form>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Area List
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    No
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    Code
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    Area
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : areas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Belum ada area.
                    </td>
                  </tr>
                ) : (
                  areas.map((area, index) => (
                    <tr
                      key={area.id}
                      className="border-t border-gray-100"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {area.code}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {area.name}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}