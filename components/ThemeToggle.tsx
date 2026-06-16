"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

const ThemeToggle: React.FC = () => {
  const { preference, cycle } = useTheme();
  const { t } = useI18n();

  const Icon =
    preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;
  const label = t(`theme.${preference}`);

  return (
    <button
      onClick={cycle}
      title={t("theme.label", { v: label })}
      aria-label={t("theme.label", { v: label })}
      className="text-circle-frost/40 hover:text-circle-amber transition-colors p-2"
    >
      <Icon size={20} />
    </button>
  );
};

export default ThemeToggle;
