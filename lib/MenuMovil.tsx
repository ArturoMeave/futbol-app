"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SECCIONES, seccionActiva } from "./secciones";

export default function MenuMovil() {
  const [abierto, setAbierto] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();
  const activa = seccionActiva(pathname);

  // Cerrar al navegar
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    setToken(localStorage.getItem("futbol-token"));
  }, [pathname]);

  // Bloquear scroll del fondo con el drawer abierto
  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  const hrefVotar = token ? `/votar/${token}` : "/unirse";

  return (
    <>
      <header className="barra-movil">
        <div className="sidebar-marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <button
          className="burger"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
        >
          <Menu size={22} strokeWidth={2} />
        </button>
      </header>

      {abierto && (
        <div
          className="drawer-fondo"
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />
      )}

      <div className={`drawer${abierto ? " abierto" : ""}`} role="dialog" aria-modal="true" aria-label="Menú">
        <div className="drawer-cabecera">
          <div className="sidebar-marca">
            <span className="punto" />
            Fútbol Viernes
          </div>
          <button
            className="burger"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {SECCIONES.map((s) => {
            const Icono = s.icono;
            const esActiva = activa === s.id;
            return (
              <Link
                key={s.id}
                href={s.id === "votar" ? hrefVotar : s.href}
                className={`sidebar-item${esActiva ? " activa" : ""}`}
                aria-current={esActiva ? "page" : undefined}
              >
                <Icono size={20} strokeWidth={esActiva ? 2.4 : 2} />
                <span>{s.nombre}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
