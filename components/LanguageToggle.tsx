"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const LanguageToggle: React.FC = () => {
  const { localeLabel, toggle, t } = useI18n();
  const display =
    localeLabel === "auto" ? t("lang.auto") : localeLabel.toUpperCase();

  return (
    <button
      onClick={toggle}
      title={t("lang.label")}
      aria-label={t("lang.label")}
      className="flex items-center gap-1.5 text-circle-frost/40 hover:text-circle-amber transition-colors p-2"
    >
      <Languages size={20} />
      <span className="text-[11px] font-black uppercase tracking-widest">
        {display}
      </span>
    </button>
  );
};

export default LanguageToggle;
