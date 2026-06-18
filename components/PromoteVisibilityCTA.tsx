"use client";

import React, { useState } from "react";
import { ChevronDown, Megaphone, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { APP_NAME } from "@/lib/constants";

const CONTACT_EMAIL = "contact@cuisine-du-monde.fr";

const PromoteVisibilityCTA: React.FC = () => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const mailSubject = encodeURIComponent(
    `${APP_NAME} — Coup de projecteur restaurant`,
  );
  const mailBody = encodeURIComponent(t("spotlight.cta.mailBody"));

  return (
    <section className="rounded-3xl border border-circle-teal/25 bg-gradient-to-br from-circle-card to-circle-bg/80 p-6 md:p-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-circle-teal">
            <Megaphone size={14} />
            {t("spotlight.cta.eyebrow")}
          </p>
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-circle-text">
            {t("spotlight.cta.title")}
          </h3>
          {!open && (
            <p className="text-sm text-circle-frost/60">{t("spotlight.cta.teaser")}</p>
          )}
        </div>
        <ChevronDown
          size={20}
          className={`mt-1 shrink-0 text-circle-frost/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-6 space-y-5 border-t border-circle-border/60 pt-6">
          <p className="text-sm leading-relaxed text-circle-frost/70">
            {t("spotlight.cta.body")}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm text-circle-frost/80">
            <li className="rounded-xl bg-circle-bg/50 px-4 py-3">
              {t("spotlight.cta.benefit1")}
            </li>
            <li className="rounded-xl bg-circle-bg/50 px-4 py-3">
              {t("spotlight.cta.benefit2")}
            </li>
            <li className="rounded-xl bg-circle-bg/50 px-4 py-3">
              {t("spotlight.cta.benefit3")}
            </li>
            <li className="rounded-xl bg-circle-bg/50 px-4 py-3">
              {t("spotlight.cta.benefit4")}
            </li>
          </ul>
          <p className="text-[10px] font-bold uppercase tracking-widest text-circle-frost/35">
            {t("spotlight.cta.disclaimer")}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-circle-teal px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#081c1b]"
          >
            <Mail size={16} />
            {t("spotlight.cta.contact")}
          </a>
        </div>
      )}
    </section>
  );
};

export default PromoteVisibilityCTA;
