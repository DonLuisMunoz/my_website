/* ============================================================
   admin.js — tiny CRUD client for the project list.
   Talks to the Python API. The admin token is sent as a
   Bearer header; it is NEVER stored on the server in the page.
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.PORTFOLIO_CONFIG || { API_BASE: "" };
  var API = (CFG.API_BASE || "").replace(/\/$/, "");

  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $("status");
  var listEl = $("admin-list");

  function token() { return $("token").value.trim(); }
  function headers() {
    return { "Content-Type": "application/json", "Authorization": "Bearer " + token() };
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function csv(value) {
    return String(value || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
  }

  if (!API) {
    statusEl.textContent = "Set API_BASE in js/config.js before using the admin panel.";
  }

  /* ---- list ---- */
  function refresh() {
    fetch(API + "/api/projects")
      .then(function (r) { return r.json(); })
      .then(function (items) {
        listEl.innerHTML = items.map(function (p) {
          return (
            '<div class="card">' +
              '<div class="card__meta">' + esc(p.meta || "") + "</div>" +
              '<h3 class="card__title">' + esc(p.title) + "</h3>" +
              '<p class="card__body">' + esc(p.body || "") + "</p>" +
              '<div class="tags" style="margin-top:14px;">' +
                '<button class="btn btn--sm btn--paper" data-edit="' + esc(p.id) + '">edit</button>' +
                '<button class="btn btn--sm danger" data-del="' + esc(p.id) + '">delete</button>' +
              "</div>" +
            "</div>"
          );
        }).join("");
      })
      .catch(function () { listEl.innerHTML = "<p>Could not reach the API.</p>"; });
  }

  /* ---- create / update ---- */
  $("project-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!token()) { statusEl.textContent = "Enter your admin token first."; return; }
    var id = $("f-id").value.trim();
    var body = {
      meta: $("f-meta").value.trim(),
      title: $("f-title").value.trim(),
      body: $("f-body").value.trim(),
      tools: csv($("f-tools").value),
      tags: csv($("f-tags").value),
      url: $("f-url").value.trim()
    };
    var method = id ? "PUT" : "POST";
    var url = id ? API + "/api/projects/" + encodeURIComponent(id) : API + "/api/projects";
    statusEl.textContent = "Saving…";
    fetch(url, { method: method, headers: headers(), body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function () {
        statusEl.textContent = "Saved.";
        e.target.reset(); $("f-id").value = "";
        refresh();
      })
      .catch(function (s) { statusEl.textContent = s === 401 ? "Bad token." : "Save failed."; });
  });

  /* ---- edit / delete (event delegation) ---- */
  listEl.addEventListener("click", function (e) {
    var ed = e.target.getAttribute("data-edit");
    var dl = e.target.getAttribute("data-del");
    if (ed) {
      fetch(API + "/api/projects").then(function (r) { return r.json(); }).then(function (items) {
        var p = items.filter(function (x) { return x.id === ed; })[0];
        if (!p) return;
        $("f-id").value = p.id; $("f-meta").value = p.meta || "";
        $("f-title").value = p.title || ""; $("f-body").value = p.body || "";
        $("f-tools").value = (p.tools || []).join(", ");
        $("f-tags").value = (p.tags || []).join(", "); $("f-url").value = p.url || "";
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    if (dl) {
      if (!token()) { statusEl.textContent = "Enter your admin token first."; return; }
      if (!confirm("Delete this project?")) return;
      fetch(API + "/api/projects/" + encodeURIComponent(dl), { method: "DELETE", headers: headers() })
        .then(function (r) { if (!r.ok) throw r.status; refresh(); })
        .catch(function (s) { statusEl.textContent = s === 401 ? "Bad token." : "Delete failed."; });
    }
  });

  refresh();
})();
