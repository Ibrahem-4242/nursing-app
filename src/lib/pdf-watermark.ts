import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

/**
 * Applies a professional copyright watermark and top/bottom protection ribbons
 * to each page of the uploaded PDF document.
 */
export async function applyWatermarkToPdf(pdfBuffer: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      // 1. Center Large Diagonal Watermark
      const watermarkText = 'NURSING STUDY HUB • OFFICIAL NOTES';
      const textSize = Math.min(width, height) * 0.055;
      const textWidth = fontBold.widthOfTextAtSize(watermarkText, textSize);

      // Centered position calculation
      const centerX = width / 2;
      const centerY = height / 2;

      page.drawText(watermarkText, {
        x: centerX - textWidth / 2.5,
        y: centerY - 20,
        size: textSize,
        font: fontBold,
        color: rgb(0.06, 0.46, 0.43), // Rich Teal
        rotate: degrees(45),
        opacity: 0.16,
      });

      // Secondary diagonal watermark for full-page coverage
      const subWatermark = 'VERIFIED SUMMARY • COPYRIGHT PROTECTED';
      const subSize = textSize * 0.6;
      page.drawText(subWatermark, {
        x: centerX - textWidth / 3,
        y: centerY - 70,
        size: subSize,
        font: fontRegular,
        color: rgb(0.06, 0.46, 0.43),
        rotate: degrees(45),
        opacity: 0.14,
      });

      // 2. Top Protection Ribbon
      const ribbonHeight = 22;
      page.drawRectangle({
        x: 0,
        y: height - ribbonHeight,
        width,
        height: ribbonHeight,
        color: rgb(0.06, 0.46, 0.43),
        opacity: 0.9,
      });

      const topText = 'NURSING STUDY HUB • OFFICIAL ACADEMIC MATERIAL • DO NOT RESELL';
      const topTextWidth = fontBold.widthOfTextAtSize(topText, 8.5);
      page.drawText(topText, {
        x: Math.max(10, (width - topTextWidth) / 2),
        y: height - ribbonHeight + 6.5,
        size: 8.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // 3. Bottom Security Ribbon
      const bottomHeight = 18;
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: bottomHeight,
        color: rgb(0.06, 0.46, 0.43),
        opacity: 0.9,
      });

      const bottomText = 'HTTPS://NURSING-APP.VERCEL.APP • OFFICIAL NURSING STUDY NOTES';
      const bottomTextWidth = fontRegular.widthOfTextAtSize(bottomText, 8);
      page.drawText(bottomText, {
        x: Math.max(10, (width - bottomTextWidth) / 2),
        y: 5.5,
        size: 8,
        font: fontRegular,
        color: rgb(1, 1, 1),
      });
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error('[Watermark] Failed to apply watermark to PDF:', err);
    // Return original buffer in worst case so upload never fails completely
    return new Uint8Array(pdfBuffer);
  }
}
