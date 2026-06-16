import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(analyses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Geçmiş yüklenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.analysis.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
