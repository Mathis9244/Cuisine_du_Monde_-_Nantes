import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GooeyNav from "../GooeyNav";

describe("GooeyNav", () => {
  it("renders the selected item and its rounded background from the controlled index", () => {
    const html = renderToStaticMarkup(
      React.createElement(GooeyNav, {
        items: [{ label: "Feed" }, { label: "Carte" }],
        activeIndex: 1,
        onNav: () => undefined,
      }),
    );

    expect(html).toContain('<li class="active">');
    expect(html).toContain('aria-current="page">Carte</button>');
    expect(html).toContain('class="effect filter active"');
  });
});
