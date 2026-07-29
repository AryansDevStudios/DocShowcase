import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/lib/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const display = request.nextUrl.searchParams.get("display") || "normal";

  // Check if the URL already has an extension
  const hasExtension = /\.(md|html)$/.test(rawId);

  // Strip .md or .html from the end of the id if present
  const id = rawId.replace(/\.html$/, "").replace(/\.md$/, "");

  const document = await getDocument(id);

  if (!document) {
    return new NextResponse("Document Not Found", { status: 404 });
  }

  // If no extension in URL, redirect to the correct one
  if (!hasExtension) {
    const ext = document.type === "html" ? "html" : "md";
    const redirectUrl = new URL(request.nextUrl);
    redirectUrl.pathname = `/raw/${id}.${ext}`;
    return NextResponse.redirect(redirectUrl, 308);
  }




  const { content, type, name } = document;
  
  // Clean filename for the Content-Disposition header
  const filename = name
    ? name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    : "document";
  const ext = type === "html" ? "html" : "md";
  const fullFilename = `${filename}.${ext}`;

  const headers = new Headers();

  // Determine Content-Type based on document type
  if (type === "html") {
    headers.set("Content-Type", "text/html; charset=utf-8");
  } else {
    // For markdown, plain text ensures the browser renders the raw code natively
    headers.set("Content-Type", "text/plain; charset=utf-8");
  }

  // Handle download display mode
  if (display === "download") {
    headers.set("Content-Disposition", `attachment; filename="${fullFilename}"`);
  }

  return new NextResponse(content, {
    status: 200,
    headers,
  });
}
