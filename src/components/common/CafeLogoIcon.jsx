import React from "react";

export default function CafeLogoIcon({ size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
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
          width: "138%",
          height: "138%",
          objectFit: "cover",
          mixBlendMode: "multiply",
          display: "block"
        }}
      />
    </div>
  );
}
