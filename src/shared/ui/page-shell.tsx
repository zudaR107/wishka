import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  maxWidth?: string;
  centered?: boolean;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  maxWidth,
  centered,
}: PageShellProps) {
  const containerClass = [
    "mx-auto w-full px-4 sm:px-6 py-8 sm:py-12",
    maxWidth ?? "max-w-2xl",
    centered ? "flex flex-col items-center justify-center min-h-[calc(100dvh-8rem)]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <div className="ui-surface p-6 sm:p-8 lg:p-10 w-full">
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
          className={eyebrow ? "mt-3" : ""}
          style={{
            color: "var(--color-text-strong)",
            fontSize: "var(--font-size-title)",
            lineHeight: "var(--line-height-title)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: eyebrow ? undefined : 0,
          }}
        >
          {title}
        </h1>
        {description ? (
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
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </div>
  );
}
