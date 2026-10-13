const columns = [
  { name: "No", width: "w-14" },
  { name: "Date Production", width: "w-36" },
  { name: "Month", width: "w-24" },
  { name: "Days", width: "w-20" },
  { name: "Machine No.", width: "w-28" },
  { name: "Production Area", width: "w-36" },
  { name: "Shift", width: "w-24" },
  { name: "Operator", width: "w-36" },
  { name: "Computer Code", width: "w-32" },
  { name: "Product Name", width: "w-40" },
  { name: "Product Description", width: "w-48" },
  { name: "Output Production", width: "w-36" },
  { name: "Quantity Product OK", width: "w-36" },
  { name: "Total NG Product", width: "w-32" },
  { name: "Product Rate NG (%)", width: "w-36" },
  { name: "Total Actual Raw Material Usage", width: "w-48" },
  { name: "Raw Material Requirement", width: "w-44" },
  { name: "Variance Raw Material", width: "w-40" },
  { name: "Percentage (%)", width: "w-32" },
  { name: "Target Qty Production /8H", width: "w-40" },
  { name: "Variance Product", width: "w-36" },
  { name: "Achievement (%)", width: "w-36" },
  { name: "OT / REPLACE", width: "w-32" },
  { name: "Remarks", width: "w-56" },
];

export default function ProductionTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Production Monitoring
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Daily production monitoring and performance
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          No production data
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-max min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.name}
                  className={`${column.width} border-b border-r border-gray-200 px-4 py-4 text-center align-middle text-xs font-semibold leading-4 text-slate-600 last:border-r-0`}
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="border-b border-gray-100 px-6 py-16 text-center"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l5 5v11a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  <p className="text-sm font-medium text-gray-600">
                    Belum ada data produksi
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Data production akan muncul di sini setelah dilakukan input.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
        <p className="text-xs text-gray-500">
          Total production records: <span className="font-semibold">0</span>
        </p>

        <p className="text-xs text-gray-400">
          Scroll horizontally untuk melihat seluruh kolom
        </p>
      </div>
    </div>
  );
}