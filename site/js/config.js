/* ============================================================
   Front-end config — edit these two values, nothing else.
   ------------------------------------------------------------
   API_BASE: where your Python backend lives.
     - Local dev:            "http://localhost:8000"
     - Homelab via Tunnel:   "https://api.yourdomain.com"
     - Leave "" to run fully static (projects load from
       data/projects.json, contact form is disabled).
   ============================================================ */
window.PORTFOLIO_CONFIG = {
  API_BASE: "",                       // e.g. "https://api.luislearns.dev"
  PROJECTS_FALLBACK: "./data/projects.json"
};
