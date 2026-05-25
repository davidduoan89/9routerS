"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const FEATURES = [
  { icon: "terminal", label: "Terminal", desc: "Full shell access" },
  { icon: "cast", label: "Desktop", desc: "Screen sharing" },
  { icon: "folder_open", label: "Files", desc: "Browse & edit files" },
];

const BULLETS = [
  { icon: "qr_code_scanner", text: "Scan QR to connect instantly" },
  { icon: "wifi_off", text: "No port forwarding needed" },
  { icon: "devices", text: "Works on any device" },
];

const NINE_REMOTE_URL = "https://9remote.cc";

export default function NineRemotePromoModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onEsc); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 fade-in" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-lg overflow-hidden shadow-[var(--shadow-elev)] fade-in flex flex-col bg-surface border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-md flex items-center justify-center bg-brand-500">
              <span className="material-symbols-outlined text-white text-base">terminal</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500 font-mono">9Remote</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:bg-surface-2 hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-5">
          {/* Hero */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="size-12 rounded-lg flex items-center justify-center bg-brand-500">
              <span className="material-symbols-outlined text-white text-[26px]">terminal</span>
            </div>
            <h1 className="text-base font-semibold text-text-main">9Remote</h1>
            <p className="text-xs text-text-muted max-w-[220px]">
              Access your terminal, desktop &amp; files from anywhere
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex gap-2 w-full">
            {FEATURES.map(({ icon, label, desc }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-md border border-border bg-surface-2">
                <span className="material-symbols-outlined text-brand-500 text-[20px]">{icon}</span>
                <p className="text-xs font-medium text-text-main">{label}</p>
                <p className="text-[10px] text-text-muted text-center leading-4">{desc}</p>
              </div>
            ))}
          </div>

          {/* Bullets */}
          <div className="flex flex-col gap-2.5 w-full">
            {BULLETS.map(({ icon, text }) => (
              <div key={icon} className="flex items-center gap-2">
                <span className="material-symbols-outlined flex-shrink-0 text-brand-500 text-[16px]">{icon}</span>
                <span className="text-xs text-text-muted">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => window.open(NINE_REMOTE_URL, "_blank")}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Get 9Remote
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
