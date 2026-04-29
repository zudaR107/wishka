import type { Metadata } from "next";
import type { ReactNode } from "react";
import { defaultLocale, getTranslations } from "@/modules/i18n";
import { getCurrentUser } from "@/modules/auth/server/current-user";
import { Header } from "@/shared/ui/header";
import { Footer } from "@/shared/ui/footer";
import { CookieBanner } from "@/shared/ui/cookie-banner";
import { logoutAction } from "@/app/auth-actions";
import "./globals.css";

const metadataMessages = getTranslations("metadata");

export const metadata: Metadata = {
  metadataBase: new URL("https://wshka.ru"),
  title: {
    default: metadataMessages.title,
    template: "%s | WSHKA",
  },
  description: metadataMessages.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "WSHKA",
  },
  twitter: {
    card: "summary",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme'),p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((s||p)==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <div className="app-layout">
          <Header user={user} onLogout={logoutAction} />
          <main className="app-main">{children}</main>
          <Footer />
          <CookieBanner />
        </div>
      </body>
    </html>
  );
}
