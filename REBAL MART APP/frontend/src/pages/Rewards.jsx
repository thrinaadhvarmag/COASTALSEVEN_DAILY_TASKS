import { useEffect, useState } from "react";
import { Award, Gift, Sparkles, TrendingUp, CheckCircle, ShieldCheck, ChevronRight, PackageCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getErrorMessage, money } from "../lib/constants";

export default function Rewards() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api
      .get("/orders/loyalty/me")
      .then(({ data: result }) => {
        if (live) setData(result);
      })
      .catch((e) => {
        if (live) setError(getErrorMessage(e));
      });
    return () => {
      live = false;
    };
  }, []);

  const points = data?.points ?? 0;
  const nextMilestone = data?.next_reward_at ?? 100;
  const progressPercent = Math.min(100, Math.max(0, Math.round((points % 100))));

  return (
    <div className="container page-section rm-rewards-page">
      {/* Page Header */}
      <div className="page-heading rewards-page-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} color="var(--accent)" /> Official Fandom Rewards
          </span>
          <h1>Rebel Club Loyalty</h1>
          <p>Earn points with every delivered order and unlock exclusive cinema privileges.</p>
        </div>
        <div className="rewards-badge-emblem">
          <Award size={28} />
          <span>REBEL TIER</span>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {!data && !error ? (
        <div className="spinner mx-auto" aria-label="Loading loyalty status" />
      ) : (
        data && (
          <>
            {/* Hero Points Banner Card */}
            <section className="card rm-rewards-hero">
              <div className="rm-rewards-hero-content">
                <span className="rm-rewards-tier-tag">
                  <Sparkles size={14} /> ACTIVE MEMBER STATUS
                </span>
                <h2>Keep Ruling with Rebel Mart.</h2>
                <p>
                  Every ₹100 spent on delivered authentic cinema merchandise earns 1 Rebel Club Point.
                  Points are credited automatically when your package arrives at your doorstep.
                </p>
                <div className="rm-rewards-cta-row">
                  <Link to="/products" className="btn-primary small">
                    Explore Merchandise <ChevronRight size={15} />
                  </Link>
                  <Link to="/orders" className="btn-secondary small">
                    Track Orders
                  </Link>
                </div>
              </div>

              <div className="rm-points-display-card">
                <span className="rm-points-label">AVAILABLE BALANCE</span>
                <div className="rm-points-counter">
                  <strong className="rm-points-big">{points}</strong>
                  <span className="rm-points-unit">Points</span>
                </div>
                <span className="rm-points-sub">1 Point = ₹1 Fan Credit</span>
              </div>
            </section>

            {/* 3 Metric Cards */}
            <div className="rm-rewards-stats-grid">
              <article className="card rm-stat-card">
                <div className="rm-stat-icon-wrap gold">
                  <Award size={22} />
                </div>
                <div className="rm-stat-details">
                  <span className="rm-stat-title">Points Earned</span>
                  <strong className="rm-stat-value">{points} pts</strong>
                </div>
              </article>

              <article className="card rm-stat-card">
                <div className="rm-stat-icon-wrap green">
                  <TrendingUp size={22} />
                </div>
                <div className="rm-stat-details">
                  <span className="rm-stat-title">Lifetime Delivered Spend</span>
                  <strong className="rm-stat-value">{money(data.lifetime_spend)}</strong>
                </div>
              </article>

              <article className="card rm-stat-card">
                <div className="rm-stat-icon-wrap blue">
                  <PackageCheck size={22} />
                </div>
                <div className="rm-stat-details">
                  <span className="rm-stat-title">Delivered Orders</span>
                  <strong className="rm-stat-value">{data.delivered_orders}</strong>
                </div>
              </article>
            </div>

            {/* Milestone Progress Card */}
            <section className="card rm-rewards-progress-card">
              <div className="rm-progress-header">
                <div>
                  <span className="rm-progress-badge">NEXT MILESTONE</span>
                  <h3>Level Up to Tier 2 Privileges</h3>
                  <p>
                    {data.points_to_next_reward} more points needed to complete your next {nextMilestone}-point milestone.
                  </p>
                </div>
                <div className="rm-progress-percent-circle">
                  <span>{progressPercent}%</span>
                </div>
              </div>

              <div className="rm-progress-bar-bg">
                <div className="rm-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="rm-progress-footer-info">
                <span>0 pts</span>
                <span>50 pts</span>
                <span>{nextMilestone} pts (Next Milestone)</span>
              </div>
            </section>

            {/* Member Benefits Grid */}
            <section className="rm-rewards-benefits-section">
              <div className="rm-section-title">
                <div>
                  <span className="eyebrow"><Zap size={14} color="var(--accent)" /> Exclusive Perks</span>
                  <h2>Rebel Member Benefits</h2>
                  <p>Designed specially for die-hard Indian cinema fans.</p>
                </div>
              </div>

              <div className="rm-benefits-grid">
                <article className="card rm-benefit-card">
                  <div className="rm-benefit-icon"><Gift size={22} color="var(--accent)" /></div>
                  <h3>Special Birthday Discounts</h3>
                  <p>Get instant discounts on exclusive Prabhas movie drops and limited edition fan merchandise.</p>
                </article>

                <article className="card rm-benefit-card">
                  <div className="rm-benefit-icon"><ShieldCheck size={22} color="var(--accent)" /></div>
                  <h3>Certified Authenticity</h3>
                  <p>Every piece is 100% officially licensed with hologram verification certificates.</p>
                </article>

                <article className="card rm-benefit-card">
                  <div className="rm-benefit-icon"><Sparkles size={22} color="var(--accent)" /></div>
                  <h3>Early Access to Drops</h3>
                  <p>Be the first in line when new limited drops for The Raja Saab and upcoming films launch.</p>
                </article>
              </div>
            </section>
          </>
        )
      )}
    </div>
  );
}
