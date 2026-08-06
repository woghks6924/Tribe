export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-line-strong px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
      <span className="h-1 w-1 rounded-full bg-accent" />
      {children}
    </span>
  );
}
