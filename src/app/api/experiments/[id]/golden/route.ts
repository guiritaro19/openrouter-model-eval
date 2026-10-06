import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assertLocal } from "@/lib/security";
import { matchGolden } from "@/lib/dataset";
import { loadExperiment, saveExperiment } from "@/lib/store";
const schema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(100),
  idColumn: z.string(),
  expectedColumn: z.string(),
});
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertLocal(request);
    const experiment = await loadExperiment((await params).id);
    if (experiment.status === "running")
      throw new Error(
        "Wait for the run to finish before importing golden answers.",
      );
    const payload = schema.parse(await request.json());
    const golden = matchGolden(
      payload.rows,
      payload.idColumn,
      payload.expectedColumn,
      experiment.rows.map((r) => r[experiment.idColumn]),
      Object.keys(experiment.choices),
    );
    experiment.goldenVersions.push({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...golden,
    });
    await saveExperiment(experiment);
    return NextResponse.json(experiment);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.name !== "ZodError"
            ? e.message
            : "Invalid golden dataset.",
      },
      { status: 400 },
    );
  }
}
