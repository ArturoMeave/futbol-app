"use client";
import { ReactNode } from "react";

export default function AnimacionEntrada({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <div
      style={{
        animation: `entrar 0.5s ease-out ${delay}s both`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes entrar {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
