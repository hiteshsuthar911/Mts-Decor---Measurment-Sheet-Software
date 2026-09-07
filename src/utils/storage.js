import { api } from './api';

// GET all projects (list, no full data)
export async function getAllProjects() {
  return api.get('/projects');
}

// GET single project with full data
export async function getProject(id) {
  return api.get(`/projects/${id}`);
}

// POST create new project
export async function createProject(data) {
  return api.post('/projects', { data });
}

// PUT save/update project
export async function saveProject(id, data) {
  return api.put(`/projects/${id}`, { data });
}

// DELETE project
export async function deleteProject(id) {
  return api.delete(`/projects/${id}`);
}

// GET admin stats
export async function getProjectStats() {
  return api.get('/projects/stats/all');
}

// ── FOUNDER SLIDES (Public GET, Admin POST/PUT/DELETE) ──
export async function getFounderSlides() {
  return api.get('/founder-slides');
}

export async function createFounderSlide(data) {
  return api.post('/founder-slides', data);
}

export async function updateFounderSlide(id, data) {
  return api.put(`/founder-slides/${id}`, data);
}

export async function deleteFounderSlide(id) {
  return api.delete(`/founder-slides/${id}`);
}

// ── USER MANAGEMENT (Admin Only) ──
export async function getAllUsers() {
  return api.get('/users');
}

export async function createUser(data) {
  return api.post('/users', data);
}

export async function updateUserPassword(id, password) {
  return api.put(`/users/${id}/password`, { password });
}

export async function deleteUser(id) {
  return api.delete(`/users/${id}`);
}

// ── USER PROFILE & SELF ACCOUNT MANAGEMENT ──
export async function getUserProfile() {
  return api.get('/users/profile');
}

export async function updateUserProfile(data) {
  return api.put('/users/profile', data);
}

export async function changeUserPassword(data) {
  return api.put('/users/change-password', data);
}

// ── DATABASE & GOOGLE DRIVE BACKUPS (Admin Only) ──
export async function getBackupStatus() {
  return api.get('/backup/status');
}

export async function triggerDriveBackup() {
  return api.post('/backup/trigger');
}

