import { expect, test } from "@playwright/test";

test("calendar exposes timed week, month, year, and three-day views", async ({
  page,
}) => {
  await page.goto("/calendar");
  await expect(page.locator(".calendar-workspace")).toBeVisible();
  await expect(page.getByText("字节跳动 · 一面")).toBeVisible();
  await expect(page.getByRole("button", { name: "新建日程" })).toHaveCount(0);
  await expect(
    page.getByText("把每一次准备、笔试和面试放在正确的时间里。"),
  ).toHaveCount(0);
  for (const label of ["3 日", "月", "年"])
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeAttached();
});

test("desktop creates an event from the calendar context menu", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/calendar");
  const column = page.locator(".fc-timegrid-col[data-date]").first();
  const columnBox = await column.boundingBox();
  expect(columnBox).not.toBeNull();
  await page.mouse.click(columnBox!.x + columnBox!.width / 2, 300, {
    button: "right",
  });
  await expect(page.getByRole("heading", { name: "新建日程" })).toBeVisible();
});

test("job pipeline can advance and preserves activity history", async ({
  page,
}) => {
  await page.goto("/applications/app-byte");
  await page.getByRole("button", { name: /二面/ }).click();
  await expect(page.getByText("推进记录")).toBeVisible();
  await expect(page.locator(".history-panel").getByText("二面")).toBeVisible();
});

test("mobile uses bottom navigation and vertical timeline", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/timeline");
  await expect(page.locator(".bottom-nav")).toBeVisible();
  await expect(page.locator(".mobile-timeline")).toBeVisible();
  await expect(page.locator(".desktop-timeline")).toBeHidden();
});

test("has no horizontal page overflow", async ({ page }) => {
  for (const path of [
    "/calendar",
    "/timeline",
    "/applications",
    "/import",
    "/settings",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, `${path} overflow`).toBeLessThanOrEqual(1);
  }
});
