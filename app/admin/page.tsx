import ProductionTable from "@/components/admin/ProductionTable";

export default function AdminPage() {
  return (
    <div className="min-w-0">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Production System
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Production Monitoring
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Daily production monitoring and performance overview
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" />

            <span className="text-xs font-medium text-gray-600">
              System Online
            </span>
          </div>
        </div>
      </div>

      {/* Production Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Production Data
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor daily production output and quality
          </p>
        </div>

        <div className="min-w-0 p-4">
          <ProductionTable />
        </div>
      </div>
    </div>
  );
}