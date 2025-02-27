import { prisma } from "@/prisma/prisma-client";
import { NextResponse } from "next/server";

export async function GET() {
    const additionals = await prisma.additional.findMany();
    return NextResponse.json(additionals);
}