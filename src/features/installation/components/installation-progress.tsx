interface InstallationProgressProps {
  installedCount: number;
  totalCount: number;
  progressPercent: number;
}

export function InstallationProgress({
  installedCount,
  totalCount,
  progressPercent,
}: InstallationProgressProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {installedCount} of {totalCount} tools installed
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(progressPercent)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
