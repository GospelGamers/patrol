import { test as base } from "@playwright/test"
import { initialise } from "./initialise"
import { logger } from "./logger"
import { exposePatrolPlatformHandler } from "./patrolPlatformHandler"
import { PatrolTestEntry } from "./types"

// Debug: Log ALL environment variables at startup
// eslint-disable-next-line no-console
console.log("=== ENVIRONMENT VARIABLES DEBUG ===")
// eslint-disable-next-line no-console
console.log(`BASE_URL: ${process.env.BASE_URL}`)
// eslint-disable-next-line no-console
console.log(`PATROL_WEB_SCREENSHOTS: ${process.env.PATROL_WEB_SCREENSHOTS}`)
// eslint-disable-next-line no-console
console.log(`PATROL_WEB_SCREENSHOT_DIR: ${process.env.PATROL_WEB_SCREENSHOT_DIR}`)
// eslint-disable-next-line no-console
console.log(`PATROL_WEB_HEADLESS: ${process.env.PATROL_WEB_HEADLESS}`)
// eslint-disable-next-line no-console
console.log(`PATROL_WEB_IGNORE_HTTPS_ERRORS: ${process.env.PATROL_WEB_IGNORE_HTTPS_ERRORS}`)
// eslint-disable-next-line no-console
console.log("===================================")

const tests: PatrolTestEntry[] = process.env.PATROL_TESTS ? JSON.parse(process.env.PATROL_TESTS) : []
if (tests.length === 0) {
  logger.error("PATROL_TESTS env is empty")
}

export const patrolTest = base.extend({
  page: async ({ page }, use) => {
    page.on("console", message => {
      const text = message.text()
      if (text.startsWith("PATROL_LOG")) {
        // eslint-disable-next-line no-console
        console.log(text)
        return
      }

      // eslint-disable-next-line no-console
      console.log(`Playwright: ${text}`)
    })

    await page.goto("/", { waitUntil: "load" })

    await exposePatrolPlatformHandler(page)

    await initialise(page)

    await use(page)
  },
})

for (const { name, skip, tags } of tests) {
  patrolTest(name, { tag: tags }, async ({ page }, testInfo) => {
    patrolTest.skip(skip)

    await page.waitForFunction(() => window.__patrol__runTest, {
      timeout: 300000,
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await page.evaluate(async name => await window.__patrol__runTest!(name), name)

    // Debug logging for screenshot environment variables
    // eslint-disable-next-line no-console
    console.log(`[SCREENSHOT DEBUG] Test completed: ${name}`)
    // eslint-disable-next-line no-console
    console.log(`[SCREENSHOT DEBUG] PATROL_WEB_SCREENSHOTS = "${process.env.PATROL_WEB_SCREENSHOTS}"`)
    // eslint-disable-next-line no-console
    console.log(`[SCREENSHOT DEBUG] PATROL_WEB_SCREENSHOT_DIR = "${process.env.PATROL_WEB_SCREENSHOT_DIR}"`)
    // eslint-disable-next-line no-console
    console.log(`[SCREENSHOT DEBUG] Will capture screenshot: ${process.env.PATROL_WEB_SCREENSHOTS === "true"}`)

    // Take screenshot after test completes (if PATROL_WEB_SCREENSHOTS is enabled)
    if (process.env.PATROL_WEB_SCREENSHOTS === "true") {
      const screenshotDir = process.env.PATROL_WEB_SCREENSHOT_DIR || "./screenshots"
      const sanitizedName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      const screenshotPath = `${screenshotDir}/${sanitizedName}.png`

      // eslint-disable-next-line no-console
      console.log(`[SCREENSHOT] Capturing screenshot to: ${screenshotPath}`)

      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      })

      // eslint-disable-next-line no-console
      console.log(`[SCREENSHOT] ✅ Screenshot saved successfully: ${screenshotPath}`)

      // Attach screenshot to test report
      await testInfo.attach("screenshot", {
        path: screenshotPath,
        contentType: "image/png",
      })
    } else {
      // eslint-disable-next-line no-console
      console.log(`[SCREENSHOT] ⏭️  Skipping screenshot capture (not enabled)`)
    }
  })
}
