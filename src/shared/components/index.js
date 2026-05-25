"use client";

import dynamic from "next/dynamic";

// Core components — always loaded (small, used everywhere)
export { default as Button } from "./Button";
export { default as Input } from "./Input";
export { default as Select } from "./Select";
export { default as Card } from "./Card";
export { default as Modal, ConfirmModal } from "./Modal";
export { default as Loading, Spinner, PageLoading, Skeleton, CardSkeleton } from "./Loading";
export { default as Avatar } from "./Avatar";
export { default as Badge } from "./Badge";
export { default as Toggle } from "./Toggle";
export { default as ThemeToggle } from "./ThemeToggle";
export { ThemeProvider } from "./ThemeProvider";
export { default as Sidebar } from "./Sidebar";
export { default as Header } from "./Header";
export { default as Footer } from "./Footer";
export { default as SegmentedControl } from "./SegmentedControl";
export { default as Tooltip } from "./Tooltip";
export { default as NineRemoteButton } from "./NineRemoteButton";
export { default as HeaderMenu } from "./HeaderMenu";
export { default as NoAuthProxyCard } from "./NoAuthProxyCard";
export { default as ProviderInfoCard } from "./ProviderInfoCard";

// Heavy modals — lazy loaded (only rendered when opened)
export const OAuthModal = dynamic(() => import("./OAuthModal"), { ssr: false });
export const ModelSelectModal = dynamic(() => import("./ModelSelectModal"), { ssr: false });
export const ManualConfigModal = dynamic(() => import("./ManualConfigModal"), { ssr: false });
export const ComboFormModal = dynamic(() => import("./ComboFormModal"), { ssr: false });
export const McpMarketplaceModal = dynamic(() => import("./McpMarketplaceModal"), { ssr: false });
export const ChangelogModal = dynamic(() => import("./ChangelogModal"), { ssr: false });
export const KiroAuthModal = dynamic(() => import("./KiroAuthModal"), { ssr: false });
export const KiroOAuthWrapper = dynamic(() => import("./KiroOAuthWrapper"), { ssr: false });
export const KiroSocialOAuthModal = dynamic(() => import("./KiroSocialOAuthModal"), { ssr: false });
export const CursorAuthModal = dynamic(() => import("./CursorAuthModal"), { ssr: false });
export const IFlowCookieModal = dynamic(() => import("./IFlowCookieModal"), { ssr: false });
export const GitLabAuthModal = dynamic(() => import("./GitLabAuthModal"), { ssr: false });
export const EditConnectionModal = dynamic(() => import("./EditConnectionModal"), { ssr: false });
export const AddCustomEmbeddingModal = dynamic(() => import("./AddCustomEmbeddingModal"), { ssr: false });
export const LanguageSwitcher = dynamic(() => import("./LanguageSwitcher"), { ssr: false });

// Heavy data components — lazy loaded
export const UsageStats = dynamic(() => import("./UsageStats"), { ssr: false });
export const RequestLogger = dynamic(() => import("./RequestLogger"), { ssr: false });

// Layouts
export * from "./layouts";


