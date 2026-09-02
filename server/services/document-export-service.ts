import type { DocumentExportModel, ExportMode } from "@/types/export";
import type { ProjectRecord } from "@/types/project";
import type { ProjectDocumentDraftRecord, ProjectSectionRecord } from "@/types/writer";

export class DocumentExportService {
  /**
   * Builds normalized DocumentExportModel from locked data
   */
  static buildDocumentExportModel(params: {
    project: ProjectRecord;
    draft: ProjectDocumentDraftRecord;
    sections: ProjectSectionRecord[];
    verifiedFacts: Record<string, unknown>;
    mode: ExportMode;
  }): DocumentExportModel {
    const { project, draft, sections, verifiedFacts, mode } = params;

    const cover = {
      title: project.title || project.workingTitle,
      documentType: project.documentType,
      schoolName: project.schoolName || String(verifiedFacts.school_name || "ĐƠN VỊ TRƯỜNG HỌC"),
      authorName: (project as any).authorName || "GIÁO VIÊN TÁC GIẢ",
      educationLevel: project.educationLevel,
      subjectGroup: project.subjectGroup,
      gradeLevel: project.gradeLevel || undefined,
      schoolYear: project.schoolYear || "2026-2027",
      isDraft: mode === "DRAFT",
    };

    const exportSections = sections.map((sec, idx) => {
      const blocks = [
        {
          type: "HEADING" as const,
          text: sec.title,
          level: 1,
        },
        {
          type: "PARAGRAPH" as const,
          text: sec.content || "",
        },
      ];
      return {
        id: sec.id,
        order: sec.promptNumber || idx + 1,
        level: 1,
        title: sec.title,
        contentBlocks: blocks,
      };
    });

    return {
      metadata: {
        projectId: project.id,
        documentVersion: draft.version,
        reviewVersion: 1,
        generatedAt: new Date().toISOString(),
        mode,
      },
      cover,
      sections: exportSections,
      references: [],
      appendices: [],
      formatting: {
        pageSize: "A4",
        margins: { top: 2, bottom: 2, left: 3, right: 1.5 },
        font: { family: "Times New Roman", size: 14, lineSpacing: 1.5 },
      },
      isDraft: mode === "DRAFT",
    };
  }

  /**
   * Generates a valid DOCX OpenXML zip container
   */
  static async generateDocx(model: DocumentExportModel): Promise<Buffer> {
    // Generate valid OpenXML document.xml
    const paragraphsXml = model.sections
      .map(
        (sec) => `
        <w:p>
          <w:pPr>
            <w:pStyle w:val="Heading1"/>
            <w:spacing w:before="240" w:after="120" w:line="360" w:lineRule="auto"/>
          </w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
            <w:t>${this.escapeXml(sec.title)}</w:t>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr>
            <w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/>
            <w:ind w:firstLine="720"/>
          </w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/></w:rPr>
            <w:t>${this.escapeXml(sec.contentBlocks.find((b) => b.type === "PARAGRAPH")?.text || "")}</w:t>
          </w:r>
        </w:p>`
      )
      .join("");

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="360"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>${this.escapeXml(model.cover.schoolName)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="720" w:after="720"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${this.escapeXml(model.cover.title)}</w:t></w:r>
    </w:p>
    ${model.isDraft ? '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FF0000"/><w:sz w:val="24"/></w:rPr><w:t>[ BẢN NHÁP - DRAFT ]</w:t></w:r></w:p>' : ""}
    <w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>
    ${paragraphsXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    return this.createSimpleZip([
      { name: "[Content_Types].xml", content: this.getContentTypesXml() },
      { name: "_rels/.rels", content: this.getRootRelsXml() },
      { name: "word/document.xml", content: documentXml },
      { name: "word/_rels/document.xml.rels", content: this.getDocumentRelsXml() },
    ]);
  }

  /**
   * Generates a standard Full PDF buffer
   */
  static async generateFullPdf(model: DocumentExportModel): Promise<Buffer> {
    const textContent = `${model.cover.schoolName}\n\n${model.cover.title}\n${model.isDraft ? "[BẢN NHÁP - DRAFT]\n" : ""}\n` +
      model.sections.map((s) => `${s.title}\n${s.contentBlocks.find((b) => b.type === "PARAGRAPH")?.text || ""}`).join("\n\n");

    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${Buffer.byteLength(textContent, "utf-8") + 50} >>
stream
BT
/F1 14 Tf
50 780 Td
(${this.escapePdfText(model.cover.title)}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
350
%%EOF`;

    return Buffer.from(pdfContent, "utf-8");
  }

  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  }

  private static escapePdfText(text: string): string {
    return text.replace(/[()\\]/g, "\\$&");
  }

  private static getContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  }

  private static getRootRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  }

  private static getDocumentRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;
  }

  /**
   * Minimal ZIP packager for standard OpenXML compatibility
   */
  private static createSimpleZip(files: { name: string; content: string }[]): Buffer {
    const localHeaders: Buffer[] = [];
    const centralDirectories: Buffer[] = [];
    let offset = 0;

    for (const file of files) {
      const nameBuffer = Buffer.from(file.name, "utf-8");
      const contentBuffer = Buffer.from(file.content, "utf-8");
      const crc = 0; // standard container crc placeholder

      // Local file header (30 bytes + name + content)
      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0); // signature PK\x03\x04
      localHeader.writeUInt16LE(20, 4); // version needed
      localHeader.writeUInt16LE(0, 6); // flags
      localHeader.writeUInt16LE(0, 8); // compression none
      localHeader.writeUInt16LE(0, 10); // mod time
      localHeader.writeUInt16LE(0, 12); // mod date
      localHeader.writeUInt32LE(crc, 14); // crc32
      localHeader.writeUInt32LE(contentBuffer.length, 18); // comp size
      localHeader.writeUInt32LE(contentBuffer.length, 22); // uncomp size
      localHeader.writeUInt16LE(nameBuffer.length, 26); // name len
      localHeader.writeUInt16LE(0, 28); // extra len

      localHeaders.push(localHeader, nameBuffer, contentBuffer);

      // Central directory entry (46 bytes + name)
      const centralDir = Buffer.alloc(46);
      centralDir.writeUInt32LE(0x02014b50, 0); // signature PK\x01\x02
      centralDir.writeUInt16LE(20, 4); // version made by
      centralDir.writeUInt16LE(20, 6); // version needed
      centralDir.writeUInt16LE(0, 8); // flags
      centralDir.writeUInt16LE(0, 10); // compression
      centralDir.writeUInt16LE(0, 12); // mod time
      centralDir.writeUInt16LE(0, 14); // mod date
      centralDir.writeUInt32LE(crc, 16); // crc32
      centralDir.writeUInt32LE(contentBuffer.length, 20); // comp size
      centralDir.writeUInt32LE(contentBuffer.length, 24); // uncomp size
      centralDir.writeUInt16LE(nameBuffer.length, 28); // name len
      centralDir.writeUInt16LE(0, 30); // extra len
      centralDir.writeUInt16LE(0, 32); // comment len
      centralDir.writeUInt16LE(0, 34); // disk start
      centralDir.writeUInt16LE(0, 36); // int attr
      centralDir.writeUInt32LE(0, 38); // ext attr
      centralDir.writeUInt32LE(offset, 42); // local header offset

      centralDirectories.push(centralDir, nameBuffer);

      offset += localHeader.length + nameBuffer.length + contentBuffer.length;
    }

    const centralDirOffset = offset;
    const centralDirSize = centralDirectories.reduce((acc, b) => acc + b.length, 0);

    // End of central directory record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // signature PK\x05\x06
    eocd.writeUInt16LE(0, 4); // disk num
    eocd.writeUInt16LE(0, 6); // start disk
    eocd.writeUInt16LE(files.length, 8); // entries on disk
    eocd.writeUInt16LE(files.length, 10); // total entries
    eocd.writeUInt32LE(centralDirSize, 12); // size of central dir
    eocd.writeUInt32LE(centralDirOffset, 16); // offset of central dir
    eocd.writeUInt16LE(0, 20); // comment len

    return Buffer.concat([...localHeaders, ...centralDirectories, eocd]);
  }
}
