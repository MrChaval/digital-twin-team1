import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SECURE_BOT UI Preview | CyberShield",
  description: "UI-only preview of SECURE_BOT interface",
};

export default function UILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
