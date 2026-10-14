export default function StatCard({ title, value, description }) {
  return (
    <div className="bg-encore-surface border border-encore-border rounded-2xl p-6">
      <p className="text-sm text-encore-text-muted">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-encore-text">
        {value}
      </p>

      <p className="mt-2 text-sm text-encore-text-secondary">
        {description}
      </p>
    </div>
  );
}