"use client";

import { useEffect } from "react";
import FormularioVotacion from "@/lib/FormularioVotacion";

export default function VotarPage({ params }: { params: { token: string } }) {
  useEffect(() => {
    // Guardamos el token en localStorage para que la app recuerde quién es
    localStorage.setItem("futbol-token", params.token);
  }, [params.token]);

  return <FormularioVotacion token={params.token} />;
}
