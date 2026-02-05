import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";

import { ensureAnonymousAuth } from "./lib/firebase/authService";

async function bootstrap() {
  try {
    await ensureAnonymousAuth();
  } catch (e) {
    console.error("Anonymous auth failed:", e);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

console.log("FIREBASE_PROJECT_ID", import.meta.env.VITE_FIREBASE_PROJECT_ID);

bootstrap();
