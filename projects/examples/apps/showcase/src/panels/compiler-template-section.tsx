import type { Dispatch, SetStateAction } from 'react';
import type { TemplateMetaResponse } from '../lib/api.js';

export interface CompilerTemplateSectionProps {
  templates: TemplateMetaResponse[] | null;
  selected: string;
  setSelected: (value: string) => void;
  tpl: TemplateMetaResponse | null;
  compiling: boolean;
  compile: () => void;
  sourceEdit: Record<string, string>;
  setSourceEdit: Dispatch<SetStateAction<Record<string, string>>>;
  sourceDirty: boolean;
  resetSource: () => void;
  argValues: Record<string, string>;
  setArgValues: Dispatch<SetStateAction<Record<string, string>>>;
}

export function CompilerTemplateSection({
  templates,
  selected,
  setSelected,
  tpl,
  compiling,
  compile,
  sourceEdit,
  setSourceEdit,
  sourceDirty,
  resetSource,
  argValues,
  setArgValues,
}: CompilerTemplateSectionProps) {
  return (
    <>
      {templates && templates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--accent)' }}>
              1. Select Template
            </h3>
            <div className="row" style={{ gap: 8 }}>
              <select
                style={{ flex: 1 }}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} (solc {template.solcVersion})
                  </option>
                ))}
              </select>
            </div>
            {tpl && (
              <p className="muted" style={{ marginTop: 8 }}>
                {tpl.description}
              </p>
            )}
          </div>

          {tpl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                borderLeft: '2px dashed var(--border)',
                paddingLeft: 16,
                marginLeft: 8,
              }}
            >
              {tpl.sources.length > 0 && (
                <SourceEditor
                  tpl={tpl}
                  sourceEdit={sourceEdit}
                  setSourceEdit={setSourceEdit}
                  sourceDirty={sourceDirty}
                  resetSource={resetSource}
                />
              )}

              {tpl.constructorArgs.length > 0 && (
                <ConstructorArgs tpl={tpl} argValues={argValues} setArgValues={setArgValues} />
              )}

              <div className="card" style={{ margin: 0, background: 'var(--panel-2)' }}>
                <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--accent)' }}>2. Compile</h3>
                <p className="muted small" style={{ marginBottom: 12 }}>
                  Compile your edited source and constructor arguments to generate deployment
                  bytecode.
                </p>
                <button
                  type="button"
                  className="primary"
                  style={{ width: '100%', padding: '10px 0', fontWeight: 'bold' }}
                  onClick={compile}
                  disabled={compiling || !selected}
                >
                  {compiling ? 'Compiling…' : 'Compile Code'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SourceEditor({
  tpl,
  sourceEdit,
  setSourceEdit,
  sourceDirty,
  resetSource,
}: {
  tpl: TemplateMetaResponse;
  sourceEdit: Record<string, string>;
  setSourceEdit: Dispatch<SetStateAction<Record<string, string>>>;
  sourceDirty: boolean;
  resetSource: () => void;
}) {
  return (
    <div className="card" style={{ margin: 0 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>
          Source <span className="muted">({tpl.sources[0]?.path})</span>
        </h3>
        <div className="row" style={{ gap: 6 }}>
          {sourceDirty && (
            <span className="space-badge" title="edited" style={{ background: 'var(--err)' }}>
              edited
            </span>
          )}
          <button
            type="button"
            className="small secondary"
            onClick={resetSource}
            disabled={!sourceDirty}
            title="Restore the template's pristine source"
          >
            Reset
          </button>
        </div>
      </div>
      <p className="muted small" style={{ marginTop: 4 }}>
        Edit and click Compile to recompile via <code className="mono">/compile/sources</code>.
        Otherwise the cached template bytecode from <code className="mono">/compile</code> is used.
      </p>
      {tpl.sources.map((source) => {
        const content = sourceEdit[source.path] ?? source.content;
        return (
          <textarea
            key={source.path}
            value={content}
            onChange={(e) =>
              setSourceEdit((previous) => ({ ...previous, [source.path]: e.target.value }))
            }
            spellCheck={false}
            rows={Math.min(28, Math.max(10, content.split('\n').length))}
            style={{
              width: '100%',
              fontFamily: 'var(--mono, monospace)',
              fontSize: 12,
              marginTop: 6,
            }}
          />
        );
      })}
    </div>
  );
}

function ConstructorArgs({
  tpl,
  argValues,
  setArgValues,
}: {
  tpl: TemplateMetaResponse;
  argValues: Record<string, string>;
  setArgValues: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="card" style={{ margin: 0 }}>
      <h3 style={{ marginTop: 0 }}>Constructor args</h3>
      {tpl.constructorArgs.map((arg) => (
        <label key={arg.name} style={{ display: 'block', marginBottom: 8 }}>
          <span>
            {arg.name} <span className="muted">({arg.type})</span>
          </span>
          <input
            type="text"
            value={argValues[arg.name] ?? ''}
            onChange={(e) =>
              setArgValues((previous) => ({ ...previous, [arg.name]: e.target.value }))
            }
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
      ))}
    </div>
  );
}
