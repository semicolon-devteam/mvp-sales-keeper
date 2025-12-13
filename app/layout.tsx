import type { Metadata, Viewport } from "next";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dropzone/styles.css";
import '@mantine/notifications/styles.css'; // Add Notification styles
import { Notifications } from '@mantine/notifications'; // Add Component

import { InstallPrompt } from "./_components/InstallPrompt";

export const metadata: Metadata = {
  title: "Sales Keeper - 매출 지킴이",
  description: "소상공인을 위한 간편 매출 관리 서비스",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sales Keeper",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ca678",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" zIndex={2077} />
          {children}
          <InstallPrompt />
        </MantineProvider>
      </body>
    </html>
  );
}
