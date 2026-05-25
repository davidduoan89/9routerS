"use client";

import { useState, useEffect, useMemo, memo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardSkeleton,
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Toggle,
} from "@/shared/components";

import { OAUTH_PROVIDERS, APIKEY_PROVIDERS } from "@/shared/constants/config";
import {
  FREE_PROVIDERS,
  FREE_TIER_PROVIDERS,
  WEB_COOKIE_PROVIDERS,
  OPENAI_COMPATIBLE_PREFIX,
  ANTHROPIC_COMPATIBLE_PREFIX,
} from "@/shared/constants/providers";
import Link from "next/link";
import { getErrorCode, getRelativeTime } from "@/shared/utils";
import { useNotificationStore } from "@/store/notificationStore";
import { useHeaderSearchStore } from "@/store/headerSearchStore";
import ModelAvailabilityBadge from "./components/ModelAvailabilityBadge";
import { apiFetch } from "@/shared/utils/apiBase";

function getStatusDisplay(connected, error, errorCode) {
  const parts = [];
  if (connected > 0) {
    parts.push(
      <Badge key="connected" variant="success" size="sm" dot>
        {connected} Connected
      </Badge>,
    );
  }
  if (error > 0) {
    const errText = errorCode
      ? `${error} Error (${errorCode})`
      : `${error} Error`;
    parts.push(
      <Badge key="error" variant="error" size="sm" dot>
        {errText}
      </Badge>,
    );
  }
  if (parts.length === 0) {
    return <span className="text-text-muted">No connections</span>;
  }
  return parts;
}

function getConnectionErrorTag(connection) {
  if (!connection) return null;

  const explicitType = connection.lastErrorType;
  if (explicitType === "runtime_error") return "RUNTIME";
  if (
    explicitType === "upstream_auth_error" ||
    explicitType === "auth_missing" ||
    explicitType === "token_refresh_failed" ||
    explicitType === "token_expired"
  )
    return "AUTH";
  if (explicitType === "upstream_rate_limited") return "429";
  if (explicitType === "upstream_unavailable") return "5XX";
  if (explicitType === "network_error") return "NET";

  const numericCode = Number(connection.errorCode);
  if (Number.isFinite(numericCode) && numericCode >= 400)
    return String(numericCode);

  const fromMessage = getErrorCode(connection.lastError);
  if (fromMessage === "401" || fromMessage === "403") return "AUTH";
  if (fromMessage && fromMessage !== "ERR") return fromMessage;

  const msg = (connection.lastError || "").toLowerCase();
  if (
    msg.includes("runtime") ||
    msg.includes("not runnable") ||
    msg.includes("not installed")
  )
    return "RUNTIME";
  if (
    msg.includes("invalid api key") ||
    msg.includes("token invalid") ||
    msg.includes("revoked") ||
    msg.includes("unauthorized")
  )
    return "AUTH";

  return "ERR";
}



export default function ProvidersPage() {
  const [connections, setConnections] = useState([]);
  const [providerNodes, setProviderNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showAddCompatibleModal, setShowAddCompatibleModal] = useState(false);
  const [showAddAnthropicCompatibleModal, setShowAddAnthropicCompatibleModal] =
    useState(false);
  const [testingMode, setTestingMode] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const notify = useNotificationStore();
  const searchQuery = useHeaderSearchStore((s) => s.query);
  const registerSearch = useHeaderSearchStore((s) => s.register);
  const unregisterSearch = useHeaderSearchStore((s) => s.unregister);

  useEffect(() => {
    registerSearch("Search providers...");
    return () => unregisterSearch();
  }, [registerSearch, unregisterSearch]);

  const matchSearch = (name) =>
    !searchQuery.trim() ||
    name.toLowerCase().includes(searchQuery.trim().toLowerCase());

  const sortByPriority = (entries, authType) =>
    [...entries].sort(([ka, a], [kb, b]) => {
      const sa = getProviderStats(ka, authType);
      const sb = getProviderStats(kb, authType);
      const ca = sa.connected > 0 ? 1 : 0;
      const cb = sb.connected > 0 ? 1 : 0;
      if (ca !== cb) return cb - ca;
      return (a.name || "").localeCompare(b.name || "");
    });

  const sortItemsByPriority = (items, authType) =>
    [...items].sort((a, b) => {
      const sa = getProviderStats(a.id, authType);
      const sb = getProviderStats(b.id, authType);
      const ca = sa.connected > 0 ? 1 : 0;
      const cb = sb.connected > 0 ? 1 : 0;
      if (ca !== cb) return cb - ca;
      return (a.name || "").localeCompare(b.name || "");
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connectionsRes, nodesRes] = await Promise.all([
          apiFetch("/api/providers"),
          apiFetch("/api/provider-nodes"),
        ]);
        const connectionsData = await connectionsRes.json();
        const nodesData = await nodesRes.json();
        if (connectionsRes.ok)
          setConnections(connectionsData.connections || []);
        if (nodesRes.ok) setProviderNodes(nodesData.nodes || []);
      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getProviderStats = (providerId, authType) => {
    const providerConnections = connections.filter(
      (c) => c.provider === providerId && c.authType === authType,
    );

    const getEffectiveStatus = (conn) => {
      const isCooldown = Object.entries(conn).some(
        ([k, v]) =>
          k.startsWith("modelLock_") && v && new Date(v).getTime() > Date.now(),
      );
      return conn.testStatus === "unavailable" && !isCooldown
        ? "active"
        : conn.testStatus;
    };

    const connected = providerConnections.filter((c) => {
      const status = getEffectiveStatus(c);
      return status === "active" || status === "success";
    }).length;

    const errorConns = providerConnections.filter((c) => {
      const status = getEffectiveStatus(c);
      return (
        status === "error" || status === "expired" || status === "unavailable"
      );
    });

    const error = errorConns.length;
    const total = providerConnections.length;
    const allDisabled =
      total > 0 && providerConnections.every((c) => c.isActive === false);

    const latestError = errorConns.sort(
      (a, b) => new Date(b.lastErrorAt || 0) - new Date(a.lastErrorAt || 0),
    )[0];
    const errorCode = latestError ? getConnectionErrorTag(latestError) : null;
    const errorTime = latestError?.lastErrorAt
      ? getRelativeTime(latestError.lastErrorAt)
      : null;

    return { connected, error, total, errorCode, errorTime, allDisabled };
  };

  // Toggle all connections for a provider on/off
  const handleToggleProvider = async (providerId, authType, newActive) => {
    const providerConns = connections.filter(
      (c) => c.provider === providerId && c.authType === authType,
    );
    setConnections((prev) =>
      prev.map((c) =>
        c.provider === providerId && c.authType === authType
          ? { ...c, isActive: newActive }
          : c,
      ),
    );
    await Promise.allSettled(
      providerConns.map((c) =>
        apiFetch(`/api/providers/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newActive }),
        }),
      ),
    );
  };

  const handleBatchTest = async (mode, providerId = null) => {
    if (testingMode) return;
    setTestingMode(mode === "provider" ? providerId : mode);
    setTestResults(null);
    try {
      const res = await apiFetch("/api/providers/test-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, providerId }),
      });
      const data = await res.json();
      setTestResults(data);
      if (data.summary) {
        const { passed, failed, total } = data.summary;
        if (failed === 0) notify.success(`All ${total} tests passed`);
        else notify.warning(`${passed}/${total} passed, ${failed} failed`);
      }
    } catch (error) {
      setTestResults({ error: "Test request failed" });
      notify.error("Provider test failed");
    } finally {
      setTestingMode(null);
    }
  };

  const toggleSection = useCallback((key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const compatibleProviders = providerNodes
    .filter((node) => node.type === "openai-compatible")
    .map((node) => ({
      id: node.id,
      name: node.name || "OpenAI Compatible",
      color: "#10A37F",
      textIcon: "OC",
      apiType: node.apiType,
    }))
    .filter((p) => matchSearch(p.name));

  const anthropicCompatibleProviders = providerNodes
    .filter((node) => node.type === "anthropic-compatible")
    .map((node) => ({
      id: node.id,
      name: node.name || "Anthropic Compatible",
      color: "#D97757",
      textIcon: "AC",
    }))
    .filter((p) => matchSearch(p.name));

  const oauthEntries = sortByPriority(
    Object.entries(OAUTH_PROVIDERS).filter(
      ([, info]) => !info.hidden && matchSearch(info.name),
    ),
    "oauth",
  );
  const freeEntries = Object.entries(FREE_PROVIDERS).filter(
    ([, info]) => !info.hidden && matchSearch(info.name),
  );
  const freeTierEntries = Object.entries(FREE_TIER_PROVIDERS).filter(
    ([, info]) => !info.hidden && matchSearch(info.name),
  );
  const apikeyEntries = sortByPriority(
    Object.entries(APIKEY_PROVIDERS).filter(
      ([, info]) =>
        !info.hidden &&
        (info.serviceKinds ?? ["llm"]).includes("llm") &&
        matchSearch(info.name),
    ),
    "apikey",
  );

  // Auto-collapse sections with no active connections (only on initial load)
  const sectionHasConnections = useMemo(() => {
    const check = (entries, authType) => entries.some(([k]) => {
      const s = getProviderStats(k, authType);
      return s.connected > 0 || s.error > 0;
    });
    return {
      oauth: check(oauthEntries, "oauth"),
      free: check(freeEntries, "oauth") || check(freeTierEntries, "apikey"),
      apikey: check(apikeyEntries, "apikey"),
      custom: [...compatibleProviders, ...anthropicCompatibleProviders].some((p) => {
        const s = getProviderStats(p.id, "apikey");
        return s.connected > 0 || s.error > 0;
      }),
    };
  }, [connections, oauthEntries, freeEntries, freeTierEntries, apikeyEntries, compatibleProviders, anthropicCompatibleProviders]);

  const isSectionCollapsed = (key) => {
    if (collapsedSections[key] !== undefined) return collapsedSections[key];
    return !sectionHasConnections[key];
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const hasAnyResult =
    oauthEntries.length > 0 ||
    freeEntries.length > 0 ||
    freeTierEntries.length > 0 ||
    apikeyEntries.length > 0 ||
    compatibleProviders.length > 0 ||
    anthropicCompatibleProviders.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-3 px-1 sm:px-0">
      {!hasAnyResult && (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <span className="material-symbols-outlined text-[32px] text-text-muted mb-2">
            search_off
          </span>
          <p className="text-text-muted text-sm">No providers match your search</p>
        </div>
      )}

      {/* Custom Providers */}
      <CollapsibleSection
        title="Custom Providers"
        count={compatibleProviders.length + anthropicCompatibleProviders.length}
        collapsed={isSectionCollapsed("custom")}
        onToggle={() => toggleSection("custom")}
        actions={
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddAnthropicCompatibleModal(true); }}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Anthropic
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddCompatibleModal(true); }}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              OpenAI
            </button>
          </div>
        }
      >
        {compatibleProviders.length === 0 && anthropicCompatibleProviders.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-3 text-text-muted text-xs">
            <span className="material-symbols-outlined text-[16px]">extension</span>
            No custom providers yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...compatibleProviders, ...anthropicCompatibleProviders].map((info) => (
              <ProviderRow
                key={info.id}
                providerId={info.id}
                name={info.name}
                stats={getProviderStats(info.id, "apikey")}
                onToggle={(active) => handleToggleProvider(info.id, "apikey", active)}
                extra={info.apiType === "responses" ? "Responses" : info.apiType === "chat" ? "Chat" : null}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* OAuth Providers */}
      {oauthEntries.length > 0 && (
        <CollapsibleSection
          title="OAuth Providers"
          count={oauthEntries.length}
          collapsed={isSectionCollapsed("oauth")}
          onToggle={() => toggleSection("oauth")}
          actions={
            <div className="flex items-center gap-2">
              <ModelAvailabilityBadge />
              <TestAllButton mode="oauth" testingMode={testingMode} onClick={() => handleBatchTest("oauth")} />
            </div>
          }
        >
          <div className="divide-y divide-border">
            {oauthEntries.map(([key, info]) => (
              <ProviderRow
                key={key}
                providerId={key}
                name={info.name}
                stats={getProviderStats(key, "oauth")}
                noAuth={!!info.noAuth}
                onToggle={(active) => handleToggleProvider(key, "oauth", active)}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Free Tier Providers */}
      {(freeEntries.length > 0 || freeTierEntries.length > 0) && (
        <CollapsibleSection
          title="Free Tier Providers"
          count={freeEntries.length + freeTierEntries.length}
          collapsed={isSectionCollapsed("free")}
          onToggle={() => toggleSection("free")}
          actions={<TestAllButton mode="free" testingMode={testingMode} onClick={() => handleBatchTest("free")} />}
        >
          <div className="divide-y divide-border">
            {freeEntries.map(([key, info]) => (
              <ProviderRow
                key={key}
                providerId={key}
                name={info.name}
                stats={getProviderStats(key, "oauth")}
                noAuth={!!info.noAuth}
                onToggle={(active) => handleToggleProvider(key, "oauth", active)}
              />
            ))}
            {freeTierEntries.map(([key, info]) => (
              <ProviderRow
                key={key}
                providerId={key}
                name={info.name}
                stats={getProviderStats(key, "apikey")}
                onToggle={(active) => handleToggleProvider(key, "apikey", active)}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* API Key Providers */}
      {apikeyEntries.length > 0 && (
        <CollapsibleSection
          title="API Key Providers"
          count={apikeyEntries.length}
          collapsed={isSectionCollapsed("apikey")}
          onToggle={() => toggleSection("apikey")}
          actions={<TestAllButton mode="apikey" testingMode={testingMode} onClick={() => handleBatchTest("apikey")} />}
        >
          <div className="divide-y divide-border">
            {apikeyEntries.map(([key, info]) => (
              <ProviderRow
                key={key}
                providerId={key}
                name={info.name}
                stats={getProviderStats(key, "apikey")}
                onToggle={(active) => handleToggleProvider(key, "apikey", active)}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      <AddOpenAICompatibleModal
        isOpen={showAddCompatibleModal}
        onClose={() => setShowAddCompatibleModal(false)}
        onCreated={(node) => {
          setProviderNodes((prev) => [...prev, node]);
          setShowAddCompatibleModal(false);
        }}
      />
      <AddAnthropicCompatibleModal
        isOpen={showAddAnthropicCompatibleModal}
        onClose={() => setShowAddAnthropicCompatibleModal(false)}
        onCreated={(node) => {
          setProviderNodes((prev) => [...prev, node]);
          setShowAddAnthropicCompatibleModal(false);
        }}
      />

      {/* Test Results Modal */}
      {testResults && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[6vh] sm:pt-[10vh]"
          onClick={() => setTestResults(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-surface border border-border rounded-lg w-full max-w-[600px] max-h-[86vh] sm:max-h-[80vh] overflow-y-auto shadow-[var(--shadow-elev)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface rounded-t-lg">
              <h3 className="font-semibold">Test Results</h3>
              <button
                onClick={() => setTestResults(null)}
                className="p-1 rounded-lg hover:bg-bg text-text-muted hover:text-text-main transition-colors"
                aria-label="Close test results"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-5">
              <ProviderTestResultsView results={testResults} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Compact table row for each provider ────────────────────── */
const ProviderRow = memo(function ProviderRow({ providerId, name, stats, noAuth, onToggle, extra }) {
  const { connected, error, errorCode, allDisabled, total } = stats;

  const statusEl = allDisabled ? (
    <span className="text-text-subtle text-xs">Disabled</span>
  ) : noAuth ? (
    <span className="text-success text-xs flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-success inline-block" />
      Ready
    </span>
  ) : connected > 0 ? (
    <span className="text-success text-xs flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-success inline-block" />
      {connected} connected
    </span>
  ) : error > 0 ? (
    <span className="text-danger text-xs flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-danger inline-block" />
      {error} error{errorCode ? ` (${errorCode})` : ""}
    </span>
  ) : (
    <span className="text-text-subtle text-xs">—</span>
  );

  return (
    <Link
      href={`/dashboard/providers/${providerId}`}
      className={`group flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors ${allDisabled ? "opacity-40" : ""}`}
    >
      <span className="text-[13px] font-medium text-text-main truncate min-w-[120px] flex-[2]">
        {name}
      </span>
      <span className="flex-[1.5] min-w-[100px]">{statusEl}</span>
      {extra && (
        <span className="text-text-subtle text-[11px] hidden sm:block flex-[0.5]">{extra}</span>
      )}
      <div className="flex shrink-0 items-center gap-2 ml-auto">
        {total > 0 && (
          <div
            className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(!allDisabled); }}
          >
            <Toggle size="sm" checked={!allDisabled} onChange={() => {}} />
          </div>
        )}
        <span className="material-symbols-outlined text-[16px] text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity">
          chevron_right
        </span>
      </div>
    </Link>
  );
});

/* ── Collapsible section wrapper ────────────────────────────── */
function CollapsibleSection({ title, count, collapsed, onToggle, actions, children }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-surface-2 transition-colors cursor-pointer select-none"
      >
        <span className={`material-symbols-outlined text-[16px] text-text-muted transition-transform ${collapsed ? "" : "rotate-90"}`}>
          chevron_right
        </span>
        <span className="text-[13px] font-semibold text-text-main">{title}</span>
        <span className="text-[11px] text-text-subtle font-medium">{count}</span>
        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      </div>
      {!collapsed && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

/* ── Test All inline button ─────────────────────────────────── */
function TestAllButton({ mode, testingMode, onClick }) {
  const active = testingMode === mode;
  return (
    <button
      onClick={onClick}
      disabled={!!testingMode}
      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
        active
          ? "text-primary animate-pulse"
          : "text-text-muted hover:text-text-main"
      }`}
    >
      <span className={`material-symbols-outlined text-[14px]${active ? " animate-spin" : ""}`}>
        play_arrow
      </span>
      {active ? "Testing..." : "Test All"}
    </button>
  );
}

function AddOpenAICompatibleModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    prefix: "",
    apiType: "chat",
    baseUrl: "https://api.openai.com/v1",
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkKey, setCheckKey] = useState("");
  const [checkModelId, setCheckModelId] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const apiTypeOptions = [
    { value: "chat", label: "Chat Completions" },
    { value: "responses", label: "Responses API" },
  ];

  useEffect(() => {
    const defaultBaseUrl = "https://api.openai.com/v1";
    setFormData((prev) => ({ ...prev, baseUrl: defaultBaseUrl }));
  }, [formData.apiType]);

  const handleSubmit = async () => {
    if (
      !formData.name.trim() ||
      !formData.prefix.trim() ||
      !formData.baseUrl.trim()
    )
      return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/provider-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          prefix: formData.prefix,
          apiType: formData.apiType,
          baseUrl: formData.baseUrl,
          type: "openai-compatible",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated(data.node);
        setFormData({
          name: "",
          prefix: "",
          apiType: "chat",
          baseUrl: "https://api.openai.com/v1",
        });
        setCheckKey("");
        setValidationResult(null);
      }
    } catch (error) {
      console.log("Error creating OpenAI Compatible node:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await apiFetch("/api/provider-nodes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: formData.baseUrl,
          apiKey: checkKey,
          type: "openai-compatible",
          modelId: checkModelId.trim() || undefined,
        }),
      });
      const data = await res.json();
      setValidationResult(data);
    } catch {
      setValidationResult({ valid: false, error: "Network error" });
    } finally {
      setValidating(false);
    }
  };

  // Helper to render validation result
  const renderValidationResult = () => {
    if (!validationResult) return null;
    const { valid, error, method } = validationResult;

    if (valid) {
      return (
        <>
          <Badge variant="success">Valid</Badge>
          {method === "chat" && (
            <span className="text-sm text-text-muted">
              (via inference test)
            </span>
          )}
        </>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="error">Invalid</Badge>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} title="Add OpenAI Compatible" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="OpenAI Compatible (Prod)"
          hint="Required. A friendly label for this node."
        />
        <Input
          label="Prefix"
          value={formData.prefix}
          onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
          placeholder="oc-prod"
          hint="Required. Used as the provider prefix for model IDs."
        />
        <Select
          label="API Type"
          options={apiTypeOptions}
          value={formData.apiType}
          onChange={(e) =>
            setFormData({ ...formData, apiType: e.target.value })
          }
        />
        <Input
          label="Base URL"
          value={formData.baseUrl}
          onChange={(e) =>
            setFormData({ ...formData, baseUrl: e.target.value })
          }
          placeholder="https://api.openai.com/v1"
          hint="Use the base URL (ending in /v1) for your OpenAI-compatible API."
        />
        <Input
          label="API Key (for Check)"
          type="password"
          value={checkKey}
          onChange={(e) => setCheckKey(e.target.value)}
        />
        <Input
          label="Model ID (optional)"
          value={checkModelId}
          onChange={(e) => setCheckModelId(e.target.value)}
          placeholder="e.g. gpt-4, claude-3-opus"
          hint="If provider lacks /models endpoint, enter a model ID to validate via chat/completions instead."
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={handleValidate}
            disabled={!checkKey || validating || !formData.baseUrl.trim()}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {validating ? "Checking..." : "Check"}
          </Button>
          {renderValidationResult()}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleSubmit}
            fullWidth
            disabled={
              !formData.name.trim() ||
              !formData.prefix.trim() ||
              !formData.baseUrl.trim() ||
              submitting
            }
          >
            {submitting ? "Creating..." : "Create"}
          </Button>
          <Button onClick={onClose} variant="ghost" fullWidth>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

AddOpenAICompatibleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};

function AddAnthropicCompatibleModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    prefix: "",
    baseUrl: "https://api.anthropic.com/v1",
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkKey, setCheckKey] = useState("");
  const [checkModelId, setCheckModelId] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null); // { valid, error, method }

  useEffect(() => {
    if (isOpen) {
      setValidationResult(null);
      setCheckKey("");
      setCheckModelId("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (
      !formData.name.trim() ||
      !formData.prefix.trim() ||
      !formData.baseUrl.trim()
    )
      return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/provider-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          prefix: formData.prefix,
          baseUrl: formData.baseUrl,
          type: "anthropic-compatible",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated(data.node);
        setFormData({
          name: "",
          prefix: "",
          baseUrl: "https://api.anthropic.com/v1",
        });
        setCheckKey("");
        setValidationResult(null);
      }
    } catch (error) {
      console.log("Error creating Anthropic Compatible node:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await apiFetch("/api/provider-nodes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: formData.baseUrl,
          apiKey: checkKey,
          type: "anthropic-compatible",
          modelId: checkModelId.trim() || undefined,
        }),
      });
      const data = await res.json();
      setValidationResult(data);
    } catch {
      setValidationResult({ valid: false, error: "Network error" });
    } finally {
      setValidating(false);
    }
  };

  // Helper to render validation result
  const renderValidationResult = () => {
    if (!validationResult) return null;
    const { valid, error, method } = validationResult;

    if (valid) {
      return (
        <>
          <Badge variant="success">Valid</Badge>
          {method === "chat" && (
            <span className="text-sm text-text-muted">
              (via inference test)
            </span>
          )}
        </>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="error">Invalid</Badge>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} title="Add Anthropic Compatible" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Anthropic Compatible (Prod)"
          hint="Required. A friendly label for this node."
        />
        <Input
          label="Prefix"
          value={formData.prefix}
          onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
          placeholder="ac-prod"
          hint="Required. Used as the provider prefix for model IDs."
        />
        <Input
          label="Base URL"
          value={formData.baseUrl}
          onChange={(e) =>
            setFormData({ ...formData, baseUrl: e.target.value })
          }
          placeholder="https://api.anthropic.com/v1"
          hint="Use the base URL (ending in /v1) for your Anthropic-compatible API. The system will append /messages."
        />
        <Input
          label="API Key (for Check)"
          type="password"
          value={checkKey}
          onChange={(e) => setCheckKey(e.target.value)}
        />
        <Input
          label="Model ID (optional)"
          value={checkModelId}
          onChange={(e) => setCheckModelId(e.target.value)}
          placeholder="e.g. claude-3-opus"
          hint="If provider lacks /models endpoint, enter a model ID to validate via chat/completions instead."
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={handleValidate}
            disabled={!checkKey || validating || !formData.baseUrl.trim()}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {validating ? "Checking..." : "Check"}
          </Button>
          {renderValidationResult()}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleSubmit}
            fullWidth
            disabled={
              !formData.name.trim() ||
              !formData.prefix.trim() ||
              !formData.baseUrl.trim() ||
              submitting
            }
          >
            {submitting ? "Creating..." : "Create"}
          </Button>
          <Button onClick={onClose} variant="ghost" fullWidth>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

AddAnthropicCompatibleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};

function ProviderTestResultsView({ results }) {
  if (results.error && !results.results) {
    return (
      <div className="text-center py-6">
        <span className="material-symbols-outlined text-red-500 text-[32px] mb-2 block">
          error
        </span>
        <p className="text-sm text-red-400">{results.error}</p>
      </div>
    );
  }

  const { summary, mode } = results;
  const items = results.results || [];
  const modeLabel =
    {
      oauth: "OAuth",
      free: "Free",
      apikey: "API Key",
      provider: "Provider",
      all: "All",
    }[mode] || mode;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {summary && (
        <div className="flex flex-wrap items-center gap-2 text-xs mb-1 sm:gap-3">
          <span className="text-text-muted">{modeLabel} Test</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
            {summary.passed} passed
          </span>
          {summary.failed > 0 && (
            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">
              {summary.failed} failed
            </span>
          )}
          <span className="text-text-muted sm:ml-auto">
            {summary.total} tested
          </span>
        </div>
      )}
      {items.map((r, i) => (
        <div
          key={r.connectionId || i}
          className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2 text-xs dark:bg-white/[0.03] sm:flex-nowrap"
        >
          <span
            className={`material-symbols-outlined text-[16px] ${r.valid ? "text-emerald-500" : "text-red-500"}`}
          >
            {r.valid ? "check_circle" : "error"}
          </span>
          <div className="min-w-0 flex-[1_1_160px]">
            <span className="block truncate font-medium sm:inline">
              {r.connectionName}
            </span>
            <span className="block truncate text-text-muted sm:ml-1.5 sm:inline">
              ({r.provider})
            </span>
          </div>
          {r.latencyMs !== undefined && (
            <span className="shrink-0 text-text-muted font-mono tabular-nums">
              {r.latencyMs}ms
            </span>
          )}
          <span
            className={`shrink-0 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              r.valid
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {r.valid ? "OK" : r.diagnosis?.type || "ERROR"}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center py-4 text-text-muted text-sm">
          No active connections found for this group.
        </div>
      )}
    </div>
  );
}

ProviderTestResultsView.propTypes = {
  results: PropTypes.shape({
    mode: PropTypes.string,
    results: PropTypes.array,
    summary: PropTypes.shape({
      total: PropTypes.number,
      passed: PropTypes.number,
      failed: PropTypes.number,
    }),
    error: PropTypes.string,
  }).isRequired,
};
