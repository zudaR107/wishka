import Link from "next/link";

type LinkCardProps = {
  href: string;
  label: string;
};

export function LinkCard({ href, label }: LinkCardProps) {
  return (
    <Link href={href} className="ui-link-card">
      {label}
    </Link>
  );
}
