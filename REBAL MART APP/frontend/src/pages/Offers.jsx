import { ArrowRight, BadgePercent, Copy, ShoppingBag, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";

const offers = [
  { code: "WELCOME10", discount: "10% OFF", title: "Welcome to the Rebelverse", description: "Save on your first fan-favourite haul.", minimum: "Minimum order ₹999", featured: false },
  { code: "REBEL15", discount: "15% OFF", title: "Fan Fest Special", description: "A little extra love for your collection.", minimum: "Minimum order ₹1,999", featured: true },
];
export default function Offers() {
  const { show } = useToast();
  const copy = async (code) => { try { await navigator.clipboard.writeText(code); show(`${code} copied. Apply it at checkout.`, "success"); } catch { show(`Use code ${code} at checkout.`, "info"); } };
  return <div className="container page-section rm-offers-page">
    <header className="page-heading"><div><span className="eyebrow"><Sparkles size={13} style={{display:"inline",verticalAlign:"-2px"}}/> REBEL DEALS</span><h1>Good finds. Better prices.</h1><p>Exclusive savings for your next fandom favourite.</p></div><Link className="btn-primary" to="/products">Shop all products <ArrowRight size={16}/></Link></header>
    <section className="rm-offers-page-grid" aria-label="Available offers">{offers.map((offer) => <article className={`rm-offer-page-card${offer.featured ? " featured" : ""}`} key={offer.code}><span className="rm-offer-pill"><BadgePercent size={13}/> {offer.featured ? "FAN FEST SPECIAL" : "WELCOME OFFER"}</span><strong className="rm-offer-page-discount">{offer.discount}</strong><h2>{offer.title}</h2><p>{offer.description}</p><small>{offer.minimum}</small><div className="rm-offer-page-code"><code>{offer.code}</code><button className="btn-secondary" onClick={() => copy(offer.code)}><Copy size={14}/> Copy code</button></div><Link className="btn-primary full" to={`/products?search=${encodeURIComponent("")}`}>Explore products <ShoppingBag size={15}/></Link></article>)}</section>
    <p className="rm-offers-disclaimer">Offers are subject to the minimum order value and checkout validation. Only one coupon can be applied per order.</p>
  </div>;
}
