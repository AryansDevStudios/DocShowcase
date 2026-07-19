import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { verifyPasskey } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { id, passkey } = await request.json();

    if (!id || !passkey) {
      return NextResponse.json(
        { error: "Document ID and passkey are required." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "documents", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    const storedHash = data.passkeyHash;

    if (!storedHash) {
      return NextResponse.json(
        { error: "This document is read-only." },
        { status: 403 }
      );
    }

    const isValid = await verifyPasskey(passkey, storedHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect passkey." },
        { status: 401 }
      );
    }

    // Generate a simple session token (timestamp-based)
    const token = `${id}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Passkey verification error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
