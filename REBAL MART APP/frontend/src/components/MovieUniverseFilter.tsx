import { Film, Flame, Shield, Sparkles, Sword, Crown, Zap } from "lucide-react";

export const MOVIES = [
  { id: "all", name: "All Rebelverse", icon: Film, count: "All" },
  { id: "salaar", name: "Salaar: Ceasefire", icon: Sword, query: "Salaar", badge: "Khansaar Epic" },
  { id: "kalki", name: "Kalki 2898 AD", icon: Zap, query: "Kalki", badge: "Sci-Fi Saga" },
  { id: "baahubali", name: "Baahubali", icon: Crown, query: "Baahubali", badge: "Mahishmati Royal" },
  { id: "rajasaab", name: "The Raja Saab", icon: Sparkles, query: "Raja Saab", badge: "Vintage Swagger" },
  { id: "saaho", name: "Saaho", icon: Shield, query: "Saaho", badge: "Waaji City Thriller" },
  { id: "mirchi", name: "Mirchi", icon: Flame, query: "Mirchi", badge: "Iconic Rebel Classic" },
];

interface MovieUniverseFilterProps {
  selected?: string;
  onSelect: (movieQuery: string) => void;
}

export default function MovieUniverseFilter({ selected = "", onSelect }: MovieUniverseFilterProps) {
  return (
    <div style={{ margin: "24px 0", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {MOVIES.map((movie) => {
          const Icon = movie.icon;
          const isActive = movie.id === "all" ? !selected : selected.toLowerCase().includes(movie.id) || selected.toLowerCase().includes(movie.query?.toLowerCase() || "");

          return (
            <button
              key={movie.id}
              type="button"
              onClick={() => onSelect(movie.id === "all" ? "" : (movie.query || ""))}
              className={`rm-universe-pill ${isActive ? "active" : ""}`}
            >
              <Icon size={15} className="rm-universe-icon" />
              <span>{movie.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
