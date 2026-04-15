import Link from "next/link";
import { getTranslations } from "@/modules/i18n";

const messages = getTranslations("app");

export default function NotFound() {
  const { code, title, description, backLabel } = messages.notFound;

  return (
    <div className="not-found-page">
      <p className="not-found-code" aria-hidden="true">{code}</p>
      <h1 className="not-found-title">{title}</h1>
      <p className="not-found-description">{description}</p>
      <Link href="/" className="ui-button ui-button-secondary">
        {backLabel}
      </Link>
    </div>
  );
}
