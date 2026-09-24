export function ViewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70" />
          <div className="h-4 w-72 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50" />
        </div>
        <div className="h-9.5 w-40 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
      </div>
      <div className="h-13 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/40" />
      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-80 w-[325px] shrink-0 rounded-2xl bg-zinc-200/40 dark:bg-zinc-800/30" />
        ))}
      </div>
    </div>
  );
}
