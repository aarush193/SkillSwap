import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Refined Left Exchange Arrow Swoosh + Arrowhead */}
          <path
            d="M 44 26 C 24 34 16 54 22 74 C 24 81 28 86 34 90 C 27 86 21 78 18 70 C 12 50 20 30 38 20 C 44 16 52 14 60 14"
            fill="#2dd4bf"
          />
          <path d="M 20 34 L 38 18 L 40 30 Z" fill="#2dd4bf" />

          {/* Refined Right Exchange Arrow Swoosh + Arrowhead */}
          <path
            d="M 76 94 C 96 86 104 66 98 46 C 96 39 92 34 86 30 C 93 34 99 42 102 50 C 108 70 100 90 82 100 C 76 104 68 106 60 106"
            fill="#2dd4bf"
          />
          <path d="M 100 86 L 82 102 L 80 90 Z" fill="#2dd4bf" />

          {/* Hourglass Metallic Bulb Body */}
          <path
            d="M 40 24 C 40 40, 54 52, 60 60 C 66 52, 80 40, 80 24 Z"
            fill="#0f766e"
            stroke="#0d9488"
            strokeWidth="6"
          />
          <path
            d="M 40 96 C 40 80, 54 68, 60 60 C 66 68, 80 80, 80 96 Z"
            fill="#0f766e"
            stroke="#0d9488"
            strokeWidth="6"
          />

          {/* Illuminated Sand */}
          <path d="M 45 30 C 45 38, 55 50, 60 56 C 65 50, 75 38, 75 30 Z" fill="#7dd3fc" />
          <path d="M 44 92 C 50 82, 70 82, 76 92 Z" fill="#7dd3fc" />

          {/* Metallic Caps */}
          <rect x="34" y="18" width="52" height="8" rx="4" fill="#2dd4bf" />
          <rect x="34" y="94" width="52" height="8" rx="4" fill="#2dd4bf" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
