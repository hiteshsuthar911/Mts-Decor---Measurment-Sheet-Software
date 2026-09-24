const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Company = require('../models/Company');
const User = require('../models/User');
const Project = require('../models/Project');
const ExcelFile = require('../models/ExcelFile');

// GET /api/companies/portal/:slug — Public portal branding info
router.get('/portal/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.trim().toLowerCase();
    const company = await Company.findOne({ slug, active: true });
    if (!company) {
      return res.status(404).json({ message: 'COMPANY PORTAL NOT FOUND' });
    }
    res.json({
      id: company._id,
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      tagline: company.tagline,
      address: company.address,
      phone: company.phone,
      email: company.email,
      gstin: company.gstin,
      subscriptionStatus: company.subscriptionStatus,
      plan: company.plan,
    });
  } catch (err) {
    console.error('GET PORTAL ERROR:', err);
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// GET /api/companies — Admin only list of all companies with stats
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'ADMIN ACCESS REQUIRED' });
    }

    const companies = await Company.find({}).sort({ createdAt: -1 });

    // Aggregate counts for each company
    const enriched = await Promise.all(
      companies.map(async (c) => {
        const [projectCount, userCount, excelCount] = await Promise.all([
          Project.countDocuments({
            $or: [{ companyId: c._id }, { companySlug: c.slug }]
          }),
          User.countDocuments({
            $or: [{ companyId: c._id }, { companySlug: c.slug }]
          }),
          ExcelFile.countDocuments({
            $or: [{ companyId: c._id }, { companySlug: c.slug }]
          }),
        ]);

        return {
          ...c.toObject(),
          projectCount,
          userCount,
          excelCount,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('GET COMPANIES ERROR:', err);
    res.status(500).json({ message: 'FAILED TO FETCH COMPANIES' });
  }
});

// GET /api/companies/:id — Single company details
router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'COMPANY NOT FOUND' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'SERVER ERROR' });
  }
});

// POST /api/companies — Admin creates new client company
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'ADMIN ACCESS REQUIRED' });
    }

    const {
      name,
      slug,
      logo,
      tagline,
      address,
      phone,
      email,
      gstin,
      subscriptionStatus,
      subscriptionExpiresAt,
      plan,
      annualFee,
      ownerName,
      ownerEmail,
      ownerPhone,
      initialAdminUsername,
      initialAdminPassword,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'COMPANY NAME AND PORTAL SLUG ARE REQUIRED' });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const existing = await Company.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({ message: `PORTAL SLUG "${cleanSlug}" IS ALREADY IN USE` });
    }

    const company = await Company.create({
      name: name.trim(),
      slug: cleanSlug,
      logo: logo || '',
      tagline: tagline || 'Civil & Interior Contractor',
      address: address || '',
      phone: phone || '',
      email: email || '',
      gstin: gstin || '',
      subscriptionStatus: subscriptionStatus || 'ACTIVE',
      subscriptionExpiresAt: subscriptionExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // default 1 yr
      plan: plan || 'PRO',
      annualFee: annualFee || 12000,
      ownerName: ownerName || '',
      ownerEmail: ownerEmail || '',
      ownerPhone: ownerPhone || '',
      active: true,
    });

    // Optionally create the initial Company Admin user for this contractor company
    let createdUser = null;
    if (initialAdminUsername && initialAdminPassword) {
      const cleanUsername = initialAdminUsername.trim().toLowerCase();
      const existingUser = await User.findOne({ username: cleanUsername });
      if (!existingUser) {
        createdUser = await User.create({
          username: cleanUsername,
          password: initialAdminPassword,
          name: (ownerName || name).trim().toUpperCase(),
          role: 'ADMIN', // Contractor Company Admin
          companyId: company._id,
          companySlug: company.slug,
        });
      }
    }

    let initialInvoice = null;

    const loginUrl = `/c/${company.slug}/login`;

    res.status(201).json({
      company,
      loginUrl,
      initialInvoice,
      initialUser: createdUser
        ? {
            username: createdUser.username,
            name: createdUser.name,
            role: createdUser.role,
          }
        : null,
    });
  } catch (err) {
    console.error('CREATE COMPANY ERROR:', err);
    res.status(500).json({ message: 'FAILED TO CREATE COMPANY: ' + err.message });
  }
});

// PUT /api/companies/:id — Update company details & branding
router.put('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'COMPANY NOT FOUND' });

    // Only Admin or user of the same company can edit
    if (req.user.role !== 'ADMIN' && String(req.user.companyId) !== String(company._id)) {
      return res.status(403).json({ message: 'FORBIDDEN' });
    }

    const updates = { ...req.body };
    // Prevent changing slug if not admin
    if (req.user.role !== 'ADMIN') {
      delete updates.slug;
      delete updates.subscriptionStatus;
      delete updates.subscriptionExpiresAt;
      delete updates.plan;
      delete updates.annualFee;
    }

    const updated = await Company.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    res.json(updated);
  } catch (err) {
    console.error('UPDATE COMPANY ERROR:', err);
    res.status(500).json({ message: 'FAILED TO UPDATE COMPANY' });
  }
});

// DELETE /api/companies/:id — Admin deletes company
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'ADMIN ACCESS REQUIRED' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'COMPANY NOT FOUND' });

    if (company.slug === 'mts-decor') {
      return res.status(400).json({ message: 'CANNOT DELETE MASTER COMPANY (MTS DECOR)' });
    }

    await company.deleteOne();
    res.json({ message: 'COMPANY DELETED SUCCESSFULLY' });
  } catch (err) {
    console.error('DELETE COMPANY ERROR:', err);
    res.status(500).json({ message: 'FAILED TO DELETE COMPANY' });
  }
});

// GET /api/companies/:id/onboarding-packet — Generate onboarding mail, credentials & WhatsApp link
router.get('/:id/onboarding-packet', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'ADMIN ACCESS REQUIRED' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'COMPANY NOT FOUND' });

    // Find company admin user
    const adminUser = await User.findOne({
      $or: [{ companyId: company._id }, { companySlug: company.slug }],
      role: 'ADMIN',
    }).sort({ createdAt: 1 });

    // Find latest invoice
    const latestInvoice = null;

    const clientOrigin = req.headers.origin || 'http://localhost:5174';
    const loginUrl = `${clientOrigin}/c/${company.slug}/login`;
    const expiryStr = company.subscriptionExpiresAt
      ? new Date(company.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '365 Days Active';

    const emailSubject = `Welcome to MS PRO – ${company.name} Admin Portal Credentials & Subscription Active`;

    const emailText = `Hello ${company.ownerName || company.name},

Congratulations! Your official MS PRO Contractor Company Admin Portal has been activated by MTS DECOR.

──────────────────────────────────────────────────────
YOUR DEDICATED COMPANY PORTAL & LOGIN DETAILS:
──────────────────────────────────────────────────────
🏢 Company: ${company.name}
🌐 Dedicated Login URL: ${loginUrl}
👤 Company Admin Username: ${adminUser ? adminUser.username : (company.ownerEmail || company.slug + '-admin')}
🔑 Initial Password: [As provided during registration or reset from admin]
💼 Plan: ${company.plan} Contractor License
📅 Valid Until: ${expiryStr}
${latestInvoice ? `📄 GST Invoice Number: ${latestInvoice.invoiceNumber} (₹${latestInvoice.totalAmount.toLocaleString('en-IN')})` : ''}

──────────────────────────────────────────────────────
WHAT YOU CAN DO AS COMPANY ADMIN:
──────────────────────────────────────────────────────
1. Sign in via your dedicated URL: ${loginUrl}
2. Add and manage your company site engineers, quantity surveyors & estimators
3. Create projects, site measurement sheets, and access 68+ civil labour rate catalogs
4. Download your official GST Tax Invoices anytime

Need assistance? Contact MTS DECOR Support at +91 99824 44449 or info@mtsdecor.com.

Best Regards,
MTS DECOR Master Platform Team`;

    const whatsAppText = `*MTS DECOR • MS PRO CONTRACTOR ONBOARDING* 🚀%0A%0AHello *${encodeURIComponent(company.ownerName || company.name)}*,%0A%0AYour contractor company *${encodeURIComponent(company.name)}* is officially active on MS PRO!%0A%0A🔗 *Your Dedicated Company Login URL:*%0A${encodeURIComponent(loginUrl)}%0A%0A👤 *Company Admin Username:* \`${encodeURIComponent(adminUser ? adminUser.username : company.slug + '-admin')}\`%0A💼 *Subscription Plan:* ${encodeURIComponent(company.plan)} CONTRACTOR LICENSE%0A📅 *Valid Until:* ${encodeURIComponent(expiryStr)}%0A%0AYou can log in now to manage your company users, projects, and site measurements!%0A%0A— *MTS DECOR Platform Team*`;

    const cleanPhone = (company.ownerPhone || company.phone || '').replace(/[^0-9]/g, '');
    const whatsAppUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}&text=${whatsAppText}`
      : `https://api.whatsapp.com/send?text=${whatsAppText}`;

    const mailtoUrl = `mailto:${encodeURIComponent(company.ownerEmail || company.email || '')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailText)}`;

    res.json({
      company,
      adminUser: adminUser ? { username: adminUser.username, name: adminUser.name, role: adminUser.role } : null,
      loginUrl,
      latestInvoice,
      emailSubject,
      emailText,
      mailtoUrl,
      whatsAppUrl,
      whatsAppText: decodeURIComponent(whatsAppText),
    });
  } catch (err) {
    console.error('ONBOARDING PACKET ERROR:', err);
    res.status(500).json({ message: 'FAILED TO GENERATE ONBOARDING PACKET' });
  }
});

module.exports = router;
