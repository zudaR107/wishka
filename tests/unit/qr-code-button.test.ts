import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  resolve(__dirname, "../../src/app/_dashboard/qr-code-button.tsx"),
  "utf-8",
);
const dashboardCSS = readFileSync(
  resolve(__dirname, "../../src/app/styles/dashboard.css"),
  "utf-8",
);

describe("qr-code-button.tsx — client component", () => {
  it("is marked as a client component", () => {
    expect(src).toContain('"use client"');
  });

  it("imports QRCodeCanvas from qrcode.react", () => {
    expect(src).toContain("QRCodeCanvas");
    expect(src).toContain("qrcode.react");
  });

  it("opens the dialog via showModal on button click", () => {
    expect(src).toContain("showModal()");
  });

  it("closes the dialog on backdrop click", () => {
    expect(src).toContain("e.target === e.currentTarget");
    expect(src).toContain("dialogRef.current?.close()");
  });

  it("downloads the QR code as PNG via canvas toDataURL", () => {
    expect(src).toContain('toDataURL("image/png")');
    expect(src).toContain('download = "qr-code.png"');
  });

  it("uses copy-url-btn class to match the copy button style", () => {
    expect(src).toContain("copy-url-btn");
  });

  it("renders an SVG icon inside the trigger button", () => {
    expect(src).toContain("<svg");
    expect(src).toContain('aria-hidden="true"');
  });

  it("accepts url and labels props", () => {
    expect(src).toContain("url: string");
    expect(src).toContain("qrLabel: string");
    expect(src).toContain("qrDialogTitle: string");
    expect(src).toContain("qrDownloadLabel: string");
    expect(src).toContain("qrCloseLabel: string");
  });
});

describe("dashboard.css — QR dialog styles", () => {
  it("declares .qr-dialog class", () => {
    expect(dashboardCSS).toContain(".qr-dialog");
  });

  it("applies a backdrop blur to the dialog overlay", () => {
    expect(dashboardCSS).toContain(".qr-dialog::backdrop");
    expect(dashboardCSS).toContain("backdrop-filter: blur");
  });

  it("centers dialog content with flexbox column", () => {
    expect(dashboardCSS).toContain(".qr-dialog-inner");
    expect(dashboardCSS).toContain("align-items: center");
  });

  it("uses a white background for the QR code area to ensure readability", () => {
    expect(dashboardCSS).toContain(".qr-dialog-code");
    expect(dashboardCSS).toContain("background: #ffffff");
  });
});
