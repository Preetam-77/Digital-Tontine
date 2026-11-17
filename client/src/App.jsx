import { useState } from "react";
import { T } from "./i18n.js";

const post = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });

  const raw = await response.text();
  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Invalid server response. Please check the backend.");
  }

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};

export default function App() {
  const [lang, setLang] = useState("en");
  const t = T[lang];

  const [circle, setCircle] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const changeLanguage = () => {
    setLang((current) =>
      current === "en" ? "fr" : current === "fr" ? "wo" : "en"
    );
  };

  const act = async (action, successMessage) => {
    if (loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await action();
      if (result) setCircle(result);
      setMessage({ ok: true, text: successMessage });
    } catch (error) {
      setMessage({ ok: false, text: t.err + error.message });
    } finally {
      setLoading(false);
    }
  };

  const currentRound = circle?.rounds?.[circle.currentRound - 1];
  const me = circle?.order?.[1];

  const label = (publicKey) => {
    if (!circle || !publicKey) return "";
    if (publicKey === me) return `${t.you} (${circle.labels[publicKey]})`;
    return circle.labels[publicKey] || publicKey.slice(0, 8);
  };

  const pay = (payer, forge = false) =>
    act(
      () =>
        post("/api/mock/pay", {
          circleId: circle.id,
          round: circle.currentRound,
          payer,
          forge
        }),
      t.ok
    );

  const startDemo = () =>
    act(() => post("/api/mock/seed"), "");

  const members = circle?.members || [];
  const totalContributions = Math.max(members.length - 1, 1);
  const paidCount = currentRound?.paid?.length || 0;
  const progress = Math.min(
    (paidCount / totalContributions) * 100,
    100
  );

  const formatSats = (amount) =>
    Number(amount || 0).toLocaleString("en-US");

  return (
    <div className="app-shell">
      <div className="announcement">
        <span className="announcement-dot"></span>
        A smarter way to save together
        <span className="announcement-separator">·</span>
        Community-powered finance
      </div>

      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-symbol">D</span>
          <span>Digital<span className="brand-light">Tontine</span></span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#how-it-works">How it works</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#ledger">Ledger</a>
        </nav>

        <div className="nav-actions">
          <button className="language-button" onClick={changeLanguage}>
            {lang.toUpperCase()} <span>⌄</span>
          </button>
          <a className="nav-cta" href="#dashboard">
            Explore demo <span>↗</span>
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-icon">✳</span>
              SAVING TOGETHER, GROWING TOGETHER
            </div>

            <h1>
              Your community.
              <br />
              Your savings.
              <br />
              <span>One shared future.</span>
            </h1>

            <p className="hero-description">
              Bring people together through transparent rotating savings.
              Build trust, contribute as a group, and celebrate every
              milestone together.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#dashboard">
                Explore the demo <span>↗</span>
              </a>
              <a className="secondary-button" href="#how-it-works">
                Discover how it works
              </a>
            </div>

            <div className="hero-note">
              <span className="note-check">✓</span>
              Transparent contributions. Community-first savings.
            </div>
          </div>

          <div className="hero-art">
            <div className="art-glow"></div>
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>

            <div className="floating-card card-top">
              <span className="floating-icon">↗</span>
              <div>
                <small>COMMUNITY SAVINGS</small>
                <strong>Growing together</strong>
              </div>
            </div>

            <div className="hero-circle">
              <div className="circle-inner">
                <div className="circle-mark">D</div>
                <span>TOGETHER</span>
                <strong>We grow.</strong>
                <div className="circle-decoration">
                  <i></i><i></i><i></i><i></i><i></i>
                </div>
              </div>
            </div>

            <div className="floating-card card-bottom">
              <div className="avatar-stack">
                <span>A</span><span>M</span><span>F</span><span>+</span>
              </div>
              <div>
                <strong>One community</strong>
                <small>Many shared goals</small>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div>
            <span className="trust-icon">◇</span>
            <span>Transparent by design</span>
          </div>
          <div>
            <span className="trust-icon">◎</span>
            <span>Community driven</span>
          </div>
          <div>
            <span className="trust-icon">↗</span>
            <span>Built for shared progress</span>
          </div>
          <div>
            <span className="trust-icon">⌘</span>
            <span>Digital-first experience</span>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <span className="section-kicker">A SIMPLE IDEA, MADE DIGITAL</span>
            <h2>Saving is better <span>together.</span></h2>
            <p>
              A familiar community savings tradition, with a clearer
              and more transparent digital experience.
            </p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon">◎</div>
              <h3>Form your circle</h3>
              <p>
                Bring together people you know and create a shared savings
                community.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">02</span>
              <div className="step-icon">↗</div>
              <h3>Contribute regularly</h3>
              <p>
                Members contribute their agreed amount during each
                contribution round.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon">✳</div>
              <h3>Take your turn</h3>
              <p>
                Each member gets their opportunity to receive the group's
                contribution.
              </p>
            </article>
          </div>
        </section>

        <section className="dashboard-section" id="dashboard">
          <div className="dashboard-heading">
            <div>
              <span className="section-kicker">YOUR COMMUNITY AT A GLANCE</span>
              <h2>The tontine <span>dashboard.</span></h2>
              <p>Follow contributions, rounds and community progress.</p>
            </div>
            <div className="live-label">
              <span></span> DEMO ENVIRONMENT
            </div>
          </div>

          {!circle && (
            <div className="empty-dashboard">
              <div className="empty-icon">✳</div>
              <span className="section-kicker">YOUR SAVINGS JOURNEY STARTS HERE</span>
              <h3>Meet your first savings circle.</h3>
              <p>
                Start a sample tontine to explore member contributions,
                payout progress and the public ledger.
              </p>
              <button
                className="primary-button"
                onClick={startDemo}
                disabled={loading}
              >
                {loading ? "Starting..." : t.start}
                <span>↗</span>
              </button>
            </div>
          )}

          {circle && (
            <div className="dashboard-content">
              <div className="dashboard-topline">
                <div>
                  <span className="section-kicker">ACTIVE SAVINGS CIRCLE</span>
                  <h3>{circle.name || "Community Savings Circle"}</h3>
                </div>
                <span className="active-status">
                  <span></span> Active demo
                </span>
              </div>

              {currentRound ? (
                <>
                  <div className="stats-grid">
                    <article className="stat-card stat-highlight">
                      <span className="stat-label">CURRENT ROUND</span>
                      <strong>
                        {currentRound.round}
                        <small> / {circle.order.length}</small>
                      </strong>
                      <span className="stat-foot">Contribution cycle</span>
                    </article>

                    <article className="stat-card">
                      <span className="stat-label">CONTRIBUTIONS RECEIVED</span>
                      <strong>{paidCount}<small> / {totalContributions}</small></strong>
                      <span className="stat-foot">Member payments</span>
                    </article>

                    <article className="stat-card">
                      <span className="stat-label">CURRENT POT</span>
                      <strong>
                        {formatSats(circle.amountSats * paidCount)}
                      </strong>
                      <span className="stat-foot">Satoshis (sats)</span>
                    </article>

                    <article className="stat-card">
                      <span className="stat-label">PAYOUT RECIPIENT</span>
                      <strong className="recipient-name">
                        {label(currentRound.winner)}
                      </strong>
                      <span className="stat-foot">This round's recipient</span>
                    </article>
                  </div>

                  <div className="dashboard-columns">
                    <section className="panel contribution-panel">
                      <div className="panel-heading">
                        <div>
                          <span className="section-kicker">ROUND PROGRESS</span>
                          <h3>Contributions</h3>
                        </div>
                        <span className="progress-percent">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <div className="progress-caption">
                        <span>{paidCount} contributions received</span>
                        <span>{totalContributions} required</span>
                      </div>

                      <div className="member-list">
                        {members.map((member) => {
                          const isWinner = member === currentRound.winner;
                          const isPaid = currentRound.paid.includes(member);
                          const isMe = member === me;

                          return (
                            <div className="member-row" key={member}>
                              <div className="member-identity">
                                <div className="member-avatar">
                                  {(circle.labels[member] || member)
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <strong>{label(member)}</strong>
                                  <small>
                                    {isWinner
                                      ? "Payout recipient"
                                      : isMe
                                      ? "Your account"
                                      : "Circle member"}
                                  </small>
                                </div>
                              </div>

                              <div className="member-actions">
                                <span className="reliability">
                                  {Math.round(
                                    (circle.reliability[member] || 0) * 100
                                  )}% <small>reliability</small>
                                </span>

                                {isWinner ? (
                                  <span className="winner-badge">Recipient</span>
                                ) : isPaid ? (
                                  <span className="paid-badge">✓ {t.paid}</span>
                                ) : (
                                  <button
                                    className="contribute-button"
                                    onClick={() => pay(member)}
                                    disabled={loading}
                                  >
                                    {t.pay} ↗
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <aside className="panel round-panel">
                      <span className="section-kicker">ROUND DETAILS</span>
                      <div className="round-emblem">✳</div>
                      <h3>Your circle, your progress.</h3>
                      <p>
                        Every contribution helps the circle move closer
                        to completing its current round.
                      </p>

                      <div className="round-detail">
                        <span>Round</span>
                        <strong>
                          {currentRound.round} of {circle.order.length}
                        </strong>
                      </div>
                      <div className="round-detail">
                        <span>Contribution amount</span>
                        <strong>{formatSats(circle.amountSats)} sats</strong>
                      </div>
                      <div className="round-detail">
                        <span>Members</span>
                        <strong>{members.length}</strong>
                      </div>

                      <button
                        className="test-button"
                        onClick={() =>
                          currentRound.missing.length &&
                          pay(currentRound.missing[0], true)
                        }
                        disabled={loading || !currentRound.missing.length}
                      >
                        {t.forge}
                      </button>
                      <small className="demo-warning">
                        Testing only — this simulates a rejected receipt.
                      </small>
                    </aside>
                  </div>

                  {currentRound.complete && (
                    <div className="completion-banner">
                      <span>✓</span>
                      <div>
                        <strong>{t.done}</strong>
                        <p>This round has received all required contributions.</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-dashboard">
                  <h3>All rounds completed.</h3>
                  <p>Your demo savings circle has finished its rounds.</p>
                </div>
              )}

              {message && (
                <div className={message.ok ? "notice success-notice" : "notice error-notice"} role="status">
                  <span>{message.ok ? "✓" : "!"}</span>
                  {message.text}
                </div>
              )}

              <section className="panel ledger-panel" id="ledger">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">TRANSPARENCY MATTERS</span>
                    <h3>{t.ledger}</h3>
                  </div>
                  <span className="ledger-count">
                    {circle.rounds.length} rounds
                  </span>
                </div>

                {circle.rounds.map((round) => (
                  <div className="ledger-row" key={round.round}>
                    <div className="ledger-round">
                      <span className="ledger-icon">↗</span>
                      <div>
                        <strong>Round {round.round}</strong>
                        <small>
                          {round.paid.length} contributions received
                        </small>
                      </div>
                    </div>
                    <div className="ledger-status">
                      <span>{round.paid.length}/{round.paid.length + round.missing.length}</span>
                      <small>{round.missing.length === 0 ? "Complete" : "In progress"}</small>
                    </div>
                  </div>
                ))}
              </section>

              <button
                className="reset-button"
                onClick={() => {
                  setCircle(null);
                  setMessage(null);
                }}
              >
                Close demo view
              </button>
            </div>
          )}

          {message && !circle && (
            <div className={message.ok ? "notice success-notice" : "notice error-notice"} role="status">
              <span>{message.ok ? "✓" : "!"}</span>
              {message.text}
            </div>
          )}
        </section>

        <section className="closing-section">
          <span className="section-kicker">BUILT AROUND COMMUNITY</span>
          <h2>Small contributions.<br /><span>Shared possibilities.</span></h2>
          <p>
            Digital Tontine brings a trusted savings tradition into a
            more transparent digital experience.
          </p>
          <a href="#dashboard" className="closing-button">
            Explore the dashboard ↗
          </a>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-symbol">D</span>
          <span>Digital<span className="brand-light">Tontine</span></span>
        </a>
        <p>Community first. Progress together.</p>
        <span className="footer-copy">© 2026 Digital Tontine</span>
      </footer>

      <div className="demo-disclaimer">
        Demo environment. Payments are simulated; this application does not
        hold funds or make real Lightning payments.
      </div>
    </div>
  );
}
