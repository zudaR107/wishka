import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth/server/current-user";
import { getUserProfile, updateUserBio } from "@/modules/auth/server/update-bio";
import { getTranslations } from "@/modules/i18n";

const common = getTranslations("common");
const messages = getTranslations("app");

export const metadata: Metadata = {
  title: "Настройки",
};

type SettingsPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function SettingsPage(props: SettingsPageProps) {
  const user = await requireCurrentUser();
  const profile = await getUserProfile(user.id);
  const search = props.searchParams ? await props.searchParams : undefined;
  const status = search?.status;

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

      {/* Bio section */}
      <section className="settings-section">
        <p className="content-section-label">{messages.settings.bioSection}</p>

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

        <form action={saveBioAction}>
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
          <button type="submit" className="ui-button settings-bio-submit">
            {messages.settings.bioSaveLabel}
          </button>
        </form>
      </section>
    </div>
  );
}

async function saveBioAction(formData: FormData): Promise<never> {
  "use server";

  const user = await requireCurrentUser();
  const bio = formData.get("bio");
  const result = await updateUserBio(user.id, typeof bio === "string" ? bio : "");

  if (result.status === "success") {
    redirect("/settings?status=saved");
  }

  if (result.code === "too-long") {
    redirect("/settings?status=error-too-long");
  }

  redirect("/settings?status=error");
}
