"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tape } from "./tape";

interface StickerProps {
    children: React.ReactNode;
    className?: string;
    rotation?: number;
    color?: "yellow" | "blue" | "pink" | "green" | "white";
    hasTape?: boolean;
    tapeVariant?: "top" | "corner";
    delay?: number;
}

export function Sticker({
    children,
    className,
    rotation = 0,
    color = "yellow",
    hasTape = false,
    tapeVariant = "top",
    delay = 0,
}: StickerProps) {
    const colors = {
        yellow: "bg-[#FEF9C3] text-yellow-950",
        blue: "bg-[#DBEAFE] text-blue-950",
        pink: "bg-[#FCE7F3] text-pink-950",
        green: "bg-[#DCFCE7] text-green-950",
        white: "bg-white text-neutral-900 border border-neutral-200",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
            whileInView={{ opacity: 1, scale: 1, rotate: rotation }}
            viewport={{ once: true }}
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: delay
            }}
            className={cn(
                "relative p-6 shadow-xl", // Deep shadow for depth
                colors[color],
                className
            )}
            style={{
                boxShadow: "2px 4px 12px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.1)",
            }}
        >
            {hasTape && <Tape variant={tapeVariant} />}
            {children}
        </motion.div>
    );
}
