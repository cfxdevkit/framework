// Allow importing CSS files as side-effects in components.
// The actual CSS is handled by the consuming app's bundler (Next.js, Vite, etc.)
declare module '*.css' {
  const styles: undefined;

  export { styles };
}
