(function () {
  if (window.__ecomSpeedExpertLoaded) return;
  window.__ecomSpeedExpertLoaded = true;

  var defaults = {
    hoverDelayMs: 65,
    prefetchOnHover: true,
    prefetchOnTouch: true,
    sameOriginOnly: true,
    ignoreSlowConnections: true
  };

  var config = Object.assign({}, defaults, window.EcomSpeedExpertConfig || {});
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var prefetched = new Set();
  var hoverTimer = null;
  var activeLink = null;

  function shouldSkipForConnection() {
    if (!config.ignoreSlowConnections || !connection) return false;
    if (connection.saveData) return true;

    var effectiveType = connection.effectiveType || "";
    return effectiveType.indexOf("2g") !== -1 || effectiveType === "slow-2g";
  }

  function isHtmlLikePath(pathname) {
    return !/\.(zip|xml|json|jpg|jpeg|png|gif|webp|svg|pdf|mp4|mp3|woff2?|ttf|eot)$/i.test(pathname);
  }

  function getEligibleLink(target) {
    if (!target || typeof target.closest !== "function") return null;

    var link = target.closest("a[href]");
    if (!link) return null;
    if (link.target === "_blank" || link.hasAttribute("download")) return null;
    if (link.dataset.noPrefetch === "true") return null;

    var href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
      return null;
    }

    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return null;
    }

    if (config.sameOriginOnly && url.origin !== window.location.origin) return null;
    if (url.origin !== window.location.origin) return null;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
    if (!isHtmlLikePath(url.pathname)) return null;

    return url;
  }

  function prefetchUrl(url) {
    var key = url.toString();
    if (prefetched.has(key) || shouldSkipForConnection()) return;

    prefetched.add(key);

    var link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = key;

    document.head.appendChild(link);
  }

  function clearHoverTimer() {
    if (hoverTimer !== null) {
      window.clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    activeLink = null;
  }

  document.addEventListener(
    "pointerenter",
    function (event) {
      if (!config.prefetchOnHover) return;

      var url = getEligibleLink(event.target);
      if (!url) return;

      clearHoverTimer();
      activeLink = url.toString();
      hoverTimer = window.setTimeout(function () {
        if (activeLink === url.toString()) {
          prefetchUrl(url);
        }
      }, Number(config.hoverDelayMs) || defaults.hoverDelayMs);
    },
    true
  );

  document.addEventListener(
    "pointerleave",
    function (event) {
      if (!activeLink) return;

      var url = getEligibleLink(event.target);
      if (!url || url.toString() === activeLink) {
        clearHoverTimer();
      }
    },
    true
  );

  document.addEventListener(
    "focusin",
    function (event) {
      if (!config.prefetchOnHover) return;

      var url = getEligibleLink(event.target);
      if (url) prefetchUrl(url);
    },
    true
  );

  document.addEventListener(
    "touchstart",
    function (event) {
      if (!config.prefetchOnTouch) return;

      var url = getEligibleLink(event.target);
      if (url) prefetchUrl(url);
    },
    { capture: true, passive: true }
  );
})();
