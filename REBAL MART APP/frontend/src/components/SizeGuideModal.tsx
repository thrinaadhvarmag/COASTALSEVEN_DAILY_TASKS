import { useState } from "react";
import { X, Ruler } from "lucide-react";

interface SizeGuideModalProps {
  onClose: () => void;
}

export default function SizeGuideModal({ onClose }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<"inches" | "cm">("inches");

  const sizes = [
    { size: "XS", chestIn: "36", lengthIn: "26", shoulderIn: "16.5", chestCm: "91", lengthCm: "66", shoulderCm: "42" },
    { size: "S", chestIn: "38", lengthIn: "27", shoulderIn: "17.5", chestCm: "96", lengthCm: "69", shoulderCm: "44" },
    { size: "M", chestIn: "40", lengthIn: "28", shoulderIn: "18.5", chestCm: "102", lengthCm: "71", shoulderCm: "47" },
    { size: "L", chestIn: "42", lengthIn: "29", shoulderIn: "19.5", chestCm: "107", lengthCm: "74", shoulderCm: "50" },
    { size: "XL", chestIn: "44", lengthIn: "30", shoulderIn: "20.5", chestCm: "112", lengthCm: "76", shoulderCm: "52" },
    { size: "XXL", chestIn: "46", lengthIn: "31", shoulderIn: "21.5", chestCm: "117", lengthCm: "79", shoulderCm: "55" },
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(9, 9, 12, 0.75)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: "16px" }}
    >
      <div
        className="card"
        style={{ width: "min(640px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "26px", position: "relative", border: "1px solid var(--border-gold)", background: "var(--surface)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: "16px", right: "16px", width: "34px", height: "34px", borderRadius: "10px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--muted)", cursor: "pointer" }}
        >
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Ruler size={22} color="var(--accent)" />
          <h2 style={{ fontSize: "22px", margin: 0, color: "var(--text-heading)" }}>Rebel Mart Size Guide</h2>
        </div>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 20px" }}>
          Find your perfect fit. Our apparel is designed for standard Indian regular fit with high-grade pre-shrunk cotton.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
          <div style={{ display: "inline-flex", padding: "3px", borderRadius: "8px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setUnit("inches")}
              style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "750", background: unit === "inches" ? "var(--accent)" : "transparent", color: unit === "inches" ? "#09090c" : "var(--muted)", cursor: "pointer" }}
            >
              Inches
            </button>
            <button
              type="button"
              onClick={() => setUnit("cm")}
              style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "750", background: unit === "cm" ? "var(--accent)" : "transparent", color: unit === "cm" ? "#09090c" : "var(--muted)", cursor: "pointer" }}
            >
              Centimeters
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "center" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px", textAlign: "left", color: "var(--text-heading)" }}>Size</th>
                <th style={{ padding: "10px", color: "var(--text-heading)" }}>Chest ({unit === "inches" ? "in" : "cm"})</th>
                <th style={{ padding: "10px", color: "var(--text-heading)" }}>Length ({unit === "inches" ? "in" : "cm"})</th>
                <th style={{ padding: "10px", color: "var(--text-heading)" }}>Shoulder ({unit === "inches" ? "in" : "cm"})</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((item, idx) => (
                <tr key={item.size} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.02)" }}>
                  <td style={{ padding: "12px 10px", textAlign: "left", fontWeight: "800", color: "var(--accent)" }}>{item.size}</td>
                  <td style={{ padding: "12px 10px" }}>{unit === "inches" ? item.chestIn : item.chestCm}</td>
                  <td style={{ padding: "12px 10px" }}>{unit === "inches" ? item.lengthIn : item.lengthCm}</td>
                  <td style={{ padding: "12px 10px" }}>{unit === "inches" ? item.shoulderIn : item.shoulderCm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "18px", padding: "14px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--muted)" }}>
          <strong style={{ color: "var(--text-heading)", display: "block", marginBottom: "4px" }}>Fit Recommendation:</strong>
          If you prefer an oversized streetwear look (e.g. Salaar / Kalki boxy silhouette), we recommend ordering one size up.
        </div>
      </div>
    </div>
  );
}
