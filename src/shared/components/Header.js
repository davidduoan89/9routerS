"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import PropTypes from "prop-types";

import HeaderMenu from "@/shared/components/HeaderMenu";
import ThemeToggle from "@/shared/components/ThemeToggle";
import DonateModal from "@/shared/components/DonateModal";
import { useHeaderSearchStore } from "@/store/headerSearchStore";
import { OAUTH_PROVIDERS, APIKEY_PROVIDERS } from "@/shared/constants/config";
import { MEDIA_PROVIDER_KINDS, AI_PROVIDERS } from "@/shared/constants/providers";
import { translate } from "@/i18n/runtime";
import { apiFetch } from "@/shared/utils/apiBase";

const getPageInfo = (pathname) => {
  if (!pathname) return { title: "", description: "", breadcrumbs: [] };

  const mediaDetailMatch = pathname.match(/\/media-providers\/([^/]+)\/([^/]+)$/);
  if (mediaDetailMatch) {
    const kindId = mediaDetailMatch[1];
    const providerId = mediaDetailMatch[2];
    const kindConfig = MEDIA_PROVIDER_KINDS.find((k) => k.id === kindId);
    const provider = AI_PROVIDERS[providerId];
    return {
      title: provider?.name || providerId,
      description: "",
      breadcrumbs: [
        { label: "Media Providers", href: `/dashboard/media-providers/${kindId}` },
        { label: kindConfig?.label || kindId, href: `/dashboard/media-providers/${kindId}` },
        { label: provider?.name || providerId, image: `/providers/${providerId}.png` },
      ],
    };
  }

  const mediaKindMatch = pathname.match(/\/media-providers\/([^/]+)$/);
  if (mediaKindMatch) {
    const kindId = mediaKindMatch[1];
    const kindConfig = MEDIA_PROVIDER_KINDS.find((k) => k.id === kindId);
    return {
      title: kindConfig?.label || kindId,
      description: `Manage your ${kindConfig?.label || kindId} providers`,
      icon: kindConfig?.icon || "perm_media",
      breadcrumbs: [],
    };
  }

  const providerMatch = pathname.match(/\/providers\/([^/]+)$/);
  if (providerMatch) {
    const providerId = providerMatch[1];
    const providerInfo =
      OAUTH_PROVIDERS[providerId] || APIKEY_PROVIDERS[providerId];
    if (providerInfo) {
      return {
        title: providerInfo.name,
        description: "",
        breadcrumbs: [
          { label: "Providers", href: "/dashboard/providers" },
          {
            label: providerInfo.name,
            image: `/providers/${providerInfo.id}.png`,
          },
        ],
      };
    }
  }

  if (pathname.includes("/providers") && !pathname.includes("/media-providers"))
    return { title: "Providers", description: "Manage your AI provider connections", icon: "dns", breadcrumbs: [] };
  if (pathname.includes("/combos"))
    return { title: "Combos", description: "Model combos with fallback", icon: "layers", breadcrumbs: [] };
  if (pathname.includes("/usage"))
    return { title: "Usage", description: "Monitor API usage and token consumption", icon: "bar_chart", breadcrumbs: [] };
  if (pathname.includes("/auth-files"))
    return { title: "Auth Files", description: "Provider credentials in the local database", icon: "vpn_key", breadcrumbs: [] };
  if (pathname.includes("/quota"))
    return { title: "Quota Tracker", description: "Track API quota limits", icon: "data_usage", breadcrumbs: [] };
  if (pathname.includes("/mitm"))
    return { title: "MITM Proxy", description: "Intercept CLI tool traffic", icon: "security", breadcrumbs: [] };
  if (pathname.includes("/cli-tools"))
    return { title: "CLI Tools", description: "Configure CLI tools", icon: "terminal", breadcrumbs: [] };
  if (pathname.includes("/proxy-pools"))
    return { title: "Proxy Pools", description: "Manage proxy pool configurations", icon: "lan", breadcrumbs: [] };
  if (pathname.includes("/skills"))
    return { title: "Agent Skills", description: "Share a link with your AI to use 9Router", icon: "extension", breadcrumbs: [] };
  if (pathname.includes("/endpoint"))
    return { title: "Endpoint", description: "API endpoint configuration", icon: "api", breadcrumbs: [] };
  if (pathname.includes("/profile"))
    return { title: "Settings", description: "Manage preferences", icon: "settings", breadcrumbs: [] };
  if (pathname.includes("/translator"))
    return { title: "Translator", description: "Debug translation flow", icon: "translate", breadcrumbs: [] };
  if (pathname.includes("/console-log"))
    return { title: "Console Log", description: "Live server output", icon: "monitor", breadcrumbs: [] };
  if (pathname === "/dashboard")
    return { title: "Endpoint", description: "API endpoint configuration", icon: "api", breadcrumbs: [] };
  return { title: "", description: "", breadcrumbs: [] };
};

export default function Header({ onMenuClick, showMenuButton = true }) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [loginMethod, setLoginMethod] = useState("");
  const [donateOpen, setDonateOpen] = useState(false);

  const pageInfo = useMemo(() => getPageInfo(pathname), [pathname]);
  const { title, description, icon, breadcrumbs } = pageInfo;

  useEffect(() => {
    let cancelled = false;

    async function loadAuthStatus() {
      try {
        const res = await apiFetch("/api/auth/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setDisplayName(data?.displayName || data?.oidcName || data?.oidcEmail || "");
          setLoginMethod(data?.loginMethod || "");
        }
      } catch {
        if (!cancelled) {
          setDisplayName("");
          setLoginMethod("");
        }
      }
    }

    loadAuthStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await apiFetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  return (
    <header className="shrink-0 flex items-center justify-between gap-3 h-14 px-4 lg:px-9 border-b border-border bg-bg z-20">
      {/* Mobile menu */}
      <div className="flex items-center gap-2 lg:hidden shrink-0">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-1 text-text-muted hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        )}
      </div>

      {/* Page title / breadcrumbs */}
      <div className="flex flex-col min-w-0 flex-1">
        {breadcrumbs.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {breadcrumbs.map((crumb, index) => (
              <div
                key={`${crumb.label}-${crumb.href || "current"}`}
                className="flex items-center gap-1.5"
              >
                {index > 0 && (
                  <span className="material-symbols-outlined text-text-subtle text-[14px]">
                    chevron_right
                  </span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-sm text-text-muted hover:text-text-main transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-medium text-text-main truncate">
                      {translate(crumb.label)}
                    </h1>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : title ? (
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-main tracking-[-0.01em] truncate">
              {translate(title)}
            </h1>
            {description && (
              <span className="hidden lg:inline text-[13px] text-text-muted">
                {translate(description)}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {displayName && loginMethod === "OIDC" && (
          <div className="hidden sm:flex items-center max-w-[180px] px-2.5 py-1 rounded-md border border-border text-xs text-text-muted truncate">
            <span className="material-symbols-outlined text-[13px] mr-1 text-text-subtle">person</span>
            <span className="truncate">{displayName}</span>
          </div>
        )}
        <HeaderSearch />
        <button
          onClick={() => setDonateOpen(true)}
          className="flex items-center gap-1 px-2.5 h-7 rounded-md border border-pink-500/20 text-pink-500 hover:bg-pink-500/5 transition-colors text-xs font-medium"
          aria-label="Donate"
        >
          <span className="material-symbols-outlined text-[15px]">volunteer_activism</span>
          <span className="hidden sm:inline">Donate</span>
        </button>
        <ThemeToggle />
        <HeaderMenu onLogout={handleLogout} />
      </div>
      <DonateModal isOpen={donateOpen} onClose={() => setDonateOpen(false)} />
    </header>
  );
}

function HeaderSearch() {
  const visible = useHeaderSearchStore((s) => s.visible);
  const query = useHeaderSearchStore((s) => s.query);
  const placeholder = useHeaderSearchStore((s) => s.placeholder);
  const setQuery = useHeaderSearchStore((s) => s.setQuery);

  if (!visible) return null;

  return (
    <div className="relative w-[140px] sm:w-[200px]">
      <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-text-subtle text-[15px] pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full h-7 pl-7 pr-7 rounded-[6px] border border-border bg-bg-alt text-xs focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all duration-150"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-main p-0.5 rounded"
          aria-label="Clear search"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      )}
    </div>
  );
}

Header.propTypes = {
  onMenuClick: PropTypes.func,
  showMenuButton: PropTypes.bool,
};
