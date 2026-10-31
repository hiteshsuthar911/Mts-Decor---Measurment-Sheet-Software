import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Calculator, 
  Server, 
  ShieldCheck, 
  Users, 
  FileSpreadsheet, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  DollarSign, 
  Zap, 
  HardDrive, 
  Globe, 
  Smartphone, 
  ArrowRight, 
  Mail, 
  Printer, 
  HelpCircle,
  BarChart3,
  Percent,
  Coins,
  Cpu
} from 'lucide-react';

export default function EnterpriseBlueprintPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // ── Calculator State ──
  const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const fxRate = currency === 'INR' ? 1 : 85;

  const [clientCount, setClientCount] = useState(50);
  const [monthlyFeePerCompany, setMonthlyFeePerCompany] = useState(2999);
  const [avgStaffPerCompany, setAvgStaffPerCompany] = useState(4);
  const [extraStaffFee, setExtraStaffFee] = useState(299); // per user above base 2
  const [serverHostingCost, setServerHostingCost] = useState(8500); // monthly Render + Atlas + Storage
  const [supportMaintenanceCost, setSupportMaintenanceCost] = useState(12000); // monthly support & dev reserve
  const [paymentGatewayPercent, setPaymentGatewayPercent] = useState(2.0); // 2% Razorpay / Stripe
  const [annualDiscountPercent, setAnnualDiscountPercent] = useState(15); // for annual prepays

  // ── Calculator Outputs ──
  const financials = useMemo(() => {
    // 1. Subscription Revenue
    const baseSubscriptionRevenue = clientCount * monthlyFeePerCompany;

    // 2. Add-on user revenue (assume 2 free users included, rest charged)
    const extraUsersPerCompany = Math.max(0, avgStaffPerCompany - 2);
    const addOnUserRevenue = clientCount * extraUsersPerCompany * extraStaffFee;

    const grossMonthlyRevenue = baseSubscriptionRevenue + addOnUserRevenue;
    const grossAnnualRevenue = grossMonthlyRevenue * 12 * (1 - (annualDiscountPercent / 100) * 0.4); // assume 40% pay annually with discount

    // 3. Operating Costs & Overhead
    // Scale hosting slightly with client growth (e.g. +₹120 per 10 clients for extra DB ops & storage)
    const scaledHostingCost = serverHostingCost + (clientCount > 20 ? (clientCount - 20) * 80 : 0);
    const paymentGatewayFee = grossMonthlyRevenue * (paymentGatewayPercent / 100);
    const totalMonthlyCost = scaledHostingCost + supportMaintenanceCost + paymentGatewayFee;
    const totalAnnualCost = totalMonthlyCost * 12;

    // 4. Net Profits & Margins
    const netMonthlyProfit = grossMonthlyRevenue - totalMonthlyCost;
    const netAnnualProfit = (grossMonthlyRevenue * 12) - totalAnnualCost;
    const profitMargin = grossMonthlyRevenue > 0 ? (netMonthlyProfit / grossMonthlyRevenue) * 100 : 0;

    // 5. Break-Even Analysis
    const avgRevenuePerCompany = grossMonthlyRevenue / (clientCount || 1);
    const fixedOverhead = scaledHostingCost + supportMaintenanceCost;
    const breakEvenClients = avgRevenuePerCompany > 0 
      ? Math.ceil(fixedOverhead / (avgRevenuePerCompany * (1 - paymentGatewayPercent / 100))) 
      : 0;

    return {
      grossMonthlyRevenue,
      grossAnnualRevenue,
      scaledHostingCost,
      paymentGatewayFee,
      totalMonthlyCost,
      netMonthlyProfit,
      netAnnualProfit,
      profitMargin,
      breakEvenClients,
      avgRevenuePerCompany
    };
  }, [
    clientCount, 
    monthlyFeePerCompany, 
    avgStaffPerCompany, 
    extraStaffFee, 
    serverHostingCost, 
    supportMaintenanceCost, 
    paymentGatewayPercent, 
    annualDiscountPercent
  ]);

  const applyPreset = (clients, fee, staff) => {
    setClientCount(clients);
    setMonthlyFeePerCompany(fee);
    setAvgStaffPerCompany(staff);
  };

  const formatMoney = (amount) => {
    if (currency === 'INR') {
      return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
    return `$${Math.round(amount / fxRate).toLocaleString('en-US')}`;
  };

  return (
    <div className="bg-slate-50 min-vh-100 text-slate-800" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── Top Navbar ── */}
      <header className="navbar navbar-expand-lg bg-white border-bottom shadow-xs sticky-top py-2.5">
        <div className="container-fluid px-3 px-md-4">
          <div className="d-flex align-items-center gap-2">
            <Link to="/projects" className="text-decoration-none d-flex align-items-center gap-2">
              <span className="badge bg-primary text-white p-2 rounded-3 shadow-xs">
                <Building2 size={20} />
              </span>
              <div>
                <strong className="text-dark fs-6 d-block lh-1">MTS PRO</strong>
                <span className="extra-small text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                  B2B SaaS &amp; Commercialization Roadmap
                </span>
              </div>
            </Link>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1.5"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              <span className="d-none d-sm-inline">Print / Save PDF</span>
            </button>
            <Link to="/projects" className="btn btn-primary btn-sm fw-bold px-3">
              Back to Software &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="bg-gradient text-white py-5 px-3" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a8a 100%)' }}>
        <div className="container-lg">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 rounded-pill px-3 py-1 mb-3 text-blue-200 extra-small fw-bold text-uppercase">
                <SparkleIcon /> Multi-Tenant B2B Architecture &amp; Commercial Model
              </div>
              <h1 className="fw-black display-6 text-white mb-2" style={{ letterSpacing: '-0.5px' }}>
                Transforming MTS Decor into a Multi-Company Enterprise SaaS
              </h1>
              <p className="text-slate-300 fs-6 mb-4" style={{ maxWidth: '720px', lineHeight: 1.6 }}>
                Comprehensive reference masterplan: requirements, tenant isolation architecture, five dedicated stakeholder portals, infrastructure maintenance costs, recurring pricing strategy, and real-time financial projections.
              </p>
              <div className="d-flex flex-wrap gap-2 text-white">
                <span className="badge bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 d-flex align-items-center gap-1.5">
                  <Server size={14} className="text-emerald-400" /> Multi-Tenant Isolation
                </span>
                <span className="badge bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 d-flex align-items-center gap-1.5">
                  <Layers size={14} className="text-blue-400" /> 5 Dedicated Portals
                </span>
                <span className="badge bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 d-flex align-items-center gap-1.5">
                  <Calculator size={14} className="text-amber-400" /> Live Revenue Calculator
                </span>
                <span className="badge bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 d-flex align-items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-400" /> Enterprise White-Labeling
                </span>
              </div>
            </div>

            {/* Quick KPI Teaser Box */}
            <div className="col-lg-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-4 shadow-lg text-white">
                <span className="extra-small text-uppercase fw-bold text-blue-200 d-block mb-1">Standard SaaS Model (At 50 Clients)</span>
                <div className="display-6 fw-bold text-emerald-300 mb-1">
                  {formatMoney(financials.grossMonthlyRevenue)}<span className="fs-6 fw-normal text-slate-300">/mo MRR</span>
                </div>
                <div className="fs-6 text-slate-300 mb-3">
                  Annual ARR: <strong className="text-white">{formatMoney(financials.grossAnnualRevenue)}</strong>
                </div>
                <div className="border-top border-white/10 pt-3 d-flex justify-content-between align-items-center extra-small text-slate-300">
                  <span>Net Profit Margin:</span>
                  <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 fw-bold px-2 py-1">
                    {financials.profitMargin.toFixed(1)}% NET
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigation Tabs ── */}
      <div className="bg-white border-bottom sticky-top shadow-2xs" style={{ top: '56px', zIndex: 1020 }}>
        <div className="container-lg">
          <ul className="nav nav-tabs border-0 flex-nowrap overflow-x-auto text-nowrap py-1">
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link border-0 fw-bold py-2.5 px-3.5 small d-flex align-items-center gap-2 ${activeTab === 'overview' ? 'active text-primary border-bottom border-primary border-3' : 'text-slate-600'}`}
                onClick={() => setActiveTab('overview')}
              >
                <Layers size={16} /> 1. System Requirements &amp; Architecture
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link border-0 fw-bold py-2.5 px-3.5 small d-flex align-items-center gap-2 ${activeTab === 'portals' ? 'active text-primary border-bottom border-primary border-3' : 'text-slate-600'}`}
                onClick={() => setActiveTab('portals')}
              >
                <Users size={16} /> 2. Five Dedicated Portals
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link border-0 fw-bold py-2.5 px-3.5 small d-flex align-items-center gap-2 ${activeTab === 'calculator' ? 'active text-primary border-bottom border-primary border-3' : 'text-slate-600'}`}
                onClick={() => setActiveTab('calculator')}
              >
                <Calculator size={16} /> 3. Live Financial Calculator
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link border-0 fw-bold py-2.5 px-3.5 small d-flex align-items-center gap-2 ${activeTab === 'pricing' ? 'active text-primary border-bottom border-primary border-3' : 'text-slate-600'}`}
                onClick={() => setActiveTab('pricing')}
              >
                <DollarSign size={16} /> 4. Packaging &amp; Pricing Tiers
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link border-0 fw-bold py-2.5 px-3.5 small d-flex align-items-center gap-2 ${activeTab === 'roadmap' ? 'active text-primary border-bottom border-primary border-3' : 'text-slate-600'}`}
                onClick={() => setActiveTab('roadmap')}
              >
                <TrendingUp size={16} /> 5. Step-by-Step Implementation
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Main Container ── */}
      <main className="container-lg py-4">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: ARCHITECTURE & REQUIREMENTS                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            
            {/* Core Blueprint Overview Card */}
            <div className="card border shadow-xs rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                  <Server className="text-primary" size={20} />
                  Core Architecture: How to Make the Software Accessible to Many Clients
                </h5>
                <p className="text-muted extra-small m-0 mt-1">
                  How a single unified codebase securely serves hundreds of independent contractor businesses with zero data leakage.
                </p>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-3 h-100">
                      <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-2">
                        <Globe size={18} />
                        <span>1. Multi-Tenant Routing</span>
                      </div>
                      <p className="text-slate-600 small mb-2" style={{ lineHeight: 1.5 }}>
                        How companies access their distinct workspaces:
                      </p>
                      <ul className="text-slate-700 extra-small ps-3 space-y-1 mb-0" style={{ lineHeight: 1.6 }}>
                        <li><strong>Path Routing (Current):</strong> <code>app.mtsdecor.com/company-slug</code> (Instant, no DNS setup needed).</li>
                        <li><strong>Subdomains:</strong> <code>apex-interiors.mtsdecor.com</code> (Automated wildcard SSL via Cloudflare).</li>
                        <li><strong>Custom Domains:</strong> <code>billing.clientdomain.com</code> (CNAME record for premium enterprise clients).</li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-3 h-100">
                      <div className="d-flex align-items-center gap-2 text-emerald-800 fw-bold mb-2">
                        <ShieldCheck size={18} />
                        <span>2. Tenant Data Isolation</span>
                      </div>
                      <p className="text-slate-600 small mb-2" style={{ lineHeight: 1.5 }}>
                        Zero-leakage security boundary:
                      </p>
                      <ul className="text-slate-700 extra-small ps-3 space-y-1 mb-0" style={{ lineHeight: 1.6 }}>
                        <li>Every MongoDB record carries mandatory <code>companySlug</code> and <code>companyId</code>.</li>
                        <li>Middleware enforces company scoping automatically on every query, so Company A can <strong>never</strong> see Company B's projects or files.</li>
                        <li>Daily automated encrypted backups to Google Drive / AWS S3 per tenant.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-3 h-100">
                      <div className="d-flex align-items-center gap-2 text-purple-800 fw-bold mb-2">
                        <Zap size={18} />
                        <span>3. White-Label Branding Engine</span>
                      </div>
                      <p className="text-slate-600 small mb-2" style={{ lineHeight: 1.5 }}>
                        Client gets their own customized software:
                      </p>
                      <ul className="text-slate-700 extra-small ps-3 space-y-1 mb-0" style={{ lineHeight: 1.6 }}>
                        <li>Custom company logo on PDFs, bills, Excel sheets, and top header.</li>
                        <li>Custom company GSTIN, office address, contact numbers, and letterheads.</li>
                        <li>Custom Civil Labour Rates master card preloaded for their firm.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Infrastructure Stack Table */}
                <div className="mt-4 pt-4 border-top">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <HardDrive size={18} className="text-slate-600" />
                    Recommended Cloud Infrastructure &amp; Technical Requirements
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle small mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Component</th>
                          <th>Recommended Provider</th>
                          <th>Purpose in B2B SaaS</th>
                          <th>Monthly Cost (Scale: 1-100 Clients)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-bold">Web / API Server</td>
                          <td>Render (Team Instance) or AWS ECS</td>
                          <td>Runs Express Node.js backend with TLS, zero-downtime deploys, auto-healing.</td>
                          <td>₹2,000 – ₹5,500 / mo ($25 - $65)</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Database Cluster</td>
                          <td>MongoDB Atlas (Dedicated M10)</td>
                          <td>Multi-tenant encrypted document storage with automated hourly/daily snapshots.</td>
                          <td>₹4,500 – ₹10,000 / mo ($55 - $120)</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Object Storage</td>
                          <td>Cloudflare R2 or AWS S3</td>
                          <td>Stores generated bill PDFs, Excel spreadsheets, site photos, and company logos.</td>
                          <td>₹250 – ₹1,200 / mo (Zero egress fees on R2)</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Email &amp; Bill Dispatch</td>
                          <td>Resend API or AWS SES</td>
                          <td>Delivers official bill PDFs, payment follow-ups, and review links to clients.</td>
                          <td>₹1,500 / mo (50,000 emails/mo on Resend)</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">WhatsApp Billing API</td>
                          <td>Twilio or Gupshup API</td>
                          <td>Instant 1-click WhatsApp bill dispatches and verification OTPs to engineers.</td>
                          <td>Pay-as-you-go (~₹0.40 - ₹0.65 per message)</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">DNS &amp; Global CDN</td>
                          <td>Cloudflare Pro</td>
                          <td>DDoS protection, wildcard SSL certificates (<code>*.mtsdecor.com</code>), edge caching.</td>
                          <td>₹1,700 / mo ($20/mo)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: FIVE DEDICATED PORTALS                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'portals' && (
          <div className="space-y-4">
            
            <div className="card border shadow-xs rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                  <Users className="text-primary" size={20} />
                  The 5 Dedicated Stakeholder Portals (How Each Operates)
                </h5>
                <p className="text-muted extra-small m-0 mt-1">
                  How different roles (contractor owner, site engineer, client, architect, super-admin) experience the software.
                </p>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">

                  {/* Portal 1 */}
                  <div className="col-lg-6">
                    <div className="card h-100 border border-slate-200 rounded-3 shadow-2xs">
                      <div className="card-header bg-slate-900 text-white py-2.5 px-3.5 d-flex align-items-center justify-content-between">
                        <strong className="small text-uppercase d-flex align-items-center gap-1.5">
                          <Building2 size={16} className="text-blue-400" />
                          Portal 1: Contractor / Company Master Workspace
                        </strong>
                        <span className="badge bg-primary text-white extra-small">Full Control</span>
                      </div>
                      <div className="card-body p-3.5 small">
                        <p className="text-slate-600 mb-2.5">
                          <strong>Who Uses It:</strong> Civil &amp; Interior Contractor Company Owners, Managing Partners, Senior Estimators.
                        </p>
                        <h6 className="fw-bold text-dark extra-small text-uppercase mb-1">Key Capabilities:</h6>
                        <ul className="text-slate-700 ps-3 mb-3 extra-small space-y-1">
                          <li>Create, organize, and manage measurement sheets inside project folders.</li>
                          <li>Full RA Billing mode with custom item rates, GST tax calculations, and abstracts.</li>
                          <li>Official Email &amp; WhatsApp Bill Dispatch Studio with custom letterheads.</li>
                          <li>Excel (.xlsx) import/export with live formula generation.</li>
                          <li>Custom Civil Labour Rates management for their specific firm.</li>
                        </ul>
                        <div className="bg-light p-2 rounded border extra-small text-muted">
                          <strong>Access URL:</strong> <code>https://app.mtsdecor.com/projects</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portal 2 */}
                  <div className="col-lg-6">
                    <div className="card h-100 border border-slate-200 rounded-3 shadow-2xs">
                      <div className="card-header bg-slate-900 text-white py-2.5 px-3.5 d-flex align-items-center justify-content-between">
                        <strong className="small text-uppercase d-flex align-items-center gap-1.5">
                          <Smartphone size={16} className="text-amber-400" />
                          Portal 2: Site Engineer On-Site Review Portal
                        </strong>
                        <span className="badge bg-amber-500 text-dark extra-small fw-bold">Mobile PIN Protected</span>
                      </div>
                      <div className="card-body p-3.5 small">
                        <p className="text-slate-600 mb-2.5">
                          <strong>Who Uses It:</strong> Site Supervisors, Field Civil Engineers checking measurements at physical construction sites.
                        </p>
                        <h6 className="fw-bold text-dark extra-small text-uppercase mb-1">Key Capabilities:</h6>
                        <ul className="text-slate-700 ps-3 mb-3 extra-small space-y-1">
                          <li>Mobile touch-friendly field review protected by a unique Engineer Passcode.</li>
                          <li>Check physical dimensions on site and propose corrections/queries if site dimensions differ.</li>
                          <li>Submit notes and queries directly to the contractor without editing original billing data.</li>
                          <li>Works smoothly on low-bandwidth mobile networks on construction sites.</li>
                        </ul>
                        <div className="bg-light p-2 rounded border extra-small text-muted">
                          <strong>Access URL:</strong> <code>https://app.mtsdecor.com/engineer/:projectId?pin=...</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portal 3 */}
                  <div className="col-lg-6">
                    <div className="card h-100 border border-slate-200 rounded-3 shadow-2xs">
                      <div className="card-header bg-slate-900 text-white py-2.5 px-3.5 d-flex align-items-center justify-content-between">
                        <strong className="small text-uppercase d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          Portal 3: Client Digital Approval &amp; Signature Portal
                        </strong>
                        <span className="badge bg-emerald-500 text-white extra-small">Zero Friction (No Login)</span>
                      </div>
                      <div className="card-body p-3.5 small">
                        <p className="text-slate-600 mb-2.5">
                          <strong>Who Uses It:</strong> Flat Owners, Corporate Clients, Project Managers approving bills.
                        </p>
                        <h6 className="fw-bold text-dark extra-small text-uppercase mb-1">Key Capabilities:</h6>
                        <ul className="text-slate-700 ps-3 mb-3 extra-small space-y-1">
                          <li>Instant zero-login web review: client opens WhatsApp or Email link on mobile.</li>
                          <li>Clean read-only itemized bill inspection with deductions clearly demarcated.</li>
                          <li>Digital Canvas Signature: client signs with finger on mobile or mouse on desktop.</li>
                          <li>Generates tamper-proof approved PDF with timestamp, signer details, and digital signature.</li>
                        </ul>
                        <div className="bg-light p-2 rounded border extra-small text-muted">
                          <strong>Access URL:</strong> <code>https://app.mtsdecor.com/sign/:projectId?pin=...</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portal 4 */}
                  <div className="col-lg-6">
                    <div className="card h-100 border border-slate-200 rounded-3 shadow-2xs">
                      <div className="card-header bg-slate-900 text-white py-2.5 px-3.5 d-flex align-items-center justify-content-between">
                        <strong className="small text-uppercase d-flex align-items-center gap-1.5">
                          <FileSpreadsheet size={16} className="text-purple-400" />
                          Portal 4: Architect &amp; PMC Audit Portal
                        </strong>
                        <span className="badge bg-purple-500 text-white extra-small">Audit &amp; Compliance</span>
                      </div>
                      <div className="card-body p-3.5 small">
                        <p className="text-slate-600 mb-2.5">
                          <strong>Who Uses It:</strong> Project Management Consultants (PMC), Third-Party Quality Auditors, Architects.
                        </p>
                        <h6 className="fw-bold text-dark extra-small text-uppercase mb-1">Key Capabilities:</h6>
                        <ul className="text-slate-700 ps-3 mb-3 extra-small space-y-1">
                          <li>Audit deductions (door cutouts, window openings, column allowances).</li>
                          <li>Compare Running Account (RA) bills against original architect drawings and BOQ specifications.</li>
                          <li>Direct export of measurement data to Microsoft Excel (.xlsx) with live formulas.</li>
                        </ul>
                        <div className="bg-light p-2 rounded border extra-small text-muted">
                          <strong>Access URL:</strong> <code>https://app.mtsdecor.com/review/:projectId</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portal 5 */}
                  <div className="col-12">
                    <div className="card border border-primary/30 rounded-3 shadow-sm bg-gradient" style={{ background: 'linear-gradient(to right, #eff6ff, #f8fafc)' }}>
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                          <h6 className="fw-bold text-primary m-0 d-flex align-items-center gap-2">
                            <ShieldCheck size={20} className="text-primary" />
                            Portal 5: Super-Admin SaaS Platform Management (Your Master Cockpit)
                          </h6>
                          <span className="badge bg-primary text-white">Platform Owner Only</span>
                        </div>
                        <p className="text-slate-600 small mb-3">
                          This is the central headquarters portal operated solely by you and your core software operations team to control all tenant companies.
                        </p>
                        <div className="row g-3">
                          <div className="col-md-3">
                            <div className="p-3 bg-white rounded border">
                              <strong className="extra-small text-muted text-uppercase d-block mb-1">Tenant Management</strong>
                              <p className="extra-small text-slate-700 m-0">Provision new client companies, assign custom subdomains, configure company slugs.</p>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="p-3 bg-white rounded border">
                              <strong className="extra-small text-muted text-uppercase d-block mb-1">Subscription Control</strong>
                              <p className="extra-small text-slate-700 m-0">One-click activation, trial extension, plan upgrades (Starter/Pro/Enterprise), suspension.</p>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="p-3 bg-white rounded border">
                              <strong className="extra-small text-muted text-uppercase d-block mb-1">Security &amp; Backups</strong>
                              <p className="extra-small text-slate-700 m-0">Audit logs of login attempts, suspicious traffic detection, instant Google Drive snapshots.</p>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="p-3 bg-white rounded border">
                              <strong className="extra-small text-muted text-uppercase d-block mb-1">Financial Billing</strong>
                              <p className="extra-small text-slate-700 m-0">Track total platform ARR, MRR, overdue renewals, and storage consumption per company.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: LIVE FINANCIAL CALCULATOR                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'calculator' && (
          <div className="space-y-4">
            
            {/* Calculator Header & Controls */}
            <div className="card border shadow-xs rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                    <Calculator className="text-primary" size={20} />
                    Live B2B SaaS Financial, Maintenance &amp; Profit Calculator
                  </h5>
                  <p className="text-muted extra-small m-0 mt-1">
                    Adjust the sliders below to calculate Monthly Recurring Revenue (MRR), Annual ARR, Server Bills, and Net Profit Margins in real time.
                  </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <div className="btn-group btn-group-sm">
                    <button 
                      type="button" 
                      className={`btn ${currency === 'INR' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setCurrency('INR')}
                    >
                      ₹ INR
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${currency === 'USD' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setCurrency('USD')}
                    >
                      $ USD
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                
                {/* Milestone Quick Presets */}
                <div className="mb-4 p-3 bg-slate-100 rounded-3 border">
                  <span className="extra-small fw-bold text-uppercase text-slate-600 d-block mb-2">
                    ⚡ Quick Milestone Presets (Click to Load):
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    <button 
                      type="button" 
                      className="btn btn-sm btn-white border shadow-2xs fw-semibold extra-small"
                      onClick={() => applyPreset(15, 1999, 3)}
                    >
                      🌱 Early Launch (15 Clients @ ₹1,999)
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-white border shadow-2xs fw-semibold extra-small"
                      onClick={() => applyPreset(50, 2999, 4)}
                    >
                      🚀 Growth Stage (50 Clients @ ₹2,999)
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-white border shadow-2xs fw-semibold extra-small"
                      onClick={() => applyPreset(150, 3999, 6)}
                    >
                      🏢 Scale Stage (150 Clients @ ₹3,999)
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-white border shadow-2xs fw-semibold extra-small"
                      onClick={() => applyPreset(400, 4999, 8)}
                    >
                      🏆 Market Leader (400 Clients @ ₹4,999)
                    </button>
                  </div>
                </div>

                <div className="row g-4">
                  {/* Left Column: Interactive Inputs */}
                  <div className="col-lg-6">
                    <div className="space-y-4">

                      {/* Slider 1: Active Client Companies */}
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-bold text-dark mb-0">
                            1. Active Client Companies
                          </label>
                          <span className="badge bg-primary text-white fs-6 px-3 py-1">
                            {clientCount} Companies
                          </span>
                        </div>
                        <input 
                          type="range" 
                          className="form-range" 
                          min="1" 
                          max="500" 
                          step="1"
                          value={clientCount} 
                          onChange={(e) => setClientCount(Number(e.target.value))} 
                        />
                        <div className="d-flex justify-content-between extra-small text-muted">
                          <span>1 Company</span>
                          <span>100</span>
                          <span>250</span>
                          <span>500 Companies</span>
                        </div>
                      </div>

                      {/* Slider 2: Base Monthly Subscription Fee */}
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-bold text-dark mb-0">
                            2. Monthly Subscription Fee (Per Company)
                          </label>
                          <span className="badge bg-success text-white fs-6 px-3 py-1">
                            {formatMoney(monthlyFeePerCompany)}/mo
                          </span>
                        </div>
                        <input 
                          type="range" 
                          className="form-range" 
                          min="999" 
                          max="15000" 
                          step="500"
                          value={monthlyFeePerCompany} 
                          onChange={(e) => setMonthlyFeePerCompany(Number(e.target.value))} 
                        />
                        <div className="d-flex justify-content-between extra-small text-muted">
                          <span>₹999 (Basic)</span>
                          <span>₹2,999 (Pro)</span>
                          <span>₹6,999 (Enterprise)</span>
                          <span>₹15,000</span>
                        </div>
                      </div>

                      {/* Slider 3: Average Staff / Site Engineers Per Company */}
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-bold text-dark mb-0">
                            3. Avg Staff / Engineers Per Company
                          </label>
                          <span className="badge bg-secondary text-white fs-6 px-3 py-1">
                            {avgStaffPerCompany} Users
                          </span>
                        </div>
                        <input 
                          type="range" 
                          className="form-range" 
                          min="1" 
                          max="20" 
                          step="1"
                          value={avgStaffPerCompany} 
                          onChange={(e) => setAvgStaffPerCompany(Number(e.target.value))} 
                        />
                        <div className="d-flex justify-content-between extra-small text-muted">
                          <span>1 User (Solo)</span>
                          <span>5 Users</span>
                          <span>10 Users</span>
                          <span>20 Users</span>
                        </div>
                        <div className="extra-small text-muted mt-1">
                          * 2 users included in base plan. Additional users charged at {formatMoney(extraStaffFee)}/user/month.
                        </div>
                      </div>

                      {/* Cost Inputs Collapsible Panel */}
                      <div className="p-3 bg-white border rounded-3">
                        <strong className="extra-small text-uppercase text-slate-700 d-block mb-2">
                          ⚙️ Operating &amp; Maintenance Costs (Monthly)
                        </strong>
                        <div className="row g-2">
                          <div className="col-6">
                            <label className="extra-small text-muted fw-semibold mb-1">Server &amp; Cloud (Base)</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">{currencySymbol}</span>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={serverHostingCost}
                                onChange={(e) => setServerHostingCost(Number(e.target.value) || 0)}
                              />
                            </div>
                            <span className="extra-small text-muted" style={{ fontSize: '10px' }}>Render + Atlas + Storage</span>
                          </div>

                          <div className="col-6">
                            <label className="extra-small text-muted fw-semibold mb-1">Support &amp; Updates</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">{currencySymbol}</span>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={supportMaintenanceCost}
                                onChange={(e) => setSupportMaintenanceCost(Number(e.target.value) || 0)}
                              />
                            </div>
                            <span className="extra-small text-muted" style={{ fontSize: '10px' }}>Dev &amp; Support Reserve</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Real-Time Results & Output Dashboard */}
                  <div className="col-lg-6">
                    <div className="bg-slate-900 text-white p-4 rounded-4 shadow-md h-100 d-flex flex-column justify-content-between">
                      
                      <div>
                        <div className="d-flex align-items-center justify-content-between border-bottom border-slate-800 pb-3 mb-4">
                          <span className="extra-small text-uppercase fw-bold text-slate-400">Projected Financial Overview</span>
                          <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1">
                            {financials.profitMargin.toFixed(1)}% PROFIT MARGIN
                          </span>
                        </div>

                        {/* Top KPI Grid */}
                        <div className="row g-3 mb-4">
                          <div className="col-6">
                            <div className="bg-slate-800/80 p-3 rounded-3 border border-slate-700">
                              <span className="extra-small text-slate-400 text-uppercase d-block mb-1">Monthly Revenue (MRR)</span>
                              <div className="fs-4 fw-black text-white">
                                {formatMoney(financials.grossMonthlyRevenue)}
                              </div>
                              <span className="extra-small text-slate-400">Total Billed / Month</span>
                            </div>
                          </div>

                          <div className="col-6">
                            <div className="bg-slate-800/80 p-3 rounded-3 border border-slate-700">
                              <span className="extra-small text-slate-400 text-uppercase d-block mb-1">Annual Revenue (ARR)</span>
                              <div className="fs-4 fw-black text-emerald-400">
                                {formatMoney(financials.grossAnnualRevenue)}
                              </div>
                              <span className="extra-small text-slate-400">Per Year Run-Rate</span>
                            </div>
                          </div>

                          <div className="col-6">
                            <div className="bg-slate-800/80 p-3 rounded-3 border border-slate-700">
                              <span className="extra-small text-slate-400 text-uppercase d-block mb-1">Operating Overhead</span>
                              <div className="fs-5 fw-bold text-rose-300">
                                −{formatMoney(financials.totalMonthlyCost)}
                              </div>
                              <span className="extra-small text-slate-400" style={{ fontSize: '10.5px' }}>
                                Server: {formatMoney(financials.scaledHostingCost)} + Ops
                              </span>
                            </div>
                          </div>

                          <div className="col-6">
                            <div className="bg-slate-800/80 p-3 rounded-3 border border-slate-700">
                              <span className="extra-small text-slate-400 text-uppercase d-block mb-1">Net Monthly Profit</span>
                              <div className="fs-5 fw-bold text-emerald-300">
                                +{formatMoney(financials.netMonthlyProfit)}
                              </div>
                              <span className="extra-small text-emerald-400/80" style={{ fontSize: '10.5px' }}>
                                Clear in pocket every month
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Net Annual Profit Highlight Box */}
                        <div className="p-3.5 bg-gradient rounded-3 border border-emerald-500/30 mb-4" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.3) 100%)' }}>
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <span className="extra-small text-emerald-300 text-uppercase fw-bold d-block">Estimated Net Annual Profit</span>
                              <div className="display-6 fw-black text-white mb-0">
                                {formatMoney(financials.netAnnualProfit)}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className="badge bg-emerald-400 text-slate-900 fw-bold px-3 py-1.5 fs-6">
                                ₹{(financials.netAnnualProfit / 100000).toFixed(2)} Lakhs/Yr
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Break Even Metric */}
                      <div className="border-top border-slate-800 pt-3 extra-small text-slate-400 d-flex justify-content-between align-items-center">
                        <span>
                          Break-Even Threshold: <strong>{financials.breakEvenClients} Clients</strong> covers 100% of all server and maintenance bills.
                        </span>
                        <span className="text-emerald-400 fw-bold">
                          {clientCount >= financials.breakEvenClients ? '✓ Highly Profitable' : '⚠ Below Break-even'}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: PACKAGING & PRICING TIERS                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            
            <div className="text-center mb-4">
              <h4 className="fw-black text-dark mb-1">Recommended B2B Pricing Structure</h4>
              <p className="text-muted small">
                Engineered for high conversion among Indian civil &amp; interior contractors and construction firms.
              </p>
            </div>

            <div className="row g-4 align-items-stretch">
              
              {/* Plan 1: Starter */}
              <div className="col-lg-4">
                <div className="card h-100 border border-slate-200 rounded-4 shadow-xs">
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <span className="badge bg-slate-100 text-slate-700 border px-2.5 py-1 extra-small fw-bold text-uppercase mb-2">
                        Solo Contractors &amp; Small Sites
                      </span>
                      <h4 className="fw-bold text-dark mb-1">Starter Plan</h4>
                      <p className="text-muted extra-small mb-3">
                        Ideal for independent interior contractors handling 2 to 5 concurrent sites.
                      </p>
                      <div className="d-flex align-items-baseline gap-1 mb-3">
                        <span className="display-6 fw-bold text-dark">₹1,499</span>
                        <span className="text-muted small">/ month</span>
                      </div>
                      <div className="text-muted extra-small mb-4">
                        or <strong>₹14,999 / year</strong> (Save 17%)
                      </div>

                      <h6 className="extra-small fw-bold text-uppercase text-dark mb-2.5">What is included:</h6>
                      <ul className="list-unstyled extra-small text-slate-700 space-y-2 mb-0">
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                          <span><strong>2 User Accounts</strong> (Admin + 1 Engineer)</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                          <span>Up to <strong>30 Active Projects</strong></span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                          <span>Measurement Sheets &amp; RA Billing</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                          <span>Excel &amp; PDF Export</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                          <span>Client WhatsApp Sharing</span>
                        </li>
                      </ul>
                    </div>

                    <button type="button" className="btn btn-outline-primary btn-sm fw-bold w-100 mt-4 py-2">
                      Target Audience: Subcontractors
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan 2: Professional (Most Popular) */}
              <div className="col-lg-4">
                <div className="card h-100 border-2 border-primary rounded-4 shadow-md position-relative bg-white">
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <span className="badge bg-primary text-white px-3 py-1 extra-small fw-bold text-uppercase shadow-xs">
                      ★ Most Popular (Recommended)
                    </span>
                  </div>
                  <div className="card-body p-4 d-flex flex-column justify-content-between pt-4">
                    <div>
                      <span className="badge bg-blue-50 text-primary border border-blue-200 px-2.5 py-1 extra-small fw-bold text-uppercase mb-2">
                        Interior Firms &amp; Civil Contractors
                      </span>
                      <h4 className="fw-bold text-dark mb-1">Professional Plan</h4>
                      <p className="text-muted extra-small mb-3">
                        For established contracting firms with multiple site teams and formal client billing.
                      </p>
                      <div className="d-flex align-items-baseline gap-1 mb-3">
                        <span className="display-6 fw-bold text-primary">₹3,499</span>
                        <span className="text-muted small">/ month</span>
                      </div>
                      <div className="text-muted extra-small mb-4">
                        or <strong>₹34,999 / year</strong> (Save 17%)
                      </div>

                      <h6 className="extra-small fw-bold text-uppercase text-dark mb-2.5">Everything in Starter, plus:</h6>
                      <ul className="list-unstyled extra-small text-slate-700 space-y-2 mb-0">
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                          <span><strong>6 Team Accounts</strong> (Admins + Site Engineers)</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                          <span><strong>Unlimited Projects &amp; Folders</strong></span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                          <span><strong>Client Digital Sign-Off Portal</strong> with Canvas Signature</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                          <span><strong>Official Email Dispatch Studio</strong> with SMTP &amp; Resend</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                          <span>Mobile Site Engineer Review Portal with Passcode</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                          <span>Custom Civil Labour Rates Master</span>
                        </li>
                      </ul>
                    </div>

                    <button type="button" className="btn btn-primary btn-sm fw-bold w-100 mt-4 py-2 shadow-xs">
                      Highest Conversion Tier
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan 3: Enterprise White-Label */}
              <div className="col-lg-4">
                <div className="card h-100 border border-slate-200 rounded-4 shadow-xs bg-slate-900 text-white">
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <span className="badge bg-slate-800 text-blue-300 border border-slate-700 px-2.5 py-1 extra-small fw-bold text-uppercase mb-2">
                        Corporations &amp; Large Builders
                      </span>
                      <h4 className="fw-bold text-white mb-1">Enterprise White-Label</h4>
                      <p className="text-slate-400 extra-small mb-3">
                        Complete custom-branded portal with dedicated support and unlimited team capacity.
                      </p>
                      <div className="d-flex align-items-baseline gap-1 mb-3">
                        <span className="display-6 fw-bold text-emerald-400">₹7,999</span>
                        <span className="text-slate-400 small">/ month</span>
                      </div>
                      <div className="text-slate-400 extra-small mb-4">
                        or <strong>₹79,999 / year</strong> (Billed annually)
                      </div>

                      <h6 className="extra-small fw-bold text-uppercase text-slate-300 mb-2.5">Everything in Pro, plus:</h6>
                      <ul className="list-unstyled extra-small text-slate-300 space-y-2 mb-0">
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                          <span><strong>Unlimited Team Accounts &amp; Engineers</strong></span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                          <span><strong>Custom Subdomain</strong> (<code>client.mtsdecor.com</code>)</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                          <span>Complete Custom Letterhead &amp; Watermark</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                          <span>Daily Automated Google Drive Cloud Backup</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                          <span>Priority Phone &amp; WhatsApp SLA Support</span>
                        </li>
                      </ul>
                    </div>

                    <button type="button" className="btn btn-outline-light btn-sm fw-bold w-100 mt-4 py-2">
                      Custom Corporate Contracts
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: STEP-BY-STEP IMPLEMENTATION ROADMAP                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            
            <div className="card border shadow-xs rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                  <TrendingUp className="text-primary" size={20} />
                  Step-by-Step Implementation Roadmap to Scale
                </h5>
                <p className="text-muted extra-small m-0 mt-1">
                  Chronological phases to transition from MTS Decor's internal software to a market-ready B2B platform.
                </p>
              </div>
              <div className="card-body p-4">
                
                <div className="position-relative ps-4 border-start border-3 border-primary space-y-4">
                  
                  {/* Phase 1 */}
                  <div className="position-relative">
                    <span className="position-absolute top-0 start-0 translate-middle p-1.5 bg-success border border-white rounded-circle"></span>
                    <span className="badge bg-success-subtle text-success extra-small fw-bold text-uppercase mb-1">
                      Phase 1: Foundation &amp; Security (COMPLETED ✓)
                    </span>
                    <h6 className="fw-bold text-dark mb-1">Multi-Tenant Data Schema &amp; Route Hardening</h6>
                    <p className="text-slate-600 extra-small mb-2" style={{ lineHeight: 1.5 }}>
                      Implemented <code>Company</code> model, company slug isolation on Projects, Folders, ExcelFiles, and PdfFiles. Secured all API endpoints, added portal PIN rate limiting to prevent brute-force passcode guessing, and created the Client Sign Portal and Site Engineer Review Portal.
                    </p>
                  </div>

                  {/* Phase 2 */}
                  <div className="position-relative">
                    <span className="position-absolute top-0 start-0 translate-middle p-1.5 bg-primary border border-white rounded-circle"></span>
                    <span className="badge bg-primary-subtle text-primary extra-small fw-bold text-uppercase mb-1">
                      Phase 2: Self-Service Company Onboarding (Next Step)
                    </span>
                    <h6 className="fw-bold text-dark mb-1">Company Registration &amp; White-Label Setup</h6>
                    <p className="text-slate-600 extra-small mb-2" style={{ lineHeight: 1.5 }}>
                      Create a self-serve <code>/signup</code> flow where a new contractor registers their company name, picks their slug (e.g. <code>/c/uttam-decor</code>), uploads their logo, and automatically receives a 14-day full-feature trial workspace.
                    </p>
                  </div>

                  {/* Phase 3 */}
                  <div className="position-relative">
                    <span className="position-absolute top-0 start-0 translate-middle p-1.5 bg-amber-500 border border-white rounded-circle"></span>
                    <span className="badge bg-amber-100 text-amber-800 extra-small fw-bold text-uppercase mb-1">
                      Phase 3: Automated Recurring Payments
                    </span>
                    <h6 className="fw-bold text-dark mb-1">Razorpay Subscriptions &amp; Automated Invoicing</h6>
                    <p className="text-slate-600 extra-small mb-2" style={{ lineHeight: 1.5 }}>
                      Integrate Razorpay Subscriptions (UPI AutoPay, Credit Cards, NetBanking). Webhook listener automatically activates/renews accounts, generates GST tax invoices for clients, and locks accounts if subscriptions lapse after trial.
                    </p>
                  </div>

                  {/* Phase 4 */}
                  <div className="position-relative">
                    <span className="position-absolute top-0 start-0 translate-middle p-1.5 bg-purple-500 border border-white rounded-circle"></span>
                    <span className="badge bg-purple-100 text-purple-800 extra-small fw-bold text-uppercase mb-1">
                      Phase 4: Mobile App Store Packaging (Capacitor)
                    </span>
                    <h6 className="fw-bold text-dark mb-1">Android APK &amp; iOS App Deployment</h6>
                    <p className="text-slate-600 extra-small mb-2" style={{ lineHeight: 1.5 }}>
                      Using the existing Capacitor setup already configured in the repository, compile native Android APKs for site engineers to download directly from Google Play Store or APK distribution link with local camera photo attachment.
                    </p>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}
