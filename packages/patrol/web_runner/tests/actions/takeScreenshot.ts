import { Page } from "playwright"

export interface TakeScreenshotParams {
  name?: string
  fullPage?: boolean
  path?: string
}

export async function takeScreenshot(page: Page, params: TakeScreenshotParams) {
  // Use the screenshot dir from environment (set by Dart to absolute path)
  const screenshotDir = process.env.PATROL_WEB_SCREENSHOT_DIR || "./screenshots"
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const sanitizedName = (params.name || `screenshot-${timestamp}`).replace(/[^a-z0-9_-]/gi, "_").toLowerCase()
  const screenshotPath = params.path || `${screenshotDir}/${sanitizedName}.png`

  // eslint-disable-next-line no-console
  console.log(`[SCREENSHOT] Taking screenshot: ${screenshotPath}`)

  await page.screenshot({
    path: screenshotPath,
    fullPage: params.fullPage !== false, // default to true
  })

  // eslint-disable-next-line no-console
  console.log(`[SCREENSHOT] ✅ Screenshot saved: ${screenshotPath}`)

  return { path: screenshotPath }
}
