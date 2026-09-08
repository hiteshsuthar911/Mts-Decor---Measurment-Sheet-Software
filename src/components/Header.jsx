import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header({
  headerData = {},
  onChangeHeader,
  settings = {},
  onToggleBillingMode,
  onResetSheet,
  onExportExcel,
  onOpenPrintView,
  onAddNewArea,
  onOpenQuickMeasure,
  onSave,
  isSaving,
  lastSavedAt,
  isPrintView,
  readOnly,
  activeSection = 'measurements',
  onChangeSection = () => {},
  areasCount = 0,
  grandTotals = {},
  showMetadataForm = true,
  session = {},
  isOwn = true,
  ownerName = '',
  onLogout = () => {},
}) {
  const [showDetails, setShowDetails] = useState(true);

  const handleChange = (field, value) => {
    onChangeHeader({ ...headerData, [field]: value });
  };

  const formatSavedTime = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <header className="ms-header no-print">

      {/* ══════════════════════════════════════════════════
          ROW 1 — SINGLE UNIFIED TOOLBAR
      ══════════════════════════════════════════════════ */}
      <div className="ms-toolbar">

        {/* LEFT: Brand → Divider → Project + Save Pill */}
        <div className="ms-tl">
          {/* Logo / Brand */}
          <Link to="/projects" className="ms-brand" title="Back to Projects">
            <img
              src={session.company?.logo || '/mtsdecor.png'}
              alt={session.company?.name || 'MTS'}
              className="ms-brand-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="ms-brand-pill">{session.company?.name || 'MS PRO'}</span>
          </Link>

          <div className="ms-vsep" />

          {/* Project name + owner context */}
          <div className="ms-proj-info">
            <span className="ms-proj-name">
              {headerData.projectName || 'MEASUREMENT SHEET'}
            </span>
            {!isOwn && (
              <span className="ms-owner-chip">
                <i className="bi bi-eye-fill" />
                {ownerName?.toUpperCase()}
              </span>
            )}
            {isOwn && (
              <span className="ms-mine-chip">
                <i className="bi bi-folder-fill" /> MINE
              </span>
            )}
          </div>

          {/* Save status pill */}
          {(lastSavedAt || isSaving) && (
            <div className={`ms-save-pill ${isSaving ? 'ms-save-pill--saving' : ''}`}>
              {isSaving ? (
                <><span className="ms-spin" /> Saving…</>
              ) : (
                <><i className="bi bi-cloud-check-fill" /> {formatSavedTime(lastSavedAt)}</>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: All action buttons */}
        <div className="ms-tr">

          {/* RA Bill Toggle */}
          <label className="ms-toggle" title="Toggle RA Bill / Rate mode">
            <input
              type="checkbox"
              checked={settings.billingMode}
              disabled={readOnly}
              onChange={(e) => onToggleBillingMode(e.target.checked)}
            />
            <span className="ms-track"><span className="ms-thumb" /></span>
            <span className="ms-tlbl">
              <i className="bi bi-cash-stack" />
              <span className="d-none d-lg-inline"> RA BILL</span>
            </span>
          </label>

          <div className="ms-vsep" />

          {/* Save */}
          {!readOnly && (
            <button className="ms-btn ms-btn-save" onClick={onSave} disabled={isSaving} title="Save to Cloud">
              {isSaving ? <span className="ms-spin ms-spin-sm" /> : <i className="bi bi-cloud-arrow-up-fill" />}
              <span>SAVE</span>
            </button>
          )}

          {/* Add Area */}
          {!readOnly && (
            <button className="ms-btn ms-btn-add" onClick={onAddNewArea} title="Add new area">
              <i className="bi bi-plus-lg" />
              <span className="d-none d-sm-inline">ADD AREA</span>
            </button>
          )}

          {/* Field Mode */}
          {!readOnly && (
            <button className="ms-btn ms-btn-field" onClick={onOpenQuickMeasure} title="Mobile field mode">
              <i className="bi bi-phone-fill" />
              <span className="d-none d-xl-inline">FIELD</span>
            </button>
          )}

          <div className="ms-vsep" />

          {/* Print */}
          <button className="ms-btn ms-btn-ghost" onClick={onOpenPrintView} title={isPrintView ? 'Back to Edit' : 'Print / PDF'}>
            <i className={`bi ${isPrintView ? 'bi-pencil-square' : 'bi-printer-fill'}`} />
            <span className="d-none d-lg-inline">{isPrintView ? 'EDIT' : 'PRINT'}</span>
          </button>

          {/* Excel */}
          <button className="ms-btn ms-btn-ghost" onClick={onExportExcel} title="Export Excel">
            <i className="bi bi-file-earmark-excel-fill" style={{ color: '#4ade80' }} />
            <span className="d-none d-xl-inline">EXCEL</span>
          </button>

          {/* Clear */}
          {!readOnly && (
            <button className="ms-btn ms-btn-danger" onClick={onResetSheet} title="Clear all data">
              <i className="bi bi-trash3" />
            </button>
          )}

          <div className="ms-vsep" />

          {/* Profile */}
          <Link to="/profile" className="ms-btn ms-btn-ghost" title="Profile">
            <i className="bi bi-person-circle" />
            <span className="d-none d-xl-inline">{session?.name?.split(' ')[0] || 'PROFILE'}</span>
          </Link>

          {/* Projects */}
          <Link to="/projects" className="ms-btn ms-btn-ghost" title="My Projects">
            <i className="bi bi-grid-3x3-gap-fill" />
          </Link>

          {/* Logout */}
          <button className="ms-btn ms-btn-logout" onClick={onLogout} title="Logout">
            <i className="bi bi-box-arrow-right" />
          </button>

          {/* Mobile details toggle (only when metadata form shown) */}
          {showMetadataForm && (
            <button className="ms-btn ms-btn-ghost d-md-none" onClick={() => setShowDetails(!showDetails)}>
              <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'}`} />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          ROW 2 — SECTION TAB BAR
      ══════════════════════════════════════════════════ */}
      <div className="ms-tabbar">
        <div className="ms-tabs">

          <button
            className={`ms-tab ${activeSection === 'info' ? 'ms-tab-on ms-tab-info' : ''}`}
            onClick={() => onChangeSection('info')}
          >
            <span className="ms-tnum">1</span>
            <i className="bi bi-card-heading" />
            <span className="ms-ttext">Project Info</span>
          </button>

          <button
            className={`ms-tab ${activeSection === 'measurements' ? 'ms-tab-on ms-tab-sheet' : ''}`}
            onClick={() => onChangeSection('measurements')}
          >
            <span className="ms-tnum">2</span>
            <i className="bi bi-grid-3x3-gap-fill" />
            <span className="ms-ttext">Measurements</span>
            {areasCount > 0 && <span className="ms-tcount">{areasCount}</span>}
          </button>

          <button
            className={`ms-tab ${activeSection === 'summary' ? 'ms-tab-on ms-tab-sum' : ''}`}
            onClick={() => onChangeSection('summary')}
          >
            <span className="ms-tnum">3</span>
            <i className="bi bi-pie-chart-fill" />
            <span className="ms-ttext">Summary</span>
          </button>

          <button
            className={`ms-tab ms-tab-all ${activeSection === 'all' ? 'ms-tab-on ms-tab-all-on' : ''}`}
            onClick={() => onChangeSection('all')}
            title="View all 3 sections"
          >
            <i className="bi bi-layout-split" />
            <span className="ms-ttext d-none d-sm-inline">All</span>
          </button>
        </div>

        <div className="ms-tabbar-end d-none d-md-flex align-items-center">
          <span className="ms-page-pill">
            {activeSection === 'info' && <><i className="bi bi-1-circle-fill" /> PROJECT INFO</>}
            {activeSection === 'measurements' && <><i className="bi bi-2-circle-fill" /> MEASUREMENTS</>}
            {activeSection === 'summary' && <><i className="bi bi-3-circle-fill" /> SUMMARY</>}
            {activeSection === 'all' && <><i className="bi bi-layout-split" /> ALL SECTIONS</>}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          ROW 3 — METADATA FORM (Page 1 / View All only)
      ══════════════════════════════════════════════════ */}
      {showMetadataForm && showDetails && (
        <div className="ms-meta-panel">
          <div className="row g-2 g-md-3 align-items-end">

            <div className="col-6 col-md-3 col-lg-2">
              <label className="ms-flabel"><i className="bi bi-building me-1" />Contractor</label>
              <input className="ms-finput" type="text" placeholder="e.g. MTS DECOR"
                value={headerData.contractorName || ''}
                onChange={(e) => handleChange('contractorName', e.target.value)}
                readOnly={readOnly}
              />
            </div>

            <div className="col-6 col-md-3 col-lg-3">
              <label className="ms-flabel"><i className="bi bi-geo-alt-fill me-1" style={{color:'#f87171'}} />Project Name</label>
              <input className="ms-finput ms-finput-bold" type="text" placeholder="e.g. PARK CREST TOWER A"
                value={headerData.projectName || ''}
                onChange={(e) => handleChange('projectName', e.target.value)}
                readOnly={readOnly}
              />
            </div>

            <div className="col-6 col-md-2 col-lg-2">
              <label className="ms-flabel"><i className="bi bi-hash me-1" />Sheet / RA No.</label>
              <input className="ms-finput" type="text" placeholder="MS/01/2025"
                value={headerData.sheetNo || ''}
                onChange={(e) => handleChange('sheetNo', e.target.value)}
                readOnly={readOnly}
              />
            </div>

            <div className="col-6 col-md-2 col-lg-2">
              <label className="ms-flabel"><i className="bi bi-calendar3 me-1" />Date</label>
              <input className="ms-finput" type="date"
                value={headerData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
                readOnly={readOnly}
              />
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <label className="ms-flabel"><i className="bi bi-person-check me-1" />Client / Employer</label>
              <input className="ms-finput" type="text" placeholder="Client / PMC"
                value={headerData.clientName || ''}
                onChange={(e) => handleChange('clientName', e.target.value)}
                readOnly={readOnly}
              />
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <label className="ms-flabel"><i className="bi bi-shield-check me-1" style={{color:'#4ade80'}} />Checked & Approved By</label>
              <input className="ms-finput" type="text" placeholder="e.g. BALAN SIR"
                value={headerData.checkedBy || ''}
                onChange={(e) => handleChange('checkedBy', e.target.value)}
                readOnly={readOnly}
              />
            </div>

            {settings.billingMode && (
              <div className="col-12 col-md-4 col-lg-3">
                <label className="ms-flabel"><i className="bi bi-percent me-1" style={{color:'#fbbf24'}} />GST / Tax %</label>
                <div className="d-flex align-items-center gap-2">
                  <input className="ms-finput" type="number" min="0" max="100"
                    style={{ maxWidth: '80px' }}
                    value={settings.taxPercent || 0}
                    onChange={(e) => onToggleBillingMode(true, parseFloat(e.target.value) || 0)}
                  />
                  <span className="ms-addon">%</span>
                  <span className="ms-hint">applied to net</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
