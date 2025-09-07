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

  // 唯一 functions / requirements（按出现顺序）
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

  // 若没有 requirement，但你仍想显示所有 function 行，可从 tasks 中补齐函数行
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

  // 布尔矩阵映射
  const hit = new Set<string>(); // `${fnId}|${reqId}`
  for (const p of pairs) {
    hit.add(`${p.functionId}|${p.requirementId}`);
  }

  return { fnOrder, reqOrder, hit, pairs };
}

export default function DSM({
  data,
  fileBase = "function-requirement-matrix",
  showIds = false,
}: {
  data: IR;
  fileBase?: string;       // 导出文件名前缀
  showIds?: boolean;       // 是否在表格中同时显示 id
}) {
  const { fnOrder, reqOrder, hit } = useMemo(() => buildMatrix(data), [data]);
  const tableRef = useRef<HTMLDivElement>(null);

  // const handleExportCSV = () => {
  //   downloadCSV(fileBase, reqOrder, fnOrder, hit);
  // };

  // const handleExportPDF = () => {
  //   const el = tableRef.current;
  //   if (!el) return;
  //   exportTableToPDF(el, fileBase);
  // };

  return (
    <div className="space-y-3">
      {/* <div className="flex gap-2">
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 rounded bg-blue-600 text-white"
        >
          Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="px-3 py-2 rounded bg-emerald-600 text-white"
        >
          Export PDF
        </button>
      </div> */}

      <div ref={tableRef} className="overflow-auto max-w-full">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-3 py-2 text-left whitespace-nowrap">
                Function \ Requirement
              </th>
              {reqOrder.length === 0 ? (
                <th className="border px-3 py-2 text-left text-gray-500">
                  (No requirements)
                </th>
              ) : (
                reqOrder.map((req) => (
                  <th key={req.id} className="border px-3 py-2 text-left align-bottom">
                    <div className="font-medium">{req.text}</div>
                    {showIds && (
                      <div className="text-xs text-gray-500">[{req.id}]</div>
                    )}
                  </th>
                ))
              )}
            </tr>
          </thead>

            <tbody>
            {fnOrder.length === 0 ? (
              <tr>
                <td className="border px-3 py-2 text-gray-500" colSpan={Math.max(2, reqOrder.length + 1)}>
                  (No functions)
                </td>
              </tr>
            ) : (
              fnOrder.map((fn) => (
                <tr key={fn.id}>
                  <td className="border px-3 py-2 whitespace-nowrap">
                    <div className="font-medium">{fn.name}</div>
                    {showIds && (
                      <div className="text-xs text-gray-500">[{fn.id}]</div>
                    )}
                  </td>

                  {reqOrder.length === 0 ? (
                    <td className="border px-3 py-2 text-gray-500">(No requirements)</td>
                  ) : (
                    reqOrder.map((req) => (
                      <td
                        key={req.id}
                        className="border px-3 py-2 text-center align-middle"
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
    </div>
  );
}