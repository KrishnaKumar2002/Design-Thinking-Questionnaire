"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { roles, commonQuestions, roleQuestions, checklistItems } from "@/lib/questions";
import { analyseText } from "@/lib/analysis";

type Interview = {
  id: string; participant_code: string; organisation: string | null; stakeholder_role: string;
  task: string; pain_point: string; frequency: string; impact: string; workaround: string | null;
  desired_outcome: string | null; concerns: string | null; evidence_quote: string | null;
  checklist: string[]; role_answers: { question: string; answer: string }[]; created_at: string;
};
const blank = {participant_code:"",organisation:"",stakeholder_role:"Worker",task:"",pain_point:"",frequency:"Weekly",impact:"Medium",workaround:"",desired_outcome:"",concerns:"",evidence_quote:"",checklist:[] as string[],role_answers:[] as {question:string;answer:string}[]};

export default function Home() {
  const [tab,setTab] = useState("entry");
  const [sessionReady,setSessionReady] = useState(false);
  const [userEmail,setUserEmail] = useState("");
  const [password,setPassword] = useState("");
  const [authBusy,setAuthBusy] = useState(false);
  const [signedIn,setSignedIn] = useState(false);
  const [form,setForm] = useState(blank);
  const [records,setRecords] = useState<Interview[]>([]);
  const [search,setSearch] = useState("");
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const [selected,setSelected] = useState<string|null>(null);
  const [aiText,setAiText] = useState("");
  const [aiBusy,setAiBusy] = useState(false);
  const [aiError,setAiError] = useState("");
  const [aiMode,setAiMode] = useState("");

  async function refresh() {
    if (!supabase) { setError("Supabase is not configured. Copy .env.example to .env.local and add your project URL and anon key."); return; }
    const {data:{session}}=await supabase.auth.getSession(); if(!session){setRecords([]);return;}
    const {data,error} = await supabase.from("interviews").select("*").order("created_at",{ascending:false});
    if(error) setError(error.message); else {setRecords((data||[]) as Interview[]);setError("");}
  }
  useEffect(()=>{
    if(!supabase){setSessionReady(true);return;}
    supabase.auth.getSession().then(({data})=>{setSignedIn(!!data.session);setSessionReady(true);if(data.session)refresh();});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setSignedIn(!!session);if(session)refresh();else setRecords([]);});
    return ()=>subscription.unsubscribe();
  },[]);

  const roleQs = roleQuestions[form.stakeholder_role] || roleQuestions.Other;
  const allThemes = useMemo(()=> {
    const tally = new Map<string,number>();
    records.forEach(r=>analyseText([r.task,r.pain_point,r.workaround,r.desired_outcome,r.concerns,r.evidence_quote,...(r.role_answers||[]).map(a=>a.answer),...(r.checklist||[])].join(" ")).forEach(t=>tally.set(t.name,(tally.get(t.name)||0)+1)));
    return [...tally.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  },[records]);
  const filtered = records.filter(r=>[r.participant_code,r.organisation,r.stakeholder_role,r.task,r.pain_point,r.desired_outcome].join(" ").toLowerCase().includes(search.toLowerCase()));
  const high = records.filter(r=>r.impact==="High").length;
  const update = (key:string,value:unknown)=>setForm(f=>({...f,[key]:value}));
  const toggleCheck = (item:string)=>update("checklist",form.checklist.includes(item)?form.checklist.filter(x=>x!==item):[...form.checklist,item]);
  const updateAnswer = (question:string,answer:string)=>update("role_answers",roleQs.map(q=>({question:q,answer:q===question?answer:(form.role_answers.find(a=>a.question===q)?.answer||"")})));

  async function save() {
    setNotice("");setError("");
    if(!supabase){setError("Configure Supabase environment variables first.");return;}
    if(!form.participant_code.trim()||!form.task.trim()||!form.pain_point.trim()){setError("Participant code, task, and pain point are required.");return;}
    setBusy(true);
    const {data:{user}}=await supabase.auth.getUser();
    const payload={...form,owner_id:user?.id,participant_code:form.participant_code.trim(),task:form.task.trim(),pain_point:form.pain_point.trim()};
    const {error}=await supabase.from("interviews").insert(payload);
    setBusy(false);
    if(error){setError(error.message);return;}
    setNotice("Interview saved to Supabase.");setForm(blank);await refresh();setTab("records");
  }
  async function remove(id:string) {
    if(!supabase)return;
    if(!window.confirm("Delete this interview permanently?"))return;
    const {error}=await supabase.from("interviews").delete().eq("id",id);
    if(error)setError(error.message);else{setSelected(null);setNotice("Record deleted.");await refresh();}
  }
  function exportCsv() {
    const keys=["participant_code","organisation","stakeholder_role","task","pain_point","frequency","impact","workaround","desired_outcome","concerns","evidence_quote","checklist","role_answers","created_at"];
    const csv=[keys.join(","),...filtered.map(r=>keys.map(k=>{const v=(r as any)[k];return '"'+String(Array.isArray(v)||typeof v==="object"?JSON.stringify(v??""):v??"").replace(/"/g,'""')+'"';}).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="design-research-interviews.csv";a.click();URL.revokeObjectURL(url);
  }
  async function runAI() {
    setAiBusy(true);setAiError("");setAiText("");setAiMode("");
    try {
      const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({records})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Analysis failed.");
      setAiText(data.analysis);setAiMode(data.mode);
    } catch(e) {setAiError(e instanceof Error?e.message:"Analysis failed.");}
    finally {setAiBusy(false);}
  }
  async function signIn(signUp:boolean) {
    if(!supabase){setError("Configure Supabase environment variables first.");return;}
    setAuthBusy(true);setError("");setNotice("");
    const result=signUp
      ? await supabase.auth.signUp({email:userEmail,password})
      : await supabase.auth.signInWithPassword({email:userEmail,password});
    setAuthBusy(false);
    if(result.error){setError(result.error.message);return;}
    if(signUp&&!result.data.session){setNotice("Account created. Check your email to confirm it, then sign in.");return;}
    setSignedIn(true);setNotice(signUp?"Account created and signed in.":"Signed in.");await refresh();
  }
  async function signOut(){if(supabase)await supabase.auth.signOut();setSignedIn(false);setRecords([]);setNotice("Signed out.");}
  const nav=[["entry","Interview entry"],["records","Records"],["dashboard","Dashboard"],["insights","AI insights"]];
  return <main className="shell">
    <header className="hero"><div className="eyebrow">Design thinking · field research</div><h1>Design Research Studio</h1><p>Capture interviews, uncover repeated pain points, and validate opportunities for AI wearables and hands-free assistance.</p><div className="small" style={{color:"#e0e7ff"}}>Persistent database: {supabase?"Supabase configured":"Not configured"} · {signedIn?`${records.length} records loaded`:"Sign in to access records"}</div></header>
    {sessionReady&&supabase&&!signedIn ? <section className="card"><h2>Sign in to your research workspace</h2><p className="muted">Create an account or sign in. Row-level security keeps each user's interviews private.</p><div className="field"><label>Email</label><input type="email" value={userEmail} onChange={e=>setUserEmail(e.target.value)} autoComplete="email"/></div><div className="field"><label>Password (at least 6 characters)</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></div><div className="actions"><button className="btn primary" disabled={authBusy||!userEmail||password.length<6} onClick={()=>signIn(false)}>{authBusy?"Please wait…":"Sign in"}</button><button className="btn" disabled={authBusy||!userEmail||password.length<6} onClick={()=>signIn(true)}>Create account</button></div><p className="small">For production, enable email confirmation and configure allowed redirect URLs in Supabase Auth.</p></section> : null}
    <div className="row"><nav className="nav">{nav.map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</nav>{signedIn&&<button className="btn" onClick={signOut}>Sign out</button>}</div>
    {notice&&<div className="notice">{notice}</div>}{error&&<div className="error">{error}</div>}
    {signedIn&&tab==="entry"&&<section className="card"><h2>New interview</h2><p className="muted">Start with common workflow questions, then capture role-specific responses and evidence.</p>
      <div className="grid"><div className="field"><label>Participant code *</label><input value={form.participant_code} onChange={e=>update("participant_code",e.target.value)} placeholder="P-001 (avoid unnecessary personal data)"/></div><div className="field"><label>Organisation / department</label><input value={form.organisation} onChange={e=>update("organisation",e.target.value)}/></div></div>
      <div className="field"><label>Stakeholder role</label><select value={form.stakeholder_role} onChange={e=>{setForm(f=>({...f,stakeholder_role:e.target.value,role_answers:[]}));}}>{roles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
      <h3>Common checklist</h3>{checklistItems.map(item=><label className="check" key={item}><input type="checkbox" checked={form.checklist.includes(item)} onChange={()=>toggleCheck(item)}/>{item}</label>)}
      <div className="field"><label>Task being performed *</label><textarea value={form.task} onChange={e=>update("task",e.target.value)} placeholder="Describe one specific workflow"/></div>
      <div className="field"><label>Main pain point — participant's own words *</label><textarea value={form.pain_point} onChange={e=>update("pain_point",e.target.value)} placeholder="What is difficult, frustrating, risky or time-consuming?"/></div>
      <div className="grid"><div className="field"><label>Frequency</label><select value={form.frequency} onChange={e=>update("frequency",e.target.value)}>{["Daily","Weekly","Monthly","Rarely","Unknown"].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Perceived impact</label><select value={form.impact} onChange={e=>update("impact",e.target.value)}>{["High","Medium","Low","Unknown"].map(x=><option key={x}>{x}</option>)}</select></div></div>
      <div className="field"><label>Current workaround</label><textarea value={form.workaround} onChange={e=>update("workaround",e.target.value)}/></div><div className="field"><label>Desired outcome / unmet need</label><textarea value={form.desired_outcome} onChange={e=>update("desired_outcome",e.target.value)}/></div><div className="field"><label>Safety, trust or privacy concerns</label><textarea value={form.concerns} onChange={e=>update("concerns",e.target.value)}/></div><div className="field"><label>Evidence or direct quote</label><textarea value={form.evidence_quote} onChange={e=>update("evidence_quote",e.target.value)}/></div>
      <h3>Common interview prompts</h3>{commonQuestions.map((q,i)=><p className="muted" key={q}>{i+1}. {q}</p>)}
      <h3>Role-specific questions</h3>{roleQs.map(q=><div className="field" key={q}><label>{q}</label><textarea value={form.role_answers.find(a=>a.question===q)?.answer||""} onChange={e=>updateAnswer(q,e.target.value)}/></div>)}
      <div className="actions"><button className="btn primary" disabled={busy} onClick={save}>{busy?"Saving…":"Save interview to database"}</button><button className="btn" onClick={()=>setForm(blank)}>Clear form</button></div>
    </section>}
    {signedIn&&tab==="records"&&<section className="card"><div className="row"><h2>Interview records</h2><button className="btn" onClick={exportCsv}>Export CSV</button></div><input className="search" placeholder="Search participant, role, task, or pain point" value={search} onChange={e=>setSearch(e.target.value)}/>{filtered.length===0?<div className="empty">No records found. Create an interview or adjust the search.</div>:filtered.map(r=><article className="record" key={r.id}><div className="row"><div><strong>{r.participant_code}</strong><div className="muted">{roles.find(x=>x.value===r.stakeholder_role)?.label} · {new Date(r.created_at).toLocaleString()}</div></div><span className="pill">{r.impact} impact</span></div><p><strong>Task:</strong> {r.task}</p><p><strong>Pain:</strong> {r.pain_point}</p><p><strong>Need:</strong> {r.desired_outcome||"Not recorded"}</p><div>{analyseText([r.task,r.pain_point,r.desired_outcome,r.workaround].join(" ")).map(t=><span className="tag" key={t.name}>{t.name}</span>)}</div><div className="actions"><button className="btn" onClick={()=>setSelected(selected===r.id?null:r.id)}>{selected===r.id?"Hide details":"View full record"}</button><button className="btn" onClick={()=>remove(r.id)}>Delete</button></div>{selected===r.id&&<div><p><strong>Checklist:</strong> {(r.checklist||[]).join(", ")||"None selected"}</p><p><strong>Workaround:</strong> {r.workaround||"—"}</p><p><strong>Concerns:</strong> {r.concerns||"—"}</p><p><strong>Evidence:</strong> {r.evidence_quote||"—"}</p>{(r.role_answers||[]).map(a=><p key={a.question}><strong>{a.question}</strong><br/>{a.answer||"Not answered"}</p>)}</div>}</article>)}</section>}
    {signedIn&&tab==="dashboard"&&<><section className="grid3"><div className="card"><div className="muted">Interviews</div><div className="stat">{records.length}</div></div><div className="card"><div className="muted">High impact</div><div className="stat">{high}</div></div><div className="card"><div className="muted">Roles represented</div><div className="stat">{new Set(records.map(r=>r.stakeholder_role)).size}</div></div></section><section className="card"><h2>Recurring themes</h2><p className="muted">Keyword matches across interview records. Multiple themes can match one record.</p>{!records.length?<div className="empty">Save interviews to populate this dashboard.</div>:allThemes.map(t=><div key={t.name} style={{margin:"16px 0"}}><div className="row"><span>{t.name}</span><strong>{t.count}/{records.length}</strong></div><div className="bar"><span style={{width:`${100*t.count/records.length}%`}}/></div></div>)}</section><section className="card"><h2>Impact and frequency</h2>{["High","Medium","Low","Unknown"].map(v=><div className="row" key={v} style={{padding:"7px 0"}}><span>{v} impact</span><strong>{records.filter(r=>r.impact===v).length}</strong></div>)}<p className="muted">Impact is an interviewer's initial assessment and should be validated with evidence.</p></section></>}
    {signedIn&&tab==="insights"&&<section className="card"><h2>AI-assisted research synthesis</h2><p className="muted">Uses an LLM when the server API key is configured; otherwise returns transparent keyword-based analysis. AI outputs must be checked against source responses.</p><div className="actions"><button className="btn primary" disabled={aiBusy||records.length===0} onClick={runAI}>{aiBusy?"Analysing…":"Analyse saved interviews"}</button></div>{aiError&&<div className="error">{aiError}</div>}{aiText&&<><div className="notice">Analysis mode: {aiMode}</div><article style={{whiteSpace:"pre-wrap",lineHeight:1.65}}>{aiText}</article><button className="btn" onClick={()=>navigator.clipboard.writeText(aiText)}>Copy synthesis</button></>}{records.length===0&&<div className="empty">Save at least one interview to analyse evidence.</div>}</section>}
    <footer className="small" style={{padding:"12px 4px"}}>Research prototype. Before collecting real workplace data, implement sign-in, authenticated access policies, consent, retention rules, and appropriate AI data handling.</footer>
  </main>;
}
