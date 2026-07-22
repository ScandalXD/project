import { Component, type ErrorInfo, type ReactNode } from "react";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route render failed", error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isOffline =
        typeof navigator !== "undefined" && navigator.onLine === false;

      return (
        <div className="page-container">
          <div className="route-error-card">
            <h1>Page unavailable</h1>
            <p>
              {isOffline
                ? "This page was not cached yet. Connect to the internet and open it once before using it offline."
                : "This page could not be loaded. Try refreshing the app."}
            </p>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={this.handleRetry}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
