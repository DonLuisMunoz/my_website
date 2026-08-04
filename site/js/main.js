/* ============================================================
   main.js — plain JS, no build step, no dependencies.
   Handles: typing effect, streak count-up, scroll reveal,
   data-driven project cards, and the contact form.
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.PORTFOLIO_CONFIG || { API_BASE: "", PROJECTS_FALLBACK: "./data/projects.json" };

  /* ---------- 1. typing effect ---------- */
  var typeEl = document.querySelector("[data-type]");
  if (typeEl) {
    var phrases = ['python practice.py', 'git commit -m "day 4"', 'open new_project/', 'learn --everyday'];
    var pi = 0, ci = 0, deleting = false;
    (function tick() {
      var word = phrases[pi];
      if (!deleting) {
        typeEl.textContent = word.slice(0, ci++);
        if (ci > word.length) { deleting = true; setTimeout(tick, 1600); return; }
      } else {
        typeEl.textContent = word.slice(0, ci--);
        if (ci < 0) { deleting = false; ci = 0; pi = (pi + 1) % phrases.length; }
      }
      setTimeout(tick, deleting ? 45 : 95);
    })();
  }

  /* ---------- 2. streak count-up ---------- */
  var streakEl = document.querySelector("[data-streak]");
  if (streakEl) {
    // Days since Luis started (2026-07-01), computed live so it's always current.
    var START = new Date(2026, 6, 1); // month is 0-indexed: 6 = July
    var target = Math.max(0, Math.floor((Date.now() - START.getTime()) / 86400000));
    var n = 0;
    setTimeout(function up() {
      n += 1; streakEl.textContent = n;
      if (n < target) setTimeout(up, 32);
    }, 500);
  }

  /* ---------- 3. reveal on scroll (IntersectionObserver) ---------- */
  var reveals = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- 4. data-driven project cards ---------- */
  var listEl = document.getElementById("project-list");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cardHTML(p) {
    var tags = (p.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    var link = p.url
      ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" class="btn btn--gold btn--sm" style="margin-top:18px;">view the code ↗</a>'
      : "";
    return (
      '<article class="card">' +
        '<div class="card__meta">' + esc(p.meta || "") + "</div>" +
        '<h3 class="card__title">' + esc(p.title || "") + "</h3>" +
        '<p class="card__body">' + esc(p.body || "") + "</p>" +
        (tags ? '<div class="tags">' + tags + "</div>" : "") +
        link +
      "</article>"
    );
  }

  function renderProjects(projects) {
    if (!listEl) return;
    if (!projects || !projects.length) { listEl.innerHTML = ""; return; }
    listEl.innerHTML = projects.map(cardHTML).join("");
    var shipped = document.querySelector("[data-shipped]");
    if (shipped) shipped.textContent = projects.length + document.querySelectorAll(".featured").length;
  }

  function loadProjects() {
    if (!listEl) return;
    // Try the live API first, fall back to the baked-in JSON file.
    var apiUrl = CFG.API_BASE ? CFG.API_BASE.replace(/\/$/, "") + "/api/projects" : null;
    var chain = apiUrl
      ? fetch(apiUrl).then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .catch(function () { return fetch(CFG.PROJECTS_FALLBACK).then(function (r) { return r.json(); }); })
      : fetch(CFG.PROJECTS_FALLBACK).then(function (r) { return r.json(); });
    chain.then(renderProjects).catch(function () { /* leave empty */ });
  }
  loadProjects();

  /* ---------- 5. contact form ---------- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!CFG.API_BASE) {
        // No backend yet: turn the form into a pre-filled email so it still works.
        var n = form.name.value.trim(), em = form.email.value.trim(), msg = form.message.value.trim();
        if (!n || !em || !msg) { status.textContent = "Please fill in every field."; return; }
        var subject = encodeURIComponent("Hello from luisamunoz.com — " + n);
        var body = encodeURIComponent(msg + "\n\n— " + n + " (" + em + ")");
        window.location.href = "mailto:lamunoz12@gmail.com?subject=" + subject + "&body=" + body;
        status.textContent = "Opening your email app… if nothing happens, write me at lamunoz12@gmail.com.";
        return;
      }
      var payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim()
      };
      if (!payload.name || !payload.email || !payload.message) {
        status.textContent = "Please fill in every field."; return;
      }
      status.textContent = "Sending…";
      fetch(CFG.API_BASE.replace(/\/$/, "") + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function () { status.textContent = "Got it — thanks! I'll reply soon."; form.reset(); })
        .catch(function () { status.textContent = "Something broke on send. Try emailing me instead."; });
    });
  }
})();
