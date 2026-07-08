// Seed dataset — your training log through Jul 7, 2026, baked in as the
// app's starting point. Once the app runs on your device, new sessions are
// saved to LOCAL storage (storage.js) and merged with this seed. This file
// is the app's default history; your live/edited data lives on-device.
//
// Row shape:
// [date, name, category, dist(mi), min, avgHR, maxHR, elev(ft), teAerobic, teAnaerobic, load, notes]

export const SEED_LOG = [
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
];

export const SEED_WEIGHT = [
  { date:"2026-04-15", w:173.0, note:"During GI illness / travel" },
  { date:"2026-06-10", w:183.0, note:"Recovered training" },
  { date:"2026-06-28", w:182.5, note:"Current; harness looser" },
];

export const SEED_FUEL = [
  { date:"2026-07-02", name:"Mountain Biking", cal:803, sweat:1112 },
  { date:"2026-07-03", name:"Cycling", cal:410, sweat:528 },
  { date:"2026-07-04", name:"Mountain Biking", cal:744, sweat:1042 },
  { date:"2026-07-05", name:"Mountain Biking", cal:619, sweat:989 },
  { date:"2026-07-07", name:"Strength A", cal:341, sweat:502 },
];

export const SEED_SYMPTOMS = [
  { date:"2026-06-02", label:"Headache" },
  { date:"2026-06-27", label:"Positional dizziness" },
  { date:"2026-07-04", label:"Neck / floating · meclizine" },
];
