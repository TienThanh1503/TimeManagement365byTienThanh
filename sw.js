self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
  try {
    const data = event.data || {};
    if (data && data.type === 'showNotification') {
      const { title, body } = data;
      self.registration.showNotification(title, { body });
    }
  } catch (e) {
    console.error('SW message handler error', e);
  }
});

self.addEventListener('push', event => {
  let payload = { title: 'Nhắc', body: 'Bạn có công việc cần nhớ.' };
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {}
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body }));
});
