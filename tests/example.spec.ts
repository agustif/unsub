  import { test, expect, chromium } from "@playwright/test";
  import fs from "fs";
  import csv from "csv-parser";

  // List of CSV files
  const csvFiles = ["./frens.csv"]; // Add your CSV file names here expects a "url"

  // Function to read URLs from CSV files
  async function readUrlsFromCsv(files) {
    let urls = [];
    for (const file of files) {
      const urlsFromFile = await new Promise((resolve, reject) => {
        const urls = [];
        fs.createReadStream(file)
          .pipe(csv())
          .on("data", (row) => {
            urls.push(row.url); // Assuming the CSV has a column named 'url'
          })
          .on("end", () => {
            resolve(urls);
          })
          .on("error", reject);
      });
      urls = urls.concat(urlsFromFile);
    }
    console.log(urls);
    return urls;
  }
  test.setTimeout(1200000090);
  let browserContext;

  test.describe("Batch Process URLs from CSVs", () => {
    let urls = [];

    test.beforeAll(async () => {
      urls = await readUrlsFromCsv(csvFiles);

      // Create a persistent context
      const userDataDir = "./user_data"; // Directory to store user data
      browserContext = await chromium.launchPersistentContext(userDataDir, {
        headless: false, // Set to true if you don't need the browser UI
      });
    });

    test.afterAll(async () => {
      await browserContext.close();
    });
    // Use test.step to ensure URLs are processed one by one
    test("Processing URLs from CSVs", async ({ page }) => {
      for (const url of urls) {
        await test.step(`Processing URL: ${url}`, async () => {
          try {
            await page.goto(url);
            await page.waitForTimeout(2000); // Wait for 2 seconds to allow the page to load

            await page.getByTestId("unsubscribe-dropdown").click();
            await page.waitForTimeout(1000); // Wait for 1 second to allow the dropdown to appear

            await page.getByTestId("unsubscribe-dropdown-button").click();
            await page.waitForTimeout(1000); // Wait for 1 second to allow the modal to appear

            await page.getByTestId("modal-unsubscribe-button").click();
            await page.waitForTimeout(1500); // Wait for 1.5 seconds to allow the action to complete

            await page.waitForSelector("data-testid=close-button", {
              state: "visible",
              timeout: 10000,
            }); // Wait up to 10 seconds for the close button to appear
            await page.getByTestId("close-button").click();
            await page.waitForTimeout(1000); // Wait for 1 second to ensure the modal is closed
          } catch (error) {
            console.error(`Error processing URL ${url}:`, error);
          }
        });
      }
    });
  });
