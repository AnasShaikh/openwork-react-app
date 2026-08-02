import React, { useEffect, useState } from 'react';
import { subscribeToasts, dismissToast } from '../../services/notify';
import './ToastHost.css';

/**
 * Renders the active toasts. Mounted once, at the application root.
 *
 * Errors use role="alert" so screen readers announce them immediately; success
 * and info use role="status", which announces without interrupting.
 */
export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (!toasts.length) return null;

  return (
    <div className="ow-toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`ow-toast ow-toast--${toast.variant}`}
          role={toast.variant === 'error' ? 'alert' : 'status'}
        >
          <span className="ow-toast__message">{toast.message}</span>
          <button
            type="button"
            className="ow-toast__close"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
