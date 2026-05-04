import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { getUserProfile, updateUserBio, updateUserPreferredCurrency } from "@/modules/auth/server/update-bio";
import { getTranslations } from "@/modules/i18n";
import { getLocale } from "@/modules/i18n/server";
import { parseCurrency } from "@/shared/lib/currency";
import { SettingsCurrencyField } from "./_currency-field";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = getTranslations("app", locale);
  return {
    title: m.settings.title,
    robots: { index: false },
  };
}

type SettingsPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function SettingsPage(props: SettingsPageProps) {
  const [user, locale] = await Promise.all([requireCurrentUser(), getLocale()]);
  const profile = await getUserProfile(user.id);
  const search = props.searchParams ? await props.searchParams : undefined;
  const status = search?.status;

  const common = getTranslations("common", locale);
  const messages = getTranslations("app", locale);

  const preferredCurrency = parseCurrency(profile?.preferredCurrency);

  return (
    <div className="content-page">
      <div className="content-page-header">
        <p className="page-brand-label">{common.brand}</p>
        <h1 className="content-page-title">{messages.settings.title}</h1>
        <p className="content-page-description">{messages.settings.description}</p>
      </div>

      {/* Account section */}
      <section className="settings-section">
        <p className="content-section-label">{messages.settings.accountSection}</p>
        <div className="settings-field-row">
          <span className="settings-field-label">{messages.settings.emailLabel}</span>
          <span className="settings-field-value">{user.email}</span>
        </div>
      </section>

      {/* Bio + currency in one form */}
      <form action={saveSettingsAction}>
        {status === "saved" ? (
          <p className="ui-message ui-message-success" data-testid="settings-bio-success">
            {messages.settings.bioSuccessMessage}
          </p>
        ) : null}
        {status === "error-too-long" ? (
          <p className="ui-message ui-message-error" data-testid="settings-bio-error">
            {messages.settings.errors.bioTooLong}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="ui-message ui-message-error" data-testid="settings-bio-error">
            {messages.settings.errors.unknown}
          </p>
        ) : null}

        {/* Bio section */}
        <section className="settings-section">
          <p className="content-section-label">{messages.settings.bioSection}</p>
          <div className="settings-bio-field">
            <textarea
              id="bio"
              name="bio"
              aria-label={messages.settings.bioLabel}
              className="settings-bio-textarea"
              maxLength={500}
              rows={4}
              defaultValue={profile?.bio ?? ""}
              placeholder={messages.settings.bioPlaceholder}
            />
            <p className="ui-note">{messages.settings.bioHint}</p>
          </div>
        </section>

        {/* Currency section */}
        <section className="settings-section" style={{ marginTop: "var(--space-6)" }}>
          <p className="content-section-label">{messages.settings.currencySection}</p>
          <div className="settings-bio-field">
            <SettingsCurrencyField
              defaultCurrency={preferredCurrency}
              label={messages.settings.currencyLabel}
            />
            <p className="ui-note">{messages.settings.currencyHint}</p>
          </div>
        </section>

        <button type="submit" className="ui-button settings-bio-submit">
          {messages.settings.bioSaveLabel}
        </button>
      </form>
    </div>
  );
}

async function saveSettingsAction(formData: FormData): Promise<never> {
  "use server";

  const user = await requireCurrentUser();

  // Update bio
  const bio = formData.get("bio");
  const bioResult = await updateUserBio(user.id, typeof bio === "string" ? bio : "");

  if (bioResult.status === "error" && bioResult.code === "too-long") {
    redirect("/settings?status=error-too-long");
  }

  // Update preferred currency (safe — always valid after parseCurrency)
  const raw = formData.get("preferredCurrency");
  const currency = parseCurrency(typeof raw === "string" ? raw : "");
  await updateUserPreferredCurrency(user.id, currency);

  if (bioResult.status === "success") {
    redirect("/settings?status=saved");
  }

  redirect("/settings?status=error");
}
