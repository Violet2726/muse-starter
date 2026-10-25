/* LLM 辩论与意见动力学文献集 — 展示逻辑层（数据见 data/papers.json，样式见 styles.css） */
(function () {
  "use strict";

  var READ_KEY = "llm-debate-read-v1"; // 与旧版单页共用键与编号（no = 清单序号 1–79），已读记录可平滑迁移
  var THEME_KEY = "llm-debate-theme-v1";
  var VENUE_COLOR = {
    NeurIPS: "var(--v-neurips)",
    ICML: "var(--v-icml)",
    ICLR: "var(--v-iclr)",
    ACL: "var(--v-acl)",
    AAAI: "var(--v-aaai)",
  };
  var DISPLAY_LABEL = { spotlight: "Spotlight", poster: "Poster", oral: "Oral", regular: "Regular" };

  var PAPERS = [];
  var readSet = loadRead();
  var state = { q: "", venue: "all", year: "all", theme: "all", dec: "all", read: "all", sort: "ydesc" };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- 阅读记录（与旧版格式兼容） ---------- */
  function loadRead() {
    try {
      var raw = localStorage.getItem(READ_KEY);
      if (!raw) return {};
      var arr = JSON.parse(raw);
      var s = {};
      if (Array.isArray(arr)) {
        arr.forEach(function (n) {
          if (typeof n === "number" && n >= 1 && n <= 79) s[n] = true;
        });
      }
      return s;
    } catch (e) {
      return {};
    }
  }
  function saveRead() {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(Object.keys(readSet).map(Number)));
    } catch (e) {
      /* 存储不可用时本会话仍可正常使用 */
    }
  }
  function readCountTotal() {
    return Object.keys(readSet).length;
  }

  /* ---------- 主题切换 ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function syncThemeBtn() {
    var btn = document.getElementById("themeBtn");
    btn.textContent = currentTheme() === "light" ? "切换暗色" : "切换亮色";
  }
  document.getElementById("themeBtn").addEventListener("click", function () {
    var next = currentTheme() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
    syncThemeBtn();
  });
  syncThemeBtn();

  /* ---------- 筛选 chips ---------- */
  function buildChips(containerId, options, key) {
    var box = document.getElementById(containerId);
    options.forEach(function (opt) {
      var b = el("button", "chip" + (state[key] === String(opt.value) ? " on" : ""), opt.label);
      b.type = "button";
      b.addEventListener("click", function () {
        state[key] = String(opt.value);
        syncChips(containerId, options, key);
        render();
      });
      box.appendChild(b);
    });
  }
  function syncChips(containerId, options, key) {
    var box = document.getElementById(containerId);
    var btns = box.querySelectorAll("button");
    btns.forEach(function (b, i) {
      b.classList.toggle("on", state[key] === String(options[i].value));
    });
  }

  /* ---------- 分布条（点击筛选） ---------- */
  function countBy(fn) {
    var m = {};
    PAPERS.forEach(function (p) {
      var k = fn(p);
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }
  function buildBars(containerId, items, key, chipId, options) {
    var box = document.getElementById(containerId);
    box.innerHTML = "";
    var max = Math.max.apply(null, items.map(function (d) { return d.n; }));
    items.forEach(function (d) {
      var b = el("button", "bar-row");
      b.type = "button";
      b.setAttribute("aria-label", "按" + d.label + "筛选，共 " + d.n + " 篇");
      b.appendChild(el("span", "bl", d.label));
      var bt = el("span", "bt");
      var bf = el("span", "bf");
      bf.style.width = Math.max(3, (d.n / max) * 100) + "%";
      if (d.color) bf.style.setProperty("--bar-c", d.color);
      bt.appendChild(bf);
      b.appendChild(bt);
      b.appendChild(el("span", "bn", String(d.n)));
      b.addEventListener("click", function () {
        state[key] = String(d.value);
        syncChips(chipId, options, key);
        render();
        document.getElementById("list").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      box.appendChild(b);
    });
  }

  /* ---------- 渲染 ---------- */
  function filtered() {
    var q = state.q.trim().toLowerCase();
    var list = PAPERS.filter(function (p) {
      if (state.venue !== "all" && p.venue !== state.venue) return false;
      if (state.year !== "all" && String(p.year) !== state.year) return false;
      if (state.theme !== "all" && p.theme !== state.theme) return false;
      if (state.dec !== "all" && p.display !== state.dec) return false;
      if (state.read === "read" && !readSet[p.no]) return false;
      if (state.read === "unread" && readSet[p.no]) return false;
      if (q) {
        var hay = (p.title + " " + (p.intro || "") + " " + (p.authors || []).join(" ") + " " + p.themeName).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (state.sort === "ydesc") list.sort(function (a, b) { return b.year - a.year || a.no - b.no; });
    else if (state.sort === "yasc") list.sort(function (a, b) { return a.year - b.year || a.no - b.no; });
    else if (state.sort === "venue") list.sort(function (a, b) {
      return a.venue.localeCompare(b.venue) || b.year - a.year || a.no - b.no;
    });
    else list.sort(function (a, b) { return a.no - b.no; });
    return list;
  }

  function paperRow(p) {
    var row = el("article", "paper" + (readSet[p.no] ? " is-read" : ""));
    var chkWrap = el("label", "readcheck");
    chkWrap.title = "标记为已读";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!readSet[p.no];
    input.setAttribute("aria-label", "标记已读：" + p.title);
    input.addEventListener("change", function () {
      if (input.checked) readSet[p.no] = true;
      else delete readSet[p.no];
      saveRead();
      render();
    });
    chkWrap.appendChild(input);
    row.appendChild(chkWrap);

    var body = el("div", "paper-body");
    var h = el("h2", "ptitle");
    var a = document.createElement("a");
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = p.title;
    h.appendChild(a);
    body.appendChild(h);

    var meta = el("div", "meta");
    var vb = el("span", "vbadge");
    var dot = el("span", "vdot");
    dot.style.setProperty("--dot", VENUE_COLOR[p.venue] || "var(--accent)");
    vb.appendChild(dot);
    vb.appendChild(document.createTextNode(p.venue + " " + p.year));
    meta.appendChild(vb);
    if (p.track) meta.appendChild(el("span", "mchip", p.track));
    if (p.decision) meta.appendChild(el("span", "mchip", p.decision));
    if (DISPLAY_LABEL[p.display]) meta.appendChild(el("span", "mchip", DISPLAY_LABEL[p.display]));
    meta.appendChild(el("span", "mchip", p.themeName));
    if (readSet[p.no]) meta.appendChild(el("span", "readtag", "已读"));
    body.appendChild(meta);

    if (p.authors && p.authors.length) {
      body.appendChild(el("p", "authors", p.authors.join(" · ")));
    }
    if (p.intro) body.appendChild(el("p", "intro", p.intro));
    if (p.highlight) {
      var hl = el("p", "highlight");
      hl.appendChild(el("b", null, "亮点："));
      hl.appendChild(document.createTextNode(p.highlight));
      body.appendChild(hl);
    }
    body.appendChild(el("p", "basis", "介绍依据：" + (p.basis === "fulltext" ? "论文全文" : "论文摘要")));
    row.appendChild(body);
    return row;
  }

  function render() {
    var list = filtered();
    var box = document.getElementById("list");
    box.innerHTML = "";
    list.forEach(function (p) { box.appendChild(paperRow(p)); });
    document.getElementById("shown").textContent = String(list.length);
    document.getElementById("empty").hidden = list.length > 0;
    document.getElementById("readCount").textContent = String(readCountTotal());
    document.getElementById("statRead").textContent = String(readCountTotal());
    var bar = document.getElementById("readBar");
    bar.style.width = (PAPERS.length ? (readCountTotal() / PAPERS.length) * 100 : 0) + "%";
    document.getElementById("readBarWrap").setAttribute("aria-valuenow", String(readCountTotal()));
  }

  /* ---------- 工具栏事件 ---------- */
  document.getElementById("q").addEventListener("input", function (e) {
    state.q = e.target.value;
    render();
  });
  document.getElementById("sortsel").addEventListener("change", function (e) {
    state.sort = e.target.value;
    render();
  });
  document.getElementById("clear").addEventListener("click", function () {
    state = { q: "", venue: "all", year: "all", theme: "all", dec: "all", read: "all", sort: state.sort };
    document.getElementById("q").value = "";
    syncAllChips();
    render();
  });

  var venueOptions, yearOptions, decOptions, themeOptions, readOptions;
  function syncAllChips() {
    syncChips("f-venue", venueOptions, "venue");
    syncChips("f-year", yearOptions, "year");
    syncChips("f-dec", decOptions, "dec");
    syncChips("f-theme", themeOptions, "theme");
    syncChips("f-read", readOptions, "read");
  }

  /* ---------- 导出 / 导入（与旧版格式兼容） ---------- */
  function setStatus(msg) {
    document.getElementById("ioStatus").textContent = msg;
  }
  document.getElementById("btnExport").addEventListener("click", function () {
    var data = {
      app: "llm-debate-literature",
      version: 1,
      exportedAt: new Date().toISOString(),
      total: PAPERS.length,
      readCount: readCountTotal(),
      read: PAPERS.filter(function (p) { return readSet[p.no]; }).map(function (p) {
        return { no: p.no, title: p.title };
      }),
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "reading-record.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    setStatus("已导出 " + data.readCount + " 篇阅读记录。");
  });
  var fileInput = document.getElementById("fileImport");
  document.getElementById("btnImport").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var f = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var list = Array.isArray(data) ? data : data.read;
        if (!Array.isArray(list)) throw new Error("bad format");
        var s = {}, n = 0;
        list.forEach(function (item) {
          var no = null;
          if (typeof item === "number") no = item;
          else if (item && typeof item.no === "number") no = item.no;
          else if (item && typeof item.idx === "number") no = item.idx;
          if (no != null && no >= 1 && no <= PAPERS.length && !s[no]) { s[no] = true; n++; }
        });
        readSet = s;
        saveRead();
        render();
        setStatus("已导入 " + n + " 篇阅读记录。");
      } catch (e) {
        setStatus("导入失败：文件格式不对。");
      }
    };
    reader.readAsText(f);
  });

  /* ---------- 启动：加载数据 ---------- */
  fetch("data/papers.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      PAPERS = data;
      document.getElementById("statTotal").textContent = String(PAPERS.length);

      var venues = Object.keys(countBy(function (p) { return p.venue; })).sort();
      venueOptions = [{ value: "all", label: "全部会议" }].concat(venues.map(function (v) {
        return { value: v, label: v };
      }));
      var years = Object.keys(countBy(function (p) { return p.year; })).sort(function (a, b) { return b - a; });
      yearOptions = [{ value: "all", label: "全部年份" }].concat(years.map(function (y) {
        return { value: y, label: y };
      }));
      var decs = ["spotlight", "poster", "oral", "regular"].filter(function (d) {
        return PAPERS.some(function (p) { return p.display === d; });
      });
      decOptions = [{ value: "all", label: "全部展示" }].concat(decs.map(function (d) {
        return { value: d, label: DISPLAY_LABEL[d] };
      }));
      var themeMap = {};
      PAPERS.forEach(function (p) { themeMap[p.theme] = p.themeName; });
      themeOptions = [{ value: "all", label: "全部主题" }].concat(Object.keys(themeMap).sort().map(function (t) {
        return { value: t, label: themeMap[t] };
      }));
      readOptions = [
        { value: "all", label: "全部" },
        { value: "read", label: "已读" },
        { value: "unread", label: "未读" },
      ];

      buildChips("f-venue", venueOptions, "venue");
      buildChips("f-year", yearOptions, "year");
      buildChips("f-dec", decOptions, "dec");
      buildChips("f-theme", themeOptions, "theme");
      buildChips("f-read", readOptions, "read");

      var vc = countBy(function (p) { return p.venue; });
      buildBars("venueBars", venues.map(function (v) {
        return { label: v, value: v, n: vc[v], color: VENUE_COLOR[v] };
      }), "venue", "f-venue", venueOptions);
      var yc = countBy(function (p) { return p.year; });
      buildBars("yearBars", years.map(function (y) {
        return { label: y + " 年", value: y, n: yc[y], color: null };
      }), "year", "f-year", yearOptions);

      render();
    })
    .catch(function () {
      document.getElementById("list").innerHTML = "";
      var div = el("div", "load-error", "数据加载失败，请刷新页面重试。");
      document.getElementById("list").appendChild(div);
    });
})();
