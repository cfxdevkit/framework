/**
 * In-process compile cache + facade over `@cfxdevkit/compiler`.
 *
 * The showcase backend exposes the curated template registry and runs the
 * Solidity pipeline server-side (solc is heavy and Node-only). Two compile
 * modes are supported:
 *
 * 1. **Template** — pick a registered template id; sources are pulled from
 *    the in-tree registry. Cached by `templateId@solcVersion`.
 * 2. **Sources** — caller supplies arbitrary Solidity sources (used by the
 *    showcase's in-browser editor for live edit + recompile). Cached by
 *    `inputHash` (sha-256 of the normalised solc standard-json input).
 *
 * The **catalog** endpoint pre-compiles every registered template and
 * returns the bundle as ready-to-deploy `bytecode + abi` records, so SDK
 * consumers (including the showcase's "Prepackaged contracts" view) can
 * deploy without a round-trip through solc.
 */
import type { Artifact, CompileDiagnostic, Source, TemplateMeta } from '@cfxdevkit/compiler';
import { compile, getTemplate, listTemplates } from '@cfxdevkit/compiler';

export interface CompileTemplateRequest {
  templateId: string;
}

/** Compile arbitrary Solidity sources (live-edit mode in the showcase). */
export interface CompileSourcesRequest {
  sources: { path: string; content: string }[];
  contractName: string;
  solcVersion: string;
  /** Defaults to `'paris'` to stay portable across Conflux Core/eSpace. */
  evmVersion?: string | undefined;
}

export interface CompileTemplateResponse {
  templateId: string;
  contractName: string;
  abi: Artifact['abi'];
  bytecode: string;
  deployedBytecode: string;
  inputHash: string;
  warnings: readonly CompileDiagnostic[];
  cached: boolean;
}

/** A precompiled template, ready to deploy without re-running solc. */
export interface CatalogEntry {
  templateId: string;
  name: string;
  description: string;
  contractName: string;
  solcVersion: string;
  constructorArgs: readonly { name: string; type: string }[];
  sources: readonly Source[];
  abi: Artifact['abi'];
  bytecode: string;
  deployedBytecode: string;
  inputHash: string;
}

export class CompileError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'CompileError';
    this.status = status;
  }
}

export class CompileManager {
  private cache = new Map<string, CompileTemplateResponse>();
  private catalogCache: CatalogEntry[] | null = null;

  templates(): readonly TemplateMeta[] {
    return listTemplates();
  }

  template(id: string): TemplateMeta {
    try {
      return getTemplate(id);
    } catch (e) {
      throw new CompileError(e instanceof Error ? e.message : String(e), 404);
    }
  }

  async compileTemplate(req: CompileTemplateRequest): Promise<CompileTemplateResponse> {
    const tpl = this.template(req.templateId);
    const cacheKey = `tpl:${tpl.id}@${tpl.solcVersion}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return { ...hit, cached: true };

    const out = await compile({
      sources: tpl.sources,
      solcVersion: tpl.solcVersion,
      // Conflux eSpace runs an EVM that pre-dates Shanghai (no PUSH0 / 0x5f).
      // Targeting `paris` keeps the bytecode portable to both Core and eSpace.
      evmVersion: 'paris',
    });
    const artifact = out.artifacts.find((a) => a.contractName === tpl.contractName);
    if (!artifact) {
      throw new CompileError(
        `compiled output did not contain expected contract "${tpl.contractName}"`,
        500,
      );
    }
    const response: CompileTemplateResponse = {
      templateId: tpl.id,
      contractName: artifact.contractName,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      deployedBytecode: artifact.deployedBytecode,
      inputHash: out.inputHash,
      warnings: out.warnings,
      cached: false,
    };
    this.cache.set(cacheKey, { ...response, cached: true });
    return response;
  }

  /**
   * Compile arbitrary user-supplied sources. Used by the showcase's live
   * editor: the user opens a template, edits the Solidity, and recompiles
   * — the result is cached by `inputHash` so identical edits are free.
   */
  async compileSources(req: CompileSourcesRequest): Promise<CompileTemplateResponse> {
    if (!Array.isArray(req.sources) || req.sources.length === 0) {
      throw new CompileError('sources must be a non-empty array');
    }
    if (!req.contractName) throw new CompileError('contractName is required');
    if (!req.solcVersion) throw new CompileError('solcVersion is required');
    let out: Awaited<ReturnType<typeof compile>>;
    try {
      out = await compile({
        sources: req.sources,
        solcVersion: req.solcVersion,
        evmVersion: req.evmVersion ?? 'paris',
      });
    } catch (e) {
      throw new CompileError(e instanceof Error ? e.message : String(e), 400);
    }
    const cacheKey = `src:${out.inputHash}:${req.contractName}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return { ...hit, cached: true };

    const artifact = out.artifacts.find((a) => a.contractName === req.contractName);
    if (!artifact) {
      const found = out.artifacts.map((a) => a.contractName).join(', ') || '(none)';
      throw new CompileError(
        `compiled output did not contain expected contract "${req.contractName}" (found: ${found})`,
        400,
      );
    }
    const response: CompileTemplateResponse = {
      templateId: `custom:${req.contractName}`,
      contractName: artifact.contractName,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      deployedBytecode: artifact.deployedBytecode,
      inputHash: out.inputHash,
      warnings: out.warnings,
      cached: false,
    };
    this.cache.set(cacheKey, { ...response, cached: true });
    return response;
  }

  /**
   * Pre-compile every registered template into ready-to-deploy artifacts.
   * Result is memoised across the process lifetime; templates are static.
   */
  async catalog(): Promise<CatalogEntry[]> {
    if (this.catalogCache) return this.catalogCache;
    const all = listTemplates();
    const entries: CatalogEntry[] = [];
    for (const tpl of all) {
      const compiled = await this.compileTemplate({ templateId: tpl.id });
      entries.push({
        templateId: tpl.id,
        name: tpl.name,
        description: tpl.description,
        contractName: tpl.contractName,
        solcVersion: tpl.solcVersion,
        constructorArgs: tpl.constructorArgs,
        sources: tpl.sources,
        abi: compiled.abi,
        bytecode: compiled.bytecode,
        deployedBytecode: compiled.deployedBytecode,
        inputHash: compiled.inputHash,
      });
    }
    this.catalogCache = entries;
    return entries;
  }
}

export const compileManager = new CompileManager();
