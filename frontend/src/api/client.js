// src/api/client.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch(
  path,
  { method = "GET", token, body } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Attempt JSON parsing even for errors
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      data?.detail ||
      data?.message ||
      (typeof data === "string" ? data : null) ||
      `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}