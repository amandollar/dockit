"use client";

import { Sticker } from "@/components/ui/sticker";
import { Brain, FileDigit, ScanSearch, ShieldCheck, Zap } from "lucide-react";

export function Features() {

    const features = [
        {
            title: "Automated Management",
            desc: "Secure upload, auto-tagging, and categorization.",
            icon: FileDigit,
            color: "blue" as const,
            rotation: -1
        },
        {
            title: "AI Summaries",
            desc: "Get bullet points derived from complex PDFs instantly.",
            icon: Brain,
            color: "yellow" as const,
            rotation: 2
        },
        {
            title: "Risk Detection",
            desc: "Flags compliance risks and high-risk language.",
            icon: ShieldCheck,
            color: "pink" as const,
            rotation: -2
        },
        {
            title: "Conflict Checks",
            desc: "Compares documents to find contradicting policies.",
            icon: Zap,
            color: "green" as const,
            rotation: 1
        },
        {
            title: "Natural Query",
            desc: "Ask questions like 'What are the travel rules?'.",
            icon: ScanSearch,
            color: "white" as const,
            rotation: -1.5
        }
    ];

    return (
        <section className="py-24 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20 max-w-2xl mx-auto">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">Features</span>
                    <h2 className="text-4xl font-bold mb-4 tracking-tight">Paperwork, without the work.</h2>
                    <p className="text-neutral-600 text-lg">Two powerful layers of intelligence working together.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {features.map((feature, i) => (
                        <div key={i} className="flex justify-center">
                            <Sticker
                                className="w-full max-w-[320px] aspect-[4/5] flex flex-col items-center text-center p-8"
                                rotation={feature.rotation}
                                color={feature.color}
                                hasTape
                                tapeVariant={i % 2 === 0 ? "top" : "corner"}
                                delay={i * 0.1}
                            >
                                <div className="bg-white/50 w-full aspect-square rounded-sm mb-6 flex items-center justify-center border border-black/5 shadow-inner">
                                    <feature.icon className="w-16 h-16 opacity-80" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                                <p className="font-hand text-xl leading-snug opacity-80">{feature.desc}</p>
                            </Sticker>
                        </div>
                    ))}

                    {/* Callout Sticker */}
                    <div className="flex justify-center pt-8 md:pt-0">
                        <Sticker
                            className="w-full max-w-[300px] aspect-[4/5] flex flex-col items-center justify-center text-center p-8 bg-neutral-900 text-white border-neutral-800"
                            rotation={3}
                            color="white"
                            hasTape
                        >
                            <p className="font-hand text-3xl text-yellow-300 mb-4">And much more...</p>
                            <p className="text-neutral-400">Analytics, RBAC, Text Search...</p>
                        </Sticker>
                    </div>
                </div>
            </div>
        </section>
    )
}
