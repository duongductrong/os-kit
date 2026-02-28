import { createRouter, RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./components/ui/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import "./globals.css";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        {/* {import.meta.env.MODE !== "production" ? (
        <TanStackRouterDevtools
          router={router}
          panelProps={{
            className: "hidden",
          }}
        />
      ) : null} */}
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
