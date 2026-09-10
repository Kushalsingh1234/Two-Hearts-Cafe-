import React, { useState, useMemo } from "react";
import { Star, MessageSquare, Utensils, Award, Filter, Search, Calendar, Hash, RefreshCw, ThumbsUp } from "lucide-react";

export default function ReviewsManager({ reviews = [] }) {
  const [selectedTable, setSelectedTable] = useState("all");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract unique table numbers
  const uniqueTables = useMemo(() => {
    const set = new Set(reviews.map((r) => String(r.tableNumber || "")).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [reviews]);

  // Overall KPI metrics
  const stats = useMemo(() => {
    if (!reviews.length) {
      return {
        count: 0,
        avgOverall: 0,
        avgTaste: 0,
        avgQuality: 0,
        avgService: 0,
        avgAesthetic: 0
      };
    }

    let sumOverall = 0;
    let sumTaste = 0;
    let sumQuality = 0;
    let sumService = 0;
    let sumAesthetic = 0;

    reviews.forEach((r) => {
      sumOverall += Number(r.overallRating) || 5;
      sumTaste += Number(r.parameters?.foodTaste) || 5;
      sumQuality += Number(r.parameters?.orderQuality) || 5;
      sumService += Number(r.parameters?.service) || 5;
      sumAesthetic += Number(r.parameters?.cafeAesthetic) || 5;
    });

    const len = reviews.length;
    return {
      count: len,
      avgOverall: (sumOverall / len).toFixed(1),
      avgTaste: (sumTaste / len).toFixed(1),
      avgQuality: (sumQuality / len).toFixed(1),
      avgService: (sumService / len).toFixed(1),
      avgAesthetic: (sumAesthetic / len).toFixed(1)
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return reviews.filter((r) => {
      // Table filter
      if (selectedTable !== "all" && String(r.tableNumber) !== String(selectedTable)) {
        return false;
      }

      // Rating filter
      const rating = Number(r.overallRating) || 5;
      if (selectedRatingFilter === "5" && rating < 4.8) return false;
      if (selectedRatingFilter === "4" && (rating < 3.8 || rating >= 4.8)) return false;
      if (selectedRatingFilter === "3_below" && rating >= 3.8) return false;

      // Search query
      if (q) {
        const commentMatch = (r.comments || "").toLowerCase().includes(q);
        const orderMatch = (r.orderNumber || "").toLowerCase().includes(q);
        const dishMatch = (r.dishRatings || []).some((d) =>
          (d.dishName || "").toLowerCase().includes(q)
        );
        return commentMatch || orderMatch || dishMatch;
      }

      return true;
    });
  }, [reviews, selectedTable, selectedRatingFilter, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Cards Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12
        }}
      >
        {/* Total Reviews & Overall Rating */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "16px",
            borderRadius: 6,
            border: "1.5px solid var(--color-border-frame)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--color-bronze)"
            }}
          >
            Average Rating
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 32,
                fontWeight: 800,
                color: "var(--color-ink)",
                lineHeight: 1
              }}
            >
              {stats.count > 0 ? stats.avgOverall : "5.0"}
            </span>
            <div style={{ display: "flex", alignItems: "center", color: "#F59E0B" }}>
              <Star size={16} fill="#F59E0B" />
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              color: "var(--color-bronze)",
              fontStyle: "italic",
              marginTop: 4
            }}
          >
            {stats.count} table {stats.count === 1 ? "review" : "reviews"} recorded
          </div>
        </div>

        {/* Taste */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "16px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--color-bronze)"
            }}
          >
            😋 Food Taste
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--color-ink)",
              marginTop: 4
            }}
          >
            {stats.count > 0 ? `${stats.avgTaste}★` : "5.0★"}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-bronze)", fontStyle: "italic" }}>
            Flavors & cooking
          </div>
        </div>

        {/* Quality */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "16px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--color-bronze)"
            }}
          >
            🍽️ Order Quality
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--color-ink)",
              marginTop: 4
            }}
          >
            {stats.count > 0 ? `${stats.avgQuality}★` : "5.0★"}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-bronze)", fontStyle: "italic" }}>
            Freshness & presentation
          </div>
        </div>

        {/* Service */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "16px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--color-bronze)"
            }}
          >
            🛎️ Staff Service
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--color-ink)",
              marginTop: 4
            }}
          >
            {stats.count > 0 ? `${stats.avgService}★` : "5.0★"}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-bronze)", fontStyle: "italic" }}>
            Care, speed & attention
          </div>
        </div>

        {/* Aesthetic */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "16px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--color-bronze)"
            }}
          >
            🌿 Cafe Aesthetic
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--color-ink)",
              marginTop: 4
            }}
          >
            {stats.count > 0 ? `${stats.avgAesthetic}★` : "5.0★"}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-bronze)", fontStyle: "italic" }}>
            Interior & vibes
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "12px 16px",
          borderRadius: 6,
          border: "1px solid var(--border-color)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {/* Table Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-bronze)" }}>
              Table:
            </span>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-color)",
                backgroundColor: "#FAF7F2",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-ink)",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Tables ({reviews.length})</option>
              {uniqueTables.map((t) => (
                <option key={t} value={t}>
                  Table #{t}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Pill Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { id: "all", label: "All Stars" },
              { id: "5", label: "5★ Top" },
              { id: "4", label: "4★ Good" },
              { id: "3_below", label: "≤ 3★ Attention" }
            ].map((p) => {
              const active = selectedRatingFilter === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedRatingFilter(p.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: active ? "1px solid var(--color-ink)" : "1px solid var(--border-color)",
                    backgroundColor: active ? "var(--color-ink)" : "#FAF7F2",
                    color: active ? "#FAF7F2" : "var(--color-ink)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: 200, flex: "1 1 200px", maxWidth: 300 }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-bronze)"
            }}
          />
          <input
            type="text"
            placeholder="Search dish or comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px 6px 30px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-color)",
              backgroundColor: "#FAF7F2",
              fontSize: 12,
              fontFamily: "var(--font-serif)",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* Review Cards Feed */}
      {filteredReviews.length === 0 ? (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 6,
            border: "1px dashed var(--color-border-frame)",
            padding: "48px 20px",
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#FAF7F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
              fontSize: 24
            }}
          >
            ⭐
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-ink)",
              marginBottom: 4
            }}
          >
            {reviews.length === 0
              ? "No Customer Reviews Yet"
              : "No reviews match the selected filters"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "var(--color-bronze)",
              maxWidth: 400,
              margin: "0 auto"
            }}
          >
            {reviews.length === 0
              ? "When guests settle their bill and rate their meal, their ratings and dish feedback will stream here automatically in real-time."
              : "Try adjusting your table or star filters above."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredReviews.map((rev) => {
            const dateObj = new Date(rev.createdAt || rev.timestamp || Date.now());
            const dateFormatted = dateObj.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            const timeFormatted = dateObj.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit"
            });

            const overall = Number(rev.overallRating) || 5;

            return (
              <div
                key={rev.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-sm)",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                {/* Review Header */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    borderBottom: "1px dashed var(--color-border-subtle)",
                    paddingBottom: 10
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Table Badge */}
                    <div
                      style={{
                        backgroundColor: "#FAF7F2",
                        border: "1.5px solid var(--color-border-frame)",
                        borderRadius: "var(--radius-pill)",
                        padding: "3px 12px",
                        fontFamily: "var(--font-serif)",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "var(--color-ink)"
                      }}
                    >
                      Table #{rev.tableNumber}
                    </div>

                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 12,
                        color: "var(--color-bronze)"
                      }}
                    >
                      Order #{rev.orderNumber}
                    </span>

                    <span style={{ fontSize: 11, color: "var(--color-bronze)", opacity: 0.8 }}>
                      • {dateFormatted}, {timeFormatted}
                    </span>
                  </div>

                  {/* Overall Rating Pill */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: overall >= 4 ? "#FEF3C7" : "#FEE2E2",
                      border: overall >= 4 ? "1px solid #FDE68A" : "1px solid #FECACA",
                      borderRadius: "var(--radius-pill)",
                      padding: "3px 10px",
                      fontSize: 12,
                      fontFamily: "var(--font-serif)",
                      fontWeight: 800,
                      color: overall >= 4 ? "#B45309" : "#DC2626"
                    }}
                  >
                    <Star size={13} fill={overall >= 4 ? "#F59E0B" : "#DC2626"} />
                    <span>{overall.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                {/* 4 Experience Parameters Breakdown */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: 8,
                    backgroundColor: "#FAF7F2",
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--color-border-subtle)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: "var(--font-serif)", color: "var(--color-bronze)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      😋 Taste
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>
                      {rev.parameters?.foodTaste || 5}★
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: "var(--font-serif)", color: "var(--color-bronze)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      🍽️ Quality
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>
                      {rev.parameters?.orderQuality || 5}★
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: "var(--font-serif)", color: "var(--color-bronze)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      🛎️ Service
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>
                      {rev.parameters?.service || 5}★
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10.5, fontFamily: "var(--font-serif)", color: "var(--color-bronze)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      🌿 Aesthetic
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>
                      {rev.parameters?.cafeAesthetic || 5}★
                    </div>
                  </div>
                </div>

                {/* Dish Ratings Breakdown */}
                {Array.isArray(rev.dishRatings) && rev.dishRatings.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--font-serif)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                        color: "var(--color-bronze)",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 5
                      }}
                    >
                      <Utensils size={12} />
                      <span>Dishes Rated in this Meal:</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {rev.dishRatings.map((d, i) => (
                        <div
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            backgroundColor: "#fff",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-pill)",
                            padding: "3px 10px",
                            fontSize: 12,
                            fontFamily: "var(--font-serif)"
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>{d.dishName}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "#B45309", fontWeight: 800 }}>
                            <Star size={11} fill="#F59E0B" color="#F59E0B" />
                            <span>{d.rating}★</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Comments */}
                {rev.comments && (
                  <div
                    style={{
                      borderLeft: "3px solid var(--color-bronze)",
                      paddingLeft: 12,
                      marginTop: 2
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        fontSize: 13.5,
                        color: "var(--color-ink)",
                        lineHeight: 1.45
                      }}
                    >
                      "{rev.comments}"
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
