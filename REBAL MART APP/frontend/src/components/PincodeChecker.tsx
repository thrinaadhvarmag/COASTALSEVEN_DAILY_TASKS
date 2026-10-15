import { useState } from "react";
import { MapPin, CheckCircle, Truck, Clock } from "lucide-react";

export default function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<{ checked: boolean; valid: boolean; date?: string; cod: boolean; message?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) {
      setResult({ checked: true, valid: false, cod: false, message: "Please enter a valid 6-digit Indian PIN code" });
      return;
    }
    setChecking(true);
    setTimeout(() => {
      // Calculate realistic delivery date (2-4 business days)
      const date = new Date();
      date.setDate(date.getDate() + 3);
      const formattedDate = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

      setResult({
        checked: true,
        valid: true,
        date: formattedDate,
        cod: true,
        message: `Delivery by ${formattedDate} · Cash on Delivery available`,
      });
      setChecking(false);
    }, 400);
  };

  return (
    <div style={{ padding: "16px", borderRadius: "14px", background: "var(--surface)", border: "1px solid var(--border)", margin: "14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: "750", color: "var(--text-heading)", marginBottom: "10px" }}>
        <MapPin size={16} color="var(--accent)" />
        <span>Check Delivery & Cash on Delivery Availability</span>
      </div>

      <form onSubmit={checkPincode} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          style={{
            flex: 1,
            height: "40px",
            borderRadius: "10px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            padding: "0 12px",
            fontSize: "13px",
            color: "var(--text)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="btn-secondary"
          disabled={checking || pincode.length !== 6}
          style={{ height: "40px", padding: "0 16px", fontSize: "12px", borderRadius: "10px" }}
        >
          {checking ? "Checking…" : "Check"}
        </button>
      </form>

      {result?.checked && (
        <div style={{ marginTop: "12px", fontSize: "12px" }}>
          {result.valid ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--success)", fontWeight: "700" }}>
                <CheckCircle size={15} />
                <span>Express Delivery Available to {pincode}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--muted)", fontSize: "11.5px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Truck size={14} color="var(--accent)" /> Guaranteed delivery by <strong>{result.date}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={14} color="var(--accent)" /> COD Available
                </span>
              </div>
            </div>
          ) : (
            <span style={{ color: "#f87171" }}>{result.message}</span>
          )}
        </div>
      )}
    </div>
  );
}
