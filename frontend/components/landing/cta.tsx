import { Button } from "@/components/ui/button";

export function CTA() {
    return (
        <section className="py-32 bg-white relative overflow-hidden border-t border-dashed border-neutral-300">
            <div className="container mx-auto px-4 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to understand your documents?</h2>
                <p className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto">
                    Join the institutions using DOCIT to transform archives into intelligence.
                </p>
                <div className="flex justify-center gap-4">
                    <Button size="lg" className="h-14 px-10 text-lg">Start Free Trial</Button>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_12px)] opacity-5" />
        </section>
    )
}
