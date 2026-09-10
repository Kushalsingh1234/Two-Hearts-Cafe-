import React, { useState } from "react";
import { Copy, Check, ShieldAlert, X, ExternalLink } from "lucide-react";

export default function FirestoreRulesModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Menu items: readable by all customers, writable by staff
    match /menu_items/{item} {
      allow read: if true;
      allow write: if true;
    }
    // Table orders: readable and createable by customers & staff
    match /orders/{order} {
      allow read, write: if true;
    }
    // Table reviews & ratings: readable and writeable by customers & staff
    match /table_reviews/{review} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 90,
      backgroundColor: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "var(--radius-lg)",
        padding: 24,
        width: "100%",
        maxWidth: 580,
        boxShadow: "var(--shadow-float)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-brand-dark)" }}>
                Firebase Firestore Setup Guide
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Ensure your Firebase console has Firestore enabled with read/write access.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-light)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: 12 }}>
          <p>
            To allow table orders to sync seamlessly across different devices (phones and cafe kitchen counter):
          </p>

          <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>
              Go to your <a href="https://console.firebase.google.com/project/two-hearts-cafe-1144c/firestore/rules" target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Firebase Console Firestore Rules <ExternalLink size={12} style={{ display: "inline" }} /></a>.
            </li>
            <li>
              Paste the following rules into the editor and click <strong>"Publish"</strong>:
            </li>
          </ol>

          <div style={{ position: "relative" }}>
            <pre style={{
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              padding: "14px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontFamily: "monospace",
              overflowX: "auto"
            }}>
              {rulesText}
            </pre>
            <button
              onClick={handleCopy}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: copied ? "#10b981" : "rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? "Copied!" : "Copy Rules"}</span>
            </button>
          </div>

          <div style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
            color: "#166534"
          }}>
            <strong>Smart Fallback Active:</strong> Even if Firestore permissions aren't set yet, Two Hearts automatically caches data locally and synchronizes across browser tabs so you can demo and test right away!
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "var(--color-brand-dark)",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: "var(--radius-full)",
              fontSize: 13,
              fontWeight: 700
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
