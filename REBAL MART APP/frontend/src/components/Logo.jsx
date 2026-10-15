import { Link } from "react-router-dom";

export default function Logo({ toHome = true }) {
  const content = (
    <>
      <img
        className="brand-mark-image"
        src="/favicon.png"
        alt=""
        width="48"
        height="48"
        decoding="async"
        fetchPriority="high"
      />
      <span className="brand-wordmark">
        <strong>REBEL<em>MART</em></strong>
        <small>SHOP WITHOUT LIMITS</small>
      </span>
    </>
  );

  return toHome ? (
    <Link to="/" className="brand brand-with-logo" aria-label="Rebel Mart home">
      {content}
    </Link>
  ) : (
    <div className="brand brand-with-logo" aria-label="Rebel Mart admin">
      {content}
    </div>
  );
}
