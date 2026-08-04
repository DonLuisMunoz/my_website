/* ============================================================
   Front-end config — edit these two values, nothing else.
   ------------------------------------------------------------
   API_BASE: where the Python backend lives.
     - Local dev:          "http://localhost:8000"
     - Homelab via Tunnel: "https://api.luisamunoz.com"
     - Leave "" to run fully static: projects load from
       data/projects.json and the contact form falls back to
       a pre-filled mailto.

   The blog does NOT use this. Posts are markdown files in the
   repo, so /blog works whether or not the backend is up.
   ============================================================ */
window.PORTFOLIO_CONFIG = {
  API_BASE: "",                       // set to "https://api.luisamunoz.com" once the API is live
  PROJECTS_FALLBACK: "./data/projects.json"
};
