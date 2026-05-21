/**
 * Extracts public export names and their kinds from compiled `.d.ts` files.
 * Resolves one level of `export * from '...'` re-exports (depth-limited to 2).
 */
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';

export type ExportKind = 'type' | 'interface' | 'class' | 'function' | 'const' | 'enum' | 'other';

export type ExtractedExport = {
  name: string;
  kind: ExportKind;
  signature: string;
};

function nodeKind(node: ts.Node): ExportKind {
  if (ts.isTypeAliasDeclaration(node)) return 'type';
  if (ts.isInterfaceDeclaration(node)) return 'interface';
  if (ts.isClassDeclaration(node)) return 'class';
  if (ts.isFunctionDeclaration(node)) return 'function';
  if (ts.isVariableStatement(node)) return 'const';
  if (ts.isEnumDeclaration(node)) return 'enum';
  return 'other';
}

function nodeSignature(node: ts.Node, src: ts.SourceFile): string {
  const printer = ts.createPrinter({ removeComments: true });
  const full = printer.printNode(ts.EmitHint.Unspecified, node, src);
  // Trim to first line for brevity
  return full.split('\n')[0]?.trim() ?? '';
}

async function extractFromDts(filePath: string, depth = 0): Promise<ExtractedExport[]> {
  if (depth > 2) return [];
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch {
    return [];
  }
  const src = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  const results: ExtractedExport[] = [];

  for (const node of src.statements) {
    // Handle `export * from '...'`
    if (ts.isExportDeclaration(node) && !node.exportClause && node.moduleSpecifier) {
      const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
      if (specifier.startsWith('.')) {
        const candidates = [
          resolve(dirname(filePath), `${specifier}.d.ts`),
          resolve(dirname(filePath), specifier, 'index.d.ts'),
          resolve(dirname(filePath), `${specifier.replace(/\.js$/, '')}.d.ts`),
          resolve(dirname(filePath), specifier.replace(/\.js$/, ''), 'index.d.ts'),
        ];
        for (const candidate of candidates) {
          try {
            await stat(candidate);
            results.push(...(await extractFromDts(candidate, depth + 1)));
            break;
          } catch {
            // try next
          }
        }
      }
      continue;
    }
    // Named export declarations
    if (ts.isExportDeclaration(node) && node.exportClause) {
      if (ts.isNamedExports(node.exportClause)) {
        for (const specifier of node.exportClause.elements) {
          results.push({ name: specifier.name.text, kind: 'other', signature: '' });
        }
      }
      continue;
    }
    // Direct declaration with export modifier
    const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const isExported = mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    const kind = nodeKind(node);
    let name = '';
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node)
    ) {
      name = node.name?.text ?? '';
    } else if (ts.isVariableStatement(node)) {
      name = node.declarationList.declarations[0]?.name?.getText(src) ?? '';
    }
    if (!name) continue;
    results.push({ name, kind, signature: nodeSignature(node, src) });
  }
  return results;
}

export async function extractSubpathExports(
  distDir: string,
  subpathDtsPath: string,
): Promise<ExtractedExport[]> {
  const absolute = join(distDir, subpathDtsPath);
  const seen = new Set<string>();
  const all = await extractFromDts(absolute);
  return all.filter((e) => {
    if (!e.name || seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}
