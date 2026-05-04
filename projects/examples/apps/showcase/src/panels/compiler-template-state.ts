import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type TemplateMetaResponse } from '../lib/api.js';

export function useCompilerTemplateState({
  selected,
  setSelected,
  argValues,
  setArgValues,
}: {
  selected: string;
  setSelected: (id: string) => void;
  argValues: Record<string, string>;
  setArgValues: (value: Record<string, string>) => void;
}) {
  const [templates, setTemplates] = useState<TemplateMetaResponse[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [sourceEdit, setSourceEdit] = useState<Record<string, string>>({});

  useEffect(() => {
    const ac = new AbortController();
    api
      .compileTemplates(ac.signal)
      .then((response) => {
        setTemplates(response.templates);
        const first = response.templates[0];
        if (first && !selected) {
          setSelected(first.id);
          if (first.id === 'basic-erc20' && Object.keys(argValues).length === 0) {
            setArgValues({
              name_: 'Showcase Token',
              symbol_: 'SHOW',
              decimals_: '18',
              initialSupply: '1000000',
            });
          }
        }
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== 'AbortError') {
          setLoadErr(error instanceof Error ? error.message : String(error));
        }
      });
    return () => ac.abort();
  }, [setSelected, setArgValues, selected, argValues]);

  const tpl = templates?.find((template) => template.id === selected) ?? null;
  useEffect(() => {
    if (!tpl) return;
    setSourceEdit((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const source of tpl.sources) {
        if (next[source.path] === undefined) {
          next[source.path] = source.content;
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [tpl]);

  const sourceDirty = useMemo(
    () =>
      tpl?.sources.some(
        (source) => (sourceEdit[source.path] ?? source.content) !== source.content,
      ) ?? false,
    [tpl, sourceEdit],
  );
  const resetSource = useCallback(() => {
    if (!tpl) return;
    setSourceEdit((previous) => ({
      ...previous,
      ...Object.fromEntries(tpl.sources.map((source) => [source.path, source.content])),
    }));
  }, [tpl]);

  return { templates, loadErr, tpl, sourceEdit, setSourceEdit, sourceDirty, resetSource };
}
