"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MenuMovil from "./MenuMovil";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <MenuMovil />
      <main className="app-contenido">{children}</main>
    </div>
  );
}
