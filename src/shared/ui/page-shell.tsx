import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16 sm:px-10">
      <div className="ui-surface max-w-3xl p-8 sm:p-10 lg:p-12">
        {eyebrow ? (
          <p
            className="uppercase tracking-[0.22em]"
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-label)",
              fontWeight: 600,
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="mt-3 max-w-2xl font-semibold tracking-tight"
          style={{
            color: "var(--color-text-strong)",
            fontSize: "var(--font-size-title)",
            lineHeight: "var(--line-height-title)",
          }}
        >
          {title}
        </h1>
        <p
          className="mt-4 max-w-2xl"
          style={{
            color: "var(--color-text-base)",
            fontSize: "var(--font-size-body)",
            lineHeight: "var(--line-height-body)",
          }}
        >
          {description}
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </main>
  );
}
