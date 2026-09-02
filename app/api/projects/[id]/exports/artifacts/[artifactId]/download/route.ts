import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ExportService } from "@/server/services/export-service";
import { ExportRepository } from "@/server/repositories/export-repository";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; artifactId: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const ip = request.headers.get("x-forwarded-for") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await ExportService.recordDownload({
      projectId: params.id,
      userId: user.id,
      artifactId: params.artifactId,
      ipHash: ip,
      userAgent,
    });

    const exportRepo = new ExportRepository();
    const artifact = await exportRepo.findArtifactById(params.artifactId);
    if (!artifact) {
      return NextResponse.json({ error: "ARTIFACT_NOT_FOUND" }, { status: 404 });
    }

    // In local/mock environment, generate mock binary file stream response with standard attachment headers
    const mockContent = Buffer.from(
      `SKKN AI EXPORT ARTIFACT: ${artifact.filename}\nChecksum: ${artifact.checksum}\nVersion: ${artifact.version}`,
      "utf-8"
    );

    return new NextResponse(mockContent, {
      status: 200,
      headers: {
        "Content-Type": artifact.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(artifact.filename)}"`,
        "Content-Length": String(mockContent.length),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "DOWNLOAD_ERROR", message: (err as Error).message }, { status: 400 });
  }
}
