// พนักงานเฝ้าเวร "พี่พร้อม"
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png',
    badge: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// แจ้งเตือนแบบ Local (ใช้สำหรับนัดหมาย 15 นาที)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'NOTIFICATION') {
    const options = {
      body: event.data.body,
      icon: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png',
      vibrate: [200, 100, 200],
      tag: 'p-prompt-notif',
      renotify: true
    };
    self.registration.showNotification(event.data.title, options);
  }
});