/* 麻醉TEE助手 Service Worker：同源静态资源缓存（cache-first），跨域 API 请求直连不缓存 */
var CACHE = "tee-assistant-v1";
var ASSETS = ["./", "./index.html", "./tee-assistant.html", "./manifest.webmanifest"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { return caches.delete(k); }
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) { return cached; }
      return fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200 && e.request.url.indexOf(self.location.origin) === 0) {
          var clone = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function () {
        return caches.match("./");
      });
    })
  );
});
