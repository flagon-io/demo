import { useEffect, useState } from "react";
import { OpenFeature, useStringFlagDetails } from "@openfeature/react-sdk";
import { OFREPWebProvider } from "@openfeature/ofrep-web-provider";

const FLAG_KEY = "demo-experience";
const POLL_MS = 15_000;
const CONTEXT = { targetingKey: "demo-user" };
type Status = "disconnected" | "connecting" | "live" | "error";
type Connection = { apiUrl: string; token: string };
const DEFAULT_API_URL =
  import.meta.env.VITE_FLAGON_API_URL || "https://api.flagon.io";
const BUILD_TOKEN = import.meta.env.VITE_FLAGON_CLIENT_TOKEN || "";

function Mark() {
  return <img className="mark" src="https://www.flagon.io/flagon.svg" alt="" />;
}

const scenarios = [
  {
    key: "feature-flags",
    icon: "F",
    title: "Release safely",
    area: "Feature flags",
    description:
      "Evaluate variants through OpenFeature and update an experience without deploying.",
    available: true,
  },
] as const;

function routeFromHash() {
  return window.location.hash.replace(/^#\/?/, "") || "home";
}

export function App() {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const update = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  if (route === "feature-flags") return <FeatureFlagsDemo />;
  return <DemoHub />;
}

function DemoHub() {
  return (
    <main className="hub">
      <header>
        <a
          className="brand"
          href="https://www.flagon.io"
          target="_blank"
          rel="noreferrer"
        >
          <Mark />
          <strong>flagon</strong>
          <span>DEMOS</span>
        </a>
        <a
          className="secondary header-link"
          href="https://www.flagon.io"
          target="_blank"
          rel="noreferrer"
        >
          Visit flagon.io
        </a>
      </header>
      <section className="hub-intro">
        <div className="eyebrow">INTERACTIVE PRODUCT TOUR</div>
        <h1>What would you like to demo?</h1>
        <p>
          Small, focused scenarios that show how Flagon helps teams ship,
          organize, govern, and understand their software.
        </p>
      </section>
      <section className="scenario-grid">
        {scenarios.map((scenario) => (
          <a
            className="scenario available"
            href={`#/${scenario.key}`}
            key={scenario.key}
          >
            <ScenarioContent scenario={scenario} />
            <span className="scenario-action">Launch demo -&gt;</span>
          </a>
        ))}
      </section>
      <div className="more-coming">
        <span>+</span>
        <div>
          <strong>More demos coming soon</strong>
          <p>We are adding focused walkthroughs as each experience is ready.</p>
        </div>
      </div>
      <footer>
        <Mark /> One Flagon platform / focused product stories
      </footer>
    </main>
  );
}

function ScenarioContent({
  scenario,
}: {
  scenario: (typeof scenarios)[number];
}) {
  return (
    <>
      <div className="scenario-top">
        <span className="scenario-icon">{scenario.icon}</span>
        <small>{scenario.area}</small>
      </div>
      <h2>{scenario.title}</h2>
      <p>{scenario.description}</p>
    </>
  );
}

function FeatureFlagsDemo() {
  const initialToken = localStorage.getItem("flagon.demo.token") || BUILD_TOKEN;
  const [connection, setConnection] = useState<Connection>({
    apiUrl: localStorage.getItem("flagon.demo.api") || DEFAULT_API_URL,
    token: initialToken,
  });
  const [tokenDraft, setTokenDraft] = useState(initialToken);
  const [apiDraft, setApiDraft] = useState(connection.apiUrl);
  const [status, setStatus] = useState<Status>(
    initialToken ? "connecting" : "disconnected",
  );
  const [drawer, setDrawer] = useState(!initialToken);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const evaluation = useStringFlagDetails(FLAG_KEY, "control");

  useEffect(() => {
    if (!connection.token) return;
    let active = true;
    const provider = new OFREPWebProvider({
      baseUrl: connection.apiUrl
        .replace(/\/ofrep\/v1\/?$/, "")
        .replace(/\/$/, ""),
      headers: [["Authorization", `Bearer ${connection.token}`]],
      pollInterval: POLL_MS,
      changeDetection: "polling",
      cacheMode: "network-first",
      cacheKeyPrefix: connection.apiUrl,
    });
    void OpenFeature.setProviderAndWait(provider, CONTEXT)
      .then(() => {
        if (active) {
          setStatus("live");
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setStatus("error");
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not reach Flagon.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [connection]);

  const experience = ["control", "modern", "bold"].includes(evaluation.value)
    ? evaluation.value
    : "control";
  const enabled = experience !== "control";
  const copy =
    experience === "bold"
      ? {
          icon: "✦",
          title: "Make a bold entrance.",
          body: "The bold variant shipped instantly through the same OpenFeature evaluation.",
        }
      : experience === "modern"
        ? {
            icon: "✓",
            title: "The modern experience is live.",
            body: "Flagon delivered this variant without a deploy or page reload.",
          }
        : {
            icon: "○",
            title: "You’re viewing the control.",
            body: "Change the served variant in Flagon, then watch this experience update.",
          };

  async function refreshNow() {
    if (!connection.token || refreshing) return;
    setRefreshing(true);
    try {
      await OpenFeature.setContext({ ...OpenFeature.getContext() });
    } finally {
      setRefreshing(false);
    }
  }

  function connect(event: React.FormEvent) {
    event.preventDefault();
    const next = {
      apiUrl: apiDraft.trim() || DEFAULT_API_URL,
      token: tokenDraft.trim(),
    };
    if (!next.token) {
      setError("Enter a Flagon client token.");
      return;
    }
    localStorage.setItem("flagon.demo.api", next.apiUrl);
    localStorage.setItem("flagon.demo.token", next.token);
    setConnection(next);
    setStatus("connecting");
    setDrawer(false);
  }

  return (
    <main className={`demo ${enabled ? "enabled" : ""} ${experience}`}>
      <header>
        <div className="scenario-nav">
          <a className="back" href="#/" aria-label="Back to demos">
            &lt;-
          </a>
          <a className="brand" href="#/">
            <Mark />
            <strong>flagon</strong>
            <span>FEATURE FLAGS</span>
          </a>
        </div>
        <div className="header-actions">
          <span className={`status ${status}`}>
            <i />
            {status === "live" ? "OpenFeature connected" : status}
          </span>
          <button
            className="secondary"
            onClick={() => void refreshNow()}
            disabled={!connection.token || status !== "live" || refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh now"}
          </button>
          <button className="primary" onClick={() => setDrawer(true)}>
            Configure
          </button>
        </div>
      </header>

      <section className="stage">
        <div className="eyebrow">ONE FLAG · LIVE UPDATE</div>
        <div className="state-icon">{copy.icon}</div>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>

        <article className="flag-card">
          <div>
            <small>FLAG KEY</small>
            <code>{FLAG_KEY}</code>
          </div>
          <div className="decision">
            <small>EVALUATED VALUE</small>
            <strong>{status === "live" ? evaluation.value : "—"}</strong>
          </div>
          <div
            className="variants"
            aria-label={`Active variant: ${experience}`}
          >
            {["control", "modern", "bold"].map((item) => (
              <i
                className={item === experience ? "active" : ""}
                key={item}
                title={item}
              />
            ))}
          </div>
        </article>

        {!connection.token && (
          <button className="primary connect" onClick={() => setDrawer(true)}>
            Connect to Flagon →
          </button>
        )}
        {connection.token && status === "error" && (
          <p className="error">{error}</p>
        )}
        {connection.token && status === "live" && evaluation.errorCode && (
          <p className="hint">
            Create a string flag named <code>{FLAG_KEY}</code> with control,
            modern, and bold variants.
          </p>
        )}
        {status === "live" && (
          <p className="updated">
            Variant: {evaluation.variant || "default"} · Reason:{" "}
            {evaluation.reason || "default"}
          </p>
        )}
      </section>

      <footer>
        <Mark /> Powered by OpenFeature · context: <code>demo-user</code>
      </footer>

      {drawer && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && connection.token)
              setDrawer(false);
          }}
        >
          <section
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-title"
          >
            {connection.token && (
              <button
                className="close"
                onClick={() => setDrawer(false)}
                aria-label="Close"
              >
                ×
              </button>
            )}
            <Mark />
            <div className="eyebrow">DEMO CONNECTION</div>
            <h2 id="connect-title">Connect to Flagon</h2>
            <p>Enter a publishable client token. It stays in this browser.</p>
            <form onSubmit={connect}>
              <label>
                OFREP provider URL
                <input
                  value={apiDraft}
                  onChange={(event) => setApiDraft(event.target.value)}
                  placeholder="http://localhost:3000/api"
                />
              </label>
              <label>
                Client token
                <input
                  type="password"
                  value={tokenDraft}
                  onChange={(event) => setTokenDraft(event.target.value)}
                  placeholder="flagon_client_••••••••"
                  autoFocus
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="primary" type="submit">
                Connect and evaluate →
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
