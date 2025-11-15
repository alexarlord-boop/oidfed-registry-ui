export const makeDummyJwt = (account: string) => {
  const header = { alg: "none", typ: "JWT" };
  const payload = { sub: account, iat: Math.floor(Date.now() / 1000) };
  const encode = (obj: unknown) => {
    const str = JSON.stringify(obj);
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      return window.btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const buf = require("buffer").Buffer.from(str);
      return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch (e) {
      return "";
    }
  };
  return `${encode(header)}.${encode(payload)}.`;
};

export const setDevAuth = (token: string | null, account: string | null) => {
  try {
    if (typeof window !== "undefined") {
      if (token) window.localStorage.setItem("API_BEARER", token);
      else window.localStorage.removeItem("API_BEARER");
      if (account) window.localStorage.setItem("API_ACCOUNT_USERNAME", account);
      else window.localStorage.removeItem("API_ACCOUNT_USERNAME");
      // small event to notify listeners
      window.localStorage.setItem("API_DEV_LAST_UPDATE", String(Date.now()));
    }
  } catch (e) {
    // ignore
  }
};

export const getDevAuth = () => {
  try {
    if (typeof window !== "undefined") {
      return {
        token: window.localStorage.getItem("API_BEARER"),
        account: window.localStorage.getItem("API_ACCOUNT_USERNAME"),
      };
    }
  } catch (e) {}
  return { token: null, account: null };
};

export const isAuthenticated = () => !!getDevAuth().token;
