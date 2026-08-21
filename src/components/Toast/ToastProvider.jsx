import { createContext, useContext, useRef, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import './Toast.scss';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '', success: true });
  const timerRef = useRef(null);

  const showToast = useCallback((message, success = true) => {
    setToast({ visible: true, message, success });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`app-toast${toast.visible ? ' show' : ''}${toast.success ? ' ok' : ' warn'}`}>
        <span className="app-toast-icon">
          {toast.success ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
        </span>
        <span>{toast.message}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
