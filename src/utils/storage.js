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
