import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "../hooks/use-onboarding";
import { STARTER_PACKS } from "../utils/starter-packs";

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i + 1 === current
              ? "w-6 bg-primary"
              : i + 1 < current
                ? "w-3 bg-primary/40"
                : "w-3 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function OnboardingWizard() {
  const {
    currentStep,
    totalSteps,
    scanResults,
    isScanning,
    selectedToolIds,
    isInstalling,
    installProgress,
    next,
    prev,
    skip,
    complete,
    scanTools,
    toggleTool,
    selectPack,
    installSelected,
  } = useOnboarding();

  // Auto-scan on step 2
  useEffect(() => {
    if (currentStep === 2) {
      scanTools();
    }
  }, [currentStep, scanTools]);

  // Auto-install on step 5
  useEffect(() => {
    if (currentStep === 5 && selectedToolIds.length > 0 && !isInstalling) {
      installSelected();
    }
  }, [currentStep, selectedToolIds, isInstalling, installSelected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 max-w-lg w-full px-6">
        <StepIndicator current={currentStep} total={totalSteps} />

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to oskit</h1>
            <p className="text-muted-foreground">
              Your macOS developer toolkit. Let's scan your system and get
              everything set up.
            </p>
            <Button size="lg" onClick={next}>
              Get Started
            </Button>
          </div>
        )}

        {/* Step 2: System Scan */}
        {currentStep === 2 && (
          <div className="flex flex-col items-center gap-4 text-center w-full">
            <h2 className="text-2xl font-bold tracking-tight">Scanning Your System</h2>
            {isScanning ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-1 w-48 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Checking installed tools...
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Found {scanResults.filter((r) => r.installed).length} of{" "}
                  {scanResults.length} tools installed
                </p>
                <Button onClick={next}>View Results</Button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold tracking-tight text-center">
              Scan Results
            </h2>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border divide-y">
              {scanResults.map((r) => (
                <div
                  key={r.tool.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm">
                    {r.tool.icon} {r.tool.name}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.installed
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.installed ? "Installed" : "Not installed"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>Back</Button>
              <Button onClick={next}>Choose Tools</Button>
            </div>
          </div>
        )}

        {/* Step 4: Starter Packs */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold tracking-tight text-center">
              Starter Packs
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              Select a bundle or pick individual tools
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STARTER_PACKS.map((pack) => {
                const isSelected = pack.toolIds.every((id) =>
                  selectedToolIds.includes(id),
                );
                return (
                  <button
                    key={pack.id}
                    onClick={() => selectPack(pack.toolIds)}
                    className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{pack.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {pack.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Individual tool list */}
            <div className="max-h-[200px] overflow-y-auto rounded-lg border divide-y">
              {scanResults
                .filter((r) => !r.installed)
                .map((r) => (
                  <label
                    key={r.tool.id}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedToolIds.includes(r.tool.id)}
                      onChange={() => toggleTool(r.tool.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm">
                      {r.tool.icon} {r.tool.name}
                    </span>
                  </label>
                ))}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={prev}>Back</Button>
              <Button
                onClick={next}
                disabled={selectedToolIds.length === 0}
              >
                Install {selectedToolIds.length} tool(s)
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Installing */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold tracking-tight text-center">
              {isInstalling ? "Installing..." : "Installation Complete"}
            </h2>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border divide-y">
              {selectedToolIds.map((id) => {
                const tool = scanResults.find((r) => r.tool.id === id)?.tool;
                const status = installProgress[id] || "pending";
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-sm">
                      {tool?.icon} {tool?.name || id}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        status === "done"
                          ? "bg-green-500/15 text-green-600"
                          : status === "installing"
                            ? "bg-blue-500/15 text-blue-600"
                            : status === "failed"
                              ? "bg-red-500/15 text-red-600"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {status === "done"
                        ? "Done"
                        : status === "installing"
                          ? "Installing..."
                          : status === "failed"
                            ? "Failed"
                            : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
            {!isInstalling && (
              <Button className="self-center" onClick={next}>
                Continue
              </Button>
            )}
          </div>
        )}

        {/* Step 6: Complete */}
        {currentStep === 6 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">All Set!</h2>
            <p className="text-muted-foreground">
              Your development environment is ready. Explore oskit to manage
              your tools, configs, and more.
            </p>
            <Button size="lg" onClick={complete}>
              Go to App
            </Button>
          </div>
        )}

        {/* Skip button (always visible except on step 6) */}
        {currentStep < 6 && (
          <Button variant="link" className="text-muted-foreground" onClick={skip}>
            Skip setup
          </Button>
        )}
      </div>
    </div>
  );
}
