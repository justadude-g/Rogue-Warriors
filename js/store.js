/* Saves everything in this browser (IndexedDB), plus JSON backup export and import. */
(function () {
  const DB = 'rogue-warriors-cards', VER = 1, STORE = 'kv';
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, VER);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function get(key) {
    try {
      const d = await db();
      return await new Promise((res, rej) => { const q = d.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    } catch (e) { console.warn('store get failed', e); return undefined; }
  }
  async function put(key, val) {
    try {
      const d = await db();
      await new Promise((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(val, key); t.oncomplete = res; t.onerror = () => rej(t.error); });
    } catch (e) { console.warn('store put failed', e); }
  }
  const timers = {};
  function putLater(key, val, ms) { clearTimeout(timers[key]); timers[key] = setTimeout(() => put(key, val), ms || 400); }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  window.RWStore = { get, put, putLater, download };
})();
