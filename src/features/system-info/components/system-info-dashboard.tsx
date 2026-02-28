import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSystemInfo } from "../hooks/use-system-info";

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono">{value ?? "N/A"}</span>
    </div>
  );
}

export function SystemInfoDashboard() {
  const { info, isLoading, error, refresh, installXcodeCli } = useSystemInfo();

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={refresh} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {isLoading && !info ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} size="sm">
              <CardHeader>
                <CardTitle className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : info ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* macOS */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>macOS</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Version" value={info.osVersion} />
              <InfoItem label="Build" value={info.osBuild} />
              <InfoItem label="Architecture" value={info.arch} />
            </CardContent>
          </Card>

          {/* CPU */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>CPU</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Processor" value={info.cpuName} />
              <InfoItem label="Cores" value={info.cpuCores} />
            </CardContent>
          </Card>

          {/* Memory */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Memory</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Total" value={info.memoryTotal} />
            </CardContent>
          </Card>

          {/* Disk */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Disk</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Total" value={info.diskTotal} />
              <InfoItem label="Used" value={info.diskUsed} />
              <InfoItem label="Available" value={info.diskAvailable} />
            </CardContent>
          </Card>

          {/* Dev Tools */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Xcode CLI</CardTitle>
            </CardHeader>
            <CardContent>
              {info.xcodeCliInstalled ? (
                <InfoItem label="Path" value={info.xcodeCliPath} />
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">Not installed</span>
                  <Button size="sm" variant="outline" onClick={installXcodeCli}>
                    Install Xcode CLI
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shell */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Shell</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Shell" value={info.shellName} />
              <InfoItem label="Version" value={info.shellVersion} />
            </CardContent>
          </Card>

          {/* Homebrew */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Homebrew</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Version" value={info.brewVersion} />
              <InfoItem label="Packages" value={info.brewPackageCount} />
            </CardContent>
          </Card>

          {/* Node & Git */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Dev Runtimes</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Node.js" value={info.nodeVersion} />
              <InfoItem label="Git" value={info.gitVersion} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
