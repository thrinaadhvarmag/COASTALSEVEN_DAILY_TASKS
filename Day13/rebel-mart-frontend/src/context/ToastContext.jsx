import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => setToasts((items) => items.filter((x) => x.id !== id)), []);
  const show = useCallback((message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => remove(id), 3600);
  }, [remove]);
  return <ToastContext.Provider value={useMemo(() => ({ show, remove }), [show, remove])}>
    {children}
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = toast.type === "error" ? XCircle : toast.type === "info" ? Info : CheckCircle2;
        return <div className={`toast toast-${toast.type}`} key={toast.id}><Icon size={18}/><span>{toast.message}</span><button onClick={() => remove(toast.id)} aria-label="Dismiss"><X size={15}/></button></div>;
      })}
    </div>
  </ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
