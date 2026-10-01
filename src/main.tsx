import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
import { RouterProvider } from "@tanstack/react-router";
import router from "./router";

import "./bootstrap";
import "./index.css";

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
