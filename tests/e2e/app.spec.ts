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
  await page.getByRole("button", { name: "3 日", exact: true }).click();
  await expect(page.locator(".fc-col-header-cell")).toHaveCount(3);
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

test("opening an event shows details before editing", async ({ page }) => {
  await page.goto("/calendar");
  await page.locator(".fc-event").filter({ hasText: "字节跳动 · 一面" }).click();
  await expect(page.getByLabel("日程详情")).toBeVisible();
  await expect(page.getByText("飞书会议")).toBeVisible();
  await expect(page.getByLabel("日程详情").locator("input")).toHaveCount(0);
  await page.getByRole("button", { name: "编辑" }).click();
  await expect(page.getByLabel("日程编辑器")).toBeVisible();
});

test("job detail creates a calendar node already bound to the application", async ({
  page,
}) => {
  await page.goto("/applications/app-byte");
  await page.getByRole("button", { name: "新增节点" }).click();
  await expect(page.getByRole("heading", { name: "新建日程" })).toBeVisible();
  await expect(page.locator('label:has-text("关联岗位") select')).toHaveValue("app-byte");
  await page.getByPlaceholder("例如：字节跳动 · 一面").fill("HR 沟通");
  await page.getByRole("button", { name: "保存日程" }).click();
  await expect(page.locator(".node-list").getByText("HR 沟通")).toBeVisible();
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

test("desktop timeline separates application durations from milestones", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/timeline");
  await expect(page.locator(".timeline-application-span")).toHaveCount(3);
  await expect(page.locator(".vis-box.timeline-node")).toHaveCount(3);
  await expect(page.getByText("岗位持续时间")).toBeVisible();
  const durationColor = await page
    .locator(".timeline-application-span")
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(durationColor).not.toBe("rgba(0, 0, 0, 0)");
});

test("dark theme keeps calendar and timeline text readable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.addInitScript(() =>
    localStorage.setItem("job-calendar:theme", "dark"),
  );
  await page.goto("/calendar");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const colors = await page.locator("body").evaluate((element) => ({
    foreground: getComputedStyle(element).color,
    background: getComputedStyle(element).backgroundColor,
  }));
  expect(colors.foreground).not.toBe(colors.background);
  await expect(page.getByText("我的日历")).toBeVisible();
  await page.goto("/timeline");
  await expect(page.locator(".timeline-application-span").first()).toBeVisible();
  await expect(page.locator(".vis-box.timeline-node").first()).toBeVisible();
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
