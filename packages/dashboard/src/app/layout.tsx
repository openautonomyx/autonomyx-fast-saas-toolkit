import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomyx Dashboard",
  description: "Command center for the Fast SaaS Toolkit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=DM+Sans:wght@400;500;700&family=IBM+Plex+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <nav className="border-b border-[--color-border] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Autonomyx
            </span>
            <span className="text-sm text-[--color-text-dim]">Fast SaaS Toolkit</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[--color-text-dim]">
            <a href="https://github.com/openautonomyx/autonomyx-fast-saas-toolkit" target="_blank" className="hover:text-white transition">
              GitHub
            </a>
            <a href="/api/v1/plans" className="hover:text-white transition">
              API
            </a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
