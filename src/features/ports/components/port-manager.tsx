import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortScanner } from "../hooks/use-port-scanner";

export function PortManager() {
  const {
    ports, isLoading, error,
    scan, killProcess,
    autoRefresh, setAutoRefresh,
    refreshInterval, setRefreshInterval,
  } = usePortScanner();

  const [filter, setFilter] = useState("");
  const [confirmKill, setConfirmKill] = useState<number | null>(null);

  const filtered = filter.trim()
    ? ports.filter(
        (p) =>
          p.port.toString().includes(filter) ||
          p.process.toLowerCase().includes(filter.toLowerCase()),
      )
    : ports;

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by port or process..."
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Auto</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          {autoRefresh && (
            <Select
              value={String(refreshInterval)}
              onValueChange={(v) => v && setRefreshInterval(Number(v))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5000">5s</SelectItem>
                <SelectItem value="10000">10s</SelectItem>
                <SelectItem value="30000">30s</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="outline" onClick={scan} disabled={isLoading}>
            {isLoading ? "Scanning..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Port list */}
      <Section>
        <SectionHeader>
          <SectionTitle>Listening Ports</SectionTitle>
          <SectionDescription>{filtered.length} port(s) found</SectionDescription>
        </SectionHeader>
        <SectionContent>
          {filtered.length === 0 ? (
            <SectionItem>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Scanning..." : "No listening ports found"}
              </p>
            </SectionItem>
          ) : (
            filtered.map((entry) => (
              <SectionItem key={`${entry.pid}:${entry.port}`}>
                <SectionItemLabel>
                  <span className="text-sm font-medium inline-flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      :{entry.port}
                    </span>
                    {entry.process}
                    <span className="text-xs text-muted-foreground">
                      PID {entry.pid} · {entry.user}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {entry.address}:{entry.port}
                  </span>
                </SectionItemLabel>
                <SectionItemControl>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(String(entry.port))}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`http://localhost:${entry.port}`, "_blank")}
                  >
                    Open
                  </Button>
                  {confirmKill === entry.pid ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { killProcess(entry.pid); setConfirmKill(null); }}
                      >
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmKill(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setConfirmKill(entry.pid)}
                    >
                      Kill
                    </Button>
                  )}
                </SectionItemControl>
              </SectionItem>
            ))
          )}
        </SectionContent>
      </Section>
    </div>
  );
}
