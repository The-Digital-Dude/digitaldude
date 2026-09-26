export function StatRow({ stats }: { stats: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat}
          className="rounded-xl border border-tint bg-lavender p-4 text-center sm:p-6"
        >
          <p className="text-sm font-semibold text-navy sm:text-base">{stat}</p>
        </div>
      ))}
    </div>
  );
}
