import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/components/toast";
import { Landing } from "./landing";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

const html = renderToStaticMarkup(
  <ToastProvider>
    <Landing initialTheme="light" />
  </ToastProvider>,
);

it("sends every call to action to the login page", () => {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const internal = links.filter((href) => href.startsWith("/"));
  // Header, hero and final call.
  expect(internal).toEqual(["/login", "/login", "/login"]);
});

it("has a target for every in-page anchor", () => {
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(
    (match) => match[1],
  );
  expect(anchors.length).toBeGreaterThan(0);
  for (const anchor of anchors) expect(html).toContain(`id="${anchor}"`);
});

it("keeps a single h1 that reads as a sentence for screen readers", () => {
  expect(html.match(/<h1/g)).toHaveLength(1);
  expect(html).toContain("produto vencido, prateleira vazia");
});
