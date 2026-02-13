import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <Hero />
      <Problem />
      <Features />
      <CTA />

      <footer className="py-8 text-center text-neutral-400 text-sm font-hand text-lg">
        © 2026 DOCIT. Built with paper & tape.
      </footer>
    </main>
  );
}

