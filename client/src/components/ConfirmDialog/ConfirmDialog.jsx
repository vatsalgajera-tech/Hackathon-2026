import './ConfirmDialog.css';

/**
 * ConfirmDialog — replaces native browser confirm()
 *
 * Usage:
 *   const [dialog, setDialog] = useState(null);
 *   // trigger:
 *   setDialog({ message: 'Delete this item?', onConfirm: () => doDelete() });
 *   // render:
 *   <ConfirmDialog dialog={dialog} onClose={() => setDialog(null)} />
 */
export default function ConfirmDialog({ dialog, onClose }) {
  if (!dialog) return null;
  return (
    <div className="cdialog-overlay" onClick={onClose}>
      <div className="cdialog-box" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="cdialog-icon">
          {dialog.type === 'success' ? '✅' : dialog.type === 'info' ? 'ℹ️' : '⚠️'}
        </div>
        <h3 className="cdialog-title">{dialog.title || 'Confirm Action'}</h3>
        <p className="cdialog-message">{dialog.message}</p>
        <div className="cdialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {dialog.cancelLabel || 'Cancel'}
          </button>
          <button
            className={`btn ${dialog.type === 'danger' ? 'btn-danger-solid' : 'btn-primary'}`}
            onClick={() => { dialog.onConfirm?.(); onClose(); }}
          >
            {dialog.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
