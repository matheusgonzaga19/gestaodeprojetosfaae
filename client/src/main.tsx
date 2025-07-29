import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { onAuthTokenChanged } from "./lib/firebase";

onAuthTokenChanged(() => {});

createRoot(document.getElementById("root")!).render(<App />);
