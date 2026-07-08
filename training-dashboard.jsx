import React, { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea, ReferenceDot,
} from "recharts";

// ---- Full log history (rebuilt from this conversation) ----
// [date, name, cat, dist mi, min, avgHR, maxHR, elev ft, TE aerobic, TE anaerobic, load, notes]
const LOG = [
  ["2026-04-22","Trail Run","Run",3.69,50.82,138,null,141,3.7,0.0,null,"86% Zone 2"],
  ["2026-04-26","Walk + Run","Run",2.62,34.12,null,null,null,null,null,null,"92% Zone 2 after 2mi walk"],
  ["2026-04-26","Indoor Climbing","Climb",null,60,null,null,null,null,null,null,"~13 problems V1–V4"],
  ["2026-04-29","Trail Run","Run",4.05,53.27,140,null,213,null,null,null,""],
  ["2026-05-01","Road Run","Run",4.0,51.48,144,null,243,null,null,null,""],
  ["2026-05-02","Road Ride","Bike",3.0,null,122,null,null,null,null,null,"Easy spin"],
  ["2026-05-03","Leverich MTB","Bike",11.0,96,147,177,2200,null,null,null,""],
  ["2026-05-05","Strength","Strength",null,29,null,null,null,null,null,null,"Lower-body KB"],
  ["2026-05-07","Trail Run","Run",3.11,40.6,140,null,108,null,null,null,""],
  ["2026-05-09","Triple Tree MTB","Bike",7.1,64.93,153,175,1014,null,null,null,""],
  ["2026-05-10","Climbing","Climb",null,45,null,null,null,null,null,null,"34 problems V1–V4"],
  ["2026-05-12","Trail Run","Run",3.27,43.4,136,null,174,null,null,null,"Cadence focus"],
  ["2026-05-21","Trail Run","Run",4.08,54.58,142,null,180,null,null,null,""],
  ["2026-05-30","Autobelay","Climb",null,90,null,null,null,null,null,null,"5.9–5.12 avg ~5.10d"],
  ["2026-05-31","Walk","Walk",1.5,null,null,null,null,null,null,null,"Carried ~45lb groceries"],
  ["2026-06-02","Walk/Jog","Walk",2.3,null,null,null,null,null,null,null,"Jog then walk; headache"],
  ["2026-06-03","MTB","Bike",null,null,null,null,null,null,null,null,"Recovery ride after EMDR"],
  ["2026-06-05","Treadmill","Run",null,30,null,null,null,null,null,null,"Cadence work"],
  ["2026-06-06","MTB","Bike",null,null,null,null,null,null,null,null,"Near crash; improving"],
  ["2026-06-07","Steep Hike","Hike",null,null,null,null,null,null,null,null,""],
  ["2026-06-10","Strength","Strength",null,null,null,null,null,null,null,null,"Full-body KB"],
  ["2026-06-13","Trail Run","Run",6.75,72.6,149,null,220,3.7,0.0,null,"Best run of year"],
  ["2026-06-19","M Trail Effort","Run",2.4,33.2,167,182,873,4.0,0.9,null,"Threshold climb"],
  ["2026-06-19","Zone 2 Run","Run",2.0,null,null,null,null,null,null,null,"Easy run"],
  ["2026-06-20","Ogre Shakedown","Bike",13.6,91.68,109,151,554,1.9,0.1,null,"Surly Ogre"],
  ["2026-06-21","Trail Run","Run",3.15,54.83,136,182,876,2.4,1.1,null,"Base"],
  ["2026-06-25","Recovery Walk","Walk",0.84,29.85,90,null,null,null,null,null,"Skipped lifting"],
  ["2026-06-26","KB & Core","Strength",null,47.73,132,174,null,2.6,2.2,null,"44lb goblet, floor press"],
  ["2026-06-29","Autobelay","Climb",null,60,null,null,null,null,null,null,"5.7–5.11c avg 5.10a-b"],
  ["2026-07-02","Mountain Biking","Bike",7.08,103.97,127,191,1165,2.8,2.7,101,"Crosscut / Gallatin Co."],
  ["2026-07-03","Cycling","Bike",null,53.8,123,186,423,2.5,2.2,73,"Surly Ogre after bike fitting"],
  ["2026-07-04","Mountain Biking","Bike",6.98,96.98,129,164,978,2.9,2.1,83,"Stiff; 12.5mg meclizine; Crosscut; Rocket Rick"],
  ["2026-07-05","Mountain Biking","Bike",7.41,74.02,132,168,814,2.9,1.5,71,"12.5mg meclizine but much less symptomatic than Jul 4; south of town; smoother trail (Grit 26)"],
  ["2026-07-07","Strength A","Strength",null,38.22,130,168,null,2.3,2.0,55,"Goblet 44lb 3×10; SL RDL 25lb 3×7; rev lunge 35lb 2×8; SL bridge BW 2×10; carry 44lb 3×30; 341 kcal, 502 ml sweat"],
].map(([date,name,cat,dist,min,hr,maxHR,elev,teA,teAn,load,notes]) => ({
  date, name, cat, dist, min, hr, maxHR, elev, teA, teAn, load, notes,
  d: new Date(date + "T12:00:00"),
}));

const WEIGHT = [
  { date:"2026-04-15", w:173.0, note:"During GI illness / travel" },
  { date:"2026-06-10", w:183.0, note:"Recovered training" },
  { date:"2026-06-28", w:182.5, note:"Current; harness looser" },
].map(x => ({ ...x, d:new Date(x.date+"T12:00:00") }));

const FUEL = [
  { date:"2026-07-02", label:"Jul 2", name:"Mountain Biking", cal:803, sweat:1112 },
  { date:"2026-07-03", label:"Jul 3", name:"Cycling", cal:410, sweat:528 },
  { date:"2026-07-04", label:"Jul 4", name:"Mountain Biking", cal:744, sweat:1042 },
  { date:"2026-07-05", label:"Jul 5", name:"Mountain Biking", cal:619, sweat:989 },
  { date:"2026-07-07", label:"Jul 7", name:"Strength A", cal:341, sweat:502 },
];

const SYMPTOMS = [
  { date:"2026-06-02", label:"Headache" },
  { date:"2026-06-27", label:"Positional dizziness" },
  { date:"2026-07-04", label:"Neck / floating · meclizine" },
];

const EVENTS = [
  { date:"2026-06-13", label:"Best run", color:"#E8955A" },
  { date:"2026-06-19", label:"Threshold", color:"#D2574A" },
  { date:"2026-07-04", label:"Meclizine day", color:"#C7B45A" },
];

const CLIMB_SESSIONS = [
  { date:"Apr 26", type:"Boulder", detail:"~13 problems", max:"V4" },
  { date:"May 10", type:"Boulder", detail:"34 problems", max:"V4" },
  { date:"May 30", type:"Rope", detail:"avg ~5.10d", max:"5.12" },
  { date:"Jun 29", type:"Rope", detail:"avg 5.10a–b", max:"5.11c" },
];

const CATS = ["Run","Bike","Climb","Strength","Hike","Walk"];
const COLOR = { Run:"#E8955A", Bike:"#4FB0A5", Climb:"#C084C7", Strength:"#D2574A", Hike:"#8FB861", Walk:"#7C93AD" };
const INK="#DCE4D8", MUTED="#7E8C82", PANEL="#141B16", BG="#0C110D", GRID="#26312A", ACCENT="#8FB861", WARN="#C7B45A", BAD="#C0605A";

const mondayOf = (d) => { const x=new Date(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); x.setHours(0,0,0,0); return x; };
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtDay = (d) => d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
const pad = (mins) => { const m=Math.round(mins); return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`; };
const tipStyle = { background:"#0A0E0B", border:`1px solid ${GRID}`, borderRadius:8, color:INK, fontSize:12.5, padding:"8px 11px" };

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

const inputStyle = { background:"#0d130f", border:`1px solid ${GRID}`, borderRadius:8, color:INK, fontSize:13, padding:"8px 10px", width:"100%", boxSizing:"border-box", outline:"none" };

const TEMPLATES = {
  A: { title:"Day A — Lower / Posterior", ex:[
    ["Goblet squat","3×8–10"],
    ["Single-leg RDL","3×6–8/side"],
    ["Reverse lunge","2–3×8/side"],
    ["Single-leg glute bridge","2×10/side"],
    ["Suitcase carry","2–3 rounds/side"],
    ["KB swing (optional)","3×10"],
  ]},
  B: { title:"Day B — Upper / Core", ex:[
    ["Floor press","3×8–10"],
    ["Renegade row","3×6–8/side"],
    ["Half-kneeling OH press","2–3×6–8/side"],
    ["Tall-kneeling halo","2×5/direction"],
    ["Anti-rotation core","2–3×8–10"],
    ["Farmer carry (optional)","2 rounds"],
  ]},
};

const strengthMem = { sessions: null };
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

function StrengthLogger({ logged }) {
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState(null);
  const [date, setDate] = useState(localToday());
  const [rows, setRows] = useState({});
  const [g, setG] = useState({ min:"", hr:"", maxHR:"", teA:"", teAn:"", load:"", cal:"", sweat:"", notes:"" });
  const [savedText, setSavedText] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (strengthMem.sessions) { setSessions(strengthMem.sessions); setLoaded(true); return; }
    (async () => {
      try {
        const r = await window.storage.get("strength-sessions", false);
        if (r && r.value) { const p = JSON.parse(r.value); strengthMem.sessions = p; setSessions(p); }
      } catch (e) { /* no sessions yet */ }
      setLoaded(true);
    })();
  }, []);

  const persist = async (list) => {
    strengthMem.sessions = list; // survives tab switches even if storage fails
    try {
      const res = await window.storage.set("strength-sessions", JSON.stringify(list), false);
      if (!res) throw new Error("no result");
      const chk = await window.storage.get("strength-sessions", false); // verify round-trip
      if (!chk || !chk.value) throw new Error("verify failed");
      setErr(null); return true;
    } catch (e) {
      setErr("Storage couldn't confirm the save. The session is kept while this dashboard is open — copy the text below into the chat now so it's in the permanent log.");
      return false;
    }
  };

  const fmtEntry = (s) => {
    const lines = [`${s.date} — Strength (Workout ${s.workout})`];
    s.exercises.forEach(ex => { if (ex.w || ex.r) lines.push(`- ${ex.name}: ${ex.w?`${ex.w} lb`:""}${ex.w&&ex.r?" · ":""}${ex.r||""}`); });
    const gg = s.garmin;
    if (gg.min) lines.push(`- Time: ${gg.min} min`);
    if (gg.hr) lines.push(`- Avg HR: ${gg.hr}${gg.maxHR?` / Max HR: ${gg.maxHR}`:""}`);
    if (gg.teA) lines.push(`- Training effect: ${gg.teA} aerobic / ${gg.teAn||"?"} anaerobic`);
    if (gg.load) lines.push(`- Load: ${gg.load}`);
    if (gg.cal) lines.push(`- Calories: ${gg.cal}${gg.sweat?` · Sweat: ${gg.sweat} ml`:""}`);
    if (gg.notes) lines.push(`- Notes: ${gg.notes}`);
    return lines.join("\n");
  };

  const save = async () => {
    if (!sel) return;
    const entry = {
      id: Date.now(), date, workout: sel,
      exercises: TEMPLATES[sel].ex.map(([name]) => ({ name, w: (rows[name]||{}).w||"", r: (rows[name]||{}).r||"" })),
      garmin: { ...g },
    };
    const list = [...sessions, entry].sort((a,b)=>a.date.localeCompare(b.date));
    await persist(list);
    setSessions(list);
    setSavedText(fmtEntry(entry));
    setSel(null); setRows({}); setG({ min:"", hr:"", maxHR:"", teA:"", teAn:"", load:"", cal:"", sweat:"", notes:"" });
  };

  const remove = async (id) => {
    const list = sessions.filter(s=>s.id!==id);
    await persist(list);
    setSessions(list);
  };

  const gField = (k, ph) => (
    <input value={g[k]} onChange={e=>setG({...g,[k]:e.target.value})} placeholder={ph} style={inputStyle} inputMode={k==="notes"?"text":"decimal"} />
  );

  return (
    <div style={{ display:"grid", gap:14 }}>
      <Panel title="Strength History" sub={`${logged.length} strength sessions in the main log · always current`} full>
        {logged.length===0 && <div style={{ color:MUTED, fontSize:12.5 }}>No strength sessions logged yet.</div>}
        {[...logged].reverse().map((e,i) => (
          <div key={i} style={{ borderBottom:`1px solid ${GRID}`, padding:"11px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:13.5 }}>
                <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:COLOR.Strength, marginRight:8 }} />
                {fmtDay(e.d)} · {e.name}
              </span>
              <span style={{ color:MUTED, fontSize:12 }}>
                {e.min!=null?`${Math.round(e.min)} min`:""}{e.hr!=null?` · ${e.hr}/${e.maxHR||"–"} bpm`:""}{e.load!=null?` · load ${e.load}`:""}
              </span>
            </div>
            {e.notes && <div style={{ color:MUTED, fontSize:12, marginTop:6, lineHeight:1.5 }}>{e.notes}</div>}
          </div>
        ))}
      </Panel>

      <Panel title="Log a New Strength Session" sub="pick a workout · enter weight & reps · attach Garmin stats · generates paste-ready text" full>
        <div style={{ background:"#1a2016", border:`1px solid ${GRID}`, borderRadius:9, padding:"10px 12px", marginBottom:14, color:MUTED, fontSize:11.5, lineHeight:1.5 }}>
          Heads-up: saved sessions live only in this dashboard and may not survive a reload here in chat. The reliable record is the main log — after saving, <span style={{color:INK}}>paste the generated text into the chat</span> (or send your Garmin screenshot) and it's logged permanently.
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          {["A","B"].map(k => (
            <button key={k} onClick={()=>{setSel(k); setSavedText(null);}} style={{
              padding:"10px 18px", borderRadius:10, cursor:"pointer", fontSize:13.5, fontWeight:700,
              border:`1px solid ${sel===k?COLOR.Strength:GRID}`,
              background: sel===k ? `${COLOR.Strength}22` : "transparent", color: sel===k?INK:MUTED }}>
              {TEMPLATES[k].title}
            </button>
          ))}
        </div>

        {sel && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <span style={{ color:MUTED, fontSize:12 }}>Date</span>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inputStyle, width:"auto" }} />
          </div>

          <div style={{ display:"grid", gap:8, marginBottom:16 }}>
            {TEMPLATES[sel].ex.map(([name, target]) => (
              <div key={name} style={{ display:"grid", gridTemplateColumns:"minmax(140px,1.6fr) 1fr 1fr", gap:8, alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{name}</div>
                  <div style={{ color:MUTED, fontSize:10.5 }}>{target}</div>
                </div>
                <input value={(rows[name]||{}).w||""} onChange={e=>setRows({...rows,[name]:{...(rows[name]||{}),w:e.target.value}})} placeholder="lb" style={inputStyle} inputMode="decimal" />
                <input value={(rows[name]||{}).r||""} onChange={e=>setRows({...rows,[name]:{...(rows[name]||{}),r:e.target.value}})} placeholder="sets×reps" style={inputStyle} />
              </div>
            ))}
          </div>

          <div style={{ color:MUTED, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Garmin stats (optional — from your screenshot)</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:8, marginBottom:10 }}>
            {gField("min","time (min)")}{gField("hr","avg HR")}{gField("maxHR","max HR")}{gField("teA","TE aerobic")}
            {gField("teAn","TE anaerobic")}{gField("load","load")}{gField("cal","kcal")}{gField("sweat","sweat ml")}
          </div>
          <input value={g.notes} onChange={e=>setG({...g,notes:e.target.value})} placeholder="notes — how it felt, any symptoms" style={{ ...inputStyle, marginBottom:14 }} />

          <button onClick={save} style={{ padding:"11px 22px", borderRadius:10, border:"none", cursor:"pointer", fontSize:14, fontWeight:800, background:ACCENT, color:"#0C110D" }}>
            Save session
          </button>
        </>}

        {err && <div style={{ color:WARN, fontSize:12, marginTop:12 }}>{err}</div>}

        {savedText && (
          <div style={{ marginTop:16, background:"#101711", border:`1px solid ${GRID}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ color:ACCENT, fontSize:12, fontWeight:700, marginBottom:6 }}>Saved ✓ — paste this into the chat so it lands in the main training log:</div>
            <pre style={{ margin:0, whiteSpace:"pre-wrap", color:INK, fontSize:12.5, fontFamily:"ui-monospace,monospace" }}>{savedText}</pre>
          </div>
        )}
      </Panel>

      <Panel title="Unsaved-to-log (this dashboard only)" sub={loaded ? `${sessions.length} held here — remember to paste into chat` : "loading…"} full>
        {loaded && sessions.length===0 && <div style={{ color:MUTED, fontSize:12.5 }}>None yet — log your first Workout A or B above.</div>}
        {sessions.map(s => (
          <div key={s.id} style={{ borderBottom:`1px solid ${GRID}`, padding:"10px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:13.5 }}>
                <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:COLOR.Strength, marginRight:8 }} />
                {s.date} · Workout {s.workout}
              </span>
              <button onClick={()=>remove(s.id)} style={{ background:"none", border:`1px solid ${GRID}`, color:MUTED, borderRadius:8, padding:"4px 10px", fontSize:11.5, cursor:"pointer" }}>delete</button>
            </div>
            <pre style={{ margin:"8px 0 0", whiteSpace:"pre-wrap", color:MUTED, fontSize:12, fontFamily:"ui-monospace,monospace" }}>{fmtEntry(s)}</pre>
          </div>
        ))}
      </Panel>
    </div>
  );
}

export default function TrainingDashboard() {
  const [active, setActive] = useState(new Set(CATS));
  const [volMode, setVolMode] = useState("min");
  const [groupMode, setGroupMode] = useState("week");
  const [tab, setTab] = useState("Trends");

  const toggle = (c) => { const n=new Set(active); n.has(c)?n.delete(c):n.add(c); setActive(n.size?n:new Set(CATS)); };
  const only = (c) => setActive(new Set([c]));
  const allOn = () => setActive(new Set(CATS));

  const shown = LOG.filter(e => active.has(e.cat));
  const activeCats = CATS.filter(c => active.has(c));
  const lastMonday = dateKey(mondayOf(LOG[LOG.length-1].d));

  const weekCompare = useMemo(() => {
    const cur = mondayOf(LOG[LOG.length-1].d);
    const prev = new Date(cur); prev.setDate(prev.getDate()-7);
    const sum = (mon) => {
      const rows = LOG.filter(e => mondayOf(e.d).getTime()===mon.getTime() && active.has(e.cat));
      return { n:rows.length, min:rows.reduce((s,e)=>s+(e.min||0),0), dist:rows.reduce((s,e)=>s+(e.dist||0),0), elev:rows.reduce((s,e)=>s+(e.elev||0),0) };
    };
    return { cur:sum(cur), prev:sum(prev) };
  }, [active]);

  // Ramp rate: current week minutes vs avg of prior 4 weeks
  const ramp = useMemo(() => {
    const byWeek = {};
    LOG.forEach(e => {
      if (!active.has(e.cat)) return;
      const k = dateKey(mondayOf(e.d));
      byWeek[k] = (byWeek[k]||0) + (e.min||0);
    });
    const keys = Object.keys(byWeek).sort();
    const cur = byWeek[lastMonday] || 0;
    const prior = keys.filter(k=>k<lastMonday).slice(-4).map(k=>byWeek[k]);
    const base = prior.length ? prior.reduce((a,b)=>a+b,0)/prior.length : 0;
    return { cur, base, pct: base ? (cur/base)*100 : 0 };
  }, [active, lastMonday]);

  const volData = useMemo(() => {
    const groups = {};
    LOG.forEach(e => {
      const key = groupMode==="week"
        ? dateKey(mondayOf(e.d))
        : e.date.slice(0,7);
      const label = groupMode==="week" ? "wk "+fmtDay(mondayOf(e.d)) : new Date(key+"-01T12:00:00").toLocaleDateString("en-US",{month:"long"});
      if (!groups[key]) { groups[key]={ key, label, sessions:0 }; CATS.forEach(c=>groups[key][c]=0); }
      if (active.has(e.cat)) {
        groups[key][e.cat] += (volMode==="min" ? (e.min||0) : (e.dist||0));
        groups[key].sessions += 1;
      }
    });
    return Object.values(groups).sort((a,b)=>a.key.localeCompare(b.key));
  }, [volMode, groupMode, active]);

  const hrData = useMemo(() => {
    const rows = LOG.filter(e=>e.hr!=null).sort((a,b)=>a.d-b.d);
    return rows.map((e,i) => {
      const win = rows.slice(Math.max(0,i-4), i+1);
      return { label:fmtDay(e.d), date:e.date, name:e.name, cat:e.cat, hr:e.hr, maxHR:e.maxHR,
        avg:+(win.reduce((s,x)=>s+x.hr,0)/win.length).toFixed(1) };
    });
  }, []);
  const hrShown = hrData.filter(e => active.has(e.cat));

  // Run pace efficiency
  const paceData = useMemo(() =>
    LOG.filter(e => e.cat==="Run" && e.dist && e.min && e.hr).sort((a,b)=>a.d-b.d)
      .map(e => ({ label:fmtDay(e.d), name:e.name, pace:+(e.min/e.dist).toFixed(2), hr:e.hr, elev:e.elev }))
  , []);

  const elevData = useMemo(() =>
    LOG.filter(e=>e.elev!=null && active.has(e.cat)).sort((a,b)=>a.d-b.d)
      .map(e=>({ label:fmtDay(e.d), name:e.name, cat:e.cat, elev:e.elev }))
  , [active]);
  const elevAvg = elevData.length ? Math.round(elevData.reduce((s,e)=>s+e.elev,0)/elevData.length) : 0;

  const teByCat = useMemo(() => {
    const m={};
    LOG.filter(e=>e.teA!=null && active.has(e.cat)).forEach(e => {
      (m[e.cat]=m[e.cat]||[]).push({ x:e.teA, y:e.teAn, name:e.name, label:fmtDay(e.d) });
    });
    return m;
  }, [active]);

  const cumData = useMemo(() => {
    let d=0,v=0;
    return LOG.filter(e=>active.has(e.cat)).sort((a,b)=>a.d-b.d).map(e => {
      d+=e.dist||0; v+=e.elev||0;
      return { label:fmtDay(e.d), dist:+d.toFixed(1), vert:Math.round(v) };
    });
  }, [active]);

  const loadData = useMemo(() =>
    LOG.filter(e=>e.load!=null).map(e=>({ label:fmtDay(e.d), name:e.name, load:e.load, cat:e.cat }))
  , []);

  const mix = useMemo(() => {
    const total = shown.reduce((s,e)=>s+(e.min||0),0)||1;
    return activeCats.map(c => {
      const m = LOG.filter(e=>e.cat===c).reduce((s,e)=>s+(e.min||0),0);
      return { cat:c, min:m, pct:(m/total)*100 };
    }).filter(x=>x.min>0).sort((a,b)=>b.min-a.min);
  }, [shown, activeCats]);

  const totals = useMemo(() => ({
    sessions: shown.length,
    hours:(shown.reduce((s,e)=>s+(e.min||0),0)/60).toFixed(1),
    dist: shown.reduce((s,e)=>s+(e.dist||0),0).toFixed(1),
    gain: Math.round(shown.reduce((s,e)=>s+(e.elev||0),0)),
  }), [shown]);

  // Consistency calendar
  const calendar = useMemo(() => {
    const start = mondayOf(LOG[0].d);
    const end = mondayOf(LOG[LOG.length-1].d);
    const byDate = {};
    LOG.forEach(e => { (byDate[e.date]=byDate[e.date]||[]).push(e); });
    const sympt = Object.fromEntries(SYMPTOMS.map(s=>[s.date,s.label]));
    const weeks=[];
    for (let w=new Date(start); w<=end; w.setDate(w.getDate()+7)) {
      const days=[];
      for (let i=0;i<7;i++) {
        const d=new Date(w); d.setDate(d.getDate()+i);
        const key=dateKey(d);
        days.push({ key, sessions:byDate[key]||[], symptom:sympt[key] });
      }
      weeks.push({ monday:fmtDay(new Date(w)), days });
    }
    return weeks;
  }, []);

  // Day-of-week pattern
  const dow = useMemo(() => {
    const names=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const counts=[0,0,0,0,0,0,0];
    LOG.forEach(e=>{ if(active.has(e.cat)) counts[(e.d.getDay()+6)%7]++; });
    return names.map((n,i)=>({ day:n, count:counts[i] }));
  }, [active]);

  // Personal records
  const prs = useMemo(() => {
    const runs = LOG.filter(e=>e.cat==="Run"&&e.dist);
    const rides = LOG.filter(e=>e.cat==="Bike"&&e.dist);
    const withElev = LOG.filter(e=>e.elev);
    const withMin = LOG.filter(e=>e.min);
    const best = (arr, f) => arr.length ? arr.reduce((a,b)=>f(b)>f(a)?b:a) : null;
    const bestPace = paceData.length ? paceData.reduce((a,b)=>b.pace<a.pace?b:a) : null;
    const r = [];
    const lr = best(runs, e=>e.dist); if(lr) r.push(["Longest run", `${lr.dist} mi`, `${lr.name} · ${fmtDay(lr.d)}`]);
    const lrd = best(rides, e=>e.dist); if(lrd) r.push(["Longest ride", `${lrd.dist} mi`, `${lrd.name} · ${fmtDay(lrd.d)}`]);
    const bv = best(withElev, e=>e.elev); if(bv) r.push(["Biggest vert", `${bv.elev.toLocaleString()} ft`, `${bv.name} · ${fmtDay(bv.d)}`]);
    const ls = best(withMin, e=>e.min); if(ls) r.push(["Longest session", pad(ls.min), `${ls.name} · ${fmtDay(ls.d)}`]);
    if(bestPace) r.push(["Fastest run pace", `${bestPace.pace} min/mi`, `${bestPace.name} · ${bestPace.label}`]);
    r.push(["Hardest rope grade", "5.12", "Autobelay · May 30"]);
    r.push(["Hardest boulder", "V4", "Apr 26 & May 10"]);
    return r;
  }, [paceData]);

  const Delta = ({ cur, prev, unit, fmt=(x)=>Math.round(x) }) => {
    const diff = cur-prev, up = diff>=0;
    return <span style={{ color:up?ACCENT:"#C77", fontSize:12, fontWeight:700, marginLeft:6 }}>{up?"▲":"▼"} {fmt(Math.abs(diff))}{unit}</span>;
  };

  const rampColor = ramp.pct>130?BAD:ramp.pct>120?WARN:ACCENT;

  const TABS = ["Trends","Consistency","Records","Strength","Log"];

  return (
    <div style={{ minHeight:"100vh", background:BG, color:INK, fontFamily:'"Inter","Helvetica Neue",system-ui,sans-serif', padding:"24px 14px 48px", overflowX:"hidden" }}>
      <div style={{ maxWidth:1080, margin:"0 auto" }}>

        <header style={{ position:"relative", overflow:"hidden", borderRadius:16, padding:"24px 20px 22px", marginBottom:16, border:`1px solid ${GRID}`, background:"linear-gradient(160deg,#16211a,#0f160f)" }}>
          <Topo />
          <div style={{ position:"relative" }}>
            <div style={{ color:ACCENT, fontSize:11.5, letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:8 }}>Training Log · 2026</div>
            <h1 style={{ margin:0, fontSize:34, fontWeight:800, letterSpacing:"-0.025em", lineHeight:1 }}>Trail Report</h1>
            <p style={{ color:MUTED, margin:"9px 0 0", fontSize:13 }}>Apr 22 – Jul 7 · {LOG.length} sessions · Bridger Range, MT</p>
          </div>
        </header>

        {/* Week compare + ramp */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))", gap:12, marginBottom:14 }}>
          <div style={{ background:PANEL, border:`1px solid ${GRID}`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ color:MUTED, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>This week vs last</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(105px,1fr))", gap:8 }}>
              {[["Sessions",weekCompare.cur.n,weekCompare.prev.n,"",(x)=>x],
                ["Time",weekCompare.cur.min,weekCompare.prev.min,"m",(x)=>Math.round(x)],
                ["Distance",weekCompare.cur.dist,weekCompare.prev.dist," mi",(x)=>x.toFixed(1)],
                ["Vert",weekCompare.cur.elev,weekCompare.prev.elev," ft",(x)=>Math.round(x)],
              ].map(([l,c,p,u,f]) => (
                <div key={l}>
                  <div style={{ color:MUTED, fontSize:10.5 }}>{l}</div>
                  <div style={{ fontSize:18, fontWeight:800 }}>{f(c)}{u}<Delta cur={c} prev={p} unit={u} fmt={f} /></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:PANEL, border:`1px solid ${GRID}`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ color:MUTED, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>
              Ramp rate <span style={{ textTransform:"none", letterSpacing:0 }}>· this week vs 4-wk avg time</span>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
              <span style={{ fontSize:26, fontWeight:800, color:rampColor }}>{Math.round(ramp.pct)}%</span>
              <span style={{ color:MUTED, fontSize:12 }}>{Math.round(ramp.cur)}m vs {Math.round(ramp.base)}m avg</span>
            </div>
            <div style={{ position:"relative", height:10, background:"#1d2620", borderRadius:5, marginTop:10, overflow:"hidden" }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${Math.min(100,(ramp.pct/160)*100)}%`, background:rampColor, borderRadius:5 }} />
              <div style={{ position:"absolute", left:`${(120/160)*100}%`, top:0, bottom:0, width:1.5, background:WARN }} />
            </div>
            <div style={{ color:MUTED, fontSize:10.5, marginTop:6 }}>
              {ramp.pct>130 ? "Well above typical — watch recovery & symptoms" :
               ramp.pct>120 ? "Above the ~120% caution line — big jump" :
               "Within a sustainable build range (marker = 120%)"}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12, alignItems:"center" }}>
          {CATS.map(c => {
            const on = active.has(c);
            const n = LOG.filter(e=>e.cat===c).length;
            return (
              <button key={c} onClick={()=>toggle(c)} onDoubleClick={()=>only(c)} title="Click toggles · double-click isolates" style={{
                display:"flex", alignItems:"center", gap:7, cursor:"pointer", padding:"6px 12px", borderRadius:999,
                fontSize:12.5, fontWeight:600, border:`1px solid ${on?COLOR[c]:GRID}`,
                background:on?`${COLOR[c]}22`:"transparent", color:on?INK:MUTED, transition:"all .15s" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:on?COLOR[c]:MUTED }} />
                {c}<span style={{ color:MUTED, fontWeight:500 }}>{n}</span>
              </button>
            );
          })}
          {active.size<CATS.length && <button onClick={allOn} style={{ background:"none", border:"none", color:ACCENT, fontSize:12, cursor:"pointer", fontWeight:600 }}>reset</button>}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:2, marginBottom:14, borderBottom:`1px solid ${GRID}`, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"9px 13px", background:"none", cursor:"pointer", fontSize:13, fontWeight:700, whiteSpace:"nowrap", flexShrink:0,
              color: tab===t?INK:MUTED, border:"none", borderBottom:`2px solid ${tab===t?ACCENT:"transparent"}`, marginBottom:-1 }}>
              {t}
            </button>
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
              {[["min","Time"],["dist","Distance"]].map(([m,l]) => (
                <button key={m} onClick={()=>setVolMode(m)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${GRID}`, color:volMode===m?INK:MUTED, background:volMode===m?"#22301f":"transparent" }}>{l}</button>
              ))}
              <span style={{ width:1, background:GRID, margin:"0 2px" }} />
              {[["week","Weekly"],["month","Monthly"]].map(([m,l]) => (
                <button key={m} onClick={()=>setGroupMode(m)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${GRID}`, color:groupMode===m?INK:MUTED, background:groupMode===m?"#22301f":"transparent" }}>{l}</button>
              ))}
            </div>}>
            <ResponsiveContainer width="100%" height={290}>
              <ComposedChart data={volData} margin={{ top:6, right:6, left:-8, bottom:0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} interval={0} angle={-20} textAnchor="end" height={44} />
                <YAxis yAxisId="v" tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="s" orientation="right" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} cursor={{ fill:"#ffffff08" }}
                  formatter={(v,n)=> n==="sessions"?[v,"sessions"]:[`${Math.round(v)} ${volMode==="min"?"min":"mi"}`,n]} />
                {groupMode==="week" && volData.map(w => w.key===lastMonday &&
                  <ReferenceArea key="cur" x1={w.label} x2={w.label} yAxisId="v" fill={ACCENT} fillOpacity={0.07} />)}
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
                <Tooltip contentStyle={tipStyle} content={({payload,label}) => payload&&payload.length ? (
                  <div style={tipStyle}>
                    <div style={{fontWeight:700}}>{payload[0].payload.name}</div>
                    <div style={{color:MUTED}}>{label} · {payload[0].payload.cat}</div>
                    <div>{payload[0].payload.hr} bpm avg{payload[0].payload.maxHR?` · ${payload[0].payload.maxHR} max`:""} (rolling {payload[0].payload.avg})</div>
                  </div>) : null} />
                {EVENTS.map(ev => {
                  const pt = hrShown.find(e=>e.date===ev.date);
                  return pt ? <ReferenceDot key={ev.date} x={pt.label} y={pt.hr} r={9} fill="none" stroke={ev.color} strokeWidth={1.5} label={{ value:ev.label, fill:ev.color, fontSize:10, position:"top" }} /> : null;
                })}
                <Scatter dataKey="hr">{hrShown.map((e,i)=><Cell key={i} fill={COLOR[e.cat]} />)}</Scatter>
                <Line type="monotone" dataKey="avg" stroke={INK} strokeWidth={2} dot={false} strokeOpacity={0.75} />
              </ComposedChart>
            </ResponsiveContainer>
            <Legend cats={activeCats.filter(c=>hrShown.some(e=>e.cat===c))} />
          </Panel>

          <Panel title="Run Pace Efficiency" sub="min/mi on runs with full data · lower is better · vert & HR in tooltip">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={paceData} margin={{ top:8, right:10, left:-6, bottom:0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                <YAxis domain={[10,18]} tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} reversed />
                <Tooltip contentStyle={tipStyle} content={({payload,label}) => payload&&payload.length ? (
                  <div style={tipStyle}>
                    <div style={{fontWeight:700}}>{payload[0].payload.name}</div>
                    <div style={{color:MUTED}}>{label}</div>
                    <div>{payload[0].payload.pace} min/mi · {payload[0].payload.hr} bpm{payload[0].payload.elev?` · ${payload[0].payload.elev} ft`:""}</div>
                  </div>) : null} />
                <Line type="monotone" dataKey="pace" stroke={COLOR.Run} strokeWidth={2} dot={{ r:4, fill:COLOR.Run }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ color:MUTED, fontSize:10.5, marginTop:6 }}>Axis flipped so up = faster. Steep-vert runs (Jun 19/21) naturally read slower.</div>
          </Panel>

          <Panel title="Training Effect" sub="aerobic vs anaerobic (Garmin TE)">
            <ResponsiveContainer width="100%" height={230}>
              <ScatterChart margin={{ top:6, right:12, left:-8, bottom:4 }}>
                <CartesianGrid stroke={GRID} />
                <ReferenceLine x={3} stroke={MUTED} strokeDasharray="3 3" />
                <ReferenceLine y={2} stroke={MUTED} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" domain={[0,5]} ticks={[0,1,2,3,4,5]} tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} label={{ value:"Aerobic →", position:"insideBottomRight", fill:MUTED, fontSize:10.5, dy:6 }} />
                <YAxis type="number" dataKey="y" domain={[0,5]} ticks={[0,1,2,3,4,5]} tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={false} label={{ value:"Anaerobic →", angle:-90, position:"insideTopLeft", fill:MUTED, fontSize:10.5, dx:14, dy:22 }} />
                <ZAxis range={[75,75]} />
                <Tooltip contentStyle={tipStyle} cursor={{ strokeDasharray:"3 3", stroke:GRID }} content={({payload}) => payload&&payload[0] ? (
                  <div style={tipStyle}>
                    <div style={{fontWeight:700}}>{payload[0].payload.name}</div>
                    <div style={{color:MUTED}}>{payload[0].payload.label}</div>
                    <div>Aerobic {payload[0].payload.x} · Anaerobic {payload[0].payload.y}</div>
                  </div>) : null} />
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

          <Panel title="Exercise Load" sub="Garmin load · logged Jul 2 onward">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={loadData} margin={{ top:4, right:6, left:0, bottom:0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                <YAxis tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tipStyle} cursor={{ fill:"#ffffff08" }} formatter={(v)=>[v,"load"]} labelFormatter={(l,p)=>p&&p[0]?`${p[0].payload.name} · ${l}`:l} />
                <Bar dataKey="load" radius={[3,3,0,0]}>{loadData.map((e,i)=><Cell key={i} fill={COLOR[e.cat]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ color:MUTED, fontSize:10.5, marginTop:6 }}>Send load from future screenshots and this fills in — 3 sessions so far.</div>
          </Panel>

          <Panel title="Calories & Sweat Loss" sub="bars = total kcal · line = est. sweat (ml) · logged Jul 2 onward">
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={FUEL} margin={{ top:6, right:0, left:0, bottom:0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} />
                <YAxis yAxisId="c" tick={{ fill:MUTED, fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="s" orientation="right" tick={{ fill:"#7C93AD", fontSize:10.5 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tipStyle} content={({payload,label}) => payload&&payload.length ? (
                  <div style={tipStyle}>
                    <div style={{fontWeight:700}}>{payload[0].payload.name}</div>
                    <div style={{color:MUTED}}>{label}</div>
                    <div>{payload[0].payload.cal} kcal · {payload[0].payload.sweat.toLocaleString()} ml sweat</div>
                  </div>) : null} />
                <Bar yAxisId="c" dataKey="cal" fill={COLOR.Bike} fillOpacity={0.85} radius={[3,3,0,0]} />
                <Line yAxisId="s" type="monotone" dataKey="sweat" stroke="#7C93AD" strokeWidth={2} dot={{ r:4, fill:"#7C93AD" }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ color:MUTED, fontSize:10.5, marginTop:6 }}>~1L sweat on both long Crosscut rides — worth matching with fluid intake on 90min+ days. Fills in as you send these stats.</div>
          </Panel>

          <Panel title="Cumulative Progress" sub="running totals across the season">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={cumData} margin={{ top:6, right:4, left:-8, bottom:0 }}>
                <defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} /><stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={{stroke:GRID}} minTickGap={20} />
                <YAxis yAxisId="d" tick={{ fill:MUTED, fontSize:10.5 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="v" orientation="right" tick={{ fill:"#7C93AD", fontSize:10.5 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tipStyle} formatter={(v,n)=>n==="dist"?[`${v} mi`,"distance"]:[`${v.toLocaleString()} ft`,"vert"]} />
                <Area yAxisId="d" type="monotone" dataKey="dist" stroke={ACCENT} strokeWidth={2} fill="url(#gd)" />
                <Line yAxisId="v" type="monotone" dataKey="vert" stroke="#7C93AD" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", gap:16, marginTop:8 }}>
              <span style={{ display:"flex", alignItems:"center", gap:6, color:MUTED, fontSize:11 }}><span style={{width:12,height:3,background:ACCENT,borderRadius:2}}/>Distance (mi)</span>
              <span style={{ display:"flex", alignItems:"center", gap:6, color:MUTED, fontSize:11 }}><span style={{width:12,height:3,background:"#7C93AD",borderRadius:2}}/>Vert (ft)</span>
            </div>
          </Panel>

          <Panel title="Activity Mix" sub="share of logged time">
            <div style={{ display:"flex", height:20, borderRadius:6, overflow:"hidden", marginBottom:14 }}>
              {mix.map(m => <div key={m.cat} title={`${m.cat} ${m.pct.toFixed(0)}%`} style={{ width:`${m.pct}%`, background:COLOR[m.cat] }} />)}
            </div>
            {mix.map(m => (
              <div key={m.cat} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${GRID}`, fontSize:12.5 }}>
                <span style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:9, height:9, borderRadius:2, background:COLOR[m.cat] }} />{m.cat}</span>
                <span style={{ color:MUTED }}>{(m.min/60).toFixed(1)} h · {m.pct.toFixed(0)}%</span>
              </div>
            ))}
          </Panel>

          <Panel title="Bodyweight" sub="check-ins · lb (month-level, approx.)">
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
          <Panel title="Training Calendar" sub="dot size = sessions that day · yellow ring = symptom day" full>
            <div style={{ overflowX:"auto", paddingBottom:6 }}>
              <div style={{ display:"flex", gap:5 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginRight:4 }}>
                  <div style={{ height:14 }} />
                  {["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{ width:14, height:16, color:MUTED, fontSize:9.5, lineHeight:"16px" }}>{d}</div>)}
                </div>
                {calendar.map((w,wi) => (
                  <div key={wi} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <div style={{ height:14, color:MUTED, fontSize:8.5, whiteSpace:"nowrap", transform:"translateX(-2px)" }}>{wi%2===0?w.monday:""}</div>
                    {w.days.map(day => {
                      const n = day.sessions.filter(s=>active.has(s.cat)).length;
                      const cat = n ? day.sessions.find(s=>active.has(s.cat)).cat : null;
                      return (
                        <div key={day.key} title={n?`${day.key}: ${day.sessions.map(s=>s.name).join(", ")}${day.symptom?` · ⚠ ${day.symptom}`:""}`:(day.symptom?`${day.key}: ⚠ ${day.symptom}`:day.key)}
                          style={{ width:16, height:16, borderRadius:4,
                            background: n ? COLOR[cat] : "#1a231c",
                            opacity: n ? (n>1?1:0.85) : 1,
                            boxShadow: day.symptom ? `0 0 0 2px ${WARN}` : "none",
                            transform: n>1 ? "scale(1.05)" : "none" }} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
              <span style={{ color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:"#1a231c" }} />rest</span>
              <span style={{ color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:ACCENT }} />trained</span>
              <span style={{ color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:"#1a231c", boxShadow:`0 0 0 2px ${WARN}` }} />symptom day</span>
            </div>
            <div style={{ color:MUTED, fontSize:10.5, marginTop:8 }}>
              Symptom days logged: Jun 2 (headache), Jun 27 (positional dizziness), Jul 4 (neck / floating, meclizine). Note both June flares and Jul 4 sit inside or just after harder blocks.
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
          <Panel title="Personal Records" sub="auto-computed from this log · season to date" full>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
              {prs.map(([l,v,who]) => (
                <div key={l} style={{ background:"#101711", border:`1px solid ${GRID}`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ color:MUTED, fontSize:10.5, letterSpacing:"0.08em", textTransform:"uppercase" }}>{l}</div>
                  <div style={{ fontSize:21, fontWeight:800, margin:"3px 0 2px", color:ACCENT }}>{v}</div>
                  <div style={{ color:MUTED, fontSize:11.5 }}>{who}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Climbing Grades" sub="from session notes" full>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
              {CLIMB_SESSIONS.map((c,i) => (
                <div key={i} style={{ background:"#101711", border:`1px solid ${GRID}`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontWeight:700, fontSize:13.5 }}>{c.date}</span>
                    <span style={{ color:COLOR.Climb, fontSize:11.5, fontWeight:700 }}>{c.type}</span>
                  </div>
                  <div style={{ fontSize:19, fontWeight:800, margin:"4px 0 2px" }}>max {c.max}</div>
                  <div style={{ color:MUTED, fontSize:11.5 }}>{c.detail}</div>
                </div>
              ))}
            </div>
            <div style={{ color:MUTED, fontSize:10.5, marginTop:10 }}>Holding steady ~V4 boulder / 5.10–5.12 rope across the season.</div>
          </Panel>
        </div>}

        {tab==="Strength" && <StrengthLogger logged={LOG.filter(e=>e.cat==="Strength")} />}

        {tab==="Log" && (
          <Panel title="Session Log" sub={`${shown.length} of ${LOG.length} sessions · filtered by chips above · newest first`} full>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5, minWidth:640 }}>
                <thead>
                  <tr style={{ color:MUTED, textAlign:"left" }}>
                    {["Date","Session","Dist","Time","HR","Elev","TE","Load","Notes"].map(h =>
                      <th key={h} style={{ padding:"7px 8px", borderBottom:`1px solid ${GRID}`, fontWeight:600, fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...shown].reverse().map((e,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${GRID}` }}>
                      <td style={{ padding:"8px", whiteSpace:"nowrap", color:MUTED }}>{fmtDay(e.d)}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>
                        <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:COLOR[e.cat], marginRight:7 }} />
                        {e.name}
                      </td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.dist!=null?`${e.dist} mi`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.min!=null?pad(e.min):"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.hr!=null?`${e.hr}${e.maxHR?` / ${e.maxHR}`:""}`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.elev!=null?`${e.elev.toLocaleString()} ft`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.teA!=null?`${e.teA} / ${e.teAn}`:"—"}</td>
                      <td style={{ padding:"8px", whiteSpace:"nowrap" }}>{e.load!=null?e.load:"—"}</td>
                      <td style={{ padding:"8px", color:MUTED, minWidth:180 }}>{e.notes||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <p style={{ color:MUTED, fontSize:11, textAlign:"center", marginTop:16 }}>
          Rebuilt from full log history · chips filter every tab · double-click a chip to isolate
        </p>
      </div>
    </div>
  );
}
