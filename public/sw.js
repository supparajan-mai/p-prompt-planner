// พนักงานเฝ้าเวร "พี่พร้อม" v2.1
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

// ฟังคำสั่งแจ้งเตือน
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NOTIFICATION') {
    const options = {
      body: event.data.body,
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxOTInIGhlaWdodD0nMTkyJyB2aWV3Qm94PScwIDAgMTkyIDE5Mic+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSdnJyB4MT0nMCcgeTE9JzAnIHgyPScxJyB5Mj0nMSc+PHN0b3Agb2Zmc2V0PScwJScgc3RvcC1jb2xvcj0nI2ZiOTIzYycvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nI2VhNTgwYycvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPScxOTInIGhlaWdodD0nMTkyJyByeD0nNDgnIGZpbGw9J3VybCgjZyknLz48ZyBmaWxsPSd3aGl0ZScgdHJhbnNmb3JtPSd0cmFuc2xhdGUoNDYsIDU2KSBzY2FsZSg0KSc+PHBhdGggZD0nTTE2IDIxdi0yYTQgNCAwIDAgMC00LTRINWE0IDQgMCAwIDAtNCA0djInLz48Y2lyY2xlIGN4PSc4LjUnIGN5PSc3JyByPSc0Jy8+PHBhdGggZD0nTTIyIDIxdi0yYTQgNCAwIDAgMC0zLTMuODcnLz48cGF0aCBkPSdNMTYgMy4xM2E0IDQgMCAwIDEgMCA3Ljc1Jy8+PC9nPjwvc3ZnPg==',
      vibrate: [200, 100, 200],
      badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc5NicgaGVpZ2h0PSc5Nicgdmlld0JveD0nMCAwIDk2IDk2Jz48Y2lyY2xlIGN4PSc0OCcgeT0nNDgnIHI9JzQwJyBmaWxsPScjZWE1ODBjJy8+PC9zdmc+',
      tag: 'p-prompt-notif',
      renotify: true
    };
    event.waitUntil(self.registration.showNotification(event.data.title, options));
  }
});