import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { assertLocal } from "@/lib/security";
import { loadExperiment } from "@/lib/store";
import { metrics } from "@/lib/metrics";
export const runtime = "nodejs";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertLocal(request);
    const experiment = await loadExperiment((await params).id);
    const golden = experiment.goldenVersions.at(-1)?.answers;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "OpenRouter Model Evaluation Kit";
    function sheet(
      name: string,
      columns: { header: string; key: string; width?: number }[],
      rows: Record<string, unknown>[],
    ) {
      const tab = workbook.addWorksheet(name);
      tab.columns = columns.map((c) => ({ ...c, width: c.width ?? 22 }));
      tab.addRows(rows);
      tab.views = [{ state: "frozen", ySplit: 1 }];
      tab.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: Math.max(1, rows.length + 1), column: columns.length },
      };
      tab.getRow(1).font = { bold: true, color: { argb: "FFE5EBEF" } };
      tab.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF18261E" },
      };
      tab.getRow(1).height = 26;
      return tab;
    }
    sheet(
      "Inputs",
      Object.keys(experiment.rows[0]).map((key) => ({
        header: key,
        key,
        width: key === "description" ? 50 : 22,
      })),
      experiment.rows,
    );
    sheet(
      "Model results",
      [
        ["caseId", "Case ID"],
        ["model", "Requested model"],
        ["resolvedModel", "Resolved model"],
        ["provider", "Serving provider"],
        ["answer", "Answer"],
        ["expected", "Golden"],
        ["correct", "Correct"],
        ["status", "Status"],
        ["confidence", "Confidence"],
        ["probabilities", "Probabilities JSON"],
        ["latencyMs", "Latency ms (incl retries)"],
        ["inputTokens", "Input tokens"],
        ["outputTokens", "Output tokens"],
        ["totalTokens", "Total tokens"],
        ["cachedTokens", "Cached tokens"],
        ["reasoningTokens", "Reasoning tokens"],
        ["costUsd", "Cost USD"],
        ["costSource", "Cost source"],
        ["requestId", "Request ID"],
        ["startedAt", "Started UTC"],
        ["completedAt", "Completed UTC"],
        ["attempts", "Attempts"],
        ["error", "Error"],
      ].map(([key, header]) => ({
        key,
        header,
        width: ["model", "resolvedModel", "error"].includes(key) ? 40 : 22,
      })),
      experiment.runs.map((run) => ({
        ...run,
        probabilities: run.probabilities
          ? JSON.stringify(run.probabilities)
          : null,
        expected: golden?.[run.caseId] ?? null,
        correct: golden?.[run.caseId]
          ? run.status === "success" && run.answer === golden[run.caseId]
          : null,
      })),
    );
    const comparison = metrics(experiment).map((m) => ({
      ...m,
      evaluation: golden
        ? "Golden v" + experiment.goldenVersions.length
        : "NOT MEASURED YET",
    }));
    sheet(
      "Comparison",
      Object.keys(comparison[0]).map((key) => ({
        header: key,
        key,
        width: key === "model" ? 44 : 22,
      })),
      comparison,
    );
    sheet(
      "Golden",
      [
        { header: "Case ID", key: "id" },
        { header: "Expected", key: "expected" },
        { header: "Notes", key: "notes", width: 60 },
      ],
      golden
        ? Object.entries(golden).map(([id, expected]) => ({
            id,
            expected,
            notes: experiment.goldenVersions.at(-1)?.notes[id] ?? "",
          }))
        : [],
    );
    sheet(
      "Experiment",
      [
        { header: "Property", key: "key", width: 26 },
        { header: "Value", key: "value", width: 100 },
      ],
      [
        { key: "Experiment ID", value: experiment.id },
        { key: "Name", value: experiment.name },
        { key: "Created UTC", value: experiment.createdAt },
        { key: "Status", value: experiment.status },
        { key: "Context", value: experiment.context },
        { key: "Task", value: experiment.task },
        { key: "Allowed outputs", value: JSON.stringify(experiment.choices) },
        { key: "Dataset version", value: experiment.datasetVersion },
        { key: "Prompt version", value: experiment.promptVersion },
        { key: "Golden versions", value: experiment.goldenVersions.length },
        {
          key: "Evaluation",
          value: golden
            ? "Accuracy on golden-matched cases, including invalid/error runs."
            : "NOT MEASURED YET",
        },
        {
          key: "Missing measurements",
          value:
            "Empty cells are unavailable, never zero. Latency includes retry wait. JSON export contains full raw metadata and pricing snapshots.",
        },
        { key: "Persistence", value: "Local files only; no database." },
      ],
    );
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="experiment-' + experiment.id + '.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not export the experiment." },
      { status: 500 },
    );
  }
}
