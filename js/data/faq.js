/* Rogue Warriors FAQ and Errata (21 June 2024, 3 pages): topics and page numbers only.
   The rulings themselves are rules wording, so they live in js/data/private/rules-text.js under "faq:<id>" and show in the private build only.
   Rogue Warriors (c) Lee Fox-Smith & Nicholas Fox-Smith, Tabletop Skirmish Games. Used with permission. */
(function () {
  window.RW_FAQ = {
    title: 'Rogue Warriors FAQ and Errata',
    date: '21 June 2024',
    pages: 3,
    items: [
      { id: 'pickup', kind: 'FAQ', page: 1, topic: 'Pick Up with objective markers: when the free action happens', see: 'core:16', index: 'Pick Up' },
      { id: 'fire-support', kind: 'FAQ', page: 1, topic: 'Fire Support: can the Specialist use Cover Me on themselves', see: 'core:9', index: 'Fire Support' },
      { id: 'rope', kind: 'FAQ', page: 1, topic: 'Rope: climbing buildings, and ropes, ladders and pipes placed on terrain', see: 'core:10', index: 'Rope' },
      { id: 'uw-p13', kind: 'Errata', page: 2, topic: 'Ungentlemanly Warriors p. 13: replacement for the last two paragraphs, Enemy Warrior Team is on p. 49', see: 'uw:13', index: 'Solo FAQs' },
      { id: 'uw-activation', kind: 'Errata', page: 2, topic: 'Ungentlemanly Warriors pp. 10 and 49: Enemy Warrior to Activate table, results 4, 5 and 6', see: 'uw:10', index: 'Enemy Activation Tables' },
      { id: 'solo-watch', kind: 'Solo note', page: 3, topic: 'Watch Commander: moving around and through buildings and obstacles', see: 'uw:11', index: 'Sentry Cards' },
      { id: 'solo-overwatch', kind: 'Solo note', page: 3, topic: 'Overwatch: what Curious does on the ground and on a terrain feature', see: 'uw:11', index: 'Sentry Cards' },
      { id: 'solo-patrol', kind: 'Solo note', page: 3, topic: 'Caretaker, Perimeter and Guard: Curious and returning to the Patrol Path', see: 'uw:11', index: 'Sentry Cards' },
      { id: 'solo-escort', kind: 'Solo note', page: 3, topic: 'Watch Commander with an Enemy Enlisted: Sentry Phase against Alarm Phase', see: 'uw:11', index: 'Sentry Cards' },
      { id: 'solo-edge', kind: 'Solo note', page: 3, topic: 'Sentry reaching the board edge mid-move', see: 'uw:10', index: 'Sentry Phase' },
    ],
  };
})();
