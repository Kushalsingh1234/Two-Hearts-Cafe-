import React from "react";

export default function CafeLogoIcon({ size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        backgroundColor: "transparent"
      }}
      title="Two Hearts Cafe"
    >
      <img
        src="/logo.png"
        alt="Two Hearts Cafe Emblem"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          mixBlendMode: "multiply",
          display: "block"
        }}
      />
    </div>
  );
}
