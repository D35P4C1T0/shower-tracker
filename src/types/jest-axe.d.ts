declare module 'jest-axe' {
  export function axe(container: Element): Promise<{
    violations: Array<{
      id: string;
      description: string;
      nodes: any[];
    }>;
  }>;
  
  export function toHaveNoViolations(): any;
}