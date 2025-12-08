// src/pages/Docs.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OnThisPage } from "@/components/OnThisPage";

export default function Docs() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      {/* Left: content */}
      <article id="docs-content" className="prose max-w-none dark:prose-invert">
        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">F-CHIA Tool · Docs</h1>
          <p className="text-muted-foreground mt-2">
            A quick guide to the workflow: Diagram → Table → FTA. Learn how zones,
            tasks, nodes, and exports work together.
          </p>
        </header>

        {/* Quick links */}
        <nav className="mb-10">
          <ul className="flex flex-wrap gap-2 text-sm">
            <li>
              <a href="#overview" className="underline-offset-4 hover:underline">
                Overview
              </a>
            </li>
            <li>
              <a href="#workflow" className="underline-offset-4 hover:underline">
                Workflow
              </a>
            </li>
            <li>
              <a href="#zones" className="underline-offset-4 hover:underline">
                Zones
              </a>
            </li>
            <li>
              <a href="#diagram" className="underline-offset-4 hover:underline">
                Diagram
              </a>
            </li>
            <li>
              <a href="#table" className="underline-offset-4 hover:underline">
                Table
              </a>
            </li>
            <li>
              <a href="#fta" className="underline-offset-4 hover:underline">
                FTA
              </a>
            </li>
            <li>
              <a href="#export" className="underline-offset-4 hover:underline">
                Export / Import
              </a>
            </li>
            <li>
              <a href="#faq" className="underline-offset-4 hover:underline">
                FAQ
              </a>
            </li>
          </ul>
        </nav>

        {/* --------------------------- */}
        {/* Overview */}
        {/* --------------------------- */}
        <section id="overview">
          <h2>Overview</h2>
          <p>
            F-CHIA Tool helps you identify hazards (Diagram), review &amp; align
            requirements/standards (Table), and derive fault trees (FTA). Data is
            organized by <strong>zones</strong> and persisted locally.
          </p>

          <figure className="my-6 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/overall-layout.png?raw=1"
              alt="Overview layout of the F-CHIA Tool"
              className="rounded-md border shadow-sm"
            />
          </figure>
        </section>

        {/* --------------------------- */}
        {/* Workflow */}
        {/* --------------------------- */}
        <section id="workflow" className="mt-10">
          <h2>Workflow</h2>
          <ol>
            <li>
              <strong>Create Project</strong> → Start with a base zone.
            </li>
            <li>
              <strong>Diagram</strong> → Perform structured F-CHIA hazard identification.
            </li>
            <li>
              <strong>Table</strong> → Validate results &amp; use DMM traceability.
            </li>
            <li>
              <strong>FTA</strong> → Auto-derive fault trees from tasks.
            </li>
          </ol>

          <p>You can create a project via <strong>File → New Project</strong>.</p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/create-new-project.png?raw=1"
              alt="Create New Project dialog"
              className="rounded-md border shadow-sm"
              width={200}
            />
          </figure>

          <p>
            <strong>Warning:</strong> This clears all existing data. Export your data via{" "}
            <strong>File → Export JSON</strong> if you want to preserve it.
          </p>
        </section>

        {/* --------------------------- */}
        {/* Zones */}
        {/* --------------------------- */}
        <section id="zones" className="mt-10">
          <h2>Zones</h2>
          <ul>
            <li>Create, rename, or delete zones from the header’s zone selector.</li>
            <li>Each zone has its own graph (nodes/edges) and table workspace.</li>
            <li>Export/import includes all zones and their structures.</li>
          </ul>
        </section>

        {/* --------------------------- */}
        {/* Diagram */}
        {/* --------------------------- */}
        <section id="diagram" className="mt-10">
          <h2>Diagram (Hazard Identification)</h2>

          <p>Follow the workflow below when constructing the diagram:</p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/flow-chart.png?raw=1"
              alt="F-CHIA analysis flow chart"
              className="rounded-md border shadow-sm"
              width={400}
            />
          </figure>

          <p>
            Each step in the method is represented as a node. Hovering over a node shows
            tips and examples to guide what should be filled in:
          </p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/hover.gif?raw=1"
              alt="Hover tooltip on node"
              className="rounded-md border shadow-sm"
              width={400}
            />
          </figure>

          <p>
            Clicking <strong>Add Node</strong> automatically creates the correct next
            node type (e.g., a Task Node after a Zone Node), reducing manual selection:
          </p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/add_node.gif?raw=1"
              alt="Add node interaction"
              className="rounded-md border shadow-sm"
              width={400}
            />
          </figure>

          <p>You can drag to connect nodes and form edges:</p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/add_edge.gif?raw=1"
              alt="Add edge interaction"
              className="rounded-md border shadow-sm"
              width={400}
            />
          </figure>

          <p>If a connection is invalid, a warning popup is shown and the edge is blocked:</p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/error-edge.gif?raw=1"
              alt="Invalid edge warning"
              className="rounded-md border shadow-sm"
              width={200}
            />
          </figure>
        </section>

        {/* --------------------------- */}
        {/* Table */}
        {/* --------------------------- */}
        <section id="table" className="mt-10">
          <h2>Table (Check &amp; Standard Matching)</h2>

          <p>
            After completing the diagram, navigate to the Table workspace via the stepper
            or <strong>Go To → Table</strong>.
          </p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/table.png?raw=1"
              alt="Table workspace"
              className="rounded-md border shadow-sm"
              width={400}
            />
          </figure>

          <p>
            The Function–Requirement DMM helps confirm whether the functional reasoning
            and requirement mapping are valid. You may also use the OpenAI API to quickly
            filter safety standards relevant to each requirement.
          </p>
        </section>

        {/* --------------------------- */}
        {/* FTA */}
        {/* --------------------------- */}
        <section id="fta" className="mt-10">
          <h2>FTA</h2>

          <p>
            From the Table, selecting <strong>Create FTA</strong> for a task generates an
            FTA whose:
          </p>
          <ul>
            <li>
              <strong>Top Event</strong> → derived from the Task
            </li>
            <li>
              <strong>Basic Events</strong> → derived from Causes
            </li>
            <li>
              <strong>Checklist</strong> → ensures all causes are fully considered
            </li>
          </ul>

          <p>
            Then go to <strong>Go To → FTA</strong> or use the stepper. The canvas
            interaction works similarly to the F-CHIA diagram editor.
          </p>

          <figure className="my-4 flex justify-center">
            <img
              src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/fta.png?raw=1"
              alt="FTA workspace"
              className="rounded-md border shadow-sm"
              width={400}
            />
          </figure>
        </section>

        {/* --------------------------- */}
        {/* Export */}
        {/* --------------------------- */}
        <section id="export" className="mt-10">
          <h2>Export / Import</h2>
          <ul>
            <li>
              Use <strong>File → Export JSON</strong> to download your entire project.
            </li>
            <li>
              Use <strong>File → Import JSON…</strong> to restore a saved project.
            </li>
            <li>Diagrams automatically re-layout after import.</li>
          </ul>
        </section>

        {/* --------------------------- */}
        {/* FAQ */}
        {/* --------------------------- */}
        <section id="faq" className="mt-12">
          <h2 className="text-xl font-semibold mb-4">FAQ</h2>

          <Accordion type="single" collapsible className="w-full" defaultValue="faq-1">
            <AccordionItem value="faq-1">
              <AccordionTrigger>Why is “Create FTA” disabled for my task?</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p>
                  The task must be structurally complete: it needs at least one function,
                  realization, property, and interpretation. The button stays disabled
                  until the graph has all required parts.
                </p>
                <p>
                  Tip: Open the Diagram and finish wiring the missing levels, then come
                  back to the Table.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2">
              <AccordionTrigger>How do I switch between different FTAs?</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p>
                  In the FTA page, use the task selector (it lists tasks that already
                  have FTA stores). Selecting a task re‑mounts the canvas and restores
                  its nodes/edges from local storage.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3">
              <AccordionTrigger>Where is my data stored?</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p>
                  Data is persisted in the browser’s local storage by zone and by
                  (zoneId, taskId) for FTAs. Export JSON if you need to back it up
                  or share it.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4">
              <AccordionTrigger>Auto‑layout didn’t run after import—what now?</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p>
                  The Diagram listens for a <code>graph-imported</code> event and fits the
                  view. If it didn’t trigger, click the floating “Auto Layout” button
                  once to tidy the graph.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5">
              <AccordionTrigger>Can I add a right‑side handle only for specific gates?</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p>
                  Yes. In your logic node, render the right handle conditionally, e.g.
                  only when gate type is <code>inhibit</code>. You can also prevent node
                  type changes if the handle already has edges.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-6">
              <AccordionTrigger>How do names and gate types persist?</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p>
                  We store editable values (like task names and logic gate type) in the
                  node’s <code>data</code>, and update via React Flow’s
                  <code>updateNodeData</code>. This keeps changes persistent across views.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Footer note */}
        <footer className="mt-10 text-xs text-muted-foreground">
          Last updated: reflects current UI for Diagram, Table, FTA, zones, and export.
        </footer>
      </article>

      {/* Right: On This Page (sticky) */}
      <aside className="hidden lg:block">
        <OnThisPage className="sticky top-16" />
      </aside>
    </main>
  );
}