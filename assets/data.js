/* =========================================================================
   VIS Architecten — AI Werkbeeld PoC  (v2: portfolio, capaciteit, pipeline)
   OPERATIONELE SCENARIODATA — volledig fictief. Deze dataset voedt uitsluitend
   het illustratieve werkbeeld (planning, capaciteit, financiën en pipeline).
   De afzonderlijke vis-public.js bevat geverifieerde publieke VIS-informatie.
   De twee lagen mogen nooit als één feitelijke dataset worden gepresenteerd.
   In productie komen planning/uren/allocaties live uit de bronsystemen.
   ========================================================================= */

const TODAY = "2026-07-16";

function src(id, name, type, updated, owner, conf, roles, confidence) {
  return {
    source_id: id, source_name: name, source_type: type,
    last_updated: updated, owner: owner,
    confidentiality: conf, access_roles: roles,
    confidence: confidence, is_demo_data: true
  };
}

const DB = {
  meta: {
    generated: TODAY,
    mode_default: "mock",
    disclaimer_nl: "Operationele project-, capaciteits-, financiële en pipelinegegevens zijn fictieve scenario's en geen feiten over VIS Architecten. Publieke VIS-informatie staat in een afzonderlijke bronlaag.",
    principle: "Mensen beslissen; het systeem informeert."
  },

  roles: [
    { id: "directie", label: "Directie — scenario", scope: "all", finance: true, hr: true },
    { id: "pl-bas", label: "Projectleider — scenario", scope: ["P-101", "P-104"], finance: false, hr: false }
  ],

  /* ---------- TEAM & CAPACITEIT (DEMO DATA — fictieve bezetting) ----------
     3 architecten · 2 technisch ontwerpers · 1 visualisator · 1 projectcoördinator.
     overhead = vast aandeel bureau/acquisitie/beheer. holidays = verlof.     */
  team: [
    { id: "ilse",    name: "Ilse",    role: "architect",  roleLabel: "Architect 01",           hoursWeek: 36, overhead: 0.15, holidays: [{ from: "2026-08-03", to: "2026-08-21" }] },
    { id: "marieke", name: "Marieke", role: "architect",  roleLabel: "Architect 02",           hoursWeek: 32, overhead: 0.10, holidays: [] },
    { id: "sanne",   name: "Sanne",   role: "architect",  roleLabel: "Architect 03",           hoursWeek: 40, overhead: 0.25, holidays: [{ from: "2026-12-21", to: "2027-01-01" }] },
    { id: "jeroen",  name: "Jeroen",  role: "technisch",  roleLabel: "Technisch Ontwerper 01", hoursWeek: 40, overhead: 0.10, holidays: [] },
    { id: "fatima",  name: "Fatima",  role: "technisch",  roleLabel: "Technisch Ontwerper 02", hoursWeek: 36, overhead: 0.10, holidays: [{ from: "2026-07-27", to: "2026-08-07" }] },
    { id: "daan",    name: "Daan",    role: "visualisator", roleLabel: "Visualisator",         hoursWeek: 32, overhead: 0.25, holidays: [] },
    { id: "bas",     name: "Bas",     role: "coordinator", roleLabel: "Projectcoördinator",    hoursWeek: 40, overhead: 0.25, holidays: [{ from: "2026-09-28", to: "2026-10-09" }] }
  ],
  roleLabels: { architect: "Architect", technisch: "Technisch ontwerper", visualisator: "Visualisator", coordinator: "Projectcoördinator" },

  /* ---------- FASECATALOGUS -----------------------------------------------
     Nederlandse erfgoedpraktijk (DNR/STB-achtig; conceptueel verwant aan een
     RIBA-Plan-of-Work maar RIBA is NIET de Nederlandse standaard).
     Configureerbaar: in productie per bureau/projecttype instelbaar.       */
  phases: [
    { id: "acquisitie",  label: "Acquisitie / Offerte",        color: "#b9cacd" },
    { id: "definitie",   label: "Projectdefinitie",            color: "#a8b8ba" },
    { id: "bouwhist",    label: "Bouwhistorisch onderzoek",    color: "#c9b598" },
    { id: "opname3d",    label: "Opname / 3D-scan",            color: "#b3a284" },
    { id: "haalbaar",    label: "Haalbaarheid",                color: "#a99d77" },
    { id: "SO",          label: "Schetsontwerp",               color: "#9db07f" },
    { id: "VO",          label: "Voorlopig Ontwerp",           color: "#8aa06b" },
    { id: "DO",          label: "Definitief Ontwerp",          color: "#78905c" },
    { id: "TO",          label: "Technisch Ontwerp / Bestek",  color: "#60724d" },
    { id: "vgvoorb",     label: "Vergunningvoorbereiding",     color: "#8ea7aa" },
    { id: "vgproc",      label: "Vergunningprocedure",         color: "#7797a0" },
    { id: "aanbest",     label: "Aanbesteding",                color: "#c2a06c" },
    { id: "bouwvoorb",   label: "Bouwvoorbereiding",           color: "#a3835f" },
    { id: "uitvoering",  label: "Uitvoering",                  color: "#8c6a4f" },
    { id: "oplevering",  label: "Oplevering",                  color: "#6f5a48" },
    { id: "nazorg",      label: "Nazorg / Onderhoud",          color: "#9a9a90" }
  ],

  /* Rolvraag per fase (aandeel van 1 fte per rol, DEMO-aannames).
     In productie: per projectgrootte/complexiteit gekalibreerd.            */
  phaseDemand: {
    acquisitie: { architect: 0.20, technisch: 0.00, visualisator: 0.10, coordinator: 0.10 },
    definitie:  { architect: 0.30, technisch: 0.10, visualisator: 0.00, coordinator: 0.10 },
    bouwhist:   { architect: 0.20, technisch: 0.10, visualisator: 0.00, coordinator: 0.00 },
    opname3d:   { architect: 0.10, technisch: 0.40, visualisator: 0.00, coordinator: 0.00 },
    haalbaar:   { architect: 0.30, technisch: 0.10, visualisator: 0.10, coordinator: 0.10 },
    SO:         { architect: 0.50, technisch: 0.10, visualisator: 0.20, coordinator: 0.05 },
    VO:         { architect: 0.60, technisch: 0.30, visualisator: 0.30, coordinator: 0.10 },
    DO:         { architect: 0.60, technisch: 0.40, visualisator: 0.20, coordinator: 0.10 },
    TO:         { architect: 0.30, technisch: 0.70, visualisator: 0.05, coordinator: 0.10 },
    vgvoorb:    { architect: 0.25, technisch: 0.30, visualisator: 0.00, coordinator: 0.15 },
    vgproc:     { architect: 0.10, technisch: 0.05, visualisator: 0.00, coordinator: 0.10 },
    aanbest:    { architect: 0.15, technisch: 0.25, visualisator: 0.00, coordinator: 0.25 },
    bouwvoorb:  { architect: 0.15, technisch: 0.35, visualisator: 0.00, coordinator: 0.20 },
    uitvoering: { architect: 0.25, technisch: 0.15, visualisator: 0.00, coordinator: 0.28 },
    oplevering: { architect: 0.15, technisch: 0.10, visualisator: 0.00, coordinator: 0.30 },
    nazorg:     { architect: 0.05, technisch: 0.05, visualisator: 0.00, coordinator: 0.10 }
  },

  projects: [
    {
      id: "P-101",
      name: "Grachtenpand Herengracht 14",
      type: "Renovatie rijksmonumentaal grachtenpand",
      typeTag: "renovatie",
      status: "actief",
      client: "Familie De Bruin (DEMO)",
      location: "Den Haag", coords: { x: 18, y: 46 },
      heritage: "Rijksmonument",
      phase: "Uitvoering",
      phasePct: 62,
      scope: "Volledige renovatie met behoud van historische interieurafwerking; herstel kap en fundering; nieuwe installaties.",
      team: ["Bas (PL)", "Ilse (architect)", "Jeroen (bouwkundige)", "erfgoedspecialist"],
      pm: "Bas",
      assign: { architect: { ilse: 1.0 }, technisch: { jeroen: 1.0 }, visualisator: {}, coordinator: { bas: 1.0 } },
      budget: 1450000, feesPlanned: 168000, feesInvoiced: 121000,
      hoursPlanned: 1240, hoursActual: 1372,
      health: "attention",
      healthReason: "Uren 11% boven plan; funderingsherstel complexer dan voorzien.",
      schedule: [
        { phase: "bouwvoorb", start: "2026-01-05", end: "2026-02-27" },
        { phase: "uitvoering", start: "2026-03-02", end: "2027-01-15" },
        { phase: "oplevering", start: "2027-01-18", end: "2027-02-05" },
        { phase: "nazorg", start: "2027-02-08", end: "2027-05-01" }
      ],
      msList: [
        { title: "Casco & fundering gereed", date: "2026-08-07", type: "bouw" },
        { title: "Klantbesluit interieurafwerking", date: "2026-09-15", type: "klantbesluit" },
        { title: "Afbouw historisch interieur", date: "2026-11-20", type: "bouw" },
        { title: "Oplevering", date: "2027-01-29", type: "oplevering" }
      ],
      deviations: [
        { milestone: "Casco & fundering gereed", planned: "2026-08-07", forecast: "2026-08-21", reason: "Funderingsherstel complexer dan raming; herziene aannemersplanning.", sources: ["Projectplanning", "Actielijst", "Bouwvergadering 09-07"], affects: "Afbouwfase en beschikbaarheid Ilse voor Sint-Agneskerk (DO-afronding)." }
      ],
      milestones: [
        { title: "Start uitvoering", due: "2026-03-02", status: "done" },
        { title: "Casco & fundering gereed", due: "2026-08-07", status: "at-risk" },
        { title: "Afbouw historisch interieur", due: "2026-11-20", status: "planned" },
        { title: "Oplevering", due: "2027-01-29", status: "planned" }
      ],
      permits: [
        { name: "Omgevingsvergunning (incl. monument)", authority: "Gemeente Den Haag", status: "verleend", date: "2025-11-12", expiryAction: null }
      ],
      risks: [
        { id: "R-101-1", title: "Funderingsherstel duurder en trager dan raming", severity: "hoog", prob: "waarschijnlijk", mitigation: "Herziene raming aannemer opvragen; bespreken met opdrachtgever vóór 24-07.", open: true },
        { id: "R-101-2", title: "Levertijd historische kalkmortel", severity: "middel", prob: "mogelijk", mitigation: "Alternatieve leverancier gekwalificeerd.", open: true }
      ],
      actions: [
        { id: "A-101-1", title: "Herziene funderingsraming beoordelen", owner: "Bas", due: "2026-07-20", opened: "2026-07-08", open: true },
        { id: "A-101-2", title: "Kleuronderzoek stucplafond vrijgeven", owner: "Ilse", due: "2026-07-10", opened: "2026-06-28", open: true },
        { id: "A-101-3", title: "Meerwerk kap vastleggen in besluitenlog", owner: "Bas", due: "2026-07-03", opened: "2026-06-19", open: true }
      ],
      rfis: [
        { id: "RFI-101-4", title: "Detail aansluiting nieuwe installatieschacht op moerbalk", from: "Aannemer Van Dorp & Zn (DEMO)", opened: "2026-07-06", open: true }
      ],
      decisions: [
        { date: "2026-06-30", title: "Opdrachtgever akkoord met herstel i.p.v. vervanging kapconstructie" }
      ],
      invoices: [
        { nr: "F-2026-041", amount: 28000, sent: "2026-06-15", paid: true },
        { nr: "F-2026-055", amount: 31000, sent: "2026-07-01", paid: false, due: "2026-07-29" }
      ],
      documents: { present: ["VO", "DO", "Bestek", "Omgevingsvergunning", "3D-scan bestand", "Bouwhistorische opname"], missing: ["Actueel V&G-plan uitvoeringsfase"] },
      communications: [
        { date: "2026-07-09", channel: "e-mail", summary: "Opdrachtgever geïnformeerd over voortgang fundering; zorg over planning geuit." }
      ],
      sustainability: ["Isolatie kap met houtvezel (monumentvriendelijk)", "HR++ achterzetbeglazing", "Warmtepomp hybride"],
      safety: ["Werken op hoogte kapherstel", "Stofbeheersing bij sloop historisch stucwerk"],
      lessons: "Vergelijkbaar funderingsherstel bij eerder grachtenpand: reken op +15% uren in casco-fase.",
      compare: { buildingType: "woonhuis", heritageCat: "rijksmonument", intervention: "renovatie", permitComplexity: "middel", budgetRange: "1–2 mln", durationMonths: 23 },
      _src: src("SRC-ADMIN-P101", "Projectadministratie (AFAS-demo)", "projectadministratie", "2026-07-14", "Bas", "intern", ["directie", "pl-bas"], 0.92)
    },

    {
      id: "P-102",
      name: "Herbestemming Sint-Agneskerk",
      type: "Herbestemming historische kerk naar cultureel centrum",
      typeTag: "herbestemming",
      status: "actief",
      client: "Stichting Cultuurhuis Delft (DEMO)",
      location: "Delft", coords: { x: 30, y: 60 },
      heritage: "Rijksmonument",
      phase: "Definitief Ontwerp",
      phasePct: 48,
      scope: "Herbestemming kerkschip naar zaal met inbouwvolumes; behoud gewelven en gebrandschilderd glas; nieuwe entree.",
      team: ["Sanne (PL)", "Ilse (architect)", "erfgoedspecialist", "constructeur extern"],
      pm: "Sanne",
      assign: { architect: { sanne: 0.7, ilse: 0.3 }, technisch: { fatima: 0.8 }, visualisator: { daan: 1.0 }, coordinator: { bas: 1.0 } },
      budget: 3200000, feesPlanned: 295000, feesInvoiced: 118000,
      hoursPlanned: 980, hoursActual: 941,
      health: "attention",
      healthReason: "Beslistermijn omgevingsvergunning nadert (10-08); advies monumentencommissie nog niet ontvangen.",
      schedule: [
        { phase: "DO", start: "2026-06-01", end: "2026-08-28" },
        { phase: "vgproc", start: "2026-05-19", end: "2026-08-10" },
        { phase: "aanbest", start: "2026-10-05", end: "2026-11-13" },
        { phase: "bouwvoorb", start: "2026-11-16", end: "2027-01-29" },
        { phase: "uitvoering", start: "2027-02-01", end: "2027-12-17" },
        { phase: "oplevering", start: "2027-12-18", end: "2028-01-15" }
      ],
      msList: [
        { title: "Vergunningsbesluit verwacht", date: "2026-08-10", type: "vergunning" },
        { title: "DO gereed", date: "2026-08-28", type: "intern" },
        { title: "Klantbesluit gunning aannemer", date: "2026-11-13", type: "klantbesluit" },
        { title: "Start uitvoering", date: "2027-02-01", type: "bouw" }
      ],
      deviations: [
        { milestone: "Vergunningsbesluit verwacht", planned: "2026-08-10", forecast: "2026-08-24", reason: "Advies monumentencommissie nog niet ontvangen; verlenging beslistermijn waarschijnlijk.", sources: ["Vergunningdossier", "Vooroverleg-notitie", "Projectoverleg 11-07"], affects: "Start aanbesteding (05-10) en fondsenwerving stichting." }
      ],
      milestones: [
        { title: "DO gereed", due: "2026-08-28", status: "planned" },
        { title: "Vergunningsbesluit verwacht", due: "2026-08-10", status: "at-risk" },
        { title: "Start aanbesteding", due: "2026-10-05", status: "planned" }
      ],
      permits: [
        { name: "Omgevingsvergunning (monument + functiewijziging)", authority: "Gemeente Delft", status: "in behandeling", date: "2026-05-19", decisionDue: "2026-08-10" }
      ],
      risks: [
        { id: "R-102-1", title: "Advies monumentencommissie vraagt aanpassing inbouwvolumes", severity: "hoog", prob: "mogelijk", mitigation: "Vooroverleg ingepland; alternatief inbouwconcept achter de hand.", open: true },
        { id: "R-102-2", title: "Akoestiek zaal onvoldoende zonder ingrepen aan gewelf", severity: "middel", prob: "mogelijk", mitigation: "Akoestisch adviseur variantenstudie laten doen.", open: true }
      ],
      actions: [
        { id: "A-102-1", title: "Vooroverleg monumentencommissie voorbereiden", owner: "Sanne", due: "2026-07-22", opened: "2026-07-10", open: true },
        { id: "A-102-2", title: "Variantenstudie akoestiek uitzetten", owner: "Ilse", due: "2026-07-31", opened: "2026-07-13", open: true }
      ],
      rfis: [],
      decisions: [
        { date: "2026-06-12", title: "Stichting akkoord met DO-richting 'huis-in-huis'" }
      ],
      invoices: [
        { nr: "F-2026-048", amount: 42000, sent: "2026-06-20", paid: false, due: "2026-07-18" }
      ],
      documents: { present: ["SO", "VO", "Bouwhistorisch onderzoek", "3D-scan bestand", "Vergunningaanvraag"], missing: ["Advies monumentencommissie", "Definitief akoestisch rapport"] },
      communications: [
        { date: "2026-07-11", channel: "overleg", summary: "Stichting vraagt om planningszekerheid richting fondsenwerving." }
      ],
      sustainability: ["Vloerverwarming in nieuwe vloeropbouw", "Isolerende beglazing in nieuwe puien", "LED-lichtplan gewelfvriendelijk"],
      safety: ["Steigerwerk in kerkschip", "Bescherming gebrandschilderd glas tijdens bouw"],
      lessons: "Bij eerdere kerkherbestemming: monumentencommissie stuurt vrijwel altijd op reversibiliteit van inbouw.",
      compare: { buildingType: "kerk", heritageCat: "rijksmonument", intervention: "herbestemming", permitComplexity: "hoog", budgetRange: "2–5 mln", durationMonths: 30 },
      _src: src("SRC-ADMIN-P102", "Projectadministratie (AFAS-demo)", "projectadministratie", "2026-07-13", "Sanne", "intern", ["directie"], 0.88)
    },

    {
      id: "P-103",
      name: "Restauratie Landhuis Oosterduin",
      type: "Restauratie monumentaal landhuis",
      typeTag: "restauratie",
      status: "actief",
      client: "Landgoed Oosterduin B.V. (DEMO)",
      location: "Wassenaar", coords: { x: 24, y: 38 },
      heritage: "Rijksmonument",
      phase: "Voorlopig Ontwerp",
      phasePct: 24,
      scope: "Casco-restauratie, herstel stucgevels en serre; herinrichting bel-etage.",
      team: ["Bas (adviseur)", "Marieke (architect)", "erfgoedspecialist"],
      pm: "Marieke",
      assign: { architect: { marieke: 1.0 }, technisch: { fatima: 0.7 }, visualisator: { daan: 0.7 }, coordinator: { bas: 0.5 } },
      budget: null, feesPlanned: 210000, feesInvoiced: 31000,
      hoursPlanned: 640, hoursActual: 388,
      health: "data-gap",
      healthReason: "Nog geen vastgesteld bouwbudget en geen recente urenregistratie (laatste: 30-06).",
      schedule: [
        { phase: "bouwhist", start: "2026-07-01", end: "2026-08-15" },
        { phase: "opname3d", start: "2026-08-05", end: "2026-08-25" },
        { phase: "VO", start: "2026-07-15", end: "2026-09-11" },
        { phase: "TO", start: "2026-10-01", end: "2026-12-18" },
        { phase: "vgvoorb", start: "2026-12-01", end: "2027-01-15" },
        { phase: "vgproc", start: "2027-01-16", end: "2027-03-15" },
        { phase: "aanbest", start: "2027-04-01", end: "2027-05-08" },
        { phase: "uitvoering", start: "2027-06-01", end: "2028-03-31" }
      ],
      msList: [
        { title: "3D-scan gepland", date: "2026-08-05", type: "intern" },
        { title: "Kostenraming element-niveau", date: "2026-08-21", type: "intern" },
        { title: "VO gereed", date: "2026-09-11", type: "intern" },
        { title: "Vergunningaanvraag indienen", date: "2026-09-15", type: "vergunning" },
        { title: "Verwacht vergunningsbesluit", date: "2027-03-15", type: "vergunning" }
      ],
      deviations: [
        { milestone: "Vergunningaanvraag indienen", planned: "2026-09-15", forecast: "2026-09-28", reason: "Bouwhistorisch rapport nog niet gereed.", sources: ["Projectplanning", "Actielijst", "Laatste projectoverleg"], affects: "TO-start (01-10) en daarmee de beschikbaarheid van Fatima in Q4." }
      ],
      milestones: [
        { title: "VO gereed", due: "2026-09-11", status: "planned" },
        { title: "Kostenraming element-niveau", due: "2026-08-21", status: "planned" }
      ],
      permits: [
        { name: "Omgevingsvergunning (monument)", authority: "Gemeente Wassenaar", status: "nog niet aangevraagd", date: null }
      ],
      risks: [
        { id: "R-103-1", title: "Houtrot in serreconstructie omvangrijker dan zichtbaar", severity: "middel", prob: "waarschijnlijk", mitigation: "Destructief onderzoek inplannen na akkoord eigenaar.", open: true }
      ],
      actions: [
        { id: "A-103-1", title: "Budgetkader bevestigen met opdrachtgever", owner: "Marieke", due: "2026-07-24", opened: "2026-07-02", open: true },
        { id: "A-103-2", title: "Urenregistratie team bijwerken", owner: "team", due: "2026-07-17", opened: "2026-07-14", open: true }
      ],
      rfis: [
        { id: "RFI-103-1", title: "Eigenaar: kleurstelling serre historisch of naar wens?", from: "Opdrachtgever", opened: "2026-06-24", open: true }
      ],
      decisions: [],
      invoices: [
        { nr: "F-2026-036", amount: 31000, sent: "2026-05-30", paid: true }
      ],
      documents: { present: ["Bouwhistorische quickscan", "Fotodocumentatie", "SO"], missing: ["Vastgesteld budgetkader", "3D-scan (ingepland 05-08)", "Funderingsonderzoek"] },
      communications: [
        { date: "2026-06-24", channel: "e-mail", summary: "Eigenaar vraagt om voorstel kleurstelling serre; wacht op kleurhistorisch onderzoek." }
      ],
      sustainability: ["Kansenkaart verduurzaming op te stellen in VO"],
      safety: ["Asbestverdacht materiaal in kelder — inventarisatie vereist"],
      lessons: "Bij landhuizen: budgetkader vóór VO-afronding vastleggen voorkomt herontwerp.",
      compare: { buildingType: "landhuis", heritageCat: "rijksmonument", intervention: "restauratie", permitComplexity: "middel", budgetRange: "onbekend", durationMonths: null },
      _src: src("SRC-ADMIN-P103", "Projectadministratie (AFAS-demo)", "projectadministratie", "2026-06-30", "Marieke", "intern", ["directie"], 0.61)
    },

    {
      id: "P-104",
      name: "Renovatie Willemsstraat 8–10",
      type: "Renovatie met 3D-laserscanning",
      typeTag: "renovatie",
      status: "actief",
      client: "Woonstichting Hofstad (DEMO)",
      location: "Den Haag", coords: { x: 16, y: 44 },
      heritage: "Gemeentelijk monument",
      phase: "Bouwvoorbereiding",
      phasePct: 71,
      scope: "Renovatie twee samengevoegde panden; volledige 3D-scan als ontwerp- en controlebasis; herstel gevel.",
      team: ["Bas (PL)", "Jeroen (bouwkundige)", "scanteam"],
      pm: "Bas",
      assign: { architect: { ilse: 1.0 }, technisch: { jeroen: 1.0 }, visualisator: {}, coordinator: { bas: 1.0 } },
      budget: 890000, feesPlanned: 96000, feesInvoiced: 74000,
      hoursPlanned: 720, hoursActual: 698,
      health: "ok",
      healthReason: "Op schema; scanmodel versnelt uitwerking aanzienlijk.",
      schedule: [
        { phase: "TO", start: "2026-06-01", end: "2026-08-31" },
        { phase: "aanbest", start: "2026-09-01", end: "2026-10-09" },
        { phase: "uitvoering", start: "2026-10-12", end: "2027-06-11" },
        { phase: "oplevering", start: "2027-06-14", end: "2027-07-02" }
      ],
      msList: [
        { title: "Bestek gereed", date: "2026-07-25", type: "intern" },
        { title: "Aanbesteding publicatie", date: "2026-09-01", type: "aanbesteding" },
        { title: "Klantbesluit gunning", date: "2026-10-09", type: "klantbesluit" },
        { title: "Start uitvoering", date: "2026-10-12", type: "bouw" },
        { title: "Oplevering", date: "2027-07-02", type: "oplevering" }
      ],
      deviations: [],
      milestones: [
        { title: "Bestek gereed", due: "2026-07-25", status: "on-track" },
        { title: "Aanbesteding", due: "2026-09-01", status: "planned" },
        { title: "Start uitvoering", due: "2026-10-12", status: "planned" }
      ],
      permits: [
        { name: "Omgevingsvergunning (gemeentelijk monument)", authority: "Gemeente Den Haag", status: "verleend", date: "2026-04-03" }
      ],
      risks: [
        { id: "R-104-1", title: "Aanbestedingsmarkt: beperkt aantal restauratieaannemers beschikbaar Q4", severity: "middel", prob: "mogelijk", mitigation: "Vroegtijdig marktconsultatie; planning aanbesteding naar voren.", open: true }
      ],
      actions: [
        { id: "A-104-1", title: "Bestek hoofdstuk gevelherstel afronden", owner: "Jeroen", due: "2026-07-23", opened: "2026-07-09", open: true }
      ],
      rfis: [],
      decisions: [
        { date: "2026-05-20", title: "Opdrachtgever akkoord met gefaseerde uitvoering (bewoond)" }
      ],
      invoices: [
        { nr: "F-2026-051", amount: 18500, sent: "2026-06-28", paid: true }
      ],
      documents: { present: ["3D-scan puntenwolk", "VO", "DO", "Vergunning", "Concept-bestek"], missing: [] },
      communications: [
        { date: "2026-07-07", channel: "overleg", summary: "Bewonerscommunicatieplan besproken met woonstichting." }
      ],
      sustainability: ["Na-isolatie binnenzijde met dampopen systeem", "Zonnepanelen op achterdakvlak (vergund)"],
      safety: ["Gefaseerde uitvoering in bewoonde staat — extra aandacht bouwveiligheid"],
      lessons: "Scanmodel reduceerde maatvoeringsvragen met naar schatting 40% t.o.v. vergelijkbaar project zonder scan.",
      compare: { buildingType: "woonhuis", heritageCat: "gemeentelijk monument", intervention: "renovatie", permitComplexity: "laag", budgetRange: "0.5–1 mln", durationMonths: 16 },
      _src: src("SRC-ADMIN-P104", "Projectadministratie (AFAS-demo)", "projectadministratie", "2026-07-15", "Bas", "intern", ["directie", "pl-bas"], 0.95)
    },

    {
      id: "P-105",
      name: "Verduurzaming Hofje van Bleyswijck",
      type: "Verduurzaming historisch woonensemble",
      typeTag: "verduurzaming",
      status: "actief",
      client: "Stichting Hofje van Bleyswijck (DEMO)",
      location: "Delft", coords: { x: 33, y: 63 },
      heritage: "Rijksmonument (ensemble)",
      phase: "Schetsontwerp",
      phasePct: 12,
      scope: "Verduurzamingsplan 14 hofjeswoningen: isolatie, installaties, energieconcept; subsidietraject.",
      team: ["Sanne (PL)", "Marieke (architect)", "installatieadviseur extern"],
      pm: "Sanne",
      assign: { architect: { sanne: 0.6, marieke: 0.4 }, technisch: { fatima: 0.5 }, visualisator: { daan: 0.5 }, coordinator: { bas: 0.5 } },
      budget: 1100000, feesPlanned: 84000, feesInvoiced: 0,
      hoursPlanned: 380, hoursActual: 92,
      health: "ok",
      healthReason: "Recent gestart; subsidie-aanvraag bepaalt tempo.",
      schedule: [
        { phase: "SO", start: "2026-06-15", end: "2026-09-04" },
        { phase: "VO", start: "2026-09-07", end: "2026-12-18" },
        { phase: "vgvoorb", start: "2027-01-04", end: "2027-02-12" },
        { phase: "vgproc", start: "2027-02-15", end: "2027-04-15" },
        { phase: "TO", start: "2027-03-01", end: "2027-06-25" },
        { phase: "aanbest", start: "2027-07-01", end: "2027-08-06" },
        { phase: "uitvoering", start: "2027-09-01", end: "2028-06-30" }
      ],
      msList: [
        { title: "Subsidieaanvraag (SIM-demo)", date: "2026-08-30", type: "klantbesluit" },
        { title: "Energieconcept varianten", date: "2026-09-04", type: "intern" },
        { title: "Vergunningaanvraag indienen", date: "2027-02-15", type: "vergunning" },
        { title: "Start uitvoering", date: "2027-09-01", type: "bouw" }
      ],
      deviations: [],
      milestones: [
        { title: "Energieconcept varianten", due: "2026-09-04", status: "planned" },
        { title: "Subsidieaanvraag (SIM-demo)", due: "2026-08-30", status: "on-track" }
      ],
      permits: [
        { name: "Omgevingsvergunning (monument)", authority: "Gemeente Delft", status: "nog niet aangevraagd", date: null }
      ],
      risks: [
        { id: "R-105-1", title: "Subsidieplafond bereikt vóór indiening", severity: "middel", prob: "mogelijk", mitigation: "Aanvraag voorbereiden op vroegst mogelijke indieningsdatum.", open: true }
      ],
      actions: [
        { id: "A-105-1", title: "Bouwfysische opname 3 referentiewoningen", owner: "Marieke", due: "2026-07-28", opened: "2026-07-06", open: true }
      ],
      rfis: [],
      decisions: [],
      invoices: [],
      documents: { present: ["Opnameverslag start", "Fotodocumentatie"], missing: ["Energielabels huidige staat", "Bewonerswensen-inventarisatie"] },
      communications: [
        { date: "2026-07-03", channel: "bewonersavond", summary: "Informatieavond bewoners; draagvlak goed, zorg over overlast." }
      ],
      sustainability: ["Isolatievarianten monumentvriendelijk", "Collectieve warmtepomp-variant onderzoeken", "Behoud eenruiters met achterzetramen"],
      safety: ["Werkzaamheden in bewoonde staat"],
      lessons: "Bewonersparticipatie vroeg starten is bij hofjes doorslaggevend voor planning.",
      compare: { buildingType: "hofje/ensemble", heritageCat: "rijksmonument", intervention: "verduurzaming", permitComplexity: "middel", budgetRange: "1–2 mln", durationMonths: 20 },
      _src: src("SRC-ADMIN-P105", "Projectadministratie (AFAS-demo)", "projectadministratie", "2026-07-10", "Sanne", "intern", ["directie"], 0.83)
    }
  ],

  /* ---------- OVERIGE PORTFOLIO: afgerond & on hold (DEMO DATA) ---------- */
  extraProjects: [
    {
      id: "C-201", name: "Restauratie Vestingkerk Naaldwijk", status: "afgerond",
      type: "Restauratie rijksmonumentale kerk", typeTag: "restauratie",
      location: "Naaldwijk", coords: { x: 16, y: 64 }, heritage: "Rijksmonument",
      period: "2023 – 2025", pm: "Marieke",
      archiveReady: 0.78, archiveMissing: ["Revisietekeningen installaties", "Garantiedossier aannemer"],
      lessons: "Kalkzandsteenherstel: proefvlakken vroeg laten goedkeuren door RCE-adviseur.",
      _src: src("SRC-ARCH-C201", "Projectarchief (SharePoint-demo)", "documenten", "2026-05-02", "Marieke", "intern", ["directie"], 0.85)
    },
    {
      id: "C-202", name: "Verbouwing Herenhuis Parkstraat", status: "afgerond",
      type: "Renovatie herenhuis", typeTag: "renovatie",
      location: "Den Haag", coords: { x: 20, y: 48 }, heritage: "Gemeentelijk monument",
      period: "2022 – 2024", pm: "Bas",
      archiveReady: 1.0, archiveMissing: [],
      lessons: "Volledig gearchiveerd; dossier dient als referentie voor archiveringsstandaard.",
      _src: src("SRC-ARCH-C202", "Projectarchief (SharePoint-demo)", "documenten", "2025-11-20", "Bas", "intern", ["directie"], 0.95)
    },
    {
      id: "H-301", name: "Herbestemming Stationspostgebouw", status: "on-hold",
      type: "Herbestemming kantoormonument", typeTag: "herbestemming",
      location: "Rijswijk", coords: { x: 24, y: 55 }, heritage: "Gemeentelijk monument",
      period: "gestart 2025 — gepauzeerd", pm: "Sanne",
      holdReason: "Financiering opdrachtgever nog niet rond; hervatting verwacht Q1 2027.",
      lessons: "Bij hervatting: VO actualiseren op gewijzigde Bbl-eisen.",
      _src: src("SRC-ADMIN-H301", "Projectadministratie (AFAS-demo)", "projectadministratie", "2026-04-14", "Sanne", "intern", ["directie"], 0.7)
    }
  ],

  /* ---------- ACQUISITIEPIJPLIJN (DEMO DATA) ------------------------------
     demand = gemiddelde fte-vraag per rol zolang het project loopt.
     Gewogen capaciteitsprognose = kans × vraag.                            */
  pipelineStages: ["Lead", "Eerste gesprek", "Offerte gevraagd", "Offerte ingediend", "Onderhandeling", "Verwachte gunning"],
  pipeline: [
    {
      id: "PL-401", name: "Herbestemming Pakhuis Kade 7", stage: "Offerte ingediend",
      clientType: "Ontwikkelaar", type: "Herbestemming pakhuis naar wonen", typeTag: "herbestemming",
      location: "Rotterdam", coords: { x: 42, y: 72 }, heritage: "Rijksmonument",
      estValue: 260000, estEffortHrs: 2600, probability: 0.5,
      expectedStart: "2026-11-01", durationMonths: 14,
      demand: { architect: 0.5, technisch: 0.3, visualisator: 0.2, coordinator: 0.15 },
      note: "Offerte 26-06 ingediend; besluit verwacht september.",
      _src: src("SRC-CRM-PL401", "Acquisitieregister (CRM-demo)", "projectadministratie", "2026-07-08", "Sanne", "vertrouwelijk", ["directie"], 0.8)
    },
    {
      id: "PL-402", name: "Restauratie Buitenplaats Ter Horst", stage: "Onderhandeling",
      clientType: "Particulier", type: "Restauratie buitenplaats", typeTag: "restauratie",
      location: "Voorschoten", coords: { x: 30, y: 44 }, heritage: "Rijksmonument",
      estValue: 310000, estEffortHrs: 3100, probability: 0.75,
      expectedStart: "2026-10-01", durationMonths: 18,
      demand: { architect: 0.4, technisch: 0.25, visualisator: 0.1, coordinator: 0.15 },
      note: "Honorarium akkoord op hoofdlijnen; fasering nog bespreekpunt.",
      _src: src("SRC-CRM-PL402", "Acquisitieregister (CRM-demo)", "projectadministratie", "2026-07-12", "Sanne", "vertrouwelijk", ["directie"], 0.85)
    },
    {
      id: "PL-403", name: "Verduurzaming Hofjeswoningen Spaarne", stage: "Eerste gesprek",
      clientType: "Stichting", type: "Verduurzaming historisch woonensemble", typeTag: "verduurzaming",
      location: "Haarlem", coords: { x: 32, y: 10 }, heritage: "Gemeentelijk monument",
      estValue: 120000, estEffortHrs: 1400, probability: 0.25,
      expectedStart: "2027-01-15", durationMonths: 12,
      demand: { architect: 0.3, technisch: 0.2, visualisator: 0.1, coordinator: 0.1 },
      note: "Kennismaking geweest; referentie Hofje van Bleyswijck gedeeld.",
      _src: src("SRC-CRM-PL403", "Acquisitieregister (CRM-demo)", "projectadministratie", "2026-07-02", "Marieke", "vertrouwelijk", ["directie"], 0.6)
    },
    {
      id: "PL-404", name: "Renovatie Rijkskantoor Vliet", stage: "Offerte gevraagd",
      clientType: "Overheid", type: "Renovatie monumentaal kantoor", typeTag: "renovatie",
      location: "Voorburg", coords: { x: 26, y: 50 }, heritage: "Rijksmonument",
      estValue: 190000, estEffortHrs: 2100, probability: 0.5,
      expectedStart: "2026-12-01", durationMonths: 16,
      demand: { architect: 0.35, technisch: 0.3, visualisator: 0.05, coordinator: 0.2 },
      note: "Uitvraag ontvangen 07-07; indiening uiterlijk 15-08.",
      _src: src("SRC-CRM-PL404", "Acquisitieregister (CRM-demo)", "projectadministratie", "2026-07-14", "Sanne", "vertrouwelijk", ["directie"], 0.7)
    }
  ],

  /* ---------- SCENARIOPLANNER: projecttypesjablonen (DEMO-aannames) ------ */
  scenarioTypes: [
    { id: "townhouse", label: "Renovatie monumentaal grachtenpand/herenhuis", months: 16, demand: { architect: 0.40, technisch: 0.30, visualisator: 0.10, coordinator: 0.20 } },
    { id: "church",    label: "Herbestemming historische kerk",               months: 24, demand: { architect: 0.50, technisch: 0.30, visualisator: 0.20, coordinator: 0.20 } },
    { id: "country",   label: "Restauratie landhuis/buitenplaats",            months: 20, demand: { architect: 0.45, technisch: 0.25, visualisator: 0.10, coordinator: 0.15 } },
    { id: "office",    label: "Renovatie monumentaal kantoor",                months: 16, demand: { architect: 0.35, technisch: 0.30, visualisator: 0.05, coordinator: 0.20 } },
    { id: "resi",      label: "Verduurzaming historische woningen",           months: 12, demand: { architect: 0.30, technisch: 0.20, visualisator: 0.10, coordinator: 0.10 } }
  ],
  complexity: [
    { id: "laag", label: "Laag", factor: 0.8 },
    { id: "middel", label: "Middel", factor: 1.0 },
    { id: "hoog", label: "Hoog", factor: 1.25 }
  ],

  /* ---------- PROJECTDOSSIERS: mapsjabloon (aanpasbaar per bureau) ------- */
  folderTemplate: [
    { name: "00_Projectadministratie", sub: ["Opdrachtgever", "Contract", "Honorariumvoorstel", "Correspondentie"] },
    { name: "01_Projectdefinitie", sub: ["Programma van Eisen", "Bestaande informatie", "Klantwensen"] },
    { name: "02_Onderzoek_Opname", sub: ["Bouwhistorisch onderzoek", "Erfgoedtoets", "Bouwkundige opname", "3D-scan", "Puntenwolk", "Bestaande tekeningen"] },
    { name: "03_Schetsontwerp", sub: ["Schetsen", "Moodboards", "Ontwerpvarianten", "Klantpresentaties"] },
    { name: "04_Voorlopig_Ontwerp", sub: ["Tekeningen", "Rapporten", "Kostenraming"] },
    { name: "05_Technisch_Ontwerp", sub: ["Bouwkundig", "Constructie", "Installaties", "Details", "Bestek"] },
    { name: "06_Vergunningen", sub: ["Aanvraag", "Correspondentie gemeente", "Monumentencommissie", "Besluiten"] },
    { name: "07_Aanbesteding", sub: ["Aanbestedingsstukken", "Nota van inlichtingen", "Inschrijvingen"] },
    { name: "08_Uitvoering", sub: ["Bouwverslagen", "RFI's", "Goedkeuringen", "Wijzigingen", "Bouwfoto's"] },
    { name: "09_Oplevering", sub: ["Revisiestukken", "Handleidingen", "Proces-verbaal", "Restpunten"] },
    { name: "10_Archief", sub: ["Definitieve stukken", "Historisch dossier", "Lessons learned"] }
  ],

  /* Documentintelligentie-voorbeeld (demo-workflow) */
  docIntelExample: {
    filename: "VIS_ProjectX_VO_Plattegrond-BG_v07.pdf",
    classification: [
      ["Project", "Grachtenpand Herengracht 14 (P-101)"],
      ["Fase", "Voorlopig Ontwerp"],
      ["Documenttype", "Tekening — plattegrond begane grond"],
      ["Discipline", "Architectuur"],
      ["Versie", "07 (nieuwer dan v06 in dossier)"],
      ["Voorgestelde locatie", "04_Voorlopig_Ontwerp / Tekeningen"],
      ["Status", "Niet ondertekend — goedkeuring architect vereist"],
      ["Actie", "v06 archiveren, v07 markeren als actueel — na menselijke bevestiging"]
    ]
  },

  /* Snelkoppelingen op projectpagina (demo-bestandslijsten in modal) */
  quickAccess: ["Plannen", "Tekeningen", "Visuals", "3D-scans", "Puntenwolken", "Correspondentie", "Verslagen", "Vergunningen", "Budget", "Planning", "Contracten", "Bouwfoto's"],

  regulations: [
    { id: "REG-1", name: "Besluit bouwwerken leefomgeving (Bbl)", scope: "Technische bouwregels; bij monumenten gelden uitzonderings- en gelijkwaardigheidsbepalingen.", source: "wetten.overheid.nl (demo-uittreksel)", retrieved: "2026-07-01", is_demo_data: true },
    { id: "REG-2", name: "Omgevingswet — omgevingsvergunning monument", scope: "Rijksmonumentenactiviteit vergunningplichtig; reguliere procedure 8 weken + mogelijke verlenging 6 weken.", source: "iplo.nl (demo-uittreksel)", retrieved: "2026-07-01", is_demo_data: true },
    { id: "REG-3", name: "Gemeentelijk omgevingsplan Delft (fragment)", scope: "Functiewijziging maatschappelijk → cultuur binnen beschermd stadsgezicht: binnenplanse beoordeling.", source: "regels.overheid.nl (demo-uittreksel)", retrieved: "2026-06-28", is_demo_data: true },
    { id: "REG-4", name: "Subsidieregeling instandhouding monumenten (SIM) — demo", scope: "Indieningsvenster en subsidiabele kosten voor rijksmonumenten (demo-samenvatting).", source: "cultureelerfgoed.nl (demo-uittreksel)", retrieved: "2026-06-30", is_demo_data: true }
  ],

  knowledge: [
    { id: "K-1", project: "Grachtenpand Lange Voorhout (2023, demo)", tags: ["woonhuis", "rijksmonument", "renovatie", "fundering"], lesson: "Funderingsherstel bij grachtenpanden: gemiddeld +15% uren in cascofase; vroegtijdige sondering loont.", is_demo_data: true },
    { id: "K-2", project: "Herbestemming Waterstaatskerk Rijswijk (2022, demo)", tags: ["kerk", "rijksmonument", "herbestemming", "monumentencommissie"], lesson: "Reversibele inbouw ('huis-in-huis') verkortte vergunningstraject met ± 6 weken.", is_demo_data: true },
    { id: "K-3", project: "Landhuis Duinzicht (2024, demo)", tags: ["landhuis", "rijksmonument", "restauratie", "budget"], lesson: "Budgetkader vóór VO vastleggen voorkwam herontwerp; destructief onderzoek serre vooraf inplannen.", is_demo_data: true },
    { id: "K-4", project: "Portiekwoningen Zeeheldenkwartier (2024, demo)", tags: ["woonhuis", "gemeentelijk monument", "renovatie", "3d-scan"], lesson: "3D-scan reduceerde maatvoeringsvragen ± 40%; bewonerscommunicatie kritisch pad.", is_demo_data: true },
    { id: "K-5", project: "Hofje De Zeven Steegjes (2023, demo)", tags: ["hofje/ensemble", "rijksmonument", "verduurzaming", "subsidie"], lesson: "SIM-aanvraag op eerste indieningsdag; achterzetramen geaccepteerd door commissie i.p.v. vervanging.", is_demo_data: true }
  ],

  designPipeline: [
    "Bestand ontvangen en gescand op type",
    "Classificatie: tekening / scan / foto / brief",
    "Koppeling aan project",
    "Controle documentcompletheid",
    "Zichtbare projectinformatie geëxtraheerd",
    "Concept-ontwerpbrief voorbereid",
    "Moodboard-concepten gegenereerd (placeholder)",
    "Visuele richting interieur & exterieur voorbereid",
    "Wacht op menselijke architect-goedkeuring"
  ]
};

/* Node compatibility for data export & tests */
if (typeof module !== "undefined" && module.exports) { module.exports = { DB, TODAY }; }
if (typeof window !== "undefined") { window.DB = DB; window.TODAY = TODAY; }
