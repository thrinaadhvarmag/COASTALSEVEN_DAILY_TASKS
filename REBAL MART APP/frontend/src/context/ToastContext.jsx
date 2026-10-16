import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts((items) => items.filter((x) => x.id !== id));
    }, []);

    const show = useCallback((message, type = "success") => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((items) => [...items, { id, message, type }]);
        setTimeout(() => remove(id), 4200);
    }, [remove]);

    return (
        <ToastContext.Provider value={useMemo(() => ({ show, remove }), [show, remove])}>
            {children}
            <div className="toast-stack" aria-live="polite">
                {toasts.map((toast) => {
                    const isError = toast.type === "error";
                    const isInfo = toast.type === "info";
                    const isWarn = toast.type === "warning" || toast.type === "warn";
                    const Icon = isError ? XCircle : isWarn ? AlertTriangle : isInfo ? Info : CheckCircle2;
                    const title = isError ? "Action Failed" : isWarn ? "Warning" : isInfo ? "Information" : "Success";

                    return (
                        <div className={`toast-card toast-${toast.type || "success"}`} key={toast.id} role="status">
                            <div className="toast-icon-wrap">
                                <Icon size={18} />
                            </div>
                            <div className="toast-body">
                                <strong className="toast-title">{title}</strong>
                                <p className="toast-message">{toast.message}</p>
                            </div>
                            <button
                                type="button"
                                className="toast-close-btn"
                                onClick={() => remove(toast.id)}
                                aria-label="Dismiss notification"
                            >
                                <X size={14} />
                            </button>
                            <div className="toast-progress-bar" />
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
