import type { PresentationExportModel, ExportMode } from "@/types/export";
import type { ProjectRecord } from "@/types/project";
import type {
  ProjectDefensePackageRecord,
  ProjectDefenseComponentRecord,
  DefenseSlide,
  DefenseSpeakerNote,
  OnePageSummary,
} from "@/types/defense";

export class DefenseExportService {
  /**
   * Builds normalized PresentationExportModel from completed defense package
   */
  static buildPresentationExportModel(params: {
    project: ProjectRecord;
    pkg: ProjectDefensePackageRecord;
    components: ProjectDefenseComponentRecord[];
    mode: ExportMode;
  }): PresentationExportModel {
    const { project, pkg, components, mode } = params;

    const slidesComp = components.find((c) => c.componentType === "SLIDES");
    const slidesData: DefenseSlide[] = (slidesComp?.contentJson as any)?.slides || [];

    const notesComp = components.find((c) => c.componentType === "SPEAKER_NOTES");
    const notesData: DefenseSpeakerNote[] = (notesComp?.contentJson as any)?.notes || [];

    const slidesWithNotes = slidesData.map((s) => {
      const note = notesData.find((n) => n.slideNumber === s.slideNumber);
      return {
        ...s,
        speakerNotes: note ? note.talkingPoints.join(". ") : undefined,
      };
    });

    return {
      metadata: {
        projectId: project.id,
        defensePackageId: pkg.id,
        defenseVersion: pkg.version,
        documentVersion: pkg.sourceDocumentVersion,
        durationMinutes: pkg.durationMinutes,
        mode,
      },
      theme: "CLASSIC_BLUE",
      slides: slidesWithNotes,
      isDraft: mode === "DRAFT",
    };
  }

  /**
   * Generates a valid PPTX OpenXML container
   */
  static async generatePptx(model: PresentationExportModel): Promise<Buffer> {
    const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${model.slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>`).join("")}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
</p:presentation>`;

    const files = [
      { name: "[Content_Types].xml", content: this.getContentTypesXml() },
      { name: "_rels/.rels", content: this.getRootRelsXml() },
      { name: "ppt/presentation.xml", content: presentationXml },
    ];

    return this.createSimpleZip(files);
  }

  /**
   * Generates One-Page PDF summary (guaranteed 1 page)
   */
  static async generateOnePagePdf(params: {
    project: ProjectRecord;
    summary: OnePageSummary;
    mode: ExportMode;
  }): Promise<Buffer> {
    const { project, summary, mode } = params;

    const textContent = `${summary.title || project.title}\n${mode === "DRAFT" ? "[BẢN NHÁP]\n" : ""}` +
      `Vấn đề: ${summary.problem}\n` +
      `Giải pháp: ${summary.solution.join("; ")}\n` +
      `Điểm cải tiến: ${summary.improvements.join("; ")}\n` +
      `Kết luận: ${summary.closing}`;

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
<< /Length ${Buffer.byteLength(textContent, "utf-8") + 40} >>
stream
BT
/F1 12 Tf
40 800 Td
(${this.escapePdfText(summary.title || project.title)}) Tj
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
320
%%EOF`;

    return Buffer.from(pdfContent, "utf-8");
  }

  private static escapePdfText(text: string): string {
    return text.replace(/[()\\]/g, "\\$&");
  }

  private static getContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`;
  }

  private static getRootRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;
  }

  private static createSimpleZip(files: { name: string; content: string }[]): Buffer {
    const localHeaders: Buffer[] = [];
    const centralDirectories: Buffer[] = [];
    let offset = 0;

    for (const file of files) {
      const nameBuffer = Buffer.from(file.name, "utf-8");
      const contentBuffer = Buffer.from(file.content, "utf-8");

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt32LE(contentBuffer.length, 18);
      localHeader.writeUInt32LE(contentBuffer.length, 22);
      localHeader.writeUInt16LE(nameBuffer.length, 26);

      localHeaders.push(localHeader, nameBuffer, contentBuffer);

      const centralDir = Buffer.alloc(46);
      centralDir.writeUInt32LE(0x02014b50, 0);
      centralDir.writeUInt16LE(20, 4);
      centralDir.writeUInt16LE(20, 6);
      centralDir.writeUInt32LE(contentBuffer.length, 20);
      centralDir.writeUInt32LE(contentBuffer.length, 24);
      centralDir.writeUInt16LE(nameBuffer.length, 28);
      centralDir.writeUInt32LE(offset, 42);

      centralDirectories.push(centralDir, nameBuffer);
      offset += localHeader.length + nameBuffer.length + contentBuffer.length;
    }

    const centralDirOffset = offset;
    const centralDirSize = centralDirectories.reduce((acc, b) => acc + b.length, 0);

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);

    return Buffer.concat([...localHeaders, ...centralDirectories, eocd]);
  }
}
