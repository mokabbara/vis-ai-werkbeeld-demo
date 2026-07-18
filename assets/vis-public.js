/* Verified public VIS context. No operational, financial or staffing claims. */
(function (global) {
  "use strict";

  const SOURCE = {
    label: "VIS Architecten — publieke website",
    url: "https://visarchitecten.nl/",
    portfolioUrl: "https://visarchitecten.nl/portfolio/",
    retrieved: "2026-07-16",
    classification: "verified-public"
  };

  function project(name, location, type, summary, tags) {
    return { name, location, type, summary, tags, source: SOURCE.portfolioUrl, classification: "verified-public" };
  }

  const VIS_PUBLIC = {
    meta: {
      name: "VIS Architecten",
      proposition: "Hart voor erfgoed, oog voor de toekomst.",
      profile: "Architectenbureau voor erfgoed, restauratie, herbestemming en duurzame modernisering.",
      source: SOURCE
    },

    team: [
      { name: "Laurens Vis", role: "Architect en eigenaar" },
      { name: "Olivier Vis", role: "Projectcoördinator" },
      { name: "Remco Veldt", role: "Technisch ontwerper" },
      { name: "Richard Schwartzenberg", role: "Restauratiearchitect" },
      { name: "Gina van Huizen-Guravage", role: "Bouwkundige" },
      { name: "Lucas Tirion", role: "Technisch ontwerper" }
    ].map(person => ({ ...person, classification: "verified-public", source: "https://visarchitecten.nl/over-ons/" })),

    expertise: [
      "Monumenten en erfgoed",
      "Haalbaarheidsstudie en analyse",
      "Bouwhistorisch onderzoek en waardestelling",
      "3D-laserscannen en inmeten",
      "Restauratie en herstel",
      "Herbestemming en transformatie",
      "Verduurzaming en modernisering"
    ],

    projects: [
      project("Van der Oudermeulenlaan", "Wassenaar", "Restauratie en aanpassing", "Monumentaal landhuis uit 1927–1928, aangepast aan hedendaagse woonwensen met respect voor de oorspronkelijke architectuur.", ["landhuis", "restauratie", "wonen"]),
      project("Koornmarkt", "Delft", "Herbestemming", "Karakteristiek grachtenpand, van voormalig hotel naar twee woningen met behoud van het historische karakter.", ["grachtenpand", "herbestemming", "wonen"]),
      project("Parkweg / De Burcht", "Voorburg", "Bouwhistorisch onderzoek", "Historische analyse van monumentale dubbele woning De Burcht als basis voor een toekomstige transformatie.", ["onderzoek", "waardestelling", "wonen"]),
      project("Sint Jozefkerk", "Wassenaar", "Bouwhistorische verkenning", "Onderzoek voor herbestemming van een wederopbouwkerk met aandacht voor de Bossche School.", ["kerk", "onderzoek", "herbestemming"]),
      project("Van Eeghenstraat", "Amsterdam", "Bouwhistorisch onderzoek", "Onderzoek van een negentiende-eeuws herenhuis voor restauratie van een historische ontvangstkamer en modernisering van het achterhuis.", ["herenhuis", "onderzoek", "restauratie"]),
      project("Zuiderhofje", "Haarlem", "3D-laserscannen", "Nauwkeurige opname van een historisch hofje voor actuele plattegronden, gevels en doorsneden.", ["hofje", "3d-scan", "onderhoud"]),
      project("Victorialaan", "Wassenaar", "Uitbreiding", "Woninguitbreiding in landhuisstijl met extra leefruimte en een sterke relatie met de tuin.", ["wonen", "uitbreiding", "landhuis"]),
      project("Ministerie van Defensie, Kalvermarkt", "Den Haag", "Gevelrestauratie", "Gevelrestauratie ondersteund door 3D-laserscanning voor analyse, maatvoering en restauratieontwerp.", ["restauratie", "gevel", "3d-scan"]),
      project("Joodse Begraafplaats", "Wassenaar", "Onderhoud en subsidie", "Onderhoudsplan en subsidieaanvraag voor duurzame instandhouding van een groen monument uit 1906.", ["begraafplaats", "onderhoud", "subsidie"]),
      project("Het Nobelhuis", "Den Haag", "3D-laserscannen", "Volledige 3D-scan van een van de oudste huizen van Den Haag voor behoud, beheer en toekomstige ingrepen.", ["3d-scan", "monument", "onderzoek"]),
      project("Paviljoen Nimrod", "Hilversum", "Bouwhistorisch onderzoek", "Onderzoek naar de bouwgeschiedenis van het voormalige Nimrodpaviljoen uit 1901.", ["onderzoek", "paviljoen", "waardestelling"]),
      project("Herengracht", "Den Haag", "Bouwhistorisch onderzoek", "Verdiepend onderzoek voor herbestemming en restauratie van monumentale panden.", ["grachtenpand", "onderzoek", "herbestemming"]),
      project("Jachthuis Molenstein", "Driebergen-Rijsenburg", "Restauratie en uitbreiding", "Restauratie van een zestiende-eeuws jachthuis met een ingetogen uitbreiding voor comfortabel wonen.", ["landhuis", "restauratie", "uitbreiding"]),
      project("De Mesdag Collectie", "Den Haag", "Groot onderhoud", "Onderhoud aan het monumentale museum, waaronder gevels, funderingen en bouwkundige details.", ["museum", "onderhoud", "restauratie"]),
      project("Wormerveerse Vermaning", "Wormerveer", "Restauratie en herbestemming", "Transformatie van een doopsgezinde kerk uit 1831 tot cultureel centrum met behoud van identiteit.", ["kerk", "herbestemming", "cultuur"]),
      project("Boerderij De Eschpolder", "Rotterdam", "Restauratie en herbestemming", "Herbestemming van een boerderijcomplex voor dagopvang met herstel van oorspronkelijke onderdelen.", ["boerderij", "herbestemming", "zorg"]),
      project("Museum Paulina Bisdom van Vliet", "Haastrecht", "Restauratie", "Restauratie van dak, gevels en tuinmonument met zorgvuldige bescherming van het historische interieur.", ["museum", "restauratie", "interieur"]),
      project("Klokkentoren Oldeslo", "Den Haag", "Herstelplan", "Plan om de bronzen klokken van de toren weer veilig en passend te laten luiden.", ["toren", "herstel", "techniek"]),
      project("Tennispark Nieuw Marlot", "Den Haag", "Restauratie en herbestemming", "Restauratie van de oudste overdekte tennishal van Nederland, gecombineerd met hedendaagse sportfuncties.", ["sport", "restauratie", "herbestemming"]),
      project("Landhuis De Voorde", "Rijswijk", "Restauratieadvies", "Gebrekenoverzicht, kostenraming en verduurzamingsopties voor zorgvuldige herbestemming.", ["landhuis", "advies", "verduurzaming"]),
      project("Stolphoevekerk", "Volendam", "Onderzoek en 3D-scan", "3D-scan en bouwhistorisch onderzoek voor duurzame en toekomstbestendige herontwikkeling.", ["kerk", "3d-scan", "herbestemming"]),
      project("Spinozahuis", "Den Haag", "Onderzoek en onderhoud", "Bouwhistorisch onderzoek en onderhoud, inclusief reconstructie van de zeventiende-eeuwse plattegrond.", ["woonhuis", "onderzoek", "onderhoud"]),
      project("Johan de Witthuis", "Den Haag", "Restauratie en verduurzaming", "Gefaseerd programma voor een zeventiende-eeuws rijksmonument met onderzoek, herstel, isolatie en passende modernisering.", ["rijksmonument", "restauratie", "verduurzaming"]),
      project("Kniplaan", "Voorschoten", "Transformatie en uitbreiding", "Duurzame verbouwing van een monumentale boerderij voor toekomstbestendig wonen met behoud van historische lagen.", ["boerderij", "verduurzaming", "wonen"]),
      project("Monumentale boerderij", "Vleuten", "Restauratie en herbestemming", "Plan voor twee duurzame woningen in een langhuisboerderij met behoud van historische constructies.", ["boerderij", "herbestemming", "wonen"]),
      project("Stolpboerderij Berwout", "Egmond-Binnen", "Bouwhistorisch onderzoek", "Onderzoek als basis voor duurzame herbestemming van een stolpboerderij.", ["boerderij", "onderzoek", "herbestemming"]),
      project("Mauritshuis", "Den Haag", "Historische reconstructie", "Reconstructie van vier zeventiende-eeuwse schoorstenen die het historische silhouet herstellen en installaties verbergen.", ["museum", "reconstructie", "restauratie"]),
      project("Fruitmuur, Nieuw Marlot", "Den Haag", "Restauratie", "Zorgvuldig herstel van een zeventiende-eeuwse tuinmuur met maximaal behoud van historisch materiaal.", ["tuinmuur", "restauratie", "materiaal"]),
      project("Schouwweg Villa", "Wassenaar", "Transformatie", "Duurzame transformatie van een villa met subtiel geïntegreerd bijgebouw voor garage en gastenverblijf.", ["villa", "verduurzaming", "uitbreiding"]),
      project("Consistorie- en Kerkmeesterskamer", "Weesp", "Onderzoek en 3D-scan", "Bouwhistorisch onderzoek en 3D-laserscanning in de Laurenskerk als basis voor restauratie en herbestemming.", ["kerk", "onderzoek", "3d-scan"]),
      project("Residentie Australische Ambassadeur", "Den Haag", "Restauratiebegeleiding", "Restauratieplan en uitvoeringsbegeleiding met aandacht voor erfgoed, duurzaamheid en internationale afstemming.", ["residentie", "restauratie", "begeleiding"]),
      project("Keizersgracht / De Wildeman", "Amsterdam", "Onderzoek en restauratiebegeleiding", "Onderzoek en begeleiding van het achterhuis van een monumentaal grachtenpand.", ["grachtenpand", "onderzoek", "restauratie"]),
      project("Kerkehout", "Wassenaar", "Renovatie en verduurzaming", "Grootschalige renovatie van een tuindorp uit 1915 met behoud van de architectonische identiteit.", ["woningbouw", "renovatie", "verduurzaming"]),
      project("Schouwweg woning", "Wassenaar", "Renovatie en uitbreiding", "Hedendaagse uitbreiding en verduurzaming van een woning uit de jaren vijftig.", ["wonen", "uitbreiding", "verduurzaming"]),
      project("Hertelaan", "Wassenaar", "Onderzoek en vergunning", "Bouwhistorisch onderzoek en vergunningondersteuning voor gevelwijzigingen en verduurzaming.", ["onderzoek", "vergunning", "verduurzaming"]),
      project("Landhuis Roveré", "Wassenaar", "Renovatie", "Renovatie van een landhuis uit 1931 met 3D-scan, verduurzaming en stilistisch herstel.", ["landhuis", "renovatie", "3d-scan"]),
      project("Landhuis De Gijselaar", "Wassenaar", "Renovatie en uitbreiding", "Subtiele uitbreiding en renovatie van een landhuis met behoud van de monumentale stijl.", ["landhuis", "uitbreiding", "renovatie"]),
      project("Vrijzinnigen NPB", "Wassenaar", "Renovatie", "Duurzame renovatie van een achterzaal met een sterkere ruimtelijke relatie tot de kerkzaal.", ["kerk", "renovatie", "verduurzaming"]),
      project("Kerkstraat", "Wassenaar", "Onderzoek en renovatie", "Bouwhistorisch onderzoek gevolgd door een zorgvuldig renovatie- en uitbreidingsplan.", ["wonen", "onderzoek", "renovatie"]),
      project("Viottastraat 36", "Amsterdam", "Interieurrestauratie", "Restauratie van een zeldzaam Amsterdamse-Schoolinterieur met reconstructie op basis van historische foto's.", ["interieur", "restauratie", "reconstructie"]),
      project("Javastraat", "Den Haag", "Gevelrestauratie", "Begeleiding van gevelherstel, waaronder verwijdering van verflagen en reparatie van ornamenten.", ["gevel", "restauratie", "materiaal"]),
      project("VOC Pakhuis", "Hirado, Japan", "Onderzoek en reconstructie", "Langlopend onderzoek naar VOC-pakhuizen, leidend tot reconstructie in 2011.", ["internationaal", "onderzoek", "reconstructie"]),
      project("Doopsgezinde Kerk / Paleiskerk", "Den Haag", "Restauratie en herbestemming", "Transformatie van een kerk tot multifunctionele culturele en sociale locatie.", ["kerk", "herbestemming", "cultuur"]),
      project("Oude- of Pelgrimvaderskerk", "Delfshaven", "Gefaseerde restauratie", "Restauratie en duurzame multifunctionele aanpassing van kerk en bijgebouwen.", ["kerk", "restauratie", "verduurzaming"])
    ],

    agents: [
      {
        id: "portfolio", name: "VIS Portfolio & Kennisassistent", role: "Onderzoeks- en precedentassistent",
        purpose: "Vind relevante VIS-projecten, expertise en publieke precedenten met bronvermelding.",
        scope: "Publieke portfolio, diensten en bureauprofiel. Geen interne projectstatus, financiële of personele conclusies.",
        trigger: "Een medewerker zoekt precedent, ervaring of onderbouwde bureau-informatie.",
        inputs: "Vraag van gebruiker; geverifieerde publieke VIS-bronnen.", tools: "RAG/zoekindex; publieke website-snapshots.",
        actions: "Zoeken, vergelijken, samenvatten en bronverwijzingen tonen.", autonomy: "Advies; geen externe publicatie.",
        outputs: "Brongebonden antwoord, vergelijking, ontbrekende informatie.", guardrails: "Geen verzonnen projectfeiten, teams, resultaten of vertrouwelijke informatie.",
        human: "Een VIS-medewerker controleert elk extern te gebruiken antwoord.", kpis: "Bronnauwkeurigheid; zoektijd; bruikbaarheid; correct gemelde datagaten."
      },
      {
        id: "heritage", name: "Erfgoedproject-assistent", role: "Professionele voorbereidingsassistent",
        purpose: "Ondersteun onderzoek, haalbaarheid en projectvoorbereiding voor monumentale gebouwen.",
        scope: "Checklists, onderzoeksvragen en conceptanalyses. Geen formeel ontwerp-, vergunning- of compliancebesluit.",
        trigger: "Start of review van een erfgoed-, restauratie- of herbestemmingsvraag.",
        inputs: "Goedgekeurde projectstukken; VIS-kennis; actuele regelgeving.", tools: "Documentzoeking; regelgevingsbronnen; projectdossier.",
        actions: "Gaten signaleren, conceptchecklists en onderzoeksvragen voorbereiden.", autonomy: "Alleen aanbeveling.",
        outputs: "Conceptchecklist, aandachtspunten, bronlijst en onzekerheden.", guardrails: "Geen vervanging van bevoegde architect, adviseur of overheid.",
        human: "Restauratiearchitect of aangewezen projectverantwoordelijke valideert.", kpis: "Volledigheid; correctheid; tijdwinst; aantal tijdig gevonden datagaten."
      },
      {
        id: "project", name: "Projectinformatie-assistent", role: "Traceerbare projectbriefing-assistent",
        purpose: "Maak één actueel projectbeeld uit geautoriseerde interne bronnen.",
        scope: "Status, acties, mijlpalen, risico's en dossiers. In de huidige demo uitsluitend illustratieve scenario's.",
        trigger: "Een geautoriseerde gebruiker vraagt om projectstatus of briefing.",
        inputs: "Projectadministratie, planning, acties, documenten en communicatie.", tools: "Read-only connectors; RAG; business rules.",
        actions: "Samenvatten, afwijkingen signaleren en ontbrekende informatie benoemen.", autonomy: "Read-only; aanbeveling.",
        outputs: "Projectbriefing met bronnen, actualiteit, zekerheid en waarschuwingen.", guardrails: "Autorisatie bij ophalen; geen terugschrijven of extern verzenden.",
        human: "Projectverantwoordelijke corrigeert en keurt rapportage goed.", kpis: "Rapportagetijd; feitelijke juistheid; tijdige signalering; gebruikersacceptatie."
      },
      {
        id: "capacity", name: "Capaciteitsadvies-assistent", role: "Scenario- en planningsassistent",
        purpose: "Ondersteun capaciteitsplanning zonder mensen automatisch toe te wijzen of te beoordelen.",
        scope: "Vraagscenario's en knelpuntindicaties. Geen HR-beoordeling of autonome personeelsbeslissing.",
        trigger: "Nieuwe opdracht, planningswijziging of periodieke capaciteitsreview.",
        inputs: "Geverifieerde beschikbaarheid, rollen, planning en geaccordeerde projectvraag.", tools: "Capaciteitsengine; planningssysteem.",
        actions: "Scenario's berekenen en alternatieve startmomenten voorstellen.", autonomy: "Aanbeveling; menselijke goedkeuring verplicht.",
        outputs: "Scenario, aannames, knelpunten en alternatieven.", guardrails: "DPIA en transparantie; geen gebruik van gevoelige HR-indicatoren zonder grondslag.",
        human: "Directie/projectcoördinator besluit; medewerkergegevens worden gecontroleerd.", kpis: "Voorspelnauwkeurigheid; minder overbelasting; plantijd; aantal menselijke correcties."
      }
    ]
  };

  global.VIS_PUBLIC = VIS_PUBLIC;
  if (typeof module !== "undefined" && module.exports) module.exports = VIS_PUBLIC;
})(typeof window !== "undefined" ? window : globalThis);
