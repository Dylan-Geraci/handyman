// src/api/endpoints.js
import { apiFetch } from "./client";

// ---------- CATEGORIES / TASK TYPES ----------
export const getCategories = () => apiFetch("/api/categories");

export const getTaskTypesByCategory = (categoryId) =>
  apiFetch(`/api/task-types?category_id=${encodeURIComponent(categoryId)}`);

// ---------- TASKS ----------
export const createTask = (token, payload) =>
  apiFetch("/api/tasks", { method: "POST", token, body: payload });

export const browseTasks = ({
  token,
  category_id,
  task_type_id,
  location,
  q,
} = {}) => {
  const params = new URLSearchParams();
  if (category_id) params.set("category_id", category_id);
  if (task_type_id) params.set("task_type_id", task_type_id);
  if (location) params.set("location", location);
  if (q) params.set("q", q);

  const qs = params.toString();
  return apiFetch(`/api/tasks${qs ? `?${qs}` : ""}`, { token });
};

export const getMatchedTasks = (token, { location } = {}) => {
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  const qs = params.toString();
  return apiFetch(`/api/tasks/matches${qs ? `?${qs}` : ""}`, { token });
};

// NEW: AI-ranked personalized recommendations
export const getTaskRecommendations = (
  token,
  { limit = 10, min_score = 50, location_radius = 25, include_reasons = true } = {}
) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("min_score", String(min_score));
  params.set("location_radius", String(location_radius));
  params.set("include_reasons", String(include_reasons));

  return apiFetch(`/api/tasks/recommendations?${params.toString()}`, { token });
};

// ---------- TASKERS ----------
export const browseTaskers = ({ category_id, location, q } = {}) => {
  const params = new URLSearchParams();
  if (category_id) params.set("category_id", category_id);
  if (location) params.set("location", location);
  if (q) params.set("q", q);

  const qs = params.toString();
  return apiFetch(`/api/taskers/browse${qs ? `?${qs}` : ""}`);
};

export const getTaskerPublicProfile = (username) =>
  apiFetch(`/api/taskers/${encodeURIComponent(username)}`);

// ---------- AI ----------
export const aiSearchTaskers = (query) =>
  apiFetch("/api/taskers/ai-search", { method: "POST", body: { query } });

export const suggestTaskType = (description) =>
  apiFetch("/api/tasks/suggest-type", {
    method: "POST",
    body: { description },
  });

// ---------- TASK ACCEPTANCE ----------
export const acceptTask = (token, taskId) =>
  apiFetch(`/api/tasks/${encodeURIComponent(taskId)}/accept`, {
    method: "PUT",
    token,
  });
