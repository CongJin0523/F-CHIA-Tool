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
function extractResults(respData) {
  // 1) Find the assistant "message" block
  const msg = respData.output?.find(o => o.type === "message");
  if (!msg) throw new Error("No assistant message found in response.output");

  // 2) Inside it, find the output_text chunk
  const textPart = msg.content?.find(c => c.type === "output_text");
  if (!textPart?.text) throw new Error("No output_text found inside message.content");

  // 3) It's a JSON string matching your schema — parse it
  const parsed = JSON.parse(textPart.text);

  // 4) Your schema's payload lives at parsed.results
  if (!Array.isArray(parsed.results)) {
    throw new Error("Parsed payload missing results[]");
  }
  return parsed.results;
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
- Return data that matches the provided JSON schema exactly.
      `.trim();

      const user = `
Safety Requirement:
"${requirement}"
      `.trim();


      const resp = await axios.post(
        OPENAI_ENDPOINT,
        {
          model: "gpt-5-mini",
          tools: [{
            "type": "web_search_preview",
            "search_context_size": "low",
          }],
          input: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "iso_standard_matching",
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
            }
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 300000,
        }
      );
      console.log("Response_alll:", resp.data);
      const results = extractResults(resp.data);
      // Example: print ISO numbers
      for (const r of results) {
        console.log(r.iso_number, "-", r.title);
      }


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