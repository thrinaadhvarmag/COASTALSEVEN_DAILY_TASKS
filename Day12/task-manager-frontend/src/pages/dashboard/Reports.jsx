import { useState } from "react";
import { generateReport } from "../../services/reportService";

function Reports() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleGenerate() {
        try {
            setLoading(true);
            setError("");
            setResult(await generateReport());
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to start report generation.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="page-header"><div><span className="eyebrow">REPORTS</span><h1>Background reports</h1><p>Trigger the Celery-backed report generation endpoint.</p></div></div>
            {error && <div className="alert alert-error">{error}</div>}
            <section className="card report-card">
                <div className="report-icon">R</div>
                <div><h2>Generate report</h2><p>POST /reports/generate returns a Celery task ID and starts the background job.</p></div>
                <button className="button button-primary" onClick={handleGenerate} disabled={loading}>{loading ? "Starting..." : "Generate Report"}</button>
            </section>
            {result && <section className="card result-card"><span className="eyebrow">CELERY RESPONSE</span><pre>{JSON.stringify(result, null, 2)}</pre></section>}
        </div>
    );
}

export default Reports;
