export default function Skeleton({
  width = "100%",
  height = 20,
  radius = 8,
}: {
  width?: string;
  height?: number;
  radius?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, var(--verde-niebla) 25%, #f0f0f0 50%, var(--verde-niebla) 75%)",
        backgroundSize: "200% 100%",
        animation: "pulse 1.5s infinite",
      }}
    >
      <style jsx>{`
        @keyframes pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
