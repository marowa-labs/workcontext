export namespace Route {
  export interface ErrorBoundaryProps {
    error: unknown;
    params: Record<string, string>;
  }
}