import { Button } from "@/components/ui/button";
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionItem,
  SectionItemControl,
  SectionItemLabel,
  SectionTitle,
} from "@/components/ui/section";
import { useHomebrewHealth } from "@/hooks/use-homebrew-health";
import { useState } from "react";

export function HomebrewHealth() {
  const {
    doctorWarnings,
    isDoctorRunning,
    outdatedPackages,
    isOutdatedLoading,
    reclaimableSize,
    isCleanupRunning,
    runDoctor,
    checkOutdated,
    runCleanup,
    upgradeAll,
    upgradeSingle,
    error,
  } = useHomebrewHealth();

  const [expanded, setExpanded] = useState(false);
  const [upgradingPkg, setUpgradingPkg] = useState<string | null>(null);

  const handleUpgradeSingle = async (name: string) => {
    setUpgradingPkg(name);
    await upgradeSingle(name);
    setUpgradingPkg(null);
  };

  const outdatedCount = outdatedPackages.length;
  const hasWarnings = doctorWarnings.length > 0;

  return (
    <Section>
      <SectionHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SectionTitle>Homebrew Health</SectionTitle>
            {outdatedCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                {outdatedCount} outdated
              </span>
            )}
            {reclaimableSize && (
              <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                {reclaimableSize} reclaimable
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
        <SectionDescription>
          Check Homebrew status, outdated packages, and cleanup caches
        </SectionDescription>
      </SectionHeader>

      {expanded && (
        <>
          {error && (
            <p className="text-sm text-destructive px-1">{error}</p>
          )}

          {/* Doctor Section */}
          <SectionContent>
            <SectionItem>
              <SectionItemLabel
                title="Brew Doctor"
                description={
                  isDoctorRunning
                    ? "Running diagnostics..."
                    : hasWarnings
                      ? `${doctorWarnings.length} warning(s) found`
                      : "No issues detected"
                }
              />
              <SectionItemControl>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runDoctor}
                  disabled={isDoctorRunning}
                >
                  {isDoctorRunning ? "Running..." : "Run Doctor"}
                </Button>
              </SectionItemControl>
            </SectionItem>

            {/* Doctor warnings list */}
            {hasWarnings &&
              doctorWarnings.map((warning, i) => (
                <SectionItem key={i}>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 shrink-0 mt-0.5">!</span>
                    <span className="text-muted-foreground whitespace-pre-wrap break-words text-xs">
                      {warning}
                    </span>
                  </div>
                </SectionItem>
              ))}
          </SectionContent>

          {/* Outdated Packages */}
          <SectionContent>
            <SectionItem>
              <SectionItemLabel
                title="Outdated Packages"
                description={
                  isOutdatedLoading
                    ? "Checking..."
                    : `${outdatedCount} package(s) can be updated`
                }
              />
              <SectionItemControl>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkOutdated}
                    disabled={isOutdatedLoading}
                  >
                    Refresh
                  </Button>
                  {outdatedCount > 0 && (
                    <Button size="sm" variant="outline" onClick={upgradeAll}>
                      Upgrade All
                    </Button>
                  )}
                </div>
              </SectionItemControl>
            </SectionItem>

            {outdatedPackages.map((pkg) => (
              <SectionItem key={pkg.name}>
                <SectionItemLabel>
                  <span className="text-sm font-medium inline-flex items-center gap-2">
                    {pkg.name}
                    <span className="font-mono text-xs text-muted-foreground">
                      {pkg.currentVersion} → {pkg.latestVersion}
                    </span>
                    {pkg.pinned && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        pinned
                      </span>
                    )}
                  </span>
                </SectionItemLabel>
                <SectionItemControl>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpgradeSingle(pkg.name)}
                    disabled={upgradingPkg === pkg.name || pkg.pinned}
                  >
                    {upgradingPkg === pkg.name ? "Upgrading..." : "Upgrade"}
                  </Button>
                </SectionItemControl>
              </SectionItem>
            ))}
          </SectionContent>

          {/* Cleanup */}
          <SectionContent>
            <SectionItem>
              <SectionItemLabel
                title="Disk Cleanup"
                description={
                  reclaimableSize
                    ? `${reclaimableSize} of cached downloads can be removed`
                    : "No reclaimable space found"
                }
              />
              <SectionItemControl>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runCleanup}
                  disabled={isCleanupRunning || !reclaimableSize}
                >
                  {isCleanupRunning ? "Cleaning..." : "Cleanup"}
                </Button>
              </SectionItemControl>
            </SectionItem>
          </SectionContent>
        </>
      )}
    </Section>
  );
}
