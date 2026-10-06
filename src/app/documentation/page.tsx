import { ArrowLeft, ArrowUpRight } from "lucide-react";
import ApiReference from "./api-reference";
export default function DocumentationPage() {
  return (
    <main className="documentation">
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
        <a className="text-button" href="/">
          <ArrowLeft size={16} />
          Back to experiments
        </a>
      </header>
      <div className="workspace">
        <div className="page-heading">
          <div>
            <h1>Documentation</h1>
            <p className="subheading">
              From your first case to a comparison you can explain.
            </p>
          </div>
          <a
            className="text-button"
            href="/api/openapi"
            target="_blank"
            rel="noreferrer"
          >
            OpenAPI JSON
            <ArrowUpRight size={16} />
          </a>
        </div>
        <nav className="guide-navigation" aria-label="Documentation sections">
          <a href="#getting-started">Getting started</a>
          <a href="#fundamentals">Evaluation fundamentals</a>
          <a href="#api-reference">API reference</a>
        </nav>
        <section id="getting-started" className="guide-section">
          <h2>Run your first experiment</h2>
          <p className="guide-intro">
            Start with one case. Confirm the outputs and measurements before
            spending credits on the full dataset.
          </p>
          <ol className="guide-steps">
            <li>
              <h3>Connect OpenRouter locally</h3>
              <p>
                Set <code>OPENROUTER_API_KEY</code> in the ignored{" "}
                <code>.env.local</code> file and restart the app. One key
                accesses compatible generative and decision models through
                OpenRouter. Keep the key out of the browser, datasets, exports
                and Git.
              </p>
            </li>
            <li>
              <h3>Import input cases</h3>
              <p>
                Upload CSV or XLSX, or choose{" "}
                <strong>Use 100 fictional cases</strong>. The first worksheet is
                read for XLSX; the pilot accepts 1–100 populated rows and files
                up to 2 MB. Each row is an independent case. Input cases do not
                need correct answers.
              </p>
            </li>
            <li>
              <h3>Map the columns</h3>
              <p>
                Choose a unique, nonempty <strong>ID column</strong> and the{" "}
                <strong>Input columns</strong> the models should see. Unchecked
                fields stay out of the prompt. Store XLSX IDs as text to
                preserve leading zeros. IDs join results to golden answers
                later.
              </p>
            </li>
            <li>
              <h3>Define the task and output choices</h3>
              <p>
                Provide context, the exact task and one{" "}
                <code>LABEL: definition</code> per allowed output. Use 2–20
                choices. The same semantic context, input, question and choices
                go to every candidate. The current pilot supports enum
                classification, rather than free-text semantic scoring.
              </p>
            </li>
            <li>
              <h3>Select candidate models</h3>
              <p>
                The live catalog supplies compatible models and prices. Choose
                up to four candidates. Jev uses native typed decisions;
                generative models use structured JSON where supported. A catalog
                listing is not a guarantee that a provider will serve a specific
                request successfully.
              </p>
            </li>
            <li>
              <h3>Test the first case, then run the batch</h3>
              <p>
                Choose <strong>Test first case</strong>. Inspect its outputs,
                usage and errors. When the configuration is sound, choose{" "}
                <strong>Run batch</strong>. The backend limits concurrency to
                four calls, bounds retries and saves completed results
                incrementally. Calls consume your OpenRouter credits; importing,
                comparing or exporting an existing run does not.
              </p>
            </li>
            <li>
              <h3>Import golden answers after execution</h3>
              <p>
                Open <strong>Results</strong>, then{" "}
                <strong>Import golden answers</strong>. Map its ID and
                expected-answer columns. Order does not matter: the join uses
                IDs. Expected answers must exactly match the allowed choices.
                Partial coverage is supported and displayed; duplicate or
                unknown IDs are rejected. Each import appends a version without
                repeating candidate calls.
              </p>
            </li>
            <li>
              <h3>Compare, inspect and download</h3>
              <p>
                Use the comparison table and case filters.{" "}
                <strong>Inspect</strong> shows the input, outputs, returned
                probabilities and raw redacted metadata.{" "}
                <strong>Download XLSX</strong> includes Inputs, Model results,
                Comparison, Golden and Experiment worksheets.{" "}
                <strong>Full JSON</strong> retains raw bodies, pricing snapshots
                and all golden versions. Reopen saved runs from{" "}
                <strong>History</strong>.
              </p>
            </li>
          </ol>
          <div className="format-examples">
            <div>
              <h3>Input dataset — fictional example</h3>
              <pre>
                id,company,employees,signal{"\n"}001,Fictional Acme,500,Demo
                requested
              </pre>
            </div>
            <div>
              <h3>Golden dataset — teaching label</h3>
              <pre>
                id,expected,notes{"\n"}001,P1,Review this rule-authored teaching
                label
              </pre>
            </div>
          </div>
        </section>
        <section id="fundamentals" className="guide-section">
          <h2>Understand what you are measuring</h2>
          <p className="guide-intro">
            A model call produces an answer. Evaluation connects that answer to
            evidence, a reference and an explicit scoring rule.
          </p>
          <dl className="fundamentals">
            <div>
              <dt>Provider abstraction</dt>
              <dd>
                A canonical task carries the same meaning across different APIs.
                Chat and Decisions have different wire formats, but the
                experimental task stays equivalent. In an interview, explain why
                a native decision endpoint is preferable to asking a decision
                model to generate JSON.
              </dd>
            </div>
            <div>
              <dt>Golden answers and blind evaluation</dt>
              <dd>
                The golden dataset is your reference, not a provider feature.
                Importing it afterward supports a blind workflow: obtain outputs
                first, then score them. Reference quality determines how
                meaningful accuracy is. Fictional rule-authored labels are for
                learning, not independent benchmark truth.
              </dd>
            </div>
            <div>
              <dt>Accuracy and coverage</dt>
              <dd>
                Accuracy is correct answers divided by completed golden-matched
                calls, including failed and invalid outputs in that denominator.
                Coverage is the fraction of input cases with golden answers.
                Partial coverage can bias conclusions; always report it.
              </dd>
            </div>
            <div>
              <dt>Agreement is not correctness</dt>
              <dd>
                Pairwise agreement compares successful candidate outputs on the
                same case. It does not need golden data. Models can agree and
                all be wrong. Failed outputs are excluded from agreement and
                counted separately as errors.
              </dd>
            </div>
            <div>
              <dt>Latency</dt>
              <dd>
                The backend uses high-resolution elapsed timing. Reported
                latency includes retry attempts and backoff, so it represents
                the request experience rather than pure model compute. P50, P95
                and P99 use interpolation. One or two cases cannot establish a
                reliable tail-latency distribution.
              </dd>
            </div>
            <div>
              <dt>Tokens and cost</dt>
              <dd>
                Provider-reported usage and cost take priority. Pricing is
                snapshotted per run. Restricted price-based estimates are
                labeled. Missing token or cost values remain unavailable;
                incomplete sums are not silently treated as zero. Blank workbook
                cells mean missing measurements.
              </dd>
            </div>
            <div>
              <dt>Confidence and probabilities</dt>
              <dd>
                Typed Decisions may return confidence and per-choice
                probabilities, which are preserved. Generative confidence stays
                null. Returned confidence is not proof of correctness;
                calibration needs representative labeled data, not a single
                reassuring score.
              </dd>
            </div>
            <div>
              <dt>Reproducibility</dt>
              <dd>
                Each new execution creates a separate experiment with its
                mapping, dataset hash, exact context/task/choices, prompt
                version, model IDs, pricing, timing and raw metadata. Golden
                versions are appended. This lets you explain a result from
                evidence rather than a screenshot alone.
              </dd>
            </div>
            <div>
              <dt>Local persistence and limits</dt>
              <dd>
                Runs live in the ignored <code>results/</code> folder. Keep one
                server process per project. Completed calls survive normal UI
                navigation, but automatic resume after a process crash is not
                implemented. No PostgreSQL or Supabase is required.
              </dd>
            </div>
            <div>
              <dt>What comes next</dt>
              <dd>
                Semantic scoring, LLM-as-a-Judge, human review, LangGraph,
                Langfuse, Pareto analysis and learned routing are future layers.
                They are not active features in this pilot. Establish a useful,
                reproducible baseline first.
              </dd>
            </div>
          </dl>
        </section>
        <section id="api-reference" className="guide-section">
          <div className="section-title">
            <div>
              <h2>API reference</h2>
            </div>
            <a
              className="text-button"
              href="/api/openapi"
              target="_blank"
              rel="noreferrer"
            >
              View specification
              <ArrowUpRight size={16} />
            </a>
          </div>
          <p className="guide-intro">
            Swagger documents the app's local endpoints. Open an operation to
            inspect its request and response contract. “Try it out” is optional;
            starting an experiment makes real, potentially paid calls. Never
            enter your provider key here.
          </p>
          <p className="help">
            Requests stay on this app's origin. External Swagger validation is
            disabled. Schema-generated examples are documentation, not measured
            benchmark results.
          </p>
          <ApiReference />
        </section>
        <footer>
          <span>OpenRouter Model Evaluation Kit</span>
          <span>Local experiments · preserved evidence</span>
        </footer>
      </div>
    </main>
  );
}
