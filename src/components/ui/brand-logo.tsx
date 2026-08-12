import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: "standard" | "full";
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * SkillSwap Production Brand Logo Component
 * High-precision vector rendering matching the master asset export sheet.
 * Features 3D-effect metallic teal gradients, polished filled exchange arrows,
 * illuminated sand crystals, and subtle ambient particle glows.
 */
export function BrandLogo({ className, iconOnly = false, variant = "standard", size = "md" }: BrandLogoProps) {
  const iconDimensions =
    size === "sm"
      ? "h-7 w-7"
      : size === "lg"
      ? "h-11 w-11"
      : size === "xl"
      ? "h-24 w-24"
      : "h-8 w-8";

  const textDimensions =
    size === "sm"
      ? "text-base"
      : size === "lg"
      ? "text-2xl"
      : size === "xl"
      ? "text-4xl"
      : "text-xl";

  return (
    <div
      className={cn(
        "inline-flex select-none",
        variant === "full" ? "flex-col items-center text-center gap-3" : "items-center gap-2.5 font-bold tracking-tight",
        className
      )}
    >
      {/* Refined Master Icon SVG */}
      <div className={cn("relative shrink-0 flex items-center justify-center filter drop-shadow-md", iconDimensions)}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* 3D Cyan-Teal Metallic Body Gradient */}
            <linearGradient id="ss-teal-body" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="25%" stopColor="#2dd4bf" />
              <stop offset="65%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>

            {/* Glowing Arrow Gradient */}
            <linearGradient id="ss-arrow-teal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            {/* Sand Crystal Gradient */}
            <linearGradient id="ss-sand-crystal" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="40%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>

            {/* Cap Metallic Sheen */}
            <linearGradient id="ss-metal-sheen" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="30%" stopColor="#2dd4bf" />
              <stop offset="50%" stopColor="#ccfbf1" />
              <stop offset="70%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            {/* Ambient Aura Glow */}
            <radialGradient id="ss-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#0d9488" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient Outer Aura Glow */}
          <circle cx="60" cy="60" r="54" fill="url(#ss-aura)" />

          {/* Ambient Sand Sparkle Particles */}
          <circle cx="38" cy="34" r="1.8" fill="#e0f2fe" opacity="0.9" />
          <circle cx="82" cy="30" r="1.4" fill="#5eead4" opacity="0.75" />
          <circle cx="84" cy="80" r="1.6" fill="#e0f2fe" opacity="0.8" />
          <circle cx="36" cy="86" r="1.2" fill="#5eead4" opacity="0.85" />
          <circle cx="28" cy="60" r="1.5" fill="#38bdf8" opacity="0.7" />

          {/* LEFT REFINED EXCHANGE ARROW (Filled 3D Swoosh & Arrowhead) */}
          <path
            d="M 44 26 C 24 34 16 54 22 74 C 24 81 28 86 34 90 C 27 86 21 78 18 70 C 12 50 20 30 38 20 C 44 16 52 14 60 14"
            fill="url(#ss-arrow-teal)"
            opacity="0.9"
          />
          {/* Left Arrowhead */}
          <path
            d="M 20 34 L 38 18 L 40 30 Z"
            fill="url(#ss-arrow-teal)"
            stroke="#2dd4bf"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* RIGHT REFINED EXCHANGE ARROW (Filled 3D Swoosh & Arrowhead) */}
          <path
            d="M 76 94 C 96 86 104 66 98 46 C 96 39 92 34 86 30 C 93 34 99 42 102 50 C 108 70 100 90 82 100 C 76 104 68 106 60 106"
            fill="url(#ss-arrow-teal)"
            opacity="0.9"
          />
          {/* Right Arrowhead */}
          <path
            d="M 100 86 L 82 102 L 80 90 Z"
            fill="url(#ss-arrow-teal)"
            stroke="#2dd4bf"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* HOURLASS GLASS BULB FRAME */}
          {/* Upper Glass Bulb */}
          <path
            d="M 40 24 C 40 40, 54 52, 60 60 C 66 52, 80 40, 80 24 Z"
            fill="#0f766e"
            fillOpacity="0.25"
            stroke="url(#ss-teal-body)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Lower Glass Bulb */}
          <path
            d="M 40 96 C 40 80, 54 68, 60 60 C 66 68, 80 80, 80 96 Z"
            fill="#0f766e"
            fillOpacity="0.3"
            stroke="url(#ss-teal-body)"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Glass Inner Reflection Highlights */}
          <path
            d="M 44 28 C 44 38, 52 46, 56 52"
            stroke="#ccfbf1"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M 44 92 C 44 82, 52 74, 56 68"
            stroke="#ccfbf1"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* ILLUMINATED SAND - Upper Stream */}
          <path
            d="M 45 30 C 45 38, 55 50, 60 56 C 65 50, 75 38, 75 30 Z"
            fill="url(#ss-sand-crystal)"
            opacity="0.9"
          />
          {/* Falling Sand Trickle Line */}
          <line
            x1="60"
            y1="56"
            x2="60"
            y2="78"
            stroke="#7dd3fc"
            strokeWidth="2.5"
            strokeDasharray="3 3"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* ILLUMINATED SAND - Accumulated Bottom Base */}
          <path
            d="M 44 92 C 50 82, 70 82, 76 92 Z"
            fill="url(#ss-sand-crystal)"
          />

          {/* METALLIC TOP CAP */}
          <rect x="34" y="18" width="52" height="8" rx="4" fill="url(#ss-metal-sheen)" />
          <rect x="36" y="20" width="48" height="2.5" rx="1.2" fill="#e0f2fe" opacity="0.7" />

          {/* METALLIC BOTTOM CAP */}
          <rect x="34" y="94" width="52" height="8" rx="4" fill="url(#ss-metal-sheen)" />
          <rect x="36" y="96" width="48" height="2.5" rx="1.2" fill="#e0f2fe" opacity="0.7" />
        </svg>
      </div>

      {/* Brand Wordmark Header */}
      {!iconOnly && (
        <div className={cn(variant === "full" && "flex flex-col items-center")}>
          <span className={cn("font-extrabold tracking-tight text-foreground flex items-center leading-none", textDimensions)}>
            Skill<span className="text-teal-500 dark:text-teal-400">Swap</span>
          </span>
          {variant === "full" && (
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mt-2 opacity-85">
              A Time Bank
            </span>
          )}
        </div>
      )}
    </div>
  );
}


