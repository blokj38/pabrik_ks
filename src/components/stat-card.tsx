export function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${warn ? "text-red-600" : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}
