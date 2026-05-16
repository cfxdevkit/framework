'use client';

import { Shell, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  LOCAL_CHAPTERS,
  LOCAL_FLOW,
  LOCAL_SHOWCASE_TITLE,
  type LocalChapterStatus,
} from '../lib/showcase-guide';

const sidebarSectionTitleStyle = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-xs)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  marginBottom: 'var(--cfx-space-2)',
  textTransform: 'uppercase',
} as const;

const sidebarBlockStyle = {
  borderBottom: '1px solid var(--cfx-color-border-default)',
  display: 'grid',
  gap: 'var(--cfx-space-3)',
  padding: '0 var(--cfx-space-4) var(--cfx-space-4)',
} as const;

const sidebarListStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-2)',
  listStyle: 'none',
  margin: 0,
  padding: 0,
} as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSlug = pathname === '/' ? null : pathname.replace(/^\//, '');
  const activeChapter = LOCAL_CHAPTERS.find((chapter) => chapter.slug === activeSlug);
  const headerStatus = activeChapter?.status ?? 'guide';

  return (
    <Shell
      title={LOCAL_SHOWCASE_TITLE}
      headerRight={
        <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--cfx-space-2)' }}>
          <StatusBadge label={statusLabel(headerStatus)} status={statusTone(headerStatus)} />
          <Link
            href="/"
            style={{
              color: 'var(--cfx-color-fg-subtle)',
              fontSize: 'var(--cfx-text-sm)',
              textDecoration: 'none',
            }}
          >
            overview
          </Link>
        </div>
      }
      sidebar={
        <div style={{ display: 'grid', gap: 'var(--cfx-space-4)' }}>
          <div style={sidebarBlockStyle}>
            <div style={sidebarSectionTitleStyle}>Path</div>
            <ol
              style={{
                display: 'grid',
                gap: 'var(--cfx-space-2)',
                margin: 0,
                paddingInlineStart: 18,
              }}
            >
              {LOCAL_FLOW.map((step) => {
                const current = step.slug === activeSlug;

                return (
                  <li key={step.slug} style={{ color: 'var(--cfx-color-fg-subtle)' }}>
                    <Link
                      href={`/${step.slug}`}
                      style={{
                        color: current
                          ? 'var(--cfx-color-fg-default)'
                          : 'var(--cfx-color-fg-subtle)',
                        fontWeight: current ? 600 : 400,
                        textDecoration: 'none',
                      }}
                    >
                      {step.title}
                    </Link>
                    <div
                      style={{
                        color: 'var(--cfx-color-fg-muted)',
                        fontSize: 'var(--cfx-text-xs)',
                        lineHeight: 1.5,
                        marginTop: 'var(--cfx-space-1)',
                      }}
                    >
                      {step.detail}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div style={sidebarBlockStyle}>
            <div style={sidebarSectionTitleStyle}>Chapters</div>
            <ul style={sidebarListStyle}>
              <li>
                <Link
                  href="/"
                  style={{
                    color:
                      pathname === '/'
                        ? 'var(--cfx-color-fg-default)'
                        : 'var(--cfx-color-fg-subtle)',
                    display: 'block',
                    fontWeight: pathname === '/' ? 600 : 400,
                    textDecoration: 'none',
                  }}
                >
                  Overview
                </Link>
              </li>
              {LOCAL_CHAPTERS.map((chapter) => {
                const current = chapter.slug === activeSlug;

                return (
                  <li key={chapter.slug}>
                    <Link
                      href={`/${chapter.slug}`}
                      style={{
                        color: current
                          ? 'var(--cfx-color-fg-default)'
                          : 'var(--cfx-color-fg-subtle)',
                        display: 'grid',
                        gap: 'var(--cfx-space-1)',
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        style={{ alignItems: 'center', display: 'flex', gap: 'var(--cfx-space-2)' }}
                      >
                        <span style={{ fontWeight: current ? 600 : 400 }}>{chapter.title}</span>
                        <StatusBadge
                          label={statusLabel(chapter.status)}
                          status={statusTone(chapter.status)}
                        />
                      </span>
                      <span
                        style={{
                          color: 'var(--cfx-color-fg-muted)',
                          fontSize: 'var(--cfx-text-xs)',
                          lineHeight: 1.5,
                        }}
                      >
                        {chapter.next}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={{ padding: '0 var(--cfx-space-4)' }}>
            <div style={sidebarSectionTitleStyle}>Seed Alignment</div>
            <p
              style={{
                color: 'var(--cfx-color-fg-muted)',
                fontSize: 'var(--cfx-text-xs)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              This local showcase is meant to be followed in order: start the seeded devnode, import
              that root into the keystore, then reuse it for session keys, compile, and deployment.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </Shell>
  );
}

function statusTone(status: LocalChapterStatus) {
  return status === 'ready' ? 'ok' : 'info';
}

function statusLabel(status: LocalChapterStatus): string {
  return status === 'ready' ? 'live' : 'guide';
}
