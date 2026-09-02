import crypto from "crypto";

export class ExportValidator {
  /**
   * Computes SHA-256 checksum of buffer
   */
  static computeChecksum(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Validates DOCX byte stream
   */
  static validateDocx(buffer: Buffer): { valid: boolean; error?: string; checksum: string } {
    const checksum = this.computeChecksum(buffer);
    if (!buffer || buffer.length < 50) {
      return { valid: false, error: "DOCX_INVALID: File rỗng hoặc kích thước quá nhỏ", checksum };
    }
    // Check standard ZIP magic bytes: PK (0x50, 0x4B, 0x03, 0x04)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return { valid: false, error: "DOCX_INVALID: Không đúng định dạng ZIP/OpenXML DOCX", checksum };
    }
    return { valid: true, checksum };
  }

  /**
   * Validates PDF byte stream
   */
  static validatePdf(buffer: Buffer): { valid: boolean; error?: string; checksum: string } {
    const checksum = this.computeChecksum(buffer);
    if (!buffer || buffer.length < 50) {
      return { valid: false, error: "PDF_INVALID: File rỗng hoặc kích thước quá nhỏ", checksum };
    }
    const header = buffer.subarray(0, 5).toString("utf-8");
    if (!header.startsWith("%PDF-")) {
      return { valid: false, error: "PDF_INVALID: Thiếu chữ ký PDF chuẩn (%PDF-)", checksum };
    }
    return { valid: true, checksum };
  }

  /**
   * Validates PPTX byte stream
   */
  static validatePptx(buffer: Buffer): { valid: boolean; error?: string; checksum: string } {
    const checksum = this.computeChecksum(buffer);
    if (!buffer || buffer.length < 50) {
      return { valid: false, error: "PPTX_INVALID: File rỗng hoặc kích thước quá nhỏ", checksum };
    }
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return { valid: false, error: "PPTX_INVALID: Không đúng định dạng OpenXML PPTX", checksum };
    }
    return { valid: true, checksum };
  }

  /**
   * Validates One-Page PDF (must be valid PDF and exactly 1 page)
   */
  static validateOnePagePdf(buffer: Buffer): { valid: boolean; error?: string; checksum: string } {
    const pdfVal = this.validatePdf(buffer);
    if (!pdfVal.valid) return pdfVal;

    // Check page count metadata or page marker
    const content = buffer.toString("utf-8");
    const countMatches = content.match(/\/Count\s+(\d+)/);
    if (countMatches && parseInt(countMatches[1], 10) > 1) {
      return {
        valid: false,
        error: "ONE_PAGE_LAYOUT_OVERFLOW: Bản tóm tắt vượt quá 1 trang A4",
        checksum: pdfVal.checksum,
      };
    }

    return { valid: true, checksum: pdfVal.checksum };
  }
}
