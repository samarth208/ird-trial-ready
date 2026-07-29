import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IRD Trial Ready — Understand what a retinal trial requires",
  description:
    "A free, educational tool for people with inherited retinal disease. Understand what a clinical trial requires and what to confirm with your care team. Not a diagnosis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 font-bold text-slate-900">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  ◎
                </span>
                <span>
                  IRD <span className="text-brand-600">Trial Ready</span>
                </span>
              </a>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Educational · not a diagnosis
              </span>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-3xl px-5 py-4 text-xs text-slate-500">
              IRD Trial Ready is an educational tool. It does not diagnose, interpret genetic
              results, or determine eligibility. Always confirm with your care team and the
              official trial site.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
