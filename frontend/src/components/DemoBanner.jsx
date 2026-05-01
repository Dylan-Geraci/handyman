export default function DemoBanner() {
  if (import.meta.env.VITE_DEMO_MODE !== "true") return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#8f3737] via-[#7b2e2f] to-[#2b8f8a] py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
      ✦ Demo Mode ✦ Showcase build with seeded data
    </div>
  );
}
