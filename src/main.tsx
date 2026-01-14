import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ActiveCheckoutProvider } from "@/contexts/ActiveCheckoutContext";

createRoot(document.getElementById("root")!).render(
  <ActiveCheckoutProvider>
    <App />
  </ActiveCheckoutProvider>
);
