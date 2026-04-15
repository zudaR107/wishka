import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

describe("not-found page", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
  });

  it("renders the 404 code", async () => {
    const { default: NotFound } = await import("../../src/app/not-found");
    const html = renderToStaticMarkup(React.createElement(NotFound));

    expect(html).toContain("404");
  });

  it("renders the title and description", async () => {
    const { default: NotFound } = await import("../../src/app/not-found");
    const html = renderToStaticMarkup(React.createElement(NotFound));

    expect(html).toContain("Страница не найдена");
    expect(html).toContain("Такой страницы не существует или она была перемещена.");
  });

  it("renders a link back to the home page", async () => {
    const { default: NotFound } = await import("../../src/app/not-found");
    const html = renderToStaticMarkup(React.createElement(NotFound));

    expect(html).toContain('href="/"');
    expect(html).toContain("На главную");
  });
});
