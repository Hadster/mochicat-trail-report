import React, { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea, ReferenceDot,
} from "recharts";
import { SEED_LOG, SEED_WEIGHT, SEED_FUEL, SEED_SYMPTOMS } from "./seedData.js";
import { storageGet, storageSet, requestPersistence } from "./storage.js";

const CATS = ["Run","Bike","Climb","Strength","Hike","Walk"];
const COLOR = { Run:"#E8955A", Bike:"#4FB0A5", Climb:"#C084C7", Strength:"#D2574A", Hike:"#8FB861", Walk:"#7C93AD" };
const INK="#DCE4D8", MUTED="#7E8C82", PANEL="#141B16", BG="#0C110D", GRID="#26312A", ACCENT="#8FB861", WARN="#C7B45A", BAD="#C0605A";

const mondayOf = (d) => { const x=new Date(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); x.setHours(0,0,0,0); return x; };
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const localToday = () => dateKey(new Date());
const fmtDay = (d) => d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
const pad = (mins) => { const m=Math.round(mins); return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`; };
const tipStyle = { background:"#0A0E0B", border:`1px solid ${GRID}`, borderRadius:8, color:INK, fontSize:12.5, padding:"8px 11px" };
const inputStyle = { background:"#0d130f", border:`1px solid ${GRID}`, borderRadius:8, color:INK, fontSize:14, padding:"9px 11px", width:"100%", boxSizing:"border-box", outline:"none" };

const rowToObj = (r) => {
  const [date,name,cat,dist,min,hr,maxHR,elev,teA,teAn,load,notes] = r;
  return { date,name,cat,dist,min,hr,maxHR,elev,teA,teAn,load,notes, d:new Date(date+"T12:00:00") };
};

const STRENGTH_TEMPLATES = {
  A: { title:"Day A — Lower / Posterior", ex:[
    ["Goblet squat","3×8–10"],["Single-leg RDL","3×6–8/side"],["Reverse lunge","2–3×8/side"],
    ["Single-leg glute bridge","2×10/side"],["Suitcase carry","2–3 rounds/side"],["KB swing (optional)","3×10"],
  ]},
  B: { title:"Day B — Upper / Core", ex:[
    ["Floor press","3×8–10"],["Renegade row","3×6–8/side"],["Half-kneeling OH press","2–3×6–8/side"],
    ["Tall-kneeling halo","2×5/direction"],["Anti-rotation core","2–3×8–10"],["Farmer carry (optional)","2 rounds"],
  ]},
};

function Topo() {
  const rings=[];
  for(let i=0;i<7;i++) rings.push(
    <path key={i} fill="none" stroke={ACCENT} strokeWidth="1"
      d={`M ${20+i*8} ${120+i*10} q 130 ${-70-i*6} 300 ${-10-i*4} t 300 ${20+i*3} 320 -30`} />);
  return <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 960 300"
    style={{position:"absolute",inset:0,opacity:0.06,pointerEvents:"none"}}>{rings}</svg>;
}

function Panel({ title, sub, right, children, full }) {
  return (
    <section style={{ background:PANEL, borderRadius:14, padding:"18px 16px 12px", border:`1px solid ${GRID}`, gridColumn: full?"1 / -1":"auto" }}>
      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:12 }}>
        <div>
          <h2 style={{ margin:0, color:INK, fontSize:13, letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700 }}>{title}</h2>
          {sub && <div style={{ color:MUTED, fontSize:11.5, marginTop:3 }}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Legend({ cats }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:10 }}>
      {cats.map(c => (
        <span key={c} style={{ display:"flex", alignItems:"center", gap:6, color:MUTED, fontSize:11.5 }}>
          <span style={{ width:9, height:9, borderRadius:2, background:COLOR[c] }} />{c}
        </span>
      ))}
    </div>
  );
}

// ---------- Add / Edit session form ----------
function AddSession({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [strengthTpl, setStrengthTpl] = useState(null);
  const [f, setF] = useState({ date:localToday(), name:"", cat:"Run", dist:"", min:"", hr:"", maxHR:"", elev:"", teA:"", teAn:"", load:"", notes:"" });
  const [rows, setRows] = useState({});
  const set = (k,v)=>setF({...f,[k]:v});
  const num = (v)=> v===""?null:(isNaN(+v)?null:+v);

  const submit = () => {
    let notes = f.notes;
    if (f.cat==="Strength" && strengthTpl) {
      const parts = STRENGTH_TEMPLATES[strengthTpl].ex
        .map(([n]) => { const r=rows[n]||{}; return (r.w||r.r) ? `${n} ${r.w?r.w+"lb ":""}${r.r||""}`.trim() : null; })
        .filter(Boolean);
      notes = [parts.join("; "), f.notes].filter(Boolean).join(" · ");
    }
    const name = f.name || (f.cat==="Strength" && strengthTpl ? `Strength ${strengthTpl}` : f.cat);
    onAdd([f.date, name, f.cat, num(f.dist), num(f.min), num(f.hr), num(f.maxHR), num(f.elev), num(f.teA), num(f.teAn), num(f.load), notes]);
    setF({ date:localToday(), name:"", cat:"Run", dist:"", min:"", hr:"", maxHR:"", elev:"", teA:"", teAn:"", load:"", notes:"" });
    setRows({}); setStrengthTpl(null); setOpen(false);
  };

  if (!open) return (
    <button onClick={()=>setOpen(true)} style={{ width:"100%", padding:"13px", borderRadius:12, border:`1px dashed ${GRID}`, background:"transparent", color:ACCENT, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:16 }}>
      + Add a session
    </button>
  );

  const field = (k,ph,mode="decimal") => (
    <input value={f[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} inputMode={mode} style={inputStyle} />
  );

  return (
    <div style={{ background:PANEL, border:`1px solid ${GRID}`, borderRadius:14, padding:"16px", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>New Session</span>
        <button onClick={()=>setOpen(false)} style={{ background:"none", border:"none", color:MUTED, fontSize:20, cursor:"pointer" }}>×</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={inputStyle} />
        <select value={f.cat} onChange={e=>{set("cat",e.target.value); setStrengthTpl(null);}} style={inputStyle}>
          {CATS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <input value={f.name} onChange={e=>set("name",e.target.value)} placeholder="session name (optional)" style={{ ...inputStyle, marginBottom:8 }} />

      {f.cat==="Strength" && (
        <div style={{ marginBottom:8 }}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            {["A","B"].map(k=>(
              <button key={k} onClick={()=>setStrengthTpl(k)} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", fontSize:12.5, fontWeight:700,
                border:`1px solid ${strengthTpl===k?COLOR.Strength:GRID}`, background:strengthTpl===k?`${COLOR.Strength}22`:"transparent", color:strengthTpl===k?INK:MUTED }}>
                {STRENGTH_TEMPLATES[k].title}
              </button>
            ))}
          </div>
          {strengthTpl && STRENGTH_TEMPLATES[strengthTpl].ex.map(([n,t]) => (
            <div key={n} style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr", gap:6, marginBottom:6, alignItems:"center" }}>
              <div><div style={{ fontSize:12.5, fontWeight:600 }}>{n}</div><div style={{ color:MUTED, fontSize:10 }}>{t}</div></div>
              <input value={(rows[n]||{}).w||""} onChange={e=>setRows({...rows,[n]:{...(rows[n]||{}),w:e.target.value}})} placeholder="lb" inputMode="decimal" style={inputStyle} />
              <input value={(rows[n]||{}).r||""} onChange={e=>setRows({...rows,[n]:{...(rows[n]||{}),r:e.target.value}})} placeholder="sets×reps" style={inputStyle} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
        {field("dist","dist (mi)")}{field("min","time (min)")}{field("elev","elev (ft)")}
        {field("hr","avg HR")}{field("maxHR","max HR")}{field("load","load")}
        {field("teA","TE aero")}{field("teAn","TE anaero")}<div />
      </div>
      <input value={f.notes} onChange={e=>set("notes",e.target.value)} placeholder="notes — how it felt, conditions, symptoms" style={{ ...inputStyle, marginBottom:12 }} />
      <button onClick={submit} style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", cursor:"pointer", fontSize:14, fontWeight:800, background:ACCENT, color:BG }}>
        Save to device
      </button>
    </div>
  );
}

export default function App() {
  const [log, setLog] = useState(null);        // array of raw rows
  const [weight, setWeight] = useState(SEED_WEIGHT);
  const [fuel, setFuel] = useState(SEED_FUEL);
  const [symptoms, setSymptoms] = useState(SEED_SYMPTOMS);
  const [active, setActive] = useState(new Set(CATS));
  const [volMode, setVolMode] = useState("min");
  const [groupMode, setGroupMode] = useState("week");
  const [tab, setTab] = useState("Trends");

  // Load from device on mount; seed on first run.
  useEffect(() => {
    (async () => {
      requestPersistence();
      const savedLog = await storageGet("log");
      const savedW = await storageGet("weight");
      const savedF = await storageGet("fuel");
      const savedS = await storageGet("symptoms");
      setLog(savedLog || SEED_LOG);
      if (savedW) setWeight(savedW);
      if (savedF) setFuel(savedF);
      if (savedS) setSymptoms(savedS);
      if (!savedLog) { await storageSet("log", SEED_LOG); }
    })();
  }, []);

  const persistLog = async (rows) => { setLog(rows); await storageSet("log", rows); };
  const addSession = (row) => { const next=[...(log||[]), row].sort((a,b)=>a[0].localeCompare(b[0])); persistLog(next); };
  const removeSession = (idx) => { const next=(log||[]).filter((_,i)=>i!==idx); persistLog(next); };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ log, weight, fuel, symptoms }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `trail-report-backup-${localToday()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { const d=JSON.parse(r.result);
      if(d.log){ persistLog(d.log);} if(d.weight){setWeight(d.weight); storageSet("weight",d.weight);}
      if(d.fuel){setFuel(d.fuel); storageSet("fuel",d.fuel);} if(d.symptoms){setSymptoms(d.symptoms); storageSet("symptoms",d.symptoms);}
    } catch(_) { alert("Couldn't read that backup file."); } };
    r.readAsText(file);
  };

  if (!log) return <div style={{ minHeight:"100vh", background:BG, color:MUTED, display:"grid", placeItems:"center", fontFamily:"system-ui" }}>Loading…</div>;

  const LOG = log.map(rowToObj);
  const shown = LOG.filter(e => active.has(e.cat));
  const activeCats = CATS.filter(c => active.has(c));
  const lastMonday = LOG.length ? dateKey(mondayOf(LOG[LOG.length-1].d)) : localToday();

  const toggle = (c) => { const n=new Set(active); n.has(c)?n.delete(c):n.add(c); setActive(n.size?n:new Set(CATS)); };
  const only = (c) => setActive(new Set([c]));
  const allOn = () => setActive(new Set(CATS));

  const WEIGHT = weight.map(x=>({ ...x, d:new Date(x.date+"T12:00:00") }));
  const EVENTS = [
    { date:"2026-06-13", label:"Best run", color:"#E8955A" },
    { date:"2026-06-19", label:"Threshold", color:"#D2574A" },
    { date:"2026-07-04", label:"Meclizine day", color:"#C7B45A" },
  ];

  const weekCompare = (() => {
    if (!LOG.length) return { cur:{n:0,min:0,dist:0,elev:0}, prev:{n:0,min:0,dist:0,elev:0} };
    const cur = mondayOf(LOG[LOG.length-1].d);
    const prev = new Date(cur); prev.setDate(prev.getDate()-7);
    const sum = (mon) => { const rows = LOG.filter(e => mondayOf(e.d).getTime()===mon.getTime() && active.has(e.cat));
      return { n:rows.length, min:rows.reduce((s,e)=>s+(e.min||0),0), dist:rows.reduce((s,e)=>s+(e.dist||0),0), elev:rows.reduce((s,e)=>s+(e.elev||0),0) }; };
    return { cur:sum(cur), prev:sum(prev) };
  })();

  const ramp = (() => {
    const byWeek = {};
    LOG.forEach(e => { if(!active.has(e.cat)) return; const k=dateKey(mondayOf(e.d)); byWeek[k]=(byWeek[k]||0)+(e.min||0); });
    const keys = Object.keys(byWeek).sort();
    const cur = byWeek[lastMonday]||0;
    const prior = keys.filter(k=>k<lastMonday).slice(-4).map(k=>byWeek[k]);
    const base = prior.length ? prior.reduce((a,b)=>a+b,0)/prior.length : 0;
    return { cur, base, pct: base ? (cur/base)*100 : 0 };
  })();

  const volData = (() => {
    const groups = {};
    LOG.forEach(e => {
      const key = groupMode==="week" ? dateKey(mondayOf(e.d)) : e.date.slice(0,7);
      const label = groupMode==="week" ? "wk "+fmtDay(mondayOf(e.d)) : new Date(key+"-01T12:00:00").toLocaleDateString("en-US",{month:"long"});
      if (!groups[key]) { groups[key]={ key, label, sessions:0 }; CATS.forEach(c=>groups[key][c]=0); }
      if (active.has(e.cat)) { groups[key][e.cat]+=(volMode==="min"?(e.min||0):(e.dist||0)); groups[key].sessions+=1; }
    });
    return Object.values(groups).sort((a,b)=>a.key.localeCompare(b.key));
  })();

  const hrData = (() => {
    const rows = LOG.filter(e=>e.hr!=null).sort((a,b)=>a.d-b.d);
    return rows.map((e,i) => { const win=rows.slice(Math.max(0,i-4),i+1);
      return { label:fmtDay(e.d), date:e.date, name:e.name, cat:e.cat, hr:e.hr, maxHR:e.maxHR, avg:+(win.reduce((s,x)=>s+x.hr,0)/win.length).toFixed(1) }; });
  })();
  const hrShown = hrData.filter(e=>active.has(e.cat));

  const paceData = LOG.filter(e=>e.cat==="Run"&&e.dist&&e.min&&e.hr).sort((a,b)=>a.d-b.d)
    .map(e=>({ label:fmtDay(e.d), name:e.name, pace:+(e.min/e.dist).toFixed(2), hr:e.hr, elev:e.elev }));

  const elevData = LOG.filter(e=>e.elev!=null && active.has(e.cat)).sort((a,b)=>a.d-b.d)
    .map(e=>({ label:fmtDay(e.d), name:e.name, cat:e.cat, elev:e.elev }));
  const elevAvg = elevData.length ? Math.round(elevData.reduce((s,e)=>s+e.elev,0)/elevData.length) : 0;

  const teByCat = (() => { const m={};
    LOG.filter(e=>e.teA!=null && active.has(e.cat)).forEach(e=>{ (m[e.cat]=m[e.cat]||[]).push({ x:e.teA, y:e.teAn, name:e.name, label:fmtDay(e.d) }); });
    return m; })();

  const cumData = (() => { let d=0,v=0;
    return LOG.filter(e=>active.has(e.cat)).sort((a,b)=>a.d-b.d).map(e=>{ d+=e.dist||0; v+=e.elev||0; return { label:fmtDay(e.d), dist:+d.toFixed(1), vert:Math.round(v) }; }); })();

  const fuelData = fuel.map(x=>({ ...x, label:fmtDay(new Date(x.date+"T12:00:00")) }));

  const mix = (() => { const total=shown.reduce((s,e)=>s+(e.min||0),0)||1;
    return activeCats.map(c=>{ const m=LOG.filter(e=>e.cat===c).reduce((s,e)=>s+(e.min||0),0); return { cat:c, min:m, pct:(m/total)*100 }; })
      .filter(x=>x.min>0).sort((a,b)=>b.min-a.min); })();

  const totals = { sessions:shown.length, hours:(shown.reduce((s,e)=>s+(e.min||0),0)/60).toFixed(1),
    dist:shown.reduce((s,e)=>s+(e.dist||0),0).toFixed(1), gain:Math.round(shown.reduce((s,e)=>s+(e.elev||0),0)) };

  const calendar = (() => {
    if (!LOG.length) return [];
    const start=mondayOf(LOG[0].d), end=mondayOf(LOG[LOG.length-1].d);
    const byDate={}; LOG.forEach(e=>{ (byDate[e.date]=byDate[e.date]||[]).push(e); });
    const sympt=Object.fromEntries(symptoms.map(s=>[s.date,s.label]));
    const weeks=[];
    for(let w=new Date(start); w<=end; w.setDate(w.getDate()+7)){ const days=[];
      for(let i=0;i<7;i++){ const dd=new Date(w); dd.setDate(dd.getDate()+i); const key=dateKey(dd);
        days.push({ key, sessions:byDate[key]||[], symptom:sympt[key] }); }
      weeks.push({ monday:fmtDay(new Date(w)), days }); }
    return weeks;
  })();

  const dow = (() => { const names=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; const counts=[0,0,0,0,0,0,0];
    LOG.forEach(e=>{ if(active.has(e.cat)) counts[(e.d.getDay()+6)%7]++; });
    return names.map((n,i)=>({ day:n, count:counts[i] })); })();

  const prs = (() => {
    const runs=LOG.filter(e=>e.cat==="Run"&&e.dist), rides=LOG.filter(e=>e.cat==="Bike"&&e.dist);
    const withElev=LOG.filter(e=>e.elev), withMin=LOG.filter(e=>e.min);
    const best=(arr,f)=>arr.length?arr.reduce((a,b)=>f(b)>f(a)?b:a):null;
    const bestPace=paceData.length?paceData.reduce((a,b)=>b.pace<a.pace?b:a):null;
    const r=[];
    const lr=best(runs,e=>e.dist); if(lr) r.push(["Longest run",`${lr.dist} mi`,`${lr.name} · ${fmtDay(lr.d)}`]);
    const lrd=best(rides,e=>e.dist); if(lrd) r.push(["Longest ride",`${lrd.dist} mi`,`${lrd.name} · ${fmtDay(lrd.d)}`]);
    const bv=best(withElev,e=>e.elev); if(bv) r.push(["Biggest vert",`${bv.elev.toLocaleString()} ft`,`${bv.name} · ${fmtDay(bv.d)}`]);
    const ls=best(withMin,e=>e.min); if(ls) r.push(["Longest session",pad(ls.min),`${ls.name} · ${fmtDay(ls.d)}`]);
    if(bestPace) r.push(["Fastest run pace",`${bestPace.pace} min/mi`,`${bestPace.name} · ${bestPace.label}`]);
    r.push(["Hardest rope grade","5.12","Autobelay · May 30"]);
    r.push(["Hardest boulder","V4","Apr 26 & May 10"]);
    return r;
  })();

  const Delta = ({ cur, prev, unit, fmt=(x)=>Math.round(x) }) => {
    const diff=cur-prev, up=diff>=0;
    return <span style={{ color:up?ACCENT:"#C77", fontSize:12, fontWeight:700, marginLeft:6 }}>{up?"▲":"▼"} {fmt(Math.abs(diff))}{unit}</span>;
  };
  const rampColor = ramp.pct>130?BAD:ramp.pct>120?WARN:ACCENT;
  const TABS = ["Trends","Consistency","Records","Strength","Log"];
  const strengthLogged = LOG.filter(e=>e.cat==="Strength");

  return (
    <div style={{ minHeight:"100vh", background:BG, color:INK, fontFamily:'"Inter","Helvetica Neue",system-ui,sans-serif',
      padding:"max(24px, env(safe-area-inset-top)) 14px calc(48px + env(safe-area-inset-bottom))", overflowX:"hidden" }}>
      <div style={{ maxWidth:1080, margin:"0 auto" }}>

        <header style={{ position:"relative", overflow:"hidden", borderRadius:16, padding:"24px 20px 22px", marginBottom:16, border:`1px solid ${GRID}`, background:"linear-gradient(160deg,#16211a,#0f160f)" }}>
          <Topo />
          <div style={{ position:"relative" }}>
            <div style={{ color:ACCENT, fontSize:11.5, letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:8 }}>Training Log · 2026</div>
            <h1 style={{ margin:0, fontSize:34, fontWeight:800, letterSpacing:"-0.025em", lineHeight:1 }}>Trail Report</h1>
            <p style={{ color:MUTED, margin:"9px 0 0", fontSize:13 }}>{LOG.length} sessions · Bridger Range, MT · stored on this device</p>
          </div>
        </header>

        <AddSession onAdd={addSession} />

        {/* Week compare + ramp */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))", gap:12, marginBottom:14 }}>
          <div style={{ background:PANEL, border:`1px solid ${GRID}`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ color:MUTED, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>This week vs last</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(105px,1fr))", gap:8 }}>
              {[["Sessions",weekCompare.cur.n,weekCompare.prev.n,"",(x)=>x],
                ["Time",weekCompare.cur.min,weekCompare.prev.min,"m",(x)=>Math.round(x)],
                ["Distance",weekCompare.cur.dist,weekCompare.prev.dist," mi",(x)=>x.toFixed(1)],
                ["Vert",weekCompare.cur.elev,weekCompare.prev.elev," ft",(x)=>Math.round(x)],
              ].map(([l,c,p,u,fn]) => (
                <div key={l}><div style={{ color:MUTED, fontSize:10.5 }}>{l}</div>
                  <div style={{ fontSize:18, fontWeight:800 }}>{fn(c)}{u}<Delta cur={c} prev={p} unit={u} fmt={fn} /></div></div>
              ))}
            </div>
          </div>
          <div style={{ background:PANEL, border:`1px solid ${GRID}`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ color:MUTED, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Ramp rate <span style={{ textTransform:"none", letterSpacing:0 }}>· this week vs 4-wk avg</span></div>
            <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
              <span style={{ fontSize:26, fontWeight:800, color:rampColor }}>{Math.round(ramp.pct)}%</span>
              <span style={{ color:MUTED, fontSize:12 }}>{Math.round(ramp.cur)}m vs {Math.round(ramp.base)}m avg</span>
            </div>
            <div style={{ position:"relative", height:10, background:"#1d2620", borderRadius:5, marginTop:10, overflow:"hidden" }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${Math.min(100,(ramp.pct/160)*100)}%`, background:rampColor, borderRadius:5 }} />
              <div style={{ position:"absolute", left:`${(120/160)*100}%`, top:0, bottom:0, width:1.5, background:WARN }} />
            </div>
            <div style={{ color:MUTED, fontSize:10.5, marginTop:6 }}>
              {ramp.pct>130?"Well above typical — watch recovery & symptoms":ramp.pct>120?"Above the ~120% caution line":"Within a sustainable build range (marker = 120%)"}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12, alignItems:"center" }}>
          {CATS.map(c => { const on=active.has(c); const n=LOG.filter(e=>e.cat===c).length;
            return (
              <button key={c} onClick={()=>toggle(c)} onDoubleClick={()=>only(c)} style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer",
                padding:"6px 12px", borderRadius:999, fontSize:12.5, fontWeight:600, border:`1px solid ${on?COLOR[c]:GRID}`,
                background:on?`${COLOR[c]}22`:"transparent", color:on?INK:MUTED }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:on?COLOR[c]:MUTED }} />{c}<span style={{ color:MUTED, fontWeight:500 }}>{n}</span>
              </button>
            ); })}
          {active.size<CATS.length && <button onClick={allOn} style={{ background:"none", border:"none", color:ACCENT, fontSize:12, cursor:"pointer", fontWeight:600 }}>reset</button>}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:2, marginBottom:14, borderBottom:`1px solid ${GRID}`, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 13px", background:"none", cursor:"pointer", fontSize:13, fontWeight:700, whiteSpace:"nowrap", flexShrink:0,
              color:tab===t?INK:MUTED, border:"none", borderBottom:`2px solid ${tab===t?ACCENT:"transparent"}`, marginBottom:-1 }}>{t}</button>
          ))}
        </div>

        {tab==="Trends" && <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(105px,1fr))", gap:10, marginBottom:14 }}>
            {[["Sessions",totals.sessions,""],["Time",totals.hours,"hrs"],["Distance",totals.dist,"mi"],["Vert",totals.gain.toLocaleString(),"ft"]].map(([l,v,u]) => (
              <div key={l} style={{ background:PANEL, border:`1px solid ${GRID}`, borderRadius:12, padding:"12px 14px" }}>
                <div style={{ color:MUTED, fontSize:10.5, letterSpacing:"0.1em", textTransform:"uppercase" }}>{l}</div>
                <div style={{ fontSize:23, fontWeight:800, marginTop:2 }}>{v}<span style={{ fontSize:12, color:MUTED, fontWeight:600, marginLeft:4 }}>{u}</span></div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))", gap:14 }}>
            <Panel title="Volume" sub="stacked by activity · dashed = sessions · current period highlighted" full
              right={<div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[["min","Time"],["dist","Distance"]].map(([m,l])=><button key={m} onClick={()=>setVolMode(m)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${GRID}`, color:volMode===m?INK:MUTED, background:volMode===m?"#22301f":"transparent" }}>{l}</button>)}
                <span style={{ width:1, background:GRID, margin:"0 2px" }} />
                {[["week","Weekly"],["month","Monthly"]].map(([m,l])=><button key={m} onClick={()=>setGroupMode(m)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${GRID}`, color:groupMode===m?INK:MUTED, background:groupMode===m?"#22301f":"transparent" }}>{l}</button>)}
              </div>}>
              <ResponsiveContainer width="100%" height={290}>
                <ComposedChart data={volData} margin={{ top:6, right:6, left:-8, bottom:0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} interval={0} angle={-20} textAnchor="end" height={44} />
                  <YAxis yAxisId="v" tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="s" orientation="right" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill:"#ffffff08" }} formatter={(v,n)=> n==="sessions"?[v,"sessions"]:[`${Math.round(v)} ${volMode==="min"?"min":"mi"}`,n]} />
                  {groupMode==="week" && volData.map(w => w.key===lastMonday && <ReferenceArea key="cur" x1={w.label} x2={w.label} yAxisId="v" fill={ACCENT} fillOpacity={0.07} />)}
                  {activeCats.map(c => <Bar key={c} yAxisId="v" dataKey={c} stackId="v" fill={COLOR[c]} />)}
                  <Line yAxisId="s" type="monotone" dataKey="sessions" stroke={INK} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r:3, fill:INK }} />
                </ComposedChart>
              </ResponsiveContainer>
              <Legend cats={activeCats} />
            </Panel>

            <Panel title="Heart Rate Trend" sub="dots = session avg · hover for avg + max · line = 5-session rolling avg" full>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={hrShown} margin={{ top:18, right:10, left:-8, bottom:0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <ReferenceArea y1={130} y2={150} fill={ACCENT} fillOpacity={0.06} label={{ value:"zone 2", fill:MUTED, fontSize:10, position:"insideTopRight" }} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} minTickGap={18} />
                  <YAxis domain={[80,190]} tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tipStyle} content={({payload,label})=> payload&&payload.length ? (
                    <div style={tipStyle}><div style={{fontWeight:700}}>{payload[0].payload.name}</div>
                      <div style={{color:MUTED}}>{label} · {payload[0].payload.cat}</div>
                      <div>{payload[0].payload.hr} bpm avg{payload[0].payload.maxHR?` · ${payload[0].payload.maxHR} max`:""} (rolling {payload[0].payload.avg})</div></div>) : null} />
                  {EVENTS.map(ev => { const pt=hrShown.find(e=>e.date===ev.date);
                    return pt ? <ReferenceDot key={ev.date} x={pt.label} y={pt.hr} r={9} fill="none" stroke={ev.color} strokeWidth={1.5} label={{ value:ev.label, fill:ev.color, fontSize:10, position:"top" }} /> : null; })}
                  <Scatter dataKey="hr">{hrShown.map((e,i)=><Cell key={i} fill={COLOR[e.cat]} />)}</Scatter>
                  <Line type="monotone" dataKey="avg" stroke={INK} strokeWidth={2} dot={false} strokeOpacity={0.75} />
                </ComposedChart>
              </ResponsiveContainer>
              <Legend cats={activeCats.filter(c=>hrShown.some(e=>e.cat===c))} />
            </Panel>

            <Panel title="Run Pace Efficiency" sub="min/mi on runs with full data · up = faster">
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={paceData} margin={{ top:8, right:10, left:-6, bottom:0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                  <YAxis domain={[10,18]} tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} reversed />
                  <Tooltip contentStyle={tipStyle} content={({payload,label})=> payload&&payload.length ? (
                    <div style={tipStyle}><div style={{fontWeight:700}}>{payload[0].payload.name}</div><div style={{color:MUTED}}>{label}</div>
                      <div>{payload[0].payload.pace} min/mi · {payload[0].payload.hr} bpm{payload[0].payload.elev?` · ${payload[0].payload.elev} ft`:""}</div></div>) : null} />
                  <Line type="monotone" dataKey="pace" stroke={COLOR.Run} strokeWidth={2} dot={{ r:4, fill:COLOR.Run }} activeDot={{ r:6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Training Effect" sub="aerobic vs anaerobic (Garmin TE)">
              <ResponsiveContainer width="100%" height={230}>
                <ScatterChart margin={{ top:6, right:12, left:-8, bottom:4 }}>
                  <CartesianGrid stroke={GRID} />
                  <ReferenceLine x={3} stroke={MUTED} strokeDasharray="3 3" /><ReferenceLine y={2} stroke={MUTED} strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" domain={[0,5]} ticks={[0,1,2,3,4,5]} tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} label={{ value:"Aerobic →", position:"insideBottomRight", fill:MUTED, fontSize:10.5, dy:6 }} />
                  <YAxis type="number" dataKey="y" domain={[0,5]} ticks={[0,1,2,3,4,5]} tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={false} label={{ value:"Anaerobic →", angle:-90, position:"insideTopLeft", fill:MUTED, fontSize:10.5, dx:14, dy:22 }} />
                  <ZAxis range={[75,75]} />
                  <Tooltip contentStyle={tipStyle} cursor={{ strokeDasharray:"3 3", stroke:GRID }} content={({payload})=> payload&&payload[0] ? (
                    <div style={tipStyle}><div style={{fontWeight:700}}>{payload[0].payload.name}</div><div style={{color:MUTED}}>{payload[0].payload.label}</div>
                      <div>Aerobic {payload[0].payload.x} · Anaerobic {payload[0].payload.y}</div></div>) : null} />
                  {activeCats.map(c => teByCat[c] && <Scatter key={c} data={teByCat[c]} fill={COLOR[c]} fillOpacity={0.85} />)}
                </ScatterChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Elevation Gain" sub={`per session · dashed = avg (${elevAvg.toLocaleString()} ft)`}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={elevData} margin={{ top:4, right:6, left:0, bottom:0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} minTickGap={10} />
                  <YAxis tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill:"#ffffff08" }} formatter={(v)=>[`${v.toLocaleString()} ft`,"gain"]} labelFormatter={(l,p)=>p&&p[0]?`${p[0].payload.name} · ${l}`:l} />
                  <ReferenceLine y={elevAvg} stroke={MUTED} strokeDasharray="4 3" />
                  <Bar dataKey="elev" radius={[3,3,0,0]}>{elevData.map((e,i)=><Cell key={i} fill={COLOR[e.cat]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Exercise Load" sub="Garmin load, where logged">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={LOG.filter(e=>e.load!=null).map(e=>({ label:fmtDay(e.d), name:e.name, load:e.load, cat:e.cat }))} margin={{ top:4, right:6, left:0, bottom:0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                  <YAxis tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill:"#ffffff08" }} formatter={(v)=>[v,"load"]} labelFormatter={(l,p)=>p&&p[0]?`${p[0].payload.name} · ${l}`:l} />
                  <Bar dataKey="load" radius={[3,3,0,0]}>{LOG.filter(e=>e.load!=null).map((e,i)=><Cell key={i} fill={COLOR[e.cat]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Calories & Sweat Loss" sub="bars = kcal · line = sweat (ml), where logged">
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={fuelData} margin={{ top:6, right:0, left:0, bottom:0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                  <YAxis yAxisId="c" tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="s" orientation="right" tick={{ fill:"#7C93AD", fontSize:10.5 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tipStyle} content={({payload,label})=> payload&&payload.length ? (
                    <div style={tipStyle}><div style={{fontWeight:700}}>{payload[0].payload.name}</div><div style={{color:MUTED}}>{label}</div>
                      <div>{payload[0].payload.cal} kcal · {payload[0].payload.sweat.toLocaleString()} ml sweat</div></div>) : null} />
                  <Bar yAxisId="c" dataKey="cal" fill={COLOR.Bike} fillOpacity={0.85} radius={[3,3,0,0]} />
                  <Line yAxisId="s" type="monotone" dataKey="sweat" stroke="#7C93AD" strokeWidth={2} dot={{ r:4, fill:"#7C93AD" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Cumulative Progress" sub="running totals across the season">
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={cumData} margin={{ top:6, right:4, left:-8, bottom:0 }}>
                  <defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} /><stop offset="100%" stopColor={ACCENT} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} minTickGap={20} />
                  <YAxis yAxisId="d" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="v" orientation="right" tick={{ fill:"#7C93AD", fontSize:10.5 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tipStyle} formatter={(v,n)=>n==="dist"?[`${v} mi`,"distance"]:[`${v.toLocaleString()} ft`,"vert"]} />
                  <Area yAxisId="d" type="monotone" dataKey="dist" stroke={ACCENT} strokeWidth={2} fill="url(#gd)" />
                  <Line yAxisId="v" type="monotone" dataKey="vert" stroke="#7C93AD" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Activity Mix" sub="share of logged time">
              <div style={{ display:"flex", height:20, borderRadius:6, overflow:"hidden", marginBottom:14 }}>
                {mix.map(m => <div key={m.cat} style={{ width:`${m.pct}%`, background:COLOR[m.cat] }} />)}
              </div>
              {mix.map(m => (
                <div key={m.cat} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${GRID}`, fontSize:12.5 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:9, height:9, borderRadius:2, background:COLOR[m.cat] }} />{m.cat}</span>
                  <span style={{ color:MUTED }}>{(m.min/60).toFixed(1)} h · {m.pct.toFixed(0)}%</span>
                </div>
              ))}
            </Panel>

            <Panel title="Bodyweight" sub="check-ins · lb">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={WEIGHT.map(w=>({ ...w, label:fmtDay(w.d) }))} margin={{ top:8, right:12, left:-8, bottom:0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:11.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                  <YAxis domain={[168,188]} tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tipStyle} formatter={(v)=>[`${v} lb`,"weight"]} labelFormatter={(l,p)=>p&&p[0]?`${l} · ${p[0].payload.note}`:l} />
                  <Line type="monotone" dataKey="w" stroke={ACCENT} strokeWidth={2.5} dot={{ r:5, fill:ACCENT, strokeWidth:0 }} activeDot={{ r:7 }} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </>}

        {tab==="Consistency" && <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))", gap:14 }}>
          <Panel title="Training Calendar" sub="dot = session · yellow ring = symptom day" full>
            <div style={{ overflowX:"auto", paddingBottom:6 }}>
              <div style={{ display:"flex", gap:5 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginRight:4 }}>
                  <div style={{ height:14 }} />
                  {["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{ width:14, height:16, color:MUTED, fontSize:9.5, lineHeight:"16px" }}>{d}</div>)}
                </div>
                {calendar.map((w,wi) => (
                  <div key={wi} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <div style={{ height:14, color:MUTED, fontSize:8.5, whiteSpace:"nowrap" }}>{wi%2===0?w.monday:""}</div>
                    {w.days.map(day => { const n=day.sessions.filter(s=>active.has(s.cat)).length;
                      const cat=n?day.sessions.find(s=>active.has(s.cat)).cat:null;
                      return <div key={day.key} title={n?`${day.key}: ${day.sessions.map(s=>s.name).join(", ")}`:(day.symptom?`${day.key}: ${day.symptom}`:day.key)}
                        style={{ width:16, height:16, borderRadius:4, background:n?COLOR[cat]:"#1a231c", opacity:n?(n>1?1:0.85):1, boxShadow:day.symptom?`0 0 0 2px ${WARN}`:"none" }} />; })}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
              <span style={{ color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:"#1a231c" }} />rest</span>
              <span style={{ color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:ACCENT }} />trained</span>
              <span style={{ color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:"#1a231c", boxShadow:`0 0 0 2px ${WARN}` }} />symptom day</span>
            </div>
          </Panel>
          <Panel title="Day-of-Week Pattern" sub="session count by weekday">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dow} margin={{ top:4, right:6, left:-10, bottom:0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tick={{ fill:MUTED, fontSize:11.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                <YAxis tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} cursor={{ fill:"#ffffff08" }} formatter={(v)=>[v,"sessions"]} />
                <Bar dataKey="count" fill={ACCENT} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>}

        {tab==="Records" && <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))", gap:14 }}>
          <Panel title="Personal Records" sub="auto-computed from your log" full>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
              {prs.map(([l,v,who]) => (
                <div key={l} style={{ background:"#101711", border:`1px solid ${GRID}`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ color:MUTED, fontSize:10.5, letterSpacing:"0.08em", textTransform:"uppercase" }}>{l}</div>
                  <div style={{ fontSize:21, fontWeight:800, margin:"3px 0 2px", color:ACCENT }}>{v}</div>
                  <div style={{ color:MUTED, fontSize:11.5 }}>{who}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>}

        {tab==="Strength" && (
          <Panel title="Strength History" sub={`${strengthLogged.length} strength sessions · add more with the + button up top`} full>
            {strengthLogged.length===0 && <div style={{ color:MUTED, fontSize:12.5 }}>No strength sessions yet — tap “Add a session”, pick Strength, and choose Day A or B.</div>}
            {[...strengthLogged].reverse().map((e,i) => (
              <div key={i} style={{ borderBottom:`1px solid ${GRID}`, padding:"11px 0" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, fontSize:13.5 }}><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:COLOR.Strength, marginRight:8 }} />{fmtDay(e.d)} · {e.name}</span>
                  <span style={{ color:MUTED, fontSize:12 }}>{e.min!=null?`${Math.round(e.min)} min`:""}{e.hr!=null?` · ${e.hr}/${e.maxHR||"–"} bpm`:""}{e.load!=null?` · load ${e.load}`:""}</span>
                </div>
                {e.notes && <div style={{ color:MUTED, fontSize:12, marginTop:6, lineHeight:1.5 }}>{e.notes}</div>}
              </div>
            ))}
          </Panel>
        )}

        {tab==="Log" && (
          <Panel title="Session Log" sub={`${shown.length} of ${LOG.length} · filtered by chips · newest first`} full>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5, minWidth:680 }}>
                <thead><tr style={{ color:MUTED, textAlign:"left" }}>
                  {["Date","Session","Dist","Time","HR","Elev","TE","Load","Notes",""].map(h => <th key={h} style={{ padding:"7px 8px", borderBottom:`1px solid ${GRID}`, fontWeight:600, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {LOG.map((e,i)=>({e,i})).filter(({e})=>active.has(e.cat)).reverse().map(({e,i}) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${GRID}` }}>
                      <td style={{ padding:"8px", whiteSpace:"nowrap", color:MUTED }}>{fmtDay(e.d)}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:COLOR[e.cat], marginRight:7 }} />{e.name}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.dist!=null?`${e.dist} mi`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.min!=null?pad(e.min):"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.hr!=null?`${e.hr}${e.maxHR?` / ${e.maxHR}`:""}`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.elev!=null?`${e.elev.toLocaleString()} ft`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.teA!=null?`${e.teA} / ${e.teAn}`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.load!=null?e.load:"—"}</td>
                      <td style={{ padding:"8px", color:MUTED, minWidth:160 }}>{e.notes||"—"}</td>
                      <td style={{ padding:"8px" }}><button onClick={()=>{ if(confirm("Delete this session?")) removeSession(i); }} style={{ background:"none", border:`1px solid ${GRID}`, color:MUTED, borderRadius:6, padding:"3px 8px", fontSize:11, cursor:"pointer" }}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
              <button onClick={exportJSON} style={{ padding:"9px 16px", borderRadius:9, border:`1px solid ${GRID}`, background:"transparent", color:INK, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>⬇ Export backup (.json)</button>
              <label style={{ padding:"9px 16px", borderRadius:9, border:`1px solid ${GRID}`, background:"transparent", color:INK, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
                ⬆ Import backup
                <input type="file" accept="application/json" onChange={importJSON} style={{ display:"none" }} />
              </label>
            </div>
            <div style={{ color:MUTED, fontSize:11, marginTop:10, lineHeight:1.5 }}>Your data is stored only on this device. Export a backup periodically — it’s the one file you own outright.</div>
          </Panel>
        )}

        <p style={{ color:MUTED, fontSize:11, textAlign:"center", marginTop:16 }}>Trail Report · all data stored locally on your device</p>
      </div>
    </div>
  );
}
