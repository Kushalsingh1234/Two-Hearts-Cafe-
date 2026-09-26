import { registerPlugin, Capacitor } from "@capacitor/core";

// Register custom native Android PrinterPlugin
const NativePrinter = registerPlugin("PrinterPlugin");

const STORAGE_KEYS = {
  PRINTER_ADDRESS: "twohearts_printer_address",
  PRINTER_NAME: "twohearts_printer_name",
  AUTOPRINT_KOT: "twohearts_autoprint_kot",
  PAPER_WIDTH: "twohearts_printer_paper_width" // '58' or '80'
};

/**
 * Clean string to standard ASCII printable bytes (safe for Everycom and ESC/POS thermal printers)
 */
function sanitizeText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[₹]/g, "Rs.")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/[•]/g, "*")
    .replace(/[^\x20-\x7E\n\r]/g, ""); // Remove non-printable ASCII
}

/**
 * ESC/POS Binary Buffer Builder
 */
class EscPosBuilder {
  constructor(lineWidth = 32) {
    this.lineWidth = lineWidth;
    this.buffer = [];
  }

  // Raw byte appender
  raw(bytes) {
    if (Array.isArray(bytes)) {
      this.buffer.push(...bytes);
    } else if (bytes instanceof Uint8Array) {
      for (let i = 0; i < bytes.length; i++) this.buffer.push(bytes[i]);
    } else {
      this.buffer.push(bytes);
    }
    return this;
  }

  // Initialize printer
  init() {
    return this.raw([0x1b, 0x40]);
  }

  // Alignments: 'left', 'center', 'right'
  align(alignment) {
    let mode = 0; // left
    if (alignment === "center") mode = 1;
    if (alignment === "right") mode = 2;
    return this.raw([0x1b, 0x61, mode]);
  }

  // Bold
  bold(enable = true) {
    return this.raw([0x1b, 0x45, enable ? 0x01 : 0x00]);
  }

  // Font sizing: normal, doubleHeight, doubleSize
  size(mode = "normal") {
    let val = 0x00;
    if (mode === "doubleHeight") val = 0x01;
    if (mode === "doubleWidth") val = 0x10;
    if (mode === "doubleSize") val = 0x11;
    return this.raw([0x1d, 0x21, val]);
  }

  // Feed new line
  feed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.raw(0x0a);
    }
    return this;
  }

  // Write text
  text(str) {
    const clean = sanitizeText(str);
    for (let i = 0; i < clean.length; i++) {
      this.buffer.push(clean.charCodeAt(i));
    }
    return this;
  }

  textLine(str = "") {
    this.text(str);
    return this.feed(1);
  }

  // Full separator line
  separator(char = "-") {
    return this.textLine(char.repeat(this.lineWidth));
  }

  // Two column line: left-aligned + right-aligned
  twoCol(left, right) {
    const cleanL = sanitizeText(left);
    const cleanR = sanitizeText(right);
    const totalLen = this.lineWidth;
    const spaceCount = Math.max(1, totalLen - (cleanL.length + cleanR.length));
    const line = cleanL + " ".repeat(spaceCount) + cleanR;
    return this.textLine(line.slice(0, totalLen));
  }

  // Cut paper or space feed
  cut() {
    // 4 line feeds then partial cut command
    this.feed(4);
    return this.raw([0x1d, 0x56, 0x41, 0x03]);
  }

  // Get Uint8Array
  toBytes() {
    return new Uint8Array(this.buffer);
  }

  // Get Base64 encoded string
  toBase64() {
    const bytes = this.toBytes();
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

/**
 * Format timestamp nicely
 */
function formatKOTTime(timestamp) {
  try {
    const d = timestamp ? new Date(timestamp) : new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month} ${hours}:${minutes} ${ampm}`;
  } catch {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

class PrinterService {
  isNative() {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  }

  getSelectedPrinter() {
    if (typeof window === "undefined") return null;
    const address = localStorage.getItem(STORAGE_KEYS.PRINTER_ADDRESS);
    const name = localStorage.getItem(STORAGE_KEYS.PRINTER_NAME);
    return address ? { address, name: name || "Everycom EC58B" } : null;
  }

  setSelectedPrinter(printer) {
    if (!printer) {
      localStorage.removeItem(STORAGE_KEYS.PRINTER_ADDRESS);
      localStorage.removeItem(STORAGE_KEYS.PRINTER_NAME);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.PRINTER_ADDRESS, printer.address);
    localStorage.setItem(STORAGE_KEYS.PRINTER_NAME, printer.name || "Thermal Printer");
  }

  isAutoPrintEnabled() {
    if (typeof window === "undefined") return true;
    const val = localStorage.getItem(STORAGE_KEYS.AUTOPRINT_KOT);
    // Default to true for zero-click auto-KOT
    return val === null ? true : val === "true";
  }

  setAutoPrintEnabled(enabled) {
    localStorage.setItem(STORAGE_KEYS.AUTOPRINT_KOT, enabled ? "true" : "false");
  }

  getPaperWidth() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.PAPER_WIDTH) || "58", 10);
  }

  setPaperWidth(width) {
    localStorage.setItem(STORAGE_KEYS.PAPER_WIDTH, String(width));
  }

  /**
   * Get list of bonded/paired Bluetooth printers
   */
  async getPairedPrinters() {
    if (!this.isNative()) {
      return {
        success: false,
        isWeb: true,
        message: "Native Android app required for direct Bluetooth scanning",
        devices: []
      };
    }

    try {
      const res = await NativePrinter.getPairedPrinters();
      return {
        success: true,
        devices: res.devices || []
      };
    } catch (err) {
      console.error("[PrinterService] getPairedPrinters error:", err);
      return {
        success: false,
        message: err.message || "Failed to scan paired Bluetooth devices",
        devices: []
      };
    }
  }

  /**
   * Test connection to a specific printer or the saved printer
   */
  async testConnection(targetAddress) {
    const address = targetAddress || this.getSelectedPrinter()?.address;
    if (!address) {
      throw new Error("No printer address specified. Please select a printer first.");
    }

    if (!this.isNative()) {
      return { success: true, connected: true, isMock: true };
    }

    return await NativePrinter.testConnection({ address });
  }

  /**
   * Send raw ESC/POS bytes (Base64) to the saved printer
   */
  async sendToPrinter(base64Data, targetAddress) {
    const printer = this.getSelectedPrinter();
    const address = targetAddress || printer?.address;

    if (!address) {
      throw new Error("No printer connected! Please select your Everycom EC58B in Printer Settings.");
    }

    if (!this.isNative()) {
      console.info("[PrinterService - Web Preview] Printed bytes payload:", base64Data);
      return { success: true, simulated: true };
    }

    return await NativePrinter.printRaw({ address, data: base64Data });
  }

  /**
   * Generate ESC/POS KOT for a Table Order
   */
  buildTableOrderKOT(order, options = {}) {
    const { isAddition = false, additionItems = null, kotSequence = 1 } = options;
    const lineWidth = this.getPaperWidth() === 80 ? 42 : 32;
    const builder = new EscPosBuilder(lineWidth);

    const itemsToPrint = isAddition && additionItems && additionItems.length > 0
      ? additionItems
      : (order.items || []);

    const timeStr = formatKOTTime(order.createdAt || Date.now());
    const tableNum = order.tableNumber != null ? String(order.tableNumber) : "-";
    const orderNum = order.orderNumber ? String(order.orderNumber) : String(order.id || "").slice(-4);

    builder.init();

    // 1. HEADER
    builder.align("center");
    builder.size("normal");
    builder.bold(true);
    builder.textLine("TWO HEARTS CAFE");
    builder.size("doubleHeight");
    
    if (isAddition) {
      builder.textLine("*** ADD-ON KOT ***");
    } else {
      builder.textLine("KITCHEN TICKET (KOT)");
    }

    builder.size("normal");
    builder.bold(false);
    builder.separator("=");

    // 2. ORDER META INFO
    builder.align("left");
    builder.bold(true);
    builder.size("doubleHeight");
    builder.textLine(`TABLE: ${tableNum}`);
    builder.size("normal");
    builder.bold(false);

    builder.twoCol(`KOT #: #${orderNum}`, `Type: Dine-In`);
    builder.twoCol(`Time: ${timeStr}`, isAddition ? `[ADDITION #${kotSequence}]` : "[NEW ORDER]");

    builder.separator("-");

    // 3. ITEMS TABLE
    builder.bold(true);
    builder.twoCol("QTY  ITEM", "");
    builder.bold(false);
    builder.separator("-");

    let totalQty = 0;
    itemsToPrint.forEach((item) => {
      const qty = item.quantity || 1;
      totalQty += qty;
      const itemName = item.name || "Item";

      // Bold quantity and item name
      builder.bold(true);
      builder.textLine(` ${qty}x  ${itemName}`);
      builder.bold(false);

      // Print item note if present
      if (item.note) {
        builder.textLine(`     * Note: ${item.note}`);
      }
    });

    builder.separator("-");
    builder.twoCol(`Items: ${itemsToPrint.length}`, `Total Qty: ${totalQty}`);

    // 4. SPECIAL INSTRUCTIONS / KITCHEN NOTES
    if (order.specialInstructions && !isAddition) {
      builder.separator("-");
      builder.bold(true);
      builder.textLine("CUSTOMER INSTRUCTIONS:");
      builder.bold(false);
      builder.textLine(`"${order.specialInstructions}"`);
    }

    // 5. FOOTER
    builder.separator("=");
    builder.align("center");
    builder.bold(true);
    builder.textLine(isAddition ? ">>> PREPARE WITH TABLE ORDER <<<" : ">>> TWO HEARTS KITCHEN <<<");
    builder.cut();

    return builder.toBase64();
  }

  /**
   * Generate ESC/POS KOT for Online Delivery / Pickup Order
   */
  buildOnlineOrderKOT(onlineOrder) {
    const lineWidth = this.getPaperWidth() === 80 ? 42 : 32;
    const builder = new EscPosBuilder(lineWidth);

    const timeStr = formatKOTTime(onlineOrder.createdAt || Date.now());
    const orderNum = onlineOrder.orderNumber ? String(onlineOrder.orderNumber) : String(onlineOrder.id || "").slice(-5);
    const orderType = String(onlineOrder.orderType || "DELIVERY").toUpperCase();

    builder.init();

    // 1. HEADER
    builder.align("center");
    builder.size("normal");
    builder.bold(true);
    builder.textLine("TWO HEARTS CAFE");
    builder.size("doubleHeight");
    builder.textLine(`ONLINE KOT [${orderType}]`);
    builder.size("normal");
    builder.bold(false);
    builder.separator("=");

    // 2. ORDER META INFO
    builder.align("left");
    builder.bold(true);
    builder.size("doubleHeight");
    builder.textLine(`ORDER: #${orderNum}`);
    builder.size("normal");
    builder.bold(false);

    builder.twoCol(`Customer: ${onlineOrder.customerName || "Customer"}`, "");
    if (onlineOrder.customerPhone) {
      builder.textLine(`Phone: ${onlineOrder.customerPhone}`);
    }
    builder.twoCol(`Time: ${timeStr}`, `Mode: ${orderType}`);

    builder.separator("-");

    // 3. ITEMS TABLE
    builder.bold(true);
    builder.twoCol("QTY  ITEM", "");
    builder.bold(false);
    builder.separator("-");

    let totalQty = 0;
    (onlineOrder.items || []).forEach((item) => {
      const qty = item.quantity || 1;
      totalQty += qty;
      const itemName = item.name || "Item";

      builder.bold(true);
      builder.textLine(` ${qty}x  ${itemName}`);
      builder.bold(false);

      if (item.note) {
        builder.textLine(`     * Note: ${item.note}`);
      }
    });

    builder.separator("-");
    builder.twoCol(`Total Items: ${onlineOrder.items?.length || 0}`, `Total Qty: ${totalQty}`);

    // Instructions
    if (onlineOrder.specialInstructions || onlineOrder.deliveryNotes) {
      builder.separator("-");
      builder.bold(true);
      builder.textLine("NOTES:");
      builder.bold(false);
      builder.textLine(onlineOrder.specialInstructions || onlineOrder.deliveryNotes);
    }

    builder.separator("=");
    builder.align("center");
    builder.bold(true);
    builder.textLine(">>> ONLINE PACKING TICKET <<<");
    builder.cut();

    return builder.toBase64();
  }

  /**
   * Test Print KOT Sample
   */
  async testPrintKOT(targetAddress) {
    const lineWidth = this.getPaperWidth() === 80 ? 42 : 32;
    const builder = new EscPosBuilder(lineWidth);

    builder.init();
    builder.align("center");
    builder.size("normal");
    builder.bold(true);
    builder.textLine("TWO HEARTS CAFE");
    builder.size("doubleHeight");
    builder.textLine("TEST PRINTER KOT");
    builder.size("normal");
    builder.bold(false);
    builder.separator("=");

    builder.align("left");
    builder.bold(true);
    builder.size("doubleHeight");
    builder.textLine("TABLE: 7 (TEST)");
    builder.size("normal");
    builder.bold(false);
    builder.twoCol("Status: READY", "Interface: BT SPP");
    builder.twoCol("Printer: EC58B", "Width: 58mm");
    builder.separator("-");

    builder.bold(true);
    builder.textLine("QTY  ITEM");
    builder.bold(false);
    builder.separator("-");

    builder.bold(true);
    builder.textLine(" 2x  Cold Coffee");
    builder.bold(false);
    builder.textLine("     * Extra Chocolate Ice Cream");
    builder.bold(true);
    builder.textLine(" 1x  Paneer Tikka Pizza");
    builder.bold(false);
    builder.textLine("     * Crisp crust, medium spicy");

    builder.separator("-");
    builder.align("center");
    builder.bold(true);
    builder.textLine("Everycom EC58B Working Perfectly!");
    builder.bold(false);
    builder.textLine(new Date().toLocaleString());
    builder.cut();

    const base64 = builder.toBase64();
    return await this.sendToPrinter(base64, targetAddress);
  }

  /**
   * Print Kitchen Ticket for Table Order
   */
  async printKOT(order, options = {}) {
    if (!order) return;
    try {
      const base64Data = this.buildTableOrderKOT(order, options);
      return await this.sendToPrinter(base64Data);
    } catch (err) {
      console.warn("[PrinterService] printKOT failed:", err);
      throw err;
    }
  }

  /**
   * Print Kitchen Ticket for Online Order
   */
  async printOnlineKOT(onlineOrder) {
    if (!onlineOrder) return;
    try {
      const base64Data = this.buildOnlineOrderKOT(onlineOrder);
      return await this.sendToPrinter(base64Data);
    } catch (err) {
      console.warn("[PrinterService] printOnlineKOT failed:", err);
      throw err;
    }
  }
}

export const printerService = new PrinterService();
