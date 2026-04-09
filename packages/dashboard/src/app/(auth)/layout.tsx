/*
 * Auth route group layout — intentionally DOES NOT render the Shell
 * (header + side nav). The login page should feel like a standalone
 * splash, not an embedded admin view.
 *
 * This layout replaces the root layout's <Shell> for any page inside
 * the (auth) group. Fonts and globals are still inherited from the
 * root layout because Next.js merges layouts by default.
 */

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
