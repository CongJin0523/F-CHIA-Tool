// src/pages/Docs.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Docs() {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">F‑CHIA Tool · Docs</h1>
        <p className="text-muted-foreground mt-2">
          A quick guide to the workflow: Diagram → Table → FTA. Learn how zones,
          tasks, nodes, and exports work together.
        </p>
      </header>

      {/* Quick links */}
      <nav className="mb-10">
        <ul className="flex flex-wrap gap-2 text-sm">
          <li><a href="#overview" className="underline-offset-4 hover:underline">Overview</a></li>
          <li><a href="#workflow" className="underline-offset-4 hover:underline">Workflow</a></li>
          <li><a href="#zones" className="underline-offset-4 hover:underline">Zones</a></li>
          <li><a href="#diagram" className="underline-offset-4 hover:underline">Diagram</a></li>
          <li><a href="#table" className="underline-offset-4 hover:underline">Table</a></li>
          <li><a href="#fta" className="underline-offset-4 hover:underline">FTA</a></li>
          <li><a href="#export" className="underline-offset-4 hover:underline">Export / Import</a></li>
          <li><a href="#shortcuts" className="underline-offset-4 hover:underline">Shortcuts</a></li>
          <li><a href="#faq" className="underline-offset-4 hover:underline">FAQ</a></li>
        </ul>
      </nav>

      {/* Content */}
      <section id="overview" className="prose max-w-none dark:prose-invert">
        <h2>Overview</h2>
        <p>
          F‑CHIA Tool helps you identify hazards (Diagram), review & align
          requirements/standards (Table), and derive fault trees (FTA). Data is
          organized by <strong>zones</strong> and persisted locally.
        </p>
      </section>

      <section id="workflow" className="prose max-w-none dark:prose-invert mt-10">
        <h2>Workflow</h2>
        <ol>
          <li>
            <strong>Diagram:</strong> Build the functional/hazard graph per zone.
            Use auto‑layout to tidy up.
          </li>
          <li>
            <strong>Table:</strong> Edit names, add deviations/causes/consequences,
            and match ISO standards.
          </li>
          <li>
            <strong>FTA:</strong> From a task row, create an FTA. The task becomes
            the Top Event. Switch between FTAs via the task selector.
          </li>
        </ol>
      </section>

      <section id="zones" className="prose max-w-none dark:prose-invert mt-10">
        <h2>Zones</h2>
        <ul>
          <li>Use the header’s zone selector to create/rename/delete zones.</li>
          <li>Each zone has its own graph (nodes/edges) and table view.</li>
          <li>Export/Import includes all zones and the currently selected zone.</li>
        </ul>
      </section>

      <section id="diagram" className="prose max-w-none dark:prose-invert mt-10">
        <h2>Diagram (Hazard Identification)</h2>
        <ul>
          <li>Drag nodes from the left sidebar onto the canvas.</li>
          <li>Connect nodes; invalid connections are rejected with a toast.</li>
          <li>Use the floating “Auto Layout” button to clean up the graph.</li>
          <li>All changes persist to local storage per zone.</li>
        </ul>
      </section>

      <section id="table" className="prose max-w-none dark:prose-invert mt-10">
        <h2>Table (Check & Standard Matching)</h2>
        <ul>
          <li>Edits here write back to the underlying graph nodes (names, text, etc.).</li>
          <li>Add deviations, causes, consequences, and requirements.</li>
          <li>Use “Matching (AI)” or “Add Manually” to associate ISO standards.</li>
          <li>
            “Create FTA” is enabled only when a task is structurally complete
            (functions → realizations → properties → interpretations).
          </li>
        </ul>
      </section>

      <section id="fta" className="prose max-w-none dark:prose-invert mt-10">
        <h2>FTA</h2>
        <ul>
          <li>Creating an FTA from the Table seeds a Top Event for that task.</li>
          <li>FTAs are stored per (zoneId, taskId) and selectable in the FTA page.</li>
          <li>Gate type changes persist on the node (e.g., AND/OR/XOR/INHIBIT).</li>
          <li>Optional right‑side handle shows only for specific gates (e.g., INHIBIT).</li>
        </ul>
      </section>

      <section id="export" className="prose max-w-none dark:prose-invert mt-10">
        <h2>Export / Import</h2>
        <ul>
          <li>Use <strong>File → Export JSON</strong> to download all zones & graphs.</li>
          <li>
            Use <strong>File → Import JSON…</strong> to restore zones. The selected
            zone will auto‑layout; Diagram listens and fits the view.
          </li>
        </ul>
      </section>

      <section id="shortcuts" className="prose max-w-none dark:prose-invert mt-10">
        <h2>Shortcuts</h2>
        <ul>
          <li><kbd>Drag</kbd> to place nodes.</li>
          <li><kbd>Connect</kbd> by dragging from a node’s handle.</li>
          <li><kbd>Auto Layout</kbd> via the floating button in Diagram/FTA.</li>
        </ul>
      </section>

      {/* FAQ */}
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
        Last updated: this page reflects the current UI (zones, Diagram/Table/FTA,
        export/import, and auto layout).
      </footer>
    </main>
  );
}