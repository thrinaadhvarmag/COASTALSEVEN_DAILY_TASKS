import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Headphones, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EVENTS = [
  { image: "/events/saaho.jpg", tag: "THE CLASSIC REBEL", title: "Sharp. Dark. Iconic.", copy: "A cinematic drop inspired by the Rebel Star." },
  { image: "/events/mirchi.jpg", tag: "FORMAL REBEL", title: "Own the attitude.", copy: "Timeless looks for fans who keep it bold." },
  { image: "/events/rebel.webp", tag: "MASS REBEL COLLECTION", title: "Make a statement.", copy: "Street-ready styles with the Rebel Mart edge." },
  { image: "/events/darling.png", tag: "ICONIC ERA", title: "Style with a story.", copy: "Celebrate the moments that made the fandom." },
  { image: "/events/rajasaab.jpg", tag: "STYLISH REBEL", title: "The next chapter.", copy: "Discover fresh picks from the Rebel universe." },
];

export default function Home() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % EVENTS.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const event = EVENTS[active];
  const move = (direction) => setActive((value) => (value + direction + EVENTS.length) % EVENTS.length);

  return <div>
    <section className="hero hero-gold">
      <div className="gold-particle particle-a"/><div className="gold-particle particle-b"/><div className="gold-particle particle-c"/>
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles size={15}/> THE REBEL MART COLLECTION</div>
          <h1>Icons never<br/><span>fade.</span></h1>
          <p>Premium fan merchandise, bold everyday styles and a shopping experience built for the Rebel community.</p>
          <div className="hero-actions"><Link className="btn-primary" to="/products">Explore products <ArrowRight size={18}/></Link>{!isAuthenticated&&<Link className="btn-secondary" to="/register">Join Rebel Mart</Link>}{isAdmin&&<Link className="btn-secondary" to="/admin">Open admin</Link>}</div>
          <div className="hero-trust"><span><ShieldCheck size={16}/> Secure checkout</span><span><Truck size={16}/> Clear order tracking</span><span><Headphones size={16}/> Customer support</span></div>
        </div>

        <div className="hero-visual">
          <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
          <div className="hero-event-card">
            <div className="hero-event-image" key={event.image}>
              <img src={event.image} alt={event.title}/>
              <div className="hero-event-overlay"/>
              <div className="hero-event-copy"><small>{event.tag}</small><h2>{event.title}</h2><p>{event.copy}</p><Link to="/products">Explore <ArrowRight size={15}/></Link></div>
              <div className="hero-event-controls"><button onClick={() => move(-1)} aria-label="Previous event"><ArrowLeft size={17}/></button><div>{EVENTS.map((_, index)=><button key={index} className={index===active?"event-dot active":"event-dot"} onClick={()=>setActive(index)} aria-label={`Show event ${index+1}`}/>)}</div><button onClick={() => move(1)} aria-label="Next event"><ArrowRight size={17}/></button></div>
              <span className="event-live"><i/> LIVE FEATURE</span>
            </div>
            <div className="hero-card-bottom"><div><small>REBEL MART</small><strong>Built for the fandom.</strong></div><span>{String(active+1).padStart(2,"0")}/{String(EVENTS.length).padStart(2,"0")}</span></div>
          </div>
        </div>
      </div>
    </section>

    <section className="container feature-grid"><div><ShieldCheck/><h3>Secure by design</h3><p>JWT-protected accounts and role-aware experiences keep customer and admin actions separated.</p></div><div><Truck/><h3>Track your journey</h3><p>Orders move through clear statuses so customers always know what is happening next.</p></div><div><Sparkles/><h3>Premium experience</h3><p>Fast search, responsive layouts, image previews and polished feedback states across the store.</p></div></section>
    <section className="container home-cta"><div><span className="eyebrow">THE REBEL COLLECTION</span><h2>Find your next favorite.</h2><p>Browse the catalog and discover your next piece.</p></div><Link className="btn-primary" to="/products">Shop now <ArrowRight size={17}/></Link></section>
  </div>;
}
