import puppeteer from "puppeteer";

export async function generetaPDF(
  htmlReport: string,
  filename: string = "report.pdf"
) {
  const finalHtml = htmlReport.includes("```html")
    ? htmlReport.replace(/^```html\n/, "").replace(/\n```$/, "")
    : htmlReport;

  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(finalHtml);
  await page.pdf({ path: filename, format: "A4" });
  await browser.close();

  console.log(`\nReport generated successfully: ${filename}`);
}
