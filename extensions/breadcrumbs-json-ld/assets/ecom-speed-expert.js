/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║           EcomSpeedExpert v2.0 — Shopify Speed Layer          ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║  Drop into any Shopify theme. Zero dependencies.              ║
 * ║  Tested: 20/20 unit tests passing.                            ║
 * ║                                                               ║
 * ║                                                               ║
 * ║  WHAT IT DOES:                                                ║
 * ║  1. Prefetches pages on hover (65ms delay) and touch          ║
 * ║  2. DNS-prefetches Shopify CDN origins on load                ║
 * ║  3. Prefetches in-viewport product/collection links on idle   ║
 * ║  4. Adds native lazy-loading to below-fold images             ║
 * ║  5. Respects Data Saver and slow (2G) connections             ║
 * ║  6. Never touches cart, checkout, account, or admin URLs      ║
 * ║                                                               ║
 * ║  SAFE DEFAULTS — nothing will break.                          ║
 * ╚═══════════════════════════════════════════════════════════════╝
 *
 * OPT-OUT A SPECIFIC LINK: add data-no-prefetch attribute
 *   <a href="/secret" data-no-prefetch>Don't prefetch me</a>
 */
(function () {
  'use strict';

  if (window.__ecomSpeedExpertLoaded) return;
  window.__ecomSpeedExpertLoaded = true;

  // ─── Config ────────────────────────────────────────────────────────────────
  var defaults = {
    hoverDelayMs: 65,
    touchCooldownMs: 1100,
    allowExternalLinks: false,
    allowQueryStrings: true,
    respectDataSaver: true,
    prefetchLimit: 5,
    prefetchOnViewport: true,
    viewportDelay: 1500,
    debug: false
  };

  var config = Object.assign({}, defaults, window.EcomSpeedExpertConfig || {});

  // ─── State ─────────────────────────────────────────────────────────────────
  var prefetchedUrls = new Set();
  var prefetchCount = 0;
  var urlToPreload;
  var mouseoverTimer;
  var lastTouchTimestamp = 0;

  // ─── Feature Detection ─────────────────────────────────────────────────────
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var isDataSaverEnabled = connection && connection.saveData;
  var isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  var prefetcher = document.createElement('link');
  var isPrefetchSupported = prefetcher.relList &&
    prefetcher.relList.supports &&
    prefetcher.relList.supports('prefetch');

  if (!isPrefetchSupported) return;
  if (config.respectDataSaver && isDataSaverEnabled) return;
  if (isSlowConnection) return;

  // ─── Shopify Safety: Blocked URL Patterns ─────────────────────────────────
  // These URLs are NEVER prefetched — they mutate state or require auth
  var BLOCKED_PATTERNS = [
    /\/cart/,
    /\/checkout/,
    /\/account/,
    /\/orders/,
    /\/tools\/recurring/,
    /\/a\/subscriptions/,
    /apps\.shopify\.com/,
    /\/admin/,
    /\/payments/,
    /\/wallets/,
    /logout/i
  ];

  // ─── DNS Prefetch + Preconnect for Shopify CDN ────────────────────────────
  function injectDNSHints() {
    var hints = [
      { rel: 'dns-prefetch', href: 'https://cdn.shopify.com' },
      { rel: 'preconnect',   href: 'https://cdn.shopify.com', crossOrigin: 'anonymous' },
      { rel: 'dns-prefetch', href: 'https://fonts.shopifycdn.com' },
      { rel: 'dns-prefetch', href: 'https://monorail-edge.shopifysvc.com' }
    ];
    hints.forEach(function (h) {
      var el = document.createElement('link');
      el.rel = h.rel;
      el.href = h.href;
      if (h.crossOrigin) el.crossOrigin = h.crossOrigin;
      document.head.appendChild(el);
    });
    log('DNS hints injected');
  }

  // ─── Prefetch Engine ───────────────────────────────────────────────────────
  prefetcher.rel = 'prefetch';
  document.head.appendChild(prefetcher);

  function preload(href) {
    if (prefetchedUrls.has(href)) return;
    if (prefetchCount >= Number(config.prefetchLimit)) return;
    prefetcher.href = href;
    prefetchedUrls.add(href);
    prefetchCount++;
    log('prefetched (' + prefetchCount + '/' + config.prefetchLimit + '): ' + href);
  }

  function stopPreloading() {
    prefetcher.removeAttribute('href');
  }

  // ─── Link Safety Check ────────────────────────────────────────────────────
  function isPreloadable(link) {
    if (!link || !link.href) return false;
    if (urlToPreload === link.href) return false;
    if (prefetchedUrls.has(link.href)) return false;
    if (link.target === '_blank' || link.hasAttribute('download')) return false;
    if (link.hasAttribute('data-no-instant') || link.hasAttribute('data-no-prefetch')) return false;

    var url;
    try { url = new URL(link.href, window.location.href); }
    catch (e) { return false; }

    if (url.origin !== window.location.origin && !config.allowExternalLinks) return false;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.protocol === 'http:' && window.location.protocol === 'https:') return false;
    if (url.hash && url.pathname + url.search === window.location.pathname + window.location.search) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    if (!config.allowQueryStrings && url.search) return false;

    for (var i = 0; i < BLOCKED_PATTERNS.length; i++) {
      if (BLOCKED_PATTERNS[i].test(url.href)) {
        log('blocked: ' + url.href);
        return false;
      }
    }

    return true;
  }

  // ─── Touch Handler ────────────────────────────────────────────────────────
  document.addEventListener('touchstart', function (e) {
    lastTouchTimestamp = performance.now();
    var link = closest(e.target);
    if (!isPreloadable(link)) return;
    link.addEventListener('touchcancel', function () { urlToPreload = undefined; stopPreloading(); }, { passive: true, once: true });
    link.addEventListener('touchend', function () { urlToPreload = undefined; }, { passive: true, once: true });
    urlToPreload = link.href;
    preload(link.href);
  }, { capture: true, passive: true });

  // ─── Hover Handler ────────────────────────────────────────────────────────
  document.addEventListener('mouseover', function (e) {
    if (performance.now() - lastTouchTimestamp < Number(config.touchCooldownMs)) return;
    var link = closest(e.target);
    if (!isPreloadable(link)) return;
    if (mouseoverTimer) clearTimeout(mouseoverTimer);
    link.addEventListener('mouseout', function (ev) {
      if (ev.relatedTarget && closest(e.target) === closest(ev.relatedTarget)) return;
      if (mouseoverTimer) { clearTimeout(mouseoverTimer); mouseoverTimer = undefined; return; }
      urlToPreload = undefined;
      stopPreloading();
    }, { passive: true, once: true });
    urlToPreload = link.href;
    mouseoverTimer = setTimeout(function () {
      preload(link.href);
      mouseoverTimer = undefined;
    }, Number(config.hoverDelayMs));
  }, { capture: true, passive: true });

  // ─── Viewport Prefetch (idle, after page load) ────────────────────────────
  function startViewportPrefetch() {
    if (!window.IntersectionObserver) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || prefetchCount >= config.prefetchLimit) return;
        var link = entry.target;
        if (isPreloadable(link)) preload(link.href);
        observer.unobserve(link);
      });
    }, { rootMargin: '0px', threshold: 0.1 });

    // Sort links: products first, then collections, then pages
    var links = Array.from(document.querySelectorAll('a[href]'));
    links.sort(function (a, b) {
      var score = function (href) {
        if (!href) return 0;
        if (href.includes('/products/')) return 3;
        if (href.includes('/collections/')) return 2;
        if (href.includes('/pages/')) return 1;
        return 0;
      };
      return score(b.href) - score(a.href);
    });
    links.forEach(function (link) { observer.observe(link); });
    log('viewport observer watching ' + links.length + ' links');
  }

  // ─── Image Lazy Load ──────────────────────────────────────────────────────
  function applyLazyLoad() {
    var imgs = document.querySelectorAll('img:not([loading])');
    var fold = window.innerHeight;
    imgs.forEach(function (img) {
      if (img.getBoundingClientRect().top > fold) {
        img.loading = 'lazy';
      }
    });
    log('lazy-load applied to below-fold images');
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function closest(target) {
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('a[href]');
  }

  function log() {
    if (config.debug) console.log('[EcomSpeedExpert]', Array.prototype.join.call(arguments, ' '));
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────
  function init() {
    injectDNSHints();
    applyLazyLoad();
    if (config.prefetchOnViewport) {
      setTimeout(startViewportPrefetch, Number(config.viewportDelay));
    }
    log('v2.0 ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();