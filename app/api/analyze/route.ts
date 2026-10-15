import { NextResponse } from "next/server";
import { analyseText } from "@/lib/analysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = Array.isArray(body.records) ? body.records.slice(0, 100) : [];
    if (!records.length) return NextResponse.json({ error: "No interview records supplied." }, { status: 400 });

    const compact = records.map((r: any, i: number) => ({
      id: r.id || `record-${i+1}`,
      role: r.stakeholder_role,
      task: r.task,
      pain_point: r.pain_point,
      frequency: r.frequency,
      impact: r.impact,
      workaround: r.workaround,
      desired_outcome: r.desired_outcome,
      concerns: r.concerns,
      evidence_quote: r.evidence_quote,
      role_answers: r.role_answers,
      keyword_themes: analyseText([r.task,r.pain_point,r.workaround,r.desired_outcome,r.concerns,r.evidence_quote,...(r.role_answers||[]).map((a:any)=>a.answer||"")].join(" ")).map(t=>t.name)
    }));

    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: "You are a careful design-thinking research analyst. Use only the supplied interview records. Separate direct evidence from inference. Never invent quotes, counts, or user needs. Identify recurring problems, stakeholder disagreements, unmet needs, potential product opportunities, counter-evidence, and unanswered questions. Cite record IDs beside every major finding. State that small samples are not representative. Do not recommend a product merely because it is mentioned." },
            { role: "user", content: JSON.stringify(compact) }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) return NextResponse.json({ error: data.error?.message || "AI provider request failed." }, { status: response.status });
      return NextResponse.json({ analysis: data.choices?.[0]?.message?.content || "No analysis returned.", mode: "LLM-assisted; verify each claim against source records" });
    }

    const counts = new Map<string, number>();
    compact.forEach((r: any) => r.keyword_themes.forEach((t: string) => counts.set(t, (counts.get(t) || 0) + 1)));
    const themes = [...counts.entries()].sort((a,b)=>b[1]-a[1]);
    const bodyText = [
      "KEYWORD-BASED RESEARCH SUMMARY",
      `Records analysed: ${compact.length}`,
      "",
      "RECURRING THEMES",
      ...(themes.length ? themes.map(([t,n])=>`- ${t}: matched in ${n} record(s)`) : ["- No predefined theme vocabulary matched. Review the wording manually."]),
      "",
      "HIGH-IMPACT REPORTS",
      ...compact.filter((r:any)=>r.impact==="High").map((r:any)=>`- ${r.id} (${r.role}): ${r.pain_point}`),
      "",
      "RECORD-LEVEL EVIDENCE",
      ...compact.map((r:any)=>`- ${r.id} | ${r.role} | Task: ${r.task} | Pain: ${r.pain_point} | Need: ${r.desired_outcome || "not recorded"} | Themes: ${r.keyword_themes.join(", ") || "none matched"}`),
      "",
      "LIMITATIONS",
      "This is keyword matching, not semantic understanding or sentiment analysis. Counts reflect wording, not validated prevalence. Review original records and seek disconfirming evidence before selecting a product direction."
    ].join("\n");
    return NextResponse.json({ analysis: bodyText, mode: "Rule-based fallback; no external AI call" });
  } catch {
    return NextResponse.json({ error: "Invalid analysis request." }, { status: 400 });
  }
}
