import React, { useState } from 'react';

export default function MoveToFolderModal({
  show,
  onClose,
  itemTitle = 'Item',
  currentFolderId = null,
  folders = [],
  onMove,
  onCreateNewFolder
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || 'root');
  const [moving, setMoving] = useState(false);

  if (!show) return null;

  const handleConfirm = async () => {
    try {
      setMoving(true);
      const targetFolderId = selectedFolderId === 'root' ? null : selectedFolderId;
      const targetFolder = folders.find(f => (f._id || f.id) === targetFolderId);
      await onMove(targetFolderId, targetFolder ? targetFolder.name : '');
      onClose();
    } catch (err) {
      alert('FAILED TO MOVE: ' + (err.message || 'Error occurred'));
    } finally {
      setMoving(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1080 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white px-4 py-3 border-0 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-folder-symlink fs-5 text-warning"></i>
              <div>
                <h6 className="modal-title fw-bold mb-0 text-white">Move to Folder</h6>
                <small className="text-white-50 extra-small text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                  {itemTitle}
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

          {/* Body */}
          <div className="modal-body p-3 bg-light">
            <div className="text-secondary extra-small fw-bold mb-2 px-1">
              SELECT DESTINATION FOLDER
            </div>

            <div className="list-group shadow-sm rounded-3 overflow-hidden border">
              {/* Standalone / Root option */}
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2.5 px-3 border-bottom ${
                  selectedFolderId === 'root' || !selectedFolderId ? 'bg-primary-subtle border-primary text-primary fw-bold' : ''
                }`}
                onClick={() => setSelectedFolderId('root')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <i className="bi bi-grid-fill text-secondary"></i>
                  <div>
                    <div className="small">Root (No Folder / Standalone)</div>
                    <div className="text-muted extra-small">Display on main projects dashboard</div>
                  </div>
                </div>
                {(selectedFolderId === 'root' || !selectedFolderId) && (
                  <i className="bi bi-check-circle-fill text-primary"></i>
                )}
              </button>

              {/* Folder options */}
              {folders.map(f => {
                const fId = f._id || f.id;
                const isSelected = selectedFolderId === fId;
                return (
                  <button
                    key={fId}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2.5 px-3 border-bottom ${
                      isSelected ? 'bg-primary-subtle border-primary text-primary fw-bold' : ''
                    }`}
                    onClick={() => setSelectedFolderId(fId)}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '26px',
                          height: '26px',
                          backgroundColor: (f.color || '#2563eb') + '20',
                          color: f.color || '#2563eb'
                        }}
                      >
                        <i className="bi bi-folder-fill" style={{ fontSize: '13px' }}></i>
                      </div>
                      <div>
                        <div className="small">{f.name}</div>
                        <div className="text-muted extra-small">
                          {f.clientName ? `Client: ${f.clientName} • ` : ''}
                          {f.projectsCount || 0} sheets
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <i className="bi bi-check-circle-fill text-primary"></i>
                    )}
                  </button>
                );
              })}
            </div>

            {onCreateNewFolder && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none extra-small fw-bold text-primary"
                  onClick={() => {
                    onClose();
                    onCreateNewFolder();
                  }}
                >
                  <i className="bi bi-folder-plus me-1"></i> + Create New Folder
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-white px-4 py-2.5 border-top d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary px-3 btn-sm"
              onClick={onClose}
              disabled={moving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary px-4 btn-sm fw-bold"
              onClick={handleConfirm}
              disabled={moving}
            >
              {moving ? 'Moving...' : 'Move Here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

