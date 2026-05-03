// ─────────────────────────────────────────────────────────
// DATA.JS — Constants, Supabase helpers, local helpers, CSV
// No DOM references. Loaded first. Everything on window.
// ─────────────────────────────────────────────────────────

// ─── SUPABASE ─────────────────────────────────────────────
var SUPABASE_URL = 'https://ulodrjcaanmqdspgkrxz.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsb2RyamNhYW5tcWRzcGdrcnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3ODg0OTgsImV4cCI6MjA5MzM2NDQ5OH0.b-FJY9lrvKcSwfqyJ1hL8jBkqLSNpCJJHvmbgg7LqWs';

function sbFetch(path, method, body, extraHeaders) {
  var headers = {
    'apikey':        SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type':  'application/json',
  };
  if (extraHeaders) Object.assign(headers, extraHeaders);
  var opts = { method: method || 'GET', headers: headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return fetch(SUPABASE_URL + '/rest/v1/' + path, opts).then(function(r) {
    if (r.status === 204 || r.status === 201) return null;
    if (!r.ok) return r.text().then(function(t) { throw new Error(t); });
    return r.json();
  });
}

function loadFromSupabase() {
  return Promise.all([
    sbFetch('vendors?select=*&order=created_at.asc'),
    sbFetch('config?select=*'),
  ]).then(function(results) {
    var vendorRows = results[0] || [];
    var configRows = results[1] || [];
    var data = { vendors: {}, budget: 0, paidAmount: 0, customCats: [] };

    vendorRows.forEach(function(v) {
      if (!data.vendors[v.cat_id]) data.vendors[v.cat_id] = [];
      data.vendors[v.cat_id].push({
        id:             v.id,
        name:           v.name || '',
        phone:          v.phone || '',
        location:       v.location || '',
        quotedPrice:    v.quoted_price != null ? String(v.quoted_price) : '',
        packageDetails: v.package_details || '',
        status:         v.status || 'exploring',
        rating:         v.rating || 0,
        remarks:        v.remarks || '',
      });
    });

    configRows.forEach(function(row) {
      if (row.key === 'budget')      data.budget     = parseFloat(row.value) || 0;
      if (row.key === 'paid_amount') data.paidAmount  = parseFloat(row.value) || 0;
      if (row.key === 'custom_cats') {
        try { data.customCats = JSON.parse(row.value) || []; } catch(e) {}
      }
    });

    return data;
  });
}

function vendorToRow(catId, v) {
  return {
    id:              v.id,
    cat_id:          catId,
    name:            v.name || '',
    phone:           v.phone || '',
    location:        v.location || '',
    quoted_price:    v.quotedPrice ? Number(v.quotedPrice) : null,
    package_details: v.packageDetails || '',
    status:          v.status || 'exploring',
    rating:          v.rating || 0,
    remarks:         v.remarks || '',
  };
}

function upsertVendor(catId, vendor) {
  return sbFetch('vendors', 'POST', vendorToRow(catId, vendor), {
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  });
}

function removeVendor(vendorId) {
  return sbFetch('vendors?id=eq.' + encodeURIComponent(vendorId), 'DELETE');
}

function upsertConfig(key, value) {
  return sbFetch('config', 'POST', { key: key, value: String(value) }, {
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  });
}

// ─── CATEGORIES ───────────────────────────────────────────
var CATS = [
  { id:'photographer',  name:'Photographer',    icon:'📸', color:'linear-gradient(135deg,#5C06B8,#9B34EF)', desc:'Photos & Memories' },
  { id:'videographer',  name:'Videographer',    icon:'🎥', color:'linear-gradient(135deg,#C62A87,#FF1493)', desc:'Video Coverage' },
  { id:'venue',         name:'Venue / Hall',    icon:'🏛️', color:'linear-gradient(135deg,#4A148C,#7B1FA2)', desc:'Banquet & Grounds' },
  { id:'event_mgr',     name:'Event Manager',   icon:'🎊', color:'linear-gradient(135deg,#00695C,#00BCD4)', desc:'Overall Coordination' },
  { id:'decorator',     name:'Decorator',       icon:'🌸', color:'linear-gradient(135deg,#880E4F,#E91E63)', desc:'Flowers & Decor' },
  { id:'caterer',       name:'Caterer',         icon:'🍽️', color:'linear-gradient(135deg,#E65100,#FFA000)', desc:'Food & Beverages' },
  { id:'jewelry',       name:'Jewelry',         icon:'💍', color:'linear-gradient(135deg,#F57F17,#FF8F00)', desc:'Gold & Diamonds' },
  { id:'clothes',       name:'Clothes',         icon:'👗', color:'linear-gradient(135deg,#B71C1C,#F44336)', desc:'Outfits & Attire' },
  { id:'music',         name:'Music / DJ',      icon:'🎵', color:'linear-gradient(135deg,#01579B,#0288D1)', desc:'Entertainment' },
  { id:'makeup',        name:'Makeup Artist',   icon:'💄', color:'linear-gradient(135deg,#6A1B9A,#FF4081)', desc:'Bridal Makeup' },
  { id:'lighting',      name:'Lighting',        icon:'💡', color:'linear-gradient(135deg,#E65100,#FFD600)', desc:'Stage & Ambience' },
  { id:'transport',     name:'Transport',       icon:'🚗', color:'linear-gradient(135deg,#1A237E,#3F51B5)', desc:'Cars & Buses' },
  { id:'accommodation', name:'Accommodation',   icon:'🏨', color:'linear-gradient(135deg,#1B5E20,#43A047)', desc:'Guest Rooms' },
  { id:'mehndi',        name:'Mehndi Artist',   icon:'🌿', color:'linear-gradient(135deg,#1B5E20,#558B2F)', desc:'Henna Design' },
  { id:'pandit',        name:'Pandit / Priest', icon:'🙏', color:'linear-gradient(135deg,#BF360C,#FF5722)', desc:'Rituals & Ceremony' },
  { id:'invitation',    name:'Invitations',     icon:'📬', color:'linear-gradient(135deg,#1A237E,#7B1FA2)', desc:'Cards & Digital' },
  { id:'gifts',         name:'Return Gifts',    icon:'🎁', color:'linear-gradient(135deg,#4A148C,#880E4F)', desc:'Gifts & Favours' },
];

var STATUS = {
  exploring:   { label:'🔍 Exploring',   cls:'s-exploring' },
  shortlisted: { label:'⭐ Shortlisted',  cls:'s-shortlisted' },
  negotiating: { label:'🤝 Negotiating', cls:'s-negotiating' },
  booked:      { label:'✅ Booked',       cls:'s-booked' },
  rejected:    { label:'❌ Rejected',     cls:'s-rejected' },
};

var STATUS_ORDER = ['booked','negotiating','shortlisted','exploring','rejected'];

var CUSTOM_CAT_ICONS  = ['🛍️','🏮','🎨','🚌','🎭','🌺','💼','🎀','🏕️','🎇','🪅','🪄'];
var CUSTOM_CAT_COLORS = [
  'linear-gradient(135deg,#006064,#00838F)',
  'linear-gradient(135deg,#1A237E,#283593)',
  'linear-gradient(135deg,#BF360C,#D84315)',
  'linear-gradient(135deg,#37474F,#546E7A)',
  'linear-gradient(135deg,#4E342E,#795548)',
];

// ─── LOCAL HELPERS ────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function fmt(p) {
  var n = Number(p);
  if (!n) return '—';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(1) + ' L';
  if (n >= 1000)     return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}

function stars(r) {
  if (!r) return '';
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function daysLeft() {
  return Math.max(0, Math.ceil((new Date('2026-12-13') - new Date()) / 86400000));
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function vendorsFor(data, catId) {
  return (data.vendors && data.vendors[catId]) || [];
}

function allCats(data) {
  return CATS.concat((data && data.customCats) || []);
}

// ─── DUMMY DATA SEED ──────────────────────────────────────
function seedDummyData(data) {
  data.vendors = {
    photographer: [
      { id: uid(), name: 'Raj Photography Studio', phone: '9826012345', location: 'Vijay Nagar, Indore', quotedPrice: '85000', packageDetails: '10 hrs, 2 photographers, 600 edited photos, same-day highlights reel, premium album', status: 'booked', rating: 5, remarks: 'Very professional. Portfolio is stunning. Confirmed after meeting. Paid advance ₹20K.' },
      { id: uid(), name: 'Sharma Click Arts', phone: '9981234567', location: 'Palasia, Indore', quotedPrice: '65000', packageDetails: '8 hrs, 1 photographer, 400 edited photos, basic album', status: 'rejected', rating: 3, remarks: 'Good but portfolio felt dated. Went with Raj instead.' },
    ],
    videographer: [
      { id: uid(), name: 'Cinematic Dreams Indore', phone: '9826056789', location: 'Scheme 54, Indore', quotedPrice: '120000', packageDetails: '4K cinematic film, drone coverage, same-day edit reel, 10-min highlight video, raw footage', status: 'shortlisted', rating: 4, remarks: 'Great work. Need to negotiate price. Checking one more option.' },
    ],
    venue: [
      { id: uid(), name: 'Hotel Sayaji Indore', phone: '07314444555', location: 'Vijay Nagar, Indore', quotedPrice: '650000', packageDetails: 'Full banquet hall, 500 pax, lawn + AC hall combo, bridal suite, parking, basic lighting', status: 'negotiating', rating: 4, remarks: 'Quoted ₹6.5L but should come to ₹5.8L. Need final meeting with manager.' },
      { id: uid(), name: 'Emerald Heights Farmhouse', phone: '9826098765', location: 'Bypass Road, Indore', quotedPrice: '380000', packageDetails: 'Open lawn, 400 pax, parking, basic décor, no AC', status: 'exploring', rating: 3, remarks: 'Budget option. Good for outdoor Dec weather. Checking reviews.' },
    ],
    event_mgr: [
      { id: uid(), name: 'Dream Celebrations Indore', phone: '9826011122', location: 'Palasia, Indore', quotedPrice: '250000', packageDetails: 'Full coordination, guest management, vendor liaison, décor supervision, day-of team of 8', status: 'negotiating', rating: 4, remarks: 'Very organized. Done 3 weddings in our circle. Recommended by Gupta uncle.' },
    ],
    caterer: [
      { id: uid(), name: 'Shree Annapurna Caterers', phone: '9826044455', location: 'MG Road, Indore', quotedPrice: '850000', packageDetails: '500 pax, full veg menu, 14 live counters, mithai counter, welcome sharbat, dessert station, paan counter', status: 'booked', rating: 5, remarks: 'Excellent food quality. Tried at Sharma wedding. Non-negotiable family choice. Advance paid.' },
      { id: uid(), name: 'Gupta Caterers Pvt Ltd', phone: '9301234567', location: 'Rajwada, Indore', quotedPrice: '720000', packageDetails: '500 pax, veg menu, 10 counters, standard mithai', status: 'rejected', rating: 3, remarks: 'Price okay but food quality not up to mark after trial tasting.' },
    ],
    decorator: [
      { id: uid(), name: 'Pushpa Flowers & Décor', phone: '9826055566', location: 'Khajrana, Indore', quotedPrice: '180000', packageDetails: 'Full floral décor, stage backdrop, entrance arch, mandap, aisle flowers, fresh marigold + roses + mogra', status: 'shortlisted', rating: 4, remarks: 'Beautiful work. Seen portfolio at Meena di shaadi. Very good quality for price.' },
    ],
    mehndi: [
      { id: uid(), name: 'Fatima Mehndi Arts', phone: '9826077788', location: 'Chhatripura, Indore', quotedPrice: '25000', packageDetails: 'Bridal full hands + feet, 4 bridesmaids hands, natural henna, 4 hr session, touch-up next morning', status: 'booked', rating: 5, remarks: 'Absolutely brilliant artist. One of the best in Indore. Booked 6 months in advance.' },
    ],
    pandit: [
      { id: uid(), name: 'Pandit Ramesh Sharma Ji', phone: '9826033344', location: 'Sudama Nagar, Indore', quotedPrice: '21000', packageDetails: 'Full wedding ceremony, 4-5 hrs, all samagri included, experienced with Maheshwari + Agarwal traditions', status: 'booked', rating: 5, remarks: 'Our family pandit for 20 years. Confirmed. Token amount given.' },
    ],
    makeup: [
      { id: uid(), name: 'Priya Beauty Studio', phone: '9826099900', location: 'Vijay Nagar, Indore', quotedPrice: '45000', packageDetails: 'Bridal HD airbrush makeup, hair styling, pre-bridal facial, touch-up kit, on-call 2 hrs after', status: 'negotiating', rating: 4, remarks: 'Excellent portfolio. Negotiating ₹5K off. Have done 50+ brides.' },
    ],
    music: [
      { id: uid(), name: 'DJ Sahil Entertainment', phone: '9826022233', location: 'Scheme 54, Indore', quotedPrice: '75000', packageDetails: 'DJ + 2000W sound, 6 hrs, LED dance floor lights, smoke machine, Bollywood + Punjabi mix, emcee included', status: 'shortlisted', rating: 4, remarks: 'High energy. Seen at 2 family weddings. Crowd loved it.' },
    ],
    jewelry: [
      { id: uid(), name: 'Nakshatra Jewellers', phone: '9826066677', location: 'MG Road, Indore', quotedPrice: '1200000', packageDetails: 'Full bridal set — necklace, earrings, maang tikka, nath, bangles, 22K BIS hallmarked gold', status: 'shortlisted', rating: 4, remarks: 'Well-established shop. Need to negotiate making charges. Papa will come for final selection.' },
    ],
    clothes: [
      { id: uid(), name: 'Sari Palace MG Road', phone: '9826088899', location: 'MG Road, Indore', quotedPrice: '85000', packageDetails: 'Bridal lehenga (custom), groom sherwani, 2 family sarees', status: 'exploring', rating: 0, remarks: 'Just visited. Liked 2-3 designs. Will decide after seeing Patel Drapes also.' },
    ],
    invitation: [
      { id: uid(), name: 'Prints & More', phone: '9826012999', location: 'Palasia, Indore', quotedPrice: '18000', packageDetails: '500 printed cards, premium box packing, WhatsApp digital invite design included', status: 'booked', rating: 4, remarks: 'Design finalised. Printing starts next month. Sample approved by Mummy.' },
    ],
  };
  return data;
}

// ─── CSV EXPORT ───────────────────────────────────────────
function exportCSV(data) {
  var cols = ['Category','Vendor Name','Phone','Location','Quoted Price (Rs)','Status','Rating','Package Details','Remarks'];

  function cell(val) {
    var s = String(val === null || val === undefined ? '' : val);
    if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  var rows = [cols.map(cell).join(',')];

  allCats(data).forEach(function(cat) {
    vendorsFor(data, cat.id).forEach(function(v) {
      var statusLabel = (STATUS[v.status] && STATUS[v.status].label) || v.status || '';
      statusLabel = statusLabel.split(' ').slice(1).join(' ');
      rows.push([
        cat.name, v.name||'', v.phone||'', v.location||'',
        v.quotedPrice ? String(v.quotedPrice) : '',
        statusLabel,
        v.rating ? (v.rating + ' stars') : '',
        v.packageDetails||'', v.remarks||''
      ].map(cell).join(','));
    });
  });

  var csv = '﻿' + rows.join('\r\n');
  var today = new Date();
  var d = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'nishant-shadi-vendors-' + d + '.csv'; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(function() { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
