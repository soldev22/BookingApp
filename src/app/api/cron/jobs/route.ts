import { JobStatus, type Job } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

function isAuthorised(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  return Boolean(
    expected && request.headers.get("authorization") === `Bearer ${expected}`,
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const workerId = crypto.randomUUID();
  const jobs: Job[] = [];
  for (let index = 0; index < 25; index += 1) {
    const candidate = await db.job.findFirst({
      where: {
        status: JobStatus.PENDING,
        runAt: { lte: new Date() },
        lockedAt: null,
      },
      orderBy: { runAt: "asc" },
    });
    if (!candidate) break;

    const claimed = await db.job.updateMany({
      where: {
        id: candidate.id,
        status: JobStatus.PENDING,
        lockedAt: null,
      },
      data: {
        status: JobStatus.RUNNING,
        lockedAt: new Date(),
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    });
    if (claimed.count === 1) {
      const job = await db.job.findFirst({
        where: { id: candidate.id, lockedBy: workerId },
      });
      if (job) jobs.push(job);
    }
  }

  const results = [];
  for (const job of jobs) {
    try {
      if (!["SEND_MESSAGE", "EXPIRE_BOOKING", "DAILY_SUMMARY"].includes(job.type)) {
        throw new Error(`Unsupported job type: ${job.type}`);
      }
      await db.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        },
      });
      results.push({ id: job.id, status: "completed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const exhausted = job.attempts >= job.maxAttempts;
      await db.job.update({
        where: { id: job.id },
        data: {
          status: exhausted ? JobStatus.DEAD_LETTER : JobStatus.PENDING,
          runAt: new Date(Date.now() + 2 ** job.attempts * 60_000),
          lastError: message,
          lockedAt: null,
          lockedBy: null,
        },
      });
      results.push({ id: job.id, status: exhausted ? "dead-letter" : "retry" });
    }
  }

  return NextResponse.json({ workerId, processed: results.length, results });
}
