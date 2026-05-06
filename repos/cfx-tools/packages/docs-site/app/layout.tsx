import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s — cfxdevkit',
    default: 'cfxdevkit — Conflux Developer Monorepo',
  },
  description:
    'Production-grade TypeScript SDK, React components, and developer tooling for building on the Conflux network.',
}

const navbar = (
  <Navbar
    logo={
      <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
        cfxdevkit
      </span>
    }
    projectLink="https://github.com/cfxdevkit"
  />
)

const footer = (
  <Footer>
    <span>
      Apache 2.0 {new Date().getFullYear()} &copy;{' '}
      <a href="https://github.com/cfxdevkit" target="_blank" rel="noreferrer">
        cfxdevkit
      </a>
    </span>
  </Footer>
)

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/cfxdevkit/root/tree/main/repos/cfx-tools/packages/docs-site"
          editLink="Edit this page on GitHub"
          feedback={{ content: 'Question? Give us feedback' }}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
