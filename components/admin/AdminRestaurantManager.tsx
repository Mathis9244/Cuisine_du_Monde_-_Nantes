"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Megaphone,
  Plus,
  Power,
  Save,
  Search,
  Shield,
  X,
} from "lucide-react";
import type { DbRestaurant } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

interface AdminListResponse {
  data: DbRestaurant[];
  meta: { total: number; page: number; limit: number };
}

interface AdminStats {
  total: number;
  active: number;
  inactive: number;
}

const PAGE_SIZE = 50;

const emptyRestaurant = (): Partial<DbRestaurant> => ({
  name: "",
  cuisine: "",
  address: "",
  city: "Nantes",
  rating: null,
  phone: "",
  website: "",
  latitude: null,
  longitude: null,
});

function fieldClassName(extra = "") {
  return `w-full px-3 py-2 bg-circle-bg border border-circle-border rounded-xl text-sm outline-none focus:border-circle-teal transition-colors ${extra}`;
}

const AdminRestaurantManager: React.FC = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "forbidden" | "ready">(
    "loading",
  );
  const [restaurants, setRestaurants] = useState<DbRestaurant[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE });
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<DbRestaurant>>(emptyRestaurant);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [boostingId, setBoostingId] = useState<number | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationOk, setMigrationOk] = useState<string | null>(null);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteOk, setPromoteOk] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/restaurants/stats");
    if (res.ok) {
      setStats((await res.json()) as AdminStats);
    }
  }, []);

  const load = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    const params = new URLSearchParams();
    if (includeInactive) params.set("includeInactive", "true");
    if (search) params.set("search", search);
    if (cuisineFilter) params.set("cuisine", cuisineFilter);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    const res = await fetch(`/api/admin/restaurants?${params.toString()}`);
    if (res.status === 401 || res.status === 403) {
      setStatus("forbidden");
      setLoadingList(false);
      return;
    }
    if (!res.ok) {
      setError(`${t("admin.error.load")} (${res.status})`);
      setLoadingList(false);
      return;
    }

    const json = (await res.json()) as AdminListResponse;
    setRestaurants(json.data);
    setMeta(json.meta);
    setStatus("ready");
    setLoadingList(false);
  }, [cuisineFilter, includeInactive, page, search, t]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  const cuisineOptions = useMemo(() => {
    const fromList = restaurants
      .map((r) => r.cuisine)
      .filter((c): c is string => Boolean(c));
    const current = cuisineFilter ? [cuisineFilter] : [];
    return Array.from(new Set([...current, ...fromList])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [cuisineFilter, restaurants]);

  const totalPages = Math.max(1, Math.ceil(meta.total / PAGE_SIZE));

  const flashSuccess = (message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 3200);
  };

  const updateField = (
    id: number,
    field: keyof DbRestaurant,
    value: string,
  ) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "rating") {
          return {
            ...r,
            rating: value === "" ? null : Number(value),
          };
        }
        if (field === "latitude" || field === "longitude") {
          return {
            ...r,
            [field]: value === "" ? null : Number(value),
          };
        }
        return { ...r, [field]: value };
      }),
    );
  };

  const updateDraft = (field: keyof DbRestaurant, value: string) => {
    setDraft((prev) => {
      if (field === "rating" || field === "latitude" || field === "longitude") {
        return {
          ...prev,
          [field]: value === "" ? null : Number(value),
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const save = async (r: DbRestaurant) => {
    setSavingId(r.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurants/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: r.name,
          rating: r.rating,
          cuisine: r.cuisine,
          address: r.address,
          city: r.city,
          latitude: r.latitude,
          longitude: r.longitude,
          website: r.website,
          phone: r.phone,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      flashSuccess(t("admin.saved"));
      void loadStats();
    } catch (e) {
      setError(
        e instanceof Error
          ? `${t("admin.error.save")}: ${e.message}`
          : t("admin.error.save"),
      );
    } finally {
      setSavingId(null);
    }
  };

  const createRestaurant = async () => {
    if (!draft.name?.trim()) {
      setError(t("admin.error.nameRequired"));
      return;
    }
    setSavingId("new");
    setError(null);
    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          rating: draft.rating,
          cuisine: draft.cuisine || null,
          address: draft.address || null,
          city: draft.city || "Nantes",
          latitude: draft.latitude,
          longitude: draft.longitude,
          website: draft.website || null,
          phone: draft.phone || null,
          source: "manual",
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
      setDraft(emptyRestaurant());
      setCreateOpen(false);
      setPage(1);
      flashSuccess(t("admin.created"));
      void load();
      void loadStats();
    } catch (e) {
      setError(
        e instanceof Error
          ? `${t("admin.error.create")}: ${e.message}`
          : t("admin.error.create"),
      );
    } finally {
      setSavingId(null);
    }
  };

  const setBoost = async (
    r: DbRestaurant,
    opts: { days?: number; tier?: number; active?: boolean },
  ) => {
    setBoostingId(r.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurants/${r.id}/boost`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const updated = (await res.json()) as DbRestaurant;
      setRestaurants((prev) =>
        prev.map((item) => (item.id === r.id ? updated : item)),
      );
      flashSuccess(
        opts.active === false ? t("admin.boost.removed") : t("admin.boost.added"),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? `${t("admin.boost.error")}: ${e.message}`
          : t("admin.boost.error"),
      );
    } finally {
      setBoostingId(null);
    }
  };

  const runBoostMigration = async () => {
    setMigrating(true);
    setError(null);
    setMigrationOk(null);
    try {
      const res = await fetch("/api/admin/migrate/boost", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        columns?: string[];
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        const detail = [json.error, json.hint].filter(Boolean).join(" — ");
        throw new Error(detail || `Erreur ${res.status}`);
      }
      setMigrationOk(
        t("admin.migrate.ok", {
          columns: (json.columns ?? []).join(", "),
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? `${t("admin.migrate.error")}: ${e.message}`
          : t("admin.migrate.error"),
      );
    } finally {
      setMigrating(false);
    }
  };

  const isBoostLive = (r: DbRestaurant) =>
    Boolean(r.boost_until && new Date(r.boost_until).getTime() > Date.now());

  const promoteAdmin = async () => {
    const email = promoteEmail.trim();
    if (!email) {
      setError(t("admin.promote.errorEmail"));
      return;
    }
    setPromoting(true);
    setError(null);
    setPromoteOk(null);
    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
      setPromoteOk(json.message ?? t("admin.promote.ok", { email }));
      setPromoteEmail("");
    } catch (e) {
      setError(
        e instanceof Error
          ? `${t("admin.promote.error")}: ${e.message}`
          : t("admin.promote.error"),
      );
    } finally {
      setPromoting(false);
    }
  };

  const toggleActive = async (r: DbRestaurant) => {
    const action = r.is_active ? "deactivate" : "activate";
    const res = await fetch(`/api/admin/restaurants/${r.id}/${action}`, {
      method: "PATCH",
    });
    if (res.ok) {
      flashSuccess(r.is_active ? t("admin.deactivated") : t("admin.activated"));
      void load();
      void loadStats();
    } else {
      setError(`${t("admin.error.toggle")} (${res.status})`);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-circle-text/40 font-black uppercase tracking-[0.4em]">
        <Loader2 className="mr-3 animate-spin" size={20} />
        {t("loading")}
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center bg-circle-bg">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-circle-amber">
          {t("admin.forbidden.title")}
        </h1>
        <p className="text-circle-text/40 max-w-md">{t("admin.forbidden.body")}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-circle-amber text-[#081c1b] rounded-2xl font-black text-xs uppercase tracking-[0.3em]"
        >
          {t("admin.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-circle-bg text-circle-text font-sans">
      <nav className="sticky top-0 z-50 bg-circle-bg/90 backdrop-blur-2xl border-b border-circle-border px-4 md:px-8 h-20 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 bg-circle-text/5 border border-circle-text/10 rounded-xl hover:bg-circle-text/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">{t("admin.back")}</span>
        </Link>
        <span className="font-black uppercase tracking-widest text-circle-amber text-sm md:text-base truncate">
          {t("admin.title")}
        </span>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/restaurants/export/csv"
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-circle-teal text-[#081c1b] rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shrink-0"
        >
          <Download size={16} />
          <span className="hidden sm:inline">CSV</span>
        </a>
      </nav>

      <main className="container mx-auto max-w-7xl py-8 px-4 md:px-8 space-y-8">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t("admin.stats.total"), value: stats.total, tone: "text-circle-text" },
              { label: t("admin.stats.active"), value: stats.active, tone: "text-green-400" },
              { label: t("admin.stats.inactive"), value: stats.inactive, tone: "text-red-300" },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-circle-border bg-circle-card p-5"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-circle-text/40">
                  {card.label}
                </p>
                <p className={`mt-2 text-3xl font-black ${card.tone}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-circle-text/30"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("admin.search")}
                className={`${fieldClassName()} pl-11`}
              />
            </div>
            <select
              value={cuisineFilter}
              onChange={(e) => {
                setCuisineFilter(e.target.value);
                setPage(1);
              }}
              className={`${fieldClassName()} min-w-[160px]`}
            >
              <option value="">{t("admin.filter.allCuisines")}</option>
              {cuisineOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-circle-text/60 whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked);
                  setPage(1);
                }}
                className="accent-circle-amber"
              />
              {t("admin.includeInactive")}
            </label>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-circle-amber px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#081c1b] transition-opacity hover:opacity-90"
          >
            {createOpen ? <X size={16} /> : <Plus size={16} />}
            {createOpen ? t("admin.cancel") : t("admin.new")}
          </button>
        </div>

        {success && (
          <div className="px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-200 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm">
            {error}
          </div>
        )}
        {migrationOk && (
          <div className="px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-200 text-sm">
            {migrationOk}
          </div>
        )}
        {promoteOk && (
          <div className="px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-200 text-sm">
            {promoteOk}
          </div>
        )}

        <div className="rounded-2xl border border-circle-amber/25 bg-circle-card p-4 space-y-3">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-circle-amber">
            <Shield size={14} />
            {t("admin.promote.title")}
          </p>
          <p className="text-sm text-circle-text/60">{t("admin.promote.hint")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              placeholder={t("admin.promote.placeholder")}
              className={`${fieldClassName()} sm:flex-1`}
            />
            <button
              type="button"
              disabled={promoting}
              onClick={() => void promoteAdmin()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-circle-amber px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#081c1b] disabled:opacity-50"
            >
              {promoting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Shield size={14} />
              )}
              {promoting ? t("admin.promote.running") : t("admin.promote.run")}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-circle-border bg-circle-card p-4">
          <p className="text-sm text-circle-text/60 flex-1 min-w-[200px]">
            {t("admin.migrate.hint")}
          </p>
          <button
            type="button"
            disabled={migrating}
            onClick={() => void runBoostMigration()}
            className="rounded-xl bg-circle-teal px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#081c1b] disabled:opacity-50"
          >
            {migrating ? t("admin.migrate.running") : t("admin.migrate.run")}
          </button>
        </div>

        {createOpen && (
          <section className="rounded-3xl border border-circle-amber/30 bg-circle-card p-5 md:p-6 space-y-4">
            <h2 className="text-lg font-black uppercase tracking-tight text-circle-amber">
              {t("admin.newTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                value={draft.name ?? ""}
                onChange={(e) => updateDraft("name", e.target.value)}
                placeholder={`${t("admin.ph.name")} *`}
                className={fieldClassName("font-bold")}
              />
              <input
                value={draft.cuisine ?? ""}
                onChange={(e) => updateDraft("cuisine", e.target.value)}
                placeholder={t("admin.ph.cuisine")}
                className={fieldClassName()}
              />
              <input
                value={draft.city ?? ""}
                onChange={(e) => updateDraft("city", e.target.value)}
                placeholder={t("admin.ph.city")}
                className={fieldClassName()}
              />
              <input
                value={draft.address ?? ""}
                onChange={(e) => updateDraft("address", e.target.value)}
                placeholder={t("admin.ph.address")}
                className={`${fieldClassName()} md:col-span-2`}
              />
              <input
                value={draft.phone ?? ""}
                onChange={(e) => updateDraft("phone", e.target.value)}
                placeholder={t("admin.ph.phone")}
                className={fieldClassName()}
              />
              <input
                value={draft.website ?? ""}
                onChange={(e) => updateDraft("website", e.target.value)}
                placeholder={t("admin.ph.website")}
                className={fieldClassName()}
              />
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={draft.rating ?? ""}
                onChange={(e) => updateDraft("rating", e.target.value)}
                placeholder={t("admin.ph.rating")}
                className={fieldClassName()}
              />
              <input
                type="number"
                step="any"
                value={draft.latitude ?? ""}
                onChange={(e) => updateDraft("latitude", e.target.value)}
                placeholder={t("admin.ph.latitude")}
                className={fieldClassName()}
              />
              <input
                type="number"
                step="any"
                value={draft.longitude ?? ""}
                onChange={(e) => updateDraft("longitude", e.target.value)}
                placeholder={t("admin.ph.longitude")}
                className={fieldClassName()}
              />
            </div>
            <button
              type="button"
              onClick={() => void createRestaurant()}
              disabled={savingId === "new"}
              className="inline-flex items-center gap-2 rounded-2xl bg-circle-teal px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#081c1b] disabled:opacity-50"
            >
              {savingId === "new" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {t("admin.create")}
            </button>
          </section>
        )}

        <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-widest text-circle-text/40">
          <span>
            {t("admin.results", { count: meta.total })}
            {loadingList && (
              <Loader2 size={14} className="inline ml-2 animate-spin" />
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-circle-border disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-circle-border disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-3 px-4 text-[10px] font-black uppercase tracking-[0.28em] text-circle-text/35">
          <span>{t("admin.col.name")}</span>
          <span>{t("admin.col.cuisine")}</span>
          <span>{t("admin.col.address")}</span>
          <span>{t("admin.col.phone")}</span>
          <span className="text-right">{t("admin.col.actions")}</span>
        </div>

        <div className="space-y-3">
          {restaurants.length === 0 && !loadingList ? (
            <p className="text-center py-16 text-circle-text/40 font-bold uppercase tracking-widest text-sm">
              {t("admin.empty")}
            </p>
          ) : (
            restaurants.map((r) => {
              const expanded = expandedId === r.id;
              return (
                <article
                  key={r.id}
                  className={`rounded-2xl border transition-colors ${
                    r.is_active
                      ? "bg-circle-card border-circle-border"
                      : "bg-circle-card/40 border-red-900/40"
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-3 items-center p-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : r.id)
                        }
                        className="p-1.5 rounded-lg border border-circle-border text-circle-text/50 shrink-0"
                        aria-expanded={expanded}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      <input
                        value={r.name ?? ""}
                        onChange={(e) =>
                          updateField(r.id, "name", e.target.value)
                        }
                        className={fieldClassName("font-bold")}
                      />
                    </div>
                    <input
                      value={r.cuisine ?? ""}
                      onChange={(e) =>
                        updateField(r.id, "cuisine", e.target.value)
                      }
                      placeholder={t("admin.ph.cuisine")}
                      className={fieldClassName()}
                    />
                    <input
                      value={r.address ?? ""}
                      onChange={(e) =>
                        updateField(r.id, "address", e.target.value)
                      }
                      placeholder={t("admin.ph.address")}
                      className={fieldClassName()}
                    />
                    <input
                      value={r.phone ?? ""}
                      onChange={(e) =>
                        updateField(r.id, "phone", e.target.value)
                      }
                      placeholder={t("admin.ph.phone")}
                      className={fieldClassName()}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <span
                        className={`hidden sm:inline text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                          r.is_active
                            ? "bg-green-500/15 text-green-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        {r.is_active
                          ? t("admin.status.active")
                          : t("admin.status.inactive")}
                      </span>
                      <button
                        type="button"
                        onClick={() => void save(r)}
                        disabled={savingId === r.id}
                        className="p-2.5 bg-circle-amber text-[#081c1b] rounded-xl disabled:opacity-50"
                        title={t("admin.save")}
                      >
                        {savingId === r.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(r)}
                        className={`p-2.5 rounded-xl ${
                          r.is_active
                            ? "bg-red-500/20 text-red-300"
                            : "bg-green-500/20 text-green-300"
                        }`}
                        title={
                          r.is_active
                            ? t("admin.deactivate")
                            : t("admin.activate")
                        }
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-circle-border/60 px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-circle-text/40">
                          {t("admin.ph.city")}
                        </span>
                        <input
                          value={r.city ?? ""}
                          onChange={(e) =>
                            updateField(r.id, "city", e.target.value)
                          }
                          className={fieldClassName()}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-circle-text/40">
                          {t("admin.ph.rating")}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          step={0.1}
                          value={r.rating ?? ""}
                          onChange={(e) =>
                            updateField(r.id, "rating", e.target.value)
                          }
                          className={fieldClassName()}
                        />
                      </label>
                      <label className="space-y-1.5 sm:col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-circle-text/40">
                          {t("admin.ph.website")}
                        </span>
                        <input
                          value={r.website ?? ""}
                          onChange={(e) =>
                            updateField(r.id, "website", e.target.value)
                          }
                          className={fieldClassName()}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-circle-text/40">
                          {t("admin.ph.latitude")}
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={r.latitude ?? ""}
                          onChange={(e) =>
                            updateField(r.id, "latitude", e.target.value)
                          }
                          className={fieldClassName()}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-circle-text/40">
                          {t("admin.ph.longitude")}
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={r.longitude ?? ""}
                          onChange={(e) =>
                            updateField(r.id, "longitude", e.target.value)
                          }
                          className={fieldClassName()}
                        />
                      </label>
                      <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-circle-teal/25 bg-circle-teal/5 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-circle-teal">
                            <Megaphone size={14} />
                            {t("admin.boost.title")}
                          </p>
                          {isBoostLive(r) && (
                            <span className="text-[10px] font-bold text-circle-teal/80">
                              {t("admin.boost.until", {
                                date: new Date(
                                  r.boost_until as string,
                                ).toLocaleDateString(),
                              })}
                              {" · "}
                              {t("admin.boost.tier", { tier: r.boost_tier ?? 1 })}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={boostingId === r.id}
                            onClick={() => void setBoost(r, { days: 30, tier: 1 })}
                            className="rounded-xl border border-circle-teal/40 bg-circle-teal/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-circle-teal disabled:opacity-50"
                          >
                            {t("admin.boost.standard30")}
                          </button>
                          <button
                            type="button"
                            disabled={boostingId === r.id}
                            onClick={() => void setBoost(r, { days: 30, tier: 2 })}
                            className="rounded-xl border border-circle-amber/40 bg-circle-amber/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-circle-amber disabled:opacity-50"
                          >
                            {t("admin.boost.premium30")}
                          </button>
                          {isBoostLive(r) && (
                            <button
                              type="button"
                              disabled={boostingId === r.id}
                              onClick={() => void setBoost(r, { active: false })}
                              className="rounded-xl border border-red-500/30 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 disabled:opacity-50"
                            >
                              {t("admin.boost.stop")}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2 flex items-end text-xs text-circle-text/30">
                        <span>
                          #{r.id} · {r.source ?? "—"} ·{" "}
                          {new Date(r.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminRestaurantManager;
