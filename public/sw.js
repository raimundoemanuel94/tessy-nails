// Nailit Service Worker — cache-first para assets, network-first para API
const CACHE_NAME = 'nailit-v1';
const STATIC_CACHE = 'nailit-static-v1';

// Assets estáticos que devem ser cacheados
// Só assets verdadeiramente estáticos — rotas autenticadas retornam 302 e não podem ser pré-cacheadas
const PRECACHE_URLS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
];

// Instala e pré-cacheia assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silencia erros de pré-cache individuais
      });
    })
    // Não chama skipWaiting() aqui — espera o usuário confirmar o update
    // para evitar inconsistências entre SW novo e assets antigos em cache
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Recebe mensagem do cliente para forçar update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estratégia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições non-GET, extensões do browser e cross-origin
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase')) return;

  // API routes e Supabase → sempre network, sem cache
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.com') ||
    url.pathname.startsWith('/auth/')
  ) {
    event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // Assets estáticos (_next/static) → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Ícones e imagens → cache-first com fallback
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
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Páginas do app → stale-while-revalidate
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
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);
          // Retorna cache imediatamente se disponível, atualiza em background
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Default: network com fallback para cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
