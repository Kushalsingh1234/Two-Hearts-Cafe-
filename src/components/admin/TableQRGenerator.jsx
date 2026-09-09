import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ExternalLink } from "lucide-react";
import { BotanicalBranchTopLeft, BotanicalBranchBottomRight } from "../common/BotanicalDecor";
import { CAFE_INFO } from "../../data/seedMenu";

export default function TableQRGenerator() {
  const [tableCount, setTableCount] = useState(12);
  const [selectedTable, setSelectedTable] = useState(5);
  const [viewMode, setViewMode] = useState("single"); // 'single' | 'grid'

  const baseUrl = window.location.origin;

  const handlePrint = () => {
    window.print();
  };

  const getTableUrl = (num) => `${baseUrl}/?table=${num}`;

  return (
    <div>
      {/* Controls */}
      <div className="no-print" style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        marginBottom: 24,
        backgroundColor: "#fff",
        padding: "16px 20px",
        borderRadius: 4,
        border: "1.5px solid var(--color-border-frame)",
        boxShadow: "var(--shadow-sheet)"
      }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-ink)"
          }}>
            Printable Table QR Standees
          </h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--color-bronze)" }}>
            Stylized matching Two Hearts Cafe menu cards. Place on tables for instant customer ordering!
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Table Count */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 600 }}>Tables:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: 60,
                padding: "4px 6px",
                borderRadius: 2,
                border: "1px solid var(--color-border-frame)",
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                fontWeight: 700,
                textAlign: "center"
              }}
            />
          </div>

          {/* Toggle View */}
          <div style={{
            display: "flex",
            backgroundColor: "#FAF7F2",
            padding: 3,
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--color-border-frame)"
          }}>
            <button
              onClick={() => setViewMode("single")}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: viewMode === "single" ? "var(--color-ink)" : "transparent",
                color: viewMode === "single" ? "#FAF7F2" : "var(--color-ink)"
              }}
            >
              Single Standee
            </button>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: viewMode === "grid" ? "var(--color-ink)" : "transparent",
                color: viewMode === "grid" ? "#FAF7F2" : "var(--color-ink)"
              }}
            >
              All {tableCount} Tables (Print Sheet)
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-bronze)",
              color: "#fff",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase"
            }}
          >
            <Printer size={15} />
            <span>Print Cards</span>
          </button>
        </div>
      </div>

      {/* Single Mode */}
      {viewMode === "single" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {/* Table Selector Pills */}
          <div className="no-print" style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 700
          }}>
            {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setSelectedTable(num)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  border: selectedTable === num ? "2px solid var(--color-bronze)" : "1px solid var(--color-border-frame)",
                  backgroundColor: selectedTable === num ? "var(--color-bronze)" : "#fff",
                  color: selectedTable === num ? "#fff" : "var(--color-ink)",
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  fontSize: 15
                }}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Standee Preview Card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <TableStandeeCard tableNumber={selectedTable} url={getTableUrl(selectedTable)} />

            <div className="no-print">
              <a
                href={getTableUrl(selectedTable)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--color-ink)",
                  color: "#FAF7F2",
                  fontFamily: "var(--font-serif)",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <ExternalLink size={14} />
                <span>Simulate Scan on Mobile (Table #{selectedTable})</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Print sheet of all tables */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          justifyItems: "center"
        }}>
          {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => (
            <div key={num} style={{ breakInside: "avoid" }}>
              <TableStandeeCard tableNumber={num} url={getTableUrl(num)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Standee Card Component matching the cover art
function TableStandeeCard({ tableNumber, url }) {
  return (
    <div style={{
      width: "100%",
      maxWidth: 330,
      boxSizing: "border-box",
      backgroundColor: "#FAF7F2",
      border: "2px solid var(--color-border-frame)",
      borderRadius: 4,
      boxShadow: "var(--shadow-sheet)",
      position: "relative",
      padding: 14,
      overflow: "hidden"
    }}>
      {/* Botanical Corner Motifs */}
      <div style={{ position: "absolute", top: 2, left: 2 }}>
        <BotanicalBranchTopLeft size={80} color="#1c1917" />
      </div>
      <div style={{ position: "absolute", bottom: 2, right: 2 }}>
        <BotanicalBranchBottomRight size={80} color="#1c1917" />
      </div>

      {/* Inner Frame */}
      <div style={{
        border: "1.2px solid var(--color-border-frame)",
        borderRadius: 2,
        padding: "20px 16px",
        textAlign: "center"
      }}>
        <div style={{
          fontFamily: "var(--font-script)",
          fontSize: 32,
          color: "var(--color-bronze)",
          lineHeight: 1,
          marginBottom: 2
        }}>
          Two Hearts Cafe
        </div>

        <div style={{
          fontFamily: "var(--font-serif)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 2,
          color: "var(--color-ink)",
          lineHeight: 1.1,
          marginBottom: 4
        }}>
          TABLE NO. {tableNumber}
        </div>

        <p style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 13,
          color: "var(--color-bronze)",
          maxWidth: 240,
          margin: "0 auto 14px auto",
          lineHeight: 1.3
        }}>
          Scan with your phone camera to view menu & place your order directly
        </p>

        {/* QR Code */}
        <div style={{
          backgroundColor: "#fff",
          padding: 12,
          display: "inline-block",
          border: "1.2px solid var(--color-border-frame)",
          borderRadius: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: 14
        }}>
          <QRCodeSVG
            value={url}
            size={160}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Card Footer Info */}
        <div style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 11,
          color: "var(--color-bronze)",
          lineHeight: 1.35
        }}>
          <div style={{ fontWeight: 600 }}>{CAFE_INFO.tagline}</div>
          <div>{CAFE_INFO.address}</div>
          <div>Ph- {CAFE_INFO.phone}</div>
        </div>
      </div>
    </div>
  );
}
