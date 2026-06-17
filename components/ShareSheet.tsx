"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Link2,
  MessageCircle,
  Share2,
  Check,
  Copy,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { APP_NAME } from "@/lib/constants";

const MDiv = motion.div as any;

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  shareUrl?: string;
  shareTitle?: string;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  open,
  onClose,
  shareUrl,
  shareTitle = APP_NAME,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(shareUrl ?? "");

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      setUrl(shareUrl ?? window.location.href);
      setCopied(false);
    }
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const shareText = t("share.message", { app: shareTitle });

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const nativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        onClose();
      } catch {
        // user cancelled
      }
    } else {
      void copyLink();
    }
  }, [copyLink, onClose, shareText, shareTitle, url]);

  const openSms = () => {
    window.open(`sms:?body=${encodeURIComponent(`${shareText} ${url}`)}`, "_blank");
  };

  const openSnap = () => {
    window.open(
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const actions = [
    {
      id: "native",
      label: t("share.native"),
      icon: Share2,
      onClick: () => void nativeShare(),
      primary: true,
    },
    {
      id: "copy",
      label: copied ? t("share.copied") : t("share.copy"),
      icon: copied ? Check : Copy,
      onClick: () => void copyLink(),
    },
    {
      id: "sms",
      label: t("share.sms"),
      icon: MessageCircle,
      onClick: openSms,
    },
    {
      id: "snap",
      label: t("share.snap"),
      icon: Link2,
      onClick: openSnap,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <MDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-[#041111]/75 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <MDiv
            role="dialog"
            aria-modal
            aria-label={t("share.title")}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[95] mx-auto w-full max-w-lg rounded-t-[2rem] border border-circle-border bg-circle-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl lg:inset-auto lg:left-1/2 lg:top-1/2 lg:bottom-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[2rem] lg:px-6 lg:py-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-circle-border lg:hidden" />
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-circle-frost/40">
                  {t("share.title")}
                </p>
                <p className="mt-1 text-sm font-bold text-circle-text">{shareTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-circle-border bg-circle-bg/60 text-circle-frost/60"
                aria-label={t("share.close")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-circle-border bg-circle-bg/50 px-4 py-3">
              <p className="truncate text-xs text-circle-frost/55">{url}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.onClick}
                    className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all active:scale-[0.98] ${
                      action.primary
                        ? "border-circle-amber/50 bg-circle-amber/10 text-circle-amber"
                        : "border-circle-border bg-circle-bg/40 text-circle-text/80 hover:border-circle-frost/25"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </MDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareSheet;
