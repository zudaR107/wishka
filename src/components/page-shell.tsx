import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16 sm:px-10">
      <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </main>
  );
}
