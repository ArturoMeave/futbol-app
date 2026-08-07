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
  // Bloquear scroll del fondo con el drawer abierto y vigilar el tamaño de pantalla
  useEffect(() => {
    // 1. Bloqueamos o desbloqueamos el scroll según si está abierto
    document.body.style.overflow = abierto ? "hidden" : "";

    // 2. Creamos la función que vigila el ancho
    const vigilarTamaño = () => {
      // Si la pantalla crece más de 900px, cerramos el menú móvil a la fuerza
      if (window.innerWidth > 900 && abierto) {
        setAbierto(false);
      }
    };

    // 3. Le decimos al navegador que ejecute esa función cada vez que se redimensione
    window.addEventListener("resize", vigilarTamaño);

    // 4. Función de limpieza: devolvemos todo a la normalidad al salir
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", vigilarTamaño);
    };
  }, [abierto]);

  const hrefVotar = "/votar";

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

      <div
        className={`drawer${abierto ? " abierto" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
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
          {SECCIONES.map((s, i) => {
            const Icono = s.icono;
            const esActiva = activa === s.id;
            return (
              <div key={s.id}>
                {(i === 0 || SECCIONES[i - 1].grupo !== s.grupo) && (
                  <div className="sidebar-grupo">{s.grupo === "juego" ? "Partido" : "Gestión"}</div>
                )}
                <Link
                  href={s.id === "votar" ? hrefVotar : s.href}
                  className={`sidebar-item${esActiva ? " activa" : ""}`}
                  aria-current={esActiva ? "page" : undefined}
                >
                  <Icono size={20} strokeWidth={esActiva ? 2.4 : 2} />
                  <span>{s.nombre}</span>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
