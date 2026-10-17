import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FAF7F2",
            padding: "24px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#2C1810"
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "32px 24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid #F0E8DD",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#FEF2F2",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC2626",
                marginBottom: "16px"
              }}
            >
              <AlertCircle size={28} />
            </div>

            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#1F2937",
                marginBottom: "8px"
              }}
            >
              Something went wrong
            </h2>

            <p
              style={{
                fontSize: "0.9rem",
                color: "#6B7280",
                lineHeight: 1.5,
                marginBottom: "20px"
              }}
            >
              We encountered an unexpected display issue. Please try refreshing the page or returning to the home screen.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "0.75rem",
                  color: "#991B1B",
                  fontFamily: "monospace",
                  textAlign: "left",
                  marginBottom: "20px",
                  wordBreak: "break-all",
                  maxHeight: "100px",
                  overflowY: "auto"
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  backgroundColor: "#502419",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer"
                }}
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  backgroundColor: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer"
                }}
              >
                <Home size={16} />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
