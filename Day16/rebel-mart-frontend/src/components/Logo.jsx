import { Link } from 'react-router-dom';
export default function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Rebel Mart home">
      <span className="brand-mark">
        <img src="/favicon.png" alt="Rebel Mart logo" />
      </span>
      <span>
        <strong>
          REBEL
          <em>MART</em>
        </strong>
        <small>SHOP WITHOUT LIMITS</small>
      </span>
    </Link>
  );
}
