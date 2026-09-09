import React from "react";
import { Search } from "lucide-react";
import { INITIAL_CATEGORIES } from "../../data/seedMenu";

export default function MenuCategoryBar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) {
  return (
    <div style={{
      marginBottom: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      width: "100%",
      boxSizing: "border-box"
    }}>
      {/* Search Input */}
      <div style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
        <Search size={15} style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--color-bronze)"
        }} />
        <input
          type="text"
          placeholder="Search pasta, pizza, momos, thalis, parathas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "9px 34px 9px 34px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--border-color)",
            backgroundColor: "#fff",
            fontSize: 13,
            color: "var(--color-ink)",
            outline: "none"
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 13,
              color: "var(--color-bronze)"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Horizontal Category Bar (Scroller stays within screen bounds) */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          width: "100%",
          boxSizing: "border-box",
          paddingBottom: 2
        }}
      >
        {INITIAL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontFamily: "var(--font-serif)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontWeight: isSelected ? 700 : 600,
                border: isSelected ? "1.5px solid var(--color-ink)" : "1px solid var(--border-color)",
                backgroundColor: isSelected ? "var(--color-ink)" : "#fff",
                color: isSelected ? "#FAF7F2" : "var(--color-ink)",
                transition: "all 0.15s"
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
