/* ClearPath history service (web).
 *
 * PRIVACY: stores ONLY the analysis result on this device (localStorage). It
 * never stores the original document text or image. Mirrors the Expo
 * historyService API so both clients behave the same.
 */
(function () {
  const KEY = 'cp_history';
  const MAX_ITEMS = 10;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return []; // corrupted storage — degrade gracefully
    }
  }

  function persist(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }

  function formatDate(d) {
    try {
      return d.toLocaleString(undefined, {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      }).replace(',', '').replace(/(\d) (\d)/, '$1 at $2');
    } catch {
      return d.toISOString();
    }
  }

  function saveAnalysis(result, inputType, language) {
    if (!result) return null;
    const now = new Date();
    const explanation = String(result.plain_explanation || '');
    const item = {
      id: String(now.getTime()) + '-' + Math.random().toString(36).slice(2, 7),
      document_type: result.document_type || 'Document',
      date_analyzed: formatDate(now),
      ts: now.getTime(),
      confidence: result.confidence || 'low',
      language: language || 'English',
      plain_explanation: explanation.slice(0, 120) + (explanation.length > 120 ? '…' : ''),
      full_result: result,
      input_type: inputType || 'paste',
      checkedSteps: {},
    };
    const items = load();
    items.unshift(item);
    persist(items.slice(0, MAX_ITEMS));
    return item;
  }

  function getHistory() { return load(); }

  function getHistoryItem(id) { return load().find((x) => x.id === id) || null; }

  function deleteHistoryItem(id) {
    persist(load().filter((x) => x.id !== id));
  }

  function clearAllHistory() {
    try { localStorage.removeItem(KEY); } catch {}
  }

  function setChecked(id, stepKey, checked) {
    const items = load();
    const item = items.find((x) => x.id === id);
    if (!item) return;
    item.checkedSteps = item.checkedSteps || {};
    item.checkedSteps[stepKey] = checked;
    persist(items);
  }

  // Cache a translated copy of an item's result, keyed by language display name,
  // so re-viewing it in that language later is instant and free.
  function setTranslation(id, langName, result) {
    if (!id || !langName || !result) return;
    const items = load();
    const item = items.find((x) => x.id === id);
    if (!item) return;
    item.translations = item.translations || {};
    item.translations[langName] = result;
    persist(items);
  }

  function count() { return load().length; }

  window.CP_History = {
    saveAnalysis, getHistory, getHistoryItem, deleteHistoryItem, clearAllHistory, setChecked, setTranslation, count,
  };
})();
