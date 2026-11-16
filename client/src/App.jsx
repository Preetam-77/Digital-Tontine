import { useState } from "react";
import { T } from "./i18n.js";

const post = async (url, body) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });

  const text = await r.text();
  let j = {};

  if (text) {
    try {
      j = JSON.parse(text);
    } catch {
      throw new Error("Server returned an invalid response. Check the backend.");
    }
  }

  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
};

export default function App() {
  const [lang, setLang] = useState("en");
  const t = T[lang];

  const [c, setC] = useState(null);
  const [msg, setMsg] = useState(null);

  const act = async (fn, okMsg) => {
    try {
      setC(await fn());
      setMsg({ ok: true, text: okMsg });
    } catch (e) {
      setMsg({ ok: false, text: t.err + e.message });
    }
  };

  const cur = c?.rounds[c.currentRound - 1];
  const me = c?.order[1];

  const label = (pk) =>
    pk === me ? `${t.you} (${c.labels[pk]})` : c.labels[pk] || pk.slice(0, 8);

  const pay = (payer, forge) =>
    act(
      () => post("/api/mock/pay", {
        circleId: c.id,
        round: c.currentRound,
        payer,
        forge
      }),
      t.ok
    );

  const switchLanguage = () => {
    setLang((current) =>
      current === "en" ? "fr" : current === "fr" ? "wo" : "en"
    );
  };

  return (
    <main>
      <header>
        <h1>{c?.name || t.title}</h1>
        <button onClick={switchLanguage}>{t.lang}</button>
      </header>

      {!c && (
        <button className="main" onClick={() => act(() => post("/api/mock/seed"), "")}>
          {t.start}
        </button>
      )}

      {c && cur && (
        <>
          <section className="card">
            <div>
              {t.round(cur.round, c.order.length)} · {label(cur.winner)} {t.gets}
            </div>
            <div className="pot">
              {(c.amountSats * cur.paid.length).toLocaleString()} /{" "}
              {(c.amountSats * (c.members.length - 1)).toLocaleString()} sats
            </div>
            <progress max={c.members.length - 1} value={cur.paid.length} />
          </section>

          <section className="card">
            {c.members.map((m) => (
              <div className="row" key={m}>
                <span>{label(m)}</span>
                <span>
                  {m === cur.winner ? "★" : cur.paid.includes(m) ? (
                    <b className="paid">{t.paid}</b>
                  ) : (
                    <>
                      <span className="mute">{t.wait}</span>{" "}
                      <button onClick={() => pay(m)}>{t.pay}</button>
                    </>
                  )}
                  {" · "}{Math.round(c.reliability[m] * 100)}% {t.rel}
                </span>
              </div>
            ))}
          </section>

          {cur.complete && cur.round === c.order.length && (
            <p className="paid">{t.done}</p>
          )}

          <button onClick={() => cur.missing.length && pay(cur.missing[0], true)}>
            {t.forge}
          </button>

          <details className="card">
            <summary>{t.ledger}</summary>
            {c.rounds.map((r) => (
              <div key={r.round}>
                <code>T{r.round}: {r.paid.length}/{r.paid.length + r.missing.length}</code>
              </div>
            ))}
          </details>
        </>
      )}

      <p role="status" className={msg?.ok ? "paid" : "bad"}>
        {msg?.text}
      </p>

      <p className="mute">{t.note}</p>
    </main>
  );
}
