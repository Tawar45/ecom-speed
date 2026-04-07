(function () {
  if (window.__ecomSpeedExpertLoaded) return;
  window.__ecomSpeedExpertLoaded = true;

  var defaults = {
    hoverDelayMs: 65,
    touchCooldownMs: 1100,
    allowExternalLinks: false,
    allowQueryStrings: false,
    respectDataSaver: true
  };

  var config = Object.assign({}, defaults, window.EcomSpeedExpertConfig || {});
  var urlToPreload;
  var mouseoverTimer;
  var lastTouchTimestamp = 0;
  var prefetcher = document.createElement("link");
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var isSupported = prefetcher.relList && prefetcher.relList.supports && prefetcher.relList.supports("prefetch");
  var isDataSaverEnabled = connection && connection.saveData;
  var bodyDataset = document.body ? document.body.dataset : {};
  var bodyAllowQueryString = bodyDataset && Object.prototype.hasOwnProperty.call(bodyDataset, "instantAllowQueryString");
  var bodyAllowExternalLinks = bodyDataset && Object.prototype.hasOwnProperty.call(bodyDataset, "instantAllowExternalLinks");

  if (!isSupported) return;
  if (config.respectDataSaver && isDataSaverEnabled) return;

  prefetcher.rel = "prefetch";
  document.head.appendChild(prefetcher);

  document.addEventListener("touchstart", touchstartListener, { capture: true, passive: true });
  document.addEventListener("mouseover", mouseoverListener, { capture: true, passive: true });

  function touchstartListener(event) {
    var link = getLinkFromTarget(event.target);
    lastTouchTimestamp = performance.now();

    if (!isPreloadable(link)) return;

    link.addEventListener("touchcancel", touchendAndTouchcancelListener, { passive: true });
    link.addEventListener("touchend", touchendAndTouchcancelListener, { passive: true });
    urlToPreload = link.href;
    preload(link.href);
  }

  function touchendAndTouchcancelListener() {
    urlToPreload = undefined;
    stopPreloading();
  }

  function mouseoverListener(event) {
    var link;
    var touchCooldownMs = Number(config.touchCooldownMs);
    var hoverDelayMs = Number(config.hoverDelayMs);

    if (Number.isNaN(touchCooldownMs)) touchCooldownMs = defaults.touchCooldownMs;
    if (Number.isNaN(hoverDelayMs)) hoverDelayMs = defaults.hoverDelayMs;

    if (performance.now() - lastTouchTimestamp < touchCooldownMs) {
      return;
    }

    link = getLinkFromTarget(event.target);
    if (!isPreloadable(link)) return;

    if (mouseoverTimer) {
      window.clearTimeout(mouseoverTimer);
    }

    link.addEventListener("mouseout", mouseoutListener, { passive: true });
    urlToPreload = link.href;
    mouseoverTimer = window.setTimeout(function () {
      preload(link.href);
      mouseoverTimer = undefined;
    }, hoverDelayMs);
  }

  function mouseoutListener(event) {
    if (event.relatedTarget && getLinkFromTarget(event.target) === getLinkFromTarget(event.relatedTarget)) {
      return;
    }

    if (mouseoverTimer) {
      window.clearTimeout(mouseoverTimer);
      mouseoverTimer = undefined;
      return;
    }

    urlToPreload = undefined;
    stopPreloading();
  }

  function getLinkFromTarget(target) {
    if (!target || typeof target.closest !== "function") return null;
    return target.closest("a[href]");
  }

  function isPreloadable(link) {
    var url;
    var externalOk;
    var queryOk;

    if (!link || !link.href) return false;
    if (urlToPreload === link.href) return false;
    if (link.target === "_blank" || link.hasAttribute("download")) return false;
    if (link.hasAttribute("data-no-instant") || link.dataset.noInstant !== undefined) return false;

    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    externalOk =
      config.allowExternalLinks ||
      bodyAllowExternalLinks ||
      url.origin === window.location.origin ||
      link.hasAttribute("data-instant") ||
      link.dataset.instant !== undefined;
    if (!externalOk) return false;

    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.protocol === "http:" && window.location.protocol === "https:") return false;

    queryOk =
      config.allowQueryStrings ||
      bodyAllowQueryString ||
      !url.search ||
      link.hasAttribute("data-instant") ||
      link.dataset.instant !== undefined;
    if (!queryOk) return false;

    if (url.hash && url.pathname + url.search === window.location.pathname + window.location.search) {
      return false;
    }

    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }

    return true;
  }

  function preload(href) {
    prefetcher.href = href;
  }

  function stopPreloading() {
    prefetcher.removeAttribute("href");
  }
})();
