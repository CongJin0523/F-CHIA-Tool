// src/components/iso-matching-dialog.tsx
"use client"
import React, { useCallback, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { LINK_WHITELIST, type ResultItem } from "@/common/iso-match-tool"; 
const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";



// export type ResultItem = {
//   iso_number: string;
//   title: string;
//   reason: string;
//   links: string[];
// };

type ResultPayload = {
  items: ResultItem[];
  notes?: string;
};

function isWhitelisted(url: string): boolean {
  try {
    const u = new URL(url);
    return LINK_WHITELIST.some(
      (d) => u.hostname === d || u.hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

function extractResults(respData: any) {
  const msg = respData.output?.find((o: any) => o.type === "message");
  if (!msg) throw new Error("No assistant message found in response.output");

  const textPart = msg.content?.find((c: any) => c.type === "output_text");
  if (!textPart?.text) throw new Error("No output_text found inside message.content");

  const parsed = JSON.parse(textPart.text);
  if (!Array.isArray(parsed.results)) {
    throw new Error("Parsed payload missing results[]");
  }
  return parsed.results as ResultItem[];
}

// ---- 表单 schema（选择匹配项用） ----
const SelectSchema = z.object({
  selected: z.array(z.string()).min(1, "Select at least one standard."),
});

type SelectFormValues = z.infer<typeof SelectSchema>;

export interface IsoMatchingDialogProps {
  /** 触发器：放一个按钮进来即可（通常是“Matching”） */
  trigger: React.ReactNode;
  /** 默认的 Safety Requirement（可选） */
  defaultRequirement?: string;
  /** 匹配确认回调（把勾选的 items 传回父组件） */
  onConfirm?: (items: ResultItem[]) => void;

  mockResponse?: any;
}

export default function IsoMatchingDialog({
  trigger,
  defaultRequirement = "",
  onConfirm,
  mockResponse,
}: IsoMatchingDialogProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [requirement, setRequirement] = useState(defaultRequirement);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState("");
  const [items, setItems] = useState<ResultItem[]>([]);
  const [error, setError] = useState("");

  const canMatch = useMemo(
    () => !!apiKey && !!requirement && !loading,
    [apiKey, requirement, loading]
  );

  const form = useForm<SelectFormValues>({
    resolver: zodResolver(SelectSchema),
    defaultValues: { selected: [] },
  });

  const [selected, setSelected] = useState<string[]>([]);

  const onMatch = useCallback(async () => {
    setLoading(true);
    setRaw("");
    setItems([]);
    setError("");

    try {
      let respData: any;
      if (mockResponse) {
        // 测试用的 Mock 数据
        respData = mockResponse;
      } else {
      const system = `
You are a functional safety expert.
TASK: Map a user's Safety Requirement to relevant ISO/IEC standards.
STRICT RULES:
- Only output standards you are confident about from your existing knowledge.
- Each item MUST include at least one authoritative reference link (iso.org/standard, webstore.iec.ch, or reputable SDO stores like BSI/ANSI/Techstreet/DIN/SIS).
- If you cannot provide an authoritative link for a candidate, DO NOT include that candidate.
- Return data that matches the provided JSON schema exactly.
      `.trim();

      const user = `Safety Requirement:\n"${requirement}"`;

      const resp = await axios.post(
        OPENAI_ENDPOINT,
        {
          model: "gpt-5-mini",
          tools: [{ type: "web_search_preview", search_context_size: "low" }],
          input: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "standard_matching",
              description: "Match safety requirements to ISO/IEC standards",
              schema: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        iso_number: { type: "string" },
                        title: { type: "string" },
                        reason: { type: "string" },
                        links: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 1,
                        },
                      },
                      required: ["iso_number", "title", "reason", "links"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 300000,
        }
      );
      respData = resp.data;
    }

      const results = extractResults(respData);

      // 过滤掉非白名单链接的项；并清洗 links
      const filtered = results
        .map((r) => ({
          ...r,
          links: (r.links || []).filter(isWhitelisted),
        }))
        .filter((r) => r.links.length > 0);

      setItems(filtered);
      setSelected([]); // 每次匹配后清空选择
      setRaw(JSON.stringify(results, null, 2));
    } catch (err) {
      const axErr = err as AxiosError<any>;
      const msg =
        axErr?.response?.data?.error?.message ||
        axErr?.message ||
        "Unknown error";
      setError(msg);
      setRaw(`Request failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [apiKey, requirement]);

  const handleConfirm = useCallback(() => {
    const chosen = items.filter((it) =>
      selected.includes(keyOf(it))
    );
    onConfirm?.(chosen);
    setOpen(false);
  }, [items, selected, onConfirm]);

  // 为每个 item 生成唯一 key
  const keyOf = (it: ResultItem) =>
    `${it.iso_number}::${it.title}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Standard Matching</DialogTitle>
          <DialogDescription>
            Provide your OpenAI API key and a safety requirement. Click “Match” to fetch suggested ISO/IEC standards. Then select the items to apply.
          </DialogDescription>
        </DialogHeader>

        {/* 输入区 */}
        <div className="space-y-3">
          <div>
            <Label>OpenAI API Key</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div>
            <Label>Safety Requirement</Label>
            <Textarea
              rows={4}
              placeholder="e.g., The collaborative robot shall stop when a human enters the work area."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onMatch} disabled={!canMatch}>
              {loading ? "Matching..." : "Match"}
            </Button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </div>

        {/* 结果选择区 */}
        <div className="mt-4">
          <Form
            {...form}
          >
            <form
              className="space-y-4"
              // 这里不强制提交；Confirm 走外部按钮
              onSubmit={(e) => e.preventDefault()}
            >
              <FormField
                control={form.control}
                name="selected"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base">
                        Matching Results
                      </FormLabel>
                      <FormDescription>
                        Select standards to apply. Only items with authoritative links are shown.
                      </FormDescription>
                    </div>

                    {items.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No results yet.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-auto pr-1 space-y-3">
                        {items.map((it) => {
                          const k = keyOf(it);
                          const checked = selected.includes(k);
                          return (
                            <FormItem
                              key={k}
                              className="border rounded-md p-3"
                            >
                              <div className="flex items-start gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => {
                                      const v = Boolean(c);
                                      setSelected((prev) =>
                                        v
                                          ? Array.from(new Set([...prev, k]))
                                          : prev.filter((id) => id !== k)
                                      );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1">
                                  <FormLabel className="text-sm font-medium">
                                    {it.iso_number} — {it.title}
                                  </FormLabel>
                                  <div className="text-xs text-muted-foreground">
                                    {it.reason}
                                  </div>
                                  <div className="text-xs">
                                    Links:&nbsp;
                                    {it.links.map((u, i) => (
                                      <a
                                        key={`${k}-link-${i}`}
                                        href={u}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline mr-2"
                                      >
                                        {safeHost(u)}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </FormItem>
                          );
                        })}
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={items.length === 0 || selected.length === 0}
          >
            Confirm
          </Button>
        </div>

        {/* Debug 区域（可选）
        <div className="mt-3">
          <div className="text-xs text-muted-foreground font-medium">
            Raw Response (Debug)
          </div>
          <pre className="max-h-48 overflow-auto text-xs rounded-md bg-neutral-950 text-white p-3">
            {raw || "(Empty)"}
          </pre>
        </div> */}
      </DialogContent>
    </Dialog>
  );
}

function safeHost(u: string) {
  try {
    return new URL(u).href;
  } catch {
    return u;
  }
}