import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Widget Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-destructive/10 p-4 text-center text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <div className="text-sm font-medium">Widget Error</div>
          <p className="text-xs opacity-80">{this.state.error?.message || "Unknown error"}</p>
          <Button variant="outline" size="sm" onClick={this.handleRetry} className="mt-2 h-7 text-xs">
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}




