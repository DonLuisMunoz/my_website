/* ============================================================
   blog.js — the /blog page. Plain JS, no build step, no deps.

   Two views in one file, switched by the URL:
     /blog/            -> the list of posts
     /blog/?p=<slug>   -> that post, rendered from markdown

   Posts are markdown files in site/content/posts/.
   site/content/posts/index.json is the manifest (the metadata).
   A static host can't list a directory, so the manifest is how
   the page knows what exists. Adding a post = one .md file +
   one entry in the manifest. See docs/ADD-A-POST.md.
   ============================================================ */
(function () {
  "use strict";

  var MANIFEST = "../content/posts/index.json";
  var POSTS_DIR = "../content/posts/";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Block dangerous schemes by name rather than allow-listing path shapes.
  // The earlier version required a leading ./ or / and silently turned a
  // perfectly good relative path like assets/x.png into "#".
  // No scheme at all means a relative path, which is what post images use.
  function safeHref(href) {
    var scheme = /^([a-z][a-z0-9+.\-]*):/i.exec(href);
    if (scheme && !/^(https?|mailto)$/i.test(scheme[1])) return "#";
    return href;
  }

  // "//host/path" is protocol-relative, so it leaves the site even though it
  // has no scheme. It gets the same new-tab and noopener treatment as https.
  function isExternal(href) {
    return /^(https?:)?\/\//i.test(href);
  }

  function fmtDate(iso) {
    var parts = String(iso || "").split("-");
    if (parts.length !== 3) return String(iso || "");
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var m = months[parseInt(parts[1], 10) - 1] || "";
    return m + " " + parseInt(parts[2], 10) + ", " + parts[0];
  }

  function metaLine(post) {
    var bits = [fmtDate(post.date)];
    if (post.minutes) bits.push(post.minutes + " MIN READ");
    return bits.join(" · ");
  }

  /* ---------- markdown -> html ----------
     A deliberately small subset: headings, paragraphs, fenced and
     inline code, bold, italic, links, images, lists, blockquotes,
     and rules. Everything is HTML-escaped BEFORE parsing, so a post
     can never inject markup. That's why the blockquote test below
     looks for &gt; instead of >.
  */
  function inline(text) {
    // Pull code spans out first so bold/link syntax inside them stays literal.
    // The placeholder uses a raw < , which can never survive HTML escaping,
    // so it can't collide with anything the post itself contains.
    var codes = [];
    text = text.replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return "<" + (codes.length - 1) + ">";
    });
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, src) {
      return '<img src="' + safeHref(src) + '" alt="' + alt + '" loading="lazy">';
    });
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      var out = isExternal(href) ? ' target="_blank" rel="noopener"' : "";
      return '<a href="' + safeHref(href) + '"' + out + ">" + label + "</a>";
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    text = text.replace(/(^|[^_\w])_([^_\n]+)_/g, "$1<em>$2</em>");
    return text.replace(/<(\d+)>/g, function (_, i) {
      return "<code>" + codes[+i] + "</code>";
    });
  }

  var RE_FENCE = /^```/;
  var RE_RULE = /^ {0,3}(---|\*\*\*|___)\s*$/;
  var RE_HEAD = /^(#{1,6})\s+(.*)$/;
  var RE_QUOTE = /^&gt;\s?/;
  var RE_UL = /^\s*[-*+]\s+/;
  var RE_OL = /^\s*\d+\.\s+/;

  function isBlockStart(line) {
    return RE_FENCE.test(line) || RE_RULE.test(line) || RE_HEAD.test(line) ||
      RE_QUOTE.test(line) || RE_UL.test(line) || RE_OL.test(line);
  }

  function renderMarkdown(src) {
    var lines = esc(String(src).replace(/\r\n?/g, "\n")).split("\n");
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      if (RE_FENCE.test(line)) {
        var lang = line.slice(3).trim();
        var code = [];
        i++;
        while (i < lines.length && !RE_FENCE.test(lines[i])) code.push(lines[i++]);
        i++; // closing fence
        out.push('<pre class="prose__pre"' + (lang ? ' data-lang="' + lang + '"' : "") +
          "><code>" + code.join("\n") + "</code></pre>");
        continue;
      }

      if (RE_RULE.test(line)) { out.push("<hr>"); i++; continue; }

      var h = RE_HEAD.exec(line);
      if (h) {
        var lvl = h[1].length;
        out.push("<h" + lvl + ">" + inline(h[2].trim()) + "</h" + lvl + ">");
        i++;
        continue;
      }

      if (RE_QUOTE.test(line)) {
        var quote = [];
        while (i < lines.length && RE_QUOTE.test(lines[i])) {
          quote.push(lines[i++].replace(RE_QUOTE, ""));
        }
        out.push("<blockquote>" + inline(quote.join(" ")) + "</blockquote>");
        continue;
      }

      if (RE_UL.test(line) || RE_OL.test(line)) {
        var ordered = RE_OL.test(line);
        var re = ordered ? RE_OL : RE_UL;
        var tag = ordered ? "ol" : "ul";
        var items = [];
        while (i < lines.length && re.test(lines[i])) {
          items.push("<li>" + inline(lines[i++].replace(re, "")) + "</li>");
        }
        out.push("<" + tag + ">" + items.join("") + "</" + tag + ">");
        continue;
      }

      var para = [];
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
        para.push(lines[i++].trim());
      }
      out.push("<p>" + inline(para.join(" ")) + "</p>");
    }

    return out.join("\n");
  }

  /* ---------- data ---------- */
  function loadManifest() {
    return fetch(MANIFEST)
      .then(function (r) { if (!r.ok) throw new Error("no manifest"); return r.json(); })
      .then(function (data) {
        var posts = (data && data.posts) || [];
        return posts.filter(function (p) { return p && p.slug && !p.draft; })
          .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      });
  }

  /* ---------- view: list ----------
     The blog isn't tech-only. Categories are whatever the posts declare, the
     same way the home page's stack bars are whatever the projects declare.
     Nothing here hardcodes a topic, so writing about something new just works.
  */
  function categoriesIn(posts) {
    var seen = [];
    posts.forEach(function (p) {
      if (p.category && seen.indexOf(p.category) < 0) seen.push(p.category);
    });
    return seen.sort();
  }

  function renderFilters(posts, active, mount) {
    var cats = categoriesIn(posts);
    if (cats.length < 2) { mount.innerHTML = ""; return; }  // one topic needs no filter
    mount.innerHTML =
      '<a class="filter' + (active ? "" : " is-on") + '" href="./">everything</a>' +
      cats.map(function (c) {
        return '<a class="filter' + (c === active ? " is-on" : "") +
          '" href="?c=' + encodeURIComponent(c) + '">' + esc(c) + "</a>";
      }).join("");
  }

  function renderList(posts, mount) {
    if (!posts.length) {
      mount.innerHTML = '<p class="section-lead">Nothing here yet.</p>';
      return;
    }
    mount.innerHTML = posts.map(function (p) {
      var chips = [];
      if (p.category) chips.push('<span class="tag tag--cat">' + esc(p.category) + "</span>");
      (p.tags || []).forEach(function (t) { chips.push('<span class="tag">' + esc(t) + "</span>"); });
      return (
        '<a class="post" href="?p=' + encodeURIComponent(p.slug) + '">' +
          '<div class="card__meta">' + esc(metaLine(p)) + "</div>" +
          '<h2 class="post__title">' + esc(p.title || p.slug) + "</h2>" +
          '<p class="post__body">' + esc(p.summary || "") + "</p>" +
          (chips.length ? '<div class="tags">' + chips.join("") + "</div>" : "") +
        "</a>"
      );
    }).join("");
  }

  /* ---------- view: single post ---------- */
  function renderPost(post, body, mount) {
    var chips = [];
    if (post.category) chips.push('<span class="tag tag--cat">' + esc(post.category) + "</span>");
    (post.tags || []).forEach(function (t) { chips.push('<span class="tag">' + esc(t) + "</span>"); });
    var tags = chips.join("");
    mount.innerHTML =
      '<article class="prose">' +
        '<div class="card__meta">' + esc(metaLine(post)) + "</div>" +
        '<h1 class="prose__title">' + esc(post.title || post.slug) + "</h1>" +
        (tags ? '<div class="tags">' + tags + "</div>" : "") +
        '<div class="prose__body">' + renderMarkdown(body) + "</div>" +
      "</article>" +
      '<a class="btn btn--paper btn--sm" href="./" style="margin-top:40px;">← all posts</a>';
    document.title = (post.title || post.slug) + " · Luis A. Munoz";
    var desc = document.querySelector('meta[name="description"]');
    if (desc && post.summary) desc.setAttribute("content", post.summary);
  }

  function notFound(mount) {
    mount.innerHTML =
      '<h1 class="prose__title">That post isn\'t here.</h1>' +
      '<p class="section-lead">The link might be old or the slug might be wrong.</p>' +
      '<a class="btn btn--gold btn--sm" href="./" style="margin-top:24px;">← all posts</a>';
  }

  // Exported so the renderer can be unit-tested outside a browser.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderMarkdown: renderMarkdown };
  }

  /* ---------- boot ---------- */
  if (typeof document === "undefined") return;
  var mount = document.getElementById("blog-root");
  if (!mount) return;

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("p");
  var cat = params.get("c");
  var listHead = document.getElementById("blog-list-head");
  var filterEl = document.getElementById("blog-filters");

  loadManifest().then(function (posts) {
    if (!slug) {
      if (listHead) listHead.hidden = false;
      if (filterEl) renderFilters(posts, cat, filterEl);
      renderList(
        cat ? posts.filter(function (p) { return p.category === cat; }) : posts,
        mount
      );
      return;
    }
    var post = posts.filter(function (p) { return p.slug === slug; })[0];
    if (!post) { notFound(mount); return; }
    return fetch(POSTS_DIR + encodeURIComponent(post.slug) + ".md")
      .then(function (r) { if (!r.ok) throw new Error("no post file"); return r.text(); })
      .then(function (body) { renderPost(post, body, mount); });
  }).catch(function () {
    notFound(mount);
  });
})();
