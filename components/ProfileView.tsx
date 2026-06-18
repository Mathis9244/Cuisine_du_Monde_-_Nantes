"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Save,
  X,
  LogOut,
  Ban,
  Loader2,
  Camera,
} from "lucide-react";
import type { Restaurant } from "@/lib/types";
import RestaurantCard from "./RestaurantCard";
import { useI18n } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/avatarUpload";
import { compressAvatarImage } from "@/lib/compressAvatarImage";
import { AVATAR_MAX_BYTES } from "@/lib/avatarUpload.shared";

export interface ProfileData {
  name: string;
  avatar: string;
  email?: string;
  bio?: string;
}

interface ProfileViewProps {
  profile: ProfileData;
  userId?: string;
  restaurants: Restaurant[];
  isOwnProfile?: boolean;
  excludedCountries?: string[];
  onBack: () => void;
  onRate: (restaurant: Restaurant) => void;
  onProfileClick: (profile: { name: string; avatar: string }) => void;
  onProfileUpdate?: (next: ProfileData) => void;
  onToggleExcludedCountry?: (country: string, excluded: boolean) => void;
  onLogout?: () => void;
}

const MDiv = motion.div as any;

const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  userId,
  restaurants,
  isOwnProfile = false,
  excludedCountries = [],
  onRate,
  onProfileClick,
  onProfileUpdate,
  onToggleExcludedCountry,
  onLogout,
}) => {
  const { t } = useI18n();
  const avatarInputId = React.useId();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: profile.name,
    email: profile.email ?? "",
    avatar: profile.avatar,
    bio: profile.bio ?? "",
  });

  useEffect(() => {
    setForm({
      username: profile.name,
      email: profile.email ?? "",
      avatar: profile.avatar,
      bio: profile.bio ?? "",
    });
  }, [profile]);

  const userRatings = useMemo(
    () =>
      restaurants.filter((res) =>
        res.friendRatings?.some((fr) => fr.name === profile.name),
      ),
    [restaurants, profile.name],
  );

  const countriesExplored = useMemo(
    () => Array.from(new Set(userRatings.map((res) => res.country))),
    [userRatings],
  );

  const averageRating =
    userRatings.length > 0
      ? (
          userRatings.reduce((acc, curr) => {
            const rating =
              curr.friendRatings?.find((fr) => fr.name === profile.name)
                ?.rating || 0;
            return acc + rating;
          }, 0) / userRatings.length
        ).toFixed(1)
      : "0";

  const processAvatarFile = useCallback(
    async (file: File) => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = userId || session?.user?.id;
      if (!uid) {
        setSaveError(t("profile.avatar.notLoggedIn"));
        return;
      }

      setSaveError(null);
      setUploadingAvatar(true);
      try {
        let prepared = file;
        try {
          prepared = await compressAvatarImage(file);
        } catch {
          if (file.size > AVATAR_MAX_BYTES) {
            throw new Error(
              `Image trop lourde (${Math.round(file.size / 1024)} Ko) et compression impossible`,
            );
          }
          prepared = file;
        }
        const publicUrl = await uploadAvatar(uid, prepared);
        setForm((f) => ({ ...f, avatar: publicUrl }));
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : t("profile.avatar.error"),
        );
      } finally {
        setUploadingAvatar(false);
      }
    },
    [t, userId],
  );

  const openAvatarPicker = useCallback(async () => {
    if (uploadingAvatar) return;

    if (typeof window !== "undefined" && "showOpenFilePicker" in window) {
      try {
        const picker = window.showOpenFilePicker as (options: {
          types: {
            description: string;
            accept: Record<string, string[]>;
          }[];
          multiple?: boolean;
        }) => Promise<FileSystemFileHandle[]>;

        const [handle] = await picker({
          types: [
            {
              description: "Images",
              accept: {
                "image/jpeg": [".jpg", ".jpeg"],
                "image/png": [".png"],
                "image/gif": [".gif"],
              },
            },
          ],
          multiple: false,
        });
        const file = await handle.getFile();
        await processAvatarFile(file);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    document.getElementById(avatarInputId)?.click();
  }, [avatarInputId, processAvatarFile, uploadingAvatar]);

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await processAvatarFile(file);
  };

  const handleAvatarDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (uploadingAvatar) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAvatarFile(file);
  };

  const handleSave = async () => {
    if (!isOwnProfile || !onProfileUpdate) return;
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        email: form.email.trim() || undefined,
        data: {
          username: form.username.trim(),
          bio: form.bio.trim(),
          avatar_url: form.avatar.trim(),
        },
      });
      if (error) throw error;
      onProfileUpdate({
        name: form.username.trim() || profile.name,
        avatar: form.avatar.trim() || profile.avatar,
        email: form.email.trim(),
        bio: form.bio.trim(),
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 md:space-y-14"
    >
      <div className="flex flex-col items-center space-y-5 px-2 py-6 text-center md:space-y-7 md:py-10">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-circle-teal opacity-20 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={editing ? form.avatar : profile.avatar}
            alt={profile.name}
            className="relative z-10 h-28 w-28 rounded-[1.75rem] border-4 border-circle-border bg-circle-card shadow-2xl sm:h-36 sm:w-36 md:h-44 md:w-44 md:rounded-[2.5rem]"
          />
        </div>

        <div className="w-full max-w-lg space-y-2">
          <h2 className="break-words text-3xl font-black uppercase leading-none tracking-tighter text-circle-text sm:text-4xl md:text-6xl">
            {profile.name}
          </h2>
          {profile.bio && !editing && (
            <p className="mx-auto max-w-md text-sm leading-relaxed text-circle-frost/60">
              {profile.bio}
            </p>
          )}
          <p className="pt-1 text-[10px] font-black uppercase tracking-[0.45em] text-circle-teal sm:text-xs">
            {t("profile.member")}
          </p>
        </div>

        {isOwnProfile && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing((v) => !v);
                setSaveError(null);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-circle-border bg-circle-card/80 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.28em] text-circle-text/80"
            >
              {editing ? (
                <X size={14} aria-hidden="true" />
              ) : (
                <Pencil size={14} aria-hidden="true" />
              )}
              {editing ? t("profile.cancelEdit") : t("profile.edit")}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-circle-border bg-circle-bg/60 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.28em] text-circle-frost/60"
              >
                <LogOut size={14} aria-hidden="true" />
                {t("profile.logout")}
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {editing && isOwnProfile && (
            <MDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-lg overflow-hidden"
            >
              <div className="space-y-3 rounded-[1.5rem] border border-circle-border bg-circle-card/70 p-4 text-left sm:p-5">
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/40">
                    {t("profile.field.username")}
                  </span>
                  <input
                    id="profile-username"
                    name="username"
                    autoComplete="username"
                    spellCheck={false}
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    className="w-full rounded-xl border border-circle-border bg-circle-bg px-4 py-3 text-sm font-bold text-circle-text focus:border-circle-teal"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/40">
                    {t("profile.field.email")}
                  </span>
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-circle-border bg-circle-bg px-4 py-3 text-sm font-bold text-circle-text focus:border-circle-teal"
                  />
                </label>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/40">
                    {t("profile.field.avatar")}
                  </span>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!uploadingAvatar) setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => void handleAvatarDrop(e)}
                    className={`flex flex-col items-center gap-3 rounded-xl border border-dashed p-4 transition-colors sm:flex-row sm:items-center ${
                      dragOver
                        ? "border-circle-teal bg-circle-teal/10"
                        : "border-circle-border bg-circle-bg/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.avatar}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-2xl border border-circle-border bg-circle-card object-cover"
                    />
                    <div className="flex w-full flex-col gap-2 sm:flex-1">
                      <input
                        id={avatarInputId}
                        name="avatar"
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        aria-describedby={`${avatarInputId}-hint`}
                        className="sr-only"
                        disabled={uploadingAvatar}
                        onChange={(e) => void handleAvatarPick(e)}
                      />
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => void openAvatarPicker()}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-circle-border bg-circle-card px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-circle-text/80 transition-opacity ${
                          uploadingAvatar
                            ? "cursor-not-allowed opacity-50"
                            : "hover:border-circle-teal/40"
                        }`}
                      >
                        {uploadingAvatar ? (
                          <Loader2
                            size={14}
                            aria-hidden="true"
                            className="animate-spin"
                          />
                        ) : (
                          <Camera size={14} aria-hidden="true" />
                        )}
                        {uploadingAvatar
                          ? t("profile.avatar.uploading")
                          : t("profile.avatar.choose")}
                      </button>
                      <p
                        id={`${avatarInputId}-hint`}
                        className="text-[10px] text-circle-frost/70"
                      >
                        {t("profile.avatar.hint")}
                      </p>
                      <p className="text-[10px] text-circle-frost/30">
                        {t("profile.avatar.drop")}
                      </p>
                      <p className="text-[10px] text-circle-frost/25">
                        {t("profile.avatar.onedrive")}
                      </p>
                      {saveError && (
                        <p role="alert" className="text-xs font-bold text-red-300">
                          {saveError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/40">
                    {t("profile.field.bio")}
                  </span>
                  <textarea
                    id="profile-bio"
                    name="bio"
                    autoComplete="off"
                    value={form.bio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bio: e.target.value }))
                    }
                    rows={3}
                    maxLength={280}
                    className="w-full resize-none rounded-xl border border-circle-border bg-circle-bg px-4 py-3 text-sm text-circle-text focus:border-circle-teal"
                  />
                </label>
                {saveError && (
                  <p role="alert" className="text-xs font-bold text-red-300">
                    {saveError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={saving || uploadingAvatar}
                  onClick={() => void handleSave()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-circle-amber py-3.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#081c1b] disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={16} aria-hidden="true" />
                  )}
                  {t("profile.save")}
                </button>
              </div>
            </MDiv>
          )}
        </AnimatePresence>

        <div className="flex w-full max-w-md flex-wrap justify-center gap-5 px-2 pt-2 sm:gap-8">
          <div className="min-w-[72px] text-center">
            <p className="text-2xl font-black text-circle-amber sm:text-3xl">
              {userRatings.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-circle-frost/30">
              {t("profile.reviews")}
            </p>
          </div>
          <div className="min-w-[72px] border-x border-circle-text/10 px-4 text-center sm:px-8">
            <p className="text-2xl font-black text-circle-text sm:text-3xl">
              {countriesExplored.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-circle-frost/30">
              {t("profile.countries")}
            </p>
          </div>
          <div className="min-w-[72px] text-center">
            <p className="text-2xl font-black text-circle-teal sm:text-3xl">
              {averageRating}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-circle-frost/30">
              {t("profile.avg")}
            </p>
          </div>
        </div>
      </div>

      {isOwnProfile && excludedCountries.length > 0 && (
        <section className="space-y-4 px-2">
          <div className="flex items-center gap-2">
            <Ban size={16} aria-hidden="true" className="text-circle-amber" />
            <h3 className="text-lg font-black uppercase tracking-tight text-circle-text sm:text-xl">
              {t("profile.excludedTitle")}
            </h3>
          </div>
          <p className="text-sm text-circle-frost/55">{t("profile.excludedLead")}</p>
          <div className="flex flex-wrap gap-2">
            {excludedCountries.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => onToggleExcludedCountry?.(country, false)}
                className="inline-flex items-center gap-2 rounded-full border border-circle-border bg-circle-bg/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-circle-frost/70"
              >
                {country}
                <X size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6 px-2 md:space-y-8">
        <div className="flex flex-col gap-2 border-b border-circle-border pb-4 sm:flex-row sm:items-baseline sm:justify-between md:pb-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-circle-text sm:text-3xl md:text-4xl">
            {t("profile.log")}
          </h3>
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-circle-text/20">
            {t("profile.allRatings")}
          </span>
        </div>

        {userRatings.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
            {userRatings.map((res) => (
              <RestaurantCard
                key={res.id}
                restaurant={res}
                onRate={() => onRate(res)}
                onProfileClick={onProfileClick}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border-2 border-dashed border-circle-border py-14 text-center md:rounded-[2.5rem] md:py-20">
            <p className="text-base font-bold uppercase tracking-widest text-circle-text/20 sm:text-lg">
              {t("profile.empty")}
            </p>
          </div>
        )}
      </section>
    </MDiv>
  );
};

export default ProfileView;
