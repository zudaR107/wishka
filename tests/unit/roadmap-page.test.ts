import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

describe("roadmap page", () => {
  beforeEach(() => {
    Object.assign(globalThis, { React });
  });

  it("renders the roadmap title and description", async () => {
    const { default: RoadmapPage } = await import("../../src/app/roadmap/page");
    const html = renderToStaticMarkup(React.createElement(RoadmapPage));

    expect(html).toContain("Дорожная карта");
    expect(html).toContain("Что уже сделано, что в работе, и что ждёт впереди.");
  });

  it("renders all milestone versions", async () => {
    const { default: RoadmapPage } = await import("../../src/app/roadmap/page");
    const html = renderToStaticMarkup(React.createElement(RoadmapPage));

    expect(html).toContain("v0.1");
    expect(html).toContain("v1.0");
    expect(html).toContain("v1.1");
    expect(html).toContain("v1.2");
    expect(html).toContain("v2.0");
  });

  it("renders status labels for all three states", async () => {
    const { default: RoadmapPage } = await import("../../src/app/roadmap/page");
    const html = renderToStaticMarkup(React.createElement(RoadmapPage));

    expect(html).toContain("Выпущено");
    expect(html).toContain("В разработке");
    expect(html).toContain("Запланировано");
  });

  it("renders milestone titles", async () => {
    const { default: RoadmapPage } = await import("../../src/app/roadmap/page");
    const html = renderToStaticMarkup(React.createElement(RoadmapPage));

    expect(html).toContain("Базовый каркас");
    expect(html).toContain("Бронирование");
    expect(html).toContain("UI Redesign");
    expect(html).toContain("Уведомления");
    expect(html).toContain("Многоязычность и валюты");
  });
});
