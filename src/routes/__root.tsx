import { Scaffold } from "@/components/scaffold";
import { SettingsProvider, useSettings } from "@/contexts/settings-context";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { createRootRoute, Outlet } from "@tanstack/react-router";

function RootContent() {
  const { settings, isLoaded } = useSettings();
  const showOnboarding =
    isLoaded && !settings.onboardingCompleted && !settings.onboardingSkipped;

  return (
    <>
      {showOnboarding && <OnboardingWizard />}
      <Scaffold>
        <Outlet />
      </Scaffold>
    </>
  );
}

export const Route = createRootRoute({
  component: () => (
    <SettingsProvider>
      <RootContent />
    </SettingsProvider>
  ),
});
