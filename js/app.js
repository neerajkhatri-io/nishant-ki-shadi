// ─────────────────────────────────────────────────────────
// APP.JS — State, navigation, events, boot
// Depends on: data.js (all helpers) and render.js (render functions)
// ─────────────────────────────────────────────────────────

// ─── STATE ───────────────────────────────────────────────
var st = {
  screen:    'home',
  catId:     null,
  vendorId:  null,
  direction: null,
  data:      loadData()
};

// ─── NAVIGATION ──────────────────────────────────────────
function go(screen, opts, dir) {
  opts = opts || {};
  st.screen    = screen;
  st.direction = dir || null;
  if (opts.catId    !== undefined) st.catId    = opts.catId;
  if (opts.vendorId !== undefined) st.vendorId = opts.vendorId;
  render();
}

// ─── RENDER ──────────────────────────────────────────────
function render() {
  var html = '';
  if      (st.screen === 'home')      html = renderHome(st);
  else if (st.screen === 'category')  html = renderCategory(st);
  else if (st.screen === 'form')      html = renderForm(st);
  else if (st.screen === 'dashboard') html = renderDashboard(st);

  var appEl = document.getElementById('app');
  appEl.innerHTML = html;

  var root = appEl.firstElementChild;
  if (root) {
    if (st.direction === 'forward') {
      root.classList.add('screen-enter-right');
      setTimeout(function() { root.classList.remove('screen-enter-right'); }, 300);
    } else if (st.direction === 'back') {
      root.classList.add('screen-enter-left');
      setTimeout(function() { root.classList.remove('screen-enter-left'); }, 300);
    }
  }

  if (st.screen === 'dashboard') animateCounters();
  window.scrollTo(0, 0);
}

// ─── COUNT-UP ANIMATION ──────────────────────────────────
function animateCounters() {
  var duration = 850;
  var start = performance.now();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    var progress = Math.min((now - start) / duration, 1);
    var ease = easeOutCubic(progress);

    document.querySelectorAll('.count-up[data-target]').forEach(function(el) {
      var target = parseFloat(el.dataset.target) || 0;
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';
      var current = Math.round(ease * target);

      if (prefix === '₹') {
        if (target === 0) {
          el.textContent = '—';
        } else if (current === 0) {
          el.textContent = '₹0';
        } else {
          el.textContent = fmt(current);
        }
      } else {
        el.textContent = current + suffix;
      }
    });

    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ─── RIPPLE EFFECT ───────────────────────────────────────
function addRipple(ev) {
  var el = ev.target.closest(
    '.cat-tile, .vendor-card, .nav-tab, .save-btn, .export-btn, .add-vendor-btn, .back-btn'
  );
  if (!el) return;
  var rect   = el.getBoundingClientRect();
  var size   = Math.max(rect.width, rect.height) * 1.7;
  var x      = (ev.clientX - rect.left) - size / 2;
  var y      = (ev.clientY - rect.top)  - size / 2;
  var ripple = document.createElement('span');
  ripple.className   = 'ripple';
  ripple.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px;';
  el.appendChild(ripple);
  setTimeout(function() {
    if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
  }, 680);
}

// ─── CLICK DELEGATE ──────────────────────────────────────
document.addEventListener('click', function(ev) {
  addRipple(ev);

  var el = ev.target.closest('[data-a]');
  if (!el) return;
  var a = el.dataset.a;

  if (a === 'home')       return go('home',     {},   'back');
  if (a === 'dashboard')  return go('dashboard', {});
  if (a === 'cat')        return go('category',  { catId: el.dataset.id, vendorId: null }, 'forward');
  if (a === 'add')        return go('form',      { vendorId: null }, 'forward');
  if (a === 'edit')       return go('form',      { vendorId: el.dataset.id }, 'forward');
  if (a === 'back')       return go('category',  { catId: st.catId, vendorId: null }, 'back');
  if (a === 'export')     return exportCSV(st.data);

  if (a === 'addcat') {
    var catName = (window.prompt('Enter a name for the new category:\n(e.g. Tent House, Fireworks, Band Baja, Venue etc.)') || '').trim();
    if (!catName) return;
    if (!st.data.customCats) st.data.customCats = [];
    var iconPool  = CUSTOM_CAT_ICONS;
    var colorPool = CUSTOM_CAT_COLORS;
    var idx       = st.data.customCats.length;
    var newCat = {
      id:    'custom_' + uid(),
      name:  catName,
      icon:  iconPool[idx % iconPool.length],
      color: colorPool[idx % colorPool.length],
      desc:  'Custom Category'
    };
    st.data.customCats.push(newCat);
    persist(st.data);
    return go('category', { catId: newCat.id, vendorId: null }, 'forward');
  }

  if (a === 'setstatus') {
    var val = el.dataset.val;
    var fi = document.getElementById('f-status');
    if (fi) fi.value = val;
    document.querySelectorAll('.status-choice').forEach(function(b) {
      b.classList.toggle('active', b.dataset.val === val);
    });
    return;
  }

  if (a === 'star') {
    var starVal = parseInt(el.dataset.val);
    var ri = document.getElementById('f-rating');
    if (ri) ri.value = starVal;
    document.querySelectorAll('[data-a="star"]').forEach(function(s, i) {
      var filled = i < starVal;
      s.textContent = filled ? '★' : '☆';
      s.classList.toggle('filled', filled);
    });
    return;
  }

  if (a === 'save') {
    var nameEl = document.getElementById('f-name');
    var name   = nameEl ? nameEl.value.trim() : '';
    if (!name) { alert('Please enter a vendor / shop name'); return; }

    var isEdit = !!st.vendorId;
    var obj = {
      id:             isEdit ? st.vendorId : uid(),
      name:           name,
      phone:          (document.getElementById('f-phone').value || '').trim(),
      location:       (document.getElementById('f-loc').value || '').trim(),
      quotedPrice:    document.getElementById('f-price').value || '',
      packageDetails: (document.getElementById('f-pkg').value || '').trim(),
      status:         document.getElementById('f-status').value || 'exploring',
      rating:         parseInt(document.getElementById('f-rating').value) || 0,
      remarks:        (document.getElementById('f-remarks').value || '').trim(),
    };

    var list = vendorsFor(st.data, st.catId).slice();
    if (isEdit) {
      var idx = -1;
      for (var i = 0; i < list.length; i++) { if (list[i].id === st.vendorId) { idx = i; break; } }
      if (idx >= 0) list[idx] = obj; else list.push(obj);
    } else {
      list.push(obj);
    }
    st.data.vendors[st.catId] = list;
    persist(st.data);
    return go('category', { catId: st.catId, vendorId: null }, 'back');
  }

  if (a === 'delete') {
    if (!confirm('Delete this vendor? This cannot be undone.')) return;
    st.data.vendors[st.catId] = vendorsFor(st.data, st.catId).filter(function(v) {
      return v.id !== el.dataset.id;
    });
    persist(st.data);
    return go('category', { catId: st.catId, vendorId: null }, 'back');
  }
});

// ─── BUDGET INPUTS ───────────────────────────────────────
document.addEventListener('change', function(ev) {
  if (ev.target.id === 'b-budget') {
    st.data.budget = parseFloat(ev.target.value) || 0;
    persist(st.data);
    render();
  } else if (ev.target.id === 'b-paid') {
    st.data.paidAmount = parseFloat(ev.target.value) || 0;
    persist(st.data);
    render();
  }
});

// ─── BOOT ────────────────────────────────────────────────
var _hasAnyVendor = Object.values(st.data.vendors).some(function(arr) { return arr && arr.length > 0; });
if (!_hasAnyVendor) {
  st.data = seedDummyData(st.data);
  persist(st.data);
}
render();
