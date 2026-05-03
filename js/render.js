// ─────────────────────────────────────────────────────────
// RENDER.JS — HTML-building functions
// ─────────────────────────────────────────────────────────

var FAMILY_NAMES = ['Neeraj','Bhavna','Nishant','Saijal','Anila','Shyam'];

// ─── NAV BAR ─────────────────────────────────────────────
function navBar(active) {
  return '<div class="bottom-nav">' +
    '<button class="nav-tab ' + (active === 'home' ? 'active' : '') + '" data-a="home">' +
      '<span class="nicon">🏠</span><span>Home</span>' +
    '</button>' +
    '<button class="nav-tab ' + (active === 'dashboard' ? 'active' : '') + '" data-a="dashboard">' +
      '<span class="nicon">📊</span><span>Dashboard</span>' +
    '</button>' +
  '</div>';
}

// ─── STATUS PILL SELECTOR ────────────────────────────────
function renderStatusPills(currentStatus) {
  return '<div class="status-pill-row">' +
    Object.keys(STATUS).map(function(val) {
      var label = STATUS[val].label.split(' ').slice(1).join(' ');
      return '<button class="status-choice' + (currentStatus === val ? ' active' : '') +
        '" data-a="setstatus" data-val="' + val + '">' + label + '</button>';
    }).join('') +
  '</div>';
}

// ─── ADDED BY PICKER ─────────────────────────────────────
function renderNamePills(current) {
  return '<div class="name-pill-row">' +
    FAMILY_NAMES.map(function(name) {
      return '<button class="name-pill' + (current === name ? ' active' : '') +
        '" data-a="addedby" data-val="' + name + '">' + name + '</button>';
    }).join('') +
  '</div>';
}

// ─── SINGLE VENDOR CARD ──────────────────────────────────
function renderVendorCard(v, accent) {
  var stInfo = STATUS[v.status] || STATUS.exploring;
  var pkg = v.packageDetails
    ? '<div class="vc-details">' + esc(v.packageDetails.substring(0, 100)) + (v.packageDetails.length > 100 ? '…' : '') + '</div>'
    : '';
  var rmk = v.remarks
    ? '<div class="vc-remark">"' + esc(v.remarks.substring(0, 65)) + (v.remarks.length > 65 ? '…' : '') + '"</div>'
    : '';

  var byTag = v.addedBy
    ? '<div class="vc-addedby">Added by ' + esc(v.addedBy) + '</div>'
    : '';

  return '<div class="vendor-card" style="--accent:' + (accent || '#C0A080') + '" data-a="edit" data-id="' + v.id + '">' +
    '<div class="vc-inner">' +
      '<div class="vc-top">' +
        '<div class="vc-name">' + esc(v.name || 'Unnamed') + '</div>' +
        '<div class="vc-top-right">' +
          '<div class="status-pill ' + stInfo.cls + '">' + stInfo.label + '</div>' +
          '<button class="card-del-btn" data-a="carddelete" data-id="' + v.id + '">🗑</button>' +
        '</div>' +
      '</div>' +
      (v.quotedPrice ? '<div class="vc-price">' + fmt(v.quotedPrice) + '</div>' : '') +
      pkg + rmk +
      '<div class="vc-bottom">' +
        '<div>' +
          '<div class="stars">' + stars(v.rating) + '</div>' +
          byTag +
        '</div>' +
        (v.phone ? '<div class="vc-phone">📞 ' + esc(v.phone) + '</div>' : '<div></div>') +
      '</div>' +
    '</div>' +
  '</div>';
}

// ─── HOME SCREEN ─────────────────────────────────────────
function renderHome(st) {
  var cats = allCats(st.data);
  var bookedCats  = 0;
  var activeCats  = 0;
  var pendingCats = 0;

  cats.forEach(function(c) {
    var vs = vendorsFor(st.data, c.id);
    if (vs.some(function(v) { return v.status === 'booked'; })) bookedCats++;
    else if (vs.length > 0) activeCats++;
    else pendingCats++;
  });

  var days    = daysLeft();
  var pctDone = Math.round(bookedCats / cats.length * 100);

  var STATUS_RANK = { negotiating: 3, shortlisted: 2, exploring: 1, rejected: 0 };
  var STATUS_HINT = { negotiating: '🤝 Negotiating', shortlisted: '⭐ Shortlisted', exploring: '🔍 Exploring' };

  var tiles = cats.map(function(c) {
    var vs       = vendorsFor(st.data, c.id);
    var bookedV  = vs.find(function(v) { return v.status === 'booked'; });
    var isBooked = !!bookedV;
    var inProg   = !isBooked && vs.length > 0;
    var tileClass, tileStyle, ctBadge, tileHint;

    if (isBooked) {
      tileClass = 'st-booked'; tileStyle = '';
      ctBadge   = '<span class="tile-ct">✓</span>';
      var bname = bookedV.name || '';
      tileHint  = bname ? esc(bname.substring(0, 20)) + (bname.length > 20 ? '…' : '') : 'Confirmed ✓';
    } else if (inProg) {
      tileClass = 'st-active'; tileStyle = 'style="background:' + c.color + '"';
      ctBadge   = '<span class="tile-ct">' + vs.length + '</span>';
      var bestS = vs.reduce(function(best, v) {
        return (STATUS_RANK[v.status] || 0) > (STATUS_RANK[best] || 0) ? v.status : best;
      }, vs[0].status);
      tileHint  = STATUS_HINT[bestS] || '';
    } else {
      tileClass = 'st-empty'; tileStyle = '';
      ctBadge   = '';
      tileHint  = 'Tap to start';
    }

    return '<div class="cat-tile ' + tileClass + '" ' + tileStyle + ' data-a="cat" data-id="' + c.id + '">' +
      '<div class="tile-top"><span class="tile-icon">' + c.icon + '</span>' + ctBadge + '</div>' +
      '<div><div class="tile-name">' + esc(c.name) + '</div><div class="tile-hint">' + tileHint + '</div></div>' +
    '</div>';
  }).join('');

  var addTile = '<div class="cat-tile st-add" data-a="addcat">' +
    '<div class="tile-top"><span class="tile-icon add-icon">＋</span></div>' +
    '<div><div class="tile-name">Add Category</div><div class="tile-hint">Custom vendor type</div></div>' +
  '</div>';

  return '<div>' +
    '<div class="home-header">' +
      '<h1>Nishant ki Shadi 💍</h1>' +
      '<div class="subtitle">Wedding Planning · Indore</div>' +

      '<div class="countdown-block">' +
        '<div class="countdown-ring">' +
          '<div class="countdown-petals">🌸</div>' +
          '<div class="countdown-number">' + days + '</div>' +
          '<div class="countdown-label">days to go</div>' +
        '</div>' +
      '</div>' +

      '<div class="wedding-chips">' +
        '<div class="chip">📅 Dec 13–14, 2026</div>' +
        '<div class="chip">✅ ' + bookedCats + ' booked</div>' +
      '</div>' +
      '<div class="header-progress">' +
        '<div class="hp-bar"><div class="hp-fill" style="width:' + pctDone + '%"></div></div>' +
        '<div class="hp-label">' + bookedCats + ' of ' + cats.length + ' confirmed · ' + activeCats + ' in progress · ' + pendingCats + ' pending</div>' +
      '</div>' +
    '</div>' +
    '<div class="content">' +
      '<div class="section-label">Tap a category to manage vendors</div>' +
      '<div class="cat-grid">' + tiles + addTile + '</div>' +
    '</div>' +
    navBar('home') +
  '</div>';
}

// ─── CATEGORY SCREEN ─────────────────────────────────────
function renderCategory(st) {
  var c = allCats(st.data).find(function(x) { return x.id === st.catId; });
  if (!c) return renderHome(st);

  var accentMatch = c.color.match(/#[A-Fa-f0-9]{6}/);
  var accent = accentMatch ? accentMatch[0] : '#C0A080';

  var vs = vendorsFor(st.data, st.catId).slice().sort(function(a, b) {
    return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  });

  var cards = vs.map(function(v) { return renderVendorCard(v, accent); }).join('');
  var empty = vs.length === 0
    ? '<div class="empty"><div class="eicon">' + c.icon + '</div><p>No vendors yet.<br>Tap the button above to add your first option!</p></div>'
    : '';

  return '<div>' +
    '<div class="sub-header">' +
      '<button class="back-btn" data-a="home">←</button>' +
      '<div class="sub-title">' + c.icon + ' ' + esc(c.name) + '</div>' +
    '</div>' +
    '<div class="content">' +
      '<button class="add-vendor-btn" data-a="add">＋ Add Vendor / Option</button>' +
      empty + cards +
    '</div>' +
    navBar('category') +
  '</div>';
}

// ─── FORM SCREEN ─────────────────────────────────────────
function renderForm(st) {
  var c = allCats(st.data).find(function(x) { return x.id === st.catId; });
  if (!c) return renderHome(st);

  var existing = st.vendorId
    ? vendorsFor(st.data, st.catId).find(function(v) { return v.id === st.vendorId; })
    : null;
  var v      = existing || { name:'', phone:'', location:'', quotedPrice:'', packageDetails:'', status:'exploring', rating:0, remarks:'', addedBy:'' };
  var isEdit = !!existing;

  var starBtns = [1,2,3,4,5].map(function(i) {
    var filled = i <= (v.rating || 0);
    return '<button class="star-btn' + (filled ? ' filled' : '') + '" data-a="star" data-val="' + i + '">' + (filled ? '★' : '☆') + '</button>';
  }).join('');

  return '<div>' +
    '<div class="sub-header">' +
      '<button class="back-btn" data-a="back">←</button>' +
      '<div class="sub-title">' + (isEdit ? 'Edit' : 'Add') + ' ' + c.icon + ' ' + esc(c.name) + '</div>' +
      (isEdit ? '<button class="del-btn" data-a="delete" data-id="' + v.id + '">🗑️</button>' : '') +
    '</div>' +
    '<div class="content">' +

    '<div class="form-section">' +
      '<label class="field-label req">Vendor / Shop Name</label>' +
      '<input id="f-name" type="text" class="form-input" value="' + esc(v.name) + '" placeholder="e.g. Raj Photography Studio">' +
      '<label class="field-label">Phone Number</label>' +
      '<input id="f-phone" type="tel" class="form-input" value="' + esc(v.phone) + '" placeholder="9876543210">' +
      '<label class="field-label" style="margin-bottom:7px">Location / Area</label>' +
      '<input id="f-loc" type="text" class="form-input" style="margin-bottom:0" value="' + esc(v.location) + '" placeholder="e.g. Vijay Nagar, Indore">' +
    '</div>' +

    '<div class="form-section">' +
      '<label class="field-label">Quoted Price (₹)</label>' +
      '<input id="f-price" type="number" class="form-input" value="' + esc(v.quotedPrice) + '" placeholder="e.g. 75000">' +
      '<label class="field-label" style="margin-bottom:7px">Package / What\'s Included</label>' +
      '<textarea id="f-pkg" class="form-input" style="margin-bottom:0" placeholder="e.g. 8 hrs, 2 photographers, 500 edited photos, album">' + esc(v.packageDetails) + '</textarea>' +
    '</div>' +

    '<div class="form-section">' +
      '<label class="field-label">Status</label>' +
      renderStatusPills(v.status) +
      '<input type="hidden" id="f-status" value="' + esc(v.status) + '">' +
      '<label class="field-label">Value for Money</label>' +
      '<div class="star-row">' + starBtns + '</div>' +
      '<input type="hidden" id="f-rating" value="' + (v.rating || 0) + '">' +
      '<label class="field-label" style="margin-bottom:7px">Remarks / Notes</label>' +
      '<textarea id="f-remarks" class="form-input" style="margin-bottom:0" placeholder="e.g. Very professional. Can negotiate ₹5K. Recommended by Sharma uncle.">' + esc(v.remarks) + '</textarea>' +
    '</div>' +

    '<div class="form-section">' +
      '<label class="field-label">Who is adding this?</label>' +
      renderNamePills(v.addedBy) +
      '<input type="hidden" id="f-added-by" value="' + esc(v.addedBy) + '">' +
    '</div>' +

    '<button class="save-btn" data-a="save">' + (isEdit ? '💾  Save Changes' : '✅  Add Vendor') + '</button>' +
    (isEdit ? '<button class="cancel-btn" data-a="back">Cancel</button>' : '') +
    '</div>' +
  '</div>';
}

// ─── DASHBOARD SCREEN ────────────────────────────────────
function renderDashboard(st) {
  var cats = allCats(st.data);
  var allV = Object.values(st.data.vendors).reduce(function(a, b) { return a.concat(b); }, []);

  var bookedAmt  = allV.filter(function(v) { return v.status === 'booked'; })
                       .reduce(function(s, v) { return s + (Number(v.quotedPrice) || 0); }, 0);
  var budget     = st.data.budget || 0;
  var paidAmt    = st.data.paidAmount || 0;
  var balanceDue = Math.max(0, bookedAmt - paidAmt);
  var remaining  = budget > 0 ? Math.max(0, budget - paidAmt) : null;
  var pctPaid    = budget > 0 ? Math.min(100, Math.round(paidAmt   / budget * 100)) : 0;
  var pctCommit  = budget > 0 ? Math.min(100, Math.round(bookedAmt / budget * 100)) : 0;
  var commitLeft = Math.max(0, pctCommit - pctPaid);

  var bookedCats = cats.filter(function(c) {
    return vendorsFor(st.data, c.id).some(function(v) { return v.status === 'booked'; });
  }).length;
  var activeCats = cats.filter(function(c) { return vendorsFor(st.data, c.id).length > 0; }).length;
  var pctBooked  = Math.round(bookedCats / cats.length * 100);
  var pctActive  = Math.round(activeCats / cats.length * 100);

  var breakdown = cats.map(function(c) {
    var vs = vendorsFor(st.data, c.id);
    if (!vs.length) return null;
    var booked  = vs.find(function(v) { return v.status === 'booked'; });
    var topAmt  = booked
      ? (Number(booked.quotedPrice) || 0)
      : Math.max.apply(null, [0].concat(vs.map(function(v) { return Number(v.quotedPrice) || 0; })));
    var am = c.color.match(/#[A-Fa-f0-9]{6}/);
    return { c: c, vs: vs, topAmt: topAmt, booked: booked, accent: am ? am[0] : '#C0A080' };
  }).filter(Boolean).sort(function(a, b) { return b.topAmt - a.topAmt; });

  var rows = breakdown.map(function(item) {
    return '<div class="breakdown-row">' +
      '<div class="br-name"><div class="br-dot" style="--dot:' + item.accent + '"></div>' +
        item.c.icon + ' ' + esc(item.c.name) + (item.booked ? ' ✅' : '') +
      '</div>' +
      '<div class="br-right">' +
        '<div class="br-amount">' + (item.topAmt ? fmt(item.topAmt) : '—') + '</div>' +
        '<div class="br-count">' + item.vs.length + ' option' + (item.vs.length !== 1 ? 's' : '') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  var ssPills = Object.keys(STATUS).map(function(s) {
    var count = allV.filter(function(v) { return v.status === s; }).length;
    return '<div class="ss-item"><div class="ss-num">' + count + '</div><div class="ss-label">' + s + '</div></div>';
  }).join('');

  var barSection = budget > 0
    ? '<div class="bo-bar-wrap">' +
        '<div class="bo-bar">' +
          '<div class="bo-fill bo-fill-paid" style="width:' + pctPaid + '%"></div>' +
          '<div class="bo-fill bo-fill-committed" style="left:' + pctPaid + '%;width:' + commitLeft + '%"></div>' +
        '</div>' +
        '<div class="bo-legend">' +
          '<span class="leg-paid">■ Paid ' + fmt(paidAmt) + '</span>' +
          '<span class="leg-committed">■ Committed ' + fmt(bookedAmt) + '</span>' +
          '<span>Budget ' + fmt(budget) + '</span>' +
        '</div>' +
      '</div>'
    : '<div style="font-size:12px;color:#C0956A;margin-bottom:8px;font-style:italic">Enter your total budget above to see the tracker</div>';

  var budgetCard = '<div class="budget-card">' +
    '<div class="budget-card-title">💰 Wedding Budget Tracker</div>' +
    '<div class="bo-input-row">' +
      '<div><div class="bo-field-label">Total Budget (₹)</div>' +
        '<input class="bo-input" id="b-budget" type="number" value="' + (budget || '') + '" placeholder="e.g. 1500000"></div>' +
      '<div><div class="bo-field-label">Amount Paid (₹)</div>' +
        '<input class="bo-input" id="b-paid" type="number" value="' + (paidAmt || '') + '" placeholder="e.g. 50000"></div>' +
    '</div>' +
    barSection +
    '<div class="bo-stats-row">' +
      '<div class="bo-stat"><div class="bos-label">Committed</div>' +
        '<div class="bos-val count-up" data-target="' + bookedAmt + '" data-prefix="₹">' + (bookedAmt ? fmt(bookedAmt) : '—') + '</div></div>' +
      '<div class="bo-stat"><div class="bos-label">Still to Pay</div>' +
        '<div class="bos-val red">' + (balanceDue ? fmt(balanceDue) : '—') + '</div></div>' +
      '<div class="bo-stat"><div class="bos-label">Remaining</div>' +
        '<div class="bos-val green">' + (remaining !== null ? fmt(remaining) : '—') + '</div></div>' +
    '</div>' +
  '</div>';

  return '<div>' +
    '<div class="dash-header"><h1>Budget & Progress</h1><p>Nishant ki Shadi · Dec 13–14, 2026</p></div>' +
    '<div class="content">' +
    budgetCard +
    '<div class="stat-grid">' +
      '<div class="stat-card">' +
        '<div class="stat-label">Booked Total</div>' +
        '<div class="stat-value count-up" style="color:#1B5E20;font-size:' + (bookedAmt >= 100000 ? '22px' : '28px') + '" data-target="' + bookedAmt + '" data-prefix="₹">' + (bookedAmt ? fmt(bookedAmt) : '—') + '</div>' +
        '<div class="stat-sub">confirmed vendors</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-label">Categories Done</div>' +
        '<div class="stat-value count-up" data-target="' + bookedCats + '" data-suffix="/' + cats.length + '">' + bookedCats + '/' + cats.length + '</div>' +
        '<div class="stat-sub">fully booked</div>' +
      '</div>' +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="stat-label">Planning Progress</div>' +
      '<div class="progress-wrap">' +
        '<div class="prog-row"><span>Categories Booked</span><span class="prog-pct" style="color:#E65100">' + pctBooked + '%</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="--w:' + pctBooked + '%"></div></div>' +
        '<div class="prog-row"><span style="color:#1565C0">Categories Started</span><span class="prog-pct" style="color:#1565C0">' + pctActive + '%</span></div>' +
        '<div class="progress-bar"><div class="progress-fill blue" style="--w:' + pctActive + '%"></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="section-label">By Category · Highest Price First</div>' +
    (breakdown.length ? '<div class="breakdown-card">' + rows + '</div>' : '<div class="empty"><div class="eicon">📊</div><p>Add vendors to see the breakdown here</p></div>') +
    '<div class="stat-card"><div class="stat-label">All Vendors · ' + allV.length + ' total</div><div class="status-summary">' + ssPills + '</div></div>' +
    '<button class="export-btn" data-a="export">📥 Export to Excel / CSV</button>' +
    '</div>' +
    navBar('dashboard') +
  '</div>';
}
