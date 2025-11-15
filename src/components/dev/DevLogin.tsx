import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Small helper to create a dummy JWT-like string (not cryptographically secure)
const makeDummyJwt = (account: string) => {
  const header = { alg: "none", typ: "JWT" };
  const payload = { sub: account, iat: Math.floor(Date.now() / 1000) };
  const encode = (obj: unknown) => {
    const str = JSON.stringify(obj);
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      return window.btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    // fallback for Node environments
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

export const DevLogin: React.FC = () => {
  const [account, setAccount] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") return window.localStorage.getItem("API_ACCOUNT_USERNAME") ?? "root";
    } catch (e) {}
    return "root";
  });
  const [token, setToken] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") return window.localStorage.getItem("API_BEARER") ?? "";
    } catch (e) {}
    return "";
  });
  const [generated, setGenerated] = useState(false);

  const doLogin = (useGenerated = false) => {
    try {
      const value = useGenerated ? makeDummyJwt(account) : token;
      if (typeof window !== "undefined") {
        if (value) window.localStorage.setItem("API_BEARER", value);
        else window.localStorage.removeItem("API_BEARER");
        if (account) window.localStorage.setItem("API_ACCOUNT_USERNAME", account);
        else window.localStorage.removeItem("API_ACCOUNT_USERNAME");
      }
      setToken(value);
      setGenerated(useGenerated);
      // trigger a reload of react-query consumers by writing a small event to localStorage
      try { window.localStorage.setItem("API_DEV_LAST_UPDATE", String(Date.now())); } catch (e) {}
    } catch (e) {
      // ignore
    }
  };

  const doClear = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("API_BEARER");
        window.localStorage.removeItem("API_ACCOUNT_USERNAME");
      }
      setToken("");
      setGenerated(false);
      try { window.localStorage.setItem("API_DEV_LAST_UPDATE", String(Date.now())); } catch (e) {}
    } catch (e) {}
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dev Login</CardTitle>
        <CardDescription>Generate or paste a bearer token for local testing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1 w-48"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            aria-label="Account username"
          />
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Paste bearer token (or generate)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            aria-label="Bearer token"
          />
          <Button onClick={() => doLogin(false)}>Save</Button>
          <Button onClick={() => doLogin(true)}>Generate</Button>
          <Button variant="ghost" onClick={doClear}>Clear</Button>
        </div>
        {generated && token && (
          <div className="mt-2 text-xs text-muted-foreground">Generated token stored (dummy JWT)</div>
        )}
      </CardContent>
    </Card>
  );
};

export default DevLogin;
