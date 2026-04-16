export default function GlobalLoading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1">
      <div
        className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 rounded-r-full animate-progress"
        style={{
          animation: "progress 1.5s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes progress {
          0% { width: 0%; opacity: 1; }
          50% { width: 70%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
