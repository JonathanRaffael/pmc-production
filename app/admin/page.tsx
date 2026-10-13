import ProductionTable from "@/components/admin/ProductionTable";

export default function AdminPage() {
  return (
    <div className="min-w-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Production Monitoring
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Daily Production Monitoring System
        </p>
      </div>

      {/* Production Table */}
      <ProductionTable />
    </div>
  );
}