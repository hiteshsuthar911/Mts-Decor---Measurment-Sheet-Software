import React, { useState, useEffect } from 'react';

const FOLDER_COLORS = [
  { label: 'Blue', value: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Emerald', value: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { label: 'Violet', value: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Amber', value: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { label: 'Rose', value: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  { label: 'Slate', value: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
];

export default function FolderModal({
  show,
  onClose,
  onSave,
  folder = null // null for new folder, or folder object for editing
}) {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (folder) {
      setName(folder.name || '');
      setClientName(folder.clientName || '');
      setLocation(folder.location || '');
      setDescription(folder.description || '');
      setColor(folder.color || '#2563eb');
    } else {
      setName('');
      setClientName('');
      setLocation('');
      setDescription('');
      setColor('#2563eb');
    }
    setError('');
    setSaving(false);
  }, [folder, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a folder / site name.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await onSave({
        name: name.trim(),
        clientName: clientName.trim(),
        location: location.trim(),
        description: description.trim(),
        color
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save folder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1080 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="modal-header text-white px-4 py-3 border-0 d-flex align-items-center justify-content-between"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: color,
                  color: '#fff',
                  fontSize: '18px'
                }}
              >
                <i className="bi bi-folder-fill"></i>
              </div>
              <div>
                <h6 className="modal-title fw-bold mb-0 text-white">
                  {folder ? 'Edit Project Folder' : 'New Project Folder / Site'}
                </h6>
                <small className="text-white-50 extra-small">
                  Group measurement sheets, RA bills, and files in one place
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-light">
              {error && (
                <div className="alert alert-danger py-2 px-3 extra-small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
                </div>
              )}

              {/* Folder / Site Name */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark extra-small mb-1">
                  FOLDER / SITE NAME <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Uttam or Uttam Heights Site"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
                <div className="text-muted extra-small mt-1">
                  Inside this folder, you can create files like <code>Uttam A1</code>, <code>Uttam A2</code>, etc.
                </div>
              </div>

              {/* Client Name */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark extra-small mb-1">
                  CLIENT / DEVELOPER NAME
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Uttam Patel"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark extra-small mb-1">
                  SITE LOCATION / ADDRESS
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Flat 402, Royal Residency, Bandra West"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark extra-small mb-1">
                  DESCRIPTION / PROJECT SCOPE
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Complete 3BHK Civil, Carpentry, and POP Renovation"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Color Tag */}
              <div className="mb-2">
                <label className="form-label fw-bold text-dark extra-small mb-1">
                  COLOR ACCENT
                </label>
                <div className="d-flex align-items-center gap-2">
                  {FOLDER_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className="btn p-0 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: c.value,
                        border: color === c.value ? '3px solid #0f172a' : '2px solid transparent',
                        boxShadow: color === c.value ? '0 0 0 2px #fff' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => setColor(c.value)}
                      title={c.label}
                    >
                      {color === c.value && (
                        <i className="bi bi-check-lg text-white fs-6"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-white px-4 py-3 border-top d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary px-3 btn-sm"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary px-4 py-2 fw-bold d-flex align-items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-folder-check"></i>
                    <span>{folder ? 'Save Changes' : 'Create Folder'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

