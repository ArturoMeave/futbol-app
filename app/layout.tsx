import "./global.css";
import { ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";
import PageTransition from "./PageTransition";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata = {
  title: "Fútbol Viernes — Equipos equilibrados",
  description:
    "Reparto semanal de equipos equilibrados por puntuación cruzada entre jugadores. Sin favoritismos, sin equipos cojos: solo datos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <div className="fondo-manchas" aria-hidden="true">
          <span className="mancha mancha-1" />
          <span className="mancha mancha-2" />
          <span className="mancha mancha-3" />
        </div>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
