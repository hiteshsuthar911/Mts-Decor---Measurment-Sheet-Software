import React, { useState } from 'react';

export default function Header({
  headerData,
  onChangeHeader,
  settings,
  onToggleBillingMode,
  onLoadSample,
  onResetSheet,
  onExportExcel,
  onOpenPrintView,
  onAddNewArea,
  onSave,
  isSaving,
  lastSavedAt,
  isPrintView,
  readOnly
}) {
  const [showDetails, setShowDetails] = useState(true);

  const handleChange = (field, value) => {
    onChangeHeader({ ...headerData, [field]: value });
  };

  const formatSavedTime = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="contractor-header bg-white border-bottom shadow-sm mb-4">
      {/* Top Action Ribbon */}
      <div className="bg-dark text-white py-2 px-3">
        <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center gap-2">
          {/* Brand & Project Name preview */}
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="badge bg-primary px-2 py-1 fs-6 text-uppercase">
              <i className="bi bi-rulers me-1"></i> MS Pro
            </span>
            <span className="fw-bold text-light small text-uppercase d-none d-sm-inline">
              {headerData.projectName || 'MEASUREMENT SHEET'}
            </span>
            {lastSavedAt && (
              <span className="badge bg-success bg-opacity-75 text-white extra-small text-uppercase d-none d-md-inline-block">
                <i className="bi bi-cloud-check me-1"></i>SAVED {formatSavedTime(lastSavedAt)}
              </span>
            )}
          </div>

          {/* Action Buttons Group */}
          <div className="d-flex align-items-center flex-wrap gap-2">
            {/* Billing Mode Toggle */}
            <div className="form-check form-switch text-white me-1 mb-0 d-flex align-items-center">
              <input
                className="form-check-input me-2"
                type="checkbox"
                role="switch"
                id="billingModeSwitch"
                checked={settings.billingMode}
                disabled={readOnly}
                onChange={(e) => onToggleBillingMode(e.target.checked)}
              />
              <label className="form-check-label extra-small fw-bold text-uppercase" htmlFor="billingModeSwitch">
                <i className="bi bi-cash-stack me-1 text-warning"></i>
                <span className="d-none d-sm-inline">RA BILL / </span>RATES
              </label>
            </div>

            {/* SAVE BUTTON */}
            {!readOnly && (
              <button
                type="button"
                className="btn btn-sm btn-success fw-bold text-uppercase d-flex align-items-center gap-1 shadow-sm px-3"
                onClick={onSave}
                disabled={isSaving}
                title="Save changes to MongoDB Atlas Cloud"
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>SAVING...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up-fill"></i>
                    <span>SAVE</span>
                  </>
                )}
              </button>
            )}

            {/* + Add Area */}
            {!readOnly && (
              <button 
                type="button" 
                className="btn btn-sm btn-primary fw-bold text-uppercase d-flex align-items-center gap-1"
                onClick={onAddNewArea}
                title="Add a new room or area group"
              >
                <i className="bi bi-plus-circle-fill"></i>
                <span>+ ADD AREA</span>
              </button>
            )}

            {/* Print / PDF View */}
            <button 
              type="button" 
              className="btn btn-sm btn-warning text-dark fw-bold text-uppercase d-flex align-items-center gap-1"
              onClick={onOpenPrintView}
              title="Switch to Contractor Print / PDF Sheet view"
            >
              <i className="bi bi-printer-fill"></i>
              <span className="d-none d-sm-inline">{isPrintView ? 'EDIT VIEW' : 'PRINT / PDF'}</span>
            </button>

            {/* Export Excel */}
            <button 
              type="button" 
              className="btn btn-sm btn-outline-light text-white fw-bold text-uppercase d-flex align-items-center gap-1"
              onClick={onExportExcel}
              title="Download Excel spreadsheet (.xlsx)"
            >
              <i className="bi bi-file-earmark-excel-fill text-success"></i>
              <span className="d-none d-md-inline">EXCEL</span>
            </button>

            {/* Clear All */}
            {!readOnly && (
              <button 
                type="button" 
                className="btn btn-sm btn-outline-danger fw-bold text-uppercase d-flex align-items-center gap-1"
                onClick={onResetSheet}
                title="Clear all inputs and reset to empty/null values"
              >
                <i className="bi bi-trash3"></i>
                <span className="d-none d-lg-inline">CLEAR</span>
              </button>
            )}

            {/* Mobile Project Info Toggle */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-white d-md-none fw-bold text-uppercase px-2"
              onClick={() => setShowDetails(!showDetails)}
              title={showDetails ? 'Hide Project Details' : 'Show Project Details'}
            >
              <i className={`bi ${showDetails ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Global Metadata Form (Responsive Collapsible on Mobile) */}
      {showDetails && (
        <div className="container-fluid py-3 px-3 px-md-4 bg-light-subtle">
          <div className="row g-2 g-md-3 align-items-center">
          {/* Contractor Name */}
          <div className="col-12 col-md-3 col-lg-2">
            <label className="form-label text-secondary small fw-bold mb-1">
              <i className="bi bi-building me-1"></i> Contractor / Agency
            </label>
            <input
              type="text"
              className="form-control form-control-sm fw-bold border-secondary-subtle"
              placeholder="e.g. MTS DECOR"
              value={headerData.contractorName || ''}
              onChange={(e) => handleChange('contractorName', e.target.value)}
            />
          </div>

          {/* Project Name */}
          <div className="col-12 col-md-3 col-lg-3">
            <label className="form-label text-secondary small fw-bold mb-1">
              <i className="bi bi-geo-alt-fill me-1 text-danger"></i> Project Name
            </label>
            <input
              type="text"
              className="form-control form-control-sm fw-semibold"
              placeholder="e.g. PARK CREST"
              value={headerData.projectName || ''}
              onChange={(e) => handleChange('projectName', e.target.value)}
            />
          </div>

          {/* Measurement Sheet No. */}
          <div className="col-6 col-md-2 col-lg-2">
            <label className="form-label text-secondary small fw-bold mb-1">
              <i className="bi bi-hash me-1"></i> Sheet / RA No.
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. MS/PC-08/2025"
              value={headerData.sheetNo || ''}
              onChange={(e) => handleChange('sheetNo', e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="col-6 col-md-2 col-lg-2">
            <label className="form-label text-secondary small fw-bold mb-1">
              <i className="bi bi-calendar3 me-1"></i> Date
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={headerData.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>

          {/* Client / Owner Name */}
          <div className="col-12 col-md-2 col-lg-3">
            <label className="form-label text-secondary small fw-bold mb-1">
              <i className="bi bi-person-check me-1"></i> Client / Employer
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Client / PMC Name"
              value={headerData.clientName || ''}
              onChange={(e) => handleChange('clientName', e.target.value)}
            />
          </div>

          {/* Prepared By & Checked By */}
          <div className="col-6 col-md-3 col-lg-3">
            <label className="form-label text-secondary small fw-bold mb-1">
              <i className="bi bi-person-badge me-1"></i> Prepared By
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Surveyor / Site Engineer"
              value={headerData.preparedBy || ''}
              onChange={(e) => handleChange('preparedBy', e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3 col-lg-3">
            <label className="form-label text-secondary small fw-bold mb-1">
              <i className="bi bi-shield-check me-1 text-success"></i> Checked / Approved By
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Project Manager / Consultant"
              value={headerData.checkedBy || ''}
              onChange={(e) => handleChange('checkedBy', e.target.value)}
            />
          </div>

          {/* Tax % if billing mode */}
          {settings.billingMode && (
            <div className="col-12 col-md-6 col-lg-6">
              <div className="d-flex align-items-center gap-3 bg-white p-2 rounded border border-warning-subtle">
                <span className="small fw-bold text-dark">
                  <i className="bi bi-percent text-warning me-1"></i> RA Bill Tax / GST:
                </span>
                <div className="input-group input-group-sm w-auto">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    style={{ maxWidth: '80px' }}
                    value={settings.taxPercent || 0}
                    onChange={(e) => onToggleBillingMode(true, parseFloat(e.target.value) || 0)}
                  />
                  <span className="input-group-text">%</span>
                </div>
                <span className="text-muted small">
                  Auto-applies to net payable amount
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </header>
  );
}
