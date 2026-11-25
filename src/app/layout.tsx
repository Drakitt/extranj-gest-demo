import type { Metadata } from "next";
import { DemoBanner } from "@/components/demo-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Servicios Demo",
  description: "Demo local con datos ficticios para empresas de servicios. No es un producto SaaS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
