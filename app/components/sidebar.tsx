"use client";

import { useState } from "react";

const NAV_ITEMS = [
  { label: "Profile" },
  { label: "Dashboard" },
  { label: "Saved Jobs" },
  { label: "Skill Gap" },
];

const ACTION_ITEMS = [
  { label: "Logout" },
];

export default function Sidebar({
  active,
  onNavigate,
  crawlerStatus = "idle",
}: {
  active: string;
  onNavigate: (label: string) => void;
  crawlerStatus?: "idle" | "crawling" | "ready" | "error";
}) {
  const [collapsed, setCollapsed] = useState(false);

  const statusUi: Record<typeof crawlerStatus, { label: string; dotClass: string }> = {
    idle: { label: "Crawler idle", dotClass: "bg-zinc-400" },
    crawling: { label: "Crawling the Web...", dotClass: "bg-amber-400 animate-pulse" },
    ready: { label: "Crawl complete!", dotClass: "bg-emerald-400" },
    error: { label: "Crawler error!", dotClass: "bg-rose-400" },
  };

  return (
    <aside
      className={`relative flex flex-col overflow-hidden border-r border-white/[0.07] bg-[#0d0d0f] transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-[220px]"
      }`}
    >
      {/* Logo row */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.07] px-4">
        {!collapsed && (
          <span
            className="whitespace-nowrap text-lg font-bold text-white"
            style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "-0.01em" }}
          >
            Traba<span className="text-[#e8ff47]">Hound</span>
          </span>
        )}

        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="ml-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.label;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.label)}
              title={collapsed ? item.label : undefined}
              className={`group flex h-9 items-center gap-3 rounded-md px-3 transition-colors duration-150
                ${isActive
                  ? "bg-[#e8ff47]/10 text-[#e8ff47]"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                }`}
            >
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors
                  ${isActive ? "bg-[#e8ff47]" : "bg-white/20 group-hover:bg-white/40"}`}
              />
              {!collapsed && <span className="truncate text-sm whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        {ACTION_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.label)}
            title={collapsed ? item.label : undefined}
            className="group flex h-9 w-full items-center gap-3 rounded-md px-3 text-rose-300/90 transition-colors duration-150 hover:bg-rose-300/10 hover:text-rose-200"
          >
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-300/80" />
            {!collapsed && <span className="truncate text-sm whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Crawler status */}
      <div className="border-t border-white/[0.07] p-4">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className={`h-1.5 w-1.5 rounded-full ${statusUi[crawlerStatus].dotClass}`} />
            <span>{statusUi[crawlerStatus].label}</span>
          </div>
        )}
      </div>
    </aside>
  );
}