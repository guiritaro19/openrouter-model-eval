"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  FlaskConical,
  History,
  Layers,
  LoaderCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  demoChoices,
  demoColumns,
  demoContext,
  demoGolden,
  demoRows,
  demoTask,
} from "@/lib/demo";
import { agreement, metrics } from "@/lib/metrics";
import type { CatalogModel, Experiment, Row } from "@/lib/types";

const NOT_MEASURED = "NOT MEASURED YET";
const money = (n: number | null) => (n === null ? "—" : "$" + n.toFixed(6));
const ms = (n: number | null) =>
  n === null ? "—" : Math.round(n).toLocaleString("en-US") + " ms";
const count = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("en-US");
const pct = (n: number | null) =>
  n === null ? "—" : (n * 100).toFixed(1) + "%";
const inputPrice = (model: CatalogModel) =>
  model.pricing.prompt != null && Number(model.pricing.prompt) >= 0
    ? "$" + (Number(model.pricing.prompt) * 1e6).toFixed(3) + " / M input"
    : "Variable / unavailable price";
type HistoryEntry = {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  completed: number;
  total: number;
};
async function jsonRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error ?? "Request failed. Please try again.");
  return payload;
}
function parseChoices(text: string) {
  const entries = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf(":");
      if (i < 1) throw new Error("Use one choice per line: LABEL: definition.");
      return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    });
  if (new Set(entries.map((e) => e[0])).size !== entries.length)
    throw new Error("Duplicate choices.");
  return Object.fromEntries(entries);
}
function csv(rows: Row[]) {
  const columns = Object.keys(rows[0]);
  const escape = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  return [
    columns.map(escape).join(","),
    ...rows.map((r) => columns.map((c) => escape(r[c] ?? "")).join(",")),
  ].join("\r\n");
}
function download(name: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Page() {
  const [tab, setTab] = useState<"runner" | "results" | "history">("runner");
  const [models, setModels] = useState<CatalogModel[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [loadingModels, setLoadingModels] = useState(true),
    [configured, setConfigured] = useState(false);
  const [search, setSearch] = useState(""),
    [kind, setKind] = useState("all"),
    [structuredOnly, setStructuredOnly] = useState(true);
  const [columns, setColumns] = useState<string[]>([]),
    [rows, setRows] = useState<Row[]>([]),
    [idColumn, setIdColumn] = useState(""),
    [inputs, setInputs] = useState<string[]>([]),
    [datasetName, setDatasetName] = useState("");
  const [context, setContext] = useState(demoContext),
    [task, setTask] = useState(demoTask),
    [choicesText, setChoicesText] = useState(
      Object.entries(demoChoices)
        .map(([k, v]) => k + ": " + v)
        .join("\n"),
    ),
    [name, setName] = useState("GTM lead priority");
  const [experiment, setExperiment] = useState<Experiment | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState("all"),
    [inspect, setInspect] = useState<string | null>(null);
  const [goldenData, setGoldenData] = useState<{
      columns: string[];
      rows: Row[];
    } | null>(null),
    [goldenId, setGoldenId] = useState("id"),
    [goldenExpected, setGoldenExpected] = useState("expected");
  const uploadRef = useRef<HTMLInputElement>(null),
    goldenRef = useRef<HTMLInputElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const loadModels = async () => {
    setLoadingModels(true);
    setError("");
    try {
      const data = await jsonRequest("/api/models");
      setModels(data.models);
      setConfigured(data.configured);
      setSelected((old) => (old.length ? old : data.presets));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingModels(false);
    }
  };
  useEffect(() => {
    void loadModels();
  }, []);
  useEffect(() => {
    if (tab === "history")
      void jsonRequest("/api/experiments")
        .then(setHistory)
        .catch((e) => setError(e.message));
  }, [tab]);
  useEffect(() => {
    if (!inspect) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = inspectorRef.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInspect(null);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const targets = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, summary",
        ),
      );
      const first = targets[0],
        last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [inspect]);
  const visibleModels = useMemo(
    () =>
      models
        .filter(
          (m) =>
            (kind === "all" || m.kind === kind) &&
            (!structuredOnly || m.kind === "decision" || m.structured) &&
            (m.name + " " + m.id).toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 60),
    [models, kind, structuredOnly, search],
  );
  const summaries = experiment ? metrics(experiment) : [];
  const golden = experiment?.goldenVersions.at(-1)?.answers;
  const finished = experiment?.runs.length ?? 0;
  const total = experiment
    ? experiment.rows.length * experiment.models.length
    : 0;
  const agreementRate = experiment ? agreement(experiment.runs) : null;
  const resultRows =
    experiment?.rows.filter((row) => {
      const id = row[experiment.idColumn];
      const runs = experiment.runs.filter((r) => r.caseId === id);
      if (filter === "errors") return runs.some((r) => r.status === "error");
      if (filter === "invalid") return runs.some((r) => r.status === "invalid");
      if (filter === "disagree")
        return (
          new Set(
            runs.filter((r) => r.status === "success").map((r) => r.answer),
          ).size > 1
        );
      if (filter === "wrong")
        return (
          golden?.[id] &&
          runs.some((r) => r.status === "success" && r.answer !== golden[id])
        );
      if (filter === "all-correct")
        return (
          golden?.[id] &&
          runs.length === experiment.models.length &&
          runs.every((r) => r.status === "success" && r.answer === golden[id])
        );
      return true;
    }) ?? [];
  async function importFile(file: File, asGolden = false) {
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await jsonRequest("/api/datasets", { method: "POST", body });
      if (asGolden) {
        setGoldenData(data);
        setGoldenId(data.columns.includes("id") ? "id" : data.columns[0]);
        setGoldenExpected(
          data.columns.includes("expected")
            ? "expected"
            : (data.columns[1] ?? data.columns[0]),
        );
      } else {
        setRows(data.rows);
        setColumns(data.columns);
        const id = data.columns.includes("id") ? "id" : data.columns[0];
        setIdColumn(id);
        setInputs(data.columns.filter((c: string) => c !== id));
        setDatasetName(file.name);
        setNotice(
          data.rows.length + " cases imported. Check the column mapping.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function loadDemo() {
    setRows(demoRows);
    setColumns(demoColumns);
    setIdColumn("id");
    setInputs(demoColumns.filter((c) => c !== "id"));
    setDatasetName("100 fictional GTM cases");
    setContext(demoContext);
    setTask(demoTask);
    setChoicesText(
      Object.entries(demoChoices)
        .map(([k, v]) => k + ": " + v)
        .join("\n"),
    );
    setNotice(
      "Fictional dataset loaded. Model outputs are only measured when you run the experiment.",
    );
  }
  async function run(firstOnly: boolean) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const choices = parseChoices(choicesText);
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          context,
          task,
          choices,
          rows: firstOnly ? rows.slice(0, 1) : rows,
          idColumn,
          inputColumns: inputs,
          modelIds: selected,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      setExperiment(null);
      setTab("results");
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line);
          if (event.type === "start" || event.type === "complete")
            setExperiment(event.experiment);
          if (event.type === "result")
            setExperiment((e) =>
              e ? { ...e, runs: [...e.runs, event.run] } : e,
            );
          if (event.type === "error") throw new Error(event.message);
        }
      }
      setNotice(
        "Run completed and saved locally. Import golden answers to measure accuracy.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveGolden() {
    if (!experiment || !goldenData) return;
    setError("");
    try {
      const updated = await jsonRequest(
        "/api/experiments/" + experiment.id + "/golden",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...goldenData,
            idColumn: goldenId,
            expectedColumn: goldenExpected,
          }),
        },
      );
      setExperiment(updated);
      setGoldenData(null);
      setNotice(
        "Golden dataset version saved. Accuracy recalculated without new model calls.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const canRun =
    !busy &&
    configured &&
    rows.length > 0 &&
    selected.length > 0 &&
    inputs.length > 0;
  return (
    <div className="shell">
      <main>
        <header className="topbar">
          <a
            className="wordmark"
            href="/"
            aria-label="OpenRouter Model Evaluation Kit, home"
          >
            <span className="brand-symbol" aria-hidden="true">
              <i />
              <i />
            </span>
            <span>
              Model Evaluation Kit<small>OpenRouter</small>
            </span>
          </a>
          <div className="header-actions">
            <a
              className="documentation-link"
              href="/documentation"
              target="_blank"
              rel="noreferrer"
              aria-label="Documentation (opens in a new tab)"
            >
              Documentation
            </a>
            <span className="connection">
              <i className={configured ? "dot online" : "dot"} />
              {loadingModels
                ? "Loading catalog…"
                : configured
                  ? "API key configured"
                  : "API key not configured"}
            </span>
          </div>
        </header>
        <div className="workspace">
          <div className="page-heading">
            <div>
              <h1>
                {tab === "runner"
                  ? "New experiment"
                  : tab === "results"
                    ? "Results"
                    : "History"}
              </h1>
              <p className="subheading">
                {tab === "runner"
                  ? "One task, the same data. Compare models using evidence."
                  : tab === "results"
                    ? "Compare outputs, inspect cases and import golden answers."
                    : "Reopen experiments and continue your analysis."}
              </p>
            </div>
            <div className="local-note">
              <span className="dot online" />
              Local experiments
              <br />
              <small>Saved on this computer</small>
            </div>
          </div>
          <nav className="tabs" aria-label="Experiment views">
            <button
              className={tab === "runner" ? "selected" : ""}
              onClick={() => setTab("runner")}
            >
              <span>Setup</span>
            </button>
            <button
              className={tab === "results" ? "selected" : ""}
              onClick={() => setTab("results")}
            >
              <span>Results</span>
              {finished > 0 && <b>{finished}</b>}
            </button>
            <button
              className={tab === "history" ? "selected" : ""}
              onClick={() => setTab("history")}
            >
              <span>History</span>
            </button>
          </nav>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert notice" role="status">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "runner" && (
            <div className="runner-grid">
              <div className="configuration">
                <section className="section">
                  <div className="section-title">
                    <div>
                      <span className="step">01</span>
                      <h2>Input dataset</h2>
                    </div>
                    <span className="muted">CSV / XLSX · up to 100 cases</span>
                  </div>
                  <input
                    ref={uploadRef}
                    type="file"
                    accept=".csv,.xlsx"
                    className="file-input"
                    aria-label="Import dataset"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void importFile(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    className="upload-zone"
                    onClick={() => uploadRef.current?.click()}
                    disabled={busy}
                  >
                    <Upload size={23} />
                    <strong>{datasetName || "Import a spreadsheet"}</strong>
                    <span>
                      {rows.length
                        ? rows.length +
                          " cases · " +
                          columns.length +
                          "  columns"
                        : "Each row is an independent request."}
                    </span>
                  </button>
                  <div className="demo-actions">
                    <button
                      className="text-button"
                      onClick={loadDemo}
                      disabled={busy}
                    >
                      <Plus size={14} />
                      Use 100 fictional cases
                    </button>
                    <button
                      className="text-button"
                      onClick={() =>
                        download("requests-demo.csv", csv(demoRows), "text/csv")
                      }
                    >
                      <ArrowDownToLine size={14} />
                      Download example
                    </button>
                  </div>
                  {rows.length > 0 && (
                    <>
                      <div className="mapping">
                        <label>
                          ID column
                          <select
                            value={idColumn}
                            onChange={(e) => {
                              setIdColumn(e.target.value);
                              setInputs(
                                inputs.filter((c) => c !== e.target.value),
                              );
                            }}
                          >
                            {columns.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </label>
                        <div>
                          <span className="field-label">Input columns</span>
                          <div className="chips">
                            {columns
                              .filter((c) => c !== idColumn)
                              .map((c) => (
                                <label
                                  key={c}
                                  className={
                                    inputs.includes(c) ? "chip on" : "chip"
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={inputs.includes(c)}
                                    onChange={(e) =>
                                      setInputs(
                                        e.target.checked
                                          ? [...inputs, c]
                                          : inputs.filter((i) => i !== c),
                                      )
                                    }
                                  />
                                  {c}
                                </label>
                              ))}
                          </div>
                        </div>
                      </div>
                      <p className="help">
                        Unchecked columns stay out of the prompt. IDs match
                        cases to golden answers.
                      </p>
                      <div className="table-scroll preview">
                        <table>
                          <thead>
                            <tr>
                              {columns.map((c) => (
                                <th key={c}>{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 3).map((r, i) => (
                              <tr key={i}>
                                {columns.map((c) => (
                                  <td key={c}>{r[c] || "—"}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
                <section className="section">
                  <div className="section-title">
                    <div>
                      <span className="step">02</span>
                      <h2>Define the task</h2>
                    </div>
                    <span className="muted">Prompt v1</span>
                  </div>
                  <label>
                    Experiment name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Experiment context
                    <textarea
                      rows={4}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                    />
                  </label>
                  <label>
                    Task
                    <textarea
                      rows={2}
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                    />
                  </label>
                  <label>
                    Allowed outputs
                    <textarea
                      className="mono"
                      rows={6}
                      value={choicesText}
                      onChange={(e) => setChoicesText(e.target.value)}
                    />
                    <span className="help">
                      One choice per line: LABEL: definition. All models receive
                      the same meaning.
                    </span>
                  </label>
                </section>
              </div>
              <div className="candidates">
                <section className="section model-section">
                  <div className="section-title">
                    <div>
                      <span className="step">03</span>
                      <h2>Models</h2>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Refresh catalog"
                      onClick={() => void loadModels()}
                      disabled={loadingModels}
                    >
                      <RefreshCw
                        size={16}
                        className={loadingModels ? "spin" : ""}
                      />
                    </button>
                  </div>
                  <p className="help">
                    One OpenRouter API. Up to 4 models per experiment.
                  </p>
                  <div className="selected-models">
                    {selected.map((id) => {
                      const model = models.find((m) => m.id === id);
                      return (
                        <div className="selected-model" key={id}>
                          <span
                            className={
                              model?.kind === "decision"
                                ? "model-mark decision"
                                : "model-mark chat"
                            }
                          >
                            {model?.kind === "decision" ? "D" : "L"}
                          </span>
                          <div>
                            <strong>{model?.name ?? id}</strong>
                            <span>{id}</span>
                          </div>
                          <button
                            aria-label={"Remove " + id}
                            onClick={() =>
                              setSelected(selected.filter((v) => v !== id))
                            }
                          >
                            <X size={15} />
                          </button>
                        </div>
                      );
                    })}
                    {!selected.length && (
                      <p className="help">
                        Select candidate models from the catalog.
                      </p>
                    )}
                  </div>
                  <details className="catalog-disclosure">
                    <summary>
                      Add or change models <Plus size={16} />
                    </summary>
                    <div className="search-field">
                      <Search size={16} />
                      <input
                        aria-label="Search models"
                        placeholder="OpenAI, Qwen, DeepSeek, Jev…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="model-filters">
                      <label className="compact">
                        Type
                        <select
                          value={kind}
                          onChange={(e) => setKind(e.target.value)}
                        >
                          <option value="all">All</option>
                          <option value="chat">Generative LLM</option>
                          <option value="decision">Decision model</option>
                        </select>
                      </label>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={structuredOnly}
                          onChange={(e) => setStructuredOnly(e.target.checked)}
                        />
                        Structured output
                      </label>
                    </div>
                    <div className="catalog-list">
                      {loadingModels ? (
                        <p className="loading">
                          <LoaderCircle className="spin" size={20} />
                          Loading live catalog…
                        </p>
                      ) : (
                        visibleModels.map((m) => (
                          <button
                            key={m.id}
                            aria-pressed={selected.includes(m.id)}
                            className={
                              selected.includes(m.id)
                                ? "catalog-model picked"
                                : "catalog-model"
                            }
                            disabled={
                              busy ||
                              (!selected.includes(m.id) && selected.length >= 4)
                            }
                            onClick={() =>
                              setSelected(
                                selected.includes(m.id)
                                  ? selected.filter((id) => id !== m.id)
                                  : [...selected, m.id],
                              )
                            }
                          >
                            <div className="model-top">
                              <strong>{m.name}</strong>
                              {selected.includes(m.id) ? (
                                <Check size={16} />
                              ) : (
                                <Plus size={16} />
                              )}
                            </div>
                            <span className="model-id">{m.id}</span>
                            <div className="model-meta">
                              <span>
                                {m.kind === "decision"
                                  ? "DECISION"
                                  : m.structured
                                    ? "STRUCTURED"
                                    : "TEXT / JSON"}
                              </span>
                              <span>{inputPrice(m)}</span>
                            </div>
                          </button>
                        ))
                      )}
                      {!loadingModels && !visibleModels.length && (
                        <p className="help">No models match these filters.</p>
                      )}
                    </div>
                    <p className="help catalog-count">
                      {models.length} text/decision models in the live catalog ·
                      current prices, no fixed list
                    </p>
                  </details>
                </section>
                <section className="execution-panel">
                  <h3>Run experiment</h3>
                  <p className="run-summary">
                    {rows.length} {rows.length === 1 ? "case" : "cases"} ·{" "}
                    {selected.length} models · {rows.length * selected.length}{" "}
                    calls
                  </p>
                  <button
                    className="primary"
                    disabled={!canRun}
                    onClick={() => void run(false)}
                  >
                    <Play size={16} />
                    {busy ? "Running…" : "Run batch"}
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="secondary"
                    disabled={!canRun}
                    onClick={() => void run(true)}
                  >
                    Test first case
                  </button>
                  <p className="help">
                    Model calls use OpenRouter credits. Up to 4 requests run
                    concurrently. No measurements before execution:{" "}
                    {NOT_MEASURED}.
                  </p>
                </section>
              </div>
            </div>
          )}
          {tab === "results" &&
            (!experiment ? (
              <section className="empty-state">
                <FlaskConical size={40} />
                <h2>{busy ? "Preparing run…" : "No experiment selected."}</h2>
                <p>
                  {busy
                    ? "Validating configuration and models against the live catalog."
                    : "Set up an experiment or reopen one from history."}
                </p>
                <button className="secondary" onClick={() => setTab("runner")}>
                  Set up experiment
                </button>
                <code>{NOT_MEASURED}</code>
              </section>
            ) : (
              <>
                <div className="result-header">
                  <div>
                    <h2>{experiment.name}</h2>
                    <p className="help">
                      {experiment.rows.length}{" "}
                      {experiment.rows.length === 1 ? "case" : "cases"} ·{" "}
                      {experiment.models.length} models · {experiment.status} ·{" "}
                      {new Date(experiment.createdAt).toLocaleString("en-US")}
                    </p>
                  </div>
                  <div className="button-row">
                    <a
                      className="secondary"
                      href={"/api/experiments/" + experiment.id + "/export"}
                    >
                      <ArrowDownToLine size={15} />
                      Download XLSX
                    </a>
                    <button
                      className="text-button"
                      onClick={() =>
                        download(
                          experiment.id + ".json",
                          JSON.stringify(experiment, null, 2),
                        )
                      }
                    >
                      Full JSON
                    </button>
                  </div>
                </div>
                <div className="run-progress">
                  <div>
                    <span>
                      {finished} / {total} requests completed
                    </span>
                    <b>{total ? Math.round((finished / total) * 100) : 0}%</b>
                  </div>
                  <progress value={finished} max={total || 1} />
                </div>
                <section className="section">
                  <div className="section-title">
                    <div>
                      <h2>Model comparison</h2>
                    </div>
                    <span className="muted">
                      Agreement {pct(agreementRate)}
                    </span>
                  </div>
                  <div className="table-scroll">
                    <table className="metrics-table">
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th>Completed</th>
                          <th>Accuracy</th>
                          <th>Avg latency</th>
                          <th>P95</th>
                          <th>Tokens</th>
                          <th>Cost USD</th>
                          <th>Errors / invalid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaries.map((m) => (
                          <tr key={m.model}>
                            <td>
                              <strong>
                                {
                                  experiment.models.find(
                                    (model) => model.id === m.model,
                                  )?.name
                                }
                              </strong>
                              <small>{m.model}</small>
                            </td>
                            <td>
                              {m.completed} / {experiment.rows.length}
                            </td>
                            <td className="accent">
                              {pct(m.accuracy)}
                              {m.scored > 0 && (
                                <small>
                                  {m.correct} / {m.scored} evaluated
                                </small>
                              )}
                            </td>
                            <td>{ms(m.avgLatency)}</td>
                            <td>{ms(m.p95)}</td>
                            <td>{count(m.tokens)}</td>
                            <td>
                              {money(m.cost)}
                              {experiment.runs.some(
                                (r) =>
                                  r.model === m.model &&
                                  r.costSource === "estimated",
                              ) && <small>Includes estimated cost</small>}
                            </td>
                            <td>
                              {m.errors} / {m.invalid}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="help">
                    {golden
                      ? "Golden coverage: " +
                        pct(summaries[0]?.coverage ?? null) +
                        ". Accuracy includes errors and invalid outputs for golden-matched cases."
                      : "Accuracy: NOT MEASURED YET — import golden answers below."}{" "}
                    Latency includes retries and waiting. “—” means unavailable;
                    incomplete totals are not zero.
                  </p>
                </section>
                <section className="section golden-section">
                  <div className="section-title">
                    <div>
                      <h2>Golden dataset</h2>
                    </div>
                    <span className="muted">
                      {experiment.goldenVersions.length
                        ? "Version " + experiment.goldenVersions.length
                        : "Blind evaluation: waiting for golden answers"}
                    </span>
                  </div>
                  <input
                    ref={goldenRef}
                    type="file"
                    accept=".csv,.xlsx"
                    className="file-input"
                    aria-label="Import golden answers"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void importFile(file, true);
                      e.target.value = "";
                    }}
                  />
                  <div className="button-row">
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => goldenRef.current?.click()}
                    >
                      <Upload size={15} />
                      Import golden answers
                    </button>
                    <button
                      className="text-button"
                      onClick={() =>
                        download("golden-demo.csv", csv(demoGolden), "text/csv")
                      }
                    >
                      <ArrowDownToLine size={14} />
                      Download demo golden answers
                    </button>
                    {experiment.rows.every((r) =>
                      demoRows.some(
                        (d) => JSON.stringify(d) === JSON.stringify(r),
                      ),
                    ) && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => {
                          setGoldenData({
                            columns: ["id", "expected", "notes"],
                            rows: demoGolden.filter((r) =>
                              experiment.rows.some(
                                (d) => d[experiment.idColumn] === r.id,
                              ),
                            ),
                          });
                          setGoldenId("id");
                          setGoldenExpected("expected");
                        }}
                      >
                        Use demo golden answers
                      </button>
                    )}
                  </div>
                  {goldenData && (
                    <div className="golden-mapping">
                      <label>
                        ID
                        <select
                          value={goldenId}
                          onChange={(e) => setGoldenId(e.target.value)}
                        >
                          {goldenData.columns.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Expected answer
                        <select
                          value={goldenExpected}
                          onChange={(e) => setGoldenExpected(e.target.value)}
                        >
                          {goldenData.columns.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="primary"
                        onClick={() => void saveGolden()}
                      >
                        Save new version <Check size={16} />
                      </button>
                    </div>
                  )}
                  <p className="help">
                    Golden answers can be imported after execution. Imports
                    create versions; candidates are not called again.
                  </p>
                </section>
                <section className="section">
                  <div className="section-title">
                    <div>
                      <h2>Case explorer</h2>
                    </div>
                    <label className="compact">
                      Filter
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All cases</option>
                        <option value="disagree">Models disagree</option>
                        <option value="wrong">At least one wrong answer</option>
                        <option value="all-correct">All models correct</option>
                        <option value="errors">Errors</option>
                        <option value="invalid">Invalid output</option>
                      </select>
                    </label>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Case</th>
                          <th>Golden</th>
                          {experiment.models.map((m) => (
                            <th key={m.id}>{m.name}</th>
                          ))}
                          <th>Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultRows.map((row) => {
                          const id = row[experiment.idColumn];
                          return (
                            <tr key={id}>
                              <td className="mono">{id}</td>
                              <td>{golden?.[id] ?? "—"}</td>
                              {experiment.models.map((m) => {
                                const r = experiment.runs.find(
                                  (r) => r.caseId === id && r.model === m.id,
                                );
                                return (
                                  <td key={m.id}>
                                    <span
                                      className={
                                        r?.status === "error"
                                          ? "answer error-text"
                                          : golden?.[id] &&
                                              r?.answer === golden[id]
                                            ? "answer good"
                                            : "answer"
                                      }
                                    >
                                      {r
                                        ? r.status === "success"
                                          ? r.answer
                                          : r.status.toUpperCase()
                                        : "PENDING"}
                                    </span>
                                    {r && (
                                      <small>
                                        {ms(r.latencyMs)} · {money(r.costUsd)}
                                      </small>
                                    )}
                                  </td>
                                );
                              })}
                              <td>
                                <button
                                  className="text-button"
                                  onClick={() => setInspect(id)}
                                >
                                  Inspect <ArrowRight size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!resultRows.length && (
                    <p className="help">No cases match this filter.</p>
                  )}
                </section>
              </>
            ))}
          {tab === "history" && (
            <section className="section">
              <div className="section-title">
                <div>
                  <h2>Experiment history</h2>
                </div>
                <button
                  className="icon-button"
                  aria-label="Refresh history"
                  onClick={() =>
                    void jsonRequest("/api/experiments")
                      .then(setHistory)
                      .catch((e) => setError(e.message))
                  }
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              {history.length ? (
                <div className="history-list">
                  {history.map((e) => (
                    <button
                      key={e.id}
                      onClick={() =>
                        void jsonRequest("/api/experiments/" + e.id)
                          .then((data) => {
                            setExperiment(data);
                            setTab("results");
                          })
                          .catch((e) => setError(e.message))
                      }
                    >
                      <div>
                        <strong>{e.name}</strong>
                        <span>
                          {new Date(e.createdAt).toLocaleString("en-US")} ·{" "}
                          {e.status}
                        </span>
                      </div>
                      <span>
                        {e.completed} / {e.total}
                        <ArrowRight size={16} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state small">
                  <History size={32} />
                  <h2>Your first experiment starts here.</h2>
                  <p>
                    Runs are saved in the local results folder, outside Git.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => setTab("runner")}
                  >
                    Set up experiment
                  </button>
                </div>
              )}
            </section>
          )}
          <footer>
            <span>OpenRouter Model Evaluation Kit</span>
            <span>Local experiments · preserved evidence</span>
          </footer>
        </div>
      </main>
      {inspect && experiment && (
        <div className="modal-backdrop" onClick={() => setInspect(null)}>
          <section
            ref={inspectorRef}
            className="inspector"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspector-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-title">
              <div>
                <h2 id="inspector-title">Case {inspect}</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close inspector"
                onClick={() => setInspect(null)}
              >
                <X size={20} />
              </button>
            </div>
            <h3>Input</h3>
            <pre>
              {JSON.stringify(
                experiment.rows.find((r) => r[experiment.idColumn] === inspect),
                null,
                2,
              )}
            </pre>
            <h3>Context / Task</h3>
            <p>{experiment.context}</p>
            <p>{experiment.task}</p>
            <p>
              Golden answer:{" "}
              <strong>{golden?.[inspect] ?? NOT_MEASURED}</strong>
            </p>
            {experiment.runs
              .filter((r) => r.caseId === inspect)
              .map((r) => (
                <article className="inspect-run" key={r.model}>
                  <h3>{r.model}</h3>
                  <div className="inspect-values">
                    <span>
                      Answer <b>{r.answer ?? r.status}</b>
                    </span>
                    <span>
                      Latency <b>{ms(r.latencyMs)}</b>
                    </span>
                    <span>
                      Tokens <b>{count(r.totalTokens)}</b>
                    </span>
                    <span>
                      Cost{" "}
                      <b>
                        {money(r.costUsd)} ({r.costSource})
                      </b>
                    </span>
                    <span>
                      Confidence <b>{pct(r.confidence)}</b>
                    </span>
                  </div>
                  {r.error && <p className="error-text">{r.error}</p>}
                  <details>
                    <summary>
                      Probabilities, request and raw response{" "}
                      <ChevronDown size={15} />
                    </summary>
                    <pre>{JSON.stringify(r, null, 2)}</pre>
                  </details>
                </article>
              ))}
          </section>
        </div>
      )}
    </div>
  );
}
