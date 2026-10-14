// ccrs_filter_browser.js
// The filter that produced data/panel_raw.csv. It was run in a browser tab on data.ca.gov (Oct 14, 2026),
// streaming the CCRS Crashes and Parties files for 2019-2026 without saving them, and keeping
// injury/fatal crashes in 12 jurisdictions. Output: counts by city, month, mode, lighting,
// location band, pedestrian action and fatal flag; these were summed into data/panel_raw.csv.
// Source files: https://data.ca.gov/dataset/ccrs (CHP update of Oct 5, 2026).

const base = 'https://data.ca.gov/dataset/80c6a49d-c6b3-40ba-86d8-379c9741b4be/resource/';
const ids = {
  crashes: {2019:'2b4c7d03-e684-435e-80da-17935de9499f',2020:'a2e0605d-0695-4bce-806d-4d0dda7ace68',2021:'d08692e2-6d36-487e-bca0-28cd127a626f',2022:'7828780b-117b-455e-9275-986ad3ffde50',2023:'436642c0-cd04-4a4c-b45e-564b66437476',2024:'f775df59-b89b-4f82-bd3d-8807fa3a22a0',2025:'9f4fc839-122d-4595-a146-43bc4ed16f46',2026:'b8ce0ca4-b4e9-490d-b4d1-1f4ec48cbefb'},
  parties: {2019:'1a06775e-7d4a-4574-b3d4-f815d02d236a',2020:'ebfed5da-82d6-4af2-bf40-b9516d7935a9',2021:'754fe00c-f3bf-4f2f-80d0-ed4aa7b89b77',2022:'9ef51178-51cb-4939-9344-2d0907740580',2023:'84376be5-548b-44e3-8ebc-73e8a2ca9945',2024:'93892d36-017b-4a2a-bc0b-f1f385060b96',2025:'a2676918-a825-4b77-8e5c-6eadb38d6b1a',2026:'348a4266-bbb6-439f-b6c7-0018cc79f0fe'}};
const url = (kind, y) => base + ids[kind][y] + '/download/' + kind + '_' + y + '.csv';

// CCRS "City Name|County Code" -> jurisdiction
const study = {'Oxnard|56':'Oxnard','Lodi|39':'Lodi','San Diego|37':'San Diego','Gilroy|43':'Gilroy',
  'Unincorporated|19':'LA County unincorporated','Sacramento|34':'Sacramento','Pacifica|41':'Pacifica',
  'Pomona|19':'Pomona','Oakland|1':'Oakland','San Francisco|38':'San Francisco',
  'Citrus Heights|34':'Citrus Heights','Los Angeles|19':'Los Angeles (city)'};

// streaming CSV parser (handles quoted fields); calls onRow(fields) per record
async function streamCSV(u, onRow) {
  const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status);
  const reader = r.body.getReader(), dec = new TextDecoder('utf-8');
  let field = '', row = [], inQ = false;
  const push = () => { row.push(field); field = ''; onRow(row); row = []; };
  for (;;) {
    const {done, value} = await reader.read(); if (done) break;
    const s = dec.decode(value, {stream: true});
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inQ) { if (ch === '"') { if (s[i+1] === '"') { field += '"'; i++; } else inQ = false; } else field += ch; }
      else if (ch === '"' && field === '') inQ = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') push();
      else if (ch !== '\r') field += ch;
    }
  }
  if (field !== '' || row.length) push();
}

const lightCat = s => s === 'DAYLIGHT' ? 'day' : s === 'DUSK-DAWN' ? 'dusk' : s.startsWith('DARK') ? 'dark' : 'unk';
// distance from the cross street: blank or 0 = at the intersection (CHP 555 convention)
const locCat = (road, d, u) => {
  if (!road) return 'no_cross_street';
  if (d === '' || +d === 0) return 'at_intersection';
  const ft = +d * (u === 'M' ? 5280 : 1); if (isNaN(ft)) return 'unk';
  return ft <= 20 ? '1_20ft' : ft <= 100 ? '21_100ft' : ft <= 250 ? '101_250ft' : 'over_250ft';
};
const paCat = s => ({'CROSSING IN CROSS WALK AT INTERSECTION':'xwalk_at_int','CROSSING IN CROSS WALK - NOT AT INTERSECTION':'xwalk_midblock',
  'CROSSING - NOT IN CROSSWALK':'crossing_no_xwalk','IN ROAD - INCLUDES SHOULDER':'in_road','NOT IN ROAD':'not_in_road',
  'NO PEDESTRIANS INVOLVED':'none'})[s] || 'other';

async function run() {
  const agg = {}, meta = {};
  for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
    const C = new Map(); let H = null, ix, total = 0, kept = 0, dup = 0, deleted = 0;
    await streamCSV(url('crashes', y), row => {
      if (!H) { H = row.map(h => h.trim()); ix = Object.fromEntries(H.map((h, i) => [h, i])); return; }
      total++;
      const g = k => (row[ix[k]] || '').trim();
      const city = study[g('City Name') + '|' + g('County Code')]; if (!city) return;
      if (g('IsDeleted') === 'True') { deleted++; return; }
      const inj = +g('NumberInjured') || 0, kil = +g('NumberKilled') || 0; if (inj + kil === 0) return;  // injury or fatal only
      const id = g('Collision Id'); if (C.has(id)) dup++;
      const m = g('Crash Date Time').match(/^(\d+)\/(\d+)\/(\d{4})/); if (!m) return;
      const mv = g('MotorVehicleInvolvedWithDesc');
      C.set(id, {city, ym: m[3] + '-' + m[1].padStart(2, '0'), light: lightCat(g('LightingDescription')),
        loc: locCat(g('SecondaryRoad'), g('SecondaryDistance'), g('SecondaryUnitOfMeasure')),
        pa: paCat(g('PedestrianActionDesc')), ped: mv === 'PEDESTRIAN', bike: mv === 'BICYCLE', k: kil > 0});
      kept++;
    });
    H = null;
    await streamCSV(url('parties', y), row => {                       // add pedestrian/cyclist parties
      if (!H) { H = row.map(h => h.trim()); ix = Object.fromEntries(H.map((h, i) => [h, i])); return; }
      const c = C.get((row[ix['CollisionId']] || '').trim()); if (!c) return;
      const pt = (row[ix['PartyType']] || '').trim(), v = (row[ix['Vehicle1TypeDesc']] || '').trim();
      if (pt === 'Pedestrian' || v === 'Pedestrian') c.ped = true;
      if (pt === 'Bicyclist' || v === 'Bicycle' || v === 'ElectricBicycles') c.bike = true;
    });
    for (const c of C.values()) {
      const mode = c.ped && c.bike ? 'ped_and_bike' : c.ped ? 'ped' : c.bike ? 'bike' : 'vehicle_only';
      const key = [c.city, c.ym, mode, c.light, c.loc, c.pa, c.k ? 1 : 0].join('|');
      agg[key] = (agg[key] || 0) + 1;
    }
    meta[y] = {total_rows: total, study_injury_crashes: kept, dup_ids: dup, deleted};
  }
  return {agg, meta};
}
// The detailed counts were then collapsed to the city-month outcome columns of data/panel_raw.csv
// (definitions in the README and in the xlsx sheet data_dictionary).
