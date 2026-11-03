/* PDF print sheets with jsPDF. Cards are laid edge to edge so one cut separates two cards; crop marks sit in the margin.
   Standard cards (63 x 88) go nine to a portrait page, campaign cards (127 x 89) four to a landscape page. */
(function () {
  const PAPER = { letter: [215.9, 279.4], a4: [210, 297] };
  const MIN_MARGIN = 7;

  function grid(pw, ph, cw, ch) {
    const cols = Math.floor((pw - 2 * MIN_MARGIN) / cw), rows = Math.floor((ph - 2 * MIN_MARGIN) / ch);
    return { cols, rows, x0: (pw - cols * cw) / 2, y0: (ph - rows * ch) / 2 };
  }

  function cropMarks(pdf, g, cw, ch) {
    pdf.setDrawColor(90); pdf.setLineWidth(0.15);
    const L = 4, gap = 1;
    for (let c = 0; c <= g.cols; c++) {
      const x = g.x0 + c * cw;
      pdf.line(x, g.y0 - gap - L, x, g.y0 - gap);
      pdf.line(x, g.y0 + g.rows * ch + gap, x, g.y0 + g.rows * ch + gap + L);
    }
    for (let r = 0; r <= g.rows; r++) {
      const y = g.y0 + r * ch;
      pdf.line(g.x0 - gap - L, y, g.x0 - gap, y);
      pdf.line(g.x0 + g.cols * cw + gap, y, g.x0 + g.cols * cw + gap + L, y);
    }
  }

  // items: [{ card, copies }]. Returns the jsPDF document.
  async function build(items, opts, progress) {
    const { jsPDF } = window.jspdf;
    const paper = PAPER[opts.paper] || PAPER.letter;
    const dpi = opts.dpi || 300;
    const groups = [
      { kinds: ['team', 'operator', 'weapon', 'gear', 'vehicle'], size: [63, 88], orient: 'p' },
      { kinds: ['campaign'], size: [127, 89], orient: 'l' },
    ];
    const total = items.reduce((n, it) => n + (it.copies > 0 ? 1 : 0), 0);
    let done = 0, pdf = null;
    const cache = new Map();
    for (const gp of groups) {
      const list = [];
      for (const it of items) if (gp.kinds.includes(it.card.kind)) for (let i = 0; i < it.copies; i++) list.push(it.card);
      if (!list.length) continue;
      const [pw, ph] = gp.orient === 'l' ? [paper[1], paper[0]] : paper;
      const [cw, ch] = gp.size;
      const g = grid(pw, ph, cw, ch);
      const per = g.cols * g.rows;
      for (let i = 0; i < list.length; i++) {
        if (i % per === 0) {
          if (!pdf) pdf = new jsPDF({ unit: 'mm', format: [paper[0], paper[1]], orientation: gp.orient === 'l' ? 'landscape' : 'portrait', compress: true });
          else pdf.addPage([paper[0], paper[1]], gp.orient === 'l' ? 'landscape' : 'portrait');
          if (opts.crop !== false) cropMarks(pdf, g, cw, ch, Math.min(per, list.length - i));
        }
        const card = list[i];
        const key = card.key + '|' + (card.soldierType || '') + '|' + (card.name || '') + '|' + (card.vehicleName || '') + (card.kind === 'vehicle' ? '|' + JSON.stringify(card.stats) : '');
        if (!cache.has(key)) {
          const cv = await window.RWRender.render(card, dpi);
          cache.set(key, cv.toDataURL('image/jpeg', 0.92));
          done++; if (progress) progress(Math.min(done, total), total);
        }
        const n = i % per, x = g.x0 + (n % g.cols) * cw, y = g.y0 + Math.floor(n / g.cols) * ch;
        pdf.addImage(cache.get(key), 'JPEG', x, y, cw, ch, key, 'FAST');
      }
    }
    if (!pdf) throw new Error('Nothing to print: set at least one copy.');
    pdf.setProperties({ title: opts.title || 'Rogue Warriors cards', creator: 'Rogue Warriors Quartermaster' });
    return pdf;
  }

  async function save(items, opts, progress) {
    const pdf = await build(items, opts, progress);
    pdf.save((opts.filename || 'rogue-warriors-cards') + '.pdf');
  }

  // A one-page mission team sheet: roster, final stats and the cards to pull from the deck.
  function teamSheet(team, opts) {
    const { jsPDF } = window.jspdf;
    const paper = PAPER[opts.paper] || PAPER.letter;
    const pdf = new jsPDF({ unit: 'mm', format: paper });
    const W = paper[0];
    let y = 18;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.text(team.name || 'Mission Team', 15, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    y += 7; pdf.text(`${team.setLabel}  |  Expertise: ${team.expertise}  |  Gear ${team.gearUsed}/${team.gearBudget} pts`, 15, y);
    y += 9;
    const cols = [15, 21, 55, 87, 125, 168, 178, 188, 197];
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
    ['#', 'Name', 'Specialisation', 'Weapon', 'Gear', 'MA', 'Hits', 'MDP', 'Hearts'].forEach((h, i) => pdf.text(h, cols[i], y));
    pdf.setLineWidth(0.3); pdf.line(15, y + 2, W - 15, y + 2);
    pdf.setFont('helvetica', 'normal');
    team.rows.forEach((r, i) => {
      y += 9;
      const cells = [[String(i + 1), 5], [r.name || '-', 32], [r.spec, 30], [r.weapon || 'Pistol only', 36], [r.gear.join(', ') || '-', 40],
        [r.stats.ma + '"', 9], [r.stats.hits + '+', 9], [String(r.stats.mdp), 9], [String(r.stats.hearts), 9]];
      let lines = 1;
      cells.forEach(([t, w], c) => { const parts = pdf.splitTextToSize(t, w); lines = Math.max(lines, parts.length); pdf.text(parts, cols[c], y); });
      y += (lines - 1) * 4;
      pdf.setDrawColor(200); pdf.line(15, y + 3, W - 15, y + 3);
    });
    if (team.vehicles && team.vehicles.length) {
      y += 12;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text(`Vehicles (${team.vpv} PV)`, 15, y);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
      team.vehicles.forEach((v) => {
        const st = v.stats, line = `${v.name}${v.name !== v.cls ? ' (' + v.cls + ')' : ''}  |  Move ${st.ma}"  Hits on ${st.hits}+  Hearts ${st.hearts}  Armour ${st.armour > 0 ? '+' : ''}${st.armour}  Capacity ${st.capacity}  Crew ${st.crew ? 'Y' : 'N'}`;
        y += 6; pdf.setFont('helvetica', 'bold'); pdf.text(pdf.splitTextToSize(line, W - 30), 18, y); pdf.setFont('helvetica', 'normal');
        const extra = [v.weapons.join(' + '), v.gear.length ? 'Gear: ' + v.gear.join(', ') : ''].filter(Boolean).join('  |  ');
        if (extra) { y += 4.5; pdf.text(pdf.splitTextToSize(extra, W - 36), 22, y); }
      });
    }
    y += 12;
    if (team.warnings.length) {
      pdf.setFont('helvetica', 'bold'); pdf.text('Check', 15, y); pdf.setFont('helvetica', 'normal');
      team.warnings.forEach((w) => { y += 5.5; pdf.text('- ' + w, 18, y); });
      y += 8;
    }
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('Cards to pull from your deck', 15, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
    for (const [label, list] of team.pull) {
      y += 6; pdf.setFont('helvetica', 'bold'); pdf.text(label, 18, y); pdf.setFont('helvetica', 'normal');
      const t = pdf.splitTextToSize(list.join(', '), W - 60); pdf.text(t, 45, y); y += (t.length - 1) * 4.5;
    }
    pdf.save((opts.filename || 'mission-team') + '.pdf');
  }

  window.RWPrint = { build, save, teamSheet, PAPER };
})();
