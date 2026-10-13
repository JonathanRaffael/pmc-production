type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  valueColor?: string;
};

export default function StatCard({
  title,
  value,
  description,
  valueColor = "text-gray-900",
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${valueColor}`}
      >
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}