// Global ambient definitions for local IDE type checking when node_modules is containerized
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
