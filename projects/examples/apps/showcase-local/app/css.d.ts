// Allow importing CSS files as side-effects (theme imports, etc.)
declare module '*.css' {
  const styles: undefined;

  export { styles };
}

// @cfxdevkit/theme CSS entry points
declare module '@cfxdevkit/theme/css';
declare module '@cfxdevkit/theme/dark';
