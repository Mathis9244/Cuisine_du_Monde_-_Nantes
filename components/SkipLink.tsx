"use client";

import React from "react";

const MAIN_CONTENT_ID = "contenu-principal";

export default function SkipLink() {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById(MAIN_CONTENT_ID);
    if (!main) return;

    event.preventDefault();
    main.focus();
    main.scrollIntoView({ block: "start" });
    window.history.replaceState(null, "", `#${MAIN_CONTENT_ID}`);
  };

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="skip-link"
      onClick={handleClick}
    >
      Aller au contenu principal
    </a>
  );
}
