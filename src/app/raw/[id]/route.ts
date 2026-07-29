import { NextRequest, NextResponse } from "next/server";
import { getDocument, deleteDocument, burnDocument } from "@/lib/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const display = request.nextUrl.searchParams.get("display") || "normal";

  // Check if the URL already has an extension
  const urlExtMatch = rawId.match(/\.([a-z0-9]+)$/i);
  const hasExtension = !!urlExtMatch;

  // Strip extension from the end of the id if present
  const id = rawId.replace(/\.[a-z0-9]+$/i, "");

  const document = await getDocument(id);

  if (!document) {
    return new NextResponse("Document Not Found", { status: 404 });
  }

  // Lazy-delete expired documents
  if (document.expiresAt && Date.now() > document.expiresAt.seconds * 1000) {
    await deleteDocument(id);
    return new NextResponse("Document has expired", { status: 410 });
  }

  // Determine the correct extension for this document
  let expectedExt = "txt";
  if (document.type === "html") expectedExt = "html";
  else if (document.type === "markdown") expectedExt = "md";
  else if (document.type === "custom") {
    const nameExtMatch = document.name?.match(/\.([a-z0-9]+)$/i);
    if (nameExtMatch) {
      expectedExt = nameExtMatch[1].toLowerCase();
    }
  }

  // If no extension in URL, redirect to the correct one
  // IMPORTANT: Do this BEFORE any destructive operations (burn)
  if (!hasExtension) {
    const redirectUrl = new URL(request.nextUrl);
    redirectUrl.pathname = `/raw/${id}.${expectedExt}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  const { content, type, name } = document;

  // Clean filename for the Content-Disposition header
  let filename = name
    ? name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    : `document.${expectedExt}`;

  if (!filename.toLowerCase().endsWith(`.${expectedExt}`)) {
    filename = `${filename}.${expectedExt}`;
  }

  const headers = new Headers();

  // Determine Content-Type based on document type / extension
  if (type === "html" || expectedExt === "html") {
    headers.set("Content-Type", "text/html; charset=utf-8");
  } else if (expectedExt === "css") {
    headers.set("Content-Type", "text/css; charset=utf-8");
  } else if (expectedExt === "js" || expectedExt === "mjs") {
    headers.set("Content-Type", "application/javascript; charset=utf-8");
  } else if (expectedExt === "json") {
    headers.set("Content-Type", "application/json; charset=utf-8");
  } else if (expectedExt === "xml") {
    headers.set("Content-Type", "application/xml; charset=utf-8");
  } else {
    headers.set("Content-Type", "text/plain; charset=utf-8");
  }

  if (display === "download") {
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  }

  // Fire-and-forget: burn the document AFTER we've prepared the response
  if (document.burnAfterReading) {
    burnDocument(id).catch(console.error);
  }

  return new NextResponse(content, {
    status: 200,
    headers,
  });
}
