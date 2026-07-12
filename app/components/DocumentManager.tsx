'use client';
import { useState, useEffect, useCallback } from 'react';

const DOC_TYPES = ['Registration', 'Insurance', 'Permit', 'Inspection', 'Ownership', 'Other'] as const;
type DocType = typeof DOC_TYPES[number];

interface VehicleDocument {
  id: number;
  vehicle_id: string;
  doc_name: string;
  doc_type: DocType;
  ref_number: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

const DOC_TYPE_COLORS: Record<DocType, string> = {
  Registration: 'bg-[var(--info-light)] text-[var(--info)]',
  Insurance:    'bg-[var(--success-light)] text-[var(--success)]',
  Permit:       'bg-[var(--warning-light)] text-[var(--warning)]',
  Inspection:   'bg-[var(--accent-light)] text-[var(--accent-text)]',
  Ownership:    'bg-[var(--danger-light)] text-[var(--danger)]',
  Other:        'bg-[var(--surface-hover)] text-[var(--text-secondary)]',
};

interface DocumentManagerProps {
  vehicleId: string;
  /** Optional: vehicle registration number for display */
  vehicleName?: string;
}

/**
 * DocumentManager — full CRUD UI for text-based vehicle document records.
 * Integrates with /api/vehicles/[id]/documents routes.
 */
export function DocumentManager({ vehicleId, vehicleName }: DocumentManagerProps) {
  const [docs, setDocs] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    doc_name: '',
    doc_type: 'Registration' as DocType,
    ref_number: '',
    expiry_date: '',
    notes: '',
  });

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/documents`);
      const data = await res.json();
      if (data.success) {
        setDocs(data.documents);
      } else {
        setError(data.error ?? 'Failed to load documents.');
      }
    } catch {
      setError('Network error. Could not load documents.');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doc_name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setDocs((prev) => [data.document, ...prev]);
        setForm({ doc_name: '', doc_type: 'Registration', ref_number: '', expiry_date: '', notes: '' });
        setShowForm(false);
      } else {
        setError(data.error ?? 'Failed to add document.');
      }
    } catch {
      setError('Network error. Could not save document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (docId: number, docName: string) => {
    if (!confirm(`Delete document "${docName}"?`)) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
      } else {
        setError(data.error ?? 'Delete failed.');
      }
    } catch {
      setError('Network error. Could not delete document.');
    }
  };

  const isExpiringSoon = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 30 && daysLeft >= 0;
  };

  const isExpired = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <section
      id={`document-manager-${vehicleId}`}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]"
      aria-label="Vehicle Documents"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Documents {vehicleName ? `— ${vehicleName}` : ''}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {docs.length} record{docs.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <button
          type="button"
          id={`add-doc-btn-${vehicleId}`}
          onClick={() => setShowForm((s) => !s)}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            text-sm font-medium rounded-lg
            bg-[var(--accent)] text-white
            hover:bg-[var(--accent-hover)] transition-colors
          "
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Document
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div role="alert" className="mx-5 mt-4 px-4 py-2.5 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Add Document Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-hover)]"
          aria-label="Add document form"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`doc-name-${vehicleId}`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Document Name *
              </label>
              <input
                id={`doc-name-${vehicleId}`}
                type="text"
                required
                value={form.doc_name}
                onChange={(e) => setForm((f) => ({ ...f, doc_name: e.target.value }))}
                placeholder="e.g. Vehicle Insurance Policy"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
              />
            </div>

            <div>
              <label htmlFor={`doc-type-${vehicleId}`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Document Type
              </label>
              <select
                id={`doc-type-${vehicleId}`}
                value={form.doc_type}
                onChange={(e) => setForm((f) => ({ ...f, doc_type: e.target.value as DocType }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
              >
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor={`doc-ref-${vehicleId}`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Reference / Policy Number
              </label>
              <input
                id={`doc-ref-${vehicleId}`}
                type="text"
                value={form.ref_number}
                onChange={(e) => setForm((f) => ({ ...f, ref_number: e.target.value }))}
                placeholder="e.g. POL-2024-00123"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
              />
            </div>

            <div>
              <label htmlFor={`doc-expiry-${vehicleId}`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Expiry Date
              </label>
              <input
                id={`doc-expiry-${vehicleId}`}
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={`doc-notes-${vehicleId}`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Notes
              </label>
              <textarea
                id={`doc-notes-${vehicleId}`}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional details..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-sm font-medium bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      <div className="divide-y divide-[var(--border)]">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
            <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading documents...
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-muted)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm">No documents on file. Click "Add Document" to get started.</p>
          </div>
        ) : (
          docs.map((doc) => {
            const expired = isExpired(doc.expiry_date);
            const expiringSoon = !expired && isExpiringSoon(doc.expiry_date);

            return (
              <div
                key={doc.id}
                className="flex items-start justify-between px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${DOC_TYPE_COLORS[doc.doc_type]}`}>
                      {doc.doc_type}
                    </span>
                    {expired && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--danger-light)] text-[var(--danger)]">
                        ⚠ Expired
                      </span>
                    )}
                    {expiringSoon && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--warning-light)] text-[var(--warning)]">
                        ⏰ Expiring Soon
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                    {doc.doc_name}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {doc.ref_number && (
                      <span className="text-xs text-[var(--text-muted)]">
                        Ref: <span className="text-[var(--text-secondary)] font-mono">{doc.ref_number}</span>
                      </span>
                    )}
                    {doc.expiry_date && (
                      <span className={`text-xs ${expired ? 'text-[var(--danger)]' : expiringSoon ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>
                        Expires: {new Date(doc.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {doc.notes && (
                      <span className="text-xs text-[var(--text-muted)] italic truncate max-w-xs">{doc.notes}</span>
                    )}
                  </div>

                  <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
                    Added {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.doc_name)}
                  aria-label={`Delete ${doc.doc_name}`}
                  className="
                    ml-4 flex-shrink-0 p-1.5 rounded-md
                    text-[var(--text-muted)] hover:text-[var(--danger)]
                    hover:bg-[var(--danger-light)]
                    transition-colors duration-150
                  "
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
