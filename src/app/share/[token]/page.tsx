import Link from "next/link";
import { getPublicWishlistByShareToken } from "@/modules/share";
import { getTranslations } from "@/modules/i18n";
import { PageShell } from "@/shared/ui/page-shell";

const common = getTranslations("common");
const messages = getTranslations("app");

type SharePageProps = {
  params?: Promise<{
    token?: string;
  }>;
};

export default async function SharePage(props: SharePageProps) {
  const params = props?.params ? await props.params : undefined;
  const publicWishlist = await getPublicWishlistByShareToken(params?.token ?? "");

  if (!publicWishlist) {
    return (
      <PageShell
        eyebrow={common.brand}
        title={messages.share.unavailableTitle}
        description={messages.share.unavailableDescription}
      />
    );
  }

  return (
    <PageShell
      eyebrow={common.brand}
      title={messages.share.title}
      description={messages.share.description}
    >
      {publicWishlist.items.length === 0 ? (
        <section className="ui-surface p-6">
          <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
            {messages.share.emptyTitle}
          </h2>
          <p className="mt-3 text-[color:var(--color-text-base)]">
            {messages.share.emptyDescription}
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">
            {messages.share.itemsTitle}
          </h2>
          <ul className="space-y-4">
            {publicWishlist.items.map((item) => (
              <li key={item.id} className="ui-surface p-6">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-[color:var(--color-text-strong)]">
                    {item.title}
                  </h3>
                  {item.url ? (
                    <p className="text-sm text-[color:var(--color-text-base)] break-all">
                      <span className="font-medium text-[color:var(--color-text-strong)]">
                        {messages.share.itemFields.url}: 
                      </span>
                      <Link href={item.url} className="underline underline-offset-2">
                        {item.url}
                      </Link>
                    </p>
                  ) : null}
                  {item.note ? (
                    <p className="text-sm text-[color:var(--color-text-base)]">
                      <span className="font-medium text-[color:var(--color-text-strong)]">
                        {messages.share.itemFields.note}: 
                      </span>
                      {item.note}
                    </p>
                  ) : null}
                  {item.price ? (
                    <p className="text-sm text-[color:var(--color-text-base)]">
                      <span className="font-medium text-[color:var(--color-text-strong)]">
                        {messages.share.itemFields.price}: 
                      </span>
                      {item.price}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
