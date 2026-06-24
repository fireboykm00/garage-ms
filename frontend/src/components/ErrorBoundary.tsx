import { Component, type ReactNode, type ErrorInfo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred while rendering this section. Please reload to continue.
              </p>
              {this.state.error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Error details</summary>
                  <pre className="mt-2 rounded-md bg-muted p-2 overflow-auto text-xs">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
              <Button onClick={this.handleReload}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reload
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
