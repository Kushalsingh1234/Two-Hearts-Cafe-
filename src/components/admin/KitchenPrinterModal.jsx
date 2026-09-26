import React, { useState, useEffect } from "react";
import { Printer, Bluetooth, Check, RefreshCw, AlertCircle, X, CheckCircle2, Sliders, Volume2, Sparkles } from "lucide-react";
import { printerService } from "../../utils/printerService";

export default function KitchenPrinterModal({ isOpen, onClose }) {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [paperWidth, setPaperWidth] = useState(58);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = () => {
    const current = printerService.getSelectedPrinter();
    setSelectedPrinter(current);
    setAutoPrintEnabled(printerService.isAutoPrintEnabled());
    setPaperWidth(printerService.getPaperWidth());
    setStatusMessage(null);
    setErrorMessage(null);

    // Auto scan when opened if native
    if (printerService.isNative()) {
      handleScanPrinters();
    }
  };

  const handleScanPrinters = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await printerService.getPairedPrinters();
      if (res.success) {
        setPairedDevices(res.devices || []);
        if (res.devices.length === 0) {
          setStatusMessage("No paired Bluetooth devices found. Please ensure the printer is turned on and paired in your phone's Bluetooth settings.");
        }
      } else {
        setErrorMessage(res.message || "Could not retrieve paired devices.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to scan Bluetooth printers.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectPrinter = (device) => {
    printerService.setSelectedPrinter(device);
    setSelectedPrinter(device);
    setStatusMessage(`Connected to ${device.name}!`);
    setErrorMessage(null);
  };

  const handleToggleAutoPrint = (e) => {
    const newVal = e.target.checked;
    setAutoPrintEnabled(newVal);
    printerService.setAutoPrintEnabled(newVal);
  };

  const handlePaperWidthChange = (val) => {
    setPaperWidth(val);
    printerService.setPaperWidth(val);
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      setErrorMessage("Please select a printer first.");
      return;
    }

    setIsTesting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await printerService.testPrintKOT(selectedPrinter.address);
      setStatusMessage("Test KOT printed successfully on " + selectedPrinter.name + "!");
    } catch (err) {
      console.error("Test print failed:", err);
      setErrorMessage(err.message || "Failed to print test ticket. Please check if the printer is powered on.");
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.2s ease"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          maxWidth: 520,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid var(--color-border-frame)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FAF7F2"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "var(--color-bronze)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Printer size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--color-ink)",
                  margin: 0
                }}
              >
                Kitchen KOT Printer
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-bronze)" }}>
                Everycom EC58B & Thermal Receipt Configuration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-bronze)",
              cursor: "pointer",
              padding: 6,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          
          {/* Active Status Card */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              backgroundColor: selectedPrinter ? "#F0FDF4" : "#FFFBEB",
              border: `1.5px solid ${selectedPrinter ? "#86EFAC" : "#FDE68A"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {selectedPrinter ? (
                <CheckCircle2 size={22} color="#16A34A" />
              ) : (
                <AlertCircle size={22} color="#D97706" />
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedPrinter ? "#15803D" : "#B45309" }}>
                  {selectedPrinter ? `Selected: ${selectedPrinter.name}` : "No Kitchen Printer Selected"}
                </div>
                <div style={{ fontSize: 11, color: selectedPrinter ? "#166534" : "#92400E", marginTop: 2 }}>
                  {selectedPrinter ? `MAC: ${selectedPrinter.address} • 58mm Thermal ESC/POS` : "Select your Everycom EC58B from the list below"}
                </div>
              </div>
            </div>

            {selectedPrinter && (
              <button
                onClick={handleTestPrint}
                disabled={isTesting}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "#16A34A",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap"
                }}
              >
                {isTesting ? <RefreshCw size={13} className="spin" /> : <Printer size={13} />}
                <span>{isTesting ? "Printing..." : "Test Print"}</span>
              </button>
            )}
          </div>

          {/* Messages */}
          {statusMessage && (
            <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#ECFDF5", border: "1px solid #10B981", fontSize: 12, color: "#047857" }}>
              ✓ {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#FEF2F2", border: "1px solid #F87171", fontSize: 12, color: "#B91C1C" }}>
              ⚠ {errorMessage}
            </div>
          )}

          {/* Auto Print Setting Toggle */}
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: "#FAF7F2",
              borderRadius: 10,
              border: "1px solid var(--color-border-frame)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={16} color="var(--color-bronze)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
                  Auto-Print KOT on Order Accept
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-bronze)", lineHeight: 1.4 }}>
                Immediately shoots the KOT to the kitchen printer when you tap "Accept & Prepare" or accept an Addition.
              </p>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoPrintEnabled}
                onChange={handleToggleAutoPrint}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: autoPrintEnabled ? "#15803D" : "#CBD5E1",
                  borderRadius: 24,
                  transition: "0.2s"
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    content: '""',
                    height: 18,
                    width: 18,
                    left: autoPrintEnabled ? 23 : 3,
                    bottom: 3,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                  }}
                />
              </span>
            </label>
          </div>

          {/* Paper Size selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              backgroundColor: "#FAF7F2",
              borderRadius: 10,
              border: "1px solid var(--color-border-frame)"
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
                Thermal Paper Width
              </div>
              <div style={{ fontSize: 11, color: "var(--color-bronze)" }}>
                Everycom EC58B uses standard 58mm roll (32 chars)
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {[58, 80].map((width) => (
                <button
                  key={width}
                  type="button"
                  onClick={() => handlePaperWidthChange(width)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: paperWidth === width ? "1.5px solid var(--color-bronze)" : "1px solid #D1D5DB",
                    backgroundColor: paperWidth === width ? "var(--color-bronze)" : "#FFFFFF",
                    color: paperWidth === width ? "#FFFFFF" : "var(--color-ink)",
                    cursor: "pointer"
                  }}
                >
                  {width}mm
                </button>
              ))}
            </div>
          </div>

          {/* Available / Paired Bluetooth Devices List */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Paired Bluetooth Printers
              </span>
              <button
                type="button"
                onClick={handleScanPrinters}
                disabled={isScanning}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--color-bronze)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                <RefreshCw size={13} className={isScanning ? "spin" : ""} />
                <span>{isScanning ? "Scanning..." : "Refresh List"}</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
              {pairedDevices.length === 0 ? (
                <div
                  style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    backgroundColor: "#F9FAFB",
                    borderRadius: 8,
                    border: "1px dashed #D1D5DB"
                  }}
                >
                  <Bluetooth size={24} style={{ color: "#9CA3AF", marginBottom: 6 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>
                    No Bluetooth devices detected
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                    Turn on Bluetooth on this phone, pair your <strong>Everycom EC58B</strong> in Android Bluetooth Settings (PIN usually 0000 or 1234), and tap "Refresh List".
                  </div>
                </div>
              ) : (
                pairedDevices.map((dev) => {
                  const isSelected = selectedPrinter?.address === dev.address;
                  return (
                    <div
                      key={dev.address}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: isSelected ? "2px solid #16A34A" : "1px solid #E5E7EB",
                        backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Printer size={18} color={isSelected ? "#16A34A" : "var(--color-bronze)"} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
                            {dev.name || "Bluetooth Printer"}
                            {dev.isLikelyPrinter && (
                              <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "#E0E7FF", color: "#3730A3" }}>
                                Thermal Printer
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: "#6B7280" }}>
                            {dev.address}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: 4 }}>
                          <Check size={14} />
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectPrinter(dev)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "var(--color-bronze)",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Explanation note about simultaneous music playback */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "flex-start",
              gap: 10
            }}
          >
            <Volume2 size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: "#1E40AF", lineHeight: 1.4 }}>
              <strong>Music Speaker Compatible:</strong> Android transmits receipt data through background Serial RFCOMM without disconnecting your music speaker. Your cafe songs will continue playing without any interruption!
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "#FAF7F2",
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-ink)",
              color: "#FFFFFF",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
