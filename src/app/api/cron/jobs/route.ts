import { JobStatus, Prisma } from "@prisma/client";
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
  const jobs = await db.$transaction(
    async (transaction) => {
      const due = await transaction.$queryRaw<{ id: string }[]>(
        Prisma.sql`
          SELECT id
          FROM "Job"
          WHERE status = 'PENDING'
            AND "runAt" <= NOW()
          ORDER BY "runAt" ASC
          LIMIT 25
          FOR UPDATE SKIP LOCKED
        `,
      );
      if (!due.length) return [];

      const ids = due.map((job) => job.id);
      await transaction.job.updateMany({
        where: { id: { in: ids }, status: JobStatus.PENDING },
        data: {
          status: JobStatus.RUNNING,
          lockedAt: new Date(),
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });
      return transaction.job.findMany({
        where: { id: { in: ids }, lockedBy: workerId },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );

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
