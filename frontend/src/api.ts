const BASE = "/api";

const getToken = () => localStorage.getItem("valux_token") || "";

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
      throw err;
    }
    return res.json();
  },

  post: async (path: string, body: object) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status} on ${path}` }));
      console.error("API error:", err);
      throw err;
    }
    return res.json();
  },
};