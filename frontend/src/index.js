import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { installLatinDigitsPolicy } from "@/lib/latinDigits";

installLatinDigitsPolicy();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__harajPwaInstallPrompt = event;
    window.dispatchEvent(new Event("harajpwa:installable"));
  });
  window.addEventListener("appinstalled", () => {
    window.__harajPwaInstallPrompt = null;
    window.dispatchEvent(new Event("harajpwa:installed"));
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}), { once: true });
  }
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep the production page usable even when a lazy chunk or provider fails.
    // eslint-disable-next-line no-console
    console.error("[AppErrorBoundary] render failed", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const message = this.state.error?.message || "Unknown runtime error";
    return (
      <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f1f6fa", color: "#0f172a", fontFamily: "system-ui, sans-serif" }}>
        <section style={{ maxWidth: 520, textAlign: "center", background: "white", borderRadius: 20, padding: 28, boxShadow: "0 12px 40px rgba(15,23,42,.12)" }}>
          <h1 style={{ margin: "0 0 10px", fontSize: 22 }}>حدث خطأ غير متوقع</h1>
          <p style={{ margin: "0 0 18px", color: "#64748b", lineHeight: 1.7 }}>تعذر تحميل هذه الصفحة. حاول إعادة المحاولة، وإذا استمرت المشكلة تواصل مع الدعم.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 999, padding: "11px 22px", cursor: "pointer", background: "#4fb6e6", color: "white", fontWeight: 700 }}>إعادة المحاولة</button>
          {process.env.NODE_ENV !== "production" && <pre style={{ marginTop: 18, textAlign: "left", whiteSpace: "pre-wrap", fontSize: 11, color: "#b91c1c" }}>{message}</pre>}
        </section>
      </main>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
