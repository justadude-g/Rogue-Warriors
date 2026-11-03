/* Canvas renderer. Every position is in millimetres; render(card, dpi) returns a canvas at that resolution.
   Card sizes: team, operator, weapon and gear 63 x 88 mm (poker), campaign 127 x 89 mm. */
(function () {
  const SIZE = { team: [63, 88], operator: [63, 88], weapon: [63, 88], gear: [63, 88], vehicle: [63, 88], weather: [63, 88], weatherback: [63, 88], campaign: [127, 89] };
  const THEME = {
    team: { dark: '#4a3408', mid: '#b8862a', light: '#e2b84e', paper: '#fffaea', paper2: '#f3e6c2', ink: '#2a1f08' },
    operator: { dark: '#132c52', mid: '#2c5f9e', light: '#4f86cc', paper: '#f7fafd', paper2: '#dde8f4', ink: '#10223d' },
    weapon: { dark: '#4f100c', mid: '#a12f26', light: '#c9463b', paper: '#fffaf0', paper2: '#efe3c8', ink: '#2b0d0a' },
    gear: { dark: '#2c3816', mid: '#647a2c', light: '#8aa040', paper: '#fbfcef', paper2: '#e3e8c9', ink: '#1f2810' },
    vehicle: { dark: '#4a2e0c', mid: '#a56a26', light: '#d29a4c', paper: '#fdf8ee', paper2: '#efe0c0', ink: '#2a1a08' },
    campaign: { dark: '#132c52', mid: '#2c5f9e', light: '#4f86cc', paper: '#fbf8ef', paper2: '#ece4cc', ink: '#10223d' },
  };
  // Operator and campaign Warrior cards can print in black instead of blue (for example to go with black sleeves).
  const BLACK = {
    operator: { dark: '#0b0b0d', mid: '#3a3b40', light: '#6b6d74', paper: '#f7f7f8', paper2: '#e0e1e4', ink: '#141416' },
    campaign: { dark: '#0b0b0d', mid: '#3a3b40', light: '#6b6d74', paper: '#fbf8ef', paper2: '#ece4cc', ink: '#141416' },
  };
  let opColour = 'blue';
  const theme = (kind) => (opColour === 'black' && BLACK[kind] ? BLACK[kind] : THEME[kind]);

  // One colour scheme per environment so the decks can be told apart at a glance and shuffled separately.
  const WX = {
    arctic: { dark: '#12394f', mid: '#2f86b1', light: '#8fd0ee', paper: '#f4fafd', paper2: '#d3e8f2', ink: '#0c2735' },
    jungle: { dark: '#123b1c', mid: '#2f8a3e', light: '#7bc67f', paper: '#f4fbf2', paper2: '#d4e8cc', ink: '#0c2412' },
    desert: { dark: '#5a3208', mid: '#c27a1c', light: '#efc06a', paper: '#fff7e6', paper2: '#f1dcae', ink: '#3a2005' },
    urban: { dark: '#262c33', mid: '#6b7784', light: '#aab4bf', paper: '#f4f5f7', paper2: '#d4d9de', ink: '#171b20' },
    coastal: { dark: '#0b4a4f', mid: '#1c9aa0', light: '#76d6d6', paper: '#f0fbfa', paper2: '#c9e8e6', ink: '#062d30' },
    mountain: { dark: '#3d2a4f', mid: '#7b5ea0', light: '#b9a2d6', paper: '#f8f4fc', paper2: '#ddd2ea', ink: '#261a33' },
    underground: { dark: '#2d1d12', mid: '#7a4b2a', light: '#b58559', paper: '#faf3ec', paper2: '#e2cfba', ink: '#1c1209' },
    space: { dark: '#0d0f2e', mid: '#3a3fa8', light: '#7f86e6', paper: '#f1f1fc', paper2: '#d0d2ee', ink: '#0a0c22' },
  };
  const RED = '#a3261c';
  const F = { title: "'League Gothic', 'Oswald', sans-serif", num: "'Anton', 'Oswald', sans-serif", label: "'Oswald', sans-serif", body: "'PT Sans Narrow', 'Arial Narrow', sans-serif" };

  const imgCache = new Map();
  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imgCache.has(src)) return imgCache.get(src);
    const p = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    imgCache.set(src, p);
    return p;
  }
  let fontsReady = null;
  function fonts() {
    if (!fontsReady) {
      fontsReady = Promise.all(['24px "League Gothic"', '24px Anton', '24px Oswald', '600 24px Oswald', '24px "PT Sans Narrow"', 'bold 24px "PT Sans Narrow"']
        .map((f) => document.fonts.load(f).catch(() => null)));
    }
    return fontsReady;
  }

  // ---- drawing helpers (all in mm, scaled by k) ----
  function Ctx(ctx, k) {
    const X = {
      ctx, k,
      rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x * k, y * k, w * k, h * k, r * k); },
      rect(x, y, w, h, fill) { ctx.fillStyle = fill; ctx.fillRect(x * k, y * k, w * k, h * k); },
      grad(y1, y2, a, b) { const g = ctx.createLinearGradient(0, y1 * k, 0, y2 * k); g.addColorStop(0, a); g.addColorStop(1, b); return g; },
      font(size, fam, weight) { ctx.font = `${weight || ''} ${size * k}px ${fam}`; },
      text(s, x, y, size, fam, color, align, weight) { X.font(size, fam, weight); ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x * k, y * k); },
      width(s, size, fam, weight) { X.font(size, fam, weight); return ctx.measureText(s).width / k; },
      // Single line that shrinks to fit maxW. Returns the size used.
      fitLine(s, x, y, maxW, size, minSize, fam, color, align, weight) {
        let sz = size; while (sz > minSize && X.width(s, sz, fam, weight) > maxW) sz -= 0.1;
        X.font(sz, fam, weight);
        const w = ctx.measureText(s).width / k;
        ctx.save();
        if (w > maxW) { const sx = maxW / w; ctx.translate(x * k, y * k); ctx.scale(sx, 1); X.text(s, 0, 0, sz, fam, color, align, weight); }
        else X.text(s, x, y, sz, fam, color, align, weight);
        ctx.restore();
        return sz;
      },
      line(x1, y1, x2, y2, color, w, dash) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * k; if (dash) ctx.setLineDash(dash.map((d) => d * k)); ctx.beginPath(); ctx.moveTo(x1 * k, y1 * k); ctx.lineTo(x2 * k, y2 * k); ctx.stroke(); ctx.restore(); },
      stroke(color, w, dash) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w * k; if (dash) ctx.setLineDash(dash.map((d) => d * k)); ctx.stroke(); ctx.restore(); },
      fill(c) { ctx.fillStyle = c; ctx.fill(); },
    };
    return X;
  }

  // Paragraph layout: blocks = [{ runs: [{ t, bold, italic, color }], gap, label }]. Shrinks font until the text fits the box.
  function layout(X, blocks, w, size, lh) {
    const lines = []; // { y, items:[{t, x, bold, italic, color}] }
    let y = 0;
    for (const b of blocks) {
      if (b.gapBefore) y += b.gapBefore * size;
      let line = { items: [], x: 0 };
      const push = () => { lines.push({ y: y + size, items: line.items }); y += size * lh; line = { items: [], x: 0 }; };
      for (const r of b.runs) {
        const fam = F.body, weight = r.bold ? 'bold' : '', style = r.italic ? 'italic ' : '';
        const words = String(r.t).split(/(\s+)/).filter((s) => s.length);
        for (const word of words) {
          const isSpace = /^\s+$/.test(word);
          if (isSpace && line.x === 0) continue;
          X.font(size, fam, style + weight);
          const ww = X.ctx.measureText(word).width / X.k;
          if (!isSpace && line.x + ww > w && line.x > 0) {
            // drop trailing space
            if (line.items.length && /^\s+$/.test(line.items[line.items.length - 1].t)) { const sp = line.items.pop(); line.x -= sp.w; }
            push();
          }
          if (isSpace && line.x === 0) continue;
          line.items.push({ t: word, x: line.x, w: ww, bold: r.bold, italic: r.italic, color: r.color });
          line.x += ww;
        }
      }
      if (line.items.length) push();
    }
    return { lines, height: y };
  }
  function paragraphs(X, blocks, x, y, w, h, maxSize, minSize, ink) {
    let size = maxSize, lay;
    for (; size >= minSize; size -= 0.1) { lay = layout(X, blocks, w, size, 1.18); if (lay.height <= h) break; }
    if (size < minSize) { size = minSize; lay = layout(X, blocks, w, size, 1.18); }
    X.ctx.save();
    X.ctx.beginPath(); X.ctx.rect(x * X.k, y * X.k, w * X.k, h * X.k); X.ctx.clip();
    for (const ln of lay.lines) for (const it of ln.items) {
      X.text(it.t, x + it.x, y + ln.y - size * 0.2, size, F.body, it.color || ink, 'left', (it.italic ? 'italic ' : '') + (it.bold ? 'bold' : ''));
    }
    X.ctx.restore();
    return size;
  }

  function drawPicture(X, img, x, y, w, h, mode, fit) {
    if (!img) return;
    const ctx = X.ctx, k = X.k;
    const iw = img.naturalWidth || img.width || 512, ih = img.naturalHeight || img.height || 512;
    const z = fit && fit.zoom ? fit.zoom : 1;
    const sc = (mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih)) * z;
    const dw = iw * sc, dh = ih * sc;
    let ox = (fit && fit.x) || 0, oy = (fit && fit.y) || 0;
    if (mode === 'cover') {
      // keep the picture covering its frame: never drag past an edge
      const mx = Math.max(0, (dw - w) / 2) / w, my = Math.max(0, (dh - h) / 2) / h;
      ox = Math.max(-mx, Math.min(mx, ox)); oy = Math.max(-my, Math.min(my, oy));
    }
    ctx.save(); ctx.beginPath(); ctx.rect(x * k, y * k, w * k, h * k); ctx.clip();
    ctx.drawImage(img, (x + (w - dw) / 2 + ox * w) * k, (y + (h - dh) / 2 + oy * h) * k, dw * k, dh * k);
    ctx.restore();
  }

  function frame(X, T, W, H, border) {
    X.rect(0, 0, W, H, X.grad(0, H, T.light, T.dark));
    X.rr(border, border, W - 2 * border, H - 2 * border, 2); X.fill(X.grad(border, H, T.paper, T.paper2));
  }
  function header(X, T, W, border, h, title, size, minSize) {
    X.rect(border, border, W - 2 * border, h, X.grad(border, border + h, T.mid, T.dark));
    X.fitLine(String(title).toUpperCase(), W / 2, border + h * 0.8, W - 2 * border - 3, size, minSize, F.title, '#ffffff', 'center');
  }
  function chip(X, s, x, y, h, bg, fg, align) {
    const w = X.width(s, h * 0.62, F.label, '600') + h * 0.8;
    const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    X.rr(x0, y, w, h, h / 2); X.fill(bg);
    X.text(s, x0 + w / 2, y + h * 0.74, h * 0.62, F.label, fg, 'center', '600');
    return w;
  }
  const signed = (n) => (n > 0 ? '+' + n : '−' + Math.abs(n));
  function modChips(mods) {
    const out = [];
    if (mods.ma) out.push('MA ' + signed(mods.ma));
    if (mods.mdp) out.push('MDP ' + signed(mods.mdp));
    if (mods.hearts) out.push('HEARTS ' + signed(mods.hearts));
    if (mods.capacity) out.push('CAPACITY ' + signed(mods.capacity));
    return out;
  }
  function box(X, x, y, w, h, T, fill) { X.rr(x, y, w, h, 1); X.fill(fill || '#ffffff'); X.stroke(T.mid, 0.25); }
  function textBlocks(card, T, opts) {
    const blocks = [];
    if (card.perk) blocks.push({ runs: [card.perkName ? { t: card.perkName + ': ', bold: true } : null, { t: card.perk }].filter(Boolean) });
    if (opts && opts.drawback && card.drawback) blocks.push({ gapBefore: 0.35, runs: [{ t: card.drawback, italic: true, color: RED }] });
    return blocks;
  }

  // ---------------- type scale (mm) ----------------
  // One scale for every card so nothing looks out of place: labels and footers share a size,
  // perk and promotion text always share a size, and body text never drops below BODY_MIN.
  const LBL = 2.4, LBL_SM = 2.0, FOOT = 2.3, BODY_MAX = 3.1, BODY_MIN = 2.2;

  // Source of the card (book, faction) in the bottom right corner, so printed cards sort by book.
  function fromFooter(X, T, c, maxW) {
    if (c.fromLabel) X.fitLine(c.fromLabel.toUpperCase(), 59, 85.2, maxW || 50, FOOT, 1.7, F.label, T.mid, 'right', '600');
  }

  // Perk text on top, promotion anchored to the bottom of the box, both at the same size.
  function perkPromo(X, T, perkBlocks, promo, x, top, w, bottom, max, min, label) {
    const promoBlocks = promo ? [{ runs: [{ t: promo }] }] : [];
    const avail = bottom - top - 1.8, LH = 3.8;
    let size = max, hp, hq;
    for (; size >= min; size -= 0.05) {
      hp = layout(X, perkBlocks, w, size, 1.18).height;
      hq = promo ? layout(X, promoBlocks, w, size, 1.18).height + LH : 0;
      if (hp + hq + (promo ? 1.2 : 0) <= avail) break;
    }
    size = Math.max(size, min);
    if (promo) {
      hq = layout(X, promoBlocks, w, size, 1.18).height + LH;
      const py = Math.max(bottom - hq - 0.7, top + Math.min(hp, avail * 0.55) + 1.4);
      X.line(x - 1, py, x + w + 1, py, T.mid, 0.2, [0.6, 0.5]);
      X.text(label || 'PROMOTION', x, py + 3.1, LBL, F.label, RED, 'left', '600');
      X.rr(x + w - 2.8, py + 0.8, 2.8, 2.8, 0.4); X.stroke(RED, 0.25);
      paragraphs(X, promoBlocks, x, py + LH - 0.2, w, bottom - py - LH, size, size, T.ink);
      paragraphs(X, perkBlocks, x, top + 1.0, w, py - top - 1.4, size, size, T.ink);
    } else {
      paragraphs(X, perkBlocks, x, top + 1.0, w, avail, size, size, T.ink);
    }
    return size;
  }

  // ---------------- card types ----------------
  async function drawOperator(X, c) {
    const T = theme('operator'), W = 63, H = 88, b = 2.2;
    frame(X, T, W, H, b);
    header(X, T, W, b, 8.6, c.title, 7.2, 4.5);
    const [icon, pic] = await Promise.all([loadImage(c.icon), loadImage(c.image)]);
    box(X, 4, 12.6, 24.5, 25.2, T, '#ffffff');
    if (pic) drawPicture(X, pic, 4.2, 12.8, 24.1, 24.8, 'cover', c.imageFit); else drawPicture(X, icon, 5, 14.0, 22.5, 22.5, 'contain');
    if (pic && icon) drawPicture(X, icon, 22.2, 31.5, 6.3, 6.3, 'contain');
    const st = c.stats, cells = [['MOVE', st.ma + '"'], ['HITS ON', st.hits == null ? '–' : st.hits + '+'], ['MDP', st.mdp == null ? '–' : String(st.mdp)], ['HEARTS', String(st.hearts)]];
    cells.forEach(([lab, val], i) => {
      // the Hearts cell (bottom right) is 13.8 x 12.6 mm so a 12 mm die sits on it to track health
      const x = 30.3 + (i % 2) * 14.6, y = 12.6 + Math.floor(i / 2) * 12.6, hot = i === 3, bar = hot ? RED : T.dark;
      X.rr(x, y, 13.8, 12.6, 1); X.fill('#ffffff'); X.stroke(hot ? RED : T.mid, hot ? 0.4 : 0.25);
      X.rr(x, y, 13.8, 3.4, 1); X.fill(bar); X.rect(x, y + 2, 13.8, 1.4, bar);
      X.text(lab, x + 6.9, y + 2.65, LBL_SM, F.label, '#ffffff', 'center', '600');
      X.text(val, x + 6.9, y + 11.2, 6.0, F.num, T.ink, 'center');
    });
    X.text('NAME', 4, 41.9, LBL, F.label, T.mid, 'left', '600');
    X.line(12, 42.1, 59, 42.1, T.mid, 0.25);
    if (c.warriorName) X.fitLine(c.warriorName, 13, 41.5, 46, 3.8, 2.4, F.title, T.ink, 'left');
    const top = 44.0, bottom = c.sidearm ? 72.6 : 82.6;
    box(X, 4, top, 55, bottom - top, T, '#ffffff');
    perkPromo(X, T, textBlocks(c, T), c.promo, 5.6, top, 51.8, bottom, 3.5, BODY_MIN, c.bigGuy ? 'EXTRA RULES' : null);
    if (c.bigGuy) X.text('BIG GUY', 4, 85.2, FOOT, F.label, T.mid, 'left', '600');
    fromFooter(X, T, c, c.bigGuy ? 38 : 50);
    if (c.sidearm) {
      const s = c.sidearm, y = 74.0;
      X.rr(4, y, 55, 8.8, 1); X.fill(T.paper2); X.stroke(T.mid, 0.2);
      X.text('SIDEARM', 5.6, y + 3.4, LBL, F.label, T.mid, 'left', '600');
      X.fitLine(s.name, 18.4, y + 3.5, 39.2, 3.0, 2.3, F.body, T.ink, 'left', 'bold');
      const vals = [['RANGE', s.range], ['DICE', String(s.dice)], ['DMG', String(s.dmg)], ['AP', s.ap === '-' ? '–' : String(s.ap)]];
      vals.forEach(([lab, v], i) => {
        const x = 5.6 + i * 13.3;
        X.text(lab, x, y + 7.4, LBL_SM, F.label, T.mid, 'left', '600');
        X.text(v, x + X.width(lab, LBL_SM, F.label, '600') + 1.2, y + 7.6, 3.1, F.num, T.ink, 'left');
      });
    }
  }

  // Vehicle card: stats with a Hearts box for a 12 mm die, capacity and crew, the numbered notes, then Primary and Secondary weapons.
  async function drawVehicle(X, c) {
    const T = THEME.vehicle, W = 63, H = 88, b = 2.2;
    frame(X, T, W, H, b);
    header(X, T, W, b, 8.6, c.vehicleName || c.title, 7.2, 3.6);
    const [icon, pic] = await Promise.all([loadImage(c.icon), loadImage(c.image)]);
    box(X, 4, 12.6, 24.5, 25.2, T, '#ffffff');
    if (pic) drawPicture(X, pic, 4.2, 12.8, 24.1, 24.8, 'cover', c.imageFit); else drawPicture(X, icon, 5, 14.0, 22.5, 22.5, 'contain');
    const st = c.stats, sg = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');
    const cells = [['MOVE', st.ma + '"'], ['HITS ON', st.hits + '+'], ['ARMOUR', sg(st.armour)], ['HEARTS', String(st.hearts)]];
    cells.forEach(([lab, val], i) => {
      const x = 30.3 + (i % 2) * 14.6, y = 12.6 + Math.floor(i / 2) * 12.6, hot = i === 3, bar = hot ? RED : T.dark;
      X.rr(x, y, 13.8, 12.6, 1); X.fill('#ffffff'); X.stroke(hot ? RED : T.mid, hot ? 0.4 : 0.25);
      X.rr(x, y, 13.8, 3.4, 1); X.fill(bar); X.rect(x, y + 2, 13.8, 1.4, bar);
      X.text(lab, x + 6.9, y + 2.65, LBL_SM, F.label, '#ffffff', 'center', '600');
      X.text(val, x + 6.9, y + 11.2, 6.0, F.num, T.ink, 'center');
    });
    // strip: class, points value, capacity, crew
    const strip = [['CLASS', c.cls.toUpperCase(), 18.2], ['PV', String(c.pv), 10.2], ['CAP.', String(st.capacity), 12.0], ['CREW', st.crew ? 'Y' : 'N', 11.8]];
    let sx = 4;
    for (const [lab, val, w] of strip) {
      X.rr(sx, 39.2, w, 5.0, 0.9); X.fill('#ffffff'); X.stroke(T.mid, 0.25);
      X.text(lab, sx + 1.2, 42.5, LBL_SM - 0.1, F.label, T.mid, 'left', '600');
      const lw = X.width(lab, LBL_SM - 0.1, F.label, '600');
      X.fitLine(val, sx + w - 1.0, 43.1, w - lw - 3.0, 3.8, 2.4, F.num, T.ink, 'right');
      sx += w + 0.8;
    }
    const top = 45.6, bottom = 66.2;
    box(X, 4, top, 55, bottom - top, T, '#ffffff');
    const blocks = String(c.perk || '').split('\n').filter((l) => l.trim()).map((l, i) => ({ gapBefore: i ? 0.3 : 0, runs: [{ t: l }] }));
    paragraphs(X, blocks, 5.6, top + 0.8, 51.8, bottom - top - 1.4, 3.0, 2.0, T.ink);
    [0, 1].forEach((i) => {
      const w = c.weapons[i], y = 66.8 + i * 8.4;
      X.rr(4, y, 55, 8.0, 1); X.fill(T.paper2); X.stroke(T.mid, 0.2);
      X.text(i ? 'SECONDARY' : 'PRIMARY', 5.6, y + 3.1, LBL_SM, F.label, T.mid, 'left', '600');
      if (!w) { X.text('NONE', 22, y + 5.0, LBL, F.label, T.mid, 'left', '600'); return; }
      X.fitLine(w.name, 22, y + 3.3, 35.4, 3.0, 2.2, F.body, T.ink, 'left', 'bold');
      [['RANGE', w.range], ['DICE', String(w.dice)], ['DMG', String(w.dmg)], ['AP', w.ap === '-' ? '–' : String(w.ap)]].forEach(([lab, v], j) => {
        const x = [5.6, 25.0, 37.2, 47.8][j];
        X.text(lab, x, y + 6.9, LBL_SM - 0.2, F.label, T.mid, 'left', '600');
        X.text(v, x + X.width(lab, LBL_SM - 0.2, F.label, '600') + 1.0, y + 7.1, 3.0, F.num, T.ink, 'left');
      });
    });
    fromFooter(X, T, c);
  }

  async function drawTeam(X, c) {
    const T = THEME.team, W = 63, H = 88, b = 2.2;
    frame(X, T, W, H, b);
    header(X, T, W, b, 8.6, c.title, 7.2, 4.2);
    X.fitLine((c.fromLabel || c.setLabel).toUpperCase(), W / 2, 14.4, 55, LBL, 1.9, F.label, T.mid, 'center', '600');
    const [icon, pic] = await Promise.all([loadImage(c.icon), loadImage(c.image)]);
    if (pic) { box(X, 18.5, 16.2, 26, 26, T, '#ffffff'); drawPicture(X, pic, 18.7, 16.4, 25.6, 25.6, 'cover', c.imageFit); }
    else drawPicture(X, icon, 18, 15.8, 27, 27, 'contain');
    chip(X, c.mechLabel.toUpperCase(), W / 2, 43.6, 4.4, T.dark, '#ffffff', 'center');
    X.text('TEAM', 4, 52.4, LBL, F.label, T.mid, 'left', '600');
    X.line(12, 52.6, 59, 52.6, T.mid, 0.25);
    const top = 54.4, bottom = 78.4;
    box(X, 4, top, 55, bottom - top, T, '#ffffff');
    perkPromo(X, T, [{ runs: [{ t: 'Team perk: ', bold: true }, { t: c.perk }] }], c.promo, 5.6, top, 51.8, bottom, BODY_MAX, BODY_MIN);
    X.rr(4, 79.6, 25, 5.4, 1); X.fill(T.dark);
    X.text(`GEAR ${c.gearPoints} PTS`, 16.5, 83.4, 2.7, F.label, '#ffffff', 'center', '600');
    X.text(`TEAM OF ${c.teamSize}`, 31, 83.4, LBL, F.label, T.mid, 'left', '600');
  }

  // Weapon and gear cards are standard size and built to be tucked under the card above:
  // the top half (hidden in a stack) holds the picture, the bottom half (y 44-88) holds everything needed in play.
  async function topHalf(X, c, T, W) {
    const [icon, pic] = await Promise.all([loadImage(c.icon), loadImage(c.image)]);
    if (pic) { box(X, 4, 4, W - 8, 37.6, T, '#ffffff'); drawPicture(X, pic, 4.2, 4.2, W - 8.4, 37.2, 'cover', c.imageFit); }
    else drawPicture(X, icon, (W - 34) / 2, 5.6, 34, 34, 'contain');
    return icon;
  }
  function band(X, c, T, W, icon, rightPad) {
    X.rect(2.2, 44, W - 4.4, 8.4, X.grad(44, 52.4, T.mid, T.dark));
    if (icon) drawPicture(X, icon, 3.2, 44.4, 7.6, 7.6, 'contain');
    X.fitLine(String(c.title).toUpperCase(), 12, 50.9, W - 14.6 - (rightPad || 0), 6.4, 3.4, F.title, '#ffffff', 'left');
  }
  function chipsRow(X, list, y, right) {
    let x = right;
    for (const [t, bg] of list.slice().reverse()) { const w = chip(X, t, x, y, 3.6, bg, '#ffffff', 'right'); x -= w + 1; }
    return x;
  }

  async function drawWeapon(X, c) {
    const T = THEME.weapon, W = 63, H = 88, b = 2.2;
    frame(X, T, W, H, b);
    const icon = await topHalf(X, c, T, W);
    X.line(b, 43.2, W - b, 43.2, T.mid, 0.2, [1, 0.8]);
    band(X, c, T, W, icon);
    const chipsLeft = chipsRow(X, modChips(c.mods).map((m) => [m, RED]).concat(c.tags.map((t) => [t.toUpperCase(), T.dark])), 53.5, 59);
    X.fitLine(c.typeLabel.toUpperCase(), 4, 56.4, Math.max(14, chipsLeft - 5.5), LBL, 1.9, F.label, T.mid, 'left', '600');
    const cells = [['RANGE', c.range], ['DICE', String(c.dice)], ['DMG', String(c.dmg)], ['AP', String(c.ap)]];
    const cw = [16.6, 12, 12, 12], gx = 0.8;
    let x = 4;
    cells.forEach(([lab, val], i) => {
      X.rr(x, 58.0, cw[i], 8.0, 0.9); X.fill('#ffffff'); X.stroke(T.mid, 0.2);
      X.rect(x + 0.1, 58.1, cw[i] - 0.2, 2.9, T.dark);
      X.text(lab, x + cw[i] / 2, 60.3, LBL_SM, F.label, '#ffffff', 'center', '600');
      X.fitLine(val === '-' ? '–' : val, x + cw[i] / 2, 65.2, cw[i] - 1, 4.2, 2.8, F.num, T.ink, 'center');
      x += cw[i] + gx;
    });
    box(X, 4, 67.0, 55, 15.8, T, '#ffffff');
    paragraphs(X, textBlocks(c, T, { drawback: true }), 5.6, 67.8, 51.8, 14.6, BODY_MAX, BODY_MIN - 0.1, T.ink);
    X.text('WEAPON', 4, 85.2, FOOT, F.label, T.mid, 'left', '600');
    fromFooter(X, T, c, 38);
  }

  async function drawGear(X, c) {
    const T = THEME.gear, W = 63, H = 88, b = 2.2;
    frame(X, T, W, H, b);
    const icon = await topHalf(X, c, T, W);
    X.line(b, 43.2, W - b, 43.2, T.mid, 0.2, [1, 0.8]);
    band(X, c, T, W, icon, 10);
    X.ctx.beginPath(); X.ctx.arc((W - 7.2) * X.k, 48.2 * X.k, 3.8 * X.k, 0, Math.PI * 2); X.fill('#ffffff'); X.stroke(T.dark, 0.35);
    X.text(String(c.pts), W - 7.2, 49.3, 3.6, F.num, T.dark, 'center');
    X.text('PTS', W - 7.2, 51.2, 1.4, F.label, T.mid, 'center', '600');
    X.text('GEAR', 4, 56.4, LBL, F.label, T.mid, 'left', '600');
    chipsRow(X, modChips(c.mods).map((m) => [m, RED]), 53.5, 59);
    box(X, 4, 58, 55, 24.8, T, '#ffffff');
    paragraphs(X, [{ runs: [{ t: c.perk }] }], 5.6, 58.8, 51.8, 23.4, BODY_MAX, BODY_MIN - 0.1, T.ink);
    fromFooter(X, T, c);
  }

  // Weather card: environment name and colour on top, the result in the middle, the effect below.
  async function drawWeather(X, c) {
    const T = WX[c.env], W = 63, H = 88, b = 2.2;
    frame(X, T, W, H, b);
    const [icon, env] = await Promise.all([loadImage(c.icon), loadImage(c.envIcon)]);
    X.rect(b, b, W - 2 * b, 8.8, X.grad(b, b + 8.8, T.mid, T.dark));
    if (env) drawPicture(X, env, 3.0, 2.6, 8, 8, 'contain');
    X.fitLine(c.envName.toUpperCase(), 13, b + 6.8, W - 2 * b - 13 - 2, 7, 4, F.title, '#ffffff', 'left');
    X.fitLine('WEATHER', W - b - 2, b + 5.7, 18, LBL_SM, 1.6, F.label, T.light, 'right', '600');
    drawPicture(X, icon, 15, 13.6, 33, 33, 'contain');
    X.rect(b, 49.4, W - 2 * b, 9.6, X.grad(49.4, 59, T.mid, T.dark));
    X.fitLine(String(c.title).toUpperCase(), W / 2, 56.8, W - 2 * b - 5, 6.8, 3.2, F.title, '#ffffff', 'center');
    box(X, 4, 61.0, 55, 21.0, T, '#ffffff');
    const lines = String(c.perk || '').split('\n').filter(Boolean).map((t, i) => ({ gapBefore: i ? 0.3 : 0, runs: [{ t }] }));
    paragraphs(X, lines, 5.6, 61.8, 51.8, 19.6, 4.0, 2.3, T.ink);
    X.text('WEATHER TABLES', 4, 85.0, FOOT, F.label, T.mid, 'left', '600');
    X.text(c.ref.replace('Weather ', ''), W - 4, 85.0, FOOT, F.label, T.mid, 'right', '600');
  }

  // Card back, one design per environment: dark panel in the environment colour with its badge, so the face-down deck is recognisable.
  async function drawWeatherBack(X, c) {
    const T = WX[c.env], W = 63, H = 88, b = 2.2;
    frame(X, T, W, H, b);
    X.rr(5, 5, W - 10, H - 10, 2.2); X.fill(X.grad(5, H - 5, T.mid, T.dark));
    X.rr(6.6, 6.6, W - 13.2, H - 13.2, 1.4); X.stroke(T.light, 0.35);
    const icon = await loadImage(c.icon);
    X.ctx.beginPath(); X.ctx.arc(W / 2 * X.k, 36 * X.k, 21 * X.k, 0, Math.PI * 2); X.fill(T.paper); X.stroke(T.light, 0.6);
    drawPicture(X, icon, W / 2 - 17, 19, 34, 34, 'contain');
    X.fitLine(c.envName.toUpperCase(), W / 2, 68, W - 18, 11, 5, F.title, '#ffffff', 'center');
    X.line(18, 71.4, W - 18, 71.4, T.light, 0.3);
    X.text('WEATHER', W / 2, 77.2, 3.2, F.label, T.light, 'center', '600');
  }

  // Campaign Warrior card: one per Platoon member, landscape.
  async function drawCampaign(X, c) {
    const T = theme('campaign'), W = 127, H = 89, b = 2.2;
    frame(X, T, W, H, b);
    X.rect(b, b, W - 2 * b, 8.4, X.grad(b, b + 8.4, T.mid, T.dark));
    X.fitLine((c.name || '').toUpperCase() || ' ', 5, b + 6.7, 70, 6.6, 3.5, F.title, '#ffffff', 'left');
    X.fitLine(c.platoonLabel.toUpperCase(), W - 5, b + 5.9, 46, LBL, 1.9, F.label, '#dbe7f6', 'right', '600');
    const [icon, pic] = await Promise.all([loadImage(c.icon), loadImage(c.image)]);
    box(X, 4.5, 12.4, 33, 33, T, '#ffffff');
    if (pic) { drawPicture(X, pic, 4.7, 12.6, 32.6, 32.6, 'cover', c.imageFit); if (icon) drawPicture(X, icon, 29.5, 37.2, 8, 8, 'contain'); }
    else drawPicture(X, icon, 6, 13.9, 30, 30, 'contain');
    X.text('RANK', 4.5, 49.8, LBL, F.label, T.mid, 'left', '600');
    X.fitLine(c.rankName || 'Specialist', 4.5, 54.4, 33, 3.8, 2.6, F.title, T.ink, 'left');
    X.text('TYPE', 4.5, 59.0, LBL, F.label, T.mid, 'left', '600');
    X.fitLine(c.soldierLabel, 4.5, 63.2, 33, 3.6, 2.6, F.title, T.ink, 'left');
    const st = c.stats, cells = [['MOVE', st.ma + '"'], ['HITS ON', st.hits == null ? '–' : st.hits + '+'], ['MDP', st.mdp == null ? '–' : String(st.mdp)], ['HEARTS', String(st.hearts)]];
    cells.forEach(([lab, val], i) => {
      const x = 40.4 + i * 10.9, y = 12.4;
      X.rr(x, y, 10.2, 10.6, 0.9); X.fill('#ffffff'); X.stroke(T.mid, 0.25);
      X.rect(x + 0.1, y + 0.1, 10, 3.0, T.dark);
      X.text(lab, x + 5.1, y + 2.4, LBL_SM - 0.2, F.label, '#ffffff', 'center', '600');
      X.text(val, x + 5.1, y + 9.5, 5, F.num, T.ink, 'center');
    });
    box(X, 40.4, 24.4, 43, 39.2, T, '#ffffff');
    X.fitLine(c.specName.toUpperCase(), 42, 28.7, 40, 4.2, 2.6, F.title, T.dark, 'left');
    const promoBlocks = c.promo ? [{ gapBefore: 0.5, runs: [{ t: (c.promoUnlocked ? 'Promoted: ' : 'Promotion: '), bold: true, color: RED }, { t: c.promo }] }] : [];
    paragraphs(X, [{ runs: [c.perkName ? { t: c.perkName + ': ', bold: true } : null, { t: c.perk }].filter(Boolean) }].concat(promoBlocks), 42, 30.0, 40, 33, 2.9, 2.1, T.ink);
    box(X, 86.2, 12.4, 36.8, 51.2, T, '#ffffff');
    X.text('XP', 88, 16.2, LBL_SM, F.label, T.mid, 'left', '600');
    X.text('RANK & PERK', 95, 16.2, LBL_SM, F.label, T.mid, 'left', '600');
    const rows = c.ranks || [];
    const rh = 46.2 / Math.max(rows.length, 1);
    rows.forEach((r, i) => {
      const y = 17.2 + i * rh;
      if (i) X.line(87, y, 122.2, y, '#c9d4e2', 0.15);
      const got = c.xp >= r.xp;
      X.rr(87.8, y + 1.0, 2.6, 2.6, 0.3); X.fill(got ? T.mid : '#ffffff'); X.stroke(T.mid, 0.25);
      X.text(String(r.xp), 91.2, y + 3.3, 2.4, F.num, T.ink, 'left');
      X.fitLine(r.name, 96, y + 3.3, 26.4, 2.6, 2.0, F.body, T.ink, 'left', 'bold');
      if (r.perk) paragraphs(X, [{ runs: [{ t: r.perk }] }], 96, y + 3.7, 26.4, rh - 3.9, 2.1, 1.8, '#334');
    });
    X.text('XP', 4.5, 69.6, LBL, F.label, T.mid, 'left', '600');
    for (let i = 0; i < 30; i++) {
      const x = 10.5 + i * 3.75, y = 66.6;
      X.rr(x, y, 3.3, 3.3, 0.4); X.fill(c.xp >= (i + 1) * 10 ? T.mid : '#ffffff'); X.stroke(T.mid, 0.2);
      if ((i + 1) % 5 === 0) X.text(String((i + 1) * 10), x + 1.65, y + 5.7, LBL_SM - 0.1, F.label, T.mid, 'center');
    }
    const lines = (label, x, y, w, text) => {
      X.text(label, x, y, LBL, F.label, T.mid, 'left', '600');
      X.line(x, y + 4.4, x + w, y + 4.4, T.mid, 0.2); X.line(x, y + 8.8, x + w, y + 8.8, T.mid, 0.2);
      if (text) paragraphs(X, [{ runs: [{ t: text }] }], x, y + 0.8, w, 8.2, 2.9, 2.1, T.ink);
    };
    lines('BADGES', 4.5, 75.6, 56, c.badges);
    lines('INJURIES', 66.5, 75.6, 56, c.injuries);
  }

  const DRAW = { operator: drawOperator, team: drawTeam, weapon: drawWeapon, gear: drawGear, vehicle: drawVehicle, weather: drawWeather, weatherback: drawWeatherBack, campaign: drawCampaign };

  async function render(card, dpi) {
    await fonts();
    const [w, h] = SIZE[card.kind];
    const k = (dpi || 300) / 25.4;
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const X = Ctx(cv.getContext('2d'), k);
    await DRAW[card.kind](X, card);
    return cv;
  }

  window.RWRender = { render, SIZE, loadImage, setOperatorColour(c) { opColour = c === 'black' ? 'black' : 'blue'; } };
})();
