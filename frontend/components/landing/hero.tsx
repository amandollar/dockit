"use client";

import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Search, ShieldAlert } from "lucide-react";

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 lg:py-32">
            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">

                {/* Floating Stickers Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <Sticker
                        className="absolute top-10 left-[10%] w-48 hidden lg:block font-hand text-xl"
                        rotation={-5}
                        color="yellow"
                        hasTape
                        delay={0.2}
                    >
                        <div className="flex flex-col gap-2">
                            <FileText className="w-6 h-6 text-yellow-700/50" />
                            <p>Policy updates for 2024...</p>
                        </div>
                    </Sticker>

                    <Sticker
                        className="absolute top-20 right-[15%] w-40 hidden lg:block font-hand text-lg"
                        rotation={12}
                        color="blue"
                        hasTape
                        tapeVariant="corner"
                        delay={0.4}
                    >
                        <div className="flex flex-col gap-2">
                            <Search className="w-6 h-6 text-blue-700/50" />
                            <p>Find conflict in clause 4.2</p>
                        </div>
                    </Sticker>

                    <Sticker
                        className="absolute bottom-20 left-[20%] w-56 hidden lg:block font-hand text-xl"
                        rotation={-18}
                        color="pink"
                        hasTape
                        delay={0.6}
                    >
                        <div className="flex flex-col gap-2">
                            <ShieldAlert className="w-6 h-6 text-pink-700/50" />
                            <p>Compliance Risk Detected!</p>
                        </div>
                    </Sticker>
                </div>


                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl space-y-8"
                >
                    <div className="inline-block relative">

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 leading-[1.1]">
                            Upload it. Understand it. <br className="hidden md:block" />
                            <span className="relative inline-block mt-2">
                                <span className="relative z-10">Act on it.</span>
                                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-yellow-300 -z-10 rotate-[-1deg] opacity-80" />
                            </span>
                        </h1>
                    </div>

                    <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                        DOCIT transforms your document storage into a decision-support system.
                        Automated tagging, summarization, and conflict detection powered by AI.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-neutral-500/10">
                            Get Started
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                            View Demo
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
