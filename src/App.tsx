import React, { useCallback, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

// 允许展示的权威域名（可按需增减）
const LINK_WHITELIST = [
  "iso.org",
  "webstore.iec.ch",
  "bsigroup.com",
  "ansi.org",
  "techstreet.com",
  "din.de",
  "sis.se",
];

type ResultItem = {
  iso_number: string;
  title: string;
  clause: string;        // 不知道就 ""
  reason: string;
  links: string[];       // >= 1 个链接（经白名单过滤后仍需 >= 1）
};

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

export default function App() {
  const [apiKey, setApiKey] = useState<string>("");
  const [requirement, setRequirement] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [raw, setRaw] = useState<string>("");
  const [items, setItems] = useState<ResultItem[]>([]);

  const disabled = useMemo(
    () => !apiKey || !requirement || loading,
    [apiKey, requirement, loading]
  );

  const onMatch = useCallback(async () => {
    setLoading(true);
    setItems([]);
    setRaw("");

    try {
      const system = `
You are a functional safety expert.
TASK: Map a user's Safety Requirement to relevant ISO/IEC standards.
STRICT RULES:
- Only output standards you are confident about from your existing knowledge.
- Each item MUST include at least one authoritative reference link (iso.org/standard, webstore.iec.ch, or reputable SDO stores like BSI/ANSI/Techstreet/DIN/SIS).
- If you cannot provide an authoritative link for a candidate, DO NOT include that candidate.
- If you don't know the clause, leave it "" (do NOT guess).
- Output MUST be valid JSON matching this schema:
{
  "items":[
    {
      "iso_number":"ISO 10218-1:2011",
      "title":"Robots and robotic devices — Safety requirements for industrial robots — Part 1",
      "clause":"",             // "" if unknown
      "reason":"short reason",
      "links":["https://..."]  // >=1 link, authoritative only
    }
  ],
  "notes":"optional caveats"
}
      `.trim();

      const user = `
Safety Requirement:
"${requirement}"

Output JSON only. No prose, no markdown.
      `.trim();

      const resp = await axios.post(
        OPENAI_ENDPOINT,
        {
          model: "gpt-5-mini", // 可换 gpt-4o；如需严格 JSON，可尝试 responses API 的 json_mode
          tools: [{ "type": "web_search_preview" }],
          input: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          // 如果你的账号/模型支持，可解注：response_format: { type: "json_object" },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        }
      );
      console.log("Response:", resp.data);
      const content: string =
        resp?.data?.message?.content ?? "";

      setRaw(content);

      // 解析 JSON（容错：若模型返回带杂文，尝试截取花括号）
      let parsed: ResultPayload;
      try {
        parsed = JSON.parse(content) as ResultPayload;
      } catch {
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          parsed = JSON.parse(
            content.slice(firstBrace, lastBrace + 1)
          ) as ResultPayload;
        } else {
          throw new Error("Invalid JSON. Unable to parse response.");
        }
      }

      const cleanItems: ResultItem[] = (parsed.items || [])
        .map((it) => ({
          ...it,
          links: Array.isArray(it.links)
            ? it.links.filter(isWhitelisted)
            : [],
        }))
        .filter(
          (it) =>
            Boolean(it.iso_number) &&
            Boolean(it.title) &&
            it.links.length > 0
        );

      setItems(cleanItems);
    } catch (err) {
      const axErr = err as AxiosError<any>;
      const msg =
        axErr?.response?.data?.error?.message ||
        axErr?.message ||
        "Unknown error";
      setRaw(`Request failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [apiKey, requirement]);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 16,
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>
        ISO Standard Matching (React + axios + OpenAI)
      </h2>
      <p style={{ color: "#666", marginTop: 0 }}>
        This application does not save your API Key. All requests are sent directly from the browser to OpenAI. Please use in a trusted environment.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          OpenAI API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Safety Requirement
        </label>
        <textarea
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          rows={5}
          placeholder={`Example: The collaborative robot shall stop when a human enters the work area.`}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
      </div>

      <button
        onClick={onMatch}
        disabled={disabled}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: disabled ? "#bbb" : "#1677ff",
          color: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Matching..." : "Match ISO Standards"}
      </button>

      <hr style={{ margin: "24px 0" }} />

      <h3>Matching Results</h3>
      {items.length === 0 ? (
        <div style={{ color: "#666" }}>No results or results that failed link validation.</div>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {items.map((it, idx) => (
            <li
              key={`${it.iso_number}-${idx}`}
              style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {it.iso_number}
              </div>
              <div style={{ margin: "4px 0 6px 0" }}>{it.title}</div>
              {it.clause ? (
                <div style={{ marginBottom: 6 }}>Clause: {it.clause}</div>
              ) : (
                <div style={{ marginBottom: 6, color: "#888" }}>
                  Clause: (Not provided)
                </div>
              )}
              <div style={{ marginBottom: 6, color: "#333" }}>{it.reason}</div>
              <div>
                Reference Links:
                {it.links.map((u, i) => (
                  <a
                    key={`${u}-${i}`}
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: 10 }}
                  >
                    {(() => {
                      try {
                        return new URL(u).hostname;
                      } catch {
                        return u;
                      }
                    })()}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 style={{ marginTop: 24 }}>Raw Response (Debug)</h3>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "#f7f7f7",
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          color: "#333",
        }}
      >
        {raw || "(Empty)"}
      </pre>

      <div style={{ marginTop: 16, color: "#666", fontSize: 12 }}>
        📌 Note: Most ISO/IEC standards full text are paid content. Official pages usually only provide access to the standard directory page, not specific clauses.
      </div>
    </div>
  );
}