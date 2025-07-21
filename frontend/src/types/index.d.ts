// Global type declarations

declare module '*.glb' {
  const content: string
  export default content
}

declare module '*.glsl' {
  const content: string
  export default content
}

// Extend Window interface if needed
declare global {
  interface Window {
    fs?: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<any>
    }
  }
}

export {}