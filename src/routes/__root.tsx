import { Scaffold } from "@/components/scaffold";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <Scaffold>
        <Outlet />
      </Scaffold>
    </>
  ),
});
