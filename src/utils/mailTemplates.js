export const EMAIL_TEMPLATES = [
  {
    id: 'ra_bill',
    name: 'RA Bill & Invoice Submission',
    badge: 'Billing',
    badgeColor: '#10b981',
    subject: 'RA Bill Submission: {{projectName}} — MTS Decor',
    body: `Dear {{clientName}},

Greetings from MTS Decor.

We have prepared and attached the official Running Account (RA) Bill for your project "{{projectName}}".

Summary of Bill:
• Project: {{projectName}}
• Bill Description: Itemized Civil & Interior Measurement Execution
• Date of Issue: {{date}}
• Total Amount Payable: ₹{{billAmount}}

Please review the attached PDF document for the complete item-wise measurements, unit rates, and abstract summaries.

Kindly acknowledge receipt and let us know if you require any clarifications.

Warm regards,
Billing & Accounts Team
MTS Decor | Civil & Interior Specialists
Phone: +91 98765 43210
Website: www.mtsdecor.com`
  },
  {
    id: 'measurement_review',
    name: 'Measurement Sheet for Client Approval',
    badge: 'Review',
    badgeColor: '#3b82f6',
    subject: 'Action Required: Measurement Sheet Approval for {{projectName}}',
    body: `Dear {{clientName}},

We have finalized the on-site measurements for your ongoing project "{{projectName}}".

The detailed measurement sheet has been audited and is attached as a PDF for your kind review and sign-off.

You can also view and digitally sign the measurement sheet online on your phone or laptop using the link below:
{{portalLink}}

If all measurements align with the site execution, kindly confirm your approval so we can proceed with billing and the next phase of work.

Thank you for your continued partnership.

Warm regards,
Site Operations & Project Management
MTS Decor`
  },
  {
    id: 'payment_reminder',
    name: 'Payment & Milestone Follow-up',
    badge: 'Follow-up',
    badgeColor: '#f59e0b',
    subject: 'Friendly Follow-up: RA Bill for {{projectName}} — MTS Decor',
    body: `Dear {{clientName}},

Hope you are having a wonderful week.

This is a gentle reminder regarding the previously shared RA Bill for "{{projectName}}" dated {{date}}.

• Project: {{projectName}}
• Amount: ₹{{billAmount}}
• Status: Pending Clearance

A copy of the bill PDF is re-attached here for your quick reference. If the payment has already been scheduled or initiated, kindly disregard this notice and share the transaction reference.

Thank you for your prompt support.

Sincerely,
Accounts Department
MTS Decor`
  },
  {
    id: 'custom',
    name: 'Custom / Blank Dispatch',
    badge: 'Custom',
    badgeColor: '#8b5cf6',
    subject: 'Update regarding {{projectName}} — MTS Decor',
    body: `Dear {{clientName}},

Greetings from MTS Decor.

Please find attached the official documentation regarding {{projectName}}.

[Enter your custom message here]

Warm regards,
MTS Decor Team`
  }
];

export function replacePlaceholders(text, variables = {}) {
  if (!text) return '';
  let result = text;
  const vars = {
    clientName: variables.clientName || 'Client',
    projectName: variables.projectName || 'Project',
    billAmount: variables.billAmount || '0.00',
    date: variables.date || new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    portalLink: variables.portalLink || (typeof window !== 'undefined' ? window.location.origin : 'https://mtsdecor.com'),
    ...variables,
  };

  Object.entries(vars).forEach(([key, val]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, val);
  });

  return result;
}
