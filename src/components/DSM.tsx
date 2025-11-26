import type { IR } from "@/common/ir";
import { useMemo, useRef } from "react";

function collectFunctionRequirementPairs(data: IR) {
  const pairs: {
    taskId: string;
    taskName: string;
    functionId: string;
    functionName: string;
    requirementId: string;
    requirementText: string;
  }[] = [];

  if (!data?.tasks) return pairs;

  for (const task of data.tasks) {
    for (const fn of task.functions ?? []) {
      const seen = new Set<string>();
      for (const real of fn.realizations ?? []) {
        for (const prop of real.properties ?? []) {
          for (const inter of prop.interpretations ?? []) {
            for (const req of inter.requirements ?? []) {
              const key = `${fn.id}|${req.id}`;
              if (seen.has(key)) continue;
              seen.add(key);
              pairs.push({
                taskId: task.id,
                taskName: task.taskName,
                functionId: fn.id,
                functionName: fn.functionName,
                requirementId: req.id,
                requirementText: req.text,
              });
            }
          }
        }
      }
    }
  }

  return pairs;
}

function buildMatrix(data: IR) {
  const pairs = collectFunctionRequirementPairs(data);

  const fnOrder: { id: string; name: string }[] = [];
  const reqOrder: { id: string; text: string }[] = [];
  const fnSeen = new Set<string>();
  const reqSeen = new Set<string>();

  for (const p of pairs) {
    if (!fnSeen.has(p.functionId)) {
      fnSeen.add(p.functionId);
      fnOrder.push({ id: p.functionId, name: p.functionName });
    }
    if (!reqSeen.has(p.requirementId)) {
      reqSeen.add(p.requirementId);
      reqOrder.push({ id: p.requirementId, text: p.requirementText });
    }
  }

  if (reqOrder.length === 0) {
    for (const task of data.tasks ?? []) {
      for (const fn of task.functions ?? []) {
        if (!fnSeen.has(fn.id)) {
          fnSeen.add(fn.id);
          fnOrder.push({ id: fn.id, name: fn.functionName });
        }
      }
    }
  }

  const hit = new Set<string>(); // `${fnId}|${reqId}`
  for (const p of pairs) hit.add(`${p.functionId}|${p.requirementId}`);

  return { fnOrder, reqOrder, hit, pairs };
}

export default function DSM({
  data,
  fileBase = "function-requirement-matrix",
  showIds = false,
}: {
  data: IR;
  fileBase?: string;
  showIds?: boolean;
}) {
  const { fnOrder, reqOrder, hit } = useMemo(() => buildMatrix(data), [data]);
  const tableRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-4">
      {/* Header */}
      <header className="text-center mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          Function–Requirement DMM
        </h2>
        <p className="text-xs text-muted-foreground">
          Cross-reference of functions vs. requirements (X = linked)
        </p>
      </header>

      {/* Centered container + max width cap */}
      <div
        ref={tableRef}
        className="mx-auto w-full max-w-[1100px] overflow-x-auto rounded-md border bg-background"
      >
        <table className="table-fixed w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {/* First column: functions */}
              <th className="w-[260px] border px-3 py-2 text-left whitespace-nowrap bg-white">
                Function \ Requirement
              </th>

              {/* Requirement columns (fixed width, wrapping content) */}
              {reqOrder.length === 0 ? (
                <th className="w-[220px] border px-3 py-2 text-left text-gray-500">
                  (No requirements)
                </th>
              ) : (
                reqOrder.map((req) => (
                  <th
                    key={req.id}
                    className="w-[180px] max-w-[220px] border px-3 py-2 text-left align-bottom"
                  >
                    <div className="font-medium text-sm break-words line-clamp-3">
                      {req.text}
                    </div>
                    {showIds && (
                      <div className="text-[10px] text-gray-500 break-all">
                        [{req.id}]
                      </div>
                    )}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {fnOrder.length === 0 ? (
              <tr>
                <td
                  className="border px-3 py-2 text-gray-500 bg-gray-50 text-center"
                  colSpan={Math.max(2, reqOrder.length + 1)}
                >
                  (No functions)
                </td>
              </tr>
            ) : (
              fnOrder.map((fn) => (
                <tr key={fn.id}>
                  {/* Function name column (fixed width) */}
                  <td className="w-[260px] border px-3 py-2 whitespace-nowrap bg-gray-50 align-top">
                    <div className="font-medium text-sm truncate" title={fn.name}>
                      {fn.name || "(unnamed function)"}
                    </div>
                    {showIds && (
                      <div className="text-[10px] text-gray-500 break-all">
                        [{fn.id}]
                      </div>
                    )}
                  </td>

                  {/* Matrix cells */}
                  {reqOrder.length === 0 ? (
                    <td className="border px-3 py-2 text-gray-500 text-center">
                      (No requirements)
                    </td>
                  ) : (
                    reqOrder.map((req) => (
                      <td
                        key={req.id}
                        className="border px-3 py-2 text-center align-middle"
                        title={hit.has(`${fn.id}|${req.id}`) ? "Linked" : "—"}
                      >
                        {hit.has(`${fn.id}|${req.id}`) ? "X" : ""}
                      </td>
                    ))
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}