/* =========================================================================
   VIS AI Werkbeeld — app logic (v2: portfolio, capaciteit, pipeline, kaart,
   dossiers). Mock mode + optional live mode.
   Pure helpers are exported for Node tests; DOM code runs only in browser.
   ========================================================================= */
(function (global) {
  "use strict";
  const IS_NODE = typeof module !== "undefined" && module.exports;
  const DATA = IS_NODE ? require("./data.js") : { DB: global.DB, TODAY: global.TODAY };
  const DB = DATA.DB, TODAY = DATA.TODAY;
  const PUBLIC = IS_NODE ? require("./vis-public.js") : (global.VIS_PUBLIC || { team: [], projects: [], agents: [], expertise: [], meta: {} });

  /* ---------- date helpers ---------- */
  function d(s) { return new Date(s + "T00:00:00"); }
  function daysUntil(dateStr, from) { return Math.round((d(dateStr) - d(from || TODAY)) / 86400000); }
  function fmtDate(s) { if (!s) return "—"; const dt = d(s); return dt.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }); }
  function eur(n) { return n == null ? "—" : "€ " + n.toLocaleString("nl-NL"); }

  /* ---------- month window (Gantt & capaciteit): jul 2026 – dec 2027 ----- */
  const MONTH_NAMES = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  function monthsRange(fromKey, count) {
    const out = [];
    let [y, m] = fromKey.split("-").map(Number);
    for (let i = 0; i < count; i++) {
      const start = new Date(y, m - 1, 1), end = new Date(y, m, 0);
      out.push({ key: y + "-" + String(m).padStart(2, "0"), label: MONTH_NAMES[m - 1] + " " + String(y).slice(2), start, end, days: end.getDate() });
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }
  const WINDOW = monthsRange("2026-07", 18);
  const W_START = WINDOW[0].start, W_END = WINDOW[WINDOW.length - 1].end;
  function pctPos(dateStr) {
    const t = Math.min(Math.max(d(dateStr), W_START), W_END);
    return ((t - W_START) / (W_END - W_START)) * 100;
  }
  function overlapFrac(startStr, endStr, month) {
    const s = Math.max(d(startStr), month.start), e = Math.min(d(endStr), month.end);
    if (e < s) return 0;
    return Math.min(1, (e - s) / 86400000 / month.days + (1 / month.days));
  }
  function monthAdd(key, n) {
    let [y, m] = key.split("-").map(Number);
    m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; }
    return y + "-" + String(m).padStart(2, "0");
  }

  /* ---------- role / access ---------- */
  let currentRole = DB.roles[0];
  function setRole(id) { currentRole = DB.roles.find(r => r.id === id) || DB.roles[0]; }
  function visibleProjects(role) {
    role = role || currentRole;
    if (role.scope === "all") return DB.projects;
    return DB.projects.filter(p => role.scope.includes(p.id));
  }
  function canSeeFinance(role) { return (role || currentRole).finance; }
  function allPortfolio() { return DB.projects.concat(DB.extraProjects); }

  /* ---------- portfolio computations (v1) ---------- */
  function permitsSoon(days, role) {
    const out = [];
    visibleProjects(role).forEach(p => p.permits.forEach(v => {
      if (v.decisionDue && daysUntil(v.decisionDue) >= 0 && daysUntil(v.decisionDue) <= days)
        out.push({ project: p, permit: v, inDays: daysUntil(v.decisionDue) });
    }));
    return out;
  }
  function overdueActions(role) {
    const out = [];
    visibleProjects(role).forEach(p => p.actions.forEach(a => {
      if (a.open && daysUntil(a.due) < 0) out.push({ project: p, action: a, daysOver: -daysUntil(a.due) });
    }));
    return out.sort((a, b) => b.daysOver - a.daysOver);
  }
  function actionsOpenLongerThan(days, role) {
    const out = [];
    visibleProjects(role).forEach(p => p.actions.forEach(a => {
      const openDays = -daysUntil(a.opened);
      if (a.open && openDays > days) out.push({ project: p, action: a, openDays });
    }));
    return out.sort((a, b) => b.openDays - a.openDays);
  }
  function hoursOverPlan(role) {
    return visibleProjects(role).filter(p => p.hoursActual > p.hoursPlanned)
      .map(p => ({ project: p, pct: Math.round((p.hoursActual / p.hoursPlanned - 1) * 100) }));
  }
  function projectsAtRisk(role) {
    return visibleProjects(role).filter(p => p.health === "attention" || p.health === "data-gap");
  }
  function expectedInvoicing(role) {
    let open = 0, wip = 0;
    visibleProjects(role).forEach(p => {
      p.invoices.forEach(i => { if (!i.paid) open += i.amount; });
      if (p.feesPlanned && p.feesInvoiced != null) wip += Math.max(0, Math.round(p.feesPlanned * p.phasePct / 100) - p.feesInvoiced);
    });
    return { openInvoices: open, unbilledWip: wip };
  }
  function openRfis(role) {
    const out = [];
    visibleProjects(role).forEach(p => p.rfis.forEach(r => { if (r.open) out.push({ project: p, rfi: r }); }));
    return out;
  }
  function portfolioRisks(role) {
    const out = [];
    visibleProjects(role).forEach(p => p.risks.forEach(r => { if (r.open && r.severity === "hoog") out.push({ project: p, risk: r }); }));
    return out;
  }
  function comparables(tags) {
    return DB.knowledge.filter(k => tags.some(t => k.tags.includes(t)));
  }
  function missingForForecast(p) {
    const gaps = [];
    if (p.budget == null) gaps.push({ what: "Vastgesteld bouwbudget", impact: "Kosten- en honorariumbandbreedte blijft indicatief.", where: "Opdrachtbevestiging / gesprek opdrachtgever", action: "Budgetkader bevestigen (actie " + (p.actions[0] ? p.actions[0].id : "-") + ")" });
    (p.documents.missing || []).forEach(m => gaps.push({ what: m, impact: "Verlaagt betrouwbaarheid van planning en raming.", where: "Projectdossier / uit te voeren onderzoek", action: "Inplannen en koppelen aan dossier" }));
    const daysSince = -daysUntil(p._src.last_updated);
    if (daysSince > 7) gaps.push({ what: "Actuele urenregistratie (laatste update " + fmtDate(p._src.last_updated) + ")", impact: "Urenbeeld mogelijk verouderd (" + daysSince + " dagen).", where: "Urenregistratie (AFAS-demo)", action: "Team vragen uren bij te werken" });
    return gaps;
  }

  /* =========================================================================
     CAPACITEITSENGINE (v2)
     Belasting per persoon per maand = overhead
       + Σ actieve projecten × faseoverlap × rolvraag × toewijzingsaandeel
     Capaciteit = 1 − verlofdeel. Benutting = belasting / capaciteit.
     In productie komen fasen/uren live uit planning- en urensystemen.
     ========================================================================= */
  function holidayFrac(member, month) {
    let daysOff = 0;
    (member.holidays || []).forEach(h => {
      const s = Math.max(d(h.from), month.start), e = Math.min(d(h.to), month.end);
      if (e >= s) daysOff += (e - s) / 86400000 + 1;
    });
    /* dempingsfactor 0,5: verlof verlaagt capaciteit, maar teams plannen
       projectwerk deels om verlof heen — voorkomt onrealistische pieken */
    return Math.min(0.45, 0.5 * (daysOff / month.days));
  }
  function projectRoleDemand(p, month) {
    const out = { architect: 0, technisch: 0, visualisator: 0, coordinator: 0 };
    (p.schedule || []).forEach(ph => {
      const frac = overlapFrac(ph.start, ph.end, month);
      if (!frac) return;
      const dem = DB.phaseDemand[ph.phase] || {};
      Object.keys(out).forEach(r => out[r] += frac * (dem[r] || 0));
    });
    return out;
  }
  function memberLoad(member, month, overlays) {
    let load = member.overhead || 0;
    DB.projects.forEach(p => {
      if (p.status !== "actief") return;
      const dem = projectRoleDemand(p, month);
      const share = (p.assign[member.role] || {})[member.id] || 0;
      load += dem[member.role] * share;
    });
    (overlays || []).forEach(o => {
      if ((o.members[member.role] || {})[member.id]) {
        const frac = overlapFrac(o.start, o.end, month);
        load += frac * o.demand[member.role] * o.members[member.role][member.id] * (o.weight == null ? 1 : o.weight);
      }
    });
    return load;
  }
  function memberUtil(member, monthKey, overlays) {
    const month = WINDOW.find(m => m.key === monthKey) || WINDOW[0];
    const cap = 1 - holidayFrac(member, month);
    const load = memberLoad(member, month, overlays);
    return { pct: Math.round((load / Math.max(cap, 0.1)) * 100), cap, load, off: holidayFrac(member, month) > 0.15 };
  }
  function roleUtil(role, monthKey, overlays) {
    const members = DB.team.filter(t => t.role === role);
    const month = WINDOW.find(m => m.key === monthKey) || WINDOW[0];
    let load = 0, cap = 0;
    members.forEach(m => { load += memberLoad(m, month, overlays); cap += 1 - holidayFrac(m, month); });
    return Math.round((load / Math.max(cap, 0.1)) * 100);
  }
  function bottlenecks(monthCount, overlays) {
    const out = [];
    WINDOW.slice(0, monthCount || 12).forEach(month => {
      DB.team.forEach(t => {
        const u = memberUtil(t, month.key, overlays);
        if (u.pct > 100) out.push({ month, member: t, pct: u.pct });
      });
    });
    return out;
  }
  function leastLoaded(role, fromKey, months) {
    const keys = []; for (let i = 0; i < (months || 3); i++) keys.push(monthAdd(fromKey || WINDOW[0].key, i));
    let best = null;
    DB.team.filter(t => t.role === role).forEach(t => {
      const avg = keys.reduce((s, k) => s + memberUtil(t, k).pct, 0) / keys.length;
      if (!best || avg < best.avg) best = { member: t, avg: Math.round(avg) };
    });
    return best;
  }

  /* Pipeline: gewogen capaciteitsvraag */
  function pipelineEnd(pl) {
    const [y, m] = pl.expectedStart.slice(0, 7).split("-").map(Number);
    const end = new Date(y, m - 1 + pl.durationMonths, 0);
    return end.toISOString().slice(0, 10);
  }
  function pipelineLoad(monthKey, role, weighted) {
    const month = WINDOW.find(m => m.key === monthKey); if (!month) return 0;
    let load = 0;
    DB.pipeline.forEach(pl => {
      const frac = overlapFrac(pl.expectedStart, pipelineEnd(pl), month);
      if (frac) load += frac * pl.demand[role] * (weighted ? pl.probability : 1);
    });
    return load;
  }
  function pipelineRoleUtil(role, monthKey, weighted) {
    const members = DB.team.filter(t => t.role === role);
    const month = WINDOW.find(m => m.key === monthKey);
    let cap = 0; members.forEach(m => cap += 1 - holidayFrac(m, month));
    return Math.round((pipelineLoad(monthKey, role, weighted) / Math.max(cap, 0.1)) * 100);
  }

  /* Scenario: nieuw project simuleren */
  function scenarioImpact(cfg) {
    const type = DB.scenarioTypes.find(t => t.id === cfg.type) || DB.scenarioTypes[0];
    const cx = DB.complexity.find(c => c.id === cfg.complexity) || DB.complexity[1];
    const months = cfg.months || type.months;
    const demand = {};
    Object.keys(type.demand).forEach(r => demand[r] = +(type.demand[r] * cx.factor).toFixed(2));
    function overlayFor(startKey) {
      const start = startKey + "-01";
      const end = monthAdd(startKey, months - 1) + "-28";
      const members = {};
      Object.keys(demand).forEach(r => {
        if (!demand[r]) return;
        const pick = leastLoaded(r, startKey, 3);
        if (pick) members[r] = { [pick.member.id]: 1 };
      });
      return { start, end, demand, members, weight: cfg.probability == null ? 1 : cfg.probability };
    }
    function peakFor(startKey) {
      const ov = [overlayFor(startKey)];
      let peak = { pct: 0 };
      for (let i = 0; i < Math.min(months, 8); i++) {
        const k = monthAdd(startKey, i);
        DB.team.forEach(t => {
          const u = memberUtil(t, k, ov);
          if (u.pct > peak.pct) peak = { pct: u.pct, member: t, monthKey: k };
        });
      }
      return { peak, overlay: ov[0] };
    }
    const base = peakFor(cfg.startKey);
    const hot = [];
    for (let i = 0; i < Math.min(months, 8); i++) {
      const k = monthAdd(cfg.startKey, i);
      DB.team.forEach(t => { const u = memberUtil(t, k, [base.overlay]); if (u.pct > 100) hot.push({ member: t, monthKey: k, pct: u.pct }); });
    }
    let alt = null;
    for (let s = 1; s <= 5; s++) {
      const cand = peakFor(monthAdd(cfg.startKey, s));
      if (cand.peak.pct <= 100) { alt = { shift: s, startKey: monthAdd(cfg.startKey, s), peak: cand.peak }; break; }
      if (!alt || cand.peak.pct < alt.peak.pct) alt = { shift: s, startKey: monthAdd(cfg.startKey, s), peak: cand.peak };
    }
    const archPick = leastLoaded("architect", cfg.startKey, 3);
    return { type, months, demand, base, hot, alt, archPick,
      external: base.peak.pct > 115,
      monthLabel: k => { const m = WINDOW.find(w => w.key === k); return m ? m.label : k; } };
  }

  /* Deadline-collisies: projecten die dezelfde persoon nodig hebben met
     mijlpalen binnen 14 dagen van elkaar. */
  function assignedMembers(p) {
    const ids = new Set();
    Object.values(p.assign || {}).forEach(roleMap => Object.keys(roleMap).forEach(id => { if (roleMap[id] > 0) ids.add(id); }));
    return ids;
  }
  function deadlineCollisions() {
    const out = [];
    const act = DB.projects.filter(p => p.status === "actief");
    for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
      const a = act[i], b = act[j];
      const shared = [...assignedMembers(a)].filter(x => assignedMembers(b).has(x));
      if (!shared.length) continue;
      (a.msList || []).forEach(ma => (b.msList || []).forEach(mb => {
        const gap = Math.abs(daysUntil(mb.date) - daysUntil(ma.date));
        if (gap <= 14 && daysUntil(ma.date) > -30 && daysUntil(ma.date) < 200) {
          out.push({ a, b, ma, mb, gap, shared: shared.map(id => DB.team.find(t => t.id === id).name) });
        }
      }));
    }
    return out;
  }
  function permitRisk(days) {
    const out = [];
    DB.projects.forEach(p => {
      (p.msList || []).forEach(ms => {
        if (ms.type !== "vergunning") return;
        const dev = (p.deviations || []).find(x => x.milestone === ms.title);
        const eff = dev ? dev.forecast : ms.date;
        const du = daysUntil(eff);
        if (du >= -10 && du <= days) out.push({ project: p, ms, dev, effective: eff, inDays: du });
      });
    });
    return out.sort((a, b) => a.inDays - b.inDays);
  }
  function allDeviations() {
    const out = [];
    DB.projects.forEach(p => (p.deviations || []).forEach(dev => out.push({ project: p, dev, delta: daysUntil(dev.forecast) - daysUntil(dev.planned) })));
    return out;
  }
  function milestonesWithin(days) {
    const out = [];
    DB.projects.forEach(p => (p.msList || []).forEach(ms => {
      const du = daysUntil(ms.date);
      if (du >= 0 && du <= days) out.push({ project: p, ms, inDays: du });
    }));
    return out.sort((a, b) => a.inDays - b.inDays);
  }
  function dossierScore(p) {
    const pres = (p.documents && p.documents.present || []).length;
    const miss = (p.documents && p.documents.missing || []).length;
    return Math.round(pres / Math.max(pres + miss, 1) * 100);
  }

  /* ---------- assistant (mock engine, answers computed from DB) ---------- */
  function srcChip(s) { return { name: s.source_name, updated: s.last_updated, confidence: s.confidence }; }
  const PLANSRC = { name: "Planning & capaciteitsmodel (demo)", updated: TODAY, confidence: 0.8 };
  const CRMSRC = { name: "Acquisitieregister (CRM-demo)", updated: "2026-07-14", confidence: 0.75 };

  function answerProject(p) {
    const fin = canSeeFinance();
    const gaps = missingForForecast(p);
    return {
      title: p.name + " — projectbeeld",
      confidence: p._src.confidence,
      paragraphs: [
        p.type + " te " + p.location + " (" + p.heritage + "). Fase: " + p.phase + " (" + p.phasePct + "%). " + p.healthReason
      ],
      facts: [
        ["Mijlpalen", p.milestones.map(m => m.title + " — " + fmtDate(m.due) + " (" + m.status + ")").join(" · ")],
        ["Uren", p.hoursActual + " van " + p.hoursPlanned + " gepland" + (p.hoursActual > p.hoursPlanned ? " (" + Math.round((p.hoursActual / p.hoursPlanned - 1) * 100) + "% boven plan)" : "")],
        fin ? ["Budget / honorarium", eur(p.budget) + " · gefactureerd " + eur(p.feesInvoiced) + " van " + eur(p.feesPlanned)] : ["Budget / honorarium", "Afgeschermd voor jouw rol"],
        ["Vergunningen", p.permits.map(v => v.name + ": " + v.status + (v.decisionDue ? " (besluit uiterlijk " + fmtDate(v.decisionDue) + ")" : "")).join(" · ")],
        ["Open acties", p.actions.filter(a => a.open).length + " · Open RFI's: " + p.rfis.filter(r => r.open).length],
        ["Risico's (open)", p.risks.filter(r => r.open).map(r => r.title + " [" + r.severity + "]").join(" · ") || "geen"],
        ["Planning-afwijkingen", (p.deviations || []).map(x => x.milestone + ": " + fmtDate(x.planned) + " → " + fmtDate(x.forecast)).join(" · ") || "geen"],
        ["Laatste klantcommunicatie", p.communications[0] ? fmtDate(p.communications[0].date) + " — " + p.communications[0].summary : "—"],
        ["Duurzaamheid", p.sustainability.join(" · ")],
        ["Veiligheid", p.safety.join(" · ")]
      ],
      warnings: gaps.map(g => "Ontbreekt: " + g.what + " — " + g.impact + " Vind dit waarschijnlijk in: " + g.where + "."),
      sources: [srcChip(p._src), { name: "Documentenregister (SharePoint-demo)", updated: TODAY, confidence: 0.9 }]
    };
  }

  function answerBriefing() {
    const risk = projectsAtRisk(), perm = permitsSoon(30), over = overdueActions(), hrs = hoursOverPlan();
    const inv = expectedInvoicing();
    const bn = bottlenecks(3);
    return {
      title: "Managementbriefing — week van " + fmtDate(TODAY),
      confidence: 0.85,
      paragraphs: ["Concept-briefing op basis van " + visibleProjects().length + " zichtbare projecten. Mensen beslissen; het systeem informeert."],
      facts: [
        ["Aandacht nodig", risk.map(p => p.name + " — " + p.healthReason).join(" · ") || "geen"],
        ["Vergunningsbesluiten ≤ 30 dagen", perm.map(x => x.project.name + " (" + x.inDays + " dagen)").join(" · ") || "geen"],
        ["Acties over datum", over.map(x => x.action.title + " (" + x.project.id + ", " + x.daysOver + " dagen)").join(" · ") || "geen"],
        ["Uren boven plan", hrs.map(x => x.project.name + " (+" + x.pct + "%)").join(" · ") || "geen"],
        ["Capaciteitssignaal", bn.length ? bn.slice(0, 3).map(b => b.member.name + " " + b.pct + "% in " + b.month.label).join(" · ") : "geen overbelasting komende 3 maanden"],
        canSeeFinance() ? ["Openstaande facturen / onderhanden werk", eur(inv.openInvoices) + " / ± " + eur(inv.unbilledWip)] : ["Financieel", "Afgeschermd voor jouw rol"]
      ],
      warnings: DB.projects.some(p => p.health === "data-gap") ? ["Let op: minimaal één project heeft onvolledige data (zie Landhuis Oosterduin) — briefing daar minder betrouwbaar."] : [],
      sources: visibleProjects().map(p => srcChip(p._src)).concat([PLANSRC])
    };
  }

  function answerForecast(p) {
    const comp = comparables([p.compare.buildingType, p.compare.intervention]);
    const gaps = missingForForecast(p);
    return {
      title: "Concept-projectprognose — " + p.name,
      confidence: p.budget == null ? 0.55 : 0.78,
      paragraphs: [
        "AI-ondersteund concept. Vereist beoordeling door een bevoegde VIS-architect of projectleider vóór verzending aan de klant.",
        "Scope: " + p.scope
      ],
      facts: [
        ["Aannames", "Gebaseerd op " + comp.length + " vergelijkbare (demo-)projecten en de huidige dossierstand."],
        ["Benodigde onderzoeken", (p.documents.missing || []).join(" · ") || "dossier compleet"],
        ["Vergelijkbare projecten", comp.map(k => k.project).join(" · ") || "—"],
        ["Hoofdlijnenplanning", p.milestones.map(m => m.title + " — " + fmtDate(m.due)).join(" · ")],
        ["Verwachte vergunningsroute", p.permits.map(v => v.name + " via " + v.authority).join(" · ") + " (indicatief: reguliere procedure 8 wkn + evt. 6 wkn verlenging — REG-2, demo)"],
        canSeeFinance() ? ["Kosten-/honorariumbandbreedte", (p.budget ? eur(Math.round(p.budget * 0.95)) + " – " + eur(Math.round(p.budget * 1.15)) : "nog niet af te geven — budgetkader ontbreekt")] : ["Kostenbandbreedte", "Afgeschermd voor jouw rol"],
        ["Duurzaamheidskansen", p.sustainability.join(" · ")],
        ["Veiligheid & uitvoering", p.safety.join(" · ")],
        ["Belangrijkste risico's", p.risks.map(r => r.title).join(" · ")],
        ["Volgende klantbesluiten", p.rfis.filter(r => r.open).map(r => r.title).join(" · ") || "geen openstaand"]
      ],
      warnings: gaps.map(g => "Nog nodig: " + g.what + " — " + g.action + "."),
      sources: [srcChip(p._src), { name: "Kennisbank eerdere projecten (demo)", updated: "2026-07-01", confidence: 0.8 }, { name: "Regelgevingsbron REG-2 (demo-uittreksel)", updated: "2026-07-01", confidence: 0.7 }]
    };
  }

  function findProject(q) {
    q = q.toLowerCase();
    return visibleProjects().find(p =>
      q.includes(p.id.toLowerCase()) || p.name.toLowerCase().split(" ").some(w => w.length > 4 && q.includes(w)));
  }

  function answer(question) {
    const q = question.toLowerCase();
    const publicCue = ["vis ", "vis-", "portfolio", "gepubliceerde", "publieke", "ervaring", "expertise"].some(signal => q.includes(signal));
    const publicDomain = ["kerk", "erfgoed", "herbestemming", "3d-scan", "3d scan", "bouwhistor"].some(signal => q.includes(signal));
    const operationalCue = ["actief", "status", "vertraging", "planning", "vergunning", "risico", "capaciteit", "uren", "budget", "pipeline"].some(signal => q.includes(signal));
    if (PUBLIC.projects.length && (publicCue || (publicDomain && !operationalCue))) {
      const tagMap = {
        "kerk": "kerk", "herbestem": "herbestemming", "3d": "3d-scan", "scan": "3d-scan",
        "bouwhistor": "onderzoek", "onderzoek": "onderzoek", "restaur": "restauratie",
        "verduur": "verduurzaming", "boerderij": "boerderij", "landhuis": "landhuis",
        "museum": "museum", "wonen": "wonen", "gevel": "gevel"
      };
      const wanted = Object.keys(tagMap).filter(k => q.includes(k)).map(k => tagMap[k]);
      const matches = PUBLIC.projects.filter(p => !wanted.length || wanted.every(t => p.tags.includes(t) || (p.type + " " + p.summary).toLowerCase().includes(t)));
      const shown = matches.slice(0, 12);
      return {
        title: "VIS Portfolio & Kennisassistent — publiek onderbouwd antwoord",
        confidence: 0.92,
        paragraphs: [
          wanted.length ? "Gevonden op basis van: " + wanted.join(", ") + "." : "Overzicht op basis van de gepubliceerde VIS-portfolio en bureau-informatie.",
          "Dit antwoord beschrijft publieke ervaring. Het doet geen uitspraak over huidige status, betrokken medewerkers, beschikbaarheid, budget of resultaat."
        ],
        facts: [
          ["Relevante projecten", shown.map(p => "<strong>" + p.name + "</strong> (" + p.location + ") — " + p.summary).join("<br><br>") || "Geen directe match in de publieke snapshot."],
          ["Publieke expertise", PUBLIC.expertise.join(" · ")],
          ["Nog intern te verifiëren", "Opdrachtomvang, betrokken team, actuele projectstatus, geleverde fasen, resultaten en toestemming voor hergebruik."]
        ],
        warnings: ["Een VIS-professional moet de toepasbaarheid van precedenten en alle extern gebruikte claims beoordelen."],
        sources: [{ name: "VIS Architecten — publieke portfolio", updated: "2026-07-16", confidence: 0.95 }, { name: "VIS Architecten — over ons & expertise", updated: "2026-07-16", confidence: 0.95 }]
      };
    }
    if (q.includes("project x")) return answerProject(DB.projects[0]);
    const byName = findProject(q);

    /* -------- v2: capaciteit & portfolio -------- */
    if (q.includes("capaciteitsdruk") || q.includes("capaciteitsprobl") || q.includes("overbelast")) {
      const bn = bottlenecks(6);
      const now = DB.team.map(t => ({ t, u: memberUtil(t, WINDOW[0].key) })).sort((a, b) => b.u.pct - a.u.pct);
      return {
        title: "Capaciteitsdruk — huidige stand en komende 6 maanden", confidence: 0.8,
        paragraphs: ["Berekend uit faseplanning × rolvraag × toewijzing (demo-model). Grootste druk nu: " + now[0].t.name + " (" + now[0].u.pct + "%)."],
        facts: [
          ["Benutting deze maand", now.map(x => x.t.name + " " + x.u.pct + "%" + (x.u.pct > 100 ? " ⚠" : "")).join(" · ")],
          ["Overbelaste periodes", bn.length ? bn.map(b => b.member.name + " " + b.pct + "% in " + b.month.label).join(" · ") : "geen boven 100%"],
          ["Piekmaand", bn.length ? bn.sort((a, b) => b.pct - a.pct)[0].month.label + " (" + bn[0].member.name + ", " + bn[0].pct + "%)" : "—"]
        ],
        warnings: ["Capaciteitsmodel is een DEMO-aanname; in productie gevoed door planning- en urensystemen."],
        sources: [PLANSRC]
      };
    }
    if (q.includes("beschikbare capaciteit") || q.includes("meeste ruimte") || (q.includes("architect") && q.includes("beschikbaar"))) {
      const best = leastLoaded("architect", WINDOW[0].key, 3);
      const all = DB.team.filter(t => t.role === "architect").map(t => t.name + " " + Math.round([0,1,2].reduce((s,i)=>s+memberUtil(t, monthAdd(WINDOW[0].key,i)).pct,0)/3) + "%");
      return {
        title: "Beschikbare capaciteit architecten (gemiddeld komende 3 maanden)", confidence: 0.8,
        paragraphs: [best.member.name + " heeft de meeste beschikbare capaciteit (gemiddeld " + best.avg + "% benut)."],
        facts: [["Benutting per architect", all.join(" · ")]],
        warnings: [], sources: [PLANSRC]
      };
    }
    if (q.includes("ruimte in het team") || q.includes("wanneer ontstaat")) {
      const rows = WINDOW.slice(0, 10).map(m => ({ m, u: roleUtil("architect", m.key) })).filter(x => x.u < 85);
      return {
        title: "Wanneer ontstaat er ruimte in het team?", confidence: 0.75,
        paragraphs: [rows.length ? "Architectenbenutting zakt onder 85% in: " + rows.map(x => x.m.label).join(", ") + "." : "Komende 10 maanden geen maand met architectbenutting onder 85% — ruimte ontstaat pas na oplevering Herengracht 14 (feb 2027)."],
        facts: WINDOW.slice(0, 10).map(m => [m.label, "architecten " + roleUtil("architect", m.key) + "% · technisch " + roleUtil("technisch", m.key) + "% · coördinatie " + roleUtil("coordinator", m.key) + "%"]),
        warnings: [], sources: [PLANSRC]
      };
    }
    if ((q.includes("nieuw") && (q.includes("aannemen") || q.includes("starten") || q.includes("aan te nemen"))) || q.includes("oktober")) {
      const sc = scenarioImpact({ type: "townhouse", complexity: "middel", startKey: "2026-10" });
      return {
        title: "Kunnen we in oktober een nieuw monumentaal renovatieproject starten?", confidence: 0.7,
        paragraphs: ["Simulatie (DEMO-aanbeveling, geen zekerheid): een middelgroot renovatieproject vanaf oktober brengt de piekbelasting op " + sc.base.peak.pct + "% (" + (sc.base.peak.member ? sc.base.peak.member.name : "") + ", " + sc.monthLabel(sc.base.peak.monthKey) + ")." + (sc.alt && sc.alt.peak.pct < sc.base.peak.pct ? " Start in " + sc.monthLabel(sc.alt.startKey) + " verlaagt de piek naar " + sc.alt.peak.pct + "%." : "")],
        facts: [
          ["Overbelaste periodes bij oktober-start", sc.hot.length ? sc.hot.map(h => h.member.name + " " + h.pct + "% (" + sc.monthLabel(h.monthKey) + ")").join(" · ") : "geen"],
          ["Aanbevolen toewijzing", (sc.archPick ? sc.archPick.member.name : "—") + " heeft de meeste ruimte in de conceptfase"],
          ["Externe capaciteit", sc.external ? "waarschijnlijk nodig (piek > 115%)" : "waarschijnlijk niet nodig"]
        ],
        warnings: ["DEMO-aanbeveling op basis van het capaciteitsmodel; besluit blijft bij de directie. Zie ook de scenarioplanner onder Capaciteit."],
        sources: [PLANSRC]
      };
    }
    if (q.includes("wordt gewonnen") || (q.includes("gewonnen") && q.includes("pipeline")) || q.includes("pipeline project")) {
      const pl = DB.pipeline.find(x => q.includes(x.name.toLowerCase().split(" ")[1] ? x.name.toLowerCase().split(" ")[1] : "@")) || DB.pipeline[1];
      const ov = { start: pl.expectedStart, end: pipelineEnd(pl), demand: pl.demand, members: { architect: { [leastLoaded("architect", pl.expectedStart.slice(0, 7), 3).member.id]: 1 }, technisch: { fatima: 1 }, coordinator: { bas: 1 }, visualisator: { daan: 1 } }, weight: 1 };
      const startKey = pl.expectedStart.slice(0, 7);
      const rows = [0, 1, 2, 3].map(i => { const k = monthAdd(startKey, i); return [ (WINDOW.find(w=>w.key===k)||{label:k}).label, "architecten " + roleUtil("architect", k, [ov]) + "% (was " + roleUtil("architect", k) + "%)" ]; });
      return {
        title: "Impact als " + pl.name + " wordt gewonnen", confidence: 0.7,
        paragraphs: ["Kans " + Math.round(pl.probability * 100) + "%, verwachte start " + fmtDate(pl.expectedStart) + ", looptijd " + pl.durationMonths + " mnd (DEMO)."],
        facts: rows,
        warnings: ["Bij gunning samen met de al geplande projecten ontstaat druk op de coördinatierol in Q4 — zie Capaciteit → heatmap met pipeline-overlay."],
        sources: [srcChip(pl._src), PLANSRC]
      };
    }
    if (q.includes("acquisitiepijplijn") || q.includes("pijplijn") || (q.includes("pipeline") && !q.includes("gewonnen"))) {
      const fin = canSeeFinance();
      return {
        title: "Acquisitiepijplijn", confidence: 0.8,
        paragraphs: [DB.pipeline.length + " kansen in de pijplijn; gewogen architectvraag komende 6 mnd zichtbaar onder Pipeline."],
        facts: DB.pipeline.map(pl => [pl.name, pl.stage + " · kans " + Math.round(pl.probability * 100) + "% · start " + fmtDate(pl.expectedStart) + (fin ? " · " + eur(pl.estValue) : "")]),
        warnings: fin ? [] : ["Geschatte waarden afgeschermd voor jouw rol."],
        sources: [CRMSRC]
      };
    }
    if (q.includes("overlappende vergunning") || (q.includes("overlappende") && q.includes("deadline"))) {
      const col = deadlineCollisions().filter(c => q.includes("vergunning") ? (c.ma.type === "vergunning" || c.mb.type === "vergunning") : true);
      return {
        title: "Overlappende deadlines" + (q.includes("vergunning") ? " (vergunningen)" : ""), confidence: 0.8,
        paragraphs: [col.length ? col.length + " overlap(pen) gevonden waarbij dezelfde teamleden nodig zijn." : "Geen overlappende deadlines gevonden binnen 14 dagen met gedeelde teamleden."],
        facts: col.map(c => [c.a.name + " × " + c.b.name, c.ma.title + " (" + fmtDate(c.ma.date) + ") en " + c.mb.title + " (" + fmtDate(c.mb.date) + ") — " + c.gap + " dagen uit elkaar · gedeeld: " + c.shared.join(", ")]),
        warnings: [], sources: [PLANSRC]
      };
    }
    if (q.includes("dezelfde architect")) {
      const col = deadlineCollisions();
      return {
        title: "Projecten die dezelfde mensen nodig hebben in dezelfde periode", confidence: 0.8,
        paragraphs: [col.length ? "Onderstaande combinaties delen teamleden rond dezelfde mijlpaaldata." : "Geen conflicten gevonden."],
        facts: col.map(c => [c.a.name + " × " + c.b.name, "gedeeld: " + c.shared.join(", ") + " · " + c.ma.title + " vs " + c.mb.title + " (" + c.gap + " dgn)"]),
        warnings: [], sources: [PLANSRC]
      };
    }
    if (q.includes("mijlpalen") && q.includes("risico")) {
      const devs = allDeviations();
      const soon = milestonesWithin(45);
      return {
        title: "Mijlpalen met risico", confidence: 0.8,
        paragraphs: ["Afwijkende prognoses en mijlpalen binnen 45 dagen, vergeleken met de oorspronkelijke planning (DEMO)."],
        facts: devs.map(x => [x.project.name + " — " + x.dev.milestone, "gepland " + fmtDate(x.dev.planned) + " → prognose " + fmtDate(x.dev.forecast) + " (+" + x.delta + " dgn) · reden: " + x.dev.reason])
          .concat(soon.slice(0, 4).map(x => [x.project.name + " — " + x.ms.title, "over " + x.inDays + " dagen (" + fmtDate(x.ms.date) + ")"])),
        warnings: [], sources: [PLANSRC, { name: "Actielijsten & verslagen (demo)", updated: TODAY, confidence: 0.75 }]
      };
    }
    if (q.includes("wijken af") || q.includes("oorspronkelijke planning")) {
      const devs = allDeviations();
      return {
        title: "Projecten die afwijken van hun oorspronkelijke planning", confidence: 0.82,
        paragraphs: [devs.length + " afwijking(en) gesignaleerd door vergelijking van planning met actuele projectinformatie."],
        facts: devs.map(x => [x.project.name, x.dev.milestone + ": " + fmtDate(x.dev.planned) + " → " + fmtDate(x.dev.forecast) + " (+" + x.delta + " dgn). Reden: " + x.dev.reason + " Bronnen: " + x.dev.sources.join(", ")]),
        warnings: [], sources: devs.map(x => srcChip(x.project._src))
      };
    }
    if (q.includes("vertraging") && (q.includes("gevolgen") || q.includes("andere"))) {
      const devs = allDeviations().filter(x => x.dev.affects);
      return {
        title: "Vertragingen met gevolgen voor andere projecten of fasen", confidence: 0.75,
        paragraphs: ["Doorwerkingen afgeleid uit gedeelde teamleden en afhankelijke fasen (DEMO)."],
        facts: devs.map(x => [x.project.name + " — " + x.dev.milestone + " (+" + x.delta + " dgn)", "Raakt: " + x.dev.affects]),
        warnings: [], sources: [PLANSRC]
      };
    }
    if ((q.includes("60 dagen") || q.includes("zestig")) && q.includes("vergunning")) {
      const list = permitRisk(60);
      return {
        title: "Vergunningsrisico's komende 60 dagen", confidence: 0.8,
        paragraphs: [list.length + " vergunningsmijlpa(a)l(en) binnen 60 dagen (prognosedata meegewogen)."],
        facts: list.map(x => [x.project.name + " — " + x.ms.title, "effectief " + fmtDate(x.effective) + (x.dev ? " (gepland " + fmtDate(x.dev.planned) + ", reden: " + x.dev.reason + ")" : "") + " · over " + x.inDays + " dagen"]),
        warnings: ["Termijnen indicatief; controleer bij bevoegd gezag."],
        sources: list.map(x => srcChip(x.project._src)).concat([{ name: "Regelgevingsbron REG-2 (demo)", updated: "2026-07-01", confidence: 0.7 }])
      };
    }
    if (q.includes("gearchiveerd") || q.includes("archief")) {
      const inc = DB.extraProjects.filter(p => p.status === "afgerond" && p.archiveReady < 1);
      return {
        title: "Afgeronde projecten die nog niet volledig gearchiveerd zijn", confidence: 0.85,
        paragraphs: [inc.length ? inc.length + " project(en) met onvolledig archief." : "Alle afgeronde projecten zijn volledig gearchiveerd."],
        facts: inc.map(p => [p.name, "archiefgereedheid " + Math.round(p.archiveReady * 100) + "% · ontbreekt: " + p.archiveMissing.join(", ")]),
        warnings: [], sources: inc.map(p => srcChip(p._src))
      };
    }
    if (q.includes("projectmappen") || q.includes("verplichte documenten")) {
      const rows = DB.projects.filter(p => (p.documents.missing || []).length)
        .map(p => [p.name + " (" + dossierScore(p) + "% compleet)", "ontbreekt: " + p.documents.missing.join(", ")]);
      return {
        title: "Projectdossiers met ontbrekende verplichte documenten", confidence: 0.85,
        paragraphs: [rows.length + " dossier(s) onvolledig. Details en mappenstructuur onder Projectdossiers."],
        facts: rows, warnings: [], sources: [{ name: "Documentenregister (SharePoint-demo)", updated: TODAY, confidence: 0.9 }]
      };
    }
    if (q.includes("den haag") && (q.includes("actieve") || q.includes("actief") || q.includes("laat alle"))) {
      const list = visibleProjects().filter(p => p.location === "Den Haag");
      return {
        title: "Actieve projecten in Den Haag", confidence: 0.9,
        paragraphs: [list.length + " actieve projecten in Den Haag. Zie ook de Projectkaart."],
        facts: list.map(p => [p.name, p.type + " · " + p.phase + " (" + p.phasePct + "%)"]),
        warnings: [], sources: list.map(p => srcChip(p._src))
      };
    }
    if (q.includes("vergunningsfase") || (q.includes("restauratie") && q.includes("vergunning"))) {
      const inPhase = DB.projects.filter(p => p.typeTag === "restauratie" && (p.schedule || []).some(s => (s.phase === "vgproc" || s.phase === "vgvoorb") && d(s.start) <= d(TODAY) && d(s.end) >= d(TODAY)));
      return {
        title: "Restauratieprojecten in de vergunningsfase", confidence: 0.85,
        paragraphs: [inPhase.length ? inPhase.map(p => p.name).join(", ") : "Op dit moment geen restauratieprojecten in de vergunningsfase. Landhuis Oosterduin bereikt die fase naar verwachting in december 2026 (prognose: aanvraag 28-09 vertraagd ingediend)."],
        facts: inPhase.map(p => [p.name, p.phase]),
        warnings: [], sources: [PLANSRC]
      };
    }
    if (q.includes("drie maanden") || q.includes("belangrijke deadlines") || q.includes("komende deadlines")) {
      const list = milestonesWithin(92);
      return {
        title: "Belangrijke deadlines komende drie maanden", confidence: 0.85,
        paragraphs: [list.length + " mijlpalen binnen 92 dagen."],
        facts: list.map(x => [fmtDate(x.ms.date) + " — " + x.project.name, x.ms.title + " (" + x.ms.type + ", over " + x.inDays + " dgn)"]),
        warnings: [], sources: [PLANSRC]
      };
    }

    /* -------- v1 matchers -------- */
    if (q.includes("vergunning")) {
      const list = permitsSoon(30);
      return {
        title: "Vergunningsbesluiten binnen 30 dagen", confidence: 0.9,
        paragraphs: [list.length ? "Er " + (list.length === 1 ? "is 1 besluit" : "zijn " + list.length + " besluiten") + " verwacht binnen 30 dagen." : "Geen besluiten verwacht binnen 30 dagen."],
        facts: list.map(x => [x.project.name, x.permit.name + " — besluit uiterlijk " + fmtDate(x.permit.decisionDue) + " (over " + x.inDays + " dagen), " + x.permit.authority]),
        warnings: ["Termijnen indicatief op basis van demo-regelgevingsuittreksels; controleer bij bevoegd gezag."],
        sources: list.map(x => srcChip(x.project._src)).concat([{ name: "Regelgevingsbron REG-2 (demo)", updated: "2026-07-01", confidence: 0.7 }])
      };
    }
    if (q.includes("vertraging") || q.includes("risico op")) {
      const list = projectsAtRisk();
      return {
        title: "Projecten met risico op vertraging", confidence: 0.82,
        paragraphs: ["Beoordeling op basis van mijlpaalstatus, urenverbruik en dossiersignalen."],
        facts: list.map(p => [p.name, p.healthReason]),
        warnings: list.some(p => p.health === "data-gap") ? ["Landhuis Oosterduin: signaal deels gebaseerd op verouderde data (laatste update 30 jun)."] : [],
        sources: list.map(p => srcChip(p._src))
      };
    }
    if (q.includes("uren")) {
      const list = hoursOverPlan();
      return {
        title: "Projecten met uren boven plan", confidence: 0.93,
        paragraphs: [list.length ? list.length + " project(en) boven plan." : "Geen projecten boven urenplan."],
        facts: list.map(x => [x.project.name, x.project.hoursActual + " / " + x.project.hoursPlanned + " uur (+" + x.pct + "%)"]),
        warnings: [], sources: list.map(x => srcChip(x.project._src))
      };
    }
    if (q.includes("acties") || q.includes("tien dagen") || q.includes("10 dagen")) {
      const list = actionsOpenLongerThan(10);
      return {
        title: "Acties langer dan 10 dagen open", confidence: 0.91,
        paragraphs: [list.length + " actie(s) staan langer dan tien dagen open."],
        facts: list.map(x => [x.action.title, x.project.name + " · eigenaar " + x.action.owner + " · " + x.openDays + " dagen open · deadline " + fmtDate(x.action.due)]),
        warnings: [], sources: list.map(x => srcChip(x.project._src))
      };
    }
    if (q.includes("vergelijkbaar") || q.includes("vergelijkbare")) {
      const p = byName || DB.projects[0];
      const comp = comparables([p.compare.buildingType, p.compare.intervention]);
      return {
        title: "Vergelijkbare eerdere projecten — " + p.name, confidence: 0.8,
        paragraphs: ["Gevonden op gebouwtype '" + p.compare.buildingType + "' en ingreep '" + p.compare.intervention + "'."],
        facts: comp.map(k => [k.project, k.lesson]),
        warnings: ["Kennisbank bevat fictieve demo-projecten."],
        sources: [{ name: "Kennisbank eerdere projecten (demo)", updated: "2026-07-01", confidence: 0.8 }]
      };
    }
    if (q.includes("ontbreekt") || q.includes("betrouwbare")) {
      const p = byName || DB.projects[2];
      const gaps = missingForForecast(p);
      return {
        title: "Ontbrekende informatie voor betrouwbare prognose — " + p.name, confidence: 0.75,
        paragraphs: [gaps.length ? "Onderstaande informatie ontbreekt of is verouderd. Het systeem vult dit nooit stilzwijgend in." : "Dossier is compleet voor prognosedoeleinden."],
        facts: gaps.map(g => [g.what, g.impact + " → " + g.action]),
        warnings: [], sources: [srcChip(p._src)]
      };
    }
    if (q.includes("briefing")) return answerBriefing();
    if (q.includes("prognose")) return answerForecast(byName || DB.projects[0]);
    if (byName) return answerProject(byName);

    return {
      title: "Vraag niet herkend in mock-modus", confidence: 0.3,
      paragraphs: ["In deze demo beantwoord ik vragen op basis van vooraf geladen demo-data. Probeer één van de voorbeeldvragen, of noem een projectnaam (bijv. 'Laat mij Project X zien')."],
      facts: [], warnings: ["In live-modus (Anthropic API) worden vrije vragen beantwoord met bronvermelding uit de kennisbank."], sources: []
    };
  }

  /* Exports for Node tests */
  const api = { setRole, visibleProjects, canSeeFinance, permitsSoon, overdueActions, actionsOpenLongerThan, hoursOverPlan, projectsAtRisk, expectedInvoicing, openRfis, portfolioRisks, comparables, missingForForecast, answer, answerBriefing, answerForecast, answerProject, fmtDate, eur, daysUntil,
    WINDOW, memberUtil, roleUtil, bottlenecks, leastLoaded, pipelineLoad, pipelineRoleUtil, scenarioImpact, deadlineCollisions, permitRisk, allDeviations, milestonesWithin, dossierScore, monthAdd, DB, PUBLIC, TODAY };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  global.VIS = api;

  /* ======================================================================
     DOM RENDERING (browser only)
     ====================================================================== */
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function healthBadge(p) {
    const map = { ok: ["Op koers", "b-ok"], attention: ["Aandacht", "b-warn"], "data-gap": ["Data onvolledig", "b-gap"] };
    const m = map[p.health];
    return '<span class="badge ' + m[1] + '">' + m[0] + "</span>";
  }
  function confBar(c) {
    const pct = Math.round(c * 100);
    const cls = c >= 0.85 ? "ok" : c >= 0.7 ? "mid" : "low";
    return '<span class="conf ' + cls + '" title="Betrouwbaarheid op basis van databron en actualiteit">' + pct + "% zeker</span>";
  }
  function sourceChips(list) {
    return '<div class="chips">' + list.map(s =>
      '<span class="chip" title="Laatst bijgewerkt: ' + fmtDate(s.updated) + '">📄 ' + s.name + ' · ' + fmtDate(s.updated) + ' · ' + Math.round(s.confidence * 100) + "%</span>").join("") + "</div>";
  }

  function renderAnswer(a) {
    const box = el("div", "answer");
    box.appendChild(el("div", "answer-head", "<strong>" + a.title + "</strong>" + confBar(a.confidence)));
    a.paragraphs.forEach(t => box.appendChild(el("p", null, t)));
    if (a.facts.length) {
      const table = el("table", "facts");
      a.facts.forEach(f => { const tr = el("tr"); tr.appendChild(el("td", "k", f[0])); tr.appendChild(el("td", null, f[1])); table.appendChild(tr); });
      box.appendChild(table);
    }
    a.warnings.forEach(w => box.appendChild(el("div", "warn", "⚠︎ " + w)));
    if (a.sources.length) { box.appendChild(el("div", "src-label", "Bronnen & actualiteit")); box.insertAdjacentHTML("beforeend", sourceChips(a.sources)); }
    return box;
  }

  /* ---- modal ---- */
  function openModal(title, bodyEl) {
    const bg = el("div", "modal-bg");
    const m = el("div", "modal");
    m.appendChild(el("h3", null, title));
    m.appendChild(el("p", "muted small", "Gesimuleerde inhoud (DEMO) — in productie gekoppeld aan de cloud-/documentomgeving van het bureau."));
    m.appendChild(bodyEl);
    const close = el("button", "btn light", "Sluiten");
    close.style.marginTop = "14px";
    close.onclick = () => bg.remove();
    m.appendChild(close);
    bg.appendChild(m);
    bg.onclick = e => { if (e.target === bg) bg.remove(); };
    document.body.appendChild(bg);
  }
  function fakeFiles(p, category) {
    const base = p.id.replace("-", "");
    const items = {
      "Tekeningen": ["VIS_" + base + "_VO_Plattegrond-BG_v07.pdf", "VIS_" + base + "_DO_Gevels_v03.pdf", "VIS_" + base + "_Details_kap_v02.dwg"],
      "3D-scans": [base + "_scan_2026-04_binnenzijde.e57", base + "_scan_2026-04_exterieur.e57"],
      "Puntenwolken": [base + "_puntenwolk_totaal.rcp"],
      "Vergunningen": ["Aanvraag_omgevingsvergunning_" + base + ".pdf", "Besluit_gemeente.pdf"],
      "Budget": ["Kostenraming_element_v04.xlsx", "Honorarium_stand_jul26.xlsx"],
      "Bouwfoto's": ["2026-07-09_fundering_noord.jpg", "2026-07-02_kapconstructie.jpg"]
    };
    return items[category] || ["VIS_" + base + "_" + category.replace(/\s/g, "") + "_01.pdf", "VIS_" + base + "_" + category.replace(/\s/g, "") + "_02.pdf"];
  }

  /* ---- assistant panel ---- */
  const SUGGESTIONS = [
    "Welke publieke VIS-projecten zijn relevant voor de herbestemming van een kerk?",
    "Welke expertise van VIS past bij bouwhistorisch onderzoek en 3D-scannen?",
    "Welke gepubliceerde VIS-projecten combineren restauratie en verduurzaming?",
    "Laat mij Project X zien.",
    "Welke projecten lopen risico op vertraging?",
    "Waar zit de grootste capaciteitsdruk?",
    "Wie is de komende twee maanden overbelast?",
    "Kunnen we in oktober een nieuw monumentaal renovatieproject starten?",
    "Welke mijlpalen lopen risico?",
    "Welke projecten wijken af van hun oorspronkelijke planning?",
    "Welke vergunningen vormen de komende 60 dagen een risico?",
    "Welke projecten hebben overlappende vergunningsdeadlines?",
    "Wat gebeurt er met onze capaciteit als Pipeline Project Ter Horst wordt gewonnen?",
    "Welke projecten zijn afgerond maar nog niet volledig gearchiveerd?",
    "Welke projectmappen missen verplichte documenten?",
    "Laat alle actieve projecten in Den Haag zien.",
    "Maak een managementbriefing voor deze week."
  ];

  async function ask(q) {
    const log = $("#chat-log");
    log.appendChild(el("div", "msg user", q));
    const thinking = el("div", "msg ai thinking", "Geautoriseerde bronnen analyseren…");
    log.appendChild(thinking); log.scrollTop = log.scrollHeight;
    let a;
    if (window.LIVE_MODE) {
      try {
        const r = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, role: currentRole.id }) });
        if (!r.ok) throw new Error("api");
        const j = await r.json();
        a = { title: "Antwoord (live — Claude)", confidence: 0.8, paragraphs: [j.answer], facts: [], warnings: [], sources: (j.sources || []).map(s => ({ name: s, updated: TODAY, confidence: 0.8 })) };
      } catch (e) { a = answer(q); a.warnings.unshift("Live-modus niet bereikbaar — teruggevallen op mock-antwoord."); }
    } else { await new Promise(r => setTimeout(r, 450)); a = answer(q); }
    thinking.remove();
    const wrap = el("div", "msg ai"); wrap.appendChild(renderAnswer(a)); log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  /* ---- views ---- */
  function row(k, v) { return "<tr><td class='k'>" + k + "</td><td>" + v + "</td></tr>"; }

  function dataBanner() {
    return el("div", "data-banner",
      "<div class='data-class verified'><strong>✓ Geverifieerde publieke VIS-informatie</strong>Team, expertise en gepubliceerde portfolio. Bron: visarchitecten.nl · snapshot 16 juli 2026.</div>" +
      "<div class='data-class illustrative'><strong>◇ Illustratief operationeel scenario</strong>Planning, capaciteit, financiën, risico's en pipeline zijn fictief en tonen alleen mogelijke werking.</div>" +
      "<div class='data-class required'><strong>＋ Interne VIS-informatie vereist</strong>Werkelijke status, bezetting en bedrijfsprestaties verschijnen pas na autorisatie en verificatie.</div>");
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  }

  function vVis() {
    const root = el("div");
    root.appendChild(el("section", "hero-vis",
      "<span class='evidence public'>✓ Geverifieerde publieke bron</span>" +
      "<h2>VIS herkennen vóór AI adviseren</h2>" +
      "<p>Dit werkbeeld begint bij de mensen, expertise en projecten die VIS Architecten werkelijk kenmerken. Het systeem ondersteunt hun professionele werk; het kent zichzelf geen bevoegdheid toe.</p>"));
    root.appendChild(dataBanner());

    root.appendChild(el("h3", "sub", "Publiek team & expertise"));
    const team = el("div", "cards");
    PUBLIC.team.forEach(person => {
      team.appendChild(el("div", "card person",
        "<span class='avatar'>" + initials(person.name) + "</span><div><strong>" + person.name + "</strong><p>" + person.role + "</p><span class='evidence public'>Publieke rol · geen beschikbaarheidsclaim</span></div>"));
    });
    root.appendChild(team);
    root.appendChild(el("div", "warn", "Deze openbare rollen zeggen niet wie aan welk project werkt, wie beschikbaar is of wie beslissingsbevoegd is. Daarvoor zijn geverifieerde interne gegevens en toestemming nodig."));

    root.appendChild(el("h3", "sub", "Gepubliceerde expertise"));
    root.appendChild(el("div", "chips", PUBLIC.expertise.map(x => "<span class='chip'>" + x + "</span>").join("")));

    root.appendChild(el("h3", "sub", "Publieke VIS-projecten"));
    const controls = el("div", "filters", "<input id='public-search' aria-label='Zoek publieke VIS-projecten' placeholder='Zoek op project, plaats of expertise…'><span class='chip'><strong id='public-count'>" + PUBLIC.projects.length + "</strong> projecten</span>");
    const grid = el("div", "cards");
    function renderProjects(query) {
      const q = (query || "").trim().toLowerCase();
      const matches = PUBLIC.projects.filter(p => !q || [p.name, p.location, p.type, p.summary].concat(p.tags).join(" ").toLowerCase().includes(q));
      grid.innerHTML = "";
      controls.querySelector("#public-count").textContent = matches.length;
      matches.forEach(p => grid.appendChild(el("article", "card project-public",
        "<div class='row'><strong>" + p.name + "</strong><span class='badge b-ok'>" + p.location + "</span></div>" +
        "<span class='muted'>" + p.type + "</span><p>" + p.summary + "</p>" +
        "<div class='chips'>" + p.tags.map(t => "<span class='chip'>" + t + "</span>").join("") + "</div>" +
        "<span class='evidence public'>VIS portfolio · publiek</span>")));
      if (!matches.length) grid.appendChild(el("div", "warn", "Geen publiek project gevonden voor deze zoekterm. Dit betekent niet dat VIS die ervaring niet heeft; controleer de interne projectlijst."));
    }
    root.appendChild(controls); root.appendChild(grid);
    controls.querySelector("input").oninput = e => renderProjects(e.target.value);
    renderProjects("");

    const btns = el("div", "btnrow");
    const agents = el("button", "btn", "Bekijk de vier assistenten"); agents.onclick = () => { location.hash = "#agents"; };
    const scenario = el("button", "btn light", "Open illustratief werkbeeld"); scenario.onclick = () => { location.hash = "#dashboard"; };
    btns.appendChild(agents); btns.appendChild(scenario); root.appendChild(btns);
    return root;
  }

  function vAgents() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Specialistische assistenten</h2><p>Geen autonome digitale directie, maar duidelijk begrensde assistenten onder één orchestrator. Iedere assistent ondersteunt herkenbaar menselijk werk en volgt dezelfde Agent Definition Specification.</p>"));
    root.appendChild(dataBanner());
    root.appendChild(el("div", "card", "<strong>Orchestrator / router</strong><p>Begrijpt de vraag, controleert gebruikersrol en databron, kiest de juiste specialist en combineert alleen geautoriseerde resultaten. De orchestrator neemt geen professionele of personele beslissing.</p><span class='evidence missing'>Mens blijft verantwoordelijk</span>"));
    root.appendChild(el("h3", "sub", "Agent Definition Specifications"));
    const grid = el("div", "ads-grid");
    PUBLIC.agents.forEach(a => grid.appendChild(el("article", "ads-card",
      "<span class='evidence " + (a.id === "portfolio" ? "public" : a.id === "capacity" ? "demo" : "missing") + "'>" +
      (a.id === "portfolio" ? "Publieke kennis beschikbaar" : a.id === "capacity" ? "Scenario in deze PoC" : "Interne aansluiting vereist") + "</span>" +
      "<h3>" + a.name + "</h3><p class='muted'>" + a.role + "</p>" +
      "<dl><dt>Doel</dt><dd>" + a.purpose + "</dd><dt>Scope</dt><dd>" + a.scope + "</dd><dt>Trigger</dt><dd>" + a.trigger + "</dd>" +
      "<dt>Inputs</dt><dd>" + a.inputs + "</dd><dt>Tools</dt><dd>" + a.tools + "</dd><dt>Acties</dt><dd>" + a.actions + "</dd>" +
      "<dt>Autonomie</dt><dd>" + a.autonomy + "</dd><dt>Output</dt><dd>" + a.outputs + "</dd><dt>Guardrails</dt><dd>" + a.guardrails + "</dd>" +
      "<dt>Menselijke rol</dt><dd>" + a.human + "</dd><dt>KPI's</dt><dd>" + a.kpis + "</dd></dl>" +
      "<div class='approval-strip'><span>Bekijk bewijs</span><span>Corrigeer</span><span>Goedkeuren</span><span>Afwijzen</span><span>Override met reden</span></div>")));
    root.appendChild(grid);
    root.appendChild(el("div", "warn", "Jack's uitgangspunt is leidend: begin bij het unieke, waardevolle werk van de medewerkers. Automatiseer ondersteuning eerst; vervanging is geen PoC-doel."));
    return root;
  }

  function vDashboard() {
    const root = el("div");
    const risk = projectsAtRisk(), perm = permitsSoon(30), over = overdueActions(), inv = expectedInvoicing(), rfis = openRfis(), risks = portfolioRisks();
    root.appendChild(el("div", "view-head", "<h2>Illustratief operationeel werkbeeld</h2><p>Een mogelijke toekomstige directieweergave over projecten, planning, capaciteit en pipeline. Alle cijfers en personele toewijzingen in dit onderdeel zijn fictieve scenario's.</p>"));
    root.appendChild(dataBanner());
    const kpis = el("div", "kpis");
    [["Actieve projecten", visibleProjects().length, ""],
     ["Aandacht nodig", risk.length, "warn"],
     ["Vergunningsbesluiten ≤ 30 dgn", perm.length, perm.length ? "warn" : ""],
     ["Acties over datum", over.length, over.length ? "warn" : ""],
     ["Open RFI's", rfis.length, ""],
     canSeeFinance() ? ["Openstaand gefactureerd", eur(inv.openInvoices), ""] : ["Financieel", "🔒 rol", ""],
     canSeeFinance() ? ["Onderhanden werk (±)", eur(inv.unbilledWip), ""] : null,
     ["Pipelinekansen", DB.pipeline.length, ""]
    ].filter(Boolean).forEach(k => kpis.appendChild(el("div", "kpi " + k[2], "<strong>" + k[1] + "</strong><span>" + k[0] + "</span>")));
    root.appendChild(kpis);

    /* Vier vragen, vier blokken: status · projectprognose · capaciteit · pipeline */
    const devs = allDeviations();
    const bn = bottlenecks(4);
    const peak = bn.sort((a, b) => b.pct - a.pct)[0];
    const wArch = pipelineRoleUtil("architect", "2026-11", true);
    root.appendChild(el("h3", "sub", "Vier blikken op het bureau"));
    const four = el("div", "four");
    [["Status nu", (risk.length ? risk.length + " projecten vragen aandacht" : "Alles op koers") + " · " + over.length + " acties over datum.", "#planning"],
     ["Projectprognose", devs.length ? devs.length + " mijlpa(a)l(en) wijken af van plan (grootste: +" + Math.max(...devs.map(x => x.delta)) + " dgn)." : "Geen afwijkingen van de planning.", "#planning/mijlpalen"],
     ["Capaciteitsprognose", peak ? "Piek: " + peak.member.name + " " + peak.pct + "% in " + peak.month.label + "." : "Geen overbelasting voorzien.", "#capaciteit"],
     ["Pipelineprognose", DB.pipeline.length + " kansen · gewogen extra architectvraag nov: +" + wArch + "%.", "#pijplijn"]
    ].forEach(b => {
      const c = el("div", "card", "<em>" + b[0] + "</em><p>" + b[1] + "</p>");
      c.onclick = () => { location.hash = b[2]; };
      four.appendChild(c);
    });
    root.appendChild(four);

    root.appendChild(el("h3", "sub", "Projecten"));
    const grid = el("div", "cards");
    visibleProjects().forEach(p => {
      const c = el("div", "card project-card");
      c.innerHTML = "<div class='row'><strong>" + p.name + "</strong>" + healthBadge(p) + "</div>" +
        "<span class='muted'>" + p.type + " · " + p.location + " · " + p.heritage + "</span>" +
        "<div class='bar'><i style='width:" + p.phasePct + "%'></i></div>" +
        "<span class='muted small'>" + p.phase + " · " + p.phasePct + "% · " + p.healthReason + "</span>";
      c.onclick = () => { location.hash = "#project/" + p.id; };
      grid.appendChild(c);
    });
    root.appendChild(grid);

    if (risks.length) {
      root.appendChild(el("h3", "sub", "Portefeuillerisico's (hoog)"));
      risks.forEach(x => root.appendChild(el("div", "warn", "⚠︎ <strong>" + x.project.name + "</strong> — " + x.risk.title + " · Mitigatie: " + x.risk.mitigation)));
    }
    return root;
  }

  /* ---- Projecten & Planning (Gantt + mijlpalen) ---- */
  function ganttChart(includePipeline) {
    const wrap = el("div", "gantt");
    const inner = el("div", "gantt-inner");
    const head = el("div", "g-months");
    head.style.gridTemplateColumns = "repeat(" + WINDOW.length + ",1fr)";
    WINDOW.forEach(m => head.appendChild(el("span", null, m.label)));
    inner.appendChild(head);

    function addRow(labelHtml, sub, bars, milestones, onclick, dim) {
      const r = el("div", "g-row");
      const lab = el("div", "g-label", labelHtml + (sub ? "<small>" + sub + "</small>" : ""));
      if (onclick) lab.onclick = onclick;
      r.appendChild(lab);
      const track = el("div", "g-track");
      bars.forEach(b => {
        const left = pctPos(b.start), right = pctPos(b.end);
        if (right <= 0.2) return;
        const bar = el("div", "g-bar" + (b.pipe ? " pipe" : "") + (dim ? " dim" : ""), b.label || "");
        bar.style.left = left + "%"; bar.style.width = Math.max(right - left, 0.8) + "%";
        if (!b.pipe) bar.style.background = b.color || "var(--olive)";
        bar.title = (b.title || b.label || "") + " · " + fmtDate(b.start) + " – " + fmtDate(b.end);
        track.appendChild(bar);
      });
      (milestones || []).forEach(ms => {
        const dev = ms.dev;
        const eff = dev ? dev.forecast : ms.date;
        const cls = dev ? "over" : (daysUntil(ms.date) < 0 ? "over" : daysUntil(ms.date) <= 30 ? "due" : "ok");
        const dot = el("div", "g-ms " + cls);
        dot.style.left = pctPos(eff) + "%";
        dot.title = ms.title + " · " + (dev ? "gepland " + fmtDate(ms.date) + " → prognose " + fmtDate(dev.forecast) + " (" + dev.reason + ")" : fmtDate(ms.date)) + " [" + ms.type + "]";
        track.appendChild(dot);
      });
      r.appendChild(track);
      inner.appendChild(r);
    }

    DB.projects.forEach(p => {
      const bars = (p.schedule || []).map(s => {
        const ph = DB.phases.find(x => x.id === s.phase) || {};
        return { start: s.start, end: s.end, color: ph.color, label: ph.label, title: p.name + " — " + ph.label };
      });
      const ms = (p.msList || []).map(m => ({ ...m, dev: (p.deviations || []).find(x => x.milestone === m.title) }));
      addRow("<strong>" + p.name + "</strong>", p.phase + " · " + p.pm, bars, ms, () => { location.hash = "#project/" + p.id; });
    });
    if (includePipeline) {
      DB.pipeline.forEach(pl => {
        addRow(pl.name, "pipeline · kans " + Math.round(pl.probability * 100) + "%",
          [{ start: pl.expectedStart, end: pipelineEnd(pl), pipe: true, label: pl.stage, title: pl.name + " (verwacht)" }], [], () => { location.hash = "#pijplijn"; }, false);
      });
    }
    const today = el("div", "g-today");
    today.style.left = "calc(210px + " + pctPos(TODAY) + "% * ((100% - 210px)/100%))";
    /* simpler: position within tracks via wrapper */
    today.style.left = ""; /* fallback below */
    inner.style.position = "relative";
    const tm = el("div", "g-today");
    tm.style.left = "calc(210px + (100% - 210px) * " + (pctPos(TODAY) / 100).toFixed(4) + ")";
    inner.appendChild(tm);
    wrap.appendChild(inner);
    const legend = el("div", "legend",
      "<span><i style='background:var(--olive)'></i>fase (kleur per fasetype)</span>" +
      "<span><i style='background:repeating-linear-gradient(45deg,var(--blue),var(--blue) 4px,#b9cacd 4px,#b9cacd 8px)'></i>pipeline (gewogen, nog niet gegund)</span>" +
      "<span><i style='background:var(--olive);border-radius:2px;transform:rotate(45deg)'></i>mijlpaal</span>" +
      "<span><i style='background:#c9a13b;border-radius:2px;transform:rotate(45deg)'></i>≤ 30 dagen</span>" +
      "<span><i style='background:#a05a34;border-radius:2px;transform:rotate(45deg)'></i>afwijking / te laat</span>" +
      "<span><i style='background:var(--clay)'></i>vandaag-markering</span>");
    wrap.appendChild(legend);
    return wrap;
  }

  function vPlanning(sub) {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Projecten &amp; Planning</h2><p>Portfolioplanning over " + DB.projects.length + " actieve projecten en " + DB.pipeline.length + " pipelinekansen. Fasen volgen een Nederlandse erfgoedpraktijk-indeling (configureerbaar; conceptueel verwant aan een RIBA-Plan-of-Work, maar geen officiële NL-standaard). In productie worden deze balken live gevoed en continu vergeleken met de werkelijke projectinformatie.</p>"));
    const tabs = el("div", "subtabs");
    [["gantt", "Portfolioplanning (Gantt)"], ["mijlpalen", "Mijlpalen & afwijkingen"], ["overzicht", "Portfoliostatus"]].forEach(t => {
      const a = el("a", sub === t[0] || (!sub && t[0] === "gantt") ? "active" : "", t[1]);
      a.onclick = () => { location.hash = "#planning/" + t[0]; };
      tabs.appendChild(a);
    });
    root.appendChild(tabs);

    if (!sub || sub === "gantt") {
      root.appendChild(ganttChart(true));
      const col = deadlineCollisions();
      if (col.length) {
        root.appendChild(el("h3", "sub", "Gesignaleerde planningsconflicten"));
        col.forEach(c => root.appendChild(el("div", "warn", "⚠︎ <strong>" + c.a.name + "</strong> en <strong>" + c.b.name + "</strong> hebben mijlpalen " + c.gap + " dagen uit elkaar (" + c.ma.title + " / " + c.mb.title + ") en delen teamleden: " + c.shared.join(", ") + ".")));
      }
      allDeviations().filter(x => x.dev.affects).forEach(x =>
        root.appendChild(el("div", "warn", "⚠︎ Doorwerking: <strong>" + x.project.name + "</strong> — " + x.dev.milestone + " (+" + x.delta + " dgn) raakt: " + x.dev.affects)));
    }
    if (sub === "mijlpalen") {
      root.appendChild(el("h3", "sub", "Planning versus actueel (realtime-projectcontrole, DEMO)"));
      allDeviations().forEach(x => {
        const t = el("table", "facts wide");
        t.innerHTML = row("Project", "<strong>" + x.project.name + "</strong>") +
          row("Mijlpaal", x.dev.milestone) +
          row("Gepland", fmtDate(x.dev.planned)) +
          row("Actuele prognose", fmtDate(x.dev.forecast) + " <span class='badge b-warn'>+" + x.delta + " dagen</span>") +
          row("Reden", x.dev.reason) +
          row("Raakt", x.dev.affects || "—") +
          row("Bronnen", x.dev.sources.join(" · "));
        root.appendChild(t);
      });
      root.appendChild(el("h3", "sub", "Vergunningsmijlpalen komende 60 dagen"));
      permitRisk(60).forEach(x => root.appendChild(el("div", "warn", "⚠︎ <strong>" + x.project.name + "</strong> — " + x.ms.title + " · effectief " + fmtDate(x.effective) + " (over " + x.inDays + " dgn)" + (x.dev ? " · reden vertraging: " + x.dev.reason : ""))));
      root.appendChild(el("h3", "sub", "Alle mijlpalen ≤ 3 maanden"));
      const t = el("table", "facts wide");
      milestonesWithin(92).forEach(x => t.innerHTML += row(fmtDate(x.ms.date), "<strong>" + x.project.name + "</strong> — " + x.ms.title + " <span class='muted small'>(" + x.ms.type + ", over " + x.inDays + " dgn)</span>"));
      root.appendChild(t);
    }
    if (sub === "overzicht") {
      const groups = [["actief", "Actief", DB.projects], ["pipeline", "Pipeline / acquisitie", DB.pipeline], ["afgerond", "Afgerond", DB.extraProjects.filter(p => p.status === "afgerond")], ["on-hold", "Tijdelijk on hold", DB.extraProjects.filter(p => p.status === "on-hold")]];
      groups.forEach(g => {
        root.appendChild(el("h3", "sub", g[1] + " (" + g[2].length + ")"));
        const grid = el("div", "cards");
        g[2].forEach(p => {
          const extra = p.stage ? p.stage + " · kans " + Math.round(p.probability * 100) + "% · verwachte start " + fmtDate(p.expectedStart) :
            p.status === "afgerond" ? p.period + " · archief " + Math.round(p.archiveReady * 100) + "%" + (p.archiveMissing && p.archiveMissing.length ? " · ontbreekt: " + p.archiveMissing.join(", ") : "") :
            p.status === "on-hold" ? p.period + " · " + p.holdReason :
            p.phase + " (" + p.phasePct + "%) · " + p.healthReason;
          const c = el("div", "card" + (p.status === "actief" ? " project-card" : ""), "<div class='row'><strong>" + p.name + "</strong>" + (p.health ? healthBadge(p) : "") + "</div><span class='muted'>" + p.type + " · " + p.location + "</span><p>" + extra + "</p>");
          if (p.status === "actief") c.onclick = () => { location.hash = "#project/" + p.id; };
          grid.appendChild(c);
        });
        root.appendChild(grid);
      });
    }
    return root;
  }

  /* ---- Capaciteit ---- */
  function utilRow(name, subLabel, pct, off) {
    const cls = pct > 100 ? "hot" : pct > 90 ? "warm" : pct < 70 ? "cool" : "";
    return "<div class='util'><div class='who'>" + name + "<small>" + subLabel + "</small></div>" +
      "<div class='track'><i class='" + cls + "' style='width:" + Math.min(pct, 130) / 1.3 + "%'></i></div>" +
      "<div class='pct'>" + pct + "%" + (pct > 100 ? " ⚠" : "") + (off ? " ✈" : "") + "</div></div>";
  }
  function vCapacity() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Capaciteit</h2><p>Bezetting van het team (3 architecten · 2 technisch ontwerpers · 1 visualisator · 1 projectcoördinator — DEMO-bezetting) berekend uit de faseplanning, rolvraag per fase en toewijzing per project. ✈ = verlof in die maand. In productie live gevoed vanuit planning- en urensystemen.</p>"));

    const nowKey = WINDOW[0].key;
    root.appendChild(el("h3", "sub", "Benutting deze maand (" + WINDOW[0].label + ")"));
    const box = el("div", "card");
    DB.team.forEach(t => {
      const u = memberUtil(t, nowKey);
      box.insertAdjacentHTML("beforeend", utilRow(t.name, t.roleLabel + " · " + t.hoursWeek + " u/wk", u.pct, u.off));
    });
    root.appendChild(box);

    root.appendChild(el("h3", "sub", "Benutting per rol"));
    const roleBox = el("div", "card");
    Object.keys(DB.roleLabels).forEach(r => {
      roleBox.insertAdjacentHTML("beforeend", utilRow(DB.roleLabels[r], DB.team.filter(t => t.role === r).map(t => t.name).join(", "), roleUtil(r, nowKey), false));
    });
    root.appendChild(roleBox);

    /* heatmap 6 maanden, met pipeline-overlay-schakelaar */
    root.appendChild(el("h3", "sub", "Vooruitblik 6 maanden"));
    const toggleWrap = el("div", "chips clickable");
    const toggle = el("span", "chip", "＋ Toon gewogen pipeline-druk (kans × vraag)");
    let withPipe = false;
    toggleWrap.appendChild(toggle);
    root.appendChild(toggleWrap);
    const heatHolder = el("div");
    function renderHeat() {
      heatHolder.innerHTML = "";
      const months = WINDOW.slice(0, 6);
      const t = el("table", "heat");
      t.innerHTML = "<tr><th></th>" + months.map(m => "<th>" + m.label + "</th>").join("") + "</tr>";
      DB.team.forEach(tm => {
        let tr = "<tr><td class='name'>" + tm.name + " <span class='muted small'>" + DB.roleLabels[tm.role] + "</span></td>";
        months.forEach(m => {
          let u = memberUtil(tm, m.key).pct;
          if (withPipe) {
            const extra = pipelineLoad(m.key, tm.role, true) / Math.max(DB.team.filter(x => x.role === tm.role).length, 1);
            u = Math.round(u + extra * 100);
          }
          const off = holidayFrac(tm, m) > 0.15;
          const cls = off && u < 60 ? "c-off" : u > 100 ? "c-hot" : u > 90 ? "c-warm" : u < 70 ? "c-cool" : "";
          tr += "<td class='cell " + cls + "' title='" + tm.name + " · " + m.label + (off ? " · deels verlof" : "") + "'>" + u + "%" + (off ? " ✈" : "") + "</td>";
        });
        heatHolderRowAppend(t, tr + "</tr>");
      });
      const card = el("div", "card"); card.appendChild(t);
      heatHolder.appendChild(card);
      const bn = bottlenecks(6);
      if (bn.length) heatHolder.appendChild(el("div", "warn", "⚠︎ Voorspelde knelpunten: " + bn.map(b => b.member.name + " " + b.pct + "% in " + b.month.label).join(" · ") + "."));
      const room = leastLoaded("architect", nowKey, 3);
      heatHolder.appendChild(el("div", "card", "<strong>Signalen</strong><p>Meeste architectruimte komende 3 maanden: " + room.member.name + " (gem. " + room.avg + "%). Onderbezetting: Daan zit deze maand onder 70% — inzetbaar voor visualisaties acquisitie. Bas zit boven 100% en dat verergert zodra Willemsstraat in uitvoering gaat (okt) — coördinatietaken herverdelen of extern aanvullen.</p>"));
    }
    function heatHolderRowAppend(table, rowHtml) { table.insertAdjacentHTML("beforeend", rowHtml); }
    toggle.onclick = () => { withPipe = !withPipe; toggle.classList.toggle("chip"); toggle.textContent = (withPipe ? "－ Verberg" : "＋ Toon") + " gewogen pipeline-druk (kans × vraag)"; toggle.className = "chip"; renderHeat(); };
    renderHeat();
    root.appendChild(heatHolder);

    /* scenarioplanner */
    root.appendChild(el("h3", "sub", "Scenarioplanner — nieuw project simuleren"));
    const form = el("div", "card");
    form.innerHTML = "<div class='scenario'>" +
      "<div><label>Projecttype</label><select id='sc-type'>" + DB.scenarioTypes.map(t => "<option value='" + t.id + "'>" + t.label + "</option>").join("") + "</select></div>" +
      "<div><label>Verwachte start</label><select id='sc-start'>" + WINDOW.slice(1, 10).map(m => "<option value='" + m.key + "'>" + m.label + "</option>").join("") + "</select></div>" +
      "<div><label>Complexiteit</label><select id='sc-cx'>" + DB.complexity.map(c => "<option value='" + c.id + "'" + (c.id === "middel" ? " selected" : "") + ">" + c.label + "</option>").join("") + "</select></div>" +
      "<div><label>Looptijd (maanden, leeg = sjabloon)</label><input id='sc-months' type='number' min='3' max='30' placeholder='auto'></div>" +
      "<div><label>Winstkans</label><select id='sc-prob'><option value='1'>100%</option><option value='0.75'>75%</option><option value='0.5'>50%</option><option value='0.25'>25%</option></select></div>" +
      "<div style='display:flex;align-items:flex-end'><button class='btn' id='sc-run'>Bereken impact</button></div></div>";
    const out = el("div");
    form.appendChild(out);
    root.appendChild(form);
    setTimeout(() => {
      const btn = $("#sc-run");
      if (!btn) return;
      btn.onclick = () => {
        const sc = scenarioImpact({
          type: $("#sc-type").value, startKey: $("#sc-start").value,
          complexity: $("#sc-cx").value, months: parseInt($("#sc-months").value) || null,
          probability: parseFloat($("#sc-prob").value)
        });
        out.innerHTML = "";
        const a = {
          title: "Scenario-impact (DEMO-aanbeveling — geen zekerheid)",
          confidence: 0.65,
          paragraphs: ["Start in " + sc.monthLabel($("#sc-start").value) + " brengt de piekbelasting op " + sc.base.peak.pct + "%" + (sc.base.peak.member ? " (" + sc.base.peak.member.name + ", " + sc.monthLabel(sc.base.peak.monthKey) + ")" : "") + "." +
            (sc.alt ? " Verplaatsen naar " + sc.monthLabel(sc.alt.startKey) + " " + (sc.alt.peak.pct <= 100 ? "verlaagt de piek naar " + sc.alt.peak.pct + "%." : "geeft de laagste piek: " + sc.alt.peak.pct + "%.") : "")],
          facts: [
            ["Rolvraag (fte, complexiteit verrekend)", Object.keys(sc.demand).filter(r => sc.demand[r]).map(r => DB.roleLabels[r] + " " + Math.round(sc.demand[r] * 100) + "%").join(" · ")],
            ["Overbelaste periodes", sc.hot.length ? sc.hot.map(h => h.member.name + " " + h.pct + "% (" + sc.monthLabel(h.monthKey) + ")").join(" · ") : "geen boven 100%"],
            ["Aanbevolen toewijzing", sc.archPick ? sc.archPick.member.name + " (conceptfase; gem. " + sc.archPick.avg + "% benut)" : "—"],
            ["Alternatieve startdatum", sc.alt ? sc.monthLabel(sc.alt.startKey) + " (piek " + sc.alt.peak.pct + "%)" : "—"],
            ["Externe capaciteit", sc.external ? "Waarschijnlijk nodig (piek > 115%)" : "Waarschijnlijk niet nodig"]
          ],
          warnings: ["DEMO-aanbeveling uit het capaciteitsmodel. Mensen beslissen; het systeem informeert."],
          sources: [PLANSRC]
        };
        out.appendChild(renderAnswer(a));
      };
    }, 0);
    return root;
  }

  /* ---- Pipeline ---- */
  function vPipeline() {
    const root = el("div");
    const fin = canSeeFinance();
    root.appendChild(el("div", "view-head", "<h2>Pipeline &amp; toekomstig werk</h2><p>Acquisitiekansen met kansweging: bevestigde werklast versus potentiële werklast. Helpt de vraag te beantwoorden: kunnen we veilig extra werk aannemen? Alle gegevens DEMO.</p>"));

    const cols = el("div", "stage-cols");
    ["Eerste gesprek", "Offerte gevraagd", "Offerte ingediend", "Onderhandeling"].forEach(stage => {
      const col = el("div", "stage-col", "<h4>" + stage + "</h4>");
      DB.pipeline.filter(p => p.stage === stage).forEach(p => {
        col.appendChild(el("div", "pipe-card", "<strong>" + p.name + "</strong>" +
          p.type + " · " + p.location + "<br>kans <strong>" + Math.round(p.probability * 100) + "%</strong> · start " + fmtDate(p.expectedStart) + " · " + p.durationMonths + " mnd" +
          (fin ? "<br>waarde " + eur(p.estValue) + " · ± " + p.estEffortHrs + " uur" : "<br><span class='muted'>🔒 waarde afgeschermd</span>") +
          "<br><span class='muted small'>" + p.note + "</span>"));
      });
      cols.appendChild(col);
    });
    root.appendChild(cols);

    root.appendChild(el("h3", "sub", "Gewogen capaciteitsprognose (bevestigd vs. potentieel)"));
    const t = el("table", "facts wide");
    t.innerHTML = row("Maand", "<strong>Architecten</strong> — bevestigd → met gewogen pipeline · <strong>Technisch</strong> — idem");
    for (let i = 2; i < 9; i++) {
      const k = WINDOW[i].key;
      const a1 = roleUtil("architect", k), a2 = a1 + pipelineRoleUtil("architect", k, true);
      const t1 = roleUtil("technisch", k), t2 = t1 + pipelineRoleUtil("technisch", k, true);
      t.innerHTML += row(WINDOW[i].label,
        "architecten " + a1 + "% → <strong>" + a2 + "%</strong>" + (a2 > 100 ? " <span class='badge b-warn'>krap</span>" : "") +
        " · technisch " + t1 + "% → <strong>" + t2 + "%</strong>" + (t2 > 100 ? " <span class='badge b-warn'>krap</span>" : ""));
    }
    root.appendChild(t);

    const nov = roleUtil("architect", "2026-11") + pipelineRoleUtil("architect", "2026-11", true);
    root.appendChild(el("div", "card", "<strong>Kunnen we veilig werk aannemen?</strong><p>" +
      (nov > 100 ? "Met de gewogen pipeline loopt de architectbezetting in november op tot ± " + nov + "%. Gunning van zowel Ter Horst (75%) als Pakhuis Kade 7 (50%) is zonder maatregelen niet inpasbaar: prioriteren, startdata spreiden of externe capaciteit organiseren." :
        "De gewogen pipeline past binnen de huidige bezetting; bij gunning boven verwachting opnieuw doorrekenen.") +
      " Gebruik de scenarioplanner onder Capaciteit om varianten door te rekenen. (DEMO-signaal — besluit blijft bij de directie.)</p>"));
    root.appendChild(el("div", "src-label", "Bronnen & actualiteit"));
    root.insertAdjacentHTML("beforeend", sourceChips([CRMSRC, PLANSRC]));
    return root;
  }

  /* ---- Projectkaart (offline SVG; adapter-patroon voor Leaflet/Google later) ---- */
  function vMap() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Projectkaart</h2><p>Alle projecten geografisch: actief, pipeline, afgerond en on hold. Gestileerde offline kaart (geen API-key nodig); in productie te vervangen door Leaflet/OpenStreetMap of Google Maps via hetzelfde marker-koppelvlak. Locaties indicatief — DEMO.</p>"));

    const filters = el("div", "chips");
    const fStatus = el("select", "select"); fStatus.innerHTML = "<option value=''>Alle statussen</option><option>actief</option><option>pipeline</option><option>afgerond</option><option>on-hold</option>";
    const fType = el("select", "select"); fType.innerHTML = "<option value=''>Alle typen</option><option value='renovatie'>Renovatie</option><option value='restauratie'>Restauratie</option><option value='herbestemming'>Herbestemming</option><option value='verduurzaming'>Verduurzaming</option>";
    const fHer = el("select", "select"); fHer.innerHTML = "<option value=''>Alle erfgoedtypen</option><option>Rijksmonument</option><option>Gemeentelijk monument</option>";
    const fPm = el("select", "select"); fPm.innerHTML = "<option value=''>Alle projectleiders</option>" + [...new Set(allPortfolio().map(p => p.pm).filter(Boolean))].map(x => "<option>" + x + "</option>").join("");
    [fStatus, fType, fHer, fPm].forEach(f => filters.appendChild(f));
    root.appendChild(filters);

    const wrap = el("div", "map-wrap");
    wrap.style.position = "relative";
    root.appendChild(wrap);

    function markers() {
      const items = allPortfolio().map(p => ({ ...p, mStatus: p.status })).concat(DB.pipeline.map(p => ({ ...p, mStatus: "pipeline" })));
      return items.filter(p => {
        if (fStatus.value && p.mStatus !== fStatus.value) return false;
        if (fType.value && p.typeTag !== fType.value) return false;
        if (fHer.value && !(p.heritage || "").startsWith(fHer.value)) return false;
        if (fPm.value && p.pm !== fPm.value) return false;
        return true;
      });
    }
    const COLORS = { actief: "#60724d", pipeline: "#7797a0", afgerond: "#9a9a90", "on-hold": "#c2a06c" };
    function render() {
      wrap.innerHTML = "";
      const towns = [["Haarlem", 32, 10], ["Amsterdam", 58, 12], ["Wassenaar", 24, 36], ["Voorschoten", 31, 43], ["Den Haag", 17, 47], ["Voorburg", 26, 51], ["Rijswijk", 23, 56], ["Delft", 31, 61], ["Naaldwijk", 15, 65], ["Rotterdam", 43, 73]];
      let svg = "<svg viewBox='0 0 100 85' style='width:100%;height:auto;display:block' xmlns='http://www.w3.org/2000/svg'>" +
        "<defs><linearGradient id='sea' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#cad8db'/><stop offset='1' stop-color='#dfe8ea'/></linearGradient></defs>" +
        "<rect x='0' y='0' width='100' height='85' fill='url(#sea)' rx='3'/>" +
        "<path d='M 12,0 C 9,14 8,28 11,42 C 13,55 9,66 13,85 L 100,85 L 100,0 Z' fill='#f2f1e9' stroke='#d8d6c9' stroke-width='.4'/>" +
        "<path d='M 12,0 C 9,14 8,28 11,42 C 13,55 9,66 13,85' fill='none' stroke='#b9cacd' stroke-width='1.1' opacity='.7'/>";
      towns.forEach(t => { svg += "<circle cx='" + t[1] + "' cy='" + t[2] + "' r='.7' fill='#6d7068'/><text x='" + (t[1] + 1.6) + "' y='" + (t[2] + .8) + "' font-size='2.4' fill='#6d7068' font-family='Helvetica'>" + t[0] + "</text>"; });
      const ms = markers();
      const seen = {};
      ms.forEach((p, i) => {
        if (!p.coords) return;
        const key = p.coords.x + "," + p.coords.y;
        const n = seen[key] = (seen[key] || 0) + 1;
        const x = p.coords.x + (n - 1) * 2.4, y = p.coords.y - (n - 1) * 1.2;
        const c = COLORS[p.mStatus] || "#60724d";
        svg += "<g class='mk' data-i='" + i + "' style='cursor:pointer'><circle cx='" + x + "' cy='" + y + "' r='1.9' fill='" + c + "' stroke='#fff' stroke-width='.5'/>" +
          (p.mStatus === "pipeline" ? "<circle cx='" + x + "' cy='" + y + "' r='2.7' fill='none' stroke='" + c + "' stroke-width='.35' stroke-dasharray='1 .8'/>" : "") + "</g>";
      });
      svg += "</svg>";
      wrap.insertAdjacentHTML("beforeend", svg);
      const legend = el("div", "legend",
        Object.entries({ actief: "Actief", pipeline: "Pipeline", afgerond: "Afgerond", "on-hold": "On hold" }).map(([k, v]) => "<span><i style='background:" + COLORS[k] + ";border-radius:50%'></i>" + v + "</span>").join("") +
        "<span class='muted'>· " + ms.length + " projecten getoond · locaties indicatief (DEMO)</span>");
      wrap.appendChild(legend);
      wrap.querySelectorAll(".mk").forEach(g => {
        g.addEventListener("click", ev => {
          const p = ms[+g.dataset.i];
          wrap.querySelectorAll(".map-pop").forEach(x => x.remove());
          const pop = el("div", "map-pop",
            "<strong>" + p.name + "</strong><br><span class='muted'>" + (p.type || "") + " · " + p.location + "</span><br>" +
            "Status: <strong>" + p.mStatus + "</strong>" + (p.phase ? " · fase: " + p.phase : "") + (p.stage ? " · " + p.stage + " (kans " + Math.round(p.probability * 100) + "%)" : "") + "<br>" +
            (p.pm ? "Projectleider: " + p.pm + "<br>" : "") +
            (p.healthReason ? "<span class='muted small'>" + p.healthReason + "</span><br>" : "") +
            (p.msList && p.msList.length ? "Volgende mijlpaal: " + p.msList.filter(m => daysUntil(m.date) >= 0).map(m => m.title + " (" + fmtDate(m.date) + ")")[0] + "<br>" : "") +
            (p.status === "actief" ? "<a style='color:var(--olive);font-weight:700;cursor:pointer' data-go='" + p.id + "'>→ Open projectpagina</a>" : ""));
          const rect = wrap.getBoundingClientRect();
          pop.style.left = Math.min(ev.clientX - rect.left + 10, rect.width - 250) + "px";
          pop.style.top = (ev.clientY - rect.top + 10) + "px";
          wrap.appendChild(pop);
          const go = pop.querySelector("[data-go]");
          if (go) go.onclick = () => { location.hash = "#project/" + go.dataset.go; };
        });
      });
    }
    [fStatus, fType, fHer, fPm].forEach(f => f.onchange = render);
    render();
    return root;
  }

  /* ---- Projectdossiers ---- */
  function folderKeywordMap(missing) {
    const map = { "V&G": "08_Uitvoering", "budget": "00_Projectadministratie", "3D-scan": "02_Onderzoek_Opname", "Funderings": "02_Onderzoek_Opname", "monumentencommissie": "06_Vergunningen", "akoestisch": "04_Voorlopig_Ontwerp", "Energielabel": "02_Onderzoek_Opname", "Bewoners": "01_Projectdefinitie" };
    const res = {};
    (missing || []).forEach(m => {
      const hit = Object.keys(map).find(k => m.toLowerCase().includes(k.toLowerCase()));
      const f = hit ? map[hit] : "02_Onderzoek_Opname";
      (res[f] = res[f] || []).push(m);
    });
    return res;
  }
  function seedCount(pid, fi, si) {
    let h = 0; const s = pid + fi + "-" + si;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 97;
    return h % 9;
  }
  function vDossiers() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Projectdossiers</h2><p>Koppeling met de cloud-/documentomgeving van het bureau: projecten automatisch aanmaken, archiveren, classificeren en doorzoeken volgens één vaste mappenstructuur per fase (sjabloon aanpasbaar). Bestandslijsten gesimuleerd — DEMO.</p>"));

    const sel = el("select", "select");
    DB.projects.concat(DB.extraProjects).forEach(p => { const o = el("option", null, p.name + (p.status !== "actief" ? " (" + p.status + ")" : "")); o.value = p.id; sel.appendChild(o); });
    root.appendChild(sel);
    const holder = el("div");
    root.appendChild(holder);

    function render() {
      holder.innerHTML = "";
      const p = DB.projects.concat(DB.extraProjects).find(x => x.id === sel.value) || DB.projects[0];
      const score = p.documents ? dossierScore(p) : Math.round((p.archiveReady || 0) * 100);
      const missMap = folderKeywordMap(p.documents ? p.documents.missing : p.archiveMissing);
      const kpis = el("div", "kpis");
      [["Dossiercompletheid", score + "%", score < 80 ? "warn" : ""],
       ["Ontbrekende stukken", (p.documents ? p.documents.missing.length : (p.archiveMissing || []).length), (p.documents ? p.documents.missing.length : (p.archiveMissing || []).length) ? "warn" : ""],
       ["Status", p.status || "actief", ""],
       ["Archiefgereed", p.archiveReady != null ? Math.round(p.archiveReady * 100) + "%" : (p.phase === "Uitvoering" ? "n.v.t. (loopt)" : "n.v.t."), ""]
      ].forEach(k => kpis.appendChild(el("div", "kpi " + k[2], "<strong>" + k[1] + "</strong><span>" + k[0] + "</span>")));
      holder.appendChild(kpis);

      const tree = el("div", "card tree");
      DB.folderTemplate.forEach((f, fi) => {
        const det = document.createElement("details");
        if (missMap[f.name]) det.open = true;
        const total = f.sub.reduce((s, _, si) => s + seedCount(p.id, fi, si), 0);
        det.innerHTML = "<summary><strong>" + f.name + "</strong> <span class='cnt'>(" + total + " bestanden)</span></summary>";
        f.sub.forEach((s, si) => {
          const n = seedCount(p.id, fi, si);
          det.insertAdjacentHTML("beforeend", "<div class='leaf'>" + s + " <span class='cnt'>· " + (n ? n + " bestanden" : "nog leeg") + "</span></div>");
        });
        (missMap[f.name] || []).forEach(m => det.insertAdjacentHTML("beforeend", "<div class='leaf miss'>⚠︎ Ontbreekt: " + m + "</div>"));
        tree.appendChild(det);
      });
      holder.appendChild(tree);

      /* documentintelligentie-demo */
      holder.appendChild(el("h3", "sub", "Documentintelligentie — gesimuleerde upload"));
      const demoBtn = el("button", "btn light", "Simuleer upload: " + DB.docIntelExample.filename);
      const diOut = el("div");
      demoBtn.onclick = () => {
        diOut.innerHTML = "";
        const steps = ["Bestand ontvangen", "Bestandsnaam & inhoud geanalyseerd", "Project herkend", "Fase & documenttype bepaald", "Versie vergeleken met dossier", "Maplocatie voorgesteld"];
        steps.forEach((s, i) => setTimeout(() => {
          diOut.appendChild(el("div", "pipe-step", "✓ " + s));
          if (i === steps.length - 1) {
            const t = el("table", "facts wide");
            DB.docIntelExample.classification.forEach(c => t.innerHTML += row(c[0], c[1]));
            diOut.appendChild(t);
            diOut.appendChild(el("div", "warn", "Voorgestelde actie wordt pas uitgevoerd na menselijke bevestiging. Duplicaat- en versiedetectie, ontbrekende-stukken-signalering en handtekeningcontrole werken in productie op de echte documentstromen."));
          }
        }, 300 * (i + 1)));
      };
      holder.appendChild(demoBtn);
      holder.appendChild(diOut);
    }
    sel.onchange = render;
    render();
    return root;
  }

  function vProject(id) {
    const p = visibleProjects().find(x => x.id === id);
    const root = el("div");
    if (!p) { root.appendChild(el("div", "warn", "⚠︎ Dit project is niet zichtbaar voor jouw rol (autorisatie op projectniveau).")); return root; }
    const fin = canSeeFinance();
    root.appendChild(el("div", "view-head", "<h2>" + p.name + " " + healthBadge(p) + "</h2><p>" + p.type + " · " + p.location + " · " + p.heritage + " · Projectleider: " + p.pm + "</p>"));

    const t = el("table", "facts wide");
    t.innerHTML =
      row("Fase & voortgang", p.phase + " — " + p.phasePct + "%<div class='bar'><i style='width:" + p.phasePct + "%'></i></div>") +
      row("Planning", (p.schedule || []).map(s => { const ph = DB.phases.find(x => x.id === s.phase) || {}; return ph.label + ": " + fmtDate(s.start) + " – " + fmtDate(s.end); }).join("<br>")) +
      row("Mijlpalen", p.milestones.map(m => fmtDate(m.due) + " — " + m.title + " <em class='" + m.status + "'>(" + m.status + ")</em>").join("<br>")) +
      row("Planning-afwijkingen", (p.deviations || []).map(x => "<strong>" + x.milestone + "</strong>: gepland " + fmtDate(x.planned) + " → prognose " + fmtDate(x.forecast) + " <span class='badge b-warn'>+" + (daysUntil(x.forecast) - daysUntil(x.planned)) + " dgn</span><br><span class='muted small'>Reden: " + x.reason + " · Bronnen: " + x.sources.join(", ") + "</span>").join("<br>") || "geen — planning en actueel beeld lopen gelijk") +
      row("Uren", p.hoursActual + " / " + p.hoursPlanned + (p.hoursActual > p.hoursPlanned ? " <span class='badge b-warn'>+" + Math.round((p.hoursActual / p.hoursPlanned - 1) * 100) + "%</span>" : " <span class='badge b-ok'>binnen plan</span>")) +
      row("Budget & facturatie", fin ? eur(p.budget) + " bouwbudget · honorarium " + eur(p.feesInvoiced) + " gefactureerd van " + eur(p.feesPlanned) + (p.invoices.some(i => !i.paid) ? " · <span class='badge b-warn'>factuur open</span>" : "") : "🔒 Afgeschermd voor jouw rol (autorisatie op veldniveau)") +
      row("Vergunningen", p.permits.map(v => v.name + " — <strong>" + v.status + "</strong> · " + v.authority + (v.decisionDue ? " · besluit uiterlijk " + fmtDate(v.decisionDue) : "")).join("<br>")) +
      row("Risico's", p.risks.map(r => "[" + r.severity + "] " + r.title + " — <em>" + r.mitigation + "</em>").join("<br>") || "geen") +
      row("Acties", p.actions.map(a => (a.open ? (daysUntil(a.due) < 0 ? "🔴 " : "🟡 ") : "✅ ") + a.title + " · " + a.owner + " · deadline " + fmtDate(a.due)).join("<br>") || "geen") +
      row("RFI's / informatievragen", p.rfis.map(r => (r.open ? "🟡 " : "✅ ") + r.title + " · " + r.from + " · sinds " + fmtDate(r.opened)).join("<br>") || "geen") +
      row("Klantcommunicatie", p.communications.map(c => fmtDate(c.date) + " (" + c.channel + ") — " + c.summary).join("<br>") || "—") +
      row("Documenten", "Aanwezig: " + p.documents.present.join(", ") + (p.documents.missing.length ? "<br><span class='warn-inline'>Ontbreekt: " + p.documents.missing.join(", ") + "</span>" : " · dossier compleet")) +
      row("Duurzaamheid", p.sustainability.join("<br>")) +
      row("Veiligheid", p.safety.join("<br>")) +
      row("Les uit vergelijkbare projecten", p.lessons);
    root.appendChild(t);

    /* snelle toegang tot dossieronderdelen */
    root.appendChild(el("h3", "sub", "Snel naar projectbestanden"));
    const quick = el("div", "quick");
    DB.quickAccess.concat(["Archief"]).forEach(cat => {
      const a = el("a", null, cat);
      a.onclick = () => {
        const body = el("div");
        fakeFiles(p, cat).forEach(f => body.appendChild(el("div", "file-row", "<span style='color:var(--ink)'>" + f + "</span><span>demo</span>")));
        openModal(p.name + " — " + cat, body);
      };
      quick.appendChild(a);
    });
    root.appendChild(quick);

    root.appendChild(el("div", "src-label", "Bronnen & actualiteit"));
    root.insertAdjacentHTML("beforeend", sourceChips([srcChip(p._src)]));
    const daysOld = -daysUntil(p._src.last_updated);
    if (daysOld > 7) root.appendChild(el("div", "warn", "⚠︎ Data " + daysOld + " dagen oud — betrouwbaarheid verlaagd. Vraag het team de administratie bij te werken."));
    const btns = el("div", "btnrow");
    const b1 = el("button", "btn", "Vraag de assistent naar dit project"); b1.onclick = () => { location.hash = "#assistent"; setTimeout(() => ask("Laat mij " + p.name + " zien"), 300); };
    const b2 = el("button", "btn light", "Concept-klantprognose"); b2.onclick = () => { location.hash = "#prognose/" + p.id; };
    const b3 = el("button", "btn light", "Dossier openen"); b3.onclick = () => { location.hash = "#dossiers"; setTimeout(() => { const s = document.querySelector("#view select"); if (s) { s.value = p.id; s.onchange(); } }, 100); };
    btns.appendChild(b1); btns.appendChild(b2); btns.appendChild(b3); root.appendChild(btns);
    return root;
  }

  function vAssistant() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Assistenten via de orchestrator</h2><p>" + (window.LIVE_MODE ? "Live-modus via beveiligde modelgateway" : "Mock-modus — antwoorden worden ter plekke samengesteld uit de publieke VIS-laag of het illustratieve scenario") + ", met bronnen en zekerheid. Mensen beslissen; het systeem informeert.</p>"));
    root.appendChild(dataBanner());
    const chips = el("div", "chips clickable");
    SUGGESTIONS.forEach(s => { const c = el("span", "chip", s); c.onclick = () => ask(s); chips.appendChild(c); });
    root.appendChild(chips);
    root.appendChild(el("div", "chat", "<div id='chat-log' class='chat-log'></div>"));
    const form = el("form", "chat-input");
    form.innerHTML = "<input id='q' placeholder='Vraag naar publieke VIS-ervaring of het illustratieve scenario…' autocomplete='off'><button class='btn'>Vraag</button>";
    form.onsubmit = e => { e.preventDefault(); const v = $("#q").value.trim(); if (v) { ask(v); $("#q").value = ""; } };
    root.appendChild(form);
    return root;
  }

  function vCompare() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Vergelijkbare projecten</h2><p>Vergelijk een (nieuw) project met eerdere projecten uit de kennisbank op type, erfgoedcategorie en ingreep.</p>"));
    const sel = el("select", "select");
    visibleProjects().forEach(p => sel.appendChild(el("option", null, p.name)));
    const out = el("div");
    function refresh() {
      const p = visibleProjects()[sel.selectedIndex];
      out.innerHTML = "";
      const t = el("table", "facts wide");
      t.innerHTML = row("Gebouwtype", p.compare.buildingType) + row("Erfgoedcategorie", p.compare.heritageCat) + row("Ingreep", p.compare.intervention) + row("Vergunningscomplexiteit", p.compare.permitComplexity) + row("Budgetklasse", p.compare.budgetRange) + row("Doorlooptijd (mnd)", p.compare.durationMonths || "onbekend");
      out.appendChild(t);
      out.appendChild(el("h3", "sub", "Lessen uit vergelijkbare (demo-)projecten"));
      comparables([p.compare.buildingType, p.compare.intervention]).forEach(k => out.appendChild(el("div", "card", "<strong>" + k.project + "</strong><p>" + k.lesson + "</p><span class='chip'>📄 Kennisbank (demo) · tags: " + k.tags.join(", ") + "</span>")));
    }
    sel.onchange = refresh;
    root.appendChild(sel); root.appendChild(out); refresh();
    return root;
  }

  function vForecast(id) {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Klantgerichte projectprognose</h2><p>AI-ondersteund concept — vereist beoordeling door een bevoegde VIS-architect of projectleider.</p>"));
    const sel = el("select", "select");
    visibleProjects().forEach(p => { const o = el("option", null, p.name); o.value = p.id; sel.appendChild(o); });
    if (id) sel.value = id;
    const out = el("div");
    function refresh() {
      const p = visibleProjects().find(x => x.id === sel.value) || visibleProjects()[0];
      out.innerHTML = ""; out.appendChild(renderAnswer(answerForecast(p)));
    }
    sel.onchange = refresh; root.appendChild(sel); root.appendChild(out); refresh();
    return root;
  }

  function vDesign() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Ontwerp-ondersteuning</h2><p>Gesimuleerde workflow: upload van tekeningen, scans of foto's → dossiercontrole → ontwerpbrief → moodboard-richtingen. Geen echte CAD/puntenwolk-verwerking in deze demo; menselijke goedkeuring blijft verplicht.</p>"));
    const types = ["Blauwdruk / bouwtekening", "Historische tekening", "Gebouwfoto's", "Puntenwolk (3D-laserscan)", "3D-scan mesh", "Klantbriefing"];
    const chips = el("div", "chips clickable");
    const stage = el("div", "pipeline");
    types.forEach(t => { const c = el("span", "chip", "⬆︎ " + t); c.onclick = () => runPipeline(t); chips.appendChild(c); });
    function runPipeline(t) {
      stage.innerHTML = "<h3 class='sub'>Verwerking: " + t + " → Grachtenpand Herengracht 14</h3>";
      DB.designPipeline.forEach((step, i) => {
        setTimeout(() => {
          const li = el("div", "pipe-step done", "✓ " + step);
          stage.appendChild(li);
          if (i === DB.designPipeline.length - 1) {
            const boards = el("div", "cards");
            [["Moodboard — exterieur", "Gevelherstel in kalkverf-tinten, hersteld voegwerk, historisch schilderadvies. (placeholder-concept)", "board-a"],
             ["Moodboard — interieur", "Bel-etage: hergebruik paneeldeuren, kalkstuc, eiken visgraat, moderne inbouw reversibel. (placeholder-concept)", "board-b"],
             ["Ontwerpbrief (concept)", "Uitgangspunten uit klantbriefing + bouwhistorische opname samengevat; wacht op goedkeuring architect.", "board-c"]
            ].forEach(b => boards.appendChild(el("div", "card " + b[2], "<strong>" + b[0] + "</strong><p>" + b[1] + "</p><span class='badge b-gap'>Concept — goedkeuring architect vereist</span>")));
            stage.appendChild(boards);
          }
        }, 350 * (i + 1));
      });
    }
    root.appendChild(chips); root.appendChild(stage);
    return root;
  }

  function vArchitecture() {
    const root = el("div");
    root.appendChild(el("div", "view-head", "<h2>Architectuur, beveiliging & fasering</h2><p>VIS AI Werkbeeld is de menselijke werkomgeving. Een orchestrator routeert vragen naar begrensde specialistische assistenten, die uitsluitend geautoriseerde bronnen gebruiken. Het onderliggende model is vervangbaar.</p>"));
    root.appendChild(dataBanner());
    const layers = el("div", "cards");
    [["Bronnen", "Projectadministratie, M365/SharePoint, planning, documenten, 3D-scans, CRM. Bron blijft leidend — read-only."],
     ["Integratielaag", "Least-privilege connectors (Microsoft Graph, REST, MCP); geplande synchronisatie; export/handmatig als terugvaloptie."],
     ["Kennisbank", "PostgreSQL + vectorindex (pgvector); elk record met bron, eigenaar, actualiteit, vertrouwelijkheid en rol-toegang."],
     ["AI-gateway & assistenten", "Model-gateway (vendor-flexibel) · RAG met verplichte bronvermelding · orkestratie 'manager → specialisten' · audit-log op elke vraag."]
    ].forEach(l => layers.appendChild(el("div", "card", "<strong>" + l[0] + "</strong><p>" + l[1] + "</p>")));
    root.appendChild(layers);

    root.appendChild(el("h3", "sub", "Beveiliging & governance"));
    const sec = el("div", "cards");
    [["Autorisatie op datalaag", "Rol-, project- en documentniveau afgedwongen bij het ophalen van data — niet via promptinstructies. Probeer de rolwissel rechtsboven."],
     ["Read-only & menselijke goedkeuring", "Assistenten schrijven niets terug naar bronsystemen; elke consequentiële actie (archiveren, verplaatsen, versturen) vereist expliciete goedkeuring."],
     ["Herleidbaarheid", "Elke uitspraak toont bron, actualiteit en zekerheid; ontbrekende data wordt benoemd, nooit ingevuld."],
     ["Privacy & hosting", "EU-hosting als productierichting, encryptie in transit/at rest, secrets-vault, audit-logging, GDPR/DPIA, geen training op VIS-data, bewaar- en verwijderbeleid. Capaciteitsdata raakt medewerkers: transparantie naar het team en DPIA vóór productie."]
    ].forEach(l => sec.appendChild(el("div", "card", "<strong>" + l[0] + "</strong><p>" + l[1] + "</p>")));
    root.appendChild(sec);

    root.appendChild(el("h3", "sub", "Begrensde assistenten per fase"));
    const ag = el("div", "cards");
    [["Nu aantoonbaar", "VIS Portfolio & Kennisassistent op geverifieerde publieke informatie", ""],
     ["PoC met interne aansluiting", "Projectinformatie-assistent · Erfgoedproject-assistent", ""],
     ["Na DPIA en datavalidatie", "Capaciteitsadvies-assistent — scenario's, nooit autonome personeelsbesluiten", "future"]
    ].forEach(a => ag.appendChild(el("div", "card " + a[2], "<strong>" + a[0] + "</strong><p>" + a[1] + "</p>")));
    root.appendChild(ag);
    const ads = el("button", "btn light", "Open Agent Definition Specifications"); ads.onclick = () => { location.hash = "#agents"; }; root.appendChild(ads);
    root.appendChild(el("div", "warn", "Geen autonome 'directeuren' — het zijn autorisatie-gebonden assistenten op goedgekeurde data. " + DB.meta.principle));

    root.appendChild(el("h3", "sub", "Fasering (rustig, realistisch tempo — elke fase eindigt met go/no-go)"));
    const ph = el("div", "cards");
    [["Discovery", "± 3–5 weken", "Systemen- en data-inventarisatie, beveiligingsbasis, PoC-scope en succescriteria."],
     ["Doelarchitectuur", "± 2–3 weken", "Integratieplan, autorisatiemodel, evaluatiekader."],
     ["Project Intelligence PoC", "± 9–12 weken", "Deze demo, maar op echte (afgeschermde) projectdata voor 3–5 projecten."],
     ["Gecontroleerde pilot", "± 5–6 maanden", "Heel bureau, extra assistenten (capaciteit, pipeline, dossiers), dashboard, hardening."],
     ["Verdere uitbreiding", "cycli van ± 4–5 mnd", "Per kwartaal prioriteren op gemeten waarde."]
    ].forEach(f => ph.appendChild(el("div", "card", "<strong>" + f[0] + "</strong><span class='muted small'>" + f[1] + "</span><p>" + f[2] + "</p>")));
    root.appendChild(ph);

    root.appendChild(el("h3", "sub", "Regelgevingscontext (demo-uittreksels)"));
    DB.regulations.forEach(r => root.appendChild(el("div", "card", "<strong>" + r.name + "</strong><p>" + r.scope + "</p><span class='chip'>📄 " + r.source + " · opgehaald " + fmtDate(r.retrieved) + "</span>")));
    root.appendChild(el("div", "warn", "Regelgevingsinformatie is ondersteunend en moet worden gecontroleerd door een bevoegde professional en, waar nodig, de relevante overheid."));
    return root;
  }

  /* ---- router ---- */
  const VIEWS = {
    vis: vVis, agents: vAgents,
    dashboard: vDashboard, assistent: vAssistant, vergelijk: vCompare,
    prognose: vForecast, ontwerp: vDesign, architectuur: vArchitecture,
    planning: vPlanning, capaciteit: vCapacity, pijplijn: vPipeline,
    kaart: vMap, dossiers: vDossiers
  };
  function route() {
    const h = (location.hash || "#vis").slice(1);
    const [name, arg] = h.split("/");
    const main = $("#view"); main.innerHTML = "";
    document.querySelectorAll(".modal-bg").forEach(x => x.remove());
    document.querySelectorAll("nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + name));
    if (name === "project") main.appendChild(vProject(arg));
    else main.appendChild((VIEWS[name] || vDashboard)(arg));
  }

  function init() {
    const sel = $("#role");
    DB.roles.forEach(r => { const o = el("option", null, r.label); o.value = r.id; sel.appendChild(o); });
    sel.onchange = () => { setRole(sel.value); route(); };
    fetch("/api/health").then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.live) { window.LIVE_MODE = true; $("#mode").textContent = "Live-modus (Claude)"; $("#mode").classList.add("live"); }
    }).catch(() => { /* file:// or no server: mock mode */ });
    window.addEventListener("hashchange", route);
    route();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

})(typeof window !== "undefined" ? window : globalThis);
