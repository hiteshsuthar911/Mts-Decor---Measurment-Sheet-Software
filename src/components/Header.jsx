import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

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
  onUndo = () => {},
  onRedo = () => {},
  canUndo = false,
  canRedo = false,
  onDuplicateProject = () => {},
  onOpenRateMaster,
  onOpenEngineerReview,
  pendingEngineerQueriesCount = 0,
  onOpenClientApproval,
  clientApproval,
}) {
  const [showDetails, setShowDetails] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

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
              src="/mtsdecor.png"
              alt="MTS"
              className="ms-brand-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="ms-brand-pill">MS PRO</span>
          </Link>

          <div className="ms-vsep" />

          {/* Project name + owner context */}
          <div className="ms-proj-info">
            <span className="ms-proj-name">
              {headerData.projectName || 'MEASUREMENT SHEET'}
            </span>
            {(headerData.projectName || '').includes('(COPY)') && (
              <span className="badge bg-warning text-dark extra-small fw-bold ms-1" style={{ fontSize: '10px' }} title="You are viewing a duplicate copy of this project">
                <i className="bi bi-copy me-1" />COPY
              </span>
            )}
            {!isOwn && (
              <span className="ms-owner-chip d-none d-sm-inline-flex">
                <i className="bi bi-eye-fill" />
                {ownerName?.toUpperCase()}
              </span>
            )}
            {isOwn && (
              <span className="ms-mine-chip d-none d-sm-inline-flex">
                <i className="bi bi-folder-fill" /> MINE
              </span>
            )}
          </div>

          {/* Save status pill (compact / hidden on small mobile) */}
          {(lastSavedAt || isSaving) && (
            <div className={`ms-save-pill d-none d-md-inline-flex ${isSaving ? 'ms-save-pill--saving' : ''}`}>
              {isSaving ? (
                <><span className="ms-spin" /> Saving…</>
              ) : (
                <><i className="bi bi-cloud-check-fill" /> {formatSavedTime(lastSavedAt)}</>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Action buttons */}
        <div className="ms-tr">
          {/* Save Button — Always Accessible & High Priority */}
          {!readOnly && (
            <button
              className="ms-btn ms-btn-save shadow-sm"
              onClick={onSave}
              disabled={isSaving}
              title="Save to Cloud"
            >
              {isSaving ? <span className="ms-spin ms-spin-sm" /> : <i className="bi bi-cloud-arrow-up-fill" />}
              <span>SAVE</span>
            </button>
          )}

          {/* Add Area Button — Always Accessible */}
          {!readOnly && (
            <button className="ms-btn ms-btn-add shadow-sm" onClick={onAddNewArea} title="Add new area">
              <i className="bi bi-plus-lg" />
              <span className="d-none d-sm-inline">ADD AREA</span>
            </button>
          )}

          {/* Undo / Redo — Always Accessible */}
          {!readOnly && (
            <div className="d-flex align-items-center gap-1">
              <button
                className="ms-btn ms-btn-ghost"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z / Cmd+Z)"
                style={{
                  opacity: canUndo ? 1 : 0.4,
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  padding: '5px 7px',
                }}
              >
                <i className="bi bi-arrow-counterclockwise" style={{ fontSize: '13px' }} />
              </button>
              <button
                className="ms-btn ms-btn-ghost"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y / Cmd+Y)"
                style={{
                  opacity: canRedo ? 1 : 0.4,
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  padding: '5px 7px',
                }}
              >
                <i className="bi bi-arrow-clockwise" style={{ fontSize: '13px' }} />
              </button>
            </div>
          )}

          {/* PRIMARY SETTINGS / TOOLS BUTTON — 1-Click Access to ALL Settings on Mobile & Desktop */}
          <button
            type="button"
            className={`ms-btn ${showSettingsPanel ? 'btn-dark text-white' : 'ms-btn-ghost'} position-relative fw-bold shadow-sm`}
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            title="Open all sheet settings, tools & exports"
          >
            <i className="bi bi-gear-fill text-success" />
            <span className="d-none d-sm-inline">SETTINGS</span>
            <span className="d-inline d-sm-none">SET</span>
            {pendingEngineerQueriesCount > 0 && (
              <span
                className="position-absolute badge rounded-pill bg-danger"
                style={{ top: '-4px', right: '-4px', fontSize: '9px', padding: '2px 5px' }}
              >
                {pendingEngineerQueriesCount}
              </span>
            )}
            <i className={`bi bi-chevron-${showSettingsPanel ? 'up' : 'down'} ms-1 d-none d-sm-inline`} style={{ fontSize: '10px' }} />
          </button>

          {/* ── DESKTOP SHORTCUTS (Visible on Wide Monitors) ── */}
          <div className="d-none d-xl-flex align-items-center gap-1">
            <div className="ms-vsep" />

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
                <span> RA BILL</span>
              </span>
            </label>

            {/* Print */}
            <button className="ms-btn ms-btn-ghost" onClick={onOpenPrintView} title={isPrintView ? 'Back to Edit' : 'Print / PDF'}>
              <i className={`bi ${isPrintView ? 'bi-pencil-square text-primary' : 'bi-printer-fill'}`} />
              <span>{isPrintView ? 'EDIT' : 'PRINT'}</span>
            </button>

            {/* Excel */}
            <button className="ms-btn ms-btn-ghost" onClick={onExportExcel} title="Export to Microsoft Excel (.xlsx)">
              <i className="bi bi-file-earmark-excel-fill" style={{ color: '#107c41', fontSize: '13px' }} />
              <span className="text-success fw-bold">EXCEL</span>
            </button>

            {/* Site Engineer */}
            {onOpenEngineerReview && (
              <button
                className={`ms-btn ms-btn-ghost position-relative ${pendingEngineerQueriesCount > 0 ? 'border-warning text-warning fw-bold bg-warning-subtle' : 'text-primary'}`}
                onClick={onOpenEngineerReview}
                title="Site Engineer Review & Measurement Queries"
              >
                <i className="bi bi-person-badge-fill" />
                <span>ENGINEER</span>
                {pendingEngineerQueriesCount > 0 && (
                  <span
                    className="position-absolute badge rounded-pill bg-danger"
                    style={{ top: '-4px', right: '-4px', fontSize: '9px', padding: '2px 5px' }}
                  >
                    {pendingEngineerQueriesCount}
                  </span>
                )}
              </button>
            )}

            {/* Client Approval */}
            {onOpenClientApproval && (
              <button
                className={`ms-btn ms-btn-ghost ${clientApproval?.approved ? 'border-success text-success fw-bold bg-success-subtle' : ''}`}
                onClick={onOpenClientApproval}
                title={clientApproval?.approved ? `Approved by ${clientApproval.signerName}` : 'Client Digital Sign-Off & Seal'}
              >
                <i className={`bi ${clientApproval?.approved ? 'bi-patch-check-fill text-success' : 'bi-shield-check text-muted'}`} />
                <span>{clientApproval?.approved ? 'APPROVED' : 'SIGN-OFF'}</span>
              </button>
            )}

            {/* Clear */}
            {!readOnly && (
              <button className="ms-btn ms-btn-danger" onClick={onResetSheet} title="Clear all data">
                <i className="bi bi-trash3" />
              </button>
            )}

            <div className="ms-vsep" />
            <ThemeToggle />
            <div className="ms-vsep" />

            {/* Profile */}
            <Link to="/profile" className="ms-btn ms-btn-ghost" title="Profile">
              <i className="bi bi-person-circle" />
            </Link>

            {/* Projects */}
            <Link to="/projects" className="ms-btn ms-btn-ghost" title="My Projects">
              <i className="bi bi-grid-3x3-gap-fill" />
            </Link>

            {/* Logout */}
            <button className="ms-btn ms-btn-logout" onClick={onLogout} title="Logout">
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          EXCEL QUICK TOOLS & SETTINGS PANEL (Responsive Grid)
      ══════════════════════════════════════════════════ */}
      {showSettingsPanel && (
        <div className="ms-tools-panel p-3 bg-white border-bottom shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success text-white px-2 py-1 fw-bold">EXCEL TOOLS</span>
              <span className="fw-bold text-dark extra-small text-uppercase">
                All Sheet Settings &amp; Actions
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-light border py-1 px-2.5 extra-small fw-bold d-flex align-items-center gap-1"
              onClick={() => setShowSettingsPanel(false)}
            >
              <i className="bi bi-x-lg"></i>
              <span>Close</span>
            </button>
          </div>

          <div className="row g-2 align-items-stretch">
            {/* RA Bill Mode */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="p-2.5 border rounded-3 bg-light d-flex align-items-center justify-content-between h-100 shadow-sm">
                <div>
                  <div className="extra-small fw-bold text-dark d-flex align-items-center gap-1">
                    <i className="bi bi-cash-stack text-warning fs-6"></i>
                    <span>RA Bill / Rates</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    {settings.billingMode ? 'Active (Rates & GST enabled)' : 'Measurements Only'}
                  </div>
                </div>
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.billingMode}
                    disabled={readOnly}
                    onChange={(e) => onToggleBillingMode(e.target.checked)}
                    style={{ cursor: 'pointer', width: '38px', height: '20px' }}
                  />
                </div>
              </div>
            </div>

            {/* Export to Excel */}
            <div className="col-6 col-sm-6 col-md-4 col-lg-3">
              <button
                type="button"
                className="btn btn-outline-success btn-sm w-100 h-100 p-2.5 rounded-3 text-start shadow-sm d-flex align-items-center gap-2"
                onClick={() => { onExportExcel(); setShowSettingsPanel(false); }}
              >
                <i className="bi bi-file-earmark-excel-fill text-success fs-4"></i>
                <div>
                  <div className="fw-bold text-dark extra-small">Export Excel</div>
                  <div className="text-muted" style={{ fontSize: '10px' }}>Download .xlsx Sheet</div>
                </div>
              </button>
            </div>

            {/* Print / PDF */}
            <div className="col-6 col-sm-6 col-md-4 col-lg-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 h-100 p-2.5 rounded-3 text-start shadow-sm d-flex align-items-center gap-2"
                onClick={() => { onOpenPrintView(); setShowSettingsPanel(false); }}
              >
                <i className={`bi ${isPrintView ? 'bi-pencil-square text-primary' : 'bi-printer-fill text-dark'} fs-4`}></i>
                <div>
                  <div className="fw-bold text-dark extra-small">{isPrintView ? 'Edit Sheet' : 'Print / PDF'}</div>
                  <div className="text-muted" style={{ fontSize: '10px' }}>Official Contractor Bill</div>
                </div>
              </button>
            </div>

            {/* Site Engineer Queries */}
            {onOpenEngineerReview && (
              <div className="col-6 col-sm-6 col-md-4 col-lg-3">
                <button
                  type="button"
                  className={`btn ${pendingEngineerQueriesCount > 0 ? 'btn-outline-warning border-warning bg-warning-subtle' : 'btn-outline-primary'} btn-sm w-100 h-100 p-2.5 rounded-3 text-start position-relative shadow-sm d-flex align-items-center gap-2`}
                  onClick={() => { onOpenEngineerReview(); setShowSettingsPanel(false); }}
                >
                  <i className="bi bi-person-badge-fill text-warning fs-4"></i>
                  <div>
                    <div className="fw-bold text-dark extra-small">Site Engineer</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>
                      {pendingEngineerQueriesCount > 0 ? `${pendingEngineerQueriesCount} Queries Pending` : 'Review & Queries'}
                    </div>
                  </div>
                  {pendingEngineerQueriesCount > 0 && (
                    <span className="position-absolute top-0 end-0 badge rounded-pill bg-danger m-1">
                      {pendingEngineerQueriesCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Client Digital Sign-Off */}
            {onOpenClientApproval && (
              <div className="col-6 col-sm-6 col-md-4 col-lg-3">
                <button
                  type="button"
                  className={`btn ${clientApproval?.approved ? 'btn-outline-success bg-success-subtle' : 'btn-outline-secondary'} btn-sm w-100 h-100 p-2.5 rounded-3 text-start shadow-sm d-flex align-items-center gap-2`}
                  onClick={() => { onOpenClientApproval(); setShowSettingsPanel(false); }}
                >
                  <i className={`bi ${clientApproval?.approved ? 'bi-patch-check-fill text-success' : 'bi-shield-check text-muted'} fs-4`}></i>
                  <div>
                    <div className="fw-bold text-dark extra-small">Client Approval</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>
                      {clientApproval?.approved ? `Approved by ${clientApproval.signerName}` : 'Digital Sign-Off Seal'}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Contractor Rate Master */}
            {onOpenRateMaster && (
              <div className="col-6 col-sm-6 col-md-4 col-lg-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100 h-100 p-2.5 rounded-3 text-start shadow-sm d-flex align-items-center gap-2"
                  onClick={() => { onOpenRateMaster(); setShowSettingsPanel(false); }}
                >
                  <i className="bi bi-cash-coin text-warning fs-4"></i>
                  <div>
                    <div className="fw-bold text-dark extra-small">Rate Master</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>Standard Contractor Rates</div>
                  </div>
                </button>
              </div>
            )}

            {/* Mobile Field Mode */}
            {!readOnly && (
              <div className="col-6 col-sm-6 col-md-4 col-lg-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100 h-100 p-2.5 rounded-3 text-start shadow-sm d-flex align-items-center gap-2"
                  onClick={() => { onOpenQuickMeasure(); setShowSettingsPanel(false); }}
                >
                  <i className="bi bi-phone-fill text-info fs-4"></i>
                  <div>
                    <div className="fw-bold text-dark extra-small">Field Mode</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>Quick Tape Measurement</div>
                  </div>
                </button>
              </div>
            )}

            {/* Duplicate Project */}
            <div className="col-6 col-sm-6 col-md-4 col-lg-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 h-100 p-2.5 rounded-3 text-start shadow-sm d-flex align-items-center gap-2"
                onClick={() => { onDuplicateProject(); setShowSettingsPanel(false); }}
              >
                <i className="bi bi-files text-secondary fs-4"></i>
                <div>
                  <div className="fw-bold text-dark extra-small">Duplicate File</div>
                  <div className="text-muted" style={{ fontSize: '10px' }}>Save Project Copy</div>
                </div>
              </button>
            </div>

            {/* Clear All Sheet Data */}
            {!readOnly && (
              <div className="col-6 col-sm-6 col-md-4 col-lg-3">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm w-100 h-100 p-2.5 rounded-3 text-start shadow-sm d-flex align-items-center gap-2"
                  onClick={() => { onResetSheet(); setShowSettingsPanel(false); }}
                >
                  <i className="bi bi-trash3-fill text-danger fs-4"></i>
                  <div>
                    <div className="fw-bold text-danger extra-small">Clear Sheet</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>Reset Measurement Rows</div>
                  </div>
                </button>
              </div>
            )}

            {/* App Theme Toggle */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="p-2.5 border rounded-3 bg-light d-flex align-items-center justify-content-between h-100 shadow-sm">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-brightness-high-fill text-secondary fs-4"></i>
                  <div>
                    <div className="fw-bold text-dark extra-small">App Theme</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>Light / Dark Mode</div>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* My Projects & Logout */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex gap-2">
              <Link
                to="/projects"
                className="btn btn-light border btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 extra-small fw-bold py-2 shadow-sm"
              >
                <i className="bi bi-grid-3x3-gap-fill text-primary"></i>
                <span>My Projects</span>
              </Link>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm extra-small fw-bold px-3 py-2 shadow-sm"
                onClick={onLogout}
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

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
            <i className="bi bi-card-heading d-none d-sm-inline" />
            <span className="ms-ttext">Project Info</span>
          </button>

          <button
            className={`ms-tab ${activeSection === 'measurements' ? 'ms-tab-on ms-tab-sheet' : ''}`}
            onClick={() => onChangeSection('measurements')}
          >
            <span className="ms-tnum">2</span>
            <i className="bi bi-grid-3x3-gap-fill d-none d-sm-inline" />
            <span className="ms-ttext">Measurements</span>
            {areasCount > 0 && <span className="ms-tcount">{areasCount}</span>}
          </button>

          <button
            className={`ms-tab ${activeSection === 'summary' ? 'ms-tab-on ms-tab-sum' : ''}`}
            onClick={() => onChangeSection('summary')}
          >
            <span className="ms-tnum">3</span>
            <i className="bi bi-pie-chart-fill d-none d-sm-inline" />
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

        <div className="ms-tabbar-end d-none d-md-flex align-items-center gap-2">
          <button
            type="button"
            className={`ms-btn ${showSettingsPanel ? 'btn-dark text-white' : 'ms-btn-ghost'} py-1 px-2.5 rounded`}
            style={{ height: '27px', fontSize: '10.5px' }}
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            title="Open all sheet settings & tools"
          >
            <i className="bi bi-gear-fill text-success me-1" />
            <span className="fw-bold">Settings</span>
            {pendingEngineerQueriesCount > 0 && (
              <span className="badge rounded-pill bg-danger ms-1" style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                {pendingEngineerQueriesCount}
              </span>
            )}
          </button>

          {showMetadataForm && (
            <button
              type="button"
              className="ms-btn ms-btn-ghost py-1 px-2.5 rounded text-secondary"
              style={{ height: '27px', fontSize: '10.5px' }}
              onClick={() => setShowDetails(!showDetails)}
              title={showDetails ? 'Hide Project Details Formula Panel' : 'Show Project Details Formula Panel'}
            >
              <i className="bi bi-layout-text-window-reverse text-primary me-1" />
              <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'} ms-1`} />
            </button>
          )}

          <span className="ms-page-pill d-none d-md-inline-flex">
            {activeSection === 'info' && <><i className="bi bi-1-circle-fill text-primary" /> PROJECT INFO</>}
            {activeSection === 'measurements' && <><i className="bi bi-2-circle-fill text-success" /> MEASUREMENTS</>}
            {activeSection === 'summary' && <><i className="bi bi-3-circle-fill text-warning" /> SUMMARY</>}
            {activeSection === 'all' && <><i className="bi bi-layout-split text-info" /> ALL SECTIONS</>}
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
              <label className="ms-flabel"><i className="bi bi-layers-fill me-1" style={{color:'#38bdf8'}} />Floor No.</label>
              <input className="ms-finput" type="text" placeholder="e.g. 1st Floor"
                value={headerData.floorNo || headerData.floor || ''}
                onChange={(e) => {
                  handleChange('floorNo', e.target.value);
                  handleChange('floor', e.target.value);
                }}
                readOnly={readOnly}
              />
            </div>

            <div className="col-6 col-md-2 col-lg-2">
              <label className="ms-flabel"><i className="bi bi-door-closed-fill me-1" style={{color:'#a78bfa'}} />Flat / Unit No.</label>
              <input className="ms-finput" type="text" placeholder="e.g. Flat 101"
                value={headerData.flatNo || headerData.flat || ''}
                onChange={(e) => {
                  handleChange('flatNo', e.target.value);
                  handleChange('flat', e.target.value);
                }}
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
