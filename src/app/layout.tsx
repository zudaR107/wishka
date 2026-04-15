import type { Metadata } from "next";
import type { ReactNode } from "react";
import { defaultLocale, getTranslations } from "@/modules/i18n";
import { getCurrentUser } from "@/modules/auth/server/current-user";
import { Header } from "@/shared/ui/header";
import { Footer } from "@/shared/ui/footer";
import { logoutAction } from "@/app/auth-actions";
import "./globals.css";

const metadataMessages = getTranslations("metadata");

export const metadata: Metadata = {
  title: metadataMessages.title,
  description: metadataMessages.description,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang={defaultLocale}>
      <body>
        <div className="app-layout">
          <Header user={user} onLogout={logoutAction} />
          <main className="app-main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
