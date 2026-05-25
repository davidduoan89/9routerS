"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { APP_CONFIG, UPDATER_CONFIG } from "@/shared/constants/config";
import { MEDIA_PROVIDER_KINDS } from "@/shared/constants/providers";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import Button from "./Button";
import { ConfirmModal } from "./Modal";
import { apiFetch } from "@/shared/utils/apiBase";

const VISIBLE_MEDIA_KINDS = ["embedding", "image", "tts", "stt"];
const COMBINED_WEB_ITEM = { id: "web", label: "Web Fetch & Search", icon: "travel_explore", href: "/dashboard/media-providers/web" };

const navItems = [
  { href: "/dashboard/endpoint", label: "Endpoint", icon: "api" },
  { href: "/dashboard/providers", label: "Providers", icon: "dns" },
  { href: "/dashboard/combos", label: "Combos", icon: "layers" },
  { href: "/dashboard/usage", label: "Usage", icon: "bar_chart" },
  { href: "/dashboard/quota", label: "Quota Tracker", icon: "data_usage" },
  { href: "/dashboard/mitm", label: "MITM", icon: "security" },
  { href: "/dashboard/cli-tools", label: "CLI Tools", icon: "terminal" },
];

const debugItems = [
  { href: "/dashboard/console-log", label: "Console Log", icon: "terminal" },
  { href: "/dashboard/translator", label: "Translator", icon: "translate" },
];

const systemItems = [
  { href: "/dashboard/proxy-pools", label: "Proxy Pools", icon: "lan" },
  { href: "/dashboard/skills", label: "Skills", icon: "extension" },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shutdownCountdown, setShutdownCountdown] = useState(0);
  const [enableTranslator, setEnableTranslator] = useState(false);
  const { copied, copy } = useCopyToClipboard(2000);

  const INSTALL_CMD = UPDATER_CONFIG.installCmdLatest;

  useEffect(() => {
    apiFetch("/api/settings")
      .then(res => res.json())
      .then(data => { if (data.enableTranslator) setEnableTranslator(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiFetch("/api/version")
      .then(res => res.json())
      .then(data => { if (data.hasUpdate) setUpdateInfo(data); })
      .catch(() => {});
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard/endpoint") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/endpoint");
    }
    return pathname.startsWith(href);
  };

  const handleUpdate = () => {
    setShowUpdateModal(false);
    setIsUpdating(true);
  };

  const handleCopyAndShutdown = async () => {
    try { await navigator.clipboard.writeText(INSTALL_CMD); } catch {}
    copy(INSTALL_CMD);
    let remaining = UPDATER_CONFIG.shutdownCountdownSec;
    setShutdownCountdown(remaining);
    const timer = setInterval(() => {
      remaining -= 1;
      setShutdownCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        apiFetch("/api/version/shutdown", { method: "POST" }).catch(() => {});
        setIsDisconnected(true);
      }
    }, 1000);
  };

  const handleCancelUpdate = () => {
    setIsUpdating(false);
    setShutdownCountdown(0);
  };

  const handleShutdown = async () => {
    setIsShuttingDown(true);
    try {
      await apiFetch("/api/version/shutdown", { method: "POST" });
    } catch (e) {
      // Expected to fail as server shuts down
    }
    setIsShuttingDown(false);
    setShowShutdownModal(false);
    setIsDisconnected(true);
  };

  const NavLink = ({ href, icon, label, indent = false }) => (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] font-medium transition-all duration-150 mb-0.5",
        indent && "ml-5",
        isActive(href)
          ? "bg-brand-500/15 text-brand-400"
          : "text-text-muted hover:bg-surface-2 hover:text-text-main"
      )}
    >
      <span
        className={cn(
          "material-symbols-outlined text-[16px]",
          isActive(href) ? "text-brand-400" : "text-text-subtle"
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      <aside className="flex w-[232px] flex-col border-r border-border bg-surface min-h-full">
        {/* Logo */}
        <div className="px-[22px] py-5 flex items-center gap-2.5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 text-white">
              <span className="text-[14px] font-bold">9R</span>
            </div>
            <div>
              <span className="text-[15px] font-semibold text-text-main tracking-[-0.01em]">{APP_CONFIG.name}</span>
              <div className="text-[11px] text-text-subtle">v{APP_CONFIG.version}</div>
            </div>
          </Link>
        </div>

        {/* Update banner */}
        {updateInfo && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-md bg-surface-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted">
                v{updateInfo.latestVersion} available
              </span>
              <button
                onClick={() => setShowUpdateModal(true)}
                className="text-[11px] font-medium text-brand-500 hover:text-brand-400 transition-colors cursor-pointer"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          {/* System section */}
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-text-subtle uppercase tracking-[0.08em]">
              System
            </p>

            {/* Media Providers accordion */}
            <button
              onClick={() => setMediaOpen((v) => !v)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] font-medium transition-all duration-150 mb-0.5",
                pathname.startsWith("/dashboard/media-providers")
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-text-muted hover:bg-surface-2 hover:text-text-main"
              )}
            >
              <span className="material-symbols-outlined text-[16px] text-text-subtle">perm_media</span>
              <span className="flex-1 text-left">Media Providers</span>
              <span
                className="material-symbols-outlined text-[14px] text-text-subtle transition-transform duration-150"
                style={{ transform: mediaOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                expand_more
              </span>
            </button>
            {mediaOpen && (
              <div className="space-y-0.5">
                {MEDIA_PROVIDER_KINDS.filter((k) => VISIBLE_MEDIA_KINDS.includes(k.id)).map((kind) => (
                  <NavLink
                    key={kind.id}
                    href={`/dashboard/media-providers/${kind.id}`}
                    icon={kind.icon}
                    label={kind.label}
                    indent
                  />
                ))}
                <NavLink
                  href={COMBINED_WEB_ITEM.href}
                  icon={COMBINED_WEB_ITEM.icon}
                  label={COMBINED_WEB_ITEM.label}
                  indent
                />
              </div>
            )}

            {systemItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}

            {debugItems.map((item) => {
              const show = item.href !== "/dashboard/translator" || enableTranslator;
              return show ? <NavLink key={item.href} {...item} /> : null;
            })}

            <NavLink href="/dashboard/profile" icon="settings" label="Settings" />
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <button
            onClick={() => setShowShutdownModal(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-text-muted hover:text-red-500 hover:bg-red-500/5 border border-border transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
            Shutdown
          </button>
        </div>
      </aside>

      {/* Shutdown Modal */}
      <ConfirmModal
        isOpen={showShutdownModal}
        onClose={() => setShowShutdownModal(false)}
        onConfirm={handleShutdown}
        title="Close Proxy"
        message="Are you sure you want to close the proxy server?"
        confirmText="Close"
        cancelText="Cancel"
        variant="danger"
        loading={isShuttingDown}
      />

      {/* Update Modal */}
      <ConfirmModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleUpdate}
        title="Update 9Router"
        message={`Show install command for v${updateInfo?.latestVersion || ""}? You can copy it and shutdown to install manually.`}
        confirmText="Show Command"
        cancelText="Cancel"
        variant="primary"
      />

      {/* Disconnected / Updating Overlay */}
      {(isDisconnected || isUpdating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          {isUpdating ? (
            <ManualUpdatePanel
              latestVersion={updateInfo?.latestVersion}
              installCmd={INSTALL_CMD}
              copied={copied}
              onCopyAndShutdown={handleCopyAndShutdown}
              onCancel={handleCancelUpdate}
              countdown={shutdownCountdown}
              isDisconnected={isDisconnected}
            />
          ) : (
            <div className="text-center p-8 bg-surface rounded-lg border border-border max-w-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 text-red-500 mx-auto mb-3">
                <span className="material-symbols-outlined text-[24px]">power_off</span>
              </div>
              <h2 className="text-base font-medium text-text-main mb-1">Server Disconnected</h2>
              <p className="text-sm text-text-muted mb-4">The proxy server has been stopped.</p>
              <Button variant="secondary" onClick={() => globalThis.location.reload()}>
                Reload Page
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

Sidebar.propTypes = {
  onClose: PropTypes.func,
};

function ManualUpdatePanel({ latestVersion, installCmd, copied, onCopyAndShutdown, onCancel, countdown, isDisconnected }) {
  const isCountingDown = countdown > 0;
  return (
    <div className="w-full max-w-md rounded-lg bg-surface border border-border p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center size-9 rounded-md bg-brand-500/10 text-brand-500">
          <span className="material-symbols-outlined text-[20px]">system_update</span>
        </div>
        <div>
          <h2 className="text-sm font-medium text-text-main">
            Update 9Router{latestVersion ? ` to v${latestVersion}` : ""}
          </h2>
          <p className="text-xs text-text-muted">
            {isDisconnected
              ? "Server stopped. Paste the command into a terminal."
              : isCountingDown
                ? `Command copied. Server stopping in ${countdown}s...`
                : "Copy the install command and shutdown."}
          </p>
        </div>
      </div>

      <div className="px-3 py-2 rounded-md bg-surface-2 border border-border mb-3">
        <code className="text-xs font-mono text-text-main break-all">{installCmd}</code>
      </div>

      <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside mb-4">
        <li>Click <strong>Copy & Shutdown</strong> below.</li>
        <li>Paste the command into your terminal.</li>
        <li>Run <code className="px-1 rounded bg-surface-2 text-brand-500">9router</code> again after install.</li>
      </ol>

      {isDisconnected ? (
        <Button variant="secondary" fullWidth onClick={() => globalThis.location.reload()}>
          Reload Page
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isCountingDown}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={onCopyAndShutdown} disabled={isCountingDown}>
            {copied ? "Copied — shutting down..." : isCountingDown ? `Stopping in ${countdown}s` : "Copy & Shutdown"}
          </Button>
        </div>
      )}
    </div>
  );
}

ManualUpdatePanel.propTypes = {
  latestVersion: PropTypes.string,
  installCmd: PropTypes.string.isRequired,
  copied: PropTypes.bool,
  onCopyAndShutdown: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  countdown: PropTypes.number,
  isDisconnected: PropTypes.bool,
};
