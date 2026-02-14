"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export function CTA() {
    const { isAuthenticated, loginWithGoogle, loading } = useAuth();
    return (
        <section className="py-32 bg-white relative overflow-hidden border-t border-dashed border-neutral-300">
            <div className="container mx-auto px-4 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to understand your documents?</h2>
                <p className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto">
                    Join the institutions using DOCIT to transform archives into intelligence.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {isAuthenticated ? (
                        <Link href="/dashboard">
                            <Button size="lg" className="h-14 px-10 text-lg">Go to Dashboard</Button>
                        </Link>
                    ) : (
                        <>
                            <Button size="lg" className="h-14 px-10 text-lg" onClick={loginWithGoogle} disabled={loading}>
                                Start free
                            </Button>
                            <Link href="/demo">
                                <Button variant="outline" size="lg" className="h-14 px-10 text-lg">
                                    Try the demo
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_12px)] opacity-5" />
        </section>
    )
}
