import { cn } from "@/lib/utils";

interface TapeProps {
    className?: string;
    variant?: "top" | "corner" | "diagonal";
}

export function Tape({ className, variant = "top" }: TapeProps) {
    const variants = {
        top: "-top-3 left-1/2 -translate-x-1/2 rotate-1",
        corner: "-top-3 -right-3 rotate-45",
        diagonal: "top-0 left-0 -translate-y-1/2 -translate-x-1/2 -rotate-45",
    };

    return (
        <div
            className={cn(
                "absolute h-8 w-24 bg-white/40 backdrop-blur-sm shadow-sm z-20",
                "border-[0.5px] border-white/20",
                "mask-tape", // We can add a custom utility for jagged edges later or just use basic styles for now
                variants[variant],
                className
            )}
            style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transform: "rotate(-2deg)", // subtle natural rotation
            }}
        >
            {/* Texture for tape */}
            <div className="absolute inset-0 bg-white/10 opacity-50" />
        </div>
    );
}
