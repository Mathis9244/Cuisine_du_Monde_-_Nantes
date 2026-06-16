"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Power, Save } from "lucide-react";
import type { DbRestaurant } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

interface AdminListResponse {
  data: DbRestaurant[];
  meta: { total: number; page: number; limit: number };
}

export default function AdminPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "forbidden" | "ready">(
    "loading",
  );
  const [restaurants, setRestaurants] = useState<DbRestaurant[]>([]);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (includeInactive) params.set("includeInactive", "true");
    if (search) params.set("search", search);
    params.set("limit", "200");
    const res = await fetch(`/api/admin/restaurants?${params.toString()}`);
    if (res.status === 401 || res.status === 403) {
      setStatus("forbidden");
      return;
    }
    if (!res.ok) {
      setError(`Erreur ${res.status}`);
      return;
    }
    const json = (await res.json()) as AdminListResponse;
    setRestaurants(json.data);
    setStatus("ready");
  }, [includeInactive, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = (
    id: number,
    field: keyof DbRestaurant,
    value: string,
  ) => {
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]:
                field === "rating"
                  ? value === ""
                    ? null
                    : Number(value)
                  : value,
            }
          : r,
      ),
    );
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
          website: r.website,
          phone: r.phone,
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'enregistrement");
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (r: DbRestaurant) => {
    const action = r.is_active ? "deactivate" : "activate";
    const res = await fetch(`/api/admin/restaurants/${r.id}/${action}`, {
      method: "PATCH",
    });
    if (res.ok) void load();
    else setError(`Erreur ${res.status}`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-circle-text/40 font-black uppercase tracking-[0.4em]">
        {t("loading")}
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-circle-amber">
          {t("admin.forbidden.title")}
        </h1>
        <p className="text-circle-text/40 max-w-md">
          {t("admin.forbidden.body")}
        </p>
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
      <nav className="sticky top-0 z-50 bg-circle-bg/80 backdrop-blur-2xl border-b border-circle-border px-4 md:px-8 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 bg-circle-text/5 border border-circle-text/10 rounded-xl hover:bg-circle-text/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          <span>{t("admin.back")}</span>
        </Link>
        <span className="font-black uppercase tracking-widest text-circle-amber">
          {t("admin.title")}
        </span>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/restaurants/export/csv"
          className="flex items-center gap-2 px-4 py-2 bg-circle-teal text-[#081c1b] rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest"
        >
          <Download size={16} /> CSV
        </a>
      </nav>

      <main className="container mx-auto max-w-6xl py-10 px-4 md:px-8 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.search")}
            className="flex-1 min-w-[200px] px-5 py-3 bg-circle-card border border-circle-border rounded-2xl outline-none focus:border-circle-teal"
          />
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-circle-text/60">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            {t("admin.includeInactive")}
          </label>
          <span className="text-xs text-circle-text/30 font-black uppercase tracking-widest">
            {t("admin.results", { count: restaurants.length })}
          </span>
        </div>

        {error && (
          <div className="px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 rounded-2xl border ${
                r.is_active
                  ? "bg-circle-card border-circle-border"
                  : "bg-circle-card/40 border-red-900/40"
              }`}
            >
              <input
                value={r.name ?? ""}
                onChange={(e) => updateField(r.id, "name", e.target.value)}
                className="md:col-span-3 px-3 py-2 bg-circle-bg border border-circle-border rounded-lg text-sm font-bold"
              />
              <input
                value={r.cuisine ?? ""}
                onChange={(e) => updateField(r.id, "cuisine", e.target.value)}
                placeholder={t("admin.ph.cuisine")}
                className="md:col-span-2 px-3 py-2 bg-circle-bg border border-circle-border rounded-lg text-sm"
              />
              <input
                value={r.address ?? ""}
                onChange={(e) => updateField(r.id, "address", e.target.value)}
                placeholder={t("admin.ph.address")}
                className="md:col-span-3 px-3 py-2 bg-circle-bg border border-circle-border rounded-lg text-sm"
              />
              <input
                value={r.phone ?? ""}
                onChange={(e) => updateField(r.id, "phone", e.target.value)}
                placeholder={t("admin.ph.phone")}
                className="md:col-span-2 px-3 py-2 bg-circle-bg border border-circle-border rounded-lg text-sm"
              />
              <div className="md:col-span-2 flex items-center gap-2 justify-end">
                <button
                  onClick={() => save(r)}
                  disabled={savingId === r.id}
                  className="p-2 bg-circle-amber text-[#081c1b] rounded-lg disabled:opacity-50"
                  title={t("admin.save")}
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => toggleActive(r)}
                  className={`p-2 rounded-lg ${
                    r.is_active
                      ? "bg-red-500/20 text-red-300"
                      : "bg-green-500/20 text-green-300"
                  }`}
                  title={r.is_active ? t("admin.deactivate") : t("admin.activate")}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
