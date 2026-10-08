import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileDown, LoaderCircle, UploadCloud, XCircle } from "lucide-react";
import { backgroundApi } from "../services/api";
import { getErrorMessage } from "../lib/constants";
import { useToast } from "../context/ToastContext";

const TERMINAL = new Set(["SUCCESS", "FAILURE", "REVOKED"]);

export default function BackgroundJobsPanel({ orders = [] }) {
    const [jobs, setJobs] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(orders[0]?.id ? String(orders[0].id) : "");
    const [importing, setImporting] = useState(false);
    const [bulkInvoicesBusy, setBulkInvoicesBusy] = useState(false);
    const fileRef = useRef(null);
    const { show } = useToast();

    useEffect(() => {
        if (!selectedOrder && orders[0]?.id) setSelectedOrder(String(orders[0].id));
    }, [orders, selectedOrder]);

    const active = useMemo(() => jobs.some((job) => !TERMINAL.has(job.state)), [jobs]);

    useEffect(() => {
        if (!active) return undefined;
        let cancelled = false;
        const poll = async () => {
            const pending = jobs.filter((job) => !TERMINAL.has(job.state));
            if (!pending.length) return;
            const results = await Promise.all(
                pending.map(async (job) => {
                    try {
                        return [job.taskId, await backgroundApi.status(job.taskId)];
                    } catch (error) {
                        return [job.taskId, { state: "FAILURE", error: getErrorMessage(error) }];
                    }
                }),
            );
            if (cancelled) return;
            setJobs((current) => current.map((job) => {
                const match = results.find(([taskId]) => taskId === job.taskId)?.[1];
                if (!match) return job;
                return { ...job, ...match };
            }));
        };
        poll();
        const timer = window.setInterval(poll, 1000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [active, jobs]);

    const addJob = (taskId, label) => {
        setJobs((current) => [{ taskId, label, state: "PENDING", progress: null, result: null, error: null }, ...current].slice(0, 8));
    };

    const openInvoice = async (filename) => {
        try {
            const blob = await backgroundApi.downloadInvoice(filename);
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            show(getErrorMessage(error), "error");
        }
    };

    const generateInvoice = async () => {
        if (!selectedOrder) return;
        try {
            const { task_id } = await backgroundApi.startInvoice(Number(selectedOrder));
            addJob(task_id, `Invoice for order #${selectedOrder}`);
            show(`Invoice job started for order #${selectedOrder}`);
        } catch (error) {
            show(getErrorMessage(error), "error");
        }
    };

    const generateAllInvoices = async () => {
        setBulkInvoicesBusy(true);
        try {
            const { task_id } = await backgroundApi.startBulkInvoices();
            addJob(task_id, `All order invoices — ${orders.length} orders`);
            show(`Bulk invoice job started for ${orders.length} orders`);
        } catch (error) {
            show(getErrorMessage(error), "error");
        } finally {
            setBulkInvoicesBusy(false);
        }
    };

    const downloadBulkInvoices = async (filename) => {
        try {
            const blob = await backgroundApi.downloadBulkInvoices(filename);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            show(getErrorMessage(error), "error");
        }
    };

    const importCsv = async (file) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            show("Please select a CSV file", "error");
            return;
        }
        setImporting(true);
        try {
            const { task_id } = await backgroundApi.importProducts(file);
            addJob(task_id, `Bulk product import — ${file.name}`);
            show("CSV import started in the background");
        } catch (error) {
            show(getErrorMessage(error), "error");
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <section className="card" style={{ padding: 22, marginBottom: 24 }}>
            <div className="section-toolbar">
                <div>
                    <div className="eyebrow">Background jobs</div>
                    <h2>Celery task lifecycle</h2>
                    <p className="muted">Trigger background jobs, generate invoices, download all order invoices as one ZIP, and import products without blocking the admin dashboard.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "end", marginBottom: 18 }}>
                <label className="field">
                    <span>Order for PDF invoice</span>
                    <select className="input" value={selectedOrder} onChange={(event) => setSelectedOrder(event.target.value)} disabled={!orders.length}>
                        {!orders.length ? <option value="">No orders available</option> : orders.map((order) => <option key={order.id} value={order.id}>Order #{order.id} — ₹{Number(order.total_amount || 0).toFixed(2)}</option>)}
                    </select>
                </label>
                <button className="btn-primary" onClick={generateInvoice} disabled={!selectedOrder || !orders.length}>
                    <FileDown size={16} /> Generate invoice
                </button>
                <button className="btn-secondary" onClick={generateAllInvoices} disabled={!orders.length || bulkInvoicesBusy}>
                    {bulkInvoicesBusy ? <LoaderCircle className="spin" size={16} /> : <FileDown size={16} />}
                    {bulkInvoicesBusy ? "Starting…" : "Download all invoices"}
                </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
                <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => importCsv(event.target.files?.[0])} />
                <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={importing}>
                    {importing ? <LoaderCircle className="spin" size={16} /> : <UploadCloud size={16} />}
                    {importing ? "Uploading…" : "Import products CSV"}
                </button>
                <span className="muted">Required columns: name, price, stock. Optional: description, image_url.</span>
            </div>

            <div className="stack">
                {jobs.length === 0 ? (
                    <div className="empty-inline">No background jobs yet. Start an invoice or CSV import above.</div>
                ) : jobs.map((job) => {
                    const progress = job.progress?.percent ?? (job.state === "SUCCESS" ? 100 : 0);
                    const message = job.progress?.message || (job.state === "PENDING" ? "Waiting for a Celery worker…" : job.state);
                    return (
                        <div className="card" key={job.taskId} style={{ padding: 14, background: "var(--surface-2)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                                <div>
                                    <strong>{job.label}</strong>
                                    <div className="muted" style={{ marginTop: 4, fontSize: 10 }}>{message}</div>
                                </div>
                                {job.state === "SUCCESS" ? <CheckCircle2 size={19} /> : job.state === "FAILURE" ? <XCircle size={19} /> : <LoaderCircle className="spin" size={19} />}
                            </div>
                            <div style={{ height: 6, marginTop: 12, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                                <div style={{ width: `${Math.max(0, Math.min(100, progress))}%`, height: "100%", background: "var(--accent)", transition: "width .25s ease" }} />
                            </div>
                            <div className="muted" style={{ marginTop: 7, fontSize: 10 }}>{job.state} · {progress}%</div>
                            {job.state === "SUCCESS" && job.result?.filename && job.result?.type === "invoice" && (
                                <button
                                    className="btn-secondary tiny"
                                    type="button"
                                    onClick={() => openInvoice(job.result.filename)}
                                    style={{ display: "inline-flex", marginTop: 10 }}
                                >
                                    <FileDown size={13} /> Open PDF
                                </button>
                            )}
                            {job.state === "SUCCESS" && job.result?.filename && job.result?.type === "bulk_invoice_zip" && (
                                <button
                                    className="btn-secondary tiny"
                                    type="button"
                                    onClick={() => downloadBulkInvoices(job.result.filename)}
                                    style={{ display: "inline-flex", marginTop: 10 }}
                                >
                                    <FileDown size={13} /> Download ZIP ({job.result.total} invoices)
                                </button>
                            )}
                            {job.state === "SUCCESS" && job.result?.type === "csv_import" && (
                                <div className="muted" style={{ marginTop: 8, fontSize: 10 }}>
                                    Imported {job.result.imported} · skipped {job.result.skipped} · total {job.result.total}
                                </div>
                            )}
                            {job.state === "FAILURE" && <div className="alert error" style={{ marginTop: 10 }}>{job.error || "Background job failed"}</div>}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
