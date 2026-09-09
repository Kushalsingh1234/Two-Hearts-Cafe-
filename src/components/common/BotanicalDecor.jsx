import React from "react";

export function BotanicalBranchTopLeft({ size = 120, color = "#1a1a1a" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    >
      {/* Main curved branch */}
      <path d="M 10 130 Q 30 70 85 20 Q 110 5 130 10" />
      {/* Leaves with veins */}
      <path d="M 25 105 C 10 95 8 75 25 80 C 35 85 30 100 25 105 Z" />
      <path d="M 25 80 L 15 95" />
      
      <path d="M 40 85 C 50 65 65 65 60 80 C 55 90 45 90 40 85 Z" />
      <path d="M 45 83 L 55 72" />

      <path d="M 55 60 C 40 45 42 28 58 35 C 68 40 65 55 55 60 Z" />
      <path d="M 54 48 L 47 38" />

      <path d="M 75 42 C 85 22 105 25 98 42 C 92 50 80 48 75 42 Z" />
      <path d="M 82 38 L 92 30" />

      {/* Little flower bud */}
      <circle cx="28" cy="115" r="4" fill="none" strokeWidth="1.5" />
      <path d="M 28 111 Q 32 108 36 112 Q 32 116 28 119 Q 24 116 20 112 Z" />
    </svg>
  );
}

export function BotanicalBranchBottomRight({ size = 120, color = "#1a1a1a" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    >
      {/* Main branch reversed */}
      <path d="M 130 10 Q 110 70 55 120 Q 30 135 10 130" />
      
      {/* Leaves with veins */}
      <path d="M 115 35 C 130 45 132 65 115 60 C 105 55 110 40 115 35 Z" />
      <path d="M 115 60 L 125 45" />

      <path d="M 100 55 C 90 75 75 75 80 60 C 85 50 95 50 100 55 Z" />
      <path d="M 95 57 L 85 68" />

      <path d="M 85 80 C 100 95 98 112 82 105 C 72 100 75 85 85 80 Z" />
      <path d="M 86 92 L 93 102" />

      <path d="M 65 98 C 55 118 35 115 42 98 C 48 90 60 92 65 98 Z" />
      <path d="M 58 102 L 48 110" />

      {/* Flower bud */}
      <circle cx="112" cy="25" r="4" fill="none" strokeWidth="1.5" />
      <path d="M 112 21 Q 108 18 104 22 Q 108 26 112 29 Q 116 26 120 22 Z" />
    </svg>
  );
}

export function CafeTableCoverIllustration({ size = 180 }) {
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 200 180"
      fill="none"
      stroke="#1a1a1a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ margin: "0 auto", display: "block" }}
    >
      {/* Wine Bottle */}
      <path d="M 90 55 L 90 70 L 85 75 L 85 105 L 99 105 L 99 75 L 94 70 L 94 55 Z" fill="#fff" />
      <path d="M 89 55 L 95 55" strokeWidth="3" />
      <path d="M 88 84 L 96 84" />
      <circle cx="92" cy="94" r="2" fill="#1a1a1a" />

      {/* Standing Menu Card */}
      <path d="M 104 48 L 122 48 L 118 105 L 100 105 Z" fill="#fff" />
      <circle cx="111" cy="62" r="6" />
      <line x1="106" y1="76" x2="116" y2="76" strokeWidth="1.5" />
      <line x1="106" y1="82" x2="114" y2="82" strokeWidth="1.5" />

      {/* Wine Glass */}
      <path d="M 125 80 Q 125 96 132 96 Q 139 96 139 80 Z" fill="#fff" />
      <line x1="132" y1="96" x2="132" y2="105" strokeWidth="2" />
      <line x1="126" y1="105" x2="138" y2="105" strokeWidth="2" />

      {/* Table cloth with folds */}
      <path
        d="M 68 105 L 148 105 L 158 145 C 150 152 142 148 135 152 C 125 146 115 152 105 148 C 95 153 85 147 75 153 L 58 145 Z"
        fill="#faf6f0"
        strokeWidth="2.5"
      />
      {/* Table cloth fold lines */}
      <line x1="90" y1="110" x2="88" y2="135" strokeWidth="1.5" />
      <line x1="140" y1="115" x2="138" y2="138" strokeWidth="1.5" />

      {/* Table Legs */}
      <path d="M 88 152 L 80 172 L 72 173" strokeWidth="3.5" />
      <path d="M 128 152 L 136 172 L 144 173" strokeWidth="3.5" />
      <path d="M 108 150 L 108 174 L 102 174" strokeWidth="4" />
    </svg>
  );
}
