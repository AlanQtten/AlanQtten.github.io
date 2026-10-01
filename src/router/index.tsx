import { createRootRoute, createRouter } from "@tanstack/react-router";
import App from "../App";

const rootRoute = createRootRoute({
  component: App,
});

const routeTree = rootRoute.addChildren([]);

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default router;
