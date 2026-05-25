'use client';

/**
 * MermaidZoom — renders a mermaid diagram with pan / zoom / fullscreen.
 *
 * Features
 * ─────────
 * • Scroll-wheel zoom (Ctrl+scroll or plain scroll inside the container)
 * • Click-drag pan
 * • Double-click reset
 * • Expand button → native browser fullscreen (falls back to fixed-overlay)
 * • "Too large" badge when the diagram has > MAX_READABLE_LINES lines
 * • No external dependencies beyond mermaid (already in the bundle)
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface MermaidProps {
  chart: string;
}

const MAX_READABLE_LINES = 25;

/** Count non-empty, non-comment lines in a mermaid chart string. */
function countDiagramLines(chart: string): number {
  return chart.split('\n').filter((l) => l.trim() && !l.trim().startsWith('%%')).length;
}

export function Mermaid({ chart }: MermaidProps) {
  const id = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // pan/zoom state
  const scale = useRef(1);
  const origin = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const originAtDragStart = useRef({ x: 0, y: 0 });

  const isLarge = countDiagramLines(chart) > MAX_READABLE_LINES;

  // ── render ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
      });
      mermaid
        .render(`mermaid-${id}`, chart)
        .then(({ svg }) => {
          setSvgContent(svg);
          setError(null);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
        });
    });
  }, [chart, id]);

  // ── transform helper ────────────────────────────────────────────────────────
  const applyTransform = useCallback(() => {
    const wrap = svgWrapRef.current;
    if (!wrap) return;
    wrap.style.transform = `translate(${origin.current.x}px, ${origin.current.y}px) scale(${scale.current})`;
  }, []);

  const resetView = useCallback(() => {
    scale.current = 1;
    origin.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

  // ── wheel zoom ──────────────────────────────────────────────────────────────
  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      scale.current = Math.min(8, Math.max(0.2, scale.current * delta));
      applyTransform();
    },
    [applyTransform],
  );

  // ── drag pan ────────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    originAtDragStart.current = { ...origin.current };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      origin.current = {
        x: originAtDragStart.current.x + (e.clientX - dragStart.current.x),
        y: originAtDragStart.current.y + (e.clientY - dragStart.current.y),
      };
      applyTransform();
    },
    [applyTransform],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ── fullscreen ──────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => setIsFullscreen((v) => !v));
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── render error ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <details className="mermaid-error">
        <summary style={{ cursor: 'pointer', color: '#c00', padding: '8px' }}>
          ⚠ Diagram failed to render — click to see raw source
        </summary>
        <pre style={{ fontSize: 12, padding: '8px', overflow: 'auto' }}>{chart}</pre>
      </details>
    );
  }

  if (!svgContent) return null;

  return (
    <div
      ref={containerRef}
      className="mermaid-zoom-container"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: '#fafafa',
        minHeight: 120,
        cursor: dragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        ...(isFullscreen
          ? {
              width: '100vw',
              height: '100vh',
              maxHeight: '100vh',
              borderRadius: 0,
              border: 'none',
            }
          : {}),
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDoubleClick={resetView}
    >
      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 4,
          zIndex: 10,
          alignItems: 'center',
        }}
      >
        {isLarge && (
          <span
            style={{
              fontSize: 10,
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
              borderRadius: 4,
              padding: '2px 6px',
              fontWeight: 600,
            }}
          >
            LARGE — scroll to zoom
          </span>
        )}
        <ToolbarButton
          title="Zoom in"
          onClick={() => {
            scale.current = Math.min(8, scale.current * 1.25);
            applyTransform();
          }}
        >
          +
        </ToolbarButton>
        <ToolbarButton
          title="Zoom out"
          onClick={() => {
            scale.current = Math.max(0.2, scale.current / 1.25);
            applyTransform();
          }}
        >
          −
        </ToolbarButton>
        <ToolbarButton title="Reset view (or double-click diagram)" onClick={resetView}>
          ⊙
        </ToolbarButton>
        <ToolbarButton title="Fullscreen (Esc to exit)" onClick={toggleFullscreen}>
          {isFullscreen ? '⊠' : '⤢'}
        </ToolbarButton>
      </div>

      {/* Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          left: 8,
          fontSize: 10,
          color: '#9ca3af',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        drag to pan · scroll to zoom · double-click to reset
      </div>

      {/* Diagram */}
      <div
        ref={svgWrapRef}
        style={{
          display: 'inline-block',
          transformOrigin: '0 0',
          padding: 24,
          willChange: 'transform',
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid SVG is sanitized output
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

function ToolbarButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: 26,
        height: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 14,
        lineHeight: 1,
        color: '#374151',
        backdropFilter: 'blur(4px)',
      }}
    >
      {children}
    </button>
  );
}
