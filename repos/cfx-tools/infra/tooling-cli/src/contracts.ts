export interface ToolingCommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly usage?: string;
}

export type ToolingRunner = (args: readonly string[]) => Promise<void>;

export interface ToolingNamespaceDefinition {
  readonly name: string;
  readonly description: string;
  readonly commands: readonly ToolingCommandDefinition[];
  readonly run: ToolingRunner;
}

export interface ToolingCatalogCommand {
  readonly name: string;
  readonly description: string;
  readonly usage?: string;
}

export interface ToolingCatalogNamespace {
  readonly name: string;
  readonly description: string;
  readonly commands: readonly ToolingCatalogCommand[];
}

export interface ToolingCatalog {
  readonly namespaces: readonly ToolingCatalogNamespace[];
}
