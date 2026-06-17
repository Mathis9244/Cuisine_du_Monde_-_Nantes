"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MDiv = motion.div as any;

interface ExcludeCountryPromptProps {
  open: boolean;
  country: string | null;
  onExclude: () => void;
  onDismiss: () => void;
}

const ExcludeCountryPrompt: React.FC<ExcludeCountryPromptProps> = ({
  open,
  country,
  onExclude,
  onDismiss,
}) => {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {open && country && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
          <MDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onDismiss}
          />
          <MDiv
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="relative w-full max-w-md rounded-[2rem] border border-circle-border bg-circle-card p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-4 top-4 text-circle-frost/40 hover:text-circle-text"
              aria-label={t("rate.cancel")}
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-circle-amber/10 text-circle-amber">
              <Ban size={22} />
            </div>

            <h3 className="text-xl font-black uppercase tracking-tight text-circle-text">
              {t("exclude.title")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-circle-frost/65">
              {t("exclude.lead", { country })}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onExclude}
                className="flex-1 rounded-2xl bg-circle-amber px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#081c1b] active:scale-[0.98]"
              >
                {t("exclude.confirm")}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="flex-1 rounded-2xl border border-circle-border bg-circle-bg/50 px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/60"
              >
                {t("exclude.dismiss")}
              </button>
            </div>
          </MDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExcludeCountryPrompt;
