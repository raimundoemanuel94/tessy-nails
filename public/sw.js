// Nailit Service Worker v2
// Bump CACHE_VERSION a cada deploy relevante para forçar limpeza de cache
const CACHE_VERSION = 'v2';
const CACHE_NAME = `nailit-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `nailit-static-${CACHE_VERSION}`;
const ALL_CACHES = [CACHE_NAME, STATIC_CACHE];

const PRECACHE_URLS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
];

// Instala e pré-cacheia assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => {
        // Se não há SW anterior (primeira instalação), ativa imediatamente
        // Se há SW anterior, aguarda mensagem SKIP_WAITING do usuário
        return self.clients.matchAll().then((clients) => {
          if (clients.length === 0) self.skipWaiting();
        });
      })
  );
});

// Ativa, limpa caches de versões anteriores e assume controle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Usuário confirmou o update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Estratégias de fetch ──────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só GET e mesmo origin (+ Supabase)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase')) return;

  // API, Supabase, auth → network-only
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.com') ||
    url.pathname.startsWith('/auth/')
  ) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Rotas de auth e admin → network-only com fallback HTML
  if (
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/setup') ||
    url.pathname.startsWith('/admin')
  ) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          '<html><head><meta name="viewport" content="width=device-width"></head><body style="font-family:sans-serif;background:#080812;color:#f0f0ff;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center;padding:24px"><p style="font-size:32px;margin-bottom:12px">💅</p><h2 style="margin:0 0 8px">Sem conexão</h2><p style="color:#8d86a8;font-size:14px;margin:0">Verifique sua internet e tente novamente</p></div></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      )
    );
    return;
  }

  // Assets do Next.js (_next/static) → cache-first imutável
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(STATIC_CACHE).then((c) => c.put(request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // Ícones e imagens → cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(STATIC_CACHE).then((c) => c.put(request, response.clone()));
          }
          return response;
        }).catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Páginas do app → network-first com fallback cache
  // (não stale-while-revalidate para que o HTML novo seja sempre buscado)
  if (
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/agenda') ||
    url.pathname.startsWith('/clientes') ||
    url.pathname.startsWith('/servicos') ||
    url.pathname.startsWith('/disponibilidade') ||
    url.pathname.startsWith('/configuracoes') ||
    url.pathname.startsWith('/relatorios') ||
    url.pathname.startsWith('/vitrine')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((c) => {
              c.put(request, response.clone());
              trimCache(c, 30);
            });
          }
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || offlinePage()))
    );
    return;
  }

  // Default: network com fallback cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((r) => r || new Response('', { status: 503 })))
  );
});

function offlinePage() {
  return new Response(
    '<html><head><meta name="viewport" content="width=device-width"></head><body style="font-family:sans-serif;background:#080812;color:#f0f0ff;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center;padding:24px"><p style="font-size:32px;margin-bottom:12px">💅</p><h2 style="margin:0 0 8px">Você está offline</h2><p style="color:#8d86a8;font-size:14px;margin:0 0 20px">Reconecte para ver os dados mais recentes</p><button onclick="location.reload()" style="padding:10px 24px;border-radius:12px;border:none;background:#7C5CBF;color:#fff;font-size:14px;font-weight:700;cursor:pointer">Tentar novamente</button></div></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
  }
}
