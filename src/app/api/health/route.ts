import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "salonflow",
    timestamp: new Date().toISOString(),
  });
}
