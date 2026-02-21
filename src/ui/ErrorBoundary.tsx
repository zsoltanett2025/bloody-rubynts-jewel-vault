import { Component } from "react";

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-black text-white p-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-xl font-bold mb-3">App crashed</h1>
            <pre className="whitespace-pre-wrap bg-white/10 p-3 rounded">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
