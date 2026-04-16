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
    expect(html).toContain("Что уже сделано и что ждёт впереди.");
  });

  it("renders all milestone versions", async () => {
    const { default: RoadmapPage } = await import("../../src/app/roadmap/page");
    const html = renderToStaticMarkup(React.createElement(RoadmapPage));

    expect(html).toContain("v1.0");
    expect(html).toContain("v1.1");
    expect(html).toContain("v1.2");
    expect(html).toContain("v1.3");
    expect(html).toContain("v1.4");
    expect(html).toContain("v1.5");
  });

  it("renders status labels", async () => {
    const { default: RoadmapPage } = await import("../../src/app/roadmap/page");
    const html = renderToStaticMarkup(React.createElement(RoadmapPage));

    expect(html).toContain("Выпущено");
    expect(html).toContain("Запланировано");
  });

  it("renders milestone titles", async () => {
    const { default: RoadmapPage } = await import("../../src/app/roadmap/page");
    const html = renderToStaticMarkup(React.createElement(RoadmapPage));

    expect(html).toContain("Основы");
    expect(html).toContain("Основные улучшения");
    expect(html).toContain("Оформление");
    expect(html).toContain("Шаринг и данные");
    expect(html).toContain("Безопасность аккаунта");
    expect(html).toContain("Обогащение");
  });
});
