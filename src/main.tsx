import { createRouter, RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import React from "react";
import ReactDOM from "react-dom/client";
import { TooltipProvider } from "./components/ui/tooltip";
import "./globals.css";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
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
  </React.StrictMode>,
);
