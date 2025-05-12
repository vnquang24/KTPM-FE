import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id;
    
    if (!accountId) {
      return NextResponse.json(
        { error: "ID account không hợp lệ" },
        { status: 400 }
      );
    }

    // Tìm customUser liên kết với account
    const customUser = await prisma.customUser.findFirst({
      where: {
        accountId: accountId,
      },
    });

    if (!customUser) {
      return NextResponse.json(
        { error: "Không tìm thấy customUser cho account này" },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: customUser.id });
  } catch (error) {
    console.error("Lỗi khi tìm customUser:", error);
    return NextResponse.json(
      { error: "Lỗi server khi tìm customUser" },
      { status: 500 }
    );
  }
} 