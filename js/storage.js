(function () {
  "use strict";

  const prefix = "gamehub_";
  const maxCookieValueLength = 3400;

  function cookieName(key) {
    return prefix + key.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function readCookie(key) {
    const name = cookieName(key) + "=";
    const item = document.cookie.split(";").map(function (cookie) { return cookie.trim(); })
      .find(function (cookie) { return cookie.indexOf(name) === 0; });
    return item ? decodeURIComponent(item.slice(name.length)) : null;
  }

  function notify(message) {
    window.dispatchEvent(new CustomEvent("gamehub:storageerror", { detail: { message: message } }));
  }

  function get(key) {
    try {
      const cookieValue = readCookie(key);
      if (cookieValue !== null) return cookieValue;
      return window.localStorage.getItem(key);
    } catch (error) {
      notify(error.message);
      return null;
    }
  }

  function set(key, value) {
    const serialized = String(value);
    try {
      window.localStorage.setItem(key, serialized);
      try {
        document.cookie = cookieName(key) + "=; path=/; max-age=0; SameSite=Lax";
      } catch (cookieError) {
        notify(cookieError.message);
      }
      return "localStorage";
    } catch (localStorageError) {
      try {
        const encoded = encodeURIComponent(serialized);
        if (encoded.length > maxCookieValueLength) {
          throw new Error("This value is too large for the cookie backup.");
        }
        document.cookie = cookieName(key) + "=" + encoded + "; path=/; max-age=31536000; SameSite=Lax";
        if (readCookie(key) !== serialized) {
          throw new Error("The browser could not save the cookie backup.");
        }
        return "cookie";
      } catch (cookieError) {
        notify(cookieError.message || localStorageError.message);
        return null;
      }
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      notify(error.message);
    }
    try {
      document.cookie = cookieName(key) + "=; path=/; max-age=0; SameSite=Lax";
    } catch (error) {
      notify(error.message);
    }
  }

  window.GameStorage = { get: get, set: set, remove: remove };
})();
