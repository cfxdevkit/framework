declare module '*?raw' {
  const content: string;
  // biome-ignore lint/style/noDefaultExport: Vite raw imports expose content through a default export.
  export default content;
}
