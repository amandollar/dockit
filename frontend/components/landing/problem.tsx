"use client";

import { Sticker } from "@/components/ui/sticker";
import { ArrowDown, X, Check } from "lucide-react";

export function Problem() {
    return (
        <section className="py-24 bg-neutral-100/50 relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Why traditional systems fail</h2>
                    <p className="text-neutral-600">They store documents. They don't understand them.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 justify-center items-center md:items-stretch max-w-5xl mx-auto">

                    {/* The Old Way */}
                    <div className="relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-white px-4 py-1 shadow-sm border border-neutral-200 rotate-[-2deg]">
                            <span className="font-hand text-xl font-bold text-red-600">The Old Way</span>
                        </div>
                        <Sticker className="w-full md:w-80 h-full min-h-[300px]" rotation={-2} color="white">
                            <ul className="space-y-4 font-hand text-xl text-neutral-600 mt-4">
                                <li className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                                    <span>Manual tagging</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                                    <span>Folder mazes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                                    <span>Hidden conflicts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                                    <span>Zero context</span>
                                </li>
                            </ul>
                            <div className="absolute bottom-6 right-6 opacity-20 rotate-[-15deg]">
                                <span className="text-6xl font-serif">?</span>
                            </div>
                        </Sticker>
                    </div>

                    <div className="hidden md:flex flex-col justify-center items-center text-neutral-300">
                        <ArrowDown className="w-12 h-12 -rotate-90 md:rotate-0" />
                    </div>

                    {/* The DOCIT Way */}
                    <div className="relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-neutral-900 px-4 py-1 shadow-lg border border-neutral-900 rotate-[1deg]">
                            <span className="font-hand text-xl font-bold text-yellow-300">The DOCIT Way</span>
                        </div>
                        <Sticker className="w-full md:w-80 h-full min-h-[300px]" rotation={1} color="yellow" hasTape>
                            <ul className="space-y-4 font-hand text-xl text-neutral-800 mt-4">
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                    <span>Auto-summaries</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                    <span>Conflict detection</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                    <span>Risk flagging</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                    <span>Smart search</span>
                                </li>
                            </ul>
                            <div className="absolute bottom-4 right-4 text-green-600 opacity-20 rotate-[15deg]">
                                <Check className="w-16 h-16" />
                            </div>
                        </Sticker>
                    </div>

                </div>
            </div>
        </section>
    )
}
