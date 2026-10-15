import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[REBEL MART RUNTIME ERROR]", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--bg-main, #0b0f19)",
          color: "var(--text-main, #ffffff)",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center"
        }}>
          <div style={{
            maxWidth: "460px",
            background: "var(--card-bg, #151c2e)",
            border: "1px solid var(--border-color, #222f49)",
            borderRadius: "16px",
            padding: "36px 28px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(217, 119, 6, 0.15)",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto"
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 10px 0" }}>Something went wrong</h2>
            <p style={{ fontSize: "14px", color: "var(--muted, #94a3b8)", margin: "0 0 24px 0", lineHeight: 1.6 }}>
              A temporary display error occurred. Please click below to refresh the page.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#d97706",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              <RotateCcw size={16} /> Refresh Store
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
