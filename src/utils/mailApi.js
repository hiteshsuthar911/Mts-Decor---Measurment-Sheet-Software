import { api } from './api';

export const mailApi = {
  // SMTP Config & Settings
  getConfig: () => api.get('/mail/config'),
  saveConfig: (config) => api.post('/mail/config', config),
  testConnection: (testRecipient, config) => api.post('/mail/test-connection', { testRecipient, config }),

  // Email Dispatch
  sendEmail: (payload) => api.post('/mail/send', payload),

  // Logs & History
  getLogs: (limit = 50) => api.get(`/mail/logs?limit=${limit}`),
  getLogDetails: (id) => api.get(`/mail/logs/${id}`),

  // Drafts
  getDrafts: () => api.get('/mail/drafts'),
  saveDraft: (draft) => api.post('/mail/drafts', draft),
  deleteDraft: (id) => api.delete(`/mail/drafts/${id}`),
};
