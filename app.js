/* ─── THEME ─── */
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  renderSettings();
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '☀️';
  }
}

/* ─── STATE ─── */
const state = {
  loginType: 'bireysel',
  user: {
    id: null,
    name: '',
    username: '',
    email: '',
    gender: 'Erkek',
    team: '',
    coin: 0,     // GPoint — partner discount rewards
    gcoin: 0,    // GCoin  — cosmetics shop
    xp: 0,
    rank: 0,
    level: 'Bronz',
    streak: 0,
    tasksCompleted: 0,
    rewardsUsed: 0,
    taskHistory: [],
    phone: '',
    bio: '',
    instagram: '',
    twitter: '',
    emojiStatus: '',
    profileTheme: 'blue',
    profilePhoto: '',
    cosmetics: { frame: '', card_bg: '', title: '' }
  },
  beta: true,
  currentPage: 'home',
  currentTask: null,
  currentReward: null,
  hiddenDeletedPostIds: [],
  _cache: {}
};

function getHiddenDeletedPostIds() {
  try {
    const raw = localStorage.getItem('genco_deleted_post_ids');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch (_error) {
    return [];
  }
}

function saveHiddenDeletedPostIds(ids) {
  try {
    localStorage.setItem('genco_deleted_post_ids', JSON.stringify([...new Set(ids.filter(Boolean).map(String))]));
  } catch (_error) {
    // ignore storage issues
  }
}

const CACHE_TTL = 45000; // 45 saniye
function cacheValid(key) {
  const t = state._cache[key];
  return t && (Date.now() - t) < CACHE_TTL;
}
function cacheSet(key) { state._cache[key] = Date.now(); }
function cacheClear(key) { delete state._cache[key]; }

function normalizeCategoryLabel(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const map = {
    'Cafe & Tatli': 'Cafe & Tatlı',
    'Cafe & Tatlı': 'Cafe & Tatlı',
    'Cafe & Tatli ': 'Cafe & Tatlı',
    'Cafe & Tatlı ': 'Cafe & Tatlı',
    'Yasam': 'Yaşam',
    'Guzellik': 'Güzellik',
    'Guzel': 'Güzellik',
    'Güzelik': 'Güzellik',
    'Eglence': 'Eğlence & Oyun',
    'Eğlence': 'Eğlence & Oyun',
    'Oyun': 'Eğlence & Oyun',
    'Eğlence ve Oyun': 'Eğlence & Oyun',
    'Eglence & Oyun': 'Eğlence & Oyun',
    'Giyim & Moda': 'Giyim',
    'Pet Shop': 'Petshop',
    'Pet shop': 'Petshop',
    'Evcil Hayvan': 'Petshop',
    'Kozmetk': 'Kozmetik',
    'Kozmetik': 'Kozmetik',
    'Cevre': 'Çevre',
    'Çevre': 'Çevre',
    'Diger': 'Diğer',
    'Diğer': 'Diğer',
    'Sosyal medya': 'Sosyal Medya',
    'Sosyal Medya': 'Sosyal Medya',
    'Sosyalmedya': 'Sosyal Medya',
    'Yemek': 'Yemek',
    'Spor': 'Spor',
    'Egitim': 'Eğitim',
    'Eğitim': 'Eğitim',
    'Saglik': 'Sağlık',
    'Sağlık': 'Sağlık',
    'Yasam': 'Yaşam',
    'Yasam ': 'Yaşam',
  };

  return map[raw] || raw;
}

/* ─── BADGE LIST ─── */
const badgeList = [
  { id:'badge-first',    emoji:'🎯', name:'İlk Adım',        req:'İlk görevini tamamla',                     xpReward:50,   check: u => u.tasksCompleted >= 1,   progress: u => ({ cur: Math.min(u.tasksCompleted,1),   max:1     }) },
  { id:'badge-5tasks',   emoji:'💪', name:'Çalışkan',         req:'5 görev tamamla',                          xpReward:100,  check: u => u.tasksCompleted >= 5,   progress: u => ({ cur: Math.min(u.tasksCompleted,5),   max:5     }) },
  { id:'badge-10tasks',  emoji:'🏃', name:'Sporcu',           req:'10 görev tamamla',                         xpReward:200,  check: u => u.tasksCompleted >= 10,  progress: u => ({ cur: Math.min(u.tasksCompleted,10),  max:10    }) },
  { id:'badge-25tasks',  emoji:'🏅', name:'Koşucu',           req:'25 görev tamamla',                         xpReward:400,  check: u => u.tasksCompleted >= 25,  progress: u => ({ cur: Math.min(u.tasksCompleted,25),  max:25    }) },
  { id:'badge-50tasks',  emoji:'🏆', name:'Şampiyon',         req:'50 görev tamamla',                         xpReward:700,  check: u => u.tasksCompleted >= 50,  progress: u => ({ cur: Math.min(u.tasksCompleted,50),  max:50    }) },
  { id:'badge-100tasks', emoji:'👑', name:'Efsanevi Görevci', req:'100 görev tamamla',                        xpReward:1200, check: u => u.tasksCompleted >= 100, progress: u => ({ cur: Math.min(u.tasksCompleted,100), max:100   }) },
  { id:'badge-animal',   emoji:'🐾', name:'Hayvan Dostu',     req:'15 görev tamamla',                         xpReward:250,  check: u => u.tasksCompleted >= 15,  progress: u => ({ cur: Math.min(u.tasksCompleted,15),  max:15    }) },
  { id:'badge-eco',      emoji:'♻️', name:'Çevreci',          req:'20 görev tamamla',                         xpReward:300,  check: u => u.tasksCompleted >= 20,  progress: u => ({ cur: Math.min(u.tasksCompleted,20),  max:20    }) },
  { id:'badge-streak3',  emoji:'🔥', name:'Ateşli',           req:'3 günlük seri yap',                        xpReward:150,  check: u => u.streak >= 3,           progress: u => ({ cur: Math.min(u.streak,3),           max:3     }) },
  { id:'badge-streak7',  emoji:'⚡', name:'Elektrik',         req:'7 günlük seri yap',                        xpReward:400,  check: u => u.streak >= 7,           progress: u => ({ cur: Math.min(u.streak,7),           max:7     }) },
  { id:'badge-streak14', emoji:'🌪️', name:'Fırtına',          req:'14 günlük seri yap',                       xpReward:700,  check: u => u.streak >= 14,          progress: u => ({ cur: Math.min(u.streak,14),          max:14    }) },
  { id:'badge-streak30', emoji:'☄️', name:'Yıldız',           req:'30 günlük seri yap',                       xpReward:1500, check: u => u.streak >= 30,          progress: u => ({ cur: Math.min(u.streak,30),          max:30    }) },
  { id:'badge-social',   emoji:'📱', name:'Sosyal Kelebek',   req:'Sosyal medya hesabı ekle',                 xpReward:50,   check: u => !!(u.instagram||u.twitter), progress: u => ({ cur:(u.instagram||u.twitter)?1:0, max:1  }) },
  { id:'badge-team',     emoji:'⚽', name:'Taraftar',         req:'Favori takımını belirle',                  xpReward:50,   check: u => !!u.team,                progress: u => ({ cur:u.team?1:0,                      max:1     }) },
  { id:'badge-silver',   emoji:'🥈', name:'Gümüş Üye',       req:'Gümüş I kademeye ulaş (bir ayda 450 XP)',        xpReward:0,    check: u => levelRank(u.level) >= levelRank('Gümüş I'),   progress: u => ({ cur:Math.min(u.xp||0,450),  max:450  }) },
  { id:'badge-gold',     emoji:'🥇', name:'Altın Üye',        req:'Altın I kademeye ulaş (bir ayda 1.200 XP)',        xpReward:0,    check: u => levelRank(u.level) >= levelRank('Altın I'),   progress: u => ({ cur:Math.min(u.xp||0,1200),  max:1200  }) },
  { id:'badge-platin',   emoji:'🔷', name:'Platin Üye',       req:'Platin I kademeye ulaş (bir ayda 2.500 XP)',      xpReward:0,    check: u => levelRank(u.level) >= levelRank('Platin I'),  progress: u => ({ cur:Math.min(u.xp||0,2500), max:2500 }) },
  { id:'badge-diamond',  emoji:'💎', name:'Elmas Üye',        req:'Elmas I kademeye ulaş (bir ayda 4.000 XP)',       xpReward:0,    check: u => levelRank(u.level) >= levelRank('Elmas I'),   progress: u => ({ cur:Math.min(u.xp||0,4000), max:4000 }) },
  { id:'badge-legend',   emoji:'🌟', name:'Efsane',           req:'Legend I kademeye ulaş (bir ayda 5.800 XP)',      xpReward:0,    check: u => levelRank(u.level) >= levelRank('Legend I'),  progress: u => ({ cur:Math.min(u.xp||0,5800), max:5800 }) },
  { id:'badge-500coin',  emoji:'🪙', name:'Coin Koleksiyoncusu', req:'500 coin biriktir',                    xpReward:100,  check: u => (u.coin||0) >= 500,      progress: u => ({ cur:Math.min(u.coin||0,500),          max:500   }) },
  { id:'badge-2000coin', emoji:'💰', name:'Zengin',           req:'2000 coin biriktir',                       xpReward:300,  check: u => (u.coin||0) >= 2000,     progress: u => ({ cur:Math.min(u.coin||0,2000),         max:2000  }) },
  { id:'badge-bio',      emoji:'📝', name:'Kendini Anlat',    req:'Profil biyografisi ekle',                  xpReward:50,   check: u => !!(u.bio && u.bio.length > 5), progress: u => ({ cur:(u.bio&&u.bio.length>5)?1:0, max:1 }) },
];

/* ─── AUTH ─── */
const CORP_PIN = '6412';

/* ─── MİSAFİR MODU ───
   Uygulama girişsiz açılır; giriş ekranı yalnızca kullanıcı bir işlem
   yapmak istediğinde (profil, görev, ödül, paylaşım…) üstte açılır. */
function isGuest() {
  return !state.user?.id;
}

// Misafirin girebileceği sayfalar; diğerleri giriş ister
const GUEST_PAGES = new Set(['home', 'tasks', 'rewards', 'events', 'partners', 'leaderboard', 'league', 'kgoi', 'help', 'settings']);

// Misafirin tıklayabileceği gezinme öğeleri; geri kalan her tıklama giriş ister
const GUEST_CLICK_OK = [
  '.nav-btn', '.nav-sec-btn', '.nav-menu-toggle', '#nav-drawer-backdrop',
  '.back-btn', '.tasks-tab', '.discover-filter', '.th-filter', '.afc',
  '#theme-toggle', '#home-search-wrap', '.modal-close', '[data-guest-ok]',
  '#page-tasks .kz-nav [data-tab]', '#page-settings', '#page-help'
].join(',');

function openAuthScreen(mode = 'login') {
  const auth = document.getElementById('auth-screen');
  if (!auth) return;
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('suspended-panel')?.remove();
  if (mode === 'register') {
    showRegister();
    if (typeof gcSetSwitch === 'function') gcSetSwitch('register');
  } else {
    showLogin();
    if (typeof gcSetSwitch === 'function') gcSetSwitch('login');
  }
  toggleBottomNav(false);
  auth.classList.add('active');
  document.body.classList.add('auth-open');
}

function closeAuthScreen() {
  document.getElementById('auth-screen')?.classList.remove('active');
  document.getElementById('app-screen')?.classList.add('active');
  document.body.classList.remove('auth-open');
  document.getElementById('pin-gate')?.style.setProperty('display', 'none');
  clearLoginErrors();
}

// Misafir bir işlem yapmaya çalışırsa: true → giriş ekranı açıldı, işlemi durdur
function requireLogin() {
  if (!isGuest()) return false;
  openAuthScreen('login');
  return true;
}

document.addEventListener('click', (e) => {
  if (!isGuest()) return;
  const appScreen = document.getElementById('app-screen');
  if (!appScreen?.classList.contains('active') || !appScreen.contains(e.target)) return;
  if (document.getElementById('auth-screen')?.classList.contains('active')) return;
  const target = e.target.closest('button, a, input, select, textarea, label, [onclick], [role="button"]');
  if (!target || target.closest(GUEST_CLICK_OK)) return;
  e.preventDefault();
  e.stopPropagation();
  openAuthScreen('login');
}, true);

function selectType(btn, type) {
  if (type === 'kurumsal') {
    showPinGate();
    return;
  }
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.loginType = 'bireysel';
  setLoginMethod('username');
}


function showPinGate() {
  showAdminLogin();
}

function validatePin(digits) {
  const pin = Array.from(digits).map(d => d.value).join('');
  if (pin === CORP_PIN) {
    document.getElementById('pin-gate').style.display = 'none';
    state.loginType = 'kurumsal';
    const id = document.getElementById('login-identifier');
    if (id) id.placeholder = 'Kurumsal kullanıcı adı';
  } else {
    const inputs = document.getElementById('pin-inputs');
    inputs.classList.add('pin-shake');
    document.getElementById('pin-error').textContent = 'Yanlış PIN. Tekrar deneyin.';
    setTimeout(() => {
      inputs.classList.remove('pin-shake');
      digits.forEach(d => { d.value = ''; });
      digits[0].focus();
    }, 500);
  }
}

function cancelPinGate() {
  document.getElementById('pin-gate').style.display = 'none';
  state.loginType = 'bireysel';
  const id = document.getElementById('login-identifier');
  if (id) id.placeholder = 'kullaniciadi veya ornek@mail.com';
}

function showRegister() {
  document.getElementById('login-panel').classList.remove('active');
  document.getElementById('admin-login-panel').classList.remove('active');
  document.getElementById('forgot-panel')?.classList.remove('active');
  document.getElementById('register-panel').classList.add('active');
}
function showLogin() {
  document.getElementById('register-panel').classList.remove('active');
  document.getElementById('admin-login-panel').classList.remove('active');
  document.getElementById('forgot-panel')?.classList.remove('active');
  document.getElementById('login-panel').classList.add('active');
  state.loginType = 'bireysel';
}
function showAdminLogin() {
  document.getElementById('login-panel').classList.remove('active');
  document.getElementById('register-panel').classList.remove('active');
  document.getElementById('forgot-panel')?.classList.remove('active');
  document.getElementById('admin-login-panel').classList.add('active');
  state.loginType = 'kurumsal';
}
function showForgotPassword() {
  document.getElementById('login-panel').classList.remove('active');
  document.getElementById('register-panel').classList.remove('active');
  document.getElementById('admin-login-panel').classList.remove('active');
  document.getElementById('forgot-panel').classList.add('active');
}

async function handleForgotPassword() {
  const emailInput = document.getElementById('forgot-email');
  const email = emailInput.value.trim();
  const errEl = document.getElementById('forgot-err-email');
  const successEl = document.getElementById('forgot-success-msg');
  if (errEl) errEl.textContent = '';
  if (successEl) successEl.style.display = 'none';
  if (!validateEmail(email)) { if (errEl) errEl.textContent = 'Geçerli bir e-posta giriniz'; return; }

  const btn = document.getElementById('forgot-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }
  try {
    await sbSendPasswordReset(email);
    if (successEl) successEl.style.display = 'flex';
    emailInput.value = '';
  } catch (err) {
    if (errEl) errEl.textContent = err.message || 'Gönderilemedi, tekrar dene.';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sıfırlama Bağlantısı Gönder'; }
  }
}

async function handleResetPassword() {
  const pass  = document.getElementById('reset-pass').value;
  const pass2 = document.getElementById('reset-pass2').value;
  const errPass  = document.getElementById('reset-err-pass');
  const errPass2 = document.getElementById('reset-err-pass2');
  if (errPass) errPass.textContent = '';
  if (errPass2) errPass2.textContent = '';

  const pres = validatePassword(pass, '');
  if (pres !== true) { if (errPass) errPass.textContent = pres; return; }
  if (pass !== pass2) { if (errPass2) errPass2.textContent = 'Şifreler eşleşmiyor'; return; }

  const btn = document.getElementById('reset-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Güncelleniyor…'; }
  try {
    await sbUpdatePassword(pass);
    await sbLogout();
    document.getElementById('reset-password-panel').classList.remove('active');
    showLogin();
    if (typeof gcSetSwitch === 'function') gcSetSwitch('login');
    showToast('Şifren güncellendi! Şimdi giriş yapabilirsin.');
  } catch (err) {
    if (errPass) errPass.textContent = err.message || 'Şifre güncellenemedi, tekrar dene.';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Şifreyi Güncelle'; }
  }
}

// Şifre sıfırlama bağlantısıyla açıldığında Supabase oturumu otomatik kurar
// ve bu olayı tetikler — kullanıcıyı direkt yeni şifre ekranına yönlendiriyoruz.
sb.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    document.getElementById('app-screen')?.classList.remove('active');
    document.getElementById('auth-screen')?.classList.add('active');
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('reset-password-panel')?.classList.add('active');
    if (typeof gcSetSwitch === 'function') gcSetSwitch('hidden');
  }
});

function updateRegisterBtn() {
  const allChecked = ['reg-kvk','reg-terms','reg-privacy'].every(id => document.getElementById(id)?.checked);
  const btn = document.getElementById('reg-submit-btn');
  if (!btn) return;
  btn.disabled = !allChecked;
  btn.style.opacity = allChecked ? '1' : '0.5';
  btn.style.cursor  = allChecked ? '' : 'not-allowed';
}

function showKvkModal() { openModal('modal-kvk'); }
function acceptKvk() {
  const cb = document.getElementById('reg-kvk');
  if (cb) cb.checked = true;
  const errEl = document.getElementById('err-kvk');
  if (errEl) errEl.textContent = '';
  closeModal('modal-kvk');
}

function showTermsModal() { openModal('modal-terms'); }
function acceptTerms() {
  const cb = document.getElementById('reg-terms');
  if (cb) cb.checked = true;
  const errEl = document.getElementById('err-kvk');
  if (errEl) errEl.textContent = '';
  closeModal('modal-terms');
}

function showPrivacyModal() { openModal('modal-privacy'); }
function acceptPrivacy() {
  const cb = document.getElementById('reg-privacy');
  if (cb) cb.checked = true;
  const errEl = document.getElementById('err-kvk');
  if (errEl) errEl.textContent = '';
  closeModal('modal-privacy');
}

async function handleLogin(options = {}) {
  const identifierId = options.identifierId || 'login-identifier';
  const passId = options.passId || 'login-pass';
  const identifierErrorId = options.identifierErrorId || 'login-err-identifier';
  const passErrorId = options.passErrorId || 'login-err-pass';
  const resendHintId = options.resendHintId || 'login-resend-hint';
  const buttonSelector = options.buttonSelector || '#login-panel .au-btn';
  state.loginType = options.loginType || 'bireysel';

  let identifier = document.getElementById(identifierId).value.trim();
  let pass       = document.getElementById(passId).value;

  clearLoginErrors();
  const resendHint = document.getElementById(resendHintId);
  if (resendHint) resendHint.style.display = 'none';

  if (!identifier) { showLoginFieldError(identifierErrorId, 'Kullanıcı adı veya e-posta giriniz'); return; }
  if (!pass)        { showLoginFieldError(passErrorId, 'Şifre giriniz'); return; }

  // Supabase kütüphanesi yüklenemediyse sessizce çökmek yerine söyle
  if (typeof sb === 'undefined') {
    showLoginFieldError(passErrorId, 'Sunucuya bağlanılamadı. İnternetini kontrol edip uygulamayı yeniden aç.');
    return;
  }

  // Butonu hemen meşgul göster (kullanıcı adı araması da zaman alıyor)
  const btn = document.querySelector(buttonSelector);
  const btnHtml = btn ? btn.innerHTML : '';
  const resetBtn = () => { if (btn) { btn.disabled = false; btn.innerHTML = btnHtml; } };
  if (btn) { btn.disabled = true; btn.textContent = 'Giriş yapılıyor…'; }

  // Email mi username mi?
  let email = identifier;
  if (!identifier.includes('@')) {
    // Username → email: Supabase RPC ile (RLS'i atlar)
    let foundEmail = null, rpcErr = null;
    try {
      ({ data: foundEmail, error: rpcErr } = await sb.rpc('find_email_by_username', { p_username: identifier }));
    } catch (e) { rpcErr = e; }
    if (rpcErr || !foundEmail) {
      resetBtn();
      const offline = rpcErr && /fetch|network|failed/i.test(rpcErr.message || '');
      showLoginFieldError(identifierErrorId, offline ? 'Sunucuya bağlanılamadı, internetini kontrol et' : 'Kullanıcı bulunamadı');
      return;
    }
    email = foundEmail;
  }

  try {
    const { user } = await sbLogin(email, pass);
    const [profile, stats] = await Promise.all([sbGetProfile(user.id), sbGetStats(user.id)]);
    let welcomeRewardGranted = false;

    if (state.loginType === 'kurumsal' && profile.role !== 'admin') {
      await sbLogout();
      showLoginFieldError(identifierErrorId, 'Bu hesabın kurumsal giriş yetkisi yok');
      resetBtn();
      return;
    }

    if (profile.is_suspended) {
      await sbLogout();
      // Tam ekran uyarı göster
      showSuspendedScreen();
      resetBtn();
      return;
    }

    if (user.user_metadata?.genco_welcome_reward_pending === true) {
      const welcomeCoin = (stats.coin || 0) + 50;
      const welcomeXp = (stats.xp || 0) + 250;
      await sbUpdateStats(user.id, { coin: welcomeCoin, xp: welcomeXp });
      stats.coin = welcomeCoin;
      stats.xp = welcomeXp;
      welcomeRewardGranted = true;
      try {
        await sb.auth.updateUser({
          data: {
            ...(user.user_metadata || {}),
            genco_welcome_reward_pending: false,
            genco_welcome_reward_claimed_at: new Date().toISOString()
          }
        });
      } catch (metadataError) {
        console.warn('Hoş geldin ödülü işareti kaydedilemedi:', metadataError);
      }
      sbAddNotification(user.id, 'Hoş geldin hediyen hazır! 🎁', 'İlk giriş ödülün hesabına eklendi: +50 Coin ve +250 XP.', 'welcome_reward').catch(() => {});
    }

    state.user.id             = user.id;
    state.user.email          = user.email;
    state.user.name           = profile.full_name || profile.username || '';
    state.user.username       = profile.username  || '';
    state.user.gender         = profile.gender    || '';
    state.user.team           = profile.team      || '';
    state.user.phone          = profile.phone     || '';
    state.user.bio            = profile.bio       || '';
    state.user.instagram      = profile.instagram || '';
    state.user.twitter        = profile.twitter   || '';
    state.user.emojiStatus    = profile.emoji_status   || '';
    state.user.profileTheme   = profile.profile_theme  || 'blue';
    state.user.profilePhoto   = profile.profile_photo_url || '';
    state.user.friendCode     = profile.friend_code || '';
    state.user.role           = profile.role;
    state.user.coin           = stats.coin;
    state.user.gcoin          = stats.gcoin || 0;
    state.user.xp             = stats.xp;
    state.user.level          = seasonTier(stats.xp, state.user.cosmetics);
    state.user.cosmetics = await seasonPrepare(user.id, stats, profile);
    state.user.level = seasonTier(stats.xp, state.user.cosmetics);
    const lastSeenLevel = localStorage.getItem(levelStorageKey(user.id));
    queueLevelUp(lastSeenLevel, state.user.level);
    rememberLevel(user.id, state.user.level);
    state.user.streak         = stats.streak;
    state.user.tasksCompleted = stats.tasks_completed;
    state.user.rewardsUsed    = stats.rewards_used;
    state.user.claimedRewards = stats.claimed_rewards || [];
    state.user.cosmetics      = profile.equipped_cosmetics || { frame: '', card_bg: '', title: '' };

    // DB'deki level alanıyla karşılaştır (offline/farklı cihaz seviye atlamalarını yakalar)
    const curLevel = state.user.level;
    const dbLevel  = LEVEL_ORDER.includes(stats.level) ? stats.level : 'Bronz I';
    if (dbLevel !== curLevel) {
      if (levelRank(curLevel) > levelRank(dbLevel)) {
        state.pendingLevelUp = curLevel;
      }
      sbUpdateStats(user.id, { level: curLevel }).catch(() => {});
    }

    sessionStorage.setItem('genco_active', '1');
    sessionStorage.setItem('genco_login_type', state.loginType);

    if (profile.role === 'admin' && state.loginType === 'kurumsal') {
      showToast('Kurumsal giriş başarılı. Admin paneline yönlendiriliyorsunuz…');
      setTimeout(() => {
        launchApp();
        goPage('admin');
        const admName = document.getElementById('adm-hero-name');
        if (admName) admName.textContent = state.user.username || state.user.name || 'Admin';
      }, 700);
    } else {
      showToast('Giriş başarılı!');
      setTimeout(() => {
        launchApp();
        if (welcomeRewardGranted) setTimeout(() => showWelcomeReward(), 500);
      }, 700);
    }
  } catch (err) {
    if (err.message && /email not confirmed/i.test(err.message)) {
      showLoginFieldError(passErrorId, 'E-posta adresini henüz doğrulamadın.');
      state._lastAuthEmail = email;
      if (resendHint) resendHint.style.display = 'block';
    } else if (!err.message || /invalid login credentials/i.test(err.message)) {
      showLoginFieldError(passErrorId, 'E-posta veya şifre hatalı');
    } else if (/fetch|network|failed/i.test(err.message)) {
      showLoginFieldError(passErrorId, 'Sunucuya bağlanılamadı, internetini kontrol et');
    } else {
      console.error('Giriş hatası:', err);
      showLoginFieldError(passErrorId, 'Giriş yapılamadı: ' + err.message);
    }
  } finally {
    resetBtn();
  }
}

async function resendConfirmationEmail() {
  const email = state._lastAuthEmail;
  if (!email) return;
  const btn = document.getElementById('login-resend-btn');
  if (btn) { btn.textContent = 'Gönderiliyor…'; btn.style.pointerEvents = 'none'; }
  try {
    await sbResendConfirmationEmail(email);
    showToast('Doğrulama e-postası tekrar gönderildi.');
  } catch (err) {
    showToast(err.message || 'Gönderilemedi, tekrar dene.');
  } finally {
    if (btn) { btn.textContent = 'Doğrulama e-postasını yeniden gönder'; btn.style.pointerEvents = ''; }
  }
}

const ADMIN_ACCOUNT = {
  username: 'gencoadmin',
  email: 'gencoadmin@genco.app',
  password: 'admin070809'
};

async function ensureAdminAccount() {
  const identifier = document.getElementById('admin-login-identifier').value.trim().toLowerCase();
  const password = document.getElementById('admin-login-pass').value;
  if (identifier !== ADMIN_ACCOUNT.username || password !== ADMIN_ACCOUNT.password) return false;

  try {
    await sbLogin(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password);
  } catch (_loginError) {
    const { session } = await sbRegister(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, {
      username: ADMIN_ACCOUNT.username,
      full_name: 'Genco Admin',
      role: 'admin'
    });
    if (!session) {
      throw new Error('Yönetici hesabı oluşturuldu. Supabase e-posta doğrulaması tamamlandıktan sonra tekrar deneyin.');
    }
  }

  return true;
}

async function handleAdminLogin() {
  const identifier = document.getElementById('admin-login-identifier').value.trim();
  const password = document.getElementById('admin-login-pass').value;
  const identifierErrorId = 'admin-login-err-identifier';
  const passErrorId = 'admin-login-err-pass';
  clearLoginErrors();

  if (!identifier) { showLoginFieldError(identifierErrorId, 'Kullanıcı adı veya e-posta giriniz'); return; }
  if (!password) { showLoginFieldError(passErrorId, 'Şifre giriniz'); return; }

  const isProvisioningAccount = identifier.toLowerCase() === ADMIN_ACCOUNT.username;
  const btn = document.querySelector('#admin-login-panel .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Giriş yapılıyor…'; }

  try {
    if (isProvisioningAccount) {
      const provisioned = await ensureAdminAccount();
      if (!provisioned) {
        showLoginFieldError(identifierErrorId, 'Yönetici kullanıcı adı veya şifre hatalı');
        return;
      }
      document.getElementById('admin-login-identifier').value = ADMIN_ACCOUNT.email;
    }

    return await handleLogin({
    identifierId: 'admin-login-identifier',
    passId: 'admin-login-pass',
    identifierErrorId: 'admin-login-err-identifier',
    passErrorId: 'admin-login-err-pass',
    buttonSelector: '#admin-login-panel .au-btn',
    loginType: 'kurumsal'
    });
  } catch (err) {
    showLoginFieldError(passErrorId, err.message || 'E-posta veya şifre hatalı');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Yönetici olarak giriş yap'; }
  }
}

async function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const phoneRaw = document.getElementById('reg-phone').value.trim();
  const phone    = normalizePhone(phoneRaw);
  const pass     = document.getElementById('reg-pass').value;
  const pass2    = document.getElementById('reg-pass2').value;
  const dob      = document.getElementById('reg-dob').value;
  const gender   = document.getElementById('reg-gender').value;
  const school   = document.getElementById('reg-school')?.value || '';
  const faculty  = document.getElementById('reg-faculty')?.value || '';
  const cls      = document.getElementById('reg-class')?.value || '';

  clearAllErrors();

  let ok = true;
  if (!validateName(name))        { showFieldError('err-name','Lütfen geçerli bilgileri giriniz'); ok=false; }
  const ures = validateUsername(username);
  if (ures !== true)              { showFieldError('err-username', ures); ok=false; }
  if (!validateEmail(email))      { showFieldError('err-email','Geçerli bir e-posta giriniz'); ok=false; }
  const phoneRes = validatePhone(phoneRaw);
  if (phoneRes !== true)          { showFieldError('err-phone', phoneRes); ok=false; }
  const pres = validatePassword(pass, username);
  if (pres !== true)              { showFieldError('err-pass', pres); ok=false; }
  else if (pass !== pass2)        { showFieldError('err-pass2','Şifreler eşleşmiyor'); ok=false; }
  if (!validateDOB(dob))          { showFieldError('err-dob','En az 13 yaşında olmalısın'); ok=false; }
  if (!gender)                    { showFieldError('err-gender','Lütfen cinsiyet seçiniz'); ok=false; }
  const kvkOk     = document.getElementById('reg-kvk')?.checked;
  const termsOk   = document.getElementById('reg-terms')?.checked;
  const privacyOk = document.getElementById('reg-privacy')?.checked;
  if (!kvkOk || !termsOk || !privacyOk) {
    showFieldError('err-kvk', 'KVKK, Kullanım Şartları ve Gizlilik Politikası\'nı onaylamanız gerekiyor');
    ok = false;
  }

  if (!ok) {
    // Hata gizli bir adımdaki alana yazıldıysa kullanıcıyı o adıma götür; yoksa hiçbir şey olmamış gibi görünür
    const stepOf = { 'err-name': 1, 'err-username': 1, 'err-email': 1, 'err-phone': 1, 'err-pass': 1, 'err-pass2': 1, 'err-dob': 2, 'err-gender': 2, 'err-kvk': 4 };
    const first = Object.keys(stepOf).find(id => document.getElementById(id)?.textContent);
    if (first && typeof gcRegRender === 'function') gcRegRender(stepOf[first]);
    showToast('Kayıt başarısız: ' + (document.getElementById(first)?.textContent || 'bilgileri kontrol et'));
    return;
  }

  const btn = document.getElementById('reg-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor…'; btn.style.opacity = '0.7'; btn.style.cursor = 'not-allowed'; }

  try {
    await sbRegister(email, pass, {
      username,
      full_name: name,
      phone,
      gender,
      team: '',
      dob,
      school: school || '',
      faculty: faculty || '',
      class_year: cls || '',
      role: 'user',
      genco_welcome_reward_pending: true
    });
    showToast('Kayıt başarılı! E-postanı doğrula, ardından giriş yapabilirsin.');
    setTimeout(() => showLogin(), 1500);
  } catch (err) {
    // Bu hatalar 1. adımdaki alanlara yazılıyor ama kullanıcı genelde 4. adımda
    // (Onay) oluyor — sihirbazı o adıma geri götürmezsek hata sessizce kaybolur
    // ve "kayıt olmuyor" izlenimi verir.
    if (typeof gcRegRender === 'function') gcRegRender(1);
    if (err.message && err.message.includes('already registered')) {
      showFieldError('err-email', 'Bu e-posta zaten kayıtlı');
      showToast('Bu e-posta zaten kayıtlı, farklı bir e-posta dene');
    } else {
      showFieldError('err-name', err.message || 'Kayıt sırasında hata oluştu');
      showToast(err.message || 'Kayıt sırasında hata oluştu');
    }
  } finally {
    if (btn) { btn.textContent = 'Kayıt Ol'; updateRegisterBtn(); }
  }
}

/* ─── PARTNER ACCORDION ─── */
function togglePartner(btn) {
  const item = btn.closest('.partner-item');
  item.classList.toggle('open');
}

const REMOVED_PARTNERS = ['Prime Alanya Berber', 'Prime Alanya Berberi'];

async function loadPartners() {
  const el = document.getElementById('partners-accordion');
  if (!el) return;
  try {
    const partners = await sbGetPartners();
    const raw  = (partners && partners.length) ? partners : DEFAULT_PARTNERS;
    const list = raw.filter(p => !REMOVED_PARTNERS.includes(p.name));
    el.innerHTML = renderPartnerItems(list);
  } catch (e) {
    console.error('loadPartners hata:', e);
    el.innerHTML = renderPartnerItems(DEFAULT_PARTNERS);
  }
}

/* ─── EVENTS ─── */
const FEATURED_LOCAL_EVENTS = [
  {
    id: 'featured-uzi-2026-11-01',
    title: 'Üzi Konseri',
    description: '1 Kasım 2026 · Saat 20.00 · Alanya Açık Hava Tiyatrosu.',
    event_date: '2026-11-01',
    image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB6qSgKvrdKQbukrJtoETktUzGq1aQFldQ5Cw1BHkDpg&s=10',
    ticket_url: 'https://www.bubilet.com.tr/antalya/etkinlik/-uzi-konseri-'
  },
  {
    id: 'featured-derya-bedavaci-2026-10-11',
      title: 'Derya Bedavacı Konseri',
            description: '11 Ekim 2026 · Saat 21.00 · Alanya Açık Hava Tiyatrosu.',
    event_date: '2026-10-11',
    image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYvbHd05kspSjxLA6R35DRsMTXCBDU6v080XZTe6EzHg&s=10',
    ticket_url: 'https://www.biletix.com/etkinlik/51936/TURKIYE/tr'
  },
  {
    id: 'featured-kerimcan-durmaz-2026-09-23',
    title: 'Kerimcan Durmaz',
    description: '23 Eylül 2026 · Saat 21.00 · Alanya Açık Hava Tiyatrosu.',
    event_date: '2026-09-23',
    image_url: 'https://static.bianet.org/haber/2025/02/20/sosyal-medya-fenomeni-kerimcan-durmaz-tahliye-edildi.jpg',
    ticket_url: 'https://www.biletix.com/etkinlik/5RSE4/TURKIYE/tr/kerimcan-durmaz-terapi-night-23-09-2026-antalya'
  },
  {
    id: 'featured-gokhan-turkmen-2026-09-26',
    title: 'Gökhan Türkmen',
    description: '26 Eylül 2026 · Saat 21.00 · Alanya Açık Hava Tiyatrosu.',
    event_date: '2026-09-26',
    image_url: 'https://www.faorganizasyon.com.tr/wp-content/uploads/2022/01/fa-organizasyon_gokhan-turkmen-menajeri.jpg',
    ticket_url: 'https://www.biletix.com/etkinlik/5GBD0/TURKIYE/tr/gokhan-turkmen-26-09-2026-antalya'
  },
  {
    id: 'featured-wegh-2026-10-03',
    title: 'Wegh Konseri',
    description: '3 Ekim 2026 · Saat 20.30 · Alanya Açık Hava Tiyatrosu.',
    event_date: '2026-10-03',
    image_url: 'https://www.biletix.com/static/images/live/event/artistprofilephoto/wegh-artistbu.jpg',
    ticket_url: 'https://www.bubilet.com.tr/antalya/etkinlik/wegh-konseri-'
  }
];

async function loadEvents() {
  try {
    const remoteEvents = await sbGetEvents();
    const remoteTitles = new Set((remoteEvents || []).map(event => event.title));
    const featuredEvents = FEATURED_LOCAL_EVENTS.filter(event => !remoteTitles.has(event.title));
    const events = [...featuredEvents, ...(remoteEvents || [])]
      .sort((a, b) => new Date(a.event_date || a.created_at) - new Date(b.event_date || b.created_at));
    state.eventsData = events;

    const el = document.getElementById('home-events-list');
    if (!el) return;
    if (!events.length) {
      el.innerHTML = '<div class="events-empty">Henüz etkinlik veya duyuru yok.</div>';
      return;
    }
    el.innerHTML = events.slice(0, 8).map(ev => eventCardHTML(ev, 'carousel')).join('');
  } catch (e) {
    const el = document.getElementById('home-events-list');
    if (el) el.innerHTML = '<div class="events-empty">Etkinlikler yüklenemedi.</div>';
  }
}

function eventDateParts(ev) {
  const d = new Date(ev.event_date || ev.created_at);
  return { day: d.getDate(), month: d.toLocaleString('tr-TR', { month: 'short' }) };
}

function eventCardHTML(ev, variant) {
  const { day, month } = eventDateParts(ev);
  const media = ev.image_url
    ? `<img class="event-media-img" src="${escHtml(ev.image_url)}" alt="${escHtml(ev.title)} görseli" loading="lazy">`
    : `<div class="event-media-fallback">🎉</div>`;

  const ticketAttr = ev.ticket_url ? ` data-ticket="${escHtml(ev.ticket_url)}"` : '';

  if (variant === 'carousel') {
    return `<div class="event-card"${ticketAttr}>
      <div class="event-media">
        ${media}
        <div class="event-date-chip"><span class="event-day">${day}</span><span class="event-month">${month}</span></div>
      </div>
      <div class="event-body">
        <div class="event-title">${escHtml(ev.title)}</div>
        ${ev.description ? `<div class="event-description">${escHtml(ev.description)}</div>` : ''}
        <div class="event-body-foot">
          ${ev.tag ? `<span class="event-tag">${escHtml(ev.tag)}</span>` : '<span></span>'}
          ${ev.ticket_url ? `<a class="event-ticket-link" href="${escHtml(ev.ticket_url)}" target="_blank" rel="noopener noreferrer">Bilet al ↗</a>` : ''}
        </div>
      </div>
    </div>`;
  }

  // full list row (Tümünü Gör sayfası)
  return `<div class="event-row"${ticketAttr}>
    <div class="event-row-media">
      ${media}
      <div class="event-date-chip"><span class="event-day">${day}</span><span class="event-month">${month}</span></div>
    </div>
    <div class="event-row-body">
      <div class="event-title">${escHtml(ev.title)}</div>
      ${ev.description ? `<div class="event-description event-row-desc">${escHtml(ev.description)}</div>` : ''}
      <div class="event-body-foot">
        ${ev.tag ? `<span class="event-tag">${escHtml(ev.tag)}</span>` : '<span></span>'}
        ${ev.ticket_url ? `<a class="event-ticket-link" href="${escHtml(ev.ticket_url)}" target="_blank" rel="noopener noreferrer">Bilet al ↗</a>` : ''}
      </div>
    </div>
  </div>`;
}

// Kart üzerindeki herhangi bir yere tıklayınca bilet linkine gitsin
// (linkin kendisine tıklanırsa çift açılmayı önlemek için orayı atla).
document.addEventListener('click', event => {
  if (event.target.closest('a')) return;
  const card = event.target.closest('.event-card[data-ticket], .event-row[data-ticket]');
  if (!card) return;
  window.open(card.dataset.ticket, '_blank', 'noopener');
});

/* ─── ANLAŞMALI İŞLETMELER — sadece Ödüller'de yeri olan işletmeler ─── */
// Bazı işletmeler için veritabanındaki ödül görselinden bağımsız, hep bu görseli göster.
const PARTNER_LOGO_FORCE = {
  'gloria jeans': 'https://www.studio3mimarlik.com/wp-content/uploads/2024/07/1buyukcekmece-scaled.jpg',
  'luuq cafe':    'luuqq.jpeg',
  'noi':          'https://cdn.restoranim.net/beyza-gulsum-yorum-1-7033a5ca.jpg',
  'q stand':      'qstand.jpeg',
};
// Kırpılınca bozulan (fotoğraf+logo birleşimi gibi) görseller — kartta tam sığdır, kırpma.
const PARTNER_LOGO_CONTAIN = new Set(['luuq cafe']);

function normalizePartnerKey(name) {
  if (!name) return '';
  return name.toLowerCase().trim()
    .replace(/i̇/g, 'i').replace(/ı/g, 'i').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o');
}
function forcedPartnerLogo(name) {
  return PARTNER_LOGO_FORCE[normalizePartnerKey(name)] || '';
}

// Uygulamaya gömülü işletmeler: ödül kaydı olmasa da listede görünür.
// Adı `match` içeren bir veritabanı kaydı varsa onunla birleşir (kategori/video buradan gelir).
const LOCAL_PARTNERS = [
  { name: 'Valencia Hair Design', match: 'valencia', emoji: '💇‍♀️', category: 'Kadın Kuaför',
    video: 'valencia.mp4', videoWebm: 'valencia.webm', poster: 'valencia-poster.jpg', brand: 'valencia.png', featured: true,
    website: 'https://valencia-hair-center.vercel.app/' },
];

function partnerCategory(p) {
  return normalizeCategoryLabel(p.category || p.rewards?.[0]?.category);
}

// Ekranda görünen işletme videolarını oynatır, görünmeyenleri durdurur (pil & veri dostu)
let _partnerVideoObserver = null;
function playPartnerVideos(root) {
  const videos = root?.querySelectorAll('video.gpt-video') || [];
  if (!videos.length) return;
  if (!_partnerVideoObserver && 'IntersectionObserver' in window) {
    _partnerVideoObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }), { threshold: 0.25 });
  }
  videos.forEach(v => {
    v.muted = true; // mobilde otomatik oynatma için şart
    if (_partnerVideoObserver) _partnerVideoObserver.observe(v);
    else v.play().catch(() => {});
  });
}

// MP4 (H.264) telefonlarda; H.264 desteklemeyen tarayıcılar WebM'e düşer, hiçbiri oynamazsa kapak karesi görünür
function partnerVideoHTML(p) {
  return `<video class="gpt-img gpt-video"${p.poster ? ` poster="${escHtml(p.poster)}"` : ''} autoplay muted loop playsinline webkit-playsinline preload="auto" disablepictureinpicture aria-hidden="true">
      <source src="${escHtml(p.video)}" type="video/mp4">
      ${p.videoWebm ? `<source src="${escHtml(p.videoWebm)}" type="video/webm">` : ''}
    </video>`;
}

async function loadPartnersData() {
  const rewards = state.rewards || await sbGetRewards();
  if (!state.rewards) state.rewards = rewards;

  const filtered = (rewards || []).filter(r => !REMOVED_PARTNERS.includes(r.partner_name));
  const map = new Map();
  filtered.forEach(r => {
    const key = r.partner_name || r.name;
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, { name: key, emoji: r.emoji || '🏪', logo_url: forcedPartnerLogo(key) || r.image_url || '', rewards: [] });
    }
    map.get(key).rewards.push(r);
  });

  let list = [...map.values()];
  LOCAL_PARTNERS.forEach(({ match, ...lp }) => {
    const existing = list.find(p => normalizePartnerKey(p.name).includes(match));
    if (existing) Object.assign(existing, { category: lp.category, video: lp.video, videoWebm: lp.videoWebm, poster: lp.poster, brand: lp.brand, featured: lp.featured, website: lp.website });
    else list.push({ ...lp, logo_url: '', rewards: [] });
  });
  // Öne çıkan (videolu) işletmeler en üstte, büyük kartta
  list = [...list.filter(p => p.featured), ...list.filter(p => !p.featured)];
  state.partnersData = list;
  return list;
}

function partnerCardHTML(p, index) {
  const img = p.logo_url || getPartnerLogo({ name: p.name });
  const tag = partnerCategory(p);
  const r = (state.partnerRatings || {})[p.name];
  const media = p.video
    ? partnerVideoHTML(p)
    : img ? `<img class="gpt-img" src="${escHtml(img)}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.remove()">` : '';
  return `<div class="partner-tile gpt-card${index === 0 ? ' gpt-featured' : ''}${p.video ? ' gpt-has-video' : ''}" data-cat="${escHtml(tag || '')}" onclick="openPartnerDetail(${index})">
    <span class="gpt-fallback" aria-hidden="true">${p.emoji || '🏪'}</span>
    ${media}
    <span class="gpt-shade"></span>
    <span class="gpt-top">
      ${tag ? `<span class="gpt-cat">${escHtml(tag)}</span>` : '<span></span>'}
      ${r && r.count ? `<span class="gpt-rate">${STAR_SVG}${r.avg.toFixed(1)}</span>` : p.video ? '<span class="gpt-live"><i></i>Video</span>' : ''}
    </span>
    <span class="gpt-bottom">
      ${p.brand ? `<span class="gpt-brand"><img src="${escHtml(p.brand)}" alt=""></span>` : ''}
      <span class="gpt-bottom-copy">
        <b>${escHtml(p.name)}</b>
        <small>${r && r.count ? `${r.count} değerlendirme` : 'İlk yorumu sen yap'}</small>
      </span>
    </span>
  </div>`;
}

function renderPartnersFilterRow(list) {
  const row = document.getElementById('partners-filter-row');
  if (!row) return;
  const cats = [...new Set(list.map(partnerCategory).filter(Boolean))];
  if (!cats.length) { row.innerHTML = ''; return; }
  row.innerHTML = [`<button class="partners-filter-chip active" data-cat="" onclick="filterPartnersGrid(this,'')">Tümü</button>`]
    .concat(cats.map(c => `<button class="partners-filter-chip" data-cat="${escHtml(c)}" onclick="filterPartnersGrid(this,'${escHtml(c)}')">${escHtml(c)}</button>`))
    .join('');
}

function filterPartnersGrid(btn, cat) {
  document.querySelectorAll('.partners-filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#partners-page-grid .partner-tile').forEach(tile => {
    tile.style.display = (!cat || tile.dataset.cat === cat) ? '' : 'none';
  });
}

async function renderPartnersPage() {
  const el = document.getElementById('partners-page-grid');
  if (!el) return;
  el.innerHTML = '<div class="events-empty">Yükleniyor…</div>';
  try {
    const list = state.partnersData || await loadPartnersData();
    const statEl = document.getElementById('partners-hero-stat');

    if (!list.length) {
      el.innerHTML = '<div class="events-empty">Henüz anlaşmalı işletme yok.</div>';
      if (statEl) statEl.textContent = 'Henüz anlaşmalı işletme yok.';
      return;
    }

    if (statEl) statEl.textContent = `${list.length} işletme · deneyimini puanla, yorum bırak`;
    renderPartnersFilterRow(list);
    el.innerHTML = list.map((p, i) => partnerCardHTML(p, i)).join('');
    playPartnerVideos(el);

    // Puanlar gelince kartları yeniden çiz (aktif filtre korunur)
    await loadPartnerRatings();
    const active = document.querySelector('.partners-filter-chip.active')?.dataset.cat || '';
    el.innerHTML = list.map((p, i) => partnerCardHTML(p, i)).join('');
    if (active) el.querySelectorAll('.partner-tile').forEach(t => { t.style.display = t.dataset.cat === active ? '' : 'none'; });
    playPartnerVideos(el);
  } catch (e) {
    el.innerHTML = '<div class="events-empty">Yüklenemedi.</div>';
  }
}

/* ── Yorum & puan deposu: Supabase, tablo yoksa bu cihaz (localStorage) ── */
const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z"/></svg>';
const _LOCAL_REVIEWS_KEY = 'genco_partner_reviews_local';

function _reviewsTableMissing(e) {
  const msg = String(e?.message || '') + ' ' + String(e?.code || '');
  return /42P01|PGRST205|PGRST200|partner_reviews|schema cache/i.test(msg);
}
function _localReviews() {
  try { return JSON.parse(localStorage.getItem(_LOCAL_REVIEWS_KEY) || '[]'); } catch { return []; }
}
function _saveLocalReviews(list) {
  try { localStorage.setItem(_LOCAL_REVIEWS_KEY, JSON.stringify(list)); } catch {}
}

async function reviewsFetch(partnerName) {
  if (!state._reviewsLocal) {
    try { return await sbGetPartnerReviews(partnerName); }
    catch (e) { if (!_reviewsTableMissing(e)) throw e; state._reviewsLocal = true; console.warn('partner_reviews tablosu yok, yorumlar bu cihazda tutulacak.'); }
  }
  return _localReviews().filter(r => r.partner_name === partnerName)
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
}

async function reviewsSave(review) {
  if (!state._reviewsLocal) {
    try { await sbUpsertPartnerReview(review); return; }
    catch (e) { if (!_reviewsTableMissing(e)) throw e; state._reviewsLocal = true; }
  }
  const list = _localReviews().filter(r => !(r.partner_name === review.partner_name && r.user_id === review.user_id));
  const now = new Date().toISOString();
  list.push({ ...review, id: 'local-' + Date.now(), created_at: now, updated_at: now,
    profiles: { username: state.user.username, full_name: state.user.name, profile_photo_url: state.user.profilePhoto || '' } });
  _saveLocalReviews(list);
}

async function reviewsDelete(partnerName) {
  if (!state._reviewsLocal) {
    try { await sbDeletePartnerReview(partnerName, state.user.id); return; }
    catch (e) { if (!_reviewsTableMissing(e)) throw e; state._reviewsLocal = true; }
  }
  _saveLocalReviews(_localReviews().filter(r => !(r.partner_name === partnerName && r.user_id === state.user.id)));
}

async function loadPartnerRatings() {
  let rows = [];
  if (!state._reviewsLocal) {
    try { rows = await sbGetPartnerRatings(); }
    catch (e) { if (_reviewsTableMissing(e)) state._reviewsLocal = true; }
  }
  if (state._reviewsLocal) rows = _localReviews();
  const map = {};
  rows.forEach(r => {
    const m = map[r.partner_name] || (map[r.partner_name] = { sum: 0, count: 0 });
    m.sum += Number(r.rating) || 0; m.count += 1;
  });
  Object.values(map).forEach(m => { m.avg = m.count ? m.sum / m.count : 0; });
  state.partnerRatings = map;
}

/* ── İşletme detayı: görsel, puan özeti, puan ver & yorum yaz, yorumlar ── */
function _stars(value, size = '') {
  return `<span class="gpd-stars ${size}">${[1, 2, 3, 4, 5].map(i =>
    `<i class="${value >= i - 0.25 ? 'on' : value >= i - 0.75 ? 'half' : ''}">${STAR_SVG}</i>`).join('')}</span>`;
}

function openPartnerDetail(index) {
  const p = (state.partnersData || [])[index];
  if (!p) return;
  state.currentPartner = p;
  state.partnerDraftRating = 0;

  const img = p.logo_url || getPartnerLogo({ name: p.name });
  const tag = partnerCategory(p);
  const hero = document.getElementById('pm-detail-media');
  if (hero) {
    hero.innerHTML = `
      <span class="gpt-fallback" aria-hidden="true">${p.emoji || '🏪'}</span>
      ${p.video ? partnerVideoHTML(p) : img ? `<img src="${escHtml(img)}" alt="${escHtml(p.name)}" onerror="this.remove()">` : ''}
      <span class="gpd-hero-shade"></span>
      <div class="gpd-hero-copy">
        ${tag ? `<span class="gpt-cat">${escHtml(tag)}</span>` : ''}
        <h2>${escHtml(p.name)}</h2>
      </div>`;
    playPartnerVideos(hero);
  }
  const siteBtn = document.getElementById('gpd-site-btn');
  if (siteBtn) {
    siteBtn.hidden = !p.website;
    if (p.website) {
      siteBtn.href = p.website;
      document.getElementById('gpd-site-host').textContent = p.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  }
  const rewardsBtn = document.getElementById('gpd-rewards-btn');
  if (rewardsBtn) {
    rewardsBtn.hidden = !p.rewards.length; // ödülü olmayan işletmede gösterme
    rewardsBtn.querySelector('small').textContent = `${p.rewards.length} ödül Kazanımlar'da`;
  }

  document.getElementById('gpd-comment').value = '';
  _setDraftRating(0);
  document.getElementById('gpd-submit').textContent = 'Gönder';
  document.getElementById('gpd-delete').hidden = true;
  document.getElementById('gpd-summary').innerHTML = '<div class="gpd-loading">Değerlendirmeler yükleniyor…</div>';
  document.getElementById('gpd-reviews').innerHTML = '';
  document.getElementById('gpd-local-note').hidden = true;

  openModal('modal-partner');
  loadPartnerReviews(p.name);
}

async function loadPartnerReviews(name) {
  const summary = document.getElementById('gpd-summary');
  const listEl = document.getElementById('gpd-reviews');
  try {
    const reviews = await reviewsFetch(name);
    if (state.currentPartner?.name !== name) return;
    document.getElementById('gpd-local-note').hidden = !state._reviewsLocal;

    // Özet
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + Number(r.rating), 0) / count : 0;
    const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: reviews.filter(r => Number(r.rating) === n).length }));
    summary.innerHTML = count
      ? `<div class="gpd-avg"><b>${avg.toFixed(1)}</b>${_stars(avg)}<small>${count} değerlendirme</small></div>
         <div class="gpd-dist">${dist.map(d => `<div><span>${d.n}</span><i><em style="width:${Math.round(d.c / count * 100)}%"></em></i></div>`).join('')}</div>`
      : `<div class="gpd-none">${_stars(0)}<b>Henüz değerlendirme yok</b><small>İlk puanı sen ver, diğer gençlere yol göster.</small></div>`;

    // Kendi yorumun varsa formu doldur
    const mine = reviews.find(r => r.user_id === state.user.id);
    if (mine) {
      _setDraftRating(Number(mine.rating));
      document.getElementById('gpd-comment').value = mine.comment || '';
      document.getElementById('gpd-submit').textContent = 'Güncelle';
      document.getElementById('gpd-delete').hidden = false;
    }

    // Liste
    listEl.innerHTML = reviews.length ? reviews.map(r => {
      const who = r.profiles?.full_name || r.profiles?.username || 'Genco üyesi';
      const photo = r.profiles?.profile_photo_url;
      const date = new Date(r.updated_at || r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `<div class="gpd-review${r.user_id === state.user.id ? ' is-mine' : ''}">
        <span class="gpd-av"${photo ? ` style="background-image:url('${escHtml(photo)}')"` : ''}>${photo ? '' : escHtml(who[0].toUpperCase())}</span>
        <div class="gpd-review-body">
          <div class="gpd-review-top"><b>${escHtml(who)}${r.user_id === state.user.id ? ' <em>Sen</em>' : ''}</b><small>${date}</small></div>
          ${_stars(Number(r.rating), 'sm')}
          ${r.comment ? `<p>${escHtml(r.comment)}</p>` : ''}
        </div>
      </div>`;
    }).join('') : '';
  } catch (e) {
    console.error('Yorumlar yüklenemedi:', e);
    summary.innerHTML = '<div class="gpd-loading">Değerlendirmeler yüklenemedi.</div>';
  }
}

function _setDraftRating(n) {
  state.partnerDraftRating = n;
  const labels = ['Puanını seç', 'Kötü', 'Fena değil', 'İyi', 'Çok iyi', 'Mükemmel'];
  document.querySelectorAll('#gpd-rate button').forEach((b, i) => b.classList.toggle('on', i < n));
  const lbl = document.getElementById('gpd-rate-label');
  if (lbl) lbl.textContent = labels[n] || labels[0];
}

function setPartnerRating(n) { _setDraftRating(n); }

async function submitPartnerReview() {
  const p = state.currentPartner;
  if (!p || !state.user?.id) return;
  const rating = state.partnerDraftRating;
  if (!rating) { showToast('Önce yıldızlarla puan ver'); return; }
  const comment = document.getElementById('gpd-comment').value.trim().slice(0, 300);
  const btn = document.getElementById('gpd-submit');
  btn.disabled = true;
  try {
    await reviewsSave({ partner_name: p.name, user_id: state.user.id, rating, comment: comment || null });
    showToast('Değerlendirmen kaydedildi');
    await loadPartnerReviews(p.name);
    await loadPartnerRatings();
    renderPartnersPage();
  } catch (e) {
    showToast('Hata: değerlendirme gönderilemedi');
    console.error(e);
  } finally {
    btn.disabled = false;
  }
}

async function deletePartnerReview() {
  const p = state.currentPartner;
  if (!p) return;
  try {
    await reviewsDelete(p.name);
    showToast('Değerlendirmen silindi');
    document.getElementById('gpd-comment').value = '';
    _setDraftRating(0);
    document.getElementById('gpd-submit').textContent = 'Gönder';
    document.getElementById('gpd-delete').hidden = true;
    await loadPartnerReviews(p.name);
    await loadPartnerRatings();
    renderPartnersPage();
  } catch (e) {
    showToast('Hata: değerlendirme silinemedi');
  }
}

function partnerGoRewards() {
  closeModal('modal-partner');
  goPage('tasks');
  document.querySelector('#page-tasks [data-tab="rewards-tab"]')?.click();
}

/* ─── GENCO LİG (ALANYA İÇİ HALISAHA TURNUVASI) ─── */

// Bir hesap yalnızca bir takım kaydedebilir — kayıt tamamlanınca bu anahtara
// yazılır ve form bir daha açılmaz, yerine takım özeti gösterilir.
function leagueRegisteredKey() {
  return 'genco_league_registered_' + (state.user?.id || 'anon');
}

function getLeagueRegisteredTeam() {
  try {
    const raw = localStorage.getItem(leagueRegisteredKey());
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// 7'li halısaha dizilişi (hücumdan kaleye): 1 forvet, 2 orta saha, 3 defans, 1 kaleci.
// Kayıt formundaki sıra: 1. oyuncu kaleci, 2–4 defans, 5–6 orta saha, 7 forvet.
const LG_FORMATION = [[7], [5, 6], [2, 3, 4], [1]];

function lgJersey(p, empty = false) {
  if (empty) return '<span class="lg-jersey is-empty"><span class="lg-shirt">?</span><small>Oyuncu</small></span>';
  const first = String(p.name || '').trim().split(/\s+/)[0] || 'Oyuncu';
  return `<span class="lg-jersey${p.captain ? ' is-cap' : ''}">
    <span class="lg-shirt">${escHtml(String(p.number))}${p.captain ? '<i>C</i>' : ''}</span>
    <small>${escHtml(first)}</small></span>`;
}

function lgPitchHTML(players) {
  const byIdx = Object.fromEntries((players || []).map(p => [Number(p.idx), p]));
  return `<div class="lg-pitch">
    <svg class="lg-pitch-lines" viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true"><rect x="3" y="3" width="94" height="124" rx="4"/><path d="M3 65h94"/><circle cx="50" cy="65" r="12"/><rect x="28" y="3" width="44" height="16"/><rect x="28" y="111" width="44" height="16"/></svg>
    ${LG_FORMATION.map(row => `<div class="lg-line">${row.map(i => lgJersey(byIdx[i], !byIdx[i])).join('')}</div>`).join('')}
  </div>`;
}

function lgTeamHTML(reg) {
  if (!reg) {
    return `<div class="lg-team-head">
        <span class="lg-team-crest is-empty">?</span>
        <div><span class="lg-team-kicker">TAKIMIN</span><b>Kadronu kur, sahaya çık</b><small>7 oyuncu + 3 yedek · forma numaraları 1–10</small></div>
      </div>
      ${lgPitchHTML([])}
      <button type="button" class="lg-team-btn" onclick="goPage('league-register')">Takımını oluştur <span aria-hidden="true">›</span></button>`;
  }
  const subs = (reg.players || []).filter(p => p.role === 'yedek');
  const initials = String(reg.team_name || 'T').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toLocaleUpperCase('tr');
  return `<div class="lg-team-head">
      <span class="lg-team-crest">${escHtml(initials)}</span>
      <div><span class="lg-team-kicker">TAKIMIN · <em>✓ Kayıt alındı</em></span><b>${escHtml(reg.team_name || 'Takımın')}</b><small>⭐ Kaptan: ${escHtml(reg.captain_name || '—')}</small></div>
    </div>
    ${lgPitchHTML(reg.players)}
    ${subs.length ? `<div class="lg-bench"><span>YEDEKLER</span><div>${subs.map(p => lgJersey(p)).join('')}</div></div>` : ''}
    <p class="lg-team-note">Fikstür yayınlanınca maç günün burada görünecek. Kadro değişikliği için Yardım'dan bize yaz.</p>`;
}

async function renderLeagueHub() {
  const registered = getLeagueRegisteredTeam();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const team = document.getElementById('lg-team');
  if (team) {
    team.classList.toggle('is-registered', !!registered);
    team.innerHTML = lgTeamHTML(registered);
  }
  document.getElementById('page-league')?.classList.toggle('is-registered', !!registered);
  const ctaBtn = document.getElementById('league-cta-btn');
  if (ctaBtn) ctaBtn.classList.toggle('is-registered', !!registered);
  set('lg-cta-txt', registered ? registered.team_name : 'Takımını kaydet');
  set('lg-cta-sub', registered ? 'Takımın kayıtlı · kadroyu gör' : 'Kayıtlar açık · 2.500₺ / takım');
  const ic = ctaBtn?.querySelector('.lg-cta-ic');
  if (ic) ic.textContent = registered ? '✓' : '⚽';

  // Not: league_teams yalnızca kendi takımını / admin tümünü okuyabildiği için takım sayısı burada gösterilmez
  set('league-hero-stat', registered
    ? `${registered.team_name} kadroda — fikstürü bekle!`
    : "Takımını topla, kadronu kur, kupayı Alanya'da kaldır.");
}

function renderLeagueRegisteredSummary(reg) {
  const nameEl = document.getElementById('lrs-team-name');
  const captainEl = document.getElementById('lrs-captain');
  const listEl = document.getElementById('lrs-player-list');
  if (nameEl) nameEl.textContent = reg.team_name || '—';
  if (captainEl) captainEl.textContent = reg.captain_name || '—';
  if (listEl) {
    listEl.innerHTML = (reg.players || []).map(p => `
      <div class="lrs-player-chip${p.captain ? ' is-captain' : ''}">
        <span class="lrs-chip-num">${escHtml(String(p.number))}</span>
        <span class="lrs-chip-name">${escHtml(p.name)}</span>
        ${p.captain ? '<span class="lrs-chip-star">⭐</span>' : ''}
      </div>`).join('');
  }
}

let leagueCaptainIdx = null;

function leagueNumberOptionsHTML() {
  let html = '<option value="">No</option>';
  for (let n = 1; n <= 10; n++) html += `<option value="${n}">${n}</option>`;
  return html;
}

function leaguePlayerRowHTML(idx, isSub) {
  const label = isSub ? `Yedek ${idx - 7}` : `Oyuncu ${idx}`;
  return `
    <div class="league-player-row${isSub ? ' is-sub' : ''}" data-idx="${idx}">
      <span class="league-player-idx">${idx}</span>
      <input type="text" class="league-player-name" placeholder="${label} adı soyadı" autocomplete="off" oninput="onLeaguePlayerInput()" />
      <select class="league-player-num" title="Forma numarası" onchange="onLeaguePlayerInput()">${leagueNumberOptionsHTML()}</select>
      <button type="button" class="league-captain-btn" data-cap-idx="${idx}" onclick="setLeagueCaptain(${idx})" title="Kaptan seç">⭐</button>
    </div>`;
}

function renderLeagueRegisterForm() {
  const formEl = document.getElementById('league-register-form');
  const doneEl = document.getElementById('league-registered-state');
  const registered = getLeagueRegisteredTeam();

  if (registered) {
    if (formEl) formEl.style.display = 'none';
    if (doneEl) doneEl.style.display = 'flex';
    renderLeagueRegisteredSummary(registered);
    return;
  }
  if (formEl) formEl.style.display = '';
  if (doneEl) doneEl.style.display = 'none';
  updateLeagueFeeDescription();
  onLeaguePayConfirmChange();

  const startersList = document.getElementById('league-starters-list');
  const subsList = document.getElementById('league-subs-list');
  if (!startersList || !subsList) return;
  if (startersList.children.length) return; // form zaten dolu — kullanıcının girdisini koru
  startersList.innerHTML = Array.from({ length: 7 }, (_, i) => leaguePlayerRowHTML(i + 1, false)).join('');
  subsList.innerHTML = Array.from({ length: 3 }, (_, i) => leaguePlayerRowHTML(i + 8, true)).join('');
  updateLeagueProgress();
  updateLeagueCaptainBanner();
}

// Bir takımda 10 oyuncu, 1-10 arası 10 forma numarası var — her numara yalnızca
// bir oyuncuya ait olabildiği için seçilen numaralar diğer satırlarda kilitlenir.
function updateLeagueNumberOptions() {
  const rows = document.querySelectorAll('#page-league-register .league-player-row');
  const takenByIdx = {};
  rows.forEach(row => {
    const val = row.querySelector('.league-player-num').value;
    if (val) takenByIdx[row.dataset.idx] = val;
  });
  rows.forEach(row => {
    const sel = row.querySelector('.league-player-num');
    const myIdx = row.dataset.idx;
    Array.from(sel.options).forEach(opt => {
      if (!opt.value) return;
      opt.disabled = Object.entries(takenByIdx).some(([idx, val]) => idx !== myIdx && val === opt.value);
    });
  });
}

function updateLeagueProgress() {
  const rows = document.querySelectorAll('#page-league-register .league-player-row');
  let filled = 0;
  rows.forEach(row => {
    const name = row.querySelector('.league-player-name').value.trim();
    const num = row.querySelector('.league-player-num').value;
    if (name && num) filled++;
  });
  const total = rows.length || 10;
  const countEl = document.getElementById('league-progress-count');
  const fillEl = document.getElementById('league-progress-fill');
  if (countEl) countEl.textContent = `${filled}/${total} oyuncu`;
  if (fillEl) fillEl.style.width = `${Math.round((filled / total) * 100)}%`;
}

function onLeaguePlayerInput() {
  updateLeagueNumberOptions();
  updateLeagueProgress();
  if (leagueCaptainIdx) updateLeagueCaptainBanner();
}

function setLeagueCaptain(idx) {
  leagueCaptainIdx = (leagueCaptainIdx === idx) ? null : idx;
  document.querySelectorAll('.league-captain-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.capIdx) === leagueCaptainIdx);
  });
  updateLeagueCaptainBanner();
}

function updateLeagueCaptainBanner() {
  const bannerEl = document.getElementById('league-captain-banner');
  const textEl = document.getElementById('league-captain-text');
  if (!bannerEl || !textEl) return;
  if (!leagueCaptainIdx) {
    textEl.textContent = "Henüz kaptan seçilmedi — bir oyuncunun yanındaki ⭐'a dokun.";
    bannerEl.classList.remove('is-set');
    return;
  }
  const row = document.querySelector(`#page-league-register .league-player-row[data-idx="${leagueCaptainIdx}"]`);
  const name = row?.querySelector('.league-player-name').value.trim();
  textEl.textContent = `Takım Kaptanı: ${name || `Oyuncu ${leagueCaptainIdx}`}`;
  bannerEl.classList.add('is-set');
}

// Banka açıklamasına yazılması zorunlu metin — takım adı girildikçe canlı güncellenir,
// bu sayede admin gelen havaleyi doğru takıma eşleştirebilir.
function updateLeagueFeeDescription() {
  const el = document.getElementById('league-fee-desc-text');
  if (!el) return;
  const teamName = document.getElementById('league-team-name')?.value.trim();
  el.textContent = `Genco Uygulaması Genco Lig Turnuvası ${teamName || '[Takım Adın]'} takımının katılım ücreti`;
}

function copyLeagueFeeDescription() {
  const text = document.getElementById('league-fee-desc-text')?.textContent || '';
  if (!text) return;
  copyTextToClipboard(text).then(ok => showToast(ok
    ? 'Açıklama metni kopyalandı 📋'
    : 'Kopyalanamadı, metni elle seçip kopyala'));
}

// Ödeme onayı işaretlenmeden kayıt butonu pasif kalır — kayıt formu
// katılım ücretinin gönderildiğini onaylatmadan tamamlanamaz.
function onLeaguePayConfirmChange() {
  const btn = document.getElementById('league-submit-btn');
  const checked = document.getElementById('league-pay-confirm-check')?.checked;
  if (!btn) return;
  btn.disabled = !checked;
  btn.textContent = checked ? 'Takımı Kaydet' : 'Önce ödeme onayını işaretle';
}

function resetLeagueRegisterForm() {
  const startersList = document.getElementById('league-starters-list');
  const subsList = document.getElementById('league-subs-list');
  if (startersList) startersList.innerHTML = '';
  if (subsList) subsList.innerHTML = '';
  const nameInput = document.getElementById('league-team-name');
  const phoneInput = document.getElementById('league-team-phone');
  const payCheck = document.getElementById('league-pay-confirm-check');
  if (nameInput) nameInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (payCheck) payCheck.checked = false;
  leagueCaptainIdx = null;
  updateLeagueProgress();
  updateLeagueCaptainBanner();
  updateLeagueFeeDescription();
  onLeaguePayConfirmChange();
}

async function submitLeagueRegistration() {
  if (getLeagueRegisteredTeam()) { showToast('Bu hesapla zaten bir takım kaydettin'); return; }
  if (!document.getElementById('league-pay-confirm-check')?.checked) {
    showToast('Katılım ücretini gönderdiğini onaylamadan takımı kaydedemezsin');
    return;
  }

  const teamName = document.getElementById('league-team-name')?.value.trim();
  const phone = document.getElementById('league-team-phone')?.value.trim();
  if (!teamName) { showToast('Lütfen takım adını gir'); return; }
  if (!phone) { showToast('Lütfen iletişim telefonu gir'); return; }

  const rows = document.querySelectorAll('#page-league-register .league-player-row');
  const players = [];
  for (const row of rows) {
    const idx = Number(row.dataset.idx);
    const name = row.querySelector('.league-player-name').value.trim();
    if (!name) { showToast(`${idx}. oyuncunun adı eksik`); return; }
    const number = row.querySelector('.league-player-num').value;
    if (!number) { showToast(`${name} için forma numarası seç (1-10)`); return; }
    players.push({
      idx, name, number: Number(number),
      role: row.classList.contains('is-sub') ? 'yedek' : 'oyuncu',
      captain: idx === leagueCaptainIdx
    });
  }
  if (!leagueCaptainIdx) { showToast('Lütfen bir kaptan seç ⭐'); return; }
  const numbersUsed = players.map(p => p.number);
  if (new Set(numbersUsed).size !== numbersUsed.length) { showToast('Forma numaraları birbirinden farklı olmalı'); return; }

  const payload = {
    team_name: teamName,
    phone,
    captain_name: players.find(p => p.captain)?.name || null,
    players,
    payment_description: `Genco Uygulaması Genco Lig Turnuvası ${teamName} takımının katılım ücreti`,
    created_by: state.user?.id || null
  };

  const btn = document.getElementById('league-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor…'; }
  try {
    if (typeof sbCreateLeagueTeam === 'function') await sbCreateLeagueTeam(payload);
  } catch (e) {
    console.warn('Lig kaydı Supabase\'e yazılamadı, yerelde saklandı:', e?.message || e);
    const pending = JSON.parse(localStorage.getItem('genco_league_pending_registrations') || '[]');
    pending.push({ ...payload, created_at: new Date().toISOString() });
    localStorage.setItem('genco_league_pending_registrations', JSON.stringify(pending));
  }

  localStorage.setItem(leagueRegisteredKey(), JSON.stringify(payload));
  showToast(`${teamName} kaydedildi! ⚽ Fikstür yayınlanınca haber vereceğiz.`);
  resetLeagueRegisterForm();
  renderLeagueRegisterForm();
  renderLeagueHub();
}

/* Gündem: Alanya'da sahne alacak sanatçılar (Bubilet · Alanya Açıkhava Tiyatrosu
   ve Alanya Holly Stone sayfalarından derlendi). Geçmiş tarihliler otomatik gizlenir.
   Yeni konser eklemek için listeye satır ekle; img = Bubilet dosya adı. */
const BUBILET_BASE = 'https://www.bubilet.com.tr';
const BUBILET_IMG = 'https://cdn.bubilet.com.tr/cdn-cgi/image/width=600,quality=80/files/Etkinlik/';
const ALANYA_CONCERTS = [
  { artist: 'Gökhan Türkmen',       date: '2026-09-26', time: '21:00', venue: 'Açıkhava Tiyatrosu', price: '1.540₺',     tag: 'Konser',  img: 'gokhan-turkmen-62139.png', url: '/antalya/etkinlik/gokhan-turkmen' },
  { artist: 'Wegh',                 date: '2026-10-03', time: '20:30', venue: 'Açıkhava Tiyatrosu', price: '1.000₺',     tag: 'Konser',  img: 'wegh-konseri--84429.jpg', url: '/antalya/etkinlik/wegh-konseri-' },
  { artist: 'Ufuk Beydemir',        date: '2026-10-06', time: '20:00', venue: 'Holly Stone',        price: '600₺',       tag: 'Konser',  img: 'ufuk-beydemir-konseri-20260606095524887-cf4e72503f4a.jpg', url: '/antalya/etkinlik/ufuk-beydemir-konseri-' },
  { artist: 'Şahane Pazar Sahnede', date: '2026-10-06', time: '20:30', venue: 'Açıkhava Tiyatrosu', price: '875₺',       tag: 'Gösteri', img: 'sahane-pazar-20260810082221787-6e1bc0ac1d52.png', url: '/antalya/etkinlik/sahane-pazar' },
  { artist: 'Yahya Babuz',          date: '2026-10-07', time: '22:00', venue: 'Holly Stone',        price: '420₺\'den',  tag: 'Konser',  img: 'yahya-babuz-konseri-20260624133743102-a844ea369e72.jpg', url: '/antalya/etkinlik/yahya-babuz-konseri-' },
  { artist: 'Derya Bedavacı',       date: '2026-10-11', time: '21:00', venue: 'Açıkhava Tiyatrosu', price: '1.750₺',     tag: 'Konser',  img: 'derya-bedavaci-konseri--45930.jpeg', url: '/antalya/etkinlik/derya-bedavaci-konseri-' },
  { artist: 'AYDEED',               date: '2026-10-22', time: '21:00', venue: 'Holly Stone',        price: '700₺\'den',  tag: 'Konser',  img: 'aydeed-48746.png', url: '/antalya/etkinlik/aydeed' },
  { artist: 'Ayna · 30. Yıl',       date: '2026-10-24', time: '20:30', venue: 'Açıkhava Tiyatrosu', price: '750₺',       tag: 'Konser',  img: 'ayna-30-yil-konseri-81958.jpeg', url: '/antalya/etkinlik/ayna-30-yil-konseri' },
  { artist: 'Ayta Sözeri',          date: '2026-10-26', time: '21:00', venue: 'Açıkhava Tiyatrosu', price: '1.500₺',     tag: 'Konser',  img: 'ayta-sozeri-konseri-20260610134833336-22ca11570dcd.jpg', url: '/antalya/etkinlik/ayta-sozeri-konseri---' },
  { artist: 'Güldür Güldür Show',   date: '2026-10-31', time: '21:00', venue: 'Açıkhava Tiyatrosu', price: '1.500₺',     tag: 'Gösteri', img: 'guldur-guldur--show-20260911111911903-34595dc3ad2b.jpg', url: '/antalya/etkinlik/guldur-guldur--show' },
  { artist: 'Uzi',                  date: '2026-11-01', time: '20:00', venue: 'Açıkhava Tiyatrosu', price: '770₺',       tag: 'Konser',  img: '-uzi-konseri--17393.webp', url: '/antalya/etkinlik/-uzi-konseri-' },
  { artist: 'Anıl Piyancı',         date: '2026-11-06', time: '21:00', venue: 'Holly Stone',        price: '650₺\'den',  tag: 'Konser',  img: 'anil-piyanci-konseri-20260805122712605-67dbce1d3de2.jpg', url: '/antalya/etkinlik/anil-piyanci-konseri--' },
  { artist: 'Keskin',               date: '2026-11-28', time: '23:00', venue: 'Holly Stone',        price: '700₺\'den',  tag: 'Konser',  img: 'keskin--konseri-20260609200415990-4eb513eca5fb.jpg', url: '/antalya/etkinlik/keskin--konseri-' },
  { artist: 'Venüs',                date: '2026-11-29', time: '22:00', venue: 'Holly Stone',        price: '330₺',       tag: 'Konser',  img: 'venus-konseri-20260913122922563-ed0d6df7187e.jpg', url: '/antalya/etkinlik/venus-konseri--' },
  { artist: 'Pera',                 date: '2026-12-04', time: '22:00', venue: 'Holly Stone',        price: '600₺\'den',  tag: 'Konser',  img: 'pera-konseri-20260626094150870-83464364bb30.png', url: '/antalya/etkinlik/-pera-konseri-' },
  { artist: 'Ogün Sanlısoy',        date: '2026-12-19', time: '23:00', venue: 'Holly Stone',        price: '600₺\'den',  tag: 'Konser',  img: 'ogun--sanlisoy--konseri--50621.png', url: '/antalya/etkinlik/ogun--sanlisoy--konseri-' },
];

function upcomingConcerts() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return currentConcerts()
    .filter(c => new Date(c.date + 'T23:59:00') >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function agendaHTML(concerts, announcements) {
  const d = c => new Date(c.date + 'T12:00:00');
  const ticket = '<svg viewBox="0 0 24 24"><path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>';
  const pin = '<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
  let html = '';

  if (concerts.length) {
    const n = concerts[0];
    const nd = d(n);
    html += `<a class="ga-next" href="${concertUrl(n)}" target="_blank" rel="noopener noreferrer">
      <span class="ga-next-media"><img src="${concertImg(n)}" alt="${escHtml(n.artist)}" loading="lazy" onerror="this.remove()"></span>
      <span class="ga-next-chip">SIRADAKİ</span>
      <span class="ga-next-body">
        <span class="ga-next-date">${nd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} · ${n.time}</span>
        <b class="ga-next-title">${escHtml(n.artist)}</b>
        <span class="ga-next-venue">${pin}Alanya ${escHtml(n.venue)}</span>
        <span class="ga-next-foot"><span class="ga-price">${escHtml(n.price)}</span><span class="ga-buy">${ticket}Bilet al</span></span>
      </span>
    </a>`;

    // Kalanları aya göre grupla
    const rest = concerts.slice(1);
    const months = [];
    rest.forEach(c => {
      const key = c.date.slice(0, 7);
      let g = months.find(m => m.key === key);
      if (!g) months.push(g = { key, label: d(c).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }), items: [] });
      g.items.push(c);
    });
    if (months.length) {
      html += `<div class="gp-sec"><div><span>KONSER TAKVİMİ</span><h2>Alanya'da sahne alacaklar</h2></div><span class="gp-count">${concerts.length}</span></div>`;
      html += months.map(m => `
        <div class="ga-month"><span>${escHtml(m.label.toLocaleUpperCase('tr'))}</span><i></i></div>
        <div class="gp-card gp-list ga-list">
          ${m.items.map(c => {
            const cd = d(c);
            return `<a class="ga-row" href="${concertUrl(c)}" target="_blank" rel="noopener noreferrer">
              <span class="ga-date"><b>${cd.getDate()}</b><small>${cd.toLocaleDateString('tr-TR', { weekday: 'short' })}</small></span>
              <span class="ga-thumb"><img src="${concertImg(c)}" alt="" loading="lazy" onerror="this.remove()"></span>
              <span class="ga-info"><b>${escHtml(c.artist)}</b><small>${escHtml(c.venue)} · ${c.time}${c.tag !== 'Konser' ? ` · ${escHtml(c.tag)}` : ''}</small></span>
              <span class="ga-price">${escHtml(c.price)}</span>
            </a>`;
          }).join('')}
        </div>`).join('');
    }
  }

  if (announcements.length) {
    html += `<div class="gp-sec"><div><span>GENCO</span><h2>Duyurular</h2></div></div>
      <div class="ga-announce">${announcements.map(ev => eventCardHTML(ev, 'list')).join('')}</div>`;
  }

  html += `<p class="gn-news-note">Konser bilgileri ve fiyatlar <a href="${BUBILET_BASE}/mekan/alanya-acikhava-tiyatrosu" target="_blank" rel="noopener noreferrer">Bubilet</a>'ten derlenmiştir, değişebilir.</p>`;
  return html;
}

async function renderEventsPage() {
  const el = document.getElementById('events-page-list');
  if (!el) return;
  await loadAgendaData();
  const statEl = document.getElementById('events-hero-stat');
  const concerts = upcomingConcerts();
  el.innerHTML = agendaHTML(concerts, []);
  if (statEl) statEl.textContent = `${concerts.length} konser ve gösteri · ${currentNews().length} haber`;
  try {
    // Genco'nun kendi duyuruları (Supabase). Konser listesinde olanları tekrar gösterme.
    const remote = await sbGetEvents();
    const names = concerts.map(c => c.artist.toLocaleLowerCase('tr'));
    const announcements = (remote || []).filter(ev => {
      const t = (ev.title || '').toLocaleLowerCase('tr');
      return !names.some(n => t.includes(n));
    });
    if (announcements.length) el.innerHTML = agendaHTML(concerts, announcements);
  } catch (e) {
    console.warn('Duyurular yüklenemedi:', e);
  }
}

/* Haberler: Alanya Belediyesi'nin resmi haber sayfasından derlenen son haberler.
   Liste statik; yeni haber eklemek için bu diziye üstten satır ekle. */
const ALANYA_NEWS_BASE = 'https://www.alanya.bel.tr';
const ALANYA_NEWS = [
  { date: '2026-09-22', tag: 'Çevre',   title: "Alanya'nın iklim dirençliliği için ortak akıl buluşması", summary: 'Kentin iklim değişikliğine karşı dayanıklılığını artırmak için paydaşlar bir araya geldi.', img: '/Photos/News/Small/393612096310752512.JPG', url: '/Haber/126583/ALANYA-NIN-IKLIM-DIRENCLILIGI-ICIN-ORTAK-AKIL-BULUSMASI-' },
  { date: '2026-09-21', tag: 'Kültür',  title: '20. Uluslararası Alanya Caz Festivali sona erdi', summary: 'Festival, birbirinden etkileyici performanslarla kapanışını yaptı.', img: '/Photos/News/Small/906505792823646208.jpeg', url: '/Haber/126581/20--ULUSLARARASI-ALANYA-CAZ-FESTIVALI--MUHTESEM-PERFORMANSLARLA-SONA-ERDI' },
  { date: '2026-09-18', tag: 'Kültür',  title: "Cazın büyüsü Alanya'yı sardı", summary: '20. Uluslararası Alanya Caz Festivali renkli görüntülerle başladı.', img: '/Photos/News/Small/887645888804786304.jpeg', url: '/Haber/126579/CAZIN-BUYUSU-ALANYA-YI-SARDI---FESTIVAL-RENKLI-GORUTUNLERLE-BASLADI' },
  { date: '2026-09-17', tag: 'Şehir',   title: "Alanya Çevreyolu'nda engelsiz yaya dönemi", summary: 'Çevreyolu boyunca 310 noktadaki erişim engeli kaldırıldı.', img: '/Photos/News/Small/63381372980521792.JPG', url: '/Haber/126578/ALANYA-CEVREYOLU-NDA-ENGELSIZ-YAYA-DONEMI--310-NOKTADAKI-ERISIM-ENGELI-KALDIRILDI' },
  { date: '2026-09-17', tag: 'Şehir',   title: "İlk mahalle buluşması Gözüküçüklü'de yapıldı", summary: 'Başkan Özçelik, söz verdiği mahalle buluşmalarının ilkini Gözüküçüklü Mahallesi\'nde gerçekleştirdi.', img: '/Photos/News/Small/15334720070487616.JPG', url: '/Haber/126577/BASKAN-OZCELIK-SOZUNU-TUTTU-ILK-MAHALLE-BULUSMASI-GOZUKUCUKLU-DE-GERCEKLESTI' },
  { date: '2026-09-14', tag: 'Kültür',  title: "Yeşilçam Açık Hava Sineması'nda muhteşem son", summary: 'Yaz boyunca süren açık hava sinema gösterimleri sona erdi.', img: '/Photos/News/Small/319851104236991520.JPG', url: '/Haber/126573/ALANYA-YESILCAM-ACIK-HAVA-SINEMASI-NDA-MUHTESEM-SON' },
  { date: '2026-09-14', tag: 'Çevre',   title: 'Kadınlara özel fidan desteği', summary: 'Alanya Belediyesi kadın üreticilere fidan desteği sağladı.', img: '/Photos/News/Small/683330688600471168.jpg', url: '/Haber/126575/ALANYA-BELEDIYESI-NDEN-KADINLARA-OZEL-FIDAN-DESTEGI' },
  { date: '2026-09-14', tag: 'Şehir',   title: "Kış öncesi Hacet Deresi'nde çalışmalar sürüyor", summary: 'Kış sezonu öncesinde dere yatağında bakım ve temizlik çalışmaları devam ediyor.', img: '/Photos/News/Small/888788086019234.JPG', url: '/Haber/126574/KIS-SEZONU-ONCESI-HACET-DERESI-NDE-CALISMALAR-SURUYOR' },
  { date: '2026-09-12', tag: 'Eğitim',  title: 'Kırsaldaki öğrencilerin yüzünü güldüren destek', summary: 'Kırsal mahallelerde okuyan öğrencilere destek ulaştırıldı.', img: '/Photos/News/Small/909903936732366464.jpeg', url: '/Haber/126572/KIRSALDAKI-OGRENCILERIN-YUZUNU-GULDUREN-DESTEK' },
  { date: '2026-09-12', tag: 'Çevre',   title: "Dünya Temizlik Günü'nde anlamlı etkinlik", summary: 'Alanya Belediyesi, Dünya Temizlik Günü kapsamında bir temizlik etkinliği düzenledi.', img: '/Photos/News/Small/908986368304195648.jpeg', url: '/Haber/126571/ALANYA-BELEDIYESI-NDEN-DUNYA-TEMIZLIK-GUNU-NDE-ANLAMLI-ETKINLIK-' },
];

function renderNewsList() {
  const el = document.getElementById('news-page-list');
  if (!el) return;
  const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  el.innerHTML = currentNews().map((n, i) => `
    <a class="gn-news${i === 0 ? ' gn-news-featured' : ''}" href="${newsUrl(n)}" target="_blank" rel="noopener noreferrer">
      <span class="gn-news-media">
        <img src="${newsImg(n)}" alt="" loading="lazy" onerror="this.remove()">
      </span>
      <span class="gn-news-body">
        <span class="gn-news-meta"><b>${escHtml(n.tag)}</b> · ${fmt(n.date)}</span>
        <span class="gn-news-title">${escHtml(n.title)}</span>
        <span class="gn-news-sum">${escHtml(n.summary)}</span>
        <span class="gn-news-src">${escHtml(n.source || 'Alanya Belediyesi')} <svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></span>
      </span>
    </a>`).join('') +
    `<p class="gn-news-note">Kaynak: <a href="${ALANYA_NEWS_BASE}/Haberler" target="_blank" rel="noopener noreferrer">alanya.bel.tr</a></p>`;
}

// Gündem / Haberler sekme geçişi
function switchEventsTab(btn, tab) {
  if (tab === 'news') renderNewsList();
  document.querySelectorAll('#events-tabs .events-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#page-events .events-tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('events-tab-' + tab);
  if (panel) panel.classList.add('active');
}

let _postCropper = null;

function openCreatePostModal() {
  const input = document.getElementById('post-image-input');
  const caption = document.getElementById('post-caption-input');
  const thumbWrap = document.getElementById('cp-thumb-wrap');
  const avatar = document.getElementById('cp-avatar');
  state._postImageDataUrl = '';
  state._postImageOriginalDataUrl = '';
  if (input) input.value = '';
  if (thumbWrap) thumbWrap.style.display = 'none';
  if (caption) caption.value = '';
  if (avatar) {
    const name = state.user?.username || state.user?.name || 'U';
    if (state.user?.profilePhoto) {
      avatar.style.backgroundImage = `url(${state.user.profilePhoto})`;
      avatar.textContent = '';
    } else {
      avatar.style.backgroundImage = '';
      avatar.textContent = name[0].toUpperCase();
    }
  }
  showComposeStage();
  updatePostFormState();
  openModal('modal-create-post');
}

function showComposeStage() {
  document.getElementById('cp-compose-stage').style.display = 'flex';
  document.getElementById('cp-crop-stage').style.display = 'none';
  if (_postCropper) { _postCropper.destroy(); _postCropper = null; }
}

function handlePostImage(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    const raw = event.target.result;
    const image = new Image();
    image.onload = () => {
      // Kırpma öncesi çok büyük fotoğrafları makul bir boyuta indir (performans için)
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      state._postImageOriginalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      startPostCrop(state._postImageOriginalDataUrl);
    };
    image.onerror = () => showToast('Fotoğraf okunamadı');
    image.src = raw;
  };
  reader.readAsDataURL(file);
}

function reopenPostCrop() {
  if (!state._postImageOriginalDataUrl) return;
  startPostCrop(state._postImageOriginalDataUrl);
}

function startPostCrop(src) {
  if (typeof Cropper === 'undefined') {
    // Kırpma kütüphanesi yüklenemedi (ör. bağlantı sorunu) — fotoğrafı
    // kırpmadan doğrudan kullan, paylaşım akışı yine de kesintisiz sürsün.
    state._postImageDataUrl = src;
    const preview = document.getElementById('post-image-preview');
    const thumbWrap = document.getElementById('cp-thumb-wrap');
    if (preview) preview.src = src;
    if (thumbWrap) thumbWrap.style.display = 'block';
    updatePostFormState();
    showToast('Kırpma aracı yüklenemedi, fotoğraf kırpılmadan eklendi');
    return;
  }
  document.getElementById('cp-compose-stage').style.display = 'none';
  const stage = document.getElementById('cp-crop-stage');
  stage.style.display = 'flex';
  const img = document.getElementById('post-crop-image');
  if (_postCropper) { _postCropper.destroy(); _postCropper = null; }
  img.onload = () => {
    try {
      _postCropper = new Cropper(img, {
        aspectRatio: 4 / 3,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        background: false,
        responsive: true,
      });
    } catch (err) {
      console.error('Cropper başlatılamadı:', err);
      showToast('Kırpma başlatılamadı, fotoğraf kırpılmadan eklenecek');
      cancelPostCrop();
      state._postImageDataUrl = src;
      const preview = document.getElementById('post-image-preview');
      const thumbWrap = document.getElementById('cp-thumb-wrap');
      if (preview) preview.src = src;
      if (thumbWrap) thumbWrap.style.display = 'block';
      updatePostFormState();
    }
  };
  img.onerror = () => {
    showToast('Fotoğraf yüklenemedi');
    cancelPostCrop();
  };
  img.src = src;
}

function cancelPostCrop() {
  showComposeStage();
  // İlk seçimde iptal edilirse dosya inputunu da temizle
  if (!state._postImageDataUrl) {
    const input = document.getElementById('post-image-input');
    if (input) input.value = '';
  }
}

function applyPostCrop() {
  if (!_postCropper) return;
  let canvas;
  try {
    canvas = _postCropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 900 });
  } catch (err) {
    console.error('Kırpma uygulanamadı:', err);
    showToast('Kırpma uygulanamadı, tekrar dene');
    return;
  }
  if (!canvas) { showToast('Kırpma uygulanamadı, tekrar dene'); return; }
  state._postImageDataUrl = canvas.toDataURL('image/jpeg', 0.82);
  const preview = document.getElementById('post-image-preview');
  const thumbWrap = document.getElementById('cp-thumb-wrap');
  if (preview) preview.src = state._postImageDataUrl;
  if (thumbWrap) thumbWrap.style.display = 'block';
  showComposeStage();
  updatePostFormState();
}

function removePostImage() {
  state._postImageDataUrl = '';
  state._postImageOriginalDataUrl = '';
  const input = document.getElementById('post-image-input');
  const thumbWrap = document.getElementById('cp-thumb-wrap');
  if (input) input.value = '';
  if (thumbWrap) thumbWrap.style.display = 'none';
  updatePostFormState();
}

function updatePostFormState() {
  const caption = document.getElementById('post-caption-input');
  const count = document.getElementById('post-caption-count');
  const button = document.getElementById('create-post-submit');
  const text = caption?.value.trim() || '';
  if (count) count.textContent = `${caption?.value.length || 0}/280`;
  if (button) button.disabled = !state._postImageDataUrl && !text;
}

async function submitDiscoverPost() {
  const caption = censorText(document.getElementById('post-caption-input')?.value.trim() || '');
  const button = document.getElementById('create-post-submit');
  const imageUrl = state._postImageDataUrl || '';
  if (!state.user?.id || (!imageUrl && !caption)) return;
  if (button) { button.disabled = true; button.textContent = 'Yayınlanıyor…'; }
  try {
    // NOT: "posts.image_url" veritabanında NOT NULL olarak tanımlı, bu yüzden
    // fotoğrafsız paylaşımlarda null değil boş string gönderiyoruz.
    await sbCreatePost({ user_id: state.user.id, caption, image_url: imageUrl });
    closeModal('modal-create-post');
    showToast('Paylaşımın yayınlandı! 🎉');
    await loadDiscoverPosts();
  } catch (error) {
    console.error('Gönderi oluşturulamadı:', error);
    showToast('Paylaşım yayınlanamadı. Supabase posts kurulumu gerekli.');
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Paylaş'; updatePostFormState(); }
  }
}

function renderDiscoverPosts(posts, engagement = { likes: [], comments: [] }) {
  const feed = document.querySelector('.discover-feed');
  if (!feed) return;
  if (!posts.length) {
    feed.innerHTML = '<div class="discover-empty"><strong>İlk paylaşımı sen yap!</strong><span>Bugün ne yaptığını toplulukla paylaş.</span></div>';
    return;
  }
  const likesByPost = {};
  const commentsByPost = {};
  engagement.likes.forEach(like => {
    (likesByPost[like.post_id] ||= []).push(like);
  });
  engagement.comments.forEach(comment => {
    (commentsByPost[comment.post_id] ||= []).push(comment);
  });
  const currentUserId = state.user?.id;
  feed.innerHTML = posts.map(post => {
    const profile = post.profiles || {};
    const name = profile.username || profile.full_name || 'Genco üyesi';
    const initial = name[0].toUpperCase();
    const avatarStyle = profile.profile_photo_url
      ? `style="background-image:url('${escHtml(profile.profile_photo_url)}');background-size:cover;background-position:center;color:transparent"`
      : '';
    const time = new Date(post.created_at).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    const likes = likesByPost[post.id] || [];
    const comments = commentsByPost[post.id] || [];
    const liked = likes.some(like => like.user_id === currentUserId);
    const deleteAction = post.user_id === currentUserId
      ? `<button class="post-delete-btn" onclick="deleteDiscoverPost('${post.id}')" aria-label="Gönderiyi sil" title="Gönderiyi sil">×</button>`
      : '';
    const commentsHtml = comments.map(comment => {
      const commentProfile = comment.profiles || {};
      const commentName = commentProfile.username || commentProfile.full_name || 'Genco üyesi';
      const commentTime = new Date(comment.created_at).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      return `<div class="post-comment"><strong>${escHtml(commentName)}</strong><span>${escHtml(censorText(comment.body))}</span><time>${commentTime}</time></div>`;
    }).join('');
    return `<article class="discover-post" data-post-id="${post.id}">
      <div class="post-head">
        <div class="post-avatar ${avatarStyle ? '' : 'post-avatar-blue'}" ${avatarStyle}>${avatarStyle ? '' : initial}</div>
        <div class="post-author"><strong>${escHtml(name)}</strong><span>Genco topluluğu · ${time}</span></div>
        ${deleteAction}
      </div>
      ${post.caption ? `<p class="post-copy">${escHtml(censorText(post.caption))}</p>` : ''}
      ${post.image_url ? `<div class="post-media">
        <img class="post-image" src="${escHtml(post.image_url)}" alt="Genco topluluk paylaşımı" loading="lazy" ondblclick="handlePostImageDoubleClick(event, '${post.id}')" />
        <span class="post-heart-burst" aria-hidden="true">♥</span>
      </div>` : ''}
      <div class="post-actions">
        <button class="post-action ${liked ? 'liked' : ''}" onclick="togglePostLike('${post.id}', ${liked})"><span>${liked ? '♥' : '♡'}</span> ${likes.length}</button>
        <button class="post-action" onclick="togglePostComments('${post.id}', this)" aria-expanded="false"><span>◌</span> ${comments.length}</button>
        <button class="post-action post-share-action" onclick="showToast('Gönderi paylaşmaya hazır!')"><span>↗</span></button>
      </div>
      <div class="post-comments-panel" id="post-comments-panel-${post.id}">
        <div class="post-comments" id="post-comments-${post.id}">
          ${commentsHtml || '<div class="post-comments-empty">Henüz yorum yok. İlk yorumu sen yaz.</div>'}
        </div>
        <form class="post-comment-form" onsubmit="submitPostComment(event, '${post.id}')">
          <input id="post-comment-input-${post.id}" maxlength="500" placeholder="Yorum yaz..." autocomplete="off" />
          <button type="submit" aria-label="Yorum gönder">➤</button>
        </form>
      </div>
    </article>`;
  }).join('');
}

// Eski sürümler silinen gönderiyi sadece bu cihazda gizliyordu (genco_deleted_post_ids);
// gönderi veritabanında kaldığı için diğer cihazlarda görünmeye devam ediyordu.
// Listede kalan ve hâlâ yayında olan gönderileri veritabanından gerçekten sil.
async function purgeLocallyHiddenPosts(posts) {
  const hidden = state.hiddenDeletedPostIds;
  if (!hidden.length || !state.user?.id) return;
  const liveIds = new Set((posts || []).map(post => String(post.id)));
  const remaining = [];
  for (const id of hidden) {
    if (!liveIds.has(id)) continue; // zaten veritabanında yok, listeden düş
    try {
      await sbDeletePost(id, state.user.id);
    } catch (error) {
      // Başkasının gönderisi ya da ağ hatası: bu cihazda gizli kalsın
      console.warn('Gizlenen gönderi veritabanından silinemedi:', id, error);
      remaining.push(id);
    }
  }
  state.hiddenDeletedPostIds = remaining;
  saveHiddenDeletedPostIds(remaining);
}

async function loadDiscoverPosts() {
  const feed = document.querySelector('.discover-feed');
  try {
    state.hiddenDeletedPostIds = getHiddenDeletedPostIds();
    const allPosts = await sbGetPosts();
    await purgeLocallyHiddenPosts(allPosts);
    const posts = allPosts.filter(post => !state.hiddenDeletedPostIds.includes(String(post.id)));
    state.discoverPosts = posts;
    let engagement = { likes: [], comments: [] };
    try {
      engagement = await sbGetPostEngagement(posts.map(post => post.id));
    } catch (engagementError) {
      console.error('Beğeni/yorum verileri yüklenemedi:', engagementError);
      showToast('Beğeni ve yorum tablolarını kontrol et');
    }
    renderDiscoverPosts(posts, engagement);
  } catch (error) {
    console.error('Keşfet gönderileri yüklenemedi:', error);
    if (feed) feed.innerHTML = '<div class="discover-empty"><strong>Keşfet yüklenemedi</strong><span>Supabase bağlantısını ve posts.sql kurulumunu kontrol et.</span></div>';
  }
}

async function togglePostLike(postId, liked) {
  if (!state.user?.id) return;
  try {
    await sbTogglePostLike(postId, state.user.id, liked);
    await loadDiscoverPosts();
  } catch (error) {
    console.error('Beğeni güncellenemedi:', error);
    showToast('Beğeni güncellenemedi');
  }
}

async function deleteDiscoverPost(postId) {
  if (!state.user?.id || !confirm('Bu gönderiyi silmek istiyor musun?')) return;

  const postEl = document.querySelector(`.discover-post[data-post-id="${postId}"]`);
  const feed = document.querySelector('.discover-feed');
  const oldPosts = [...(state.discoverPosts || [])];

  if (postEl) {
    postEl.classList.add('is-hiding');
    setTimeout(() => {
      postEl.remove();
      if (feed && !feed.querySelector('.discover-post')) {
        feed.innerHTML = '<div class="discover-empty"><strong>İlk paylaşımı sen yap!</strong><span>Bugün ne yaptığını toplulukla paylaş.</span></div>';
      }
    }, 260);
  }
  if (state.discoverPosts) {
    state.discoverPosts = state.discoverPosts.filter(post => post.id !== postId);
  }

  try {
    await sbDeletePost(postId, state.user.id);
    showToast('Gönderi silindi');
  } catch (error) {
    // Veritabanından silinemediyse diğer kullanıcılarda görünmeye devam eder;
    // sadece bu cihazda gizlemek yanıltıcı olur, gönderiyi geri getir.
    console.error('Gönderi silinemedi:', error);
    state.discoverPosts = oldPosts;
    loadDiscoverPosts();
    showToast('Gönderi silinemedi, tekrar dene');
  }
}

function setPostLikeVisual(likeButton, liked) {
  const likeCount = Number(likeButton.textContent.match(/\d+/)?.[0] || 0);
  likeButton.classList.toggle('liked', liked);
  likeButton.innerHTML = `<span>${liked ? '♥' : '♡'}</span> ${likeCount + (liked ? 1 : -1)}`;
}

function toggleStaticPostLike(button) {
  setPostLikeVisual(button, !button.classList.contains('liked'));
}

const gencoAiAnswers = [
  {
    keys: ['görev', 'tamamla', 'kanıt'],
    answer: 'Kazanımlar sayfasından bir görev seç. Görevi yaptıktan sonra fotoğraf kanıtını yükleyip gönder. Onaylandığında coin ve XP kazanırsın.'
  },
  {
    keys: ['coin', 'xp', 'puan', 'kazan'],
    answer: 'Görevleri tamamlayarak coin ve XP kazanırsın. XP seviyeni yükseltir, coin ise ödüller sayfasındaki avantajları kullanmanı sağlar.'
  },
  {
    keys: ['ödül', 'odul', 'kullan', 'indirim'],
    answer: 'Kazanımlar sayfasındaki ödüller bölümünden bir ödül seçebilirsin. Yeterli coin varsa ödülü alıp işletmede kullanabilirsin.'
  },
  {
    keys: ['profil', 'düzenle', 'duzenle', 'bilgi'],
    answer: 'Profiline avatarına dokunarak gidebilirsin. Profil ekranındaki Profili Düzenle düğmesinden bilgilerini, biyografini ve fotoğrafını güncelleyebilirsin.'
  },
  {
    keys: ['arkadaş', 'arkadas', 'takip'],
    answer: 'Arkadaşlarım bölümünden arkadaş kodu arayabilir, bağlantılarını ve takip durumunu yönetebilirsin.'
  },
  {
    keys: ['seviye', 'level', 'sıralama', 'siralama'],
    answer: 'XP kazandıkça seviyen yükselir. Zirve bölümünden topluluk içindeki sıralamanı görebilirsin.'
  },
  {
    keys: ['genco', 'nedir', 'ne işe', 'platform'],
    answer: 'Genco; görevler tamamlayıp ödüller kazanabileceğin, toplulukla paylaşım yapabileceğin gençlik platformudur.'
  }
];

const gencoAiSmallTalk = [
  {
    keys: ['merhaba', 'selam', 'hey', 'sa'],
    answer: () => {
      const hour = new Date().getHours();
      if (hour >= 7 && hour < 12) return 'Günaydın kankam! ☀️ İyidir bende, senden naber?';
      if (hour >= 17 || hour < 7) return 'İyi akşamlar kankam! 🌙 İyidir bende, senden naber?';
      return 'İyidir kankam, senden naber? 🌤️';
    }
  },
  {
    keys: ['nasılsın', 'nasilsin', 'naber', 'ne haber'],
    answer: () => 'İyidir kankam, senden naber? ✦ Genco hakkında ne merak ediyorsun?'
  },
  {
    keys: ['teşekkür', 'tesekkur', 'sağ ol', 'sag ol', 'eyvallah'],
    answer: () => 'Ne demek kankam, her zaman! ✦ Başka neye bakalım?'
  },
  {
    keys: ['görüşürüz', 'gorusuruz', 'hoşça kal', 'hosca kal', 'bay bay', 'bye'],
    answer: () => 'Görüşürüz kankam! 👋 Kendine iyi bak.'
  },
  {
    keys: ['yardım et', 'yardim et', 'yardım lazım', 'yardim lazim'],
    answer: () => 'Tabii, buradayım. Görevler, coin, XP, ödüller veya profilin hakkında soru sorabilirsin.'
  },
  {
    keys: ['tamamdır', 'tamamdir', 'tamam', 'peki', 'olur', 'anladım', 'anladim'],
    answer: () => 'Süper kankam ✦ Aklına takılan başka bir şey varsa sor, beraber bakalım.'
  },
  {
    keys: ['nasıl yani', 'nasil yani', 'ne demek', 'ne anlatıyon', 'ne anlatiyon'],
    answer: () => 'Şöyle diyeyim kankam: biraz daha açmamı ister misin? Hangi kısmı karışık geldi?' 
  },
  {
    keys: ['anlamadım', 'anlamadim', 'anlamadım ki', 'anlamadim ki'],
    answer: () => 'Hiç sorun değil kankam 😄 Daha basit anlatayım. Tam olarak hangi konuyu merak ediyorsun?'
  },
  {
    keys: ['evet', 'aynen', 'doğru', 'dogru', 'hı hı', 'hıhı', 'hihi'],
    answer: () => 'Aynen kankam ✦ Devam edelim mi, neyi merak ediyorsun?'
  },
  {
    keys: ['hayır', 'hayir', 'yok', 'ı-ı', 'ıı'],
    answer: () => 'Tamam kankam, sorun yok. Başka bir şey konuşalım mı?'
  },
  {
    keys: ['hmm', 'hımm', 'hmmm', 'hmm tamam'],
    answer: () => 'Aklında bir şey var gibi 😄 Anlat kankam, dinliyorum.'
  }
];

function solveGencoMath(question) {
  const lowered = question
    .toLocaleLowerCase('tr-TR')
    .replace(/,/g, '.')
    .replace(/[x×]/g, '*')
    .replace(/÷/g, '/')
    .replace(/(kaç eder|kac eder|nedir|hesapla|sonuç|sonuc|işlemi|islemi)/g, '');
  const match = lowered.match(/[0-9][0-9+\-*/().%\s]*/);
  const expression = match?.[0]?.trim();
  if (!expression || !/[+*/%]/.test(expression) && !/\d\s*-\s*\d/.test(expression)) return null;
  if (!/^[0-9+\-*/().%\s]+$/.test(expression)) return null;

  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/()%]/g);
  if (!tokens || tokens.join('') !== expression.replace(/\s/g, '')) return null;
  let position = 0;

  function parseExpression() {
    let value = parseTerm();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++];
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  function parseTerm() {
    let value = parseFactor();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position++];
      const right = parseFactor();
      if (operator === '/' && right === 0) throw new Error('zero-division');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }

  function parseFactor() {
    const token = tokens[position++];
    if (token === '+') return parseFactor();
    if (token === '-') return -parseFactor();
    if (token === '(') {
      const value = parseExpression();
      if (tokens[position++] !== ')') throw new Error('unclosed-parenthesis');
      return value;
    }
    if (!token || Number.isNaN(Number(token))) throw new Error('invalid-expression');
    const value = Number(token);
    return tokens[position] === '%' ? (position++, value / 100) : value;
  }

  try {
    const result = parseExpression();
    if (position !== tokens.length || !Number.isFinite(result)) return null;
    return result.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
  } catch (_error) {
    return null;
  }
}

function toggleGencoAi(force) {
  const panel = document.getElementById('genco-ai-panel');
  const launcher = document.getElementById('genco-ai-launcher');
  if (!panel || !launcher) return;
  if (launcher.dataset.dragged === 'true') {
    launcher.dataset.dragged = 'false';
    return;
  }
  if (typeof force !== 'boolean') {
    launcher.classList.add('show-label');
    clearTimeout(launcher._labelTimer);
    launcher._labelTimer = setTimeout(() => launcher.classList.remove('show-label'), 3000);
  }
  const isOpen = typeof force === 'boolean' ? force : !panel.classList.contains('open');
  panel.classList.toggle('open', isOpen);
  launcher.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) document.getElementById('genco-ai-input')?.focus();
}

function initGencoAiDrag() {
  const launcher = document.getElementById('genco-ai-launcher');
  if (!launcher || launcher.dataset.dragReady === 'true') return;
  launcher.dataset.dragReady = 'true';

  try {
    const saved = JSON.parse(localStorage.getItem('genco_ai_position') || 'null');
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      launcher.style.left = `${saved.left}px`;
      launcher.style.top = `${saved.top}px`;
      launcher.style.right = 'auto';
      launcher.style.bottom = 'auto';
    }
  } catch (_error) {}

  let pointerId = null;
  let holdTimer = null;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const clearHoldTimer = () => {
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = null;
  };

  launcher.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    const rect = launcher.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    dragging = false;
    clearHoldTimer();
    holdTimer = setTimeout(() => {
      dragging = true;
      launcher.classList.add('is-dragging');
    }, 180);
    launcher.setPointerCapture?.(pointerId);
  });

  launcher.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    const movedX = event.clientX - startX;
    const movedY = event.clientY - startY;
    if (!dragging && Math.hypot(movedX, movedY) > 6) {
      dragging = true;
      clearHoldTimer();
      launcher.classList.add('is-dragging');
    }
    if (!dragging) return;
    event.preventDefault();
    const maxLeft = Math.max(8, window.innerWidth - launcher.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - launcher.offsetHeight - 8);
    launcher.style.left = `${Math.min(Math.max(8, startLeft + movedX), maxLeft)}px`;
    launcher.style.top = `${Math.min(Math.max(8, startTop + movedY), maxTop)}px`;
    launcher.style.right = 'auto';
    launcher.style.bottom = 'auto';
  });

  const finishDrag = event => {
    if (event.pointerId !== pointerId) return;
    clearHoldTimer();
    if (dragging) {
      const rect = launcher.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - launcher.offsetWidth - 8);
      const maxTop  = Math.max(8, window.innerHeight - launcher.offsetHeight - 8);
      const snapLeft = (rect.left + launcher.offsetWidth / 2) < window.innerWidth / 2 ? 8 : maxLeft;
      const clampedTop = Math.min(Math.max(8, rect.top), maxTop);

      launcher.classList.add('is-snapping');
      launcher.style.left = `${snapLeft}px`;
      launcher.style.top = `${clampedTop}px`;
      launcher.style.right = 'auto';
      launcher.style.bottom = 'auto';
      setTimeout(() => launcher.classList.remove('is-snapping'), 260);

      localStorage.setItem('genco_ai_position', JSON.stringify({ left: snapLeft, top: clampedTop }));
      launcher.dataset.dragged = 'true';
    }
    dragging = false;
    pointerId = null;
    launcher.classList.remove('is-dragging');
  };

  launcher.addEventListener('pointerup', finishDrag);
  launcher.addEventListener('pointercancel', finishDrag);
}

function getGencoAiAnswer(question) {
  const mathResult = solveGencoMath(question);
  if (mathResult !== null) return `Hemen hesapladım kankam ✦ Sonuç: ${mathResult}`;
  const normalized = question.toLocaleLowerCase('tr-TR');
  const smallTalk = gencoAiSmallTalk.find(item => item.keys.some(key => normalized.includes(key)));
  if (smallTalk) return smallTalk.answer();
  const match = gencoAiAnswers.find(item => item.keys.some(key => normalized.includes(key)));
  return match?.answer || 'Bu konuda henüz hazır bir cevabım yok. Görevler, coin, XP, ödüller veya profil hakkında soru sorabilirsin.';
}

function askGencoAi(question) {
  const messages = document.getElementById('genco-ai-messages');
  if (!messages || !question.trim()) return;
  messages.insertAdjacentHTML('beforeend', `<div class="genco-ai-message user">${escHtml(question.trim())}</div>`);
  messages.insertAdjacentHTML('beforeend', `<div class="genco-ai-message bot">${escHtml(getGencoAiAnswer(question))}</div>`);
  messages.scrollTop = messages.scrollHeight;
}

function submitGencoAi(event) {
  event.preventDefault();
  const input = document.getElementById('genco-ai-input');
  const question = input?.value.trim() || '';
  if (!question) return;
  askGencoAi(question);
  input.value = '';
  input.focus();
}

function handlePostImageDoubleClick(event, postId = '') {
  const image = event.currentTarget;
  const post = image.closest('.discover-post');
  const likeButton = post?.querySelector('.post-action');
  const heart = post?.querySelector('.post-heart-burst');
  if (!post || !likeButton || likeButton.classList.contains('liked') || post.dataset.likePending === 'true') return;

  if (heart) {
    heart.classList.remove('is-visible');
    void heart.offsetWidth;
    heart.classList.add('is-visible');
  }

  if (postId) {
    post.dataset.likePending = 'true';
    likeButton.classList.add('liked');
    const icon = likeButton.querySelector('span');
    if (icon) icon.textContent = '♥';
    togglePostLike(postId, false);
    return;
  }

  setPostLikeVisual(likeButton, true);
}

function focusPostComment(postId) {
  togglePostComments(postId);
  const input = document.getElementById(`post-comment-input-${postId}`);
  if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

function togglePostComments(postId, button) {
  const panel = document.getElementById(`post-comments-panel-${postId}`);
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  const trigger = button || document.querySelector(`[onclick="togglePostComments('${postId}', this)"]`);
  if (trigger) trigger.setAttribute('aria-expanded', String(isOpen));
}

async function submitPostComment(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`post-comment-input-${postId}`);
  const body = censorText(input?.value.trim() || '');
  if (!state.user?.id || !body) return;
  const button = event.submitter;
  if (button) { button.disabled = true; button.textContent = '…'; }
  try {
    await sbAddPostComment(postId, state.user.id, body);
    await loadDiscoverPosts();
    showToast('Yorumun eklendi');
  } catch (error) {
    console.error('Yorum eklenemedi:', error);
    showToast('Yorum eklenemedi');
    if (button) { button.disabled = false; button.textContent = '➤'; }
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── İÇERİK FİLTRESİ (küfür/uygunsuz kelime) ───
   Liste buraya elle eklenir. Paylaşım yazılırken (submitDiscoverPost,
   submitPostComment) VE gösterilirken (renderDiscoverPosts) filtrelenir —
   böylece hem veritabanına temiz kaydedilir hem de daha önce yazılmış
   içerikler de hiçbir kullanıcıya görünmez. */
const PROFANITY_WORDS = [
  'sikerim', 'sik', 'sıkerım', 'amçık', 'amcık', 'göt', 'piç', 'pic',
  'yarrak', 'yarak', 'göt deliği', 'sütyen', 'südyen', 'tanga', 'porno',
  'sex', 's3x', 'sikik', 'sokuk', 'pipi', 'çük', 'amına', 'am', 'koyarım',
  'amına koyarım', 'seni sikerim', 'senin amına koyarım', 'yarrak kafası',
  'puşt', 'allahnı kitabını atanı döverim sokarım', 'orgazm', 'am suyu',
  'pedofili', 'orospuçocğu', 'oç', 'oe', 'orospu', 'orospuevladı',
  'ananı sikerim', 'ananı sikiyim'
];

function escapeRegExpChars(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let _profanityRegex = null;
function buildProfanityFilter() {
  const words = PROFANITY_WORDS.filter(Boolean);
  if (!words.length) { _profanityRegex = null; return; }
  const pattern = words.map(escapeRegExpChars).join('|');
  // \p{L}\p{N} — Türkçe karakterler dahil harf/rakam sınırını doğru tanır.
  _profanityRegex = new RegExp(`(^|[^\\p{L}\\p{N}])(${pattern})(?=[^\\p{L}\\p{N}]|$)`, 'giu');
}
buildProfanityFilter();

function censorText(text) {
  if (!text || !_profanityRegex) return text;
  _profanityRegex.lastIndex = 0;
  return String(text).replace(_profanityRegex, (_m, boundary, word) => boundary + '*'.repeat(word.length));
}

async function launchApp() {
  closeAuthScreen();
  document.getElementById('app-screen').classList.add('active');
  document.body.classList.toggle('is-guest', isGuest());
  initTopBar();
  toggleBottomNav(false);
  renderSettings();
  if (state._greetingInterval) clearInterval(state._greetingInterval);
  state._greetingInterval = setInterval(updateHomeGreeting, 60000);
  startTimer();
  refreshCoinDisplays();
  goPage('home');
  loadTasksAndRender();
  state.partnersData = null; // giriş/çıkışta işletme listesi yeni oturumun ödülleriyle kurulsun
  loadRewardsAndRender();
  loadEvents();
  loadPartners();
  loadDiscoverPosts();
  if (state._discoverInterval) clearInterval(state._discoverInterval);
  // Bildirim dot'unu hemen ve her dakikada güncelle
  updateNotifDot();
  if (state._notifDotInterval) clearInterval(state._notifDotInterval);
  state._notifDotInterval = setInterval(() => {
    if (state.user?.id) updateNotifDot();
  }, 60000);

  // Her 15 saniyede stats'ı tazele
  if (state._statsInterval) clearInterval(state._statsInterval);
  state._statsInterval = setInterval(() => {
    if (state.user?.id && state.currentPage !== 'admin') refreshUserStats();
  }, 15000);

  // Çevrimdışıyken kademe atladıysa animasyonu göster
  if (state.pendingLevelUp) {
    const lvl = state.pendingLevelUp;
    state.pendingLevelUp = null;
    setTimeout(() => showLevelUp(lvl), 1200);
  }

  // Sıralamayı arka planda çek
  if (isGuest()) return;
  // Ay değiştiyse: sezon özeti ve yeni sezon başlangıcı (bir kez)
  setTimeout(() => showSeasonSummaryIfPending().catch(() => {}), state.pendingLevelUp ? 4000 : 1400);
  sbGetLeaderboard().then(raw => {
    const data = seasonalLeaderboard(raw);
    const myId = state.user?.id;
    let rank = 0;
    data.forEach((u, i) => { if (u.id === myId) rank = i + 1; });
    if (rank > 0) { state.user.rank = rank; refreshCoinDisplays(); }
  }).catch(() => {});

}

function refreshCurrentPage() {
  if (!state.user?.id) return;

  // Aktif sayfayı DOM'dan tespit et
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const page = activePage.id.replace('page-', '');

  showToast('Yenileniyor…');

  if (page === 'home') {
    refreshUserStats();
    state._dailyTasksDate = null;
    loadTasksAndRender();
    loadRewardsAndRender();
    loadEvents();
  } else if (page === 'tasks' || page === 'rewards') {
    state._dailyTasksDate = null;
    loadTasksAndRender();
    loadRewardsAndRender();
  } else if (page === 'profile') {
    refreshUserStats().then(() => updateProfileDisplay());
  } else if (page === 'leaderboard') {
    loadLeaderboard();
  } else if (page === 'friends') {
    loadFriendsPage();
  } else if (page === 'notifications') {
    loadNotifications();
  } else if (page === 'task-history') {
    renderTaskHistory();
  }
}

async function refreshUserStats() {
  if (!state.user.id) return;
  try {
    const prevLevel = state.user.level;
    const stats = await sbGetStats(state.user.id);
    state.user.coin           = stats.coin;
    state.user.gcoin          = stats.gcoin || 0;
    state.user.xp             = stats.xp;
    state.user.level          = seasonTier(stats.xp, state.user.cosmetics);
    state.user.streak         = stats.streak;
    state.user.tasksCompleted = stats.tasks_completed;
    state.user.rewardsUsed    = stats.rewards_used;
    state.user.claimedRewards = stats.claimed_rewards || [];
    refreshCoinDisplays();
    if (prevLevel && prevLevel !== state.user.level && levelRank(state.user.level) > levelRank(prevLevel)) {
      sbUpdateStats(state.user.id, { level: state.user.level }).catch(() => {});
      showLevelUp(state.user.level, prevLevel);
    }
    rememberLevel(state.user.id, state.user.level);
  } catch(e) {}
}

/* Kademe = bu ayın Sezon XP'si (tüm XP: görev + rozet + çark + yarışma…). Eşikler aylık kazanca göre:
   görevler 20–50 XP (ortalama ~27), görev dışı ~800 XP/ay → günde 1 görev ≈ Altın, 2 görev ≈ Altın III,
   3 görev ≈ Platin II, 4 görev ≈ Elmas I, 5 görev ≈ Elmas II. Legend her şeyi yapanlara kalır. */
const LEVEL_THRESHOLDS = [
  { name:'Bronz I',   xp:0 },
  { name:'Bronz II',  xp:150 },
  { name:'Bronz III', xp:300 },
  { name:'Gümüş I',   xp:450 },
  { name:'Gümüş II',  xp:650 },
  { name:'Gümüş III', xp:900 },
  { name:'Altın I',   xp:1200 },
  { name:'Altın II',  xp:1600 },
  { name:'Altın III', xp:2000 },
  { name:'Platin I',  xp:2500 },
  { name:'Platin II', xp:3000 },
  { name:'Platin III',xp:3500 },
  { name:'Elmas I',   xp:4000 },
  { name:'Elmas II',  xp:4500 },
  { name:'Elmas III', xp:5100 },
  { name:'Legend I',  xp:5800 },
  { name:'Legend II', xp:6600 },
  { name:'Legend III',xp:7500 },
];
const LEVEL_ORDER = LEVEL_THRESHOLDS.map(t => t.name);
function levelRank(l) { return LEVEL_ORDER.indexOf(l); }
function levelBase(l) { return (l || '').split(' ')[0]; }

function levelStorageKey(userId) {
  return userId ? `genco_last_level_${userId}` : '';
}

function rememberLevel(userId, level) {
  const key = levelStorageKey(userId);
  if (key && LEVEL_ORDER.includes(level)) localStorage.setItem(key, level);
}

/* ─── GENCO SEZONU ───
   Kademe ve G-Pass aynı sezona bağlıdır: sezon = takvim ayı, tek bir Sezon XP'si ikisini birden ilerletir.
   user_stats.xp ömür boyu toplam olarak kalır (hiçbir şey silinmez). Her sezonun başlangıç XP'si
   profiles.equipped_cosmetics.season = { id, startXp, history:[...] } içinde tutulur:
     Sezon XP = xp − startXp  →  Kademe = xpToLevel(Sezon XP), G-Pass seviyesi = Sezon XP / seviye başı XP.
   Ay değişince ilk açılışta geçen sezon arşivlenir (sezon geçmişi) ve yeni sezon 0 XP'den başlar.
   Coin, rozet, unvan, çerçeve, kozmetik ve kuponlar kalıcıdır; yalnızca sezon ilerlemesi sıfırlanır. */
const GENCO_FIRST_SEASON = '2026-10'; // Genco Sezon 1

// Sezon 1 = GENCO_FIRST_SEASON; ondan önceki aylar "Ön Sezon" (0) sayılır ve arşivlenmez
function seasonNumber(id) {
  const [y, m] = id.split('-').map(Number);
  const [y0, m0] = GENCO_FIRST_SEASON.split('-').map(Number);
  return Math.max(0, (y - y0) * 12 + (m - m0) + 1);
}
function seasonLabel(id) { const n = seasonNumber(id); return n ? `Sezon ${n}` : 'Ön Sezon'; }
function seasonXpOf(xp, cos) {
  const s = cos?.season;
  if (!s || s.id !== gpassSeasonId() || !Number.isFinite(Number(s.startXp))) return 0;
  return Math.max(0, (Number(xp) || 0) - Number(s.startXp));
}
function seasonTier(xp, cos) { return xpToLevel(seasonXpOf(xp, cos)); }
function mySeasonXp() { return seasonXpOf(state.user?.xp, state.user?.cosmetics); }

// Görev gönderimlerinden bir sezon aralığında onaylanan XP ve görev sayısı
function taskStatsInRange(subs, range) {
  let xp = 0, tasks = 0;
  (subs || []).forEach(s => {
    if (s.status !== 'approved') return;
    const t = new Date(s.reviewed_at || s.submitted_at);
    if (t >= range.start && t < range.end) { xp += Number(s.tasks?.xp_reward || 0); tasks++; }
  });
  return { xp, tasks };
}

// Girişte çağrılır: bu ayın sezon kaydını hazırlar, ay değiştiyse geçen sezonu arşivler.
// Güncellenmiş equipped_cosmetics'i döndürür (profile nesnesine de yazar).
async function seasonPrepare(userId, stats, profile) {
  const cos = profile?.equipped_cosmetics || {};
  const id = gpassSeasonId();
  const cur = cos.season;
  if (cur?.id === id && Number.isFinite(Number(cur.startXp))) return cos;

  let subs = [];
  try { subs = await sbGetMySubmissions(userId); state.submissions = subs; } catch {}
  const xp = Number(stats?.xp) || 0;
  // Bu ay (ilk açılıştan önce) onaylanan görevlerin XP'si yeni sezona sayılsın
  const monthXp = taskStatsInRange(subs, gpassSeasonRange(id)).xp;
  const startXp = Math.max(0, xp - monthXp);
  const history = Array.isArray(cur?.history) ? [...cur.history] : [];
  let summary = null;

  if (cur?.id && cur.id !== id && Number.isFinite(Number(cur.startXp)) && seasonNumber(cur.id) > 0) {
    const prevXp = Math.max(0, startXp - Number(cur.startXp));
    let name = gpassBaseSeason(cur.id).name, per = GPASS_DEFAULT_XP;
    try { const row = await sbGetPassSeason(cur.id); if (row) { name = row.name || name; per = Number(row.xp_per_level) || per; } } catch {}
    const passLevel = gpassLevelOf(passTaskXp(cur.id, subs), per);
    summary = {
      id: cur.id, no: seasonNumber(cur.id), name, emoji: gpassBaseSeason(cur.id).emoji,
      xp: prevXp, tier: xpToLevel(prevXp), pass: passLevel,
      tasks: taskStatsInRange(subs, gpassSeasonRange(cur.id)).tasks,
      rewards: (cos.gpass?.claims?.[cur.id + (cos.gpass?.resets?.[cur.id] ? `~${cos.gpass.resets[cur.id]}` : '')] || []).length,
    };
    if (!history.some(h => h.id === cur.id)) history.unshift(summary);
  }

  const next = { ...cos, season: { id, startXp, history: history.slice(0, 36), pendingSummary: summary ? summary.id : '' } };
  try { await sb.from('profiles').update({ equipped_cosmetics: next }).eq('id', userId); } catch (e) { console.warn('Sezon kaydedilemedi:', e); }
  if (profile) profile.equipped_cosmetics = next;
  return next;
}

// Sezon bitince bir kez: sezon özeti + yeni sezon başladı
async function showSeasonSummaryIfPending() {
  const s = state.user?.cosmetics?.season;
  if (!s?.pendingSummary) return;
  const h = (s.history || []).find(x => x.id === s.pendingSummary);
  await saveBadgeCosmetics({ season: { ...s, pendingSummary: '' } }).catch(() => {});
  if (!h) return;
  const box = document.getElementById('gpr-box');
  if (!box) return;
  const cur = gpassBaseSeason(gpassSeasonId());
  box.style.setProperty('--rc', '253,224,71');
  box.style.setProperty('--rr', '253,224,71');
  document.getElementById('modal-gpass-reveal')?.style.setProperty('--rc', '253,224,71');
  box.innerHTML = `
    ${gpassRevealStage(`<span class="gpx-emo">${h.emoji || '🏆'}</span>`, true)}
    <div class="gpr-body">
    <div class="gpr-meta"><span class="gpr-rarity">SEZON SONU</span><span class="gpr-kicker">GENCO ${seasonLabel(h.id).toLocaleUpperCase('tr')} TAMAMLANDI</span></div>
    <h3>${escHtml(h.name)}</h3>
    <div class="ss-grid">
      <div><small>Toplam XP</small><b>${Number(h.xp).toLocaleString('tr-TR')}</b></div>
      <div><small>Ulaşılan Kademe</small><b>${escHtml(h.tier)}</b></div>
      <div><small>G-Pass</small><b>Level ${h.pass} / ${GPASS_MAX}</b></div>
      <div><small>Tamamlanan görev</small><b>${h.tasks}</b></div>
      <div class="ss-wide"><small>Alınan ödül</small><b>${h.rewards}</b></div>
    </div>
    <div class="ss-new">
      <b>GENCO ${seasonLabel(cur.id).toLocaleUpperCase('tr')} BAŞLADI · ${cur.emoji} ${escHtml(cur.name)}</b>
      <small>Kademe Bronz I, G-Pass Level 1 ve Sezon XP 0'dan başlıyor. Coin, rozet, unvan ve çerçevelerin hesabında kalıyor.</small>
    </div>
    <button type="button" class="gpr-btn" onclick="closeModal('modal-gpass-reveal'); goPage('gpass')">Yeni sezona başla</button>
    </div>
    ${gpassConfetti(['253,224,71', '244,114,182'])}`;
  openModal('modal-gpass-reveal');
}

function queueLevelUp(previousLevel, nextLevel) {
  if (!previousLevel || !nextLevel) return;
  if (levelRank(nextLevel) > levelRank(previousLevel)) {
    state.pendingLevelUp = nextLevel;
  }
}

function showLevelUp(level, prevLevel) {
  const emojis = { Bronz:'🥉', Gümüş:'🥈', Altın:'🥇', Platin:'🔷', Elmas:'💎', Legend:'🌟' };
  const subs   = {
    Bronz:  'İyi başlangıç! Maceran devam ediyor.',
    Gümüş:  'Harika gidiyorsun, devam et!',
    Altın:  'Ciddi bir oyuncusun artık. Süper!',
    Platin: 'İnanılmaz! Platformun en iyilerinden birisin.',
    Elmas:  'Elit seviye. Çok az kişi buraya ulaşır.',
    Legend: '🌟 Efsane oldun! Platforma adını yazdırdın.'
  };
  const base = levelBase(level);
  const overlay = document.getElementById('levelup-overlay');
  document.getElementById('lu-emoji').textContent = emojis[base] || '⭐';
  document.getElementById('lu-level').textContent = level;
  document.getElementById('lu-sub').textContent   = prevLevel && prevLevel !== level ? `${prevLevel} → ${level} · ${subs[base] || 'Tebrikler!'}` : (subs[base] || 'Tebrikler!');

  // Konfeti partikülleri oluştur
  const pc = document.getElementById('lu-particles');
  pc.innerHTML = '';
  const colors = ['#facc15','#60a5fa','#7df9c2','#fb923c','#22d3ee','#fbbf24'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('span');
    p.className = 'lu-particle';
    p.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${6+Math.random()*6}px;
      height:${6+Math.random()*6}px;
      animation-delay:${Math.random()*0.8}s;
      animation-duration:${1.2+Math.random()*1}s;
    `;
    pc.appendChild(p);
  }

  overlay.style.display = 'flex';
  overlay.classList.remove('lu-hide');
  overlay.classList.add('lu-show');

  if (state._luTimer) clearTimeout(state._luTimer);
  state._luTimer = setTimeout(() => closeLevelUp(), 6000);
}

function closeLevelUp() {
  const overlay = document.getElementById('levelup-overlay');
  overlay.classList.replace('lu-show','lu-hide');
  setTimeout(() => { overlay.style.display = 'none'; }, 400);
}

function showWelcomeReward() {
  const overlay = document.getElementById('welcome-reward-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-visible');
  void overlay.offsetWidth;
  overlay.classList.add('is-visible');
}

function closeWelcomeReward() {
  document.getElementById('welcome-reward-overlay')?.classList.remove('is-visible');
}

// Bugünün görevlerinin durumu yalnızca bugün yapılan gönderimlerden hesaplanır.
// (Görevler havuzdan rastgele geldiği için eski bir gönderim, bugün tekrar gelen görevi "yapıldı" gösteriyordu.)
function todaySubs(submissions) {
  const today = localDateKey();
  return (submissions || []).filter(s => {
    const at = s.submitted_at || s.created_at;
    return at && localDateKey(new Date(at)) === today;
  });
}

async function loadTasksAndRender() {
  const list = document.getElementById('tasks-list');
  if (isGuest()) {
    const guestCard = `<div class="tc-empty" role="button" onclick="requireLogin()" style="cursor:pointer"><div class="tc-empty-icon">🔒</div><div>Görevleri görmek için giriş yap</div></div>`;
    state.tasks = null;
    state.submissions = null;
    if (list) list.innerHTML = guestCard;
    const preview = document.getElementById('home-task-preview');
    if (preview) preview.innerHTML = guestCard;
    updateHomeDailyProgress([], []);
    return;
  }
  if (list) list.innerHTML = `<div class="tc-empty"><div class="tc-empty-icon">⏳</div><div>Görevler yükleniyor…</div></div>`;
  try {
    const today = localDateKey();
    if (state._dailyTasksDate !== today) {
      await sbAssignDailyTasks(state.user.id);
      state._dailyTasksDate = today;
    }
    let [dailyRows, submissions] = await Promise.all([
      sbGetUserDailyTasks(state.user.id),
      sbGetMySubmissions(state.user.id)
    ]);
    // Sadece hâlâ aktif olan görevleri al (admin silmiş olabilir). Eski
    // atamalarda 5'ten fazla görev olabilir; gönderim yapılmış olanlar kırpılmasın.
    const todays = todaySubs(submissions);
    const submittedIds = new Set(todays.map(s => s.task_id));
    const pickDaily = rows => (rows || []).map(r => r.tasks).filter(t => t && t.is_active !== false)
      .sort((a, b) => submittedIds.has(b.id) - submittedIds.has(a.id))
      .slice(0, DAILY_TASK_COUNT);
    let tasks = pickDaily(dailyRows);

    // Tüm atamalar silinmiş/pasif görevlere işaret ediyorsa bugünkü atamaları temizle ve yeniden ata
    if (tasks.length === 0) {
      await sbClearUserDailyTasksToday(state.user.id);
      await sbAssignDailyTasks(state.user.id);
      state._dailyTasksDate = today;
      dailyRows = await sbGetUserDailyTasks(state.user.id);
      tasks = pickDaily(dailyRows);
    }
    state.tasks = tasks;
    state.submissions = submissions;
    syncBadges();
    renderTasks(tasks, todays);
    gpassRefreshBanner().catch(() => {});
    renderHomeTaskPreview(tasks, todays);
    updateHomeDailyProgress(tasks, todays);
  } catch (e) {
    console.error('Görevler yüklenemedi:', e);
    if (list) list.innerHTML = `<div class="tc-empty"><div class="tc-empty-icon">⚠️</div><div>Görevler yüklenemedi</div></div>`;
  }
}


async function loadRewardsAndRender() {
  try {
    const rewards = await sbGetRewards();
    state.rewards = rewards;
    renderRewards(rewards);
    renderHomeRewardsPreview(rewards);
  } catch (e) {
    console.error('Ödüller yüklenemedi:', e);
  }
}

function updateHomeDailyProgress(tasks, submissions) {
  const subMap = {};
  (submissions || []).forEach(s => { if (!subMap[s.task_id]) subMap[s.task_id] = s; }); // liste yeniden eskiye: en son gönderim geçerli
  const total = tasks.length;
  const done  = tasks.filter(t => subMap[t.id]?.status === 'approved').length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  const fill  = document.querySelector('.htp-fill');
  const label = document.querySelector('.htp-done');
  const totEl = document.querySelector('.htp-label');
  if (fill)  fill.style.width = pct + '%';
  if (label) label.textContent = done;
  if (totEl) totEl.innerHTML = total ? `${done} / ${total} tamamlandı` : (isGuest() ? 'Görmek için giriş yap' : 'Bugün görev yok');
  document.getElementById('gh-daily-ring')?.style.setProperty('--p', pct);
  const nextEl = document.getElementById('gh-daily-next');
  if (nextEl) {
    const nextTask = tasks.find(t => !subMap[t.id]);
    nextEl.textContent = total && done === total ? 'Hepsi bitti, efsanesin! 🎉' : nextTask ? `Sıradaki: ${nextTask.emoji || '🎯'} ${nextTask.title}` : '';
  }
  document.querySelector('.gh-tile-daily')?.classList.toggle('is-done', !!total && done === total);

  const tpsDone  = document.querySelector('.tps-done');
  const tpsTotal = document.querySelector('.tps-total');
  if (tpsDone)  tpsDone.textContent = done;
  if (tpsTotal) tpsTotal.textContent = ` / ${total} günlük görev tamamlandı`;
  kzRefreshNav();
}

function renderHomeTaskPreview(tasks, submissions) {
  const container = document.getElementById('home-task-preview');
  if (!container) return;
  if (!tasks || !tasks.length) {
    container.innerHTML = `<div class="tc-empty" style="padding:20px 0"><div class="tc-empty-icon">📭</div><div>Bugün görev yok</div></div>`;
    return;
  }

  const subMap = {};
  (submissions || []).forEach(s => { if (!subMap[s.task_id]) subMap[s.task_id] = s; }); // liste yeniden eskiye: en son gönderim geçerli

  const statusLabel = { pending:'Görevi Yap', review:'İnceleniyor', approved:'Onaylandı ✓', rejected:'Reddedildi' };
  const iconColors  = ['rgba(245,158,11,0.12)','rgba(139,92,246,0.12)','rgba(16,185,129,0.12)',
    'rgba(59,130,246,0.12)','rgba(239,68,68,0.12)','rgba(34,197,94,0.12)','rgba(99,102,241,0.12)',
    'rgba(244,114,182,0.12)','rgba(251,146,60,0.12)','rgba(6,182,212,0.12)'];

  container.innerHTML = tasks.map((task, i) => {
    const sub    = subMap[task.id];
    const status = sub ? sub.status : 'pending';
    const chipStatus = status === 'approved' ? 'done' : status;
    const color  = iconColors[i % iconColors.length];
    return `<div class="task-preview-card ${chipStatus}" onclick="goPage('tasks')">
      <div class="tpc-icon-wrap" style="background:${color}">${task.emoji}</div>
      <div class="task-p-name">${task.title}</div>
      <div class="task-p-meta">+${task.coin_reward} 🪙 · +${task.xp_reward} ⚡</div>
      <div class="tpc-chip tpc-${chipStatus}">${statusLabel[status] || 'Bekliyor'}</div>
    </div>`;
  }).join('');
}

function renderHomeRewardsPreview(rewards) {
  const container = document.getElementById('home-rewards-preview');
  if (!container) return;
  if (!rewards || !rewards.length) {
    container.innerHTML = `<div class="rmc-loading">Ödül yok</div>`;
    return;
  }
  const preview = rewards.filter(r => !REMOVED_PARTNERS.includes(r.partner_name)).slice(0, 6);
  container.innerHTML = preview.map(r => {
    const logo = getPartnerLogo({ name: r.partner_name });
    const iconHtml = logo
      ? `<img class="rmc-logo" src="${logo}" alt="" onerror="this.outerHTML='<div class=\\'rmc-emoji\\'>${r.emoji}</div>'">`
      : `<div class="rmc-emoji">${r.emoji}</div>`;
    return `
    <div class="reward-mini-card" onclick="goPage('rewards')" style="cursor:pointer">
      ${iconHtml}
      <div class="rmc-name">${r.name}</div>
      <div class="rmc-disc">${r.description || ''}</div>
      <div class="rmc-cost">${r.coin_cost} 🪙</div>
    </div>`;
  }).join('');
}

function renderTasks(tasks, submissions) {
  const list = document.getElementById('tasks-list');
  if (!list) return;

  // Her görev için kullanıcının son submission'ını bul
  const subMap = {};
  (submissions || []).forEach(s => { if (!subMap[s.task_id]) subMap[s.task_id] = s; }); // liste yeniden eskiye: en son gönderim geçerli
  const statusOf = t => {
    const s = subMap[t.id]?.status;
    return s === 'approved' ? 'done' : (s || 'pending');
  };

  // Üst kart: ilerleme halkası ve özet
  const all = tasks || [];
  const done = all.filter(t => statusOf(t) === 'done').length;
  const review = all.filter(t => statusOf(t) === 'review').length;
  const coinsLeft = all.filter(t => ['pending', 'rejected'].includes(statusOf(t)))
    .reduce((sum, t) => sum + Number(t.coin_reward || 0), 0);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('gt-done', done);
  set('gt-total', all.length);
  set('gt-coins-left', coinsLeft);
  set('gt-review', review);
  const ring = document.getElementById('gt-ring-fg');
  if (ring) {
    const C = 2 * Math.PI * 42;
    ring.style.strokeDashoffset = String(C * (1 - (all.length ? done / all.length : 0)));
  }
  const steps = document.getElementById('gt-steps');
  if (steps) steps.innerHTML = all.map(t => `<i class="gt-step gt-step-${statusOf(t)}"></i>`).join('');

  if (!all.length) {
    list.innerHTML = `<div class="gt-empty"><div class="gt-empty-ic">📭</div><b>Bugün görev yok</b><span>Yeni görevler yakında burada olacak.</span></div>`;
    return;
  }

  // Kategoriye göre renk ve ikon; bilinmeyen kategori sıradaki renkten alır
  const catStyle = {
    'Spor': [22, '⚡'], 'Çevre': [150, '♻️'], 'Sağlık': [345, '💗'], 'Eğitim': [215, '🎓'],
    'Sosyal': [265, '👥'], 'Doğa': [120, '🌿'], 'Yaşam': [42, '✨'], 'Sosyal Medya': [300, '📲'],
    'Etkinlik': [190, '🎟️'], 'Hayvanlar': [30, '🐾'], 'Diğer': [200, '📌']
  };
  const fallbackHues = [215, 265, 160, 28, 330, 190, 45, 290, 140, 0];
  const diffLevel = { 'Kolay': 1, 'Orta': 2, 'Zor': 3 };
  const groups = [
    { key: 'todo', title: 'YAPILACAKLAR', icon: '🎯', match: s => s === 'pending' || s === 'rejected' },
    { key: 'review', title: 'İNCELEMEDE', icon: '⏳', match: s => s === 'review' },
    { key: 'done', title: 'TAMAMLANANLAR', icon: '🏆', match: s => s === 'done' }
  ];
  const cam = '<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.3-2h6l1.3 2h1.2A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.3"/></svg>';
  const check = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let n = 0;

  list.innerHTML = groups.map(g => {
    const items = all.filter(t => g.match(statusOf(t)));
    if (!items.length) return '';
    return `<div class="gt-group gt-group-${g.key}">
      <div class="gt-group-head"><span>${g.icon} ${g.title}</span><b>${items.length}</b></div>
      ${items.map(task => {
        const status = statusOf(task);
        const sub = subMap[task.id];
        const cat = normalizeCategoryLabel(task.category) || '';
        const [hue, catIcon] = catStyle[cat] || [fallbackHues[all.indexOf(task) % fallbackHues.length], '📌'];
        const diff = task.difficulty || 'Orta';
        const lvl = diffLevel[diff] || 2;
        const action = {
          pending:  `<span class="gt-do">${cam}Görevi yap</span>`,
          rejected: `<span class="gt-do gt-do-retry">${cam}Tekrar dene</span>`,
          review:   `<span class="tc-badge review gt-badge"><i></i>İnceleniyor</span>`,
          done:     `<span class="tc-badge done gt-badge gt-done-chip">${check}Tamamlandı</span>`
        }[status];
        const num = String(all.indexOf(task) + 1).padStart(2, '0');
        return `<div class="gt-card gt-${status}" onclick="openTaskModal(this)" data-status="${status}" data-task-id="${task.id}" data-sub-id="${sub?.id || ''}" style="--h:${hue};--d:${(n++) * 45}ms">
          <span class="gt-num" aria-hidden="true">${num}</span>
          <div class="gt-top">
            <div class="gt-emoji-wrap"><span class="tc-icon gt-emoji">${task.emoji || '📋'}</span></div>
            <div class="gt-head">
              <div class="gt-meta">
                ${cat ? `<span class="gt-cat">${catIcon} ${escHtml(cat)}</span>` : ''}
                <span class="gt-diff gt-diff-${lvl}" title="Zorluk: ${escHtml(diff)}"><i></i><i></i><i></i>${escHtml(diff)}</span>
              </div>
              <div class="tc-name gt-name">${escHtml(task.title || '')}</div>
            </div>
          </div>
          ${task.description ? `<div class="gt-desc">${escHtml(task.description)}</div>` : ''}
          ${status === 'rejected' ? '<div class="gt-note">Kanıtın onaylanmadı, yeni bir fotoğrafla tekrar gönderebilirsin.</div>' : ''}
          <div class="gt-bottom">
            <div class="gt-rewards">
              <span class="gt-coin"><span class="snake-score-coin">G</span>+${task.coin_reward || 0}</span>
              <span class="gt-xp">⚡ +${task.xp_reward || 0} XP</span>
            </div>
            ${action}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

function grSetCat(cat) {
  state._grCat = cat;
  if (state.rewards) renderRewards(state.rewards);
}

function renderRewards(rewards) {
  const list = document.getElementById('rewards-list');
  if (!list) return;
  const catsEl = document.getElementById('gr-cats');
  rewards = (rewards || []).filter(r => !REMOVED_PARTNERS.includes(r.partner_name));
  if (!rewards.length) {
    if (catsEl) catsEl.innerHTML = '';
    // Misafire ödüller veritabanından gelmez; "ödül yok" yerine girişe yönlendir
    list.innerHTML = isGuest()
      ? `<div class="gt-empty gt-empty-guest"><div class="gt-empty-ic">🔒</div><b>Ödülleri görmek için giriş yap</b><span>Coin topla, anlaşmalı işletmelerde ödüllerini kullan.</span>
          <button type="button" class="gt-empty-btn" onclick="openAuthScreen('login')">Giriş yap</button>
          <button type="button" class="gt-empty-link" onclick="openAuthScreen('register')">Hesabın yok mu? <b>Kayıt ol</b></button></div>`
      : `<div class="gt-empty"><div class="gt-empty-ic">🎁</div><b>Henüz ödül yok</b><span>Yeni ödüller yakında vitrinde.</span></div>`;
    return;
  }

  const coins = Number(state.user.coin || 0);
  document.querySelectorAll('.csb-val').forEach(el => { el.textContent = coins.toLocaleString('tr'); });
  const catEmoji = {
    'Cafe & Tatlı':'☕', 'Cafe':'☕', 'Tatlı':'🍰',
    'Yemek':'🍔', 'Eğlence & Oyun':'🎮', 'Spor':'⚽', 'Gym':'🏋️',
    'Giyim':'👕', 'Petshop':'🐾',
    'Eğitim':'📖', 'Kültür':'🏛️', 'Güzellik':'💅',
    'Berber':'💈', 'Kozmetik':'💄'
  };
  const catOf = r => normalizeCategoryLabel(r.category) || 'Diğer';

  // Sıradaki hedef: bakiyenin yetmediği en ucuz ödül
  const sorted = [...rewards].sort((a, b) => a.coin_cost - b.coin_cost);
  const unlockedCount = sorted.filter(r => coins >= r.coin_cost).length;
  const next = sorted.find(r => coins < r.coin_cost);
  const label = document.getElementById('gr-goal-label');
  const left = document.getElementById('gr-goal-left');
  const fill = document.getElementById('gr-goal-fill');
  if (label && left && fill) {
    if (next) {
      label.innerHTML = `Sıradaki hedef: <b>${escHtml(next.name)}</b>`;
      left.textContent = `${(next.coin_cost - coins).toLocaleString('tr')} coin kaldı`;
      fill.style.width = Math.min(100, Math.round(coins / next.coin_cost * 100)) + '%';
    } else {
      label.innerHTML = 'Tüm ödüllerin kilidi açık! 🎉';
      left.textContent = '';
      fill.style.width = '100%';
    }
  }

  // Kategori çipleri
  const cats = [...new Set(rewards.map(catOf))];
  const active = cats.includes(state._grCat) ? state._grCat : 'Tümü';
  if (catsEl) {
    const chip = (cat, count, emoji) =>
      `<button type="button" class="gr-cat ${cat === active ? 'active' : ''}" onclick="grSetCat('${cat.replace(/'/g, "\\'")}')">${emoji} ${escHtml(cat)} <b>${count}</b></button>`;
    catsEl.innerHTML = chip('Tümü', rewards.length, '✨') +
      cats.map(c => chip(c, rewards.filter(r => catOf(r) === c).length, catEmoji[c] || '🎁')).join('');
  }

  const card = (r, i) => {
    const unlocked = coins >= r.coin_cost;
    const pct = Math.min(100, Math.round(coins / Math.max(1, r.coin_cost) * 100));
    const img = r.image_url || getPartnerLogo({ name: r.partner_name });
    const media = img
      ? `<img class="gr-logo" src="${escHtml(img)}" alt="" data-e="${escHtml(r.emoji || '🎁')}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'gr-emoji',textContent:this.dataset.e}))">`
      : `<span class="gr-emoji">${r.emoji || '🎁'}</span>`;
    return `<div class="gr-card ${unlocked ? 'unlocked' : 'locked'}" onclick="openRewardModal(this)" style="--d:${i * 45}ms"
        data-id="${r.id}" data-name="${escHtml(r.name || '')}" data-disc="${escHtml(r.description || '')}" data-cost="${r.coin_cost}" data-emoji="${escHtml(r.emoji || '🎁')}" data-partner="${escHtml(r.partner_name || '')}" data-img="${escHtml(img || '')}">
      <div class="gr-media">
        ${media}
        <span class="gr-tag">${catEmoji[catOf(r)] || '🎁'}</span>
        ${unlocked ? '<span class="gr-ready">HAZIR</span>' : '<span class="gr-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>'}
      </div>
      <div class="gr-body">
        ${r.partner_name ? `<span class="gr-partner">${escHtml(r.partner_name)}</span>` : ''}
        <div class="gr-name">${escHtml(r.name || '')}</div>
        ${r.description ? `<div class="gr-disc">${escHtml(r.description)}</div>` : ''}
      </div>
      <div class="gr-foot">
        <span class="gr-cost"><span class="snake-score-coin">G</span>${Number(r.coin_cost).toLocaleString('tr')}</span>
        ${unlocked
          ? '<span class="gr-use">Kullan</span>'
          : `<span class="gr-need"><i style="width:${pct}%"></i></span>`}
      </div>
    </div>`;
  };

  let i = 0;
  const shown = active === 'Tümü' ? cats : [active];
  list.innerHTML = shown.map(cat => {
    const items = rewards.filter(r => catOf(r) === cat).sort((a, b) => a.coin_cost - b.coin_cost);
    return `<div class="gr-section">
      ${active === 'Tümü' ? `<div class="gt-group-head"><span>${catEmoji[cat] || '🎁'} ${escHtml(cat.toLocaleUpperCase('tr'))}</span><b>${items.length}</b></div>` : ''}
      <div class="gr-grid">${items.map(r => card(r, i++)).join('')}</div>
    </div>`;
  }).join('') + `<div class="gr-summary">${unlockedCount}/${rewards.length} ödülün kilidi açık</div>`;
}

/* ─── FRIENDS ─── */
const lvlEmoji = l => ({ 'Bronz':'🥉','Gümüş':'🥈','Altın':'🥇','Elmas':'💎' }[l] || '🥉');

// Panoya kopyala: güvenli bağlantıda (https) Clipboard API, değilse (örn. yerel ağdan
// http ile açıldığında) gizli bir textarea üzerinden execCommand("copy") kullanılır.
function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true, () => _legacyCopy(text));
  }
  return Promise.resolve(_legacyCopy(text));
}
function _legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

function copyFriendCode(el) {
  const code = state.user.friendCode;
  if (!code) { showToast('Arkadaşlık kodun henüz yüklenmedi'); return; }
  copyTextToClipboard(String(code)).then(ok => {
    showToast(ok ? 'Kod kopyalandı: ' + code : 'Kopyalama desteklenmiyor, kodun: ' + code);
  });
}

/* ─── ARKADAŞLAR ───
   Liste sezon XP'sine göre sıralanır (Zirve ve kademe ile aynı ölçü), sen de listede yer alırsın.
   Gelen istekler "friend_request" bildirimlerinden okunur; gönderilen istekler bu cihazda 7 gün
   hatırlanır (aynı kişiye tekrar tekrar istek gitmesin). Profil önizlemesi arkadaşlar ve kodla
   bulunan kişiler için açılır. */
const GFR_THEMES = {
  blue: ['#3c5ca4', '#1e2b5e'], green: ['#1a6b4a', '#0d3d2a'], purple: ['#6b3fa0', '#3d1b6e'],
  orange: ['#b45309', '#7c2d12'], pink: ['#be185d', '#831843'], cyan: ['#0e7490', '#164e63'],
};
const GFR_SENT_TTL = 7 * 86400000;

function _friendName(p) { return (p && (p.full_name || p.username)) || 'Genco üyesi'; }
function _friendAvatar(photo, name, frame = '', size = 'sm') {
  const initial = escHtml((String(name || '?').trim()[0] || '?').toUpperCase());
  const av = photo
    ? `<span class="gfr-av" style="background-image:url('${escHtml(photo)}')"></span>`
    : `<span class="gfr-av">${initial}</span>`;
  return frame ? `<span class="lf lf-${size} ${levelFrameClass(frame)}">${av}</span>` : av;
}
// Sezon XP'si, ömür boyu XP, kademe ve çerçeve (profil satırı için)
function _friendStats(p) {
  const life = Number(p?.user_stats?.xp) || 0;
  const xp = seasonXpOf(life, p?.equipped_cosmetics);
  return { life, xp, level: xpToLevel(xp), frame: resolveLevelFrame(p?.equipped_cosmetics, life) };
}
function _meAsFriend() {
  const u = state.user;
  return {
    id: u.id, full_name: u.name, username: u.username, emoji_status: u.emojiStatus, profile_photo_url: u.profilePhoto,
    equipped_cosmetics: u.cosmetics, user_stats: { xp: u.xp, tasks_completed: u.tasksCompleted, streak: u.streak }, isMe: true,
  };
}

function _gfrSentMap() {
  try { return JSON.parse(localStorage.getItem(`genco_fr_sent_${state.user.id}`)) || {}; } catch { return {}; }
}
function _gfrIsPending(id) { const t = _gfrSentMap()[id]; return !!t && Date.now() - t < GFR_SENT_TTL; }
function _gfrMarkSent(id) {
  const m = _gfrSentMap();
  m[id] = Date.now();
  Object.keys(m).forEach(k => { if (Date.now() - m[k] > GFR_SENT_TTL) delete m[k]; });
  try { localStorage.setItem(`genco_fr_sent_${state.user.id}`, JSON.stringify(m)); } catch {}
}
function _gfrIsFriend(id) { return (state.friends || []).some(f => f.id === id); }

function renderFriendCodeDigits() {
  const box = document.getElementById('gf-code-digits');
  const code = String(state.user.friendCode || '');
  const hidden = document.getElementById('my-friend-code-display');
  if (hidden) hidden.textContent = code || '——';
  if (!box) return;
  const digits = code ? code.split('') : Array(6).fill('–');
  box.innerHTML = digits.map(d => `<span>${escHtml(d)}</span>`).join('');
}

function shareFriendCode() {
  const code = state.user.friendCode;
  if (!code) { showToast('Arkadaşlık kodun henüz yüklenmedi'); return; }
  const text = `Genco'da beni arkadaş olarak ekle! Arkadaşlık kodum: ${code}`;
  if (navigator.share && window.isSecureContext) {
    navigator.share({ title: 'Genco arkadaşlık kodum', text }).catch(err => {
      if (err && err.name !== 'AbortError') _shareFallback(text);
    });
  } else {
    _shareFallback(text);
  }
}
// Paylaşım menüsü yoksa: mesajı kopyala ve WhatsApp paylaşımını aç
function _shareFallback(text) {
  copyTextToClipboard(text).then(ok => {
    if (ok) showToast('Davet mesajı kopyalandı');
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
}

function gfrCodeInput() {
  const v = document.getElementById('friend-code-input')?.value || '';
  const btn = document.getElementById('gfr-search-btn');
  if (btn) btn.disabled = v.length !== 6;
  if (!v) { const r = document.getElementById('friend-search-result'); if (r) r.innerHTML = ''; }
}

async function loadFriendsPage() {
  if (!state.user?.id) return;
  renderFriendCodeDigits();
  const list = document.getElementById('friends-list');
  if (!list) return;
  const first = !state.friends;
  if (first) list.innerHTML = `<div class="gfr-skel">${'<div class="gfr-skel-row"><i></i><span><b></b><em></em></span></div>'.repeat(3)}</div>`;
  const [friendsRes, reqRes] = await Promise.allSettled([sbGetFriends(state.user.id), _gfrLoadRequests()]);
  if (friendsRes.status === 'fulfilled') {
    state.friends = friendsRes.value || [];
    renderFriendsList();
  } else if (first) {
    console.warn('Arkadaşlar yüklenemedi:', friendsRes.reason);
    list.innerHTML = `<div class="gfr-empty"><span>⚠️</span><b>Arkadaşlar yüklenemedi</b><small>Bağlantını kontrol edip tekrar dene.</small><button type="button" class="gfr-btn gfr-btn-sm" onclick="state.friends=null;loadFriendsPage()">Tekrar dene</button></div>`;
  }
  if (reqRes.status === 'fulfilled') renderFriendRequests();
}

// Sıralama: arkadaşlar + sen, sezon XP'si büyükten küçüğe
function _gfrRanking() {
  const rows = [...(state.friends || []), _meAsFriend()].map(p => ({ p, ...(_friendStats(p)) }));
  rows.sort((a, b) => b.xp - a.xp || b.life - a.life);
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

function renderFriendsList() {
  const list = document.getElementById('friends-list');
  if (!list) return;
  const friends = state.friends || [];
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('friends-count', friends.length);
  const filterBox = document.getElementById('gfr-filter');
  if (filterBox) filterBox.hidden = friends.length < 6;

  // Hero'daki avatar yığını (ilk 4 arkadaş)
  const stack = document.getElementById('gfr-stack');
  if (stack) {
    stack.innerHTML = friends.slice(0, 4).map(f => _friendAvatar(f.profile_photo_url, _friendName(f))).join('')
      + (friends.length > 4 ? `<span class="gfr-av gfr-av-more">+${friends.length - 4}</span>` : '')
      + (friends.length ? '' : '<span class="gfr-av gfr-av-more">👋</span>');
  }

  if (!friends.length) {
    list.innerHTML = `<div class="gfr-empty">
      <span>👋</span><b>Henüz arkadaşın yok</b>
      <small>Kodunu paylaş ya da bir arkadaşının kodunu yukarıya gir. Arkadaşlarınla sezonda kimin önde olduğunu burada görürsün.</small>
      <button type="button" class="gfr-btn gfr-btn-sm" onclick="shareFriendCode()">Kodunu paylaş</button></div>`;
    return;
  }

  const q = (document.getElementById('gfr-filter-input')?.value || '').trim().toLocaleLowerCase('tr');
  let rows = _gfrRanking();
  if (q) rows = rows.filter(r => _friendName(r.p).toLocaleLowerCase('tr').includes(q) || String(r.p.username || '').toLocaleLowerCase('tr').includes(q));
  if (!rows.length) { list.innerHTML = `<div class="gfr-empty gfr-empty-sm"><small>“${escHtml(q)}” ile eşleşen arkadaş yok.</small></div>`; return; }

  const medal = { 1: '🥇', 2: '🥈', 3: '🥉' };
  list.innerHTML = rows.map(r => {
    const p = r.p;
    const name = _friendName(p);
    const title = badgeTitleHTML(p.equipped_cosmetics?.badge_title, p.equipped_cosmetics);
    const action = p.isMe ? `goPage('profile')` : `openFriendProfile('${escHtml(p.id)}')`;
    return `<button type="button" class="gfr-row${p.isMe ? ' is-me' : ''}" onclick="${action}">
      <span class="gfr-rank${r.rank <= 3 ? ' is-top' : ''}">${medal[r.rank] || r.rank}</span>
      ${_friendAvatar(p.profile_photo_url, name, r.frame)}
      <span class="gfr-info">
        <b>${escHtml(name)}${p.emoji_status ? ` <i class="gfr-emo">${escHtml(p.emoji_status)}</i>` : ''}${p.isMe ? ' <i class="gfr-me">Sen</i>' : ''}</b>
        <small>${levelEmoji(r.level)} ${escHtml(r.level)}${p.username ? ` · @${escHtml(p.username)}` : ''}</small>
        ${title ? `<span class="gfr-title">${title}</span>` : ''}
      </span>
      <span class="gfr-xp"><b>${r.xp.toLocaleString('tr')}</b><small>sezon XP</small></span>
    </button>`;
  }).join('');
}

/* ─── Gelen istekler ─── */
async function _gfrLoadRequests() {
  const notifs = await sbGetNotifications(state.user.id);
  const seen = new Set();
  const reqs = [];
  (notifs || []).forEach(n => {
    if (n.type !== 'friend_request' || n.is_read) return;
    let data = null;
    try { data = JSON.parse(n.message); } catch { return; }
    const rid = data?.requesterId;
    if (!rid || seen.has(rid) || rid === state.user.id) return;
    seen.add(rid);
    reqs.push({ notifId: n.id, requesterId: rid, name: data.requesterName, at: n.created_at });
  });
  const profs = reqs.length ? await sbGetBasicProfiles(reqs.map(r => r.requesterId)).catch(() => []) : [];
  const byId = Object.fromEntries(profs.map(p => [p.id, p]));
  state.friendReqs = reqs.map(r => ({ ...r, profile: byId[r.requesterId] || null }));
  return state.friendReqs;
}

function renderFriendRequests() {
  const box = document.getElementById('gfr-requests');
  const list = document.getElementById('gfr-req-list');
  if (!box || !list) return;
  // Zaten arkadaş olunan kişilerden kalan istekleri gösterme
  const reqs = (state.friendReqs || []).filter(r => !_gfrIsFriend(r.requesterId));
  box.hidden = !reqs.length;
  const cnt = document.getElementById('gfr-req-count');
  if (cnt) cnt.textContent = reqs.length;
  list.innerHTML = reqs.map(r => {
    const p = r.profile || {};
    const name = _friendName(p) === 'Genco üyesi' && r.name ? r.name : _friendName(p);
    return `<div class="gfr-req">
      ${_friendAvatar(p.profile_photo_url, name)}
      <span class="gfr-info"><b>${escHtml(name)}</b><small>${p.username ? `@${escHtml(p.username)} · ` : ''}${escHtml(timeAgo(r.at))}</small></span>
      <span class="gfr-req-actions">
        <button type="button" class="gfr-req-btn is-yes" onclick="gfrRespond(true,'${escHtml(r.requesterId)}','${escHtml(r.notifId)}',this)" aria-label="Kabul et"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
        <button type="button" class="gfr-req-btn is-no" onclick="gfrRespond(false,'${escHtml(r.requesterId)}','${escHtml(r.notifId)}',this)" aria-label="Reddet"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </span>
    </div>`;
  }).join('');
}

async function gfrRespond(accept, requesterId, notifId, btn) {
  const card = btn?.closest('.gfr-req');
  card?.querySelectorAll('button').forEach(b => { b.disabled = true; });
  card?.classList.add('is-busy');
  try {
    if (accept && !(await sbCheckFriendship(state.user.id, requesterId))) await sbAddFriend(state.user.id, requesterId);
    await sbMarkNotifRead(notifId);
    const myName = state.user.name || state.user.username || 'Kullanıcı';
    await sbAddNotification(requesterId,
      accept ? 'Arkadaşlık İsteği Kabul Edildi! 🎉' : 'Arkadaşlık İsteği',
      accept ? `${myName} arkadaşlık isteğini kabul etti. Artık arkadaşsınız!` : `${myName} arkadaşlık isteğini reddetti.`,
      accept ? 'friend_accepted' : 'friend_rejected').catch(() => {});
    showToast(accept ? 'Artık arkadaşsınız! 🎉' : 'İstek reddedildi');
    state.friendReqs = (state.friendReqs || []).filter(r => r.notifId !== notifId);
    state.notifs = null; // bildirim sayfası bir sonraki açılışta tazelensin
    if (typeof updateNotifDot === 'function') updateNotifDot();
    await loadFriendsPage();
    if (document.getElementById('modal-friend-profile')?.classList.contains('open')) openFriendProfile(requesterId);
  } catch (e) {
    console.error('Arkadaşlık isteği yanıtlanamadı:', e);
    showToast('İşlem başarısız, tekrar dene');
    card?.querySelectorAll('button').forEach(b => { b.disabled = false; });
    card?.classList.remove('is-busy');
  }
}

/* ─── Kodla arama ve istek gönderme ─── */
function _gfrAddButton(id, cls = '') {
  if (_gfrIsFriend(id)) return `<span class="gfr-tag is-friend ${cls}">✓ Arkadaşsınız</span>`;
  const incoming = (state.friendReqs || []).find(r => r.requesterId === id);
  if (incoming) return `<button type="button" class="gfr-btn gfr-btn-sm ${cls}" data-add-id="${escHtml(id)}" onclick="gfrRespond(true,'${escHtml(id)}','${escHtml(incoming.notifId)}',this)">İsteği kabul et</button>`;
  if (_gfrIsPending(id)) return `<span class="gfr-tag ${cls}" data-add-id="${escHtml(id)}">📨 İstek gönderildi</span>`;
  return `<button type="button" class="gfr-btn gfr-btn-sm ${cls}" data-add-id="${escHtml(id)}" onclick="addFriend('${escHtml(id)}', this)">+ Arkadaş ekle</button>`;
}

async function searchFriendByCode() {
  const input = document.getElementById('friend-code-input');
  const code = (input?.value || '').trim();
  const result = document.getElementById('friend-search-result');
  if (!result) return;
  if (!/^\d{6}$/.test(code)) { showToast('6 haneli kodu eksiksiz gir'); return; }
  if (code === String(state.user.friendCode || '')) { result.innerHTML = `<div class="gfr-result is-muted">Bu senin kendi kodun 🙂</div>`; return; }

  const btn = document.getElementById('gfr-search-btn');
  if (btn) btn.disabled = true;
  result.innerHTML = `<div class="gfr-result is-muted"><span class="gfr-spin"></span>Aranıyor…</div>`;
  try {
    let user;
    try { user = await sbFindUserByCode(code); }
    catch (e) {
      if (e?.code === 'PGRST116') { result.innerHTML = `<div class="gfr-result is-muted">Bu koda ait kullanıcı bulunamadı. Kodu kontrol et.</div>`; return; }
      throw e;
    }
    state.friendProfiles = { ...(state.friendProfiles || {}), [user.id]: user };
    const s = _friendStats(user);
    const name = _friendName(user);
    const title = badgeTitleHTML(user.equipped_cosmetics?.badge_title, user.equipped_cosmetics);
    result.innerHTML = `<div class="gfr-result">
      <button type="button" class="gfr-result-main" onclick="openFriendProfile('${escHtml(user.id)}')">
        ${_friendAvatar(user.profile_photo_url, name, s.frame, 'md')}
        <span class="gfr-info"><b>${escHtml(name)}${user.emoji_status ? ` <i class="gfr-emo">${escHtml(user.emoji_status)}</i>` : ''}</b>
          <small>${levelEmoji(s.level)} ${escHtml(s.level)}${user.username ? ` · @${escHtml(user.username)}` : ''}</small>
          ${title ? `<span class="gfr-title">${title}</span>` : ''}${showcaseMiniHTML(user.equipped_cosmetics)}</span>
      </button>
      <div class="gfr-result-actions">
        <button type="button" class="gfr-btn gfr-btn-ghost gfr-btn-sm" onclick="openFriendProfile('${escHtml(user.id)}')">Profili gör</button>
        ${_gfrAddButton(user.id)}
      </div>
    </div>`;
  } catch (e) {
    console.warn('Arkadaş araması başarısız:', e);
    result.innerHTML = `<div class="gfr-result is-muted">Arama yapılamadı, bağlantını kontrol edip tekrar dene.</div>`;
  } finally {
    if (btn) btn.disabled = (input?.value || '').length !== 6;
  }
}

async function addFriend(friendId, btn) {
  if (!state.user?.id || friendId === state.user.id) return;
  if (_gfrIsFriend(friendId)) { showToast('Zaten arkadaşsınız'); return; }
  if (_gfrIsPending(friendId)) { showToast('Bu kişiye zaten istek gönderdin'); return; }
  const btns = [...document.querySelectorAll(`[data-add-id="${CSS.escape(friendId)}"]`)];
  if (btn && !btns.includes(btn)) btns.push(btn);
  btns.forEach(b => { b.disabled = true; b.textContent = 'Gönderiliyor…'; });
  try {
    // Sunucuda zaten arkadaşsak (başka cihazdan eklenmiş olabilir) istek atma
    if (await sbCheckFriendship(state.user.id, friendId)) {
      showToast('Zaten arkadaşsınız');
      await loadFriendsPage();
    } else {
      await sbSendFriendRequest(state.user.id, friendId);
      _gfrMarkSent(friendId);
      showToast('Arkadaşlık isteği gönderildi! 📨');
    }
    btns.forEach(b => { b.outerHTML = _gfrAddButton(friendId, b.classList.contains('fpv-btn') ? 'fpv-btn' : ''); });
  } catch (e) {
    console.error('İstek gönderilemedi:', e);
    showToast('İstek gönderilemedi, tekrar dene');
    btns.forEach(b => { b.disabled = false; b.textContent = '+ Arkadaş ekle'; });
  }
}

/* ─── Profil önizleme ─── */
function openFriendProfile(userId) {
  const p = (state.friends || []).find(x => x.id === userId) || state.friendProfiles?.[userId];
  const body = document.getElementById('fpv-body');
  if (!p || !body) { showToast('Profil bulunamadı'); return; }
  const isFriend = _gfrIsFriend(userId);
  const s = _friendStats(p);
  const name = _friendName(p);
  const cos = p.equipped_cosmetics || {};
  const [c1, c2] = GFR_THEMES[p.profile_theme] || GFR_THEMES.blue;
  const title = badgeTitleHTML(cos.badge_title, cos);

  // Kademe ilerlemesi (sezon XP'si)
  const ti = Math.max(0, LEVEL_THRESHOLDS.findIndex(t => t.name === s.level));
  const cur = LEVEL_THRESHOLDS[ti], next = LEVEL_THRESHOLDS[ti + 1];
  const pct = next ? Math.round((s.xp - cur.xp) / (next.xp - cur.xp) * 100) : 100;

  // Arkadaşlar arasındaki sıra ve seninle kıyas
  const ranking = isFriend ? _gfrRanking() : [];
  const rank = ranking.find(r => r.p.id === userId)?.rank;
  const mine = _friendStats(_meAsFriend());
  const diff = s.xp - mine.xp;
  const vsMax = Math.max(1, s.xp, mine.xp);
  const vsText = diff > 0 ? `${escHtml(name.split(' ')[0])} seni <b>${diff.toLocaleString('tr')} XP</b> geçiyor`
    : diff < 0 ? `Onu <b>${(-diff).toLocaleString('tr')} XP</b> geçiyorsun 💪` : 'Başa baş gidiyorsunuz!';

  const badges = showcaseIds(cos).map(badgeById).filter(Boolean);
  const since = p.friend_since ? new Date(p.friend_since).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const stat = (v, l) => `<div class="fpv-stat"><b>${v}</b><small>${l}</small></div>`;

  body.innerHTML = `
    <div class="fpv-cover" style="--c1:${c1};--c2:${c2}">
      <span class="fpv-pill">${isFriend ? '👥 ARKADAŞIN' : '✨ GENCO ÜYESİ'}</span>
      ${rank ? `<span class="fpv-pill fpv-pill-rank">🏆 ${rank}. sırada</span>` : ''}
    </div>
    <div class="fpv-head">
      <div class="fpv-avwrap">
        ${_friendAvatar(p.profile_photo_url, name, s.frame, 'lg')}
        ${p.emoji_status ? `<span class="fpv-emo">${escHtml(p.emoji_status)}</span>` : ''}
      </div>
      <h3 class="fpv-name">${escHtml(name)}</h3>
      ${title ? `<div class="fpv-title">${title}</div>` : ''}
      <div class="fpv-sub">${p.username ? `@${escHtml(p.username)}` : ''}</div>
      <span class="fpv-tier" style="${typeof zvTierVars === 'function' ? zvTierVars(s.level) : ''}">${levelEmoji(s.level)} ${escHtml(s.level)}</span>
    </div>

    <div class="fpv-stats">
      ${stat(s.xp.toLocaleString('tr'), 'Sezon XP')}
      ${stat(s.life.toLocaleString('tr'), 'Toplam XP')}
      ${stat((Number(p.user_stats?.tasks_completed) || 0).toLocaleString('tr'), 'Görev')}
      ${stat(`${Number(p.user_stats?.streak) || 0}🔥`, 'Seri')}
    </div>

    <div class="fpv-card">
      <div class="fpv-card-head"><span>KADEME İLERLEMESİ</span><small>${next ? `${escHtml(next.name)} için ${(next.xp - s.xp).toLocaleString('tr')} XP` : 'En üst kademede 👑'}</small></div>
      <div class="fpv-bar"><i style="width:${Math.min(100, Math.max(3, pct))}%"></i></div>
      <div class="fpv-bar-ends"><small>${escHtml(cur.name)}</small><small>${next ? escHtml(next.name) : '—'}</small></div>
    </div>

    ${isFriend ? `<div class="fpv-card fpv-vs">
      <div class="fpv-card-head"><span>SEN VS ${escHtml(name.split(' ')[0]).toLocaleUpperCase('tr')}</span><small>Bu sezon</small></div>
      <div class="fpv-vs-row"><span>Sen</span><div class="fpv-vs-bar is-me"><i style="width:${Math.max(3, mine.xp / vsMax * 100)}%"></i></div><b>${mine.xp.toLocaleString('tr')}</b></div>
      <div class="fpv-vs-row"><span>${escHtml(name.split(' ')[0])}</span><div class="fpv-vs-bar"><i style="width:${Math.max(3, s.xp / vsMax * 100)}%"></i></div><b>${s.xp.toLocaleString('tr')}</b></div>
      <p class="fpv-vs-text">${vsText}</p>
    </div>` : ''}

    ${p.bio ? `<div class="fpv-card"><div class="fpv-card-head"><span>HAKKINDA</span></div><p class="fpv-bio">${escHtml(p.bio)}</p></div>` : ''}

    ${p.team ? `<div class="fpv-card fpv-team">${teamBadgeHTML(p.team, 34)}<div><span class="fpv-card-kicker">TUTTUĞU TAKIM</span><b>${escHtml(p.team)}</b></div></div>` : ''}

    <div class="fpv-card">
      <div class="fpv-card-head"><span>ROZET VİTRİNİ</span><small>${badges.length}/${typeof SHOWCASE_MAX !== 'undefined' ? SHOWCASE_MAX : 5}</small></div>
      ${badges.length
        ? `<div class="fpv-badges">${badges.map(b => `<div class="fpv-badge" style="--tc:${badgeTierColor(b)}"><span>${b.emoji}</span><small>${escHtml(b.name)}</small></div>`).join('')}</div>`
        : '<p class="fpv-none">Henüz vitrine rozet koymamış.</p>'}
    </div>

    <div class="fpv-meta">
      <button type="button" class="fpv-code" onclick="gfrCopyCode('${escHtml(p.friend_code || '')}')"><span>Arkadaşlık kodu</span><b>${escHtml(p.friend_code || '——')}</b><svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/></svg></button>
      ${since ? `<span class="fpv-since">🤝 ${escHtml(since)} tarihinden beri arkadaşsınız</span>` : ''}
    </div>

    <div class="fpv-actions">
      ${isFriend
        ? `<button type="button" class="fpv-btn fpv-btn-danger" onclick="removeFriendFromModal('${escHtml(userId)}')">Arkadaşlıktan çıkar</button>`
        : _gfrAddButton(userId, 'fpv-btn')}
    </div>`;
  openModal('modal-friend-profile');
  body.scrollTop = 0;
}

function gfrCopyCode(code) {
  if (!code) { showToast('Kod bulunamadı'); return; }
  copyTextToClipboard(String(code)).then(ok => showToast(ok ? 'Kod kopyalandı: ' + code : 'Kopyalanamadı, kod: ' + code));
}

function removeFriendFromModal(friendId) {
  const p = (state.friends || []).find(x => x.id === friendId);
  if (!p) return;
  showConfirm(`${_friendName(p)} arkadaş listenden çıkarılacak. İstersen daha sonra kodla tekrar ekleyebilirsin.`, 'Çıkar', async () => {
    try {
      await sbRemoveFriend(state.user.id, friendId);
      closeModal('modal-friend-profile');
      state.friends = (state.friends || []).filter(f => f.id !== friendId);
      renderFriendsList();
      showToast('Arkadaşlıktan çıkarıldı');
      loadFriendsPage();
    } catch (e) {
      console.error('Arkadaş çıkarılamadı:', e);
      showToast('İşlem başarısız, tekrar dene');
    }
  }, { title: 'Arkadaşlıktan çıkarılsın mı?', icon: 'trash' });
}

async function handleLogout() {
  await sbLogout();
  sessionStorage.removeItem('genco_active');
  sessionStorage.removeItem('genco_login_type');
  if (state._statsInterval)    { clearInterval(state._statsInterval);    state._statsInterval    = null; }
  if (state._notifDotInterval) { clearInterval(state._notifDotInterval); state._notifDotInterval = null; }
  if (state._greetingInterval) { clearInterval(state._greetingInterval); state._greetingInterval = null; }
  if (state._discoverInterval) { clearInterval(state._discoverInterval); state._discoverInterval = null; }
  if (state._timerInterval)    { clearInterval(state._timerInterval);    state._timerInterval    = null; }
  if (state._friendsInterval)  { clearInterval(state._friendsInterval);  state._friendsInterval  = null; }
  if (_admDailyTimerInterval) { clearInterval(_admDailyTimerInterval); _admDailyTimerInterval = null; }
  toggleGencoAi(false);
  setNotifBadge(0);
  // Tüm açık modalları kapat
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  // Camera overlay kapat
  const camOverlay = document.getElementById('camera-overlay');
  if (camOverlay) camOverlay.style.display = 'none';
  // Pin gate kapat
  const pinGate = document.getElementById('pin-gate');
  if (pinGate) pinGate.style.display = 'none';
  // Tüm accordion'ları kapat
  document.querySelectorAll('.team-grid-wrap.open').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.partners-list.open').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.events-list.open').forEach(el => el.classList.remove('open'));
  // State'i sıfırla
  state.user = { name:'', username:'', email:'', gender:'', team:'', coin:0, xp:0, rank:0,
    level:'Bronz I', streak:0, tasksCompleted:0, rewardsUsed:0, taskHistory:[], phone:'',
    bio:'', instagram:'', twitter:'', emojiStatus:'', profileTheme:'blue', profilePhoto:'',
    friendCode:'', id:null, role:'', gcoin:0, claimedRewards:[],
    cosmetics:{ frame:'', card_bg:'', title:'' } };
  state.tasks = null;
  state.submissions = null;
  state.rewards = null;
  state.friends = null;
  state.notifs = null;
  state.ntFilter = 'all';
  state.gpass = null;
  state._cache = {};
  state._dailyTasksDate = null;
  // Giriş alanlarını temizle
  const identifier = document.getElementById('login-identifier');
  const pass = document.getElementById('login-pass');
  if (identifier) identifier.value = '';
  if (pass) pass.value = '';
  // Çıkıştan sonra misafir olarak ana sayfaya dön
  launchApp();
}

function showSuspendedScreen() {
  const authSheet = document.querySelector('.auth-sheet');
  if (!authSheet) return;
  const panels = authSheet.querySelectorAll('.auth-panel');
  panels.forEach(p => p.classList.remove('active'));
  // Özel askıya alınma mesajı göster
  let suspPanel = document.getElementById('suspended-panel');
  if (!suspPanel) {
    suspPanel = document.createElement('div');
    suspPanel.id = 'suspended-panel';
    suspPanel.className = 'auth-panel active';
    suspPanel.innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:48px;margin-bottom:16px">🚫</div>
        <div style="font-size:20px;font-weight:700;color:var(--text1);margin-bottom:8px">Hesabınız Askıya Alındı</div>
        <div style="font-size:14px;color:var(--text3);line-height:1.6;margin-bottom:24px">
          Hesabınız yönetici tarafından askıya alınmıştır.<br>Detaylı bilgi için yönetici ile iletişime geçin.
        </div>
        <button class="btn-primary" onclick="document.getElementById('suspended-panel').remove(); showLogin()">Geri Dön</button>
      </div>`;
    authSheet.appendChild(suspPanel);
  } else {
    suspPanel.classList.add('active');
  }
}

function updateHomeGreeting() {
  const wordEl = document.getElementById('home-greeting-word');
  const emojiEl = document.getElementById('home-greeting-emoji');
  const authGreeting = document.getElementById('auth-time-greeting');

  const hour = new Date().getHours();
  let word, emoji;
  if (hour >= 7 && hour < 12) {
    word = 'Günaydın'; emoji = '☀️';
  } else if (hour >= 12 && hour < 17) {
    word = 'Tünaydın'; emoji = '🌤️';
  } else if (hour >= 17 && hour < 24) {
    word = 'İyi akşamlar'; emoji = '🌙';
  } else {
    word = 'İyi geceler'; emoji = '🌌';
  }
  if (wordEl) wordEl.textContent = word;
  if (emojiEl) emojiEl.textContent = emoji;
  const dateEl = document.getElementById('gh-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (authGreeting) authGreeting.textContent = `${word} ${emoji}`;
}

/* ─── HOME SEARCH ─── */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function openHomeSearch() {
  document.getElementById('home-search-wrap')?.classList.add('open');
  runHomeSearch(document.getElementById('home-search-input')?.value || '');
}

function closeHomeSearch() {
  document.getElementById('home-search-wrap')?.classList.remove('open');
}

/* ─── ANDROID GERİ TUŞU ───
   Android uygulaması geri tuşunda bunu çağırır. true → uygulama içinde
   geri gidildi; false → geri gidecek yer yok, uygulama kapanabilir. */
window.gencoHandleBack = function () {
  try {
    if (document.getElementById('snake-overlay')?.classList.contains('open')) { snakeQuit(); return true; }
    if (document.getElementById('gq-overlay')?.classList.contains('open')) { gqQuit(); return true; }
    if (document.getElementById('fb-overlay')?.classList.contains('open')) { fbQuit(); return true; }

    const openModals = [...document.querySelectorAll('.modal-overlay.open')];
    if (openModals.length) {
      const top = openModals[openModals.length - 1];
      if (top.id === 'modal-avatar-crop') cancelAvatarCrop();
      else closeModal(top.id);
      return true;
    }

    if (document.getElementById('genco-ai-panel')?.classList.contains('open')) { toggleGencoAi(false); return true; }
    if (document.getElementById('nav-secondary-menu')?.classList.contains('open')) { toggleBottomNav(false); return true; }
    if (document.getElementById('home-search-wrap')?.classList.contains('open')) { closeHomeSearch(); return true; }

    // Giriş ekranı: kayıt / şifremi unuttum panelinden giriş paneline dön
    const auth = document.getElementById('auth-screen');
    if (auth?.classList.contains('active')) {
      if (!document.getElementById('login-panel')?.classList.contains('active')) { showLogin(); gcSetSwitch?.('login'); return true; }
      if (document.getElementById('app-screen')?.classList.contains('active')) { closeAuthScreen(); return true; }
      return false;
    }

    // Uygulama içi: sayfanın kendi geri butonu varsa onu kullan, yoksa ana sayfaya dön
    const page = document.querySelector('#app-screen .page.active');
    const backBtn = page?.querySelector('.back-btn');
    if (backBtn) { backBtn.click(); return true; }
    const home = state.currentPage === 'admin' ? 'admin' : 'home';
    if (state.currentPage && state.currentPage !== home) { goPage(home); return true; }
  } catch (e) {
    console.error('Geri tuşu işlenemedi:', e);
  }
  return false;
};

document.addEventListener('click', (e) => {
  const wrap = document.getElementById('home-search-wrap');
  if (wrap && wrap.classList.contains('open') && !wrap.contains(e.target)) closeHomeSearch();
});

function goToFirstHomeSearchResult() {
  document.querySelector('#home-search-results .home-search-result')?.click();
}

function clearHomeSearch() {
  const input = document.getElementById('home-search-input');
  if (input) input.value = '';
  runHomeSearch('');
  input?.focus();
}

const HOME_SEARCH_CATEGORIES = [
  { icon: '📰', label: 'Gündem ve Haberler', page: 'events', keywords: ['gündem', 'haber', 'haberler', 'duyuru', 'duyurular', 'etkinlik', 'etkinlikler'] },
  { icon: '✓', label: 'Kazanımlar', page: 'tasks', keywords: ['kazanım', 'kazanımlar', 'görev', 'görevler'] },
  { icon: '◈', label: 'Zirve', page: 'leaderboard', keywords: ['zirve', 'liderlik', 'lider tablosu', 'sıralama'] },
  { icon: '⚽', label: 'Genco Lig', page: 'league', keywords: ['lig', 'genco lig', 'turnuva', 'turnuvalar', 'takım'] },
  { icon: '🤝', label: 'İşletmeler', page: 'partners', keywords: ['işletme', 'işletmeler', 'partner', 'partnerler', 'ödül', 'ödüller', 'indirim', 'fırsat'] },
  { icon: '♧', label: 'Arkadaşlarım', page: 'friends', keywords: ['arkadaş', 'arkadaşlar', 'arkadaşlarım'] },
  { icon: '⚙', label: 'Ayarlar', page: 'settings', keywords: ['ayar', 'ayarlar'] },
  { icon: '👤', label: 'Profilim', page: 'profile', keywords: ['profil', 'profilim', 'hesabım'] },
  { icon: '🔔', label: 'Bildirimler', page: 'notifications', keywords: ['bildirim', 'bildirimler'] },
];

function runHomeSearch(query) {
  const results = document.getElementById('home-search-results');
  const clearBtn = document.getElementById('home-search-clear-btn');
  if (!results) return;
  const q = (query || '').trim().toLowerCase();
  if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';

  if (!q) {
    results.innerHTML = `<div class="home-search-empty">Görev, etkinlik, partner veya kategori aramak için yazmaya başla…</div>`;
    return;
  }

  const categoryMatches = HOME_SEARCH_CATEGORIES
    .filter(c => c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q) || q.includes(k)))
    .map(c => ({ icon: c.icon, label: c.label, sub: 'Kategori', page: c.page }));

  const taskMatches = (state.tasks || [])
    .filter(t => (t.title || '').toLowerCase().includes(q))
    .map(t => ({ icon: t.emoji || '✅', label: t.title, sub: 'Görev', page: 'tasks' }));

  const eventMatches = (state.eventsData || [])
    .filter(e => (e.title || '').toLowerCase().includes(q))
    .map(e => ({ icon: '🎉', label: e.title, sub: 'Etkinlik', page: 'events' }));

  const partnerMatches = (state.partnersData || DEFAULT_PARTNERS)
    .filter(p => (p.name || '').toLowerCase().includes(q))
    .map(p => ({ icon: p.emoji || '🏪', label: p.name, sub: p.tag || 'Partner', page: 'partners' }));

  const all = [...categoryMatches, ...taskMatches, ...eventMatches, ...partnerMatches];

  if (!all.length) {
    results.innerHTML = `<div class="home-search-empty">"${escapeHtml(query.trim())}" için sonuç bulunamadı</div>`;
    return;
  }

  results.innerHTML = all.map((r, i) => `
    <button type="button" class="home-search-result" data-idx="${i}">
      <span class="home-search-result-icon">${r.icon}</span>
      <span class="home-search-result-copy"><strong>${escapeHtml(r.label)}</strong><span>${escapeHtml(r.sub)}</span></span>
      <span class="home-search-result-arrow">›</span>
    </button>
  `).join('');

  results.querySelectorAll('.home-search-result').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      document.getElementById('home-search-input')?.blur();
      closeHomeSearch();
      goPage(all[i].page);
    });
  });
}

function switchDiscoverFilter(btn) {
  document.querySelectorAll('.discover-filter').forEach(filter => filter.classList.remove('active'));
  btn.classList.add('active');
  showToast(`${btn.textContent.trim()} akışı seçildi`);
}

/* ─── TOP BAR ─── */
function initTopBar() {
  if (isGuest()) {
    document.getElementById('topbar-name').textContent = 'Giriş yap';
    document.getElementById('topbar-level').textContent = 'Misafir';
    // Çıkıştan sonra önceki hesabın fotoğrafı/rengi avatarlarda kalmasın
    ['topbar-avatar', 'discover-share-avatar'].forEach(id => {
      const av = document.getElementById(id);
      if (!av) return;
      ['background', 'background-image', 'background-size', 'background-position'].forEach(p => av.style.removeProperty(p));
      av.textContent = '👤';
    });
    updateTopbarLevel();
    const heroName = document.getElementById('hero-name');
    if (heroName) heroName.textContent = '';
    updateHomeGreeting();
    return;
  }
  const { name, username, coin, xp, level, email, team } = state.user;
  const visibleName = username || name;
  const displayName = state.beta ? visibleName : (visibleName.split(' ')[0] + ' ' + (visibleName.split(' ')[1]?.[0] || '') + '.');
  document.getElementById('topbar-name').textContent  = displayName;
  document.getElementById('topbar-level').textContent = level;
  updateTopbarLevel();
  document.getElementById('topbar-avatar').textContent = (visibleName || 'U')[0].toUpperCase();
  const discoverAvatar = document.getElementById('discover-share-avatar');
  if (discoverAvatar) {
    if (state.user.profilePhoto) {
      discoverAvatar.style.backgroundImage = `url(${state.user.profilePhoto})`;
      discoverAvatar.textContent = '';
    } else {
      discoverAvatar.style.backgroundImage = '';
      discoverAvatar.textContent = (visibleName || 'U')[0].toUpperCase();
    }
  }
  updateHomeGreeting();

  document.getElementById('hero-name').textContent = (name.split(' ')[0] || visibleName || '').toString();

  const teamPill = document.getElementById('profile-team-pill');
  const profileTeamName = document.getElementById('profile-team-name');
  const profileTeamLogo = document.getElementById('profile-team-logo');
  if (teamPill) teamPill.style.display = team ? 'inline-flex' : 'none';
  if (profileTeamName) profileTeamName.textContent = team || '';
  if (profileTeamLogo) {
    const d = teamData[team];
    if (d) {
      profileTeamLogo.innerHTML = teamBadgeHTML(team, 22);
    } else {
      profileTeamLogo.innerHTML = '';
    }
  }

  const lbUserName = document.getElementById('lb-my-name');
  if (lbUserName) lbUserName.innerHTML = visibleName + ' &nbsp;<span class="lb-me-tag">Sen</span>';

  updateProfileDisplay();
}
function levelEmoji(l) {
  const map = { Bronz:'🥉', Gümüş:'🥈', Altın:'🥇', Platin:'🔷', Elmas:'💎', Legend:'🌟' };
  return map[levelBase(l)] || '⚡';
}
function xpToLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) return LEVEL_THRESHOLDS[i].name;
  }
  return LEVEL_THRESHOLDS[0].name;
}
function teamLogoFor(team) {
  return teamData[team]?.abbr || '⚽';
}

// Takım logosu; görsel yüklenemezse renkli kısaltma rozeti görünür. size=0 → boyutu CSS belirler
function teamBadgeHTML(team, size = 32) {
  const d = teamData[team];
  if (!d) return `<span style="font-size:${(size || 32) * 0.6}px">⚽</span>`;
  const dim = size ? `width:${size}px;height:${size}px;font-size:${Math.max(7, Math.round(size * 0.3))}px;` : '';
  const img = d.logo
    ? `<img src="${d.logo}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.remove('has-logo');this.remove()">`
    : '';
  return `<span class="team-badge-icon${d.logo ? ' has-logo' : ''}" style="${dim}background:${d.bg};color:${d.fg}">${d.abbr}${img}</span>`;
}

function buildTeamGrid() {
  const grid = document.getElementById('team-grid');
  if (!grid) return;
  const current = state.user.team || '';
  grid.innerHTML = '';
  Object.keys(teamData).forEach(name => {
    const d = teamData[name];
    const btn = document.createElement('button');
    btn.className = 'team-grid-btn' + (name === current ? ' active' : '');
    btn.dataset.team = name;
    btn.innerHTML = `
      ${teamBadgeHTML(name, 0)}
      <span class="tgb-name">${name}</span>`;
    btn.addEventListener('click', () => selectTeam(btn, name));
    grid.appendChild(btn);
  });
  updateTeamPreview();
}

function selectTeam(btn, name) {
  document.querySelectorAll('.team-grid-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.user.team = name;
  updateTeamPreview();
}

function updateTeamPreview() {
  const preview = document.getElementById('team-selected-preview');
  const removeBtn = document.getElementById('team-remove-btn');
  if (!preview) return;
  const team = state.user.team;
  const d = teamData[team];
  if (team && d) {
    preview.innerHTML = teamBadgeHTML(team, 20) + ' ' + team;
    if (removeBtn) removeBtn.style.display = 'inline-flex';
  } else {
    preview.textContent = 'Seçilmedi';
    if (removeBtn) removeBtn.style.display = 'none';
  }
  peRefresh();
}

function clearSelectedTeam() {
  state.user.team = '';
  document.querySelectorAll('.team-grid-btn').forEach(b => b.classList.remove('active'));
  updateTeamPreview();
}

function toggleTeamGrid() {
  const wrap  = document.getElementById('team-grid-wrap');
  const arrow = document.getElementById('accordion-arrow');
  const open  = wrap.classList.toggle('open');
  arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';
  if (open) buildTeamGrid();
}
function formatXP(n) {
  return n >= 1000 ? (n/1000).toFixed(1).replace('.0','') + 'K' : n;
}
// Üst bar için kısa sayı: 9.850 → "9.850", 100.879 → "100.9K", 2.400.000 → "2.4M"
function formatCompact(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString('tr-TR');
}

// Üst bar: seviye rengi (data-tier) ve avatar halkasında sonraki seviyeye ilerleme
function updateTopbarLevel() {
  const bar = document.getElementById('topbar');
  const ring = document.getElementById('tb2-ring');
  if (!bar) return;
  const lf = document.getElementById('topbar-lf');
  if (isGuest()) {
    bar.dataset.tier = '';
    ring?.style.setProperty('--p', 0);
    applyLevelFrame(lf, '');
    bar.classList.remove('has-frame');
    return;
  }
  // Profilde takılı seviye çerçevesi üst barda da görünsün; takılıyken ilerleme halkası gizlenir
  const frame = resolveLevelFrame(state.user.cosmetics, state.user.xp);
  applyLevelFrame(lf, frame);
  bar.classList.toggle('has-frame', !!frame);
  const xp = mySeasonXp();
  const level = state.user.level || xpToLevel(xp);
  const i = Math.max(0, levelRank(level));
  const cur = LEVEL_THRESHOLDS[i]?.xp ?? 0;
  const next = LEVEL_THRESHOLDS[i + 1]?.xp;
  const p = next ? Math.min(1, Math.max(0, (xp - cur) / (next - cur))) : 1;
  bar.dataset.tier = normalizePartnerKey(levelBase(level)).replace(/ş/g, 's'); // bronz, gumus, altin, platin, elmas, legend
  ring?.style.setProperty('--p', p.toFixed(3));
  const me = bar.querySelector('.tb2-me');
  if (me) me.title = next ? `${level} · sonraki seviyeye ${(next - xp).toLocaleString('tr-TR')} XP` : `${level} · en yüksek seviye`;
}

/* ─── PROFILE THEMES ─── */
const profileThemes = {
  blue:   'linear-gradient(135deg,#3c5ca4,#1e2b5e)',
  green:  'linear-gradient(135deg,#1a6b4a,#0d3d2a)',
  purple: 'linear-gradient(135deg,#6b3fa0,#3d1b6e)',
  orange: 'linear-gradient(135deg,#b45309,#7c2d12)',
  pink:   'linear-gradient(135deg,#be185d,#831843)',
  cyan:   'linear-gradient(135deg,#0e7490,#164e63)'
};
const teamData = {
  'Galatasaray':     { abbr:'GS',  bg:'#E8251F', fg:'#F9C014', logo:'teams/galatasaray.png' },
  'Fenerbahçe':      { abbr:'FB',  bg:'#1B3A6B', fg:'#FBDD00', logo:'teams/fenerbahce.png' },
  'Beşiktaş':        { abbr:'BJK', bg:'#1a1a1a', fg:'#FFFFFF', logo:'teams/besiktas.png' },
  'Trabzonspor':     { abbr:'TS',  bg:'#921A1D', fg:'#7AB2D3', logo:'teams/trabzonspor.png' },
  'Başakşehir':      { abbr:'BŞH', bg:'#FF6B00', fg:'#FFFFFF', logo:'teams/basaksehir.png' },
  'Kasımpaşa':       { abbr:'KAS', bg:'#003B8E', fg:'#FFD700', logo:'teams/kasimpasa.png' },
  'Eyüpspor':        { abbr:'EYÜ', bg:'#0D5C3C', fg:'#FFFFFF', logo:'teams/eyupspor.png' },
  'Samsunspor':      { abbr:'SAM', bg:'#D9232B', fg:'#FFFFFF', logo:'teams/samsunspor.png' },
  'Göztepe':         { abbr:'GÖZ', bg:'#F76900', fg:'#FFD700', logo:'teams/goztepe.png' },
  'Çaykur Rizespor': { abbr:'RIZ', bg:'#1A6532', fg:'#FFFFFF', logo:'teams/caykur-rizespor.png' },
  'Konyaspor':       { abbr:'KON', bg:'#1D6B3E', fg:'#FFFFFF', logo:'teams/konyaspor.png' },
  'Kayserispor':     { abbr:'KAY', bg:'#E30613', fg:'#FFD700', logo:'teams/kayserispor.png' },
  'Gaziantep FK':    { abbr:'GFK', bg:'#E30613', fg:'#FFFFFF', logo:'teams/gaziantep-fk.png' },
  'Antalyaspor':     { abbr:'ANT', bg:'#8B0000', fg:'#FFFFFF', logo:'teams/antalyaspor.png' },
  'Alanyaspor':      { abbr:'ALA', bg:'#F0500A', fg:'#FFFFFF', logo:'teams/alanyaspor.png' },
  'Hatayspor':       { abbr:'HAT', bg:'#1B1B1B', fg:'#FFD700', logo:'teams/hatayspor.png' },
  'Adana Demirspor': { abbr:'ADS', bg:'#0099DC', fg:'#FFFFFF', logo:'teams/adana-demirspor.png' },
  'Sivasspor':       { abbr:'SIV', bg:'#D9232B', fg:'#FFD700', logo:'teams/sivasspor.png' },
  'Bodrum FK':       { abbr:'BDF', bg:'#0052A5', fg:'#FFFFFF', logo:'teams/bodrum-fk.png' },
  'Serikspor':       { abbr:'SER', bg:'#2E8B57', fg:'#FFFFFF', logo:'teams/serikspor.png' }
};

const igSVG = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="flex-shrink:0;display:block"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`;
const xSVG  = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="flex-shrink:0;display:block"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

const profileCovers = {
  blue:   'linear-gradient(145deg,#1a2b5e 0%,#2d4a8f 55%,#3c5ca4 100%)',
  green:  'linear-gradient(145deg,#061a10 0%,#0d3d2a 55%,#1a6b4a 100%)',
  purple: 'linear-gradient(145deg,#1a0a38 0%,#3d1b6e 55%,#6b3fa0 100%)',
  orange: 'linear-gradient(145deg,#2a0a00 0%,#7c2d12 55%,#b45309 100%)',
  pink:   'linear-gradient(145deg,#2a0518 0%,#831843 55%,#be185d 100%)',
  cyan:   'linear-gradient(145deg,#021520 0%,#164e63 55%,#0e7490 100%)'
};

/* ─── PROFILE DISPLAY ─── */
function updateProfileDisplay() {
  const u = state.user;
  const initial = (u.name || u.username || 'U')[0].toUpperCase();
  const theme = u.profileTheme || 'blue';

  // Profile page avatar
  const profileAv = document.getElementById('profile-avatar-display');
  if (profileAv) {
    if (u.profilePhoto) {
      profileAv.style.backgroundImage = `url(${u.profilePhoto})`;
      profileAv.style.backgroundSize  = 'cover';
      profileAv.style.backgroundPosition = 'center';
      profileAv.style.backgroundRepeat = 'no-repeat';
      profileAv.style.backgroundOrigin = 'border-box';
      profileAv.textContent = '';
    } else {
      profileAv.style.backgroundImage = '';
      profileAv.style.background = profileThemes[theme];
      profileAv.textContent = initial;
    }
  }

  // Topbar avatar
  const topbarAv = document.getElementById('topbar-avatar');
  if (topbarAv) {
    if (u.profilePhoto) {
      topbarAv.style.backgroundImage = `url(${u.profilePhoto})`;
      topbarAv.style.backgroundSize  = 'cover';
      topbarAv.style.backgroundPosition = 'center';
      topbarAv.textContent = '';
    } else {
      topbarAv.style.backgroundImage = '';
      topbarAv.style.background = profileThemes[theme];
      topbarAv.textContent = initial;
    }
  }

  // Discover share avatar
  const discoverAv = document.getElementById('discover-share-avatar');
  if (discoverAv) {
    if (u.profilePhoto) {
      discoverAv.style.backgroundImage = `url(${u.profilePhoto})`;
      discoverAv.textContent = '';
    } else {
      discoverAv.style.backgroundImage = '';
      discoverAv.textContent = initial;
    }
  }

  // Name, username, email
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('profile-name-display',     u.name || '');
  set('profile-username-display', '@' + (u.username || ''));
  const emailEl = document.getElementById('profile-email-display');
  if (emailEl) { emailEl.textContent = u.email || ''; emailEl.style.display = u.email ? '' : 'none'; }

  // Emoji status
  set('profile-status-display', u.emojiStatus || '');

  // Bio
  const bioEl = document.getElementById('profile-bio-display');
  if (bioEl) {
    bioEl.textContent  = u.bio || '';
    bioEl.style.display = u.bio ? 'block' : 'none';
  }

  // Social links
  const socialEl = document.getElementById('profile-social-display');
  if (socialEl) {
    socialEl.innerHTML = '';
    if (u.instagram) {
      const s = document.createElement('span');
      s.className = 'social-link ig-link';
      s.innerHTML = `${igSVG} @${u.instagram}`;
      socialEl.appendChild(s);
    }
    if (u.twitter) {
      const s = document.createElement('span');
      s.className = 'social-link x-link';
      s.innerHTML = `${xSVG} @${u.twitter}`;
      socialEl.appendChild(s);
    }
    socialEl.style.display = (u.instagram || u.twitter) ? 'flex' : 'none';
  }

  // Level badge
  const lvlBadge = document.getElementById('profile-level-badge');
  if (lvlBadge) lvlBadge.textContent = levelEmoji(u.level) + ' ' + u.level;

  // Profile stats
  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('stat-tasks',   u.tasksCompleted || 0);
  s('stat-rewards', u.rewardsUsed    || 0);
  s('stat-streak',  u.streak > 0 ? u.streak : '0');
  s('stat-rank',    u.rank   > 0 ? '#' + u.rank : '—');

  // XP progress bar
  const xp    = mySeasonXp();
  const rank  = levelRank(xpToLevel(xp));
  const curT  = LEVEL_THRESHOLDS[rank];
  const nextT = LEVEL_THRESHOLDS[rank + 1];
  if (nextT) {
    const pct = Math.min(100, Math.round(((xp - curT.xp) / (nextT.xp - curT.xp)) * 100));
    s('xp-next-label',    'Sonraki: ' + levelEmoji(nextT.name) + ' ' + nextT.name);
    s('xp-current-label', xp.toLocaleString('tr') + ' / ' + nextT.xp.toLocaleString('tr') + ' XP');
    const fill = document.getElementById('xp-fill-bar');
    if (fill) fill.style.width = pct + '%';
  } else {
    s('xp-next-label',    '🌟 Legend III — Zirvedesin!');
    s('xp-current-label', xp.toLocaleString('tr') + ' XP');
    const fill = document.getElementById('xp-fill-bar');
    if (fill) fill.style.width = '100%';
  }

  // Friend code
  const fcEl = document.getElementById('profile-friend-code');
  if (fcEl) fcEl.textContent = u.friendCode || '——';

}

/* ─── PROFILE EDIT FORM ─── */
// Düzenleme açılırken alınan kopya: kaydetmeden çıkılırsa anlık değişen alanlar (emoji, renk, takım, fotoğraf) geri alınır.
var _peSnap = null;
const PE_FIELDS = ['edit-name', 'edit-username', 'edit-phone', 'edit-bio', 'edit-instagram', 'edit-twitter'];

function openProfileEditor() {
  loadProfileEditForm();
  goPage('profile-edit');
}

function paintEditAvatar(el, photo, theme, initial) {
  if (!el) return;
  if (photo) {
    el.style.background = '';
    el.style.backgroundImage = `url(${photo})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.style.background = profileThemes[theme || 'blue'] || profileThemes.blue;
    el.textContent = initial;
  }
}

function loadProfileEditForm() {
  const u = state.user;

  _peSnap = {
    emojiStatus:  u.emojiStatus  || '',
    profileTheme: u.profileTheme || 'blue',
    team:         u.team         || '',
    profilePhoto: u.profilePhoto || '',
    fields: {
      'edit-name': u.name || '', 'edit-username': u.username || '',
      'edit-phone': u.phone || '', 'edit-bio': u.bio || '',
      'edit-instagram': u.instagram || '', 'edit-twitter': u.twitter || ''
    }
  };

  document.querySelectorAll('.emoji-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.emoji === (u.emojiStatus || ''));
  });

  Object.entries(_peSnap.fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  const emailEl = document.getElementById('edit-email');
  if (emailEl) emailEl.value = u.email || '';
  ['pe-username-err', 'pe-phone-err'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
  document.querySelectorAll('#page-profile-edit .pe-input.is-err').forEach(el => el.classList.remove('is-err'));
  updateBioCount();

  const wrap = document.getElementById('team-grid-wrap');
  const arrow = document.getElementById('accordion-arrow');
  if (wrap) wrap.classList.remove('open');
  if (arrow) arrow.style.transform = '';
  updateTeamPreview();

  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === (u.profileTheme || 'blue'));
  });

  const saveBtn = document.getElementById('pe-save-btn');
  if (saveBtn) { saveBtn.disabled = false; saveBtn.classList.remove('is-loading'); }
  peRefresh();
}

// Önizlemeyi ve "kaydedilmedi" durumunu güncelle
function peRefresh() {
  if (!_peSnap) return;
  const u = state.user;
  const val = id => document.getElementById(id)?.value.trim() || '';
  const name = val('edit-name') || u.name || '';
  const username = val('edit-username').replace(/^@+/, '') || u.username || '';

  paintEditAvatar(document.getElementById('edit-avatar-preview'), u.profilePhoto, u.profileTheme,
    (name || username || 'U')[0].toUpperCase());
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('pe-prev-name', name || 'Adın');
  set('pe-prev-user', '@' + (username || 'kullanici'));
  set('pe-prev-emoji', u.emojiStatus || '');
  const bioEl = document.getElementById('pe-prev-bio');
  if (bioEl) { const b = val('edit-bio'); bioEl.textContent = b; bioEl.hidden = !b; }
  const rm = document.getElementById('pe-photo-remove');
  if (rm) rm.hidden = !u.profilePhoto;

  const dirty = peIsDirty();
  document.getElementById('page-profile-edit')?.classList.toggle('pe-dirty', dirty);
  set('pe-dirty-lbl', dirty ? 'Kaydedilmemiş değişiklik var' : 'Her şey güncel');
}

function peIsDirty() {
  if (!_peSnap) return false;
  const u = state.user;
  if ((u.emojiStatus || '') !== _peSnap.emojiStatus) return true;
  if ((u.profileTheme || 'blue') !== _peSnap.profileTheme) return true;
  if ((u.team || '') !== _peSnap.team) return true;
  if ((u.profilePhoto || '') !== _peSnap.profilePhoto) return true;
  return PE_FIELDS.some(id => (document.getElementById(id)?.value || '').trim() !== String(_peSnap.fields[id]).trim());
}

// Kaydetmeden çıkış: anlık değişen alanları eski haline getir
function peDiscard() {
  if (!_peSnap) return;
  const u = state.user;
  const changed = peIsDirty();
  u.emojiStatus  = _peSnap.emojiStatus;
  u.profileTheme = _peSnap.profileTheme;
  u.team         = _peSnap.team;
  u.profilePhoto = _peSnap.profilePhoto;
  _peSnap = null;
  document.getElementById('page-profile-edit')?.classList.remove('pe-dirty');
  if (changed) { updateProfileDisplay(); initTopBar(); }
}

function peTryLeave(next) {
  const go = () => { peDiscard(); typeof next === 'function' ? next() : goPage('profile'); };
  if (!peIsDirty()) { go(); return; }
  showConfirm('Yaptığın değişiklikler kaybolacak.', 'Kaydetmeden çık', go,
    { title: 'Değişiklikler kaydedilmedi', icon: 'warn' });
}

function updateBioCount() {
  const bio = document.getElementById('edit-bio');
  const count = document.getElementById('bio-char-count');
  if (bio && count) count.textContent = bio.value.length;
  const bar = document.getElementById('pe-bio-bar');
  if (bio && bar) {
    const pct = Math.min(100, Math.round(bio.value.length / 150 * 100));
    bar.style.width = pct + '%';
    bar.classList.toggle('near', pct >= 85);
  }
}

function selectEmoji(btn) {
  document.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.user.emojiStatus = btn.dataset.emoji;
  peRefresh();
}

function selectProfileTheme(btn) {
  document.querySelectorAll('.theme-swatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.user.profileTheme = btn.dataset.theme;
  peRefresh();
}

function removeAvatarPhoto() {
  if (!state.user.profilePhoto) return;
  state.user.profilePhoto = '';
  peRefresh();
  showToast('Fotoğraf kaldırıldı, kaydetmeyi unutma');
}

function triggerAvatarUpload() {
  document.getElementById('avatar-input').click();
}

let _avatarCropper = null;

function handleAvatarUpload(input) {
  const file = input.files[0];
  input.value = ''; // aynı fotoğraf tekrar seçilebilsin
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const image = new Image();
    image.onload = () => {
      // Kırpma öncesi çok büyük fotoğrafları makul bir boyuta indir (performans için)
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      startAvatarCrop(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = () => showToast('Fotoğraf okunamadı');
    image.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function setAvatarPhoto(dataUrl) {
  state.user.profilePhoto = dataUrl;
  peRefresh();
}

function startAvatarCrop(src) {
  if (typeof Cropper === 'undefined') {
    // Kırpma kütüphanesi yüklenemedi — fotoğrafı kırpmadan kullan
    setAvatarPhoto(src);
    showToast('Kırpma aracı yüklenemedi, fotoğraf kırpılmadan eklendi');
    return;
  }
  const img = document.getElementById('avatar-crop-image');
  if (_avatarCropper) { _avatarCropper.destroy(); _avatarCropper = null; }
  openModal('modal-avatar-crop');
  img.onload = () => {
    try {
      _avatarCropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        background: false,
        responsive: true,
        guides: false,
        center: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    } catch (err) {
      console.error('Cropper başlatılamadı:', err);
      closeModal('modal-avatar-crop');
      setAvatarPhoto(src);
      showToast('Kırpma başlatılamadı, fotoğraf kırpılmadan eklendi');
    }
  };
  img.onerror = () => {
    closeModal('modal-avatar-crop');
    showToast('Fotoğraf yüklenemedi');
  };
  img.src = src;
}

function rotateAvatarCrop() {
  _avatarCropper?.rotate(90);
}

function cancelAvatarCrop() {
  closeModal('modal-avatar-crop');
  if (_avatarCropper) { _avatarCropper.destroy(); _avatarCropper = null; }
}

function applyAvatarCrop() {
  if (!_avatarCropper) return;
  let canvas;
  try {
    canvas = _avatarCropper.getCroppedCanvas({
      width: 512, height: 512,
      fillColor: '#fff',
      imageSmoothingQuality: 'high',
    });
  } catch (err) {
    console.error('Kırpma uygulanamadı:', err);
    showToast('Kırpma uygulanamadı, tekrar dene');
    return;
  }
  if (!canvas) { showToast('Kırpma uygulanamadı, tekrar dene'); return; }
  setAvatarPhoto(canvas.toDataURL('image/jpeg', 0.85));
  cancelAvatarCrop();
  showToast('Fotoğraf hazır, kaydetmeyi unutma');
}

function peFieldError(inputId, errId, msg) {
  const err = document.getElementById(errId);
  if (err) err.textContent = msg || '';
  document.getElementById(inputId)?.closest('.pe-input')?.classList.toggle('is-err', !!msg);
}

// "@ali", "instagram.com/ali/", "https://x.com/ali?s=1" → "ali"
function cleanSocialHandle(v) {
  return String(v || '').trim()
    .replace(/^https?:\/\//i, '').replace(/^(www\.)?(instagram\.com|twitter\.com|x\.com)\//i, '')
    .replace(/[/?#].*$/, '').replace(/^@+/, '').replace(/\s+/g, '');
}

async function saveProfileEdit() {
  const u = state.user;
  const saveBtn = document.getElementById('pe-save-btn');
  if (saveBtn?.disabled) return;
  const get = id => document.getElementById(id)?.value.trim() || '';

  const name      = get('edit-name').replace(/\s+/g, ' ');
  const username  = get('edit-username').replace(/^@+/, '');
  const phoneRaw  = get('edit-phone');
  const bio       = get('edit-bio').slice(0, 150);
  const instagram = cleanSocialHandle(get('edit-instagram'));
  const twitter   = cleanSocialHandle(get('edit-twitter'));

  peFieldError('edit-username', 'pe-username-err', '');
  peFieldError('edit-phone', 'pe-phone-err', '');

  if (!name || !validateName(name)) {
    showToast('Ad soyad geçersiz');
    document.getElementById('edit-name')?.focus();
    return;
  }

  const usernameChanged = username.toLowerCase() !== String(u.username || '').toLowerCase();
  if (usernameChanged) {
    const ures = validateUsername(username);
    if (ures !== true) {
      peFieldError('edit-username', 'pe-username-err', ures);
      document.getElementById('edit-username')?.focus();
      return;
    }
  }

  // Telefon yalnızca değiştirildiyse doğrulanır (eski kayıtlar kaydetmeyi engellemesin)
  let phone = phoneRaw;
  if (phoneRaw && phoneRaw !== String(u.phone || '').trim()) {
    const pres = validatePhone(phoneRaw);
    if (pres !== true) {
      peFieldError('edit-phone', 'pe-phone-err', pres);
      document.getElementById('edit-phone')?.focus();
      return;
    }
    phone = normalizePhone(phoneRaw);
  }

  if (saveBtn) { saveBtn.disabled = true; saveBtn.classList.add('is-loading'); }
  document.querySelector('#page-profile-edit .pe-top-save')?.setAttribute('disabled', '');

  try {
    if (usernameChanged) {
      const { data: taken } = await sb.from('profiles').select('id').eq('username', username).neq('id', u.id).limit(1);
      if (taken && taken.length) {
        peFieldError('edit-username', 'pe-username-err', 'Bu kullanıcı adı zaten alınmış');
        document.getElementById('edit-username')?.focus();
        return;
      }
    }

    await sbUpdateProfile(u.id, {
      full_name:         name,
      username:          username || u.username,
      phone,
      bio,
      instagram,
      twitter,
      team:              u.team         || '',
      emoji_status:      u.emojiStatus  || '',
      profile_theme:     u.profileTheme || 'blue',
      profile_photo_url: u.profilePhoto || ''
    });

    u.name      = name;
    if (username) u.username = username;
    u.phone     = phone;
    u.bio       = bio;
    u.instagram = instagram;
    u.twitter   = twitter;
    _peSnap = null;
    document.getElementById('page-profile-edit')?.classList.remove('pe-dirty');

    initTopBar();
    updateProfileDisplay();
    goPage('profile');
    showToast('Profil güncellendi! ✓');
  } catch (e) {
    console.error('saveProfileEdit DB error:', e);
    const dup = e?.code === '23505' || /duplicate|unique/i.test(e?.message || '');
    if (dup) peFieldError('edit-username', 'pe-username-err', 'Bu kullanıcı adı zaten alınmış');
    showToast(dup ? 'Bu kullanıcı adı zaten alınmış' : 'Bilgiler kaydedilemedi, internetini kontrol edip tekrar dene');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.classList.remove('is-loading'); }
    document.querySelector('#page-profile-edit .pe-top-save')?.removeAttribute('disabled');
  }
}

/* ─── HESAP VE GÜVENLİK (Ayarlar > Profil ve şifre) ─── */
function openAccountSettings() {
  loadAccountSettingsForm();
  goPage('account');
}

function loadAccountSettingsForm() {
  const u = state.user;
  const fields = {
    'acc-name': u.name, 'acc-username': u.username,
    'acc-email': u.email, 'acc-phone': u.phone
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  });

  ['acc-pass-current', 'acc-pass-new', 'acc-pass-confirm'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const errEl = document.getElementById('acc-pass-err');
  if (errEl) errEl.textContent = '';
}

async function saveAccountSettings() {
  const u = state.user;
  const get = id => document.getElementById(id)?.value.trim() || '';

  const name     = get('acc-name');
  const username = get('acc-username');
  const phone    = get('acc-phone');

  const passCurrent = document.getElementById('acc-pass-current')?.value || '';
  const passNew     = document.getElementById('acc-pass-new')?.value || '';
  const passConfirm = document.getElementById('acc-pass-confirm')?.value || '';
  const errEl       = document.getElementById('acc-pass-err');
  if (errEl) errEl.textContent = '';

  if (name && /\d/.test(name)) { showToast('Ad soyad geçersiz'); return; }

  if (passCurrent || passNew || passConfirm) {
    if (!passCurrent) { if (errEl) errEl.textContent = 'Mevcut şifrenizi girin'; return; }
    if (!passNew)     { if (errEl) errEl.textContent = 'Yeni şifrenizi girin'; return; }
    if (passNew !== passConfirm) { if (errEl) errEl.textContent = 'Yeni şifreler eşleşmiyor'; return; }
    const pres = validatePassword(passNew, username || u.username);
    if (pres !== true) { if (errEl) errEl.textContent = pres; return; }
  }

  const saveBtn = document.getElementById('acc-save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…'; }

  if (name)     u.name     = name;
  if (username) u.username = username;
  u.phone = phone;

  initTopBar();
  goPage('settings');
  showToast('Hesap bilgilerin güncellendi! ✓');

  try {
    await sbUpdateProfile(u.id, {
      full_name: u.name,
      username:  u.username,
      phone:     u.phone
    });

    if (passNew) {
      await sb.auth.updateUser({ password: passNew });
      ['acc-pass-current', 'acc-pass-new', 'acc-pass-confirm'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
    }
  } catch (e) {
    console.error('saveAccountSettings DB error:', e);
    showToast('Bilgiler kaydedilemedi, tekrar dene');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Değişiklikleri Kaydet'; }
  }
}

/* ─── NAVIGATION ─── */

function toggleProfilePage() {
  goPage(state.currentPage === 'profile' ? 'home' : 'profile');
}

function handleTopbarLeftPress(el) {
  el.classList.remove('tb-pressed');
  void el.offsetWidth; // restart animation even on rapid re-taps
  el.classList.add('tb-pressed');
  setTimeout(() => el.classList.remove('tb-pressed'), 600);
  toggleProfilePage();
}

function goPage(page) {
  if (page === 'rewards') page = 'tasks';
  if (isGuest() && !GUEST_PAGES.has(page)) {
    toggleBottomNav(false);
    openAuthScreen('login');
    return;
  }
  toggleBottomNav(false);
  // Profil düzenlemeden kaydetmeden ayrılınca anlık değişiklikleri geri al
  if (state.currentPage === 'profile-edit' && page !== 'profile-edit' && _peSnap) peDiscard();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn, .nav-sec-btn').forEach(b => b.classList.remove('active'));

  const targetPage = document.getElementById('page-' + page);
  if (!targetPage) return;
  targetPage.classList.add('active');
  targetPage.classList.remove('page-entering');
  void targetPage.offsetWidth;
  targetPage.classList.add('page-entering');
  targetPage.scrollTop = 0;
  const btn = document.querySelector(`.nav-btn[data-page="${page}"], .nav-sec-btn[data-page="${page}"]`);
  if (btn) btn.classList.add('active');

  // Switch between user nav and admin nav
  const userNav  = document.getElementById('user-bottom-nav');
  const adminNav = document.getElementById('admin-bottom-nav');
  if (page === 'admin') {
    if (userNav)  userNav.style.display  = 'none';
    if (adminNav) adminNav.style.display = '';  // düzeni CSS belirler (ad-nav grid)
    document.querySelectorAll('.adm-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.adm-tab-content').forEach(t => t.classList.remove('active'));
    const dashBtn = document.querySelector('.adm-nav-btn');
    const dashTab = document.getElementById('adm-tab-dashboard');
    if (dashBtn) dashBtn.classList.add('active');
    if (dashTab) dashTab.classList.add('active');
    loadAdminUsers(); loadAdminDashboard(); loadAdminCounts();
  } else {
    if (userNav)  userNav.style.display  = '';  // düzeni CSS belirler (gn-dock grid)
    if (adminNav) adminNav.style.display = 'none';
  }

  // Hide wheel button when leaving home; never re-show on return
  if (page !== 'home') {
    const floatBtn = document.getElementById('wheel-float-btn');
    if (floatBtn) floatBtn.classList.remove('visible');
  }

  state.currentPage = page;
  if (page === 'friends') {
    if (state._friendsInterval) clearInterval(state._friendsInterval);
    state._friendsInterval = setInterval(() => {
      if (state.currentPage === 'friends' && state.user?.id) loadFriendsPage();
    }, 15000);
  } else if (state._friendsInterval) {
    clearInterval(state._friendsInterval);
    state._friendsInterval = null;
  }
  requestAnimationFrame(() => window.syncBottomNavSpace?.());
  if (page === 'tasks')         kzRefreshNav();
  if (page === 'home')          renderHomeConcerts();
  if (page === 'feedback')      loadFeedbackHistory();
  if (page === 'task-history')  renderTaskHistory();
  if (page === 'events')        renderEventsPage();
  if (page === 'kgoi')          renderKgoiPage();
  else if (_kgoiCountdownTimer) { clearInterval(_kgoiCountdownTimer); _kgoiCountdownTimer = null; }
  if (page === 'partners')      renderPartnersPage();
  if (page === 'league')          renderLeagueHub();
  if (page === 'league-register') renderLeagueRegisterForm();
  if (page === 'notifications') loadNotifications();
  if (page === 'leaderboard')   loadLeaderboard();
  if (page === 'friends')       loadFriendsPage();
  if (page === 'badges')        loadBadgesPage();
  if (page === 'gpass')         gpassOpen();
  if (page === 'profile-edit')  loadBadgeEditor();
  if (page === 'home' && state.tasks) {
    renderHomeTaskPreview(state.tasks, todaySubs(state.submissions));
    renderHomeRewardsPreview(state.rewards);
    updateHomeDailyProgress(state.tasks, todaySubs(state.submissions));
  }
  if (page === 'profile') refreshUserStats().then(() => { updateProfileDisplay(); renderCosmGrid(_cosmTabActive); applyCosmetics(); loadProfileBadges(); });
  else if (state.user?.id && page !== 'admin') refreshUserStats();
}

function settingEnabled(key, fallback = true) {
  const value = localStorage.getItem(`genco_setting_${key}`);
  return value === null ? fallback : value === 'true';
}

function toggleSetting(key) {
  localStorage.setItem(`genco_setting_${key}`, String(!settingEnabled(key)));
  renderSettings();
  if (key === 'motion') {
    document.body.classList.toggle('reduce-motion', !settingEnabled('motion'));
  }
  if (key === 'notifications') updateNotifDot();
  if (key === 'gencoAi') applyGencoAiVisibility();
  showToast(key === 'notifications' && settingEnabled(key) ? 'Bildirimler açıldı' : 'Ayar güncellendi');
}

// Ayarlardan kapatılınca Genco AI balonunu ve panelini ekrandan tamamen kaldırır.
function applyGencoAiVisibility() {
  const enabled = settingEnabled('gencoAi');
  const launcher = document.getElementById('genco-ai-launcher');
  const panel = document.getElementById('genco-ai-panel');
  if (launcher) launcher.style.display = enabled ? '' : 'none';
  if (!enabled) toggleGencoAi(false);
}

function renderSettings() {
  const themeToggle = document.getElementById('settings-theme-toggle');
  const motionToggle = document.getElementById('settings-motion-toggle');
  const notificationToggle = document.getElementById('settings-notification-toggle');
  const gencoAiToggle = document.getElementById('settings-gencoai-toggle');
  const isLight = document.body.classList.contains('light');
  if (themeToggle) themeToggle.classList.toggle('is-on', isLight);
  if (motionToggle) motionToggle.classList.toggle('is-on', settingEnabled('motion'));
  if (notificationToggle) notificationToggle.classList.toggle('is-on', settingEnabled('notifications'));
  if (gencoAiToggle) gencoAiToggle.classList.toggle('is-on', settingEnabled('gencoAi'));
}

/* ─── TABS ─── */
function switchTab(btn, tabId) {
  const tabSelector = btn.classList.contains('tasks-tab') ? '.tasks-tab' : '.tab-btn';
  document.querySelectorAll(tabSelector).forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + tabId).classList.add('active');
  if (tabId === 'badge') renderBadgeTab();
  if (tabId === 'level') renderLevelTasks();
}

function switchTasksTab(btn, tabId) {
  document.querySelectorAll('#page-tasks .kz-nav [data-tab]').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('#page-tasks .combined-section').forEach(s => { s.style.display = 'none'; });
  const target = document.getElementById(tabId);
  if (target) target.style.display = '';
  kzRefreshNav();
}

// Kazanımlar üst kartlarındaki canlı bilgiler (görev sayısı, rekor, tur, bakiye)
function kzRefreshNav() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const tasks = state.tasks || [];
  const statusById = {};
  todaySubs(state.submissions).forEach(s => { if (!(s.task_id in statusById)) statusById[s.task_id] = s.status; });
  const done = tasks.filter(t => statusById[t.id] === 'approved').length;
  const open = tasks.filter(t => !statusById[t.id] || statusById[t.id] === 'pending' || statusById[t.id] === 'rejected').length;
  if (tasks.length) set('kz-meta-tasks', `${done}/${tasks.length} tamamlandı`);
  // Alt menüdeki Kazanımlar rozeti: yapılmayı bekleyen görev sayısı
  const dot = document.getElementById('gn-tasks-badge');
  if (dot) { dot.textContent = open > 9 ? '9+' : open; dot.hidden = !open; }
  if (typeof _snakeGet === 'function') set('kz-meta-snake', `Rekor ${_snakeGet('bestScore', 0).toLocaleString('tr')}`);
  if (typeof _fbGet === 'function') set('kz-meta-flappy', `Rekor ${_fbGet('bestScore', 0).toLocaleString('tr')}`);
  if (typeof gqRoundsLeft === 'function') set('kz-meta-quiz', `${gqRoundsLeft()}/${GQ_MAX_ROUNDS} tur hakkı`);
  set('kz-balance', Number(state.user?.coin || 0).toLocaleString('tr'));
}

/* ─── REWARD CLAIM ─── */
function _claimedKey() { return `genco_claimed_${state.user?.id}`; }
function getClaimedRewards() {
  const dbClaimed = state.user?.claimedRewards || [];
  try {
    const local = JSON.parse(localStorage.getItem(_claimedKey()) || '[]');
    return [...new Set([...dbClaimed, ...local])];
  } catch { return dbClaimed; }
}
function _markClaimed(id) {
  if (!state.user.claimedRewards) state.user.claimedRewards = [];
  if (!state.user.claimedRewards.includes(id)) {
    state.user.claimedRewards = [...state.user.claimedRewards, id];
    sbUpdateStats(state.user.id, { claimed_rewards: state.user.claimedRewards }).catch(() => {});
    localStorage.setItem(_claimedKey(), JSON.stringify(state.user.claimedRewards));
  }
}

function toggleBottomNav(forceOpen) {
  const adminNav = document.getElementById('admin-bottom-nav');
  const secMenu = document.getElementById('nav-secondary-menu');
  const toggle = document.getElementById('nav-menu-toggle');
  const appScreen = document.getElementById('app-screen');
  const backdrop = document.getElementById('nav-drawer-backdrop');
  const isAdminView = adminNav && adminNav.style.display !== 'none';
  const isOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : toggle?.getAttribute('aria-expanded') !== 'true';

  // Admin tarafında hâlâ eski "kategorileri genişlet" çekmecesi kullanılıyor
  // (çok sayıda sekmesi var). Kullanıcı tarafında artık ayrı bir ikincil menü açılıyor.
  if (isAdminView) {
    adminNav?.classList.remove('menu-hidden');
    if (forceOpen !== false) adminGo('dashboard');
    return;
  } else {
    secMenu?.classList.toggle('open', isOpen);
  }
  appScreen?.classList.toggle('drawer-open', isOpen);
  if (backdrop) backdrop.setAttribute('aria-hidden', String(!isOpen));
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Kategorileri kapat' : 'Kategorileri aç');
    toggle.title = isOpen ? 'Kategorileri kapat' : 'Kategorileri aç';
    toggle.classList.toggle('is-open', isOpen);
  }
}

async function claimReward(id, xp, btn) {
  if (!state.user?.id) return;
  if (getClaimedRewards().includes(id)) { showToast('Bu ödül zaten alındı'); return; }
  btn.disabled = true;
  btn.textContent = 'Yükleniyor…';
  try {
    const prevLevel = state.user.level;
    const newXp = (state.user.xp || 0) + xp;
    await sbUpdateStats(state.user.id, { xp: newXp });
    state.user.xp    = newXp;
    state.user.level = seasonTier(newXp, state.user.cosmetics);
    _markClaimed(id);
    refreshCoinDisplays();
    btn.textContent = 'Alındı ✓';
    btn.classList.add('claimed');
    btn.disabled = true;
    showToast(`+${xp} XP hesabına eklendi! ⚡`);
    if (levelRank(state.user.level) > levelRank(prevLevel)) {
      sbUpdateStats(state.user.id, { level: state.user.level }).catch(() => {});
      setTimeout(() => showLevelUp(state.user.level, prevLevel), 600);
    }
  } catch (e) {
    showToast('Hata: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Ödülü Al';
  }
}

function renderBadgeTab() {
  const u = state.user;
  const container = document.getElementById('tab-badge-list');
  if (!container) return;
  const claimed = getClaimedRewards();
  const sortedBadgeTab = [...badgeList].sort((a, b) => (a.check(u) ? 1 : 0) - (b.check(u) ? 1 : 0));
  container.innerHTML = sortedBadgeTab.map(b => {
    const earned = b.check(u);
    const { cur, max } = b.progress(u);
    const pct = max > 0 ? Math.min(100, Math.round((cur / max) * 100)) : 0;
    const rewardLabel = b.xpReward > 0 ? `<span class="xp-pill">⚡ +${b.xpReward} XP</span>` : `<span class="badge-pill">🏅 Rozet</span>`;
    let rightHtml;
    if (!earned) {     
      rightHtml = `<div class="mini-progress"><div class="mini-fill" style="width:${pct}%"></div></div>
                   <div class="mini-label">${cur}/${max}</div>`;
    } else if (b.xpReward > 0 && !claimed.includes(b.id)) {
      rightHtml = `<button class="claim-btn" onclick="claimReward('${b.id}',${b.xpReward},this)">Ödülü Al</button>`;
    } else {
      rightHtml = `<div class="tc-badge done">Kazanıldı ✓</div>`;
    }
    return `<div class="task-card">
      <div class="tc-left">
        <div class="tc-icon-wrap" style="background:rgba(168,130,255,0.10)"><div class="tc-icon">${b.emoji}</div></div>
        <div class="tc-info">
          <div class="tc-name">${b.name}</div>
          <div class="tc-desc">${b.req}</div>
          <div class="tc-reward">${rewardLabel}</div>
        </div>
      </div>
      <div class="tc-right ${earned ? '' : 'progress-wrap'}">${rightHtml}</div>
    </div>`;
  }).join('');
}

/* Toplam (ömür boyu) XP kilometre taşları. Kademe eşikleriyle aynı rakamlar; ödül eşiğin ~%5'i.
   (Eski ödüller toplam ~20.800 XP'ydi ve Kademe'yi besleyip yeni ödülleri açan bir döngü kuruyordu.)
   Kimlikler eski listeyle aynı sırada tutulur ki daha önce alınanlar "alındı" kalsın. */
const LEVEL_MS_IDS = ['bronz2', 'bronz3', 'silver1', 'silver2', 'silver3', 'gold1', 'gold2', 'gold3',
  'plat1', 'plat2', 'plat3', 'dia1', 'dia2', 'dia3', 'leg1', 'leg2', 'leg3'];
const LEVEL_MS_STYLE = {
  Bronz: ['🥉', 'rgba(205,127,50,0.15)'], Gümüş: ['🥈', 'rgba(148,163,184,0.15)'], Altın: ['🥇', 'rgba(250,204,21,0.15)'],
  Platin: ['🔷', 'rgba(99,102,241,0.15)'], Elmas: ['💎', 'rgba(20,184,166,0.15)'], Legend: ['🌟', 'rgba(234,179,8,0.15)'],
};
function levelMilestones(xp) {
  return LEVEL_THRESHOLDS.slice(1).map((t, i) => {
    const [emoji, bg] = LEVEL_MS_STYLE[t.name.split(' ')[0]] || ['⭐', 'rgba(255,255,255,0.08)'];
    const gain = Math.max(30, Math.round(t.xp * 0.05 / 10) * 10);
    const fmt = t.xp.toLocaleString('tr-TR');
    return { id: `ms-lv-${LEVEL_MS_IDS[i]}`, emoji, bg, name: `${fmt} XP Kulübü`, desc: `Toplamda ${fmt} XP kazan`,
      reward: `⚡ +${gain.toLocaleString('tr-TR')} XP`, xpGain: gain, cur: Math.min(xp, t.xp), max: t.xp };
  });
}

function renderLevelTasks() {
  const container = document.getElementById('tab-level-list');
  if (!container) return;
  const u = state.user;
  const xp      = u.xp             || 0;
  const streak  = u.streak          || 0;
  const tasks   = u.tasksCompleted  || 0;

  const milestones = [
    // ── Streak milestones ──
    { id:'ms-streak-3',   emoji:'🔥', bg:'rgba(239,68,68,0.12)',    name:'3 Günlük Seri',         desc:'Üst üste 3 gün görev yap',        reward:'⚡ +150 XP',    xpGain:150,  cur: Math.min(streak,3),   max:3     },
    { id:'ms-streak-7',   emoji:'🔥', bg:'rgba(239,68,68,0.12)',    name:'7 Günlük Seri',         desc:'Üst üste 7 gün görev yap',        reward:'⚡ +400 XP',    xpGain:400,  cur: Math.min(streak,7),   max:7     },
    { id:'ms-streak-30',  emoji:'🔥', bg:'rgba(239,68,68,0.12)',    name:'30 Günlük Seri',        desc:'Üst üste 30 gün görev yap',       reward:'⚡ +1.500 XP',  xpGain:1500, cur: Math.min(streak,30),  max:30    },
    // ── Task count milestones ──
    { id:'ms-tasks-5',    emoji:'🏆', bg:'rgba(250,204,21,0.12)',   name:'5 Görev Tamamla',       desc:'Toplam 5 görev tamamla',          reward:'⚡ +100 XP',    xpGain:100,  cur: Math.min(tasks,5),    max:5     },
    { id:'ms-tasks-10',   emoji:'🏆', bg:'rgba(250,204,21,0.12)',   name:'10 Görev Tamamla',      desc:'Toplam 10 görev tamamla',         reward:'⚡ +200 XP',    xpGain:200,  cur: Math.min(tasks,10),   max:10    },
    { id:'ms-tasks-25',   emoji:'🏆', bg:'rgba(250,204,21,0.12)',   name:'25 Görev Tamamla',      desc:'Toplam 25 görev tamamla',         reward:'⚡ +500 XP',    xpGain:500,  cur: Math.min(tasks,25),   max:25    },
    { id:'ms-tasks-50',   emoji:'🏆', bg:'rgba(250,204,21,0.12)',   name:'50 Görev Tamamla',      desc:'Toplam 50 görev tamamla',         reward:'⚡ +1.000 XP',  xpGain:1000, cur: Math.min(tasks,50),   max:50    },
    { id:'ms-tasks-100',  emoji:'🏆', bg:'rgba(250,204,21,0.12)',   name:'100 Görev Tamamla',     desc:'Toplam 100 görev tamamla',        reward:'⚡ +2.500 XP',  xpGain:2500, cur: Math.min(tasks,100),  max:100   },
    // ── Toplam XP kilometre taşları: Kademe eşiklerinden üretilir (bkz. levelMilestones) ──
    ...levelMilestones(xp),
  ];

  milestones.sort((a, b) => (a.cur >= a.max ? 1 : 0) - (b.cur >= b.max ? 1 : 0));

  const claimed = getClaimedRewards();
  container.innerHTML = milestones.map(m => {
    const done = m.cur >= m.max;
    const pct  = Math.min(100, Math.round((m.cur / m.max) * 100));
    let rightHtml;
    if (!done) {
      rightHtml = `<div class="mini-progress"><div class="mini-fill" style="width:${pct}%"></div></div>
                   <div class="mini-label">${m.cur.toLocaleString('tr')}/${m.max.toLocaleString('tr')}</div>`;
    } else if (!claimed.includes(m.id)) {
      rightHtml = `<button class="claim-btn" onclick="claimReward('${m.id}',${m.xpGain},this)">Ödülü Al</button>`;
    } else {
      rightHtml = `<div class="tc-badge done">Alındı ✓</div>`;
    }
    return `<div class="task-card">
      <div class="tc-left">
        <div class="tc-icon-wrap" style="background:${m.bg}"><div class="tc-icon">${m.emoji}</div></div>
        <div class="tc-info">
          <div class="tc-reward"><span class="xp-pill">${m.reward}</span></div>
          <div class="tc-name">${m.name}</div>
          <div class="tc-desc">${m.desc}</div>
        </div>
      </div>
      <div class="tc-right ${done ? '' : 'progress-wrap'}">${rightHtml}</div>
    </div>`;
  }).join('');
}

/* ─── COUNTDOWN TIMER ─── */
function startTimer() {
  if (state._timerInterval) clearInterval(state._timerInterval);
  let prevDate = localDateKey();
  function tick() {
    const now  = new Date();
    const next = new Date();
    next.setHours(24, 0, 0, 0);
    const diff = Math.max(0, next - now);
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    const el = document.getElementById('task-timer');
    if (el) el.textContent = `${h}:${m}:${s}`;

    // Gün değişince görevleri otomatik yenile
    const today = localDateKey(now);
    if (today !== prevDate && state.user?.id) {
      prevDate = today;
      state._dailyTasksDate = null;
      sbAssignDailyTasks(state.user.id).then(() => {
        loadTasksAndRender();
        showToast('🌅 Yeni günün görevleri hazır!');
      }).catch(() => {});
    }
  }
  tick();
  state._timerInterval = setInterval(tick, 1000);
}

/* ─── TASK MODAL ─── */
const taskData = {
  '🐾': { name: 'Sokak hayvanına mama ver', desc: 'Fotoğraf çekerek kanıtla', coin: 25 },
  '🏃': { name: '150 kal kardiyo yap', desc: 'Fitness uygulaması ekranı', coin: 40 },
  '♻️': { name: 'Geri dönüşüm yap', desc: 'Çöp kutusuna atarken çek', coin: 30 },
  '📚': { name: '30 dk kitap oku', desc: 'Kitap sayfasını fotoğrafla', coin: 20 },
  '🌱': { name: 'Çiçek/bitki sula', desc: 'Sulama anını yakala', coin: 15 }
};

let _taskCropper = null;

function openTaskModal(card) {
  const icon   = card.querySelector('.tc-icon')?.textContent?.trim();
  const status = card.dataset.status;
  const taskId = card.dataset.taskId;
  const task   = (state.tasks || []).find(t => t.id === taskId) || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  const sheet = document.querySelector('#modal-task .tk-sheet');
  sheet.style.setProperty('--h', card.style.getPropertyValue('--h') || '215');
  set('mt-emoji', icon || task.emoji || '📋');
  set('mt-title', task.title || card.querySelector('.tc-name')?.textContent || '');
  set('mt-desc', task.description || '');
  document.getElementById('mt-desc').hidden = !task.description;
  set('mt-reward', `+${task.coin_reward || 0}`);
  set('mt-xp', `+${task.xp_reward || 0} XP`);
  const cat = normalizeCategoryLabel(task.category) || '';
  set('mt-cat', cat);
  document.getElementById('mt-cat').hidden = !cat;
  set('mt-diff', task.difficulty || '');
  document.getElementById('mt-diff').hidden = !task.difficulty;

  document.getElementById('mt-upload-section').hidden = status === 'review' || status === 'done';
  document.getElementById('mt-done-section').hidden = status !== 'review';
  document.getElementById('mt-approved-section').hidden = status !== 'done';
  resetTaskPhoto();

  state.currentTask = { icon, task, card, taskId };
  openModal('modal-task');
}

function closeTaskModal() {
  destroyTaskCropper();
  closeModal('modal-task');
}

// Fotoğraf → Kırp → Gönder adımlarından birini göster
function showTaskStep(step) {
  document.getElementById('mt-pick').hidden = step !== 1;
  document.getElementById('mt-crop').hidden = step !== 2;
  document.getElementById('mt-preview').hidden = step !== 3;
  document.querySelectorAll('#mt-flow li').forEach(li => {
    const n = Number(li.dataset.step);
    li.classList.toggle('on', n === step);
    li.classList.toggle('done', n < step);
  });
}

function destroyTaskCropper() {
  if (_taskCropper) { _taskCropper.destroy(); _taskCropper = null; }
}

function triggerUpload(source) {
  document.getElementById(source === 'gallery' ? 'file-input-gallery' : 'file-input').click();
}
function resetFileInput() {
  ['file-input', 'file-input-gallery'].forEach(id => { const fi = document.getElementById(id); if (fi) fi.value = ''; });
}
function resetTaskPhoto() {
  destroyTaskCropper();
  resetFileInput();
  state._taskProofDataUrl = null;
  state._taskProofOriginal = null;
  showTaskStep(1);
}

function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onerror = () => showToast('Fotoğraf okunamadı, lütfen tekrar deneyin');
  reader.onload = (e) => {
    const raw = e.target.result;
    const image = new Image();
    image.onload = () => {
      // Kırpma öncesi büyük fotoğrafları küçült (performans için)
      try {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(image.width  * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        state._taskProofOriginal = canvas.toDataURL('image/jpeg', 0.9);
      } catch {
        state._taskProofOriginal = raw;
      }
      startTaskCrop(state._taskProofOriginal);
    };
    image.onerror = () => showToast('Fotoğraf okunamadı, lütfen tekrar deneyin');
    image.src = raw;
  };
  reader.readAsDataURL(file);
}

function useTaskPhoto(dataUrl) {
  state._taskProofDataUrl = dataUrl;
  document.getElementById('preview-img').src = dataUrl;
  showTaskStep(3);
}

function startTaskCrop(src) {
  if (typeof Cropper === 'undefined') {
    // Kırpma kütüphanesi yüklenemediyse fotoğrafı kırpmadan kullan
    showToast('Kırpma aracı yüklenemedi, fotoğraf kırpılmadan eklendi');
    compressTaskPhoto(src).then(useTaskPhoto);
    return;
  }
  showTaskStep(2);
  destroyTaskCropper();
  const active = document.querySelector('#mt-ratios button.on');
  const img = document.getElementById('mt-crop-image');
  img.onload = () => {
    try {
      _taskCropper = new Cropper(img, {
        aspectRatio: parseFloat(active?.dataset.ratio || '1.3333'),
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        background: false,
        responsive: true,
      });
    } catch (err) {
      console.error('Cropper başlatılamadı:', err);
      compressTaskPhoto(src).then(useTaskPhoto);
    }
  };
  img.onerror = () => { showToast('Fotoğraf yüklenemedi'); resetTaskPhoto(); };
  img.src = src;
}

function compressTaskPhoto(src) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(image.width  * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      } catch { resolve(src); }
    };
    image.onerror = () => resolve(src);
    image.src = src;
  });
}

function setTaskCropRatio(btn) {
  document.querySelectorAll('#mt-ratios button').forEach(b => b.classList.toggle('on', b === btn));
  _taskCropper?.setAspectRatio(parseFloat(btn.dataset.ratio));
}
function rotateTaskCrop() {
  _taskCropper?.rotate(90);
}
function cancelTaskCrop() {
  destroyTaskCropper();
  // Daha önce kırpılmış bir fotoğraf varsa ona dön, yoksa baştan seç
  if (state._taskProofDataUrl) showTaskStep(3);
  else resetTaskPhoto();
}
function reopenTaskCrop() {
  if (state._taskProofOriginal) startTaskCrop(state._taskProofOriginal);
}
function applyTaskCrop() {
  if (!_taskCropper) return;
  let canvas;
  try {
    canvas = _taskCropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200, fillColor: '#000' });
  } catch (err) {
    console.error('Kırpma uygulanamadı:', err);
  }
  if (!canvas) { showToast('Kırpma uygulanamadı, tekrar dene'); return; }
  const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
  destroyTaskCropper();
  useTaskPhoto(dataUrl);
}

async function submitTask() {
  const { card, taskId } = state.currentTask || {};
  if (!taskId) return;
  const proofUrl = state._taskProofDataUrl || null;
  if (!proofUrl) { showToast('Önce bir kanıt fotoğrafı ekle'); return; }

  const btn = document.getElementById('submit-btn');
  const label = btn?.querySelector('span');
  if (btn) { btn.disabled = true; if (label) label.textContent = 'Gönderiliyor…'; }

  try {
    await sbSubmitTask({
      task_id:   taskId,
      user_id:   state.user.id,
      status:    'review',
      proof_url: proofUrl
    });

    // UI güncelle
    document.getElementById('mt-upload-section').hidden = true;
    document.getElementById('mt-done-section').hidden = false;
    if (card) card.dataset.status = 'review';

    showToast('Görev incelemeye gönderildi! 📨');
    // Listeyi yenile
    loadTasksAndRender();
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Görev gönderilemedi'));
  } finally {
    if (btn) { btn.disabled = false; if (label) label.textContent = 'Görevi gönder'; }
  }
}

async function renderTaskHistory() {
  const list = document.getElementById('task-history-list');
  if (!list) return;
  list.innerHTML = `<div class="th-empty"><div class="th-empty-icon">⏳</div><div class="th-empty-text">Yükleniyor…</div></div>`;

  try {
    const subs = await sbGetMySubmissions(state.user.id);
    state.taskHistoryData = subs;

    // Özet sayaçlar
    const approved = subs.filter(s => s.status === 'approved').length;
    const review   = subs.filter(s => s.status === 'review').length;
    const rejected = subs.filter(s => s.status === 'rejected').length;
    const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setEl('th-sum-total',    subs.length);
    setEl('th-sum-approved', approved);
    setEl('th-sum-review',   review);
    setEl('th-sum-rejected', rejected);

    renderTaskHistoryList('all');
  } catch (e) {
    list.innerHTML = `<div class="th-empty"><div class="th-empty-icon">⚠️</div><div class="th-empty-text">Yüklenemedi</div></div>`;
  }
}

function filterTaskHistory(btn, filter) {
  document.querySelectorAll('.th-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTaskHistoryList(filter);
}

function renderTaskHistoryList(filter) {
  const list = document.getElementById('task-history-list');
  if (!list) return;
  const all  = state.taskHistoryData || [];
  const subs = filter === 'all' ? all : all.filter(s => s.status === filter);

  if (!subs.length) {
    const labels = { all:'Henüz hiç görev gönderilmedi', approved:'Onaylanan görev yok', review:'Bekleyen görev yok', rejected:'Reddedilen görev yok' };
    list.innerHTML = `<div class="th-empty"><div class="th-empty-icon">📭</div><div class="th-empty-text">${labels[filter] || 'Görev yok'}</div><div class="th-empty-sub">Görevler sekmesinden yeni görev tamamla</div></div>`;
    return;
  }

  const statusCfg = {
    approved: { cls: 'th-approved', label: 'Onaylandı ✓' },
    review:   { cls: 'th-review',   label: 'İnceleniyor' },
    rejected: { cls: 'th-rejected', label: 'Reddedildi'  },
    pending:  { cls: 'th-review',   label: 'Bekliyor'    }
  };

  list.innerHTML = subs.map(s => {
    const task   = s.tasks || {};
    const cfg    = statusCfg[s.status] || statusCfg.pending;
    const date   = new Date(s.submitted_at).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const reviewed = s.reviewed_at ? new Date(s.reviewed_at).toLocaleDateString('tr-TR', { day:'2-digit', month:'short' }) : null;

    return `<div class="th-item">
      <div class="th-icon">${task.emoji || '📋'}</div>
      <div class="th-body">
        <div class="th-name">${task.title || 'Görev'}</div>
        <div class="th-date">Gönderildi: ${date}</div>
        ${reviewed ? `<div class="th-date">İncelendi: ${reviewed}</div>` : ''}
        ${s.rejection_reason ? `<div class="th-reject-reason">❌ ${s.rejection_reason}</div>` : ''}
      </div>
      <div class="th-right">
        ${s.status === 'approved' ? `<div class="th-coin">+${task.coin_reward || 0} 🪙</div><div class="th-xp">+${task.xp_reward || 0} XP</div>` : ''}
        <div class="th-status ${cfg.cls}">${cfg.label}</div>
      </div>
    </div>`;
  }).join('');
}

/* ─── ÖDÜL KULLANIM HAKKI ───
   Coin rahat kazanılır ama harcama sınırlıdır: günde en fazla REWARD_DAILY_LIMIT ödül ve
   aynı ödül REWARD_REPEAT_DAYS günde bir. Kayıt profildeki equipped_cosmetics.redeems
   listesinde tutulur (cihazlar arası aynı), sadece son 7 günün kaydı saklanır. */
const REWARD_DAILY_LIMIT = 2;
const REWARD_REPEAT_DAYS = 7;
function rewardRedeemLog() {
  const since = Date.now() - REWARD_REPEAT_DAYS * 864e5;
  return (state.user?.cosmetics?.redeems || []).filter(r => new Date(r.at).getTime() > since);
}
function rewardUsedToday() {
  const today = passDayKey();
  return rewardRedeemLog().filter(r => passDayKey(new Date(r.at)) === today).length;
}
// { ok, note }: ok=false ise ödül şu an kullanılamaz, note nedenini söyler
function rewardLimitCheck(rewardId) {
  const used = rewardUsedToday();
  if (used >= REWARD_DAILY_LIMIT) return { ok: false, note: `Bugünkü ${REWARD_DAILY_LIMIT} ödül hakkını kullandın. Yarın yeni hakların açılıyor 🌙` };
  const last = rewardRedeemLog().filter(r => String(r.id) === String(rewardId)).pop();
  if (last) {
    const days = Math.ceil((new Date(last.at).getTime() + REWARD_REPEAT_DAYS * 864e5 - Date.now()) / 864e5);
    return { ok: false, note: `Bu ödülü yakın zamanda kullandın. ${days} gün sonra tekrar alabilirsin, o zamana kadar başka mekânları keşfet!` };
  }
  return { ok: true, note: `Bugün ${REWARD_DAILY_LIMIT - used}/${REWARD_DAILY_LIMIT} ödül hakkın var.` };
}
async function rewardLogRedeem(rewardId) {
  const redeems = [...rewardRedeemLog(), { id: String(rewardId), at: new Date().toISOString() }];
  try { await saveBadgeCosmetics({ redeems }); }
  catch (e) { console.warn('Ödül kaydı yazılamadı:', e); state.user.cosmetics = { ...(state.user.cosmetics || {}), redeems }; }
}

/* ─── REWARD MODAL ─── */
function openRewardModal(card) {
  if (card.classList.contains('locked')) return;
  const d = card.dataset;
  const cost = parseInt(d.cost || 0);
  const balance = Number(state.user.coin || 0);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  const media = document.getElementById('mr-media');
  media.innerHTML = d.img
    ? `<img src="${escHtml(d.img)}" alt="" onerror="this.parentNode.innerHTML='<span>${escHtml(d.emoji || '🎁')}</span>'">`
    : `<span>${escHtml(d.emoji || '🎁')}</span>`;
  set('mr-partner', d.partner || 'Genco ödülü');
  set('mr-name', d.name || 'Ödül');
  set('mr-disc', d.disc || '');
  document.getElementById('mr-disc').hidden = !d.disc;
  set('mr-balance', balance.toLocaleString('tr'));
  set('mr-cost', cost.toLocaleString('tr'));
  set('mr-left', Math.max(0, balance - cost).toLocaleString('tr'));

  document.getElementById('mr-main').style.display    = 'block';
  document.getElementById('mr-success').style.display = 'none';

  const lim = rewardLimitCheck(d.id);
  const limEl = document.getElementById('mr-limit');
  if (limEl) { limEl.textContent = lim.note; limEl.classList.toggle('is-blocked', !lim.ok); }
  const useBtn = document.getElementById('mr-use-btn');
  if (useBtn) useBtn.disabled = !lim.ok;

  state.currentReward = { ...d };
  openModal('modal-reward');
}

function openCamera() {
  closeModal('modal-reward');
  document.getElementById('camera-overlay').style.display = 'flex';
}
function closeCamera() {
  document.getElementById('camera-overlay').style.display = 'none';
}
async function simulateQR() {
  closeCamera();
  const cost     = parseInt(state.currentReward?.cost || 0);
  const rewardId = state.currentReward?.id;
  const lim = rewardLimitCheck(rewardId);
  if (!lim.ok) { showToast(lim.note); return; }
  if (Number(state.user.coin || 0) < cost) { showToast('Bu ödül için yeterli coinin yok'); return; }

  try {
    if (rewardId && state.user.id) {
      await sbRedeemReward(state.user.id, rewardId);
      const newCoin = Math.max(0, state.user.coin - cost);
      await sbUpdateStats(state.user.id, {
        coin: newCoin,
        rewards_used: (state.user.rewardsUsed || 0) + 1
      });
      state.user.coin = newCoin;
      state.user.rewardsUsed = (state.user.rewardsUsed || 0) + 1;
      await rewardLogRedeem(rewardId);
    } else {
      state.user.coin = Math.max(0, state.user.coin - cost);
    }
  } catch (e) {
    state.user.coin = Math.max(0, state.user.coin - cost);
  }

  refreshCoinDisplays();
  loadRewardsAndRender();
  showRewardCoupon();
  showToast('Ödül kullanıldı! 🎉');
}

// Kasiyere gösterilecek kupon: ödül, kod ve kullanım zamanı
function showRewardCoupon() {
  const r = state.currentReward || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const chars = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
  const code = 'GN-' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  set('mr-s-partner', r.partner || 'Genco ödülü');
  set('mr-s-name', r.name || 'Ödül');
  set('mr-s-code', code);
  set('mr-s-time', new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }));
  set('mr-s-left', Number(state.user.coin || 0).toLocaleString('tr'));
  openModal('modal-reward');
  document.getElementById('mr-main').style.display    = 'none';
  document.getElementById('mr-success').style.display = 'block';
}

// ---------------- Validation Helpers ----------------
// Simple in-memory username store
const existingUsernames = ['admin','user1','omur'];

// ---------------- Rewards availability ----------------
function updateRewardsAvailability(){
  // Yeni vitrin tasarımı durumları render sırasında hesaplıyor
  if (state.rewards && document.getElementById('rewards-list')) { renderRewards(state.rewards); return; }
  const coins = Number(state.user.coin || 0);
  document.querySelectorAll('.reward-card').forEach(card=>{
    const cost = parseInt(card.dataset.cost || '0');
    const badge = card.querySelector('.rc-badge');
    const costEl = card.querySelector('.rc-cost');
    const lockOverlay = card.querySelector('.lock-overlay');
    if (coins >= cost) {
      card.classList.remove('locked');
      card.classList.add('unlocked');
      if (badge) { badge.className = 'rc-badge unlocked-badge'; badge.textContent = 'Kullanılabilir'; }
      if (costEl) { costEl.classList.remove('rc-locked'); costEl.textContent = cost + ' GPoint'; }
      if (lockOverlay) lockOverlay.style.display = 'none';
    } else {
      card.classList.remove('unlocked');
      card.classList.add('locked');
      if (badge) { badge.className = 'rc-badge locked-badge'; badge.textContent = cost + ' GPoint Gerekli'; }
      if (costEl) { costEl.classList.add('rc-locked'); costEl.textContent = cost + ' GPoint'; }
      if (lockOverlay) lockOverlay.style.display = 'flex';
    }
  });
}

// refresh various coin displays across the UI
function refreshCoinDisplays(){
  const u = state.user;
  const c  = Number(u.coin  || 0);
  const x  = mySeasonXp();
  const r  = u.rank  || 0;

  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  // Topbar
  s('topbar-coin', formatCompact(c));
  s('topbar-xp',   formatXP(x));
  const coinBtn = document.querySelector('.tb2-coin');
  if (coinBtn) coinBtn.title = `${c.toLocaleString('tr-TR')} coin · cüzdanını aç`;
  updateTopbarLevel();

  // Home stats
  s('home-stat-coin', c);
  s('home-stat-xp',   formatXP(x));
  s('home-stat-rank', r > 0 ? '#' + r : '—');

  // Home XP bar
  const rnkH  = levelRank(xpToLevel(x));
  const curTH = LEVEL_THRESHOLDS[rnkH];
  const nxtTH = LEVEL_THRESHOLDS[rnkH + 1];
  const pctH  = nxtTH ? Math.min(100, Math.round(((x - curTH.xp) / (nxtTH.xp - curTH.xp)) * 100)) : 100;
  const fillH = document.querySelector('.home-xp-fill');
  const curH  = document.querySelector('.home-xp-cur');
  const nxtH  = document.querySelector('.home-xp-next');
  if (fillH) fillH.style.width = pctH + '%';
  if (curH)  curH.textContent  = x.toLocaleString('tr') + ' XP';
  if (nxtH)  nxtH.textContent  = nxtTH ? (nxtTH.name + ' için ' + nxtTH.xp.toLocaleString('tr') + ' XP') : 'Zirvedesin! 🌟';

  // Home level chip
  const lvlChip = document.querySelector('.home-chip-level');
  if (lvlChip) lvlChip.textContent = levelEmoji(u.level) + ' ' + u.level + ' Üye';

  // Home streak chip
  const strChip = document.querySelector('.home-chip-streak');
  if (strChip) strChip.textContent = '🔥 ' + (u.streak || 0) + ' günlük seri';

  // Rewards coin bar
  const csb = document.querySelector('.csb-val');
  if (csb) csb.textContent = c.toLocaleString('tr');
  s('kz-balance', c.toLocaleString('tr'));

  // Leaderboard "Sen" row
  s('lb-my-xp',    x.toLocaleString('tr') + ' XP');
  s('lb-my-pos',   r > 0 ? r : '—');
  s('lb-my-level', levelEmoji(u.level) + ' ' + u.level);
  const lbAv = document.getElementById('lb-my-avatar');
  if (lbAv) lbAv.textContent = (u.username || u.name || 'U')[0].toUpperCase();
}

/* ─── WALLET MODAL ─── */
// Seviye grubu renkleri (r,g,b): açık ton, koyu ton
const TIER_RGB = {
  bronz:  ['245,177,131', '194,112,58'],
  gumus:  ['232,237,245', '154,168,189'],
  altin:  ['253,230,138', '245,158,11'],
  platin: ['153,246,228', '20,184,166'],
  elmas:  ['165,216,255', '59,130,246'],
  legend: ['245,184,255', '168,85,247'],
};
function tierKey(level) { return normalizePartnerKey(levelBase(level)).replace(/ş/g, 's'); }

async function openWalletModal() {
  const u = state.user;
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  setT('wallet-balance', Number(u.coin || 0).toLocaleString('tr-TR'));
  setT('wallet-holder', u.username ? '@' + u.username : (u.name || 'Genco üyesi'));
  setT('wallet-xp', formatXP(mySeasonXp()));
  setT('wallet-streak', u.streak || 0);
  setT('wallet-tasks', u.tasksCompleted || 0);

  openModal('modal-wallet');
  renderWalletActivity();
}

// Sayıyı 0'dan hedefe doğru sayarak göster
function xpCountUp(el, to, ms = 900) {
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || to <= 0) { el.textContent = to.toLocaleString('tr-TR'); return; }
  const t0 = performance.now();
  const tick = now => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('tr-TR');
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const xpShort = n => n >= 1000 ? (n / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'B' : String(n);

function openXpModal() {
  const u = state.user;
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  const x = mySeasonXp();
  const level = u.level || xpToLevel(x);
  const rank = Math.max(0, levelRank(level));
  const curT = LEVEL_THRESHOLDS[rank];
  const nxtT = LEVEL_THRESHOLDS[rank + 1];
  const p = nxtT ? Math.min(1, Math.max(0, (x - curT.xp) / (nxtT.xp - curT.xp))) : 1;

  // Seviye rengi tüm sayfaya yayılır (madalya, çubuk, yol)
  const [t1, t2] = TIER_RGB[tierKey(level)] || TIER_RGB.bronz;
  const sheet = document.querySelector('#modal-xp .wx-sheet');
  if (sheet) { sheet.style.setProperty('--t1', t1); sheet.style.setProperty('--t2', t2); }

  setT('xp-modal-level', level);
  setT('xp-modal-roman', (level.split(' ')[1] || 'I'));
  setT('xp-modal-pct', Math.floor(p * 100) + '%');
  setT('xp-modal-remaining', nxtT ? `${nxtT.name} için ${(nxtT.xp - x).toLocaleString('tr-TR')} XP kaldı` : 'Zirvedesin 👑 en yüksek seviye');
  setT('xp-modal-rank', u.rank > 0 ? '#' + u.rank : '—');
  setT('xp-modal-streak', u.streak || 0);
  setT('xp-modal-tasks', u.tasksCompleted || 0);

  // Bulunduğun kademedeki I · II · III adımları
  const base = levelBase(level);
  const subs = LEVEL_THRESHOLDS.filter(t => levelBase(t.name) === base);
  const stepsEl = document.getElementById('xp-modal-steps');
  if (stepsEl) {
    stepsEl.innerHTML = subs.map(t => {
      const r = levelRank(t.name);
      const st = r < rank ? 'is-done' : r === rank ? 'is-now' : '';
      return `<span class="xpx-step ${st}"><i>${r < rank ? '✓' : t.name.split(' ')[1] || ''}</i>${escHtml(t.name)}</span>`;
    }).join('<span class="xpx-step-line" aria-hidden="true"></span>');
  }

  // Kademe yolu: 6 grup (Bronz → Legend)
  const groups = LEVEL_FRAMES.map(f => ({ ...f, reached: rank >= levelRank(f.level) }));
  const curIdx = groups.reduce((acc, g, i) => g.reached ? i : acc, 0);
  const nextGroup = groups[curIdx + 1];
  setT('xp-modal-next', nextGroup ? `${nextGroup.name} için ${(LEVEL_THRESHOLDS[levelRank(nextGroup.level)].xp - x).toLocaleString('tr-TR')} XP` : 'Tümü açıldı 🎉');
  const road = document.getElementById('xp-road');
  if (road) {
    road.style.setProperty('--fill', groups.length > 1 ? curIdx / (groups.length - 1) : 1);
    road.innerHTML = `<span class="xpx-road-line" aria-hidden="true"><i></i></span>` + groups.map((g, i) => {
      const [c1, c2] = TIER_RGB[g.key] || TIER_RGB.bronz;
      const need = LEVEL_THRESHOLDS[levelRank(g.level)].xp;
      return `<div class="xpx-node${g.reached ? ' is-reached' : ''}${i === curIdx ? ' is-current' : ''}" style="--c1:${c1};--c2:${c2};--i:${i}">
        ${i === curIdx ? '<em>SEN</em>' : ''}
        <span class="xpx-node-dot"><svg viewBox="0 0 24 24"><path d="M12 2.5l8 3.2v6c0 5-3.4 9.1-8 10.8-4.6-1.7-8-5.8-8-10.8v-6z"/></svg>${g.reached ? '' : '<i>🔒</i>'}</span>
        <b>${g.name}</b><small>${need ? xpShort(need) : 'Başlangıç'}</small>
      </div>`;
    }).join('');
  }

  // Kişisel ipucu
  const tip = !(u.streak > 0) ? '🔥 Bugün bir görev yap, serini başlat. Seri uzadıkça daha çok ödül!'
    : !nxtT ? '👑 Zirvedesin! Sıralamada yerini korumak için görevlere devam et.'
    : (nxtT.xp - x) <= 150 ? `⚡ Çok yakınsın! ${nxtT.name} için bir iki görev yeter.`
    : `💡 ${u.streak} günlük serin var, bugün de görev yaparak seriyi koru.`;
  setT('xp-modal-tip', tip);

  openModal('modal-xp');
  // Çubuk ve sayı açılışta 0'dan dolsun
  xpCountUp(document.getElementById('xp-modal-total'), x);
  const bar = document.getElementById('xp-modal-ring');
  if (bar) {
    bar.style.setProperty('--p', 0);
    requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--p', p.toFixed(3))));
  }
}

function walletGoRewards() {
  closeModal('modal-wallet');
  goPage('tasks');
  document.querySelector('#page-tasks [data-tab="rewards-tab"]')?.click();
}

function walletGoHistory() {
  closeModal('modal-wallet');
  state._reopenWalletOnBack = true;
  goPage('task-history');
}

function backFromTaskHistory() {
  goPage('home');
  if (state._reopenWalletOnBack) {
    state._reopenWalletOnBack = false;
    openWalletModal();
  }
}

async function renderWalletActivity() {
  const list = document.getElementById('wallet-activity-list');
  if (!list) return;
  if (!state.taskHistoryData) {
    list.innerHTML = `<div class="wx-skel">${'<div><i></i><span><b></b><em></em></span></div>'.repeat(3)}</div>`;
  }

  try {
    let subs = state.taskHistoryData;
    if (!subs) {
      subs = await sbGetMySubmissions(state.user.id);
      state.taskHistoryData = subs;
    }
    const approved = subs.filter(s => s.status === 'approved').slice(0, 5);

    if (!approved.length) {
      list.innerHTML = `<div class="wx-empty">
        <span class="wx-empty-ic"><svg viewBox="0 0 24 24"><path d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 7.5 6 4h12l2 3.5M15 13.5h2"/></svg></span>
        <b>Henüz hareket yok</b><small>Görev tamamladıkça kazandığın GPoint'ler burada listelenir.</small></div>`;
      return;
    }

    list.innerHTML = approved.map(s => {
      const task = s.tasks || {};
      const date = new Date(s.reviewed_at || s.submitted_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      return `<div class="wx-row">
        <span class="wx-row-ic">${escHtml(task.emoji || '📋')}</span>
        <span class="wx-row-body"><b>${escHtml(task.title || 'Görev')}</b><small>Görev ödülü · ${date}</small></span>
        <span class="wx-row-amt">+${Number(task.coin_reward || 0).toLocaleString('tr-TR')}<i class="snake-score-coin" aria-hidden="true">G</i></span>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div class="wx-empty"><b>Hareketler yüklenemedi</b><small>Bağlantını kontrol edip tekrar dene.</small>
      <button type="button" class="wx-link" onclick="renderWalletActivity()">Tekrar dene</button></div>`;
  }
}

// Login validation helpers
function clearLoginErrors(){
  ['login-err-identifier', 'login-err-pass'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.textContent='';
  });
}
function showLoginFieldError(id, msg){
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.color = '#ffbaba'; }
}
function validatePasswordLogin(p, identifier){
  if (!p) return 'Şifre boş olamaz';
  if (p.length < 8) return 'Şifre en az 8 karakter olmalı';
  if (/\s/.test(p)) return 'Şifre boşluk içeremez';
  if (identifier && p === identifier) return 'Şifre kullanıcı/e-posta ile aynı olamaz';
  if (!/[A-Z]/.test(p)) return 'Şifre en az 1 büyük harf içermeli';
  if (!/[a-z]/.test(p)) return 'Şifre en az 1 küçük harf içermeli';
  if (!/[0-9]/.test(p)) return 'Şifre en az 1 sayı içermeli';
  return true;
}

function showFieldError(id, msg){
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.color = '#ffbaba'; }
}
function clearAllErrors(){
  ['err-name','err-username','err-email','err-phone','err-pass','err-pass2','err-dob','err-gender','err-kvk'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.textContent='';
  });
}

function validateName(n){
  if (!n) return false;
  // if contains any digit
  return !/\d/.test(n);
}
function validateEmail(e){
  return /.+@.+\..+/.test(e);
}
function validateUsername(u){
  if (!u) return 'Kullanıcı adı boş olamaz';
  if (u.length < 3 || u.length > 20) return 'Kullanıcı adı 3-20 karakter olmalı';
  if (/\s/.test(u)) return 'Kullanıcı adında boşluk kullanamazsınız';
  if (/^[0-9]/.test(u)) return 'Kullanıcı adı sayı ile başlayamaz';
  if (/[çğıöşüÇĞİÖŞÜ]/.test(u)) return 'Türkçe karakter kullanamazsınız';
  if (/[._]$/.test(u)) return 'Kullanıcı adı nokta veya alt çizgi ile bitemez';
  if (existingUsernames.includes(u.toLowerCase())) return 'Bu kullanıcı adı zaten alınmış';
  return true;
}
function validatePassword(p, username){
  if (!p) return 'Şifre boş olamaz';
  if (p.length < 8) return 'Şifre en az 8 karakter olmalı';
  if (/\s/.test(p)) return 'Şifre boşluk içeremez';
  if (username && p === username) return 'Şifre kullanıcı adı ile aynı olamaz';
  if (!/[A-Z]/.test(p)) return 'Şifre en az 1 büyük harf içermeli';
  if (!/[a-z]/.test(p)) return 'Şifre en az 1 küçük harf içermeli';
  if (!/[0-9]/.test(p)) return 'Şifre en az 1 sayı içermeli';
  return true;
}
// "0532 123 45 67", "+90 532…", "532-123-4567" → "5321234567"
function normalizePhone(p){
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('90')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}
function validatePhone(p){
  if (!String(p || '').trim()) return 'Telefon numarası boş olamaz';
  if (!/^5[0-9]{9}$/.test(normalizePhone(p))) return 'Geçerli bir cep telefonu giriniz (ör. 532 123 45 67)';
  return true;
}
function validateDOB(d){
  if (!d) return false;
  const birth = new Date(d);
  if (isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthdayThisYear = (today.getMonth() < birth.getMonth()) ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthdayThisYear) age--;
  return age >= 13;
}

/* ─── MODAL HELPERS ─── */
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
// Close on backdrop click (delegated)
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) closeModal(this.id);
  });
  overlay.querySelector('.modal-box')?.addEventListener('click', e => e.stopPropagation());
});

/* ─── TOAST ─── */
/* ─── TOAST: üstten inen bildirim hapı (dokun ya da yukarı kaydır → kapanır) ─── */
const TOAST_GLYPHS = {
  success: '<path d="M7 12.4l3.2 3.2L17 8.6"/>',
  error:   '<path d="M12 7v6.2"/><path d="M12 16.8v.01"/>',
  info:    '<path d="M12 10.8v6"/><path d="M12 7.2v.01"/>',
};
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t._dismiss ? t._dismiss(true) : t.remove());
  const text = String(msg);
  const isError = /hata|başarısız|gönderilemedi|silinemedi|geçersiz|yok|gerek/i.test(text);
  const isSuccess = /başarılı|eklendi|kaydedildi|temizlendi|gönderildi|tamamlandı|kopyalandı|onaylandı|kullanıldı|güncellendi/i.test(text);
  const type = isError ? 'error' : isSuccess ? 'success' : 'info';
  const duration = Math.min(6000, (type === 'error' ? 3600 : 2800) + text.length * 25);

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.style.setProperty('--toast-dur', `${duration}ms`);
  el.innerHTML = `
    <span class="toast-badge" aria-hidden="true">
      <svg class="toast-ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.5"/></svg>
      <svg class="toast-glyph" viewBox="0 0 24 24">${TOAST_GLYPHS[type]}</svg>
    </span>
    <span class="toast-message"></span>`;
  el.querySelector('.toast-message').textContent = text;

  let timer;
  const dismiss = (instant) => {
    if (!el.isConnected || el.classList.contains('toast-leaving')) return;
    clearTimeout(timer);
    if (instant) { el.remove(); return; }
    el.classList.add('toast-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400);
  };
  el._dismiss = dismiss;

  // Yukarı kaydırarak kapatma; kısa dokunuş da kapatır
  let startY = null, dy = 0;
  el.addEventListener('pointerdown', e => { startY = e.clientY; dy = 0; el.classList.add('toast-drag'); el.setPointerCapture?.(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (startY === null) return;
    dy = Math.min(0, e.clientY - startY);
    el.style.setProperty('--toast-dy', `${dy}px`);
  });
  const release = () => {
    if (startY === null) return;
    startY = null;
    el.classList.remove('toast-drag');
    if (dy < -24 || Math.abs(dy) < 4) dismiss();
    else el.style.setProperty('--toast-dy', '0px');
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  document.body.appendChild(el);
  timer = setTimeout(dismiss, duration);
}

/* ─── KOZMETİK MAĞAZASI ─── */
const COSMETICS = [
  // Çerçeveler
  { id:'frame_gold',    type:'frame',   name:'Altın Çerçeve',    emoji:'⭐', price:150, desc:'Altın renkli profil çerçevesi' },
  { id:'frame_royal',   type:'frame',   name:'Kraliyet',          emoji:'👑', price:300, desc:'Mor & altın degradeli çerçeve' },
  { id:'frame_neon',    type:'frame',   name:'Neon',              emoji:'⚡', price:200, desc:'Cyan neon glow çerçevesi' },
  { id:'frame_fire',    type:'frame',   name:'Ateş',              emoji:'🔥', price:350, desc:'Kırmızı-turuncu ateş çerçeve' },
  { id:'frame_galaxy',  type:'frame',   name:'Galaksi',           emoji:'🌌', price:400, desc:'Mor galaksi çerçevesi' },
  // Kart arka planı
  { id:'card_midnight', type:'card_bg', name:'Gece Yarısı',       emoji:'🌙', price:120, desc:'Derin lacivert arka plan' },
  { id:'card_forest',   type:'card_bg', name:'Orman',             emoji:'🌿', price:120, desc:'Koyu yeşil arka plan' },
  { id:'card_sunset',   type:'card_bg', name:'Gün Batımı',        emoji:'🌅', price:150, desc:'Turuncu-kırmızı gradient' },
  { id:'card_ocean',    type:'card_bg', name:'Okyanus',           emoji:'🌊', price:150, desc:'Derin mavi gradient' },
  // Unvanlar
  { id:'title_aktif',   type:'title',   name:'⚡ Aktif Üye',      emoji:'⚡', price:80,  desc:'Aktif üye unvanı', val:'⚡ Aktif Üye' },
  { id:'title_oncu',    type:'title',   name:'🚀 Öncü',           emoji:'🚀', price:160, desc:'Öncü üye unvanı',  val:'🚀 Öncü' },
  { id:'title_legend',  type:'title',   name:'🌟 Legend',         emoji:'🌟', price:250, desc:'Efsane unvanı',    val:'🌟 Legend' },
  { id:'title_scholar', type:'title',   name:'📚 Akademisyen',    emoji:'📚', price:120, desc:'Akademisyen unvanı', val:'📚 Akademisyen' },
];

let _cosmTabActive = 'frame';

function toggleCosmAccordion(btn) {
  btn.closest('.cosm-accordion-wrap').classList.toggle('open');
}

function switchCosmTab(btn, type) {
  document.querySelectorAll('.cosm-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _cosmTabActive = type;
  renderCosmGrid(type);
}

function renderCosmGrid(type) {
  const grid = document.getElementById('cosm-grid');
  if (!grid) return;
  const items  = COSMETICS.filter(c => c.type === type);
  const owned  = state.user.cosmetics || {};
  const gcoin  = Number(state.user.gcoin || 0);

  grid.innerHTML = items.map(item => {
    const equip  = owned[type] === item.id;
    const canBuy = gcoin >= item.price && !equip;
    return `<div class="cosm-card ${equip ? 'cosm-equipped' : ''}">
      <div class="cosm-preview cosm-prev-${item.id}">
        <span class="cosm-prev-emoji">${item.emoji}</span>
      </div>
      <div class="cosm-name">${item.name}</div>
      <div class="cosm-desc">${item.desc}</div>
      <div class="cosm-footer">
        ${equip
          ? `<button class="cosm-btn cosm-btn-unequip" onclick="unequipCosmetic('${type}')">Çıkar</button>`
          : `<button class="cosm-btn ${canBuy?'cosm-btn-buy':'cosm-btn-locked'}"
               onclick="buyCosmetic('${item.id}')" ${canBuy?'':'disabled'}>
               💎 ${item.price}
             </button>`}
      </div>
    </div>`;
  }).join('');
}

async function buyCosmetic(itemId) {
  const item = COSMETICS.find(c => c.id === itemId);
  if (!item) return;
  const gcoin = Number(state.user.gcoin || 0);
  if (gcoin < item.price) { showToast('Yeterli GCoin yok 💎'); return; }

  try {
    const newGcoin = gcoin - item.price;
    await sbUpdateStats(state.user.id, { gcoin: newGcoin });
    const newCosmetics = { ...state.user.cosmetics, [item.type]: item.id };
    await sb.from('profiles').update({ equipped_cosmetics: newCosmetics }).eq('id', state.user.id);
    state.user.gcoin = newGcoin;
    state.user.cosmetics = newCosmetics;
    refreshCoinDisplays();
    applyCosmetics();
    renderCosmGrid(item.type);
    showToast(item.emoji + ' ' + item.name + ' takıldı!');
  } catch(e) {
    showToast('Hata: ' + (e.message || 'İşlem başarısız'));
  }
}

async function unequipCosmetic(type) {
  try {
    const newCosmetics = { ...state.user.cosmetics, [type]: '' };
    await sb.from('profiles').update({ equipped_cosmetics: newCosmetics }).eq('id', state.user.id);
    state.user.cosmetics = newCosmetics;
    applyCosmetics();
    renderCosmGrid(type);
    showToast('Kozmetik çıkarıldı');
  } catch(e) { showToast('Hata oluştu'); }
}

function applyCosmetics() {
  const c = state.user.cosmetics || {};

  // Frame
  const allFrames = COSMETICS.filter(x => x.type === 'frame').map(x => 'cosm-' + x.id);
  document.querySelectorAll('.user-avatar, .profile-avatar, .edit-avatar').forEach(el => {
    el.classList.remove(...allFrames);
    if (c.frame) el.classList.add('cosm-' + c.frame);
  });

  // Card bg
  const profileCard = document.querySelector('.profile-card');
  const allCards = COSMETICS.filter(x => x.type === 'card_bg').map(x => 'cosm-' + x.id);
  if (profileCard) {
    profileCard.classList.remove(...allCards);
    if (c.card_bg) profileCard.classList.add('cosm-' + c.card_bg);
  }

  // Title
  const titleEl = document.getElementById('profile-cosm-title');
  if (titleEl) {
    const t = COSMETICS.find(x => x.id === c.title);
    titleEl.textContent = t ? t.val : '';
    titleEl.style.display = t ? '' : 'none';
  }
}

/* ─── ROZETLER & UNVANLAR ───
   Rozetler onaylanmış görev gönderimlerinden (task_submissions + tasks.category) ve
   user_stats'tan hesaplanır. Kazanılan rozet id'leri ile seçilen unvan
   profiles.equipped_cosmetics içinde { badges: [...], badge_title: 'id' } olarak
   saklanır; arkadaşlar bu alanı okuyarak rozetleri ve unvanı görür. */
const BADGE_TIERS = {
  bronz: { label: 'Bronz', color: '#f0a36b' },
  gumus: { label: 'Gümüş', color: '#cbd5e1' },
  altin: { label: 'Altın', color: '#ffd966' },
  pass:  { label: 'Genco Pass', color: '#c084fc' },
};

const GENCO_BADGES = [
  { id: 'b-first',    emoji: '🎯', name: 'İlk Adım',          title: 'Çaylak',            tier: 'bronz', goal: 1,  req: 'İlk görevini tamamla',               count: c => c.total },
  { id: 'b-cevre',    emoji: '♻️', name: 'Çevre Gönüllüsü',   title: 'Çevre Gönüllüsü',   tier: 'bronz', goal: 3,  req: '3 Çevre görevi tamamla',             count: c => c.cat['Çevre'] },
  { id: 'b-doga',     emoji: '🌿', name: 'Doğa Kaşifi',       title: 'Doğa Kaşifi',       tier: 'bronz', goal: 3,  req: '3 Doğa görevi tamamla',              count: c => c.cat['Doğa'] },
  { id: 'b-spor',     emoji: '⚽', name: 'Sporsever',         title: 'Sporsever',         tier: 'bronz', goal: 3,  req: '3 Spor görevi tamamla',              count: c => c.cat['Spor'] },
  { id: 'b-saglik',   emoji: '💚', name: 'Formda',            title: 'Sağlık Elçisi',     tier: 'bronz', goal: 3,  req: '3 Sağlık görevi tamamla',            count: c => c.cat['Sağlık'] },
  { id: 'b-egitim',   emoji: '📚', name: 'Kitap Kurdu',       title: 'Kitap Kurdu',       tier: 'bronz', goal: 3,  req: '3 Eğitim görevi tamamla',            count: c => c.cat['Eğitim'] },
  { id: 'b-sosyal',   emoji: '🦋', name: 'Sosyal Kelebek',    title: 'Sosyal Kelebek',    tier: 'bronz', goal: 3,  req: '3 Sosyal görev tamamla',             count: c => c.cat['Sosyal'] },
  { id: 'b-medya',    emoji: '📱', name: 'İçerik Üreticisi',  title: 'Influencer',        tier: 'bronz', goal: 3,  req: '3 Sosyal Medya görevi tamamla',      count: c => c.cat['Sosyal Medya'] },
  { id: 'b-yasam',    emoji: '🏖️', name: 'Alanya Gezgini',    title: 'Alanya Gezgini',    tier: 'bronz', goal: 3,  req: '3 Yaşam görevi tamamla',             count: c => c.cat['Yaşam'] },
  { id: 'b-hayvan',   emoji: '🐾', name: 'Patili Dost',       title: 'Patili Dost',       tier: 'bronz', goal: 2,  req: '2 Hayvanlar görevi tamamla',         count: c => c.cat['Hayvanlar'] },
  { id: 'b-etkinlik', emoji: '🎟️', name: 'Etkinlik Müdavimi', title: 'Sahne Tozu',        tier: 'bronz', goal: 2,  req: '2 Etkinlik görevi tamamla',          count: c => c.cat['Etkinlik'] },
  { id: 'b-tasks10',  emoji: '🏹', name: 'Görev Avcısı',      title: 'Görev Avcısı',      tier: 'gumus', goal: 10, req: 'Toplam 10 görev tamamla',            count: c => c.total },
  { id: 'b-multi',    emoji: '🧭', name: 'Çok Yönlü',         title: 'Çok Yönlü',         tier: 'gumus', goal: 5,  req: '5 farklı kategoride görev tamamla',  count: c => c.catCount },
  { id: 'b-streak7',  emoji: '🔥', name: 'Durdurulamaz',      title: 'Durdurulamaz',      tier: 'gumus', goal: 7,  req: '7 günlük seri yap',                  count: c => c.streak },
  { id: 'b-master',   emoji: '🏆', name: 'Alan Uzmanı',       title: 'Alan Uzmanı',       tier: 'altin', goal: 10, req: 'Tek bir kategoride 10 görev tamamla', count: c => c.maxCat },
  { id: 'b-tasks50',  emoji: '👑', name: 'Genco Efsanesi',    title: 'Genco Efsanesi',    tier: 'altin', goal: 50, req: 'Toplam 50 görev tamamla',            count: c => c.total },
];

// Genco Pass rozet/unvanları görevlerden hesaplanmaz; equipped_cosmetics.gpass.badges içinde
// tam tanımıyla saklanır. Görülen her profilin (kendi + arkadaşlar) Pass rozetleri buraya kaydedilir.
const PASS_BADGE_REG = {};
function registerPassBadges(cos) {
  (cos?.gpass?.badges || []).forEach(b => {
    if (!b?.id) return;
    PASS_BADGE_REG[b.id] = { ...b, tier: 'pass', goal: 1, cur: 1, earned: true, pass: true,
      req: b.req || (b.legend ? `${b.seasonName || 'Sezon'} sonunda 30. seviyeye ulaştı · bir daha kazanılamaz` : `Genco Pass ${b.seasonName || ''} sezonu ödülü`.trim()) };
  });
}
function passBadgesOf(cos, kind) {
  registerPassBadges(cos);
  return (cos?.gpass?.badges || []).filter(b => !kind || b.kind === kind).map(b => PASS_BADGE_REG[b.id]).filter(Boolean);
}
function badgeById(id) { return GENCO_BADGES.find(b => b.id === id) || PASS_BADGE_REG[id]; }

function badgeCounts() {
  const cat = {};
  let approved = 0;
  (state.submissions || []).forEach(s => {
    if (s.status !== 'approved') return;
    approved++;
    const c = normalizeCategoryLabel(s.tasks?.category);
    if (c) cat[c] = (cat[c] || 0) + 1;
  });
  const vals = Object.values(cat);
  return {
    cat,
    total: Math.max(approved, Number(state.user.tasksCompleted || 0)),
    catCount: vals.length,
    maxCat: vals.length ? Math.max(...vals) : 0,
    streak: Number(state.user.streak || 0),
  };
}

function computeBadges() {
  const c = badgeCounts();
  return GENCO_BADGES.map(b => {
    const cur = Math.min(Number(b.count(c) || 0), b.goal);
    return { ...b, cur, earned: cur >= b.goal };
  });
}

// Kazanılan rozetleri profile yazar; yeni rozet varsa kutlama bildirimi gösterir.
async function syncBadges() {
  if (!state.user?.id || state.user.role === 'admin') return;
  const earned = computeBadges().filter(b => b.earned).map(b => b.id);
  const cos = state.user.cosmetics || {};
  const stored = Array.isArray(cos.badges) ? cos.badges : null;
  const fresh = earned.filter(id => !(stored || []).includes(id));
  if (stored && stored.length === earned.length && !fresh.length) return;

  const next = { ...cos, badges: earned };
  if (next.badge_title && !earned.includes(next.badge_title) && !passBadgesOf(next).some(b => b.id === next.badge_title)) next.badge_title = '';
  state.user.cosmetics = next;
  try { await sb.from('profiles').update({ equipped_cosmetics: next }).eq('id', state.user.id); }
  catch (e) { console.warn('Rozetler kaydedilemedi:', e); }

  if (fresh.length === 1) {
    const b = badgeById(fresh[0]);
    showToast(`${b.emoji} Yeni rozet: ${b.name}! “${b.title}” unvanı açıldı`);
  } else if (fresh.length > 1) {
    showToast(`🏅 ${fresh.length} yeni rozet kazandın! Profilinden unvanını seç`);
  }
}

async function loadProfileBadges() {
  if (!state.user?.id) return;
  if (!state.submissions) {
    try { state.submissions = await sbGetMySubmissions(state.user.id); }
    catch (e) { console.warn('Gönderimler yüklenemedi:', e); }
  }
  await syncBadges();
  renderProfileBadges();
}

/* ─── SEVİYE ÇERÇEVELERİ ───
   Her seviye grubuna (Bronz → Legend) ulaşınca o grubun avatar çerçevesi açılır.
   Seçim profiles.equipped_cosmetics.level_frame içinde tutulur:
   yok → ulaşılan en yüksek çerçeve otomatik, 'none' → çerçevesiz, anahtar → o çerçeve. */
const LEVEL_FRAMES = [
  { key: 'bronz',  name: 'Bronz',  level: 'Bronz I',  color: '#e0a070', desc: 'Bakır çift halka, yıldız madalyon' },
  { key: 'gumus',  name: 'Gümüş',  level: 'Gümüş I',  color: '#e2e8f0', desc: 'Cilalı gümüş, parlayan yıldız' },
  { key: 'altin',  name: 'Altın',  level: 'Altın I',  color: '#fcd34d', desc: 'Kanatlı altın yıldız' },
  { key: 'platin', name: 'Platin', level: 'Platin I', color: '#5eead4', desc: 'Platin ışıltısı, kesme taş' },
  { key: 'elmas',  name: 'Elmas',  level: 'Elmas I',  color: '#7dd3fc', desc: 'Prizmatik ışık, parlayan pırlanta' },
  { key: 'legend', name: 'Legend', level: 'Legend I', color: '#f472b6', desc: 'Gökkuşağı hale, mücevherli taç' },
];

// Genco Pass ödülü olan çerçeveler: seviyeye bağlı değil, sahip olunanlar (equipped_cosmetics.gpass.frames) takılabilir
const PASS_FRAMES = [
  { key: 'gp-neon',   name: 'Neon Dalga',        color: '#22d3ee', desc: 'Genco Pass · elektrik mavisi' },
  { key: 'gp-sunset', name: 'Gün Batımı',        color: '#fb923c', desc: 'Genco Pass · Alanya ufku' },
  { key: 'gp-galaxy', name: 'Galaksi',           color: '#a78bfa', desc: 'Genco Pass · yıldızlı evren' },
  { key: 'gp-toxic',  name: 'Asit Yeşili',       color: '#a3e635', desc: 'Genco Pass · parlayan neon' },
  { key: 'gp-ice',    name: 'Kristal Buz',       color: '#bae6fd', desc: 'Genco Pass · buz kristali' },
  { key: 'gp-lava',   name: 'Lav Akıntısı',      color: '#f43f5e', desc: 'Genco Pass · akan lav' },
];
// Günlük ödülle kazanılan çerçeveler (Pass sezon ödüllerine karışmasın diye ayrı liste)
const REWARD_FRAMES = [
  { key: 'dr-safak', name: 'Şafak Tacı', color: '#fbbf24', desc: 'Günlük ödül · 5. gün çerçevesi' },
];
const OWNABLE_FRAMES = [...PASS_FRAMES, ...REWARD_FRAMES];
function frameDefByKey(key) { return LEVEL_FRAMES.find(f => f.key === key) || OWNABLE_FRAMES.find(f => f.key === key); }
function ownedPassFrames(cos) { return (cos?.gpass?.frames || []).filter(k => OWNABLE_FRAMES.some(f => f.key === k)); }

function frameTierIndex(xp) {
  const rank = levelRank(xpToLevel(Number(xp) || 0));
  let idx = 0;
  LEVEL_FRAMES.forEach((f, i) => { if (rank >= levelRank(f.level)) idx = i; });
  return idx;
}

// Kullanıcının taktığı çerçeve (arkadaşlar için de aynı kural; seviyesini aşan çerçeve gösterilmez)
function resolveLevelFrame(cos, xp) {
  const pick = cos?.level_frame;
  const max = frameTierIndex(xp);
  registerPassBadges(cos); // arkadaş kartları da buradan geçer: Pass unvanları tanınsın
  if (pick === 'none') return '';
  if (pick && ownedPassFrames(cos).includes(pick)) return pick;
  if (!pick) return LEVEL_FRAMES[max].key;
  const i = LEVEL_FRAMES.findIndex(f => f.key === pick);
  return i < 0 ? LEVEL_FRAMES[max].key : LEVEL_FRAMES[Math.min(i, max)].key;
}

function applyLevelFrame(el, key) {
  if (!el) return;
  [...LEVEL_FRAMES, ...OWNABLE_FRAMES].forEach(f => el.classList.remove('lf-' + f.key));
  el.classList.toggle('lf-on', !!key);
  if (key) el.classList.add('lf-' + key);
}

function levelFrameClass(key) { return key ? `lf-on lf-${key}` : ''; }

async function setLevelFrame(key) {
  try {
    await saveBadgeCosmetics({ level_frame: key });
    rerenderBadgeViews();
    const f = frameDefByKey(key);
    showToast(f ? `${f.name} çerçeve takıldı ✨` : 'Çerçeve çıkarıldı');
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Çerçeve kaydedilemedi'));
  }
}

function renderFrameEditor() {
  const wrap = document.getElementById('be-frames');
  if (!wrap) return;
  const u = state.user;
  const max = frameTierIndex(u.xp);
  const current = resolveLevelFrame(u.cosmetics, u.xp);
  const initial = escHtml((u.name || u.username || 'U')[0].toUpperCase());
  const avatar = u.profilePhoto
    ? `<span class="lf-demo-av" style="background-image:url('${escHtml(u.profilePhoto)}')"></span>`
    : `<span class="lf-demo-av">${initial}</span>`;
  wrap.innerHTML = LEVEL_FRAMES.map((f, i) => {
    const open = i <= max;
    const on = f.key === current;
    const btn = !open
      ? `<span class="lf-card-lock">🔒 ${escHtml(f.level)}</span>`
      : `<button type="button" class="be-title-btn ${on ? 'off' : ''}" onclick="setLevelFrame('${on ? 'none' : f.key}')">${on ? 'Çıkar' : 'Tak'}</button>`;
    return `<div class="lf-card ${on ? 'on' : ''} ${open ? '' : 'locked'}" style="--tc:${f.color}">
      <span class="lf lf-md lf-on lf-${f.key}">${avatar}</span>
      <b>${escHtml(f.name)}</b>
      <small>${escHtml(f.desc)}</small>
      ${btn}
    </div>`;
  }).join('') + ownedPassFrames(u.cosmetics).map(key => {
    // Genco Pass'ten kazanılan çerçeveler (seviyeden bağımsız, hep açık)
    const f = frameDefByKey(key);
    const on = key === current;
    return `<div class="lf-card lf-card-pass ${on ? 'on' : ''}" style="--tc:${f.color}">
      <span class="lf lf-md lf-on lf-${f.key}">${avatar}</span>
      <b>${escHtml(f.name)}</b>
      <small>${escHtml(f.desc)}</small>
      <button type="button" class="be-title-btn ${on ? 'off' : ''}" onclick="setLevelFrame('${on ? 'none' : f.key}')">${on ? 'Çıkar' : 'Tak'}</button>
    </div>`;
  }).join('');
  // Takılı çerçeveyi görünür alana kaydır
  const onCard = wrap.querySelector('.lf-card.on');
  if (onCard) wrap.scrollLeft = Math.max(0, onCard.offsetLeft - wrap.offsetLeft - 17);
  const next = LEVEL_FRAMES[max + 1];
  const hint = document.getElementById('be-frame-hint');
  if (hint) hint.textContent = next ? `Sıradaki: ${next.name} çerçeve ${next.level} seviyesinde açılır.` : 'Tüm çerçeveleri açtın 👑';
}

const SHOWCASE_MAX = 5;

function badgeTierColor(b) { return BADGE_TIERS[b.tier].color; }

function badgeTitleHTML(badgeId, cos) {
  registerPassBadges(cos || state.user?.cosmetics);
  const b = badgeById(badgeId);
  if (!b) return '';
  return `<span class="bd-title-pill" style="--tc:${badgeTierColor(b)}"><span aria-hidden="true">${b.emoji}</span>${escHtml(b.title)}</span>`;
}

// Vitrindeki rozetler. Kullanıcı hiç seçim yapmadıysa ilk kazanılan 5 rozet gösterilir.
function showcaseIds(cos) {
  cos = cos || {};
  const earned = [...(Array.isArray(cos.badges) ? cos.badges : []), ...passBadgesOf(cos).map(b => b.id)];
  const list = Array.isArray(cos.showcase) ? cos.showcase : earned.slice(0, SHOWCASE_MAX);
  return list.filter(id => earned.includes(id) && badgeById(id)).slice(0, SHOWCASE_MAX);
}

// Başkalarının göreceği küçük rozet dizisi (arama sonucu, arkadaş listesi, profil)
function showcaseMiniHTML(cos, cls = '') {
  const ids = showcaseIds(cos);
  if (!ids.length) return '';
  return `<span class="bd-mini-row ${cls}">${ids.map(id => {
    const b = badgeById(id);
    return `<span class="bd-mini-badge" style="--tc:${badgeTierColor(b)}" title="${escHtml(b.name)}">${b.emoji}</span>`;
  }).join('')}</span>`;
}

async function saveBadgeCosmetics(patch) {
  const next = { ...(state.user.cosmetics || {}), ...patch };
  await sb.from('profiles').update({ equipped_cosmetics: next }).eq('id', state.user.id);
  state.user.cosmetics = next;
}

async function ensureBadgeData() {
  if (!state.submissions && state.user?.id) {
    try { state.submissions = await sbGetMySubmissions(state.user.id); }
    catch (e) { console.warn('Gönderimler yüklenemedi:', e); }
  }
  await syncBadges();
}

function rerenderBadgeViews() {
  renderProfileBadges();
  renderBadgeEditor();
  renderBadgesPage();
  updateTopbarLevel(); // çerçeve değişince üst bardaki avatar da güncellensin
}

/* Profil: isim altında unvan + vitrin, altta rozet sayfasına bağlantı */
async function loadProfileBadges() {
  await ensureBadgeData();
  renderProfileBadges();
}

function renderProfileBadges() {
  const cos = state.user.cosmetics || {};
  applyLevelFrame(document.getElementById('profile-lf'), resolveLevelFrame(cos, state.user.xp));
  const titleEl = document.getElementById('profile-badge-title');
  if (titleEl) {
    const html = badgeTitleHTML(cos.badge_title);
    titleEl.innerHTML = html;
    titleEl.style.display = html ? '' : 'none';
  }
  const sc = document.getElementById('profile-showcase');
  if (sc) {
    const html = showcaseMiniHTML(cos, 'bd-mini-lg');
    sc.innerHTML = html;
    sc.style.display = html ? '' : 'none';
  }
  const list = computeBadges();
  const earned = list.filter(b => b.earned).length;
  const countEl = document.getElementById('profile-badge-count');
  if (countEl) countEl.textContent = `${earned}/${list.length}`;
  const bar = document.getElementById('profile-badge-bar');
  if (bar) bar.style.width = Math.round((earned / list.length) * 100) + '%';
  renderSeasonHistory('profile-season-history');
}

/* Rozetler & Unvanlar sayfası (üç çizgi menüsünden) */
async function loadBadgesPage() {
  renderBadgesPage();
  await ensureBadgeData();
  renderBadgesPage();
}

function renderBadgesPage() {
  const earnedWrap = document.getElementById('bp-earned');
  if (!earnedWrap) return;
  const cos = state.user.cosmetics || {};
  const list = computeBadges();
  const earned = [...list.filter(b => b.earned), ...passBadgesOf(cos)];
  const locked = list.filter(b => !b.earned).sort((a, b) => (b.cur / b.goal) - (a.cur / a.goal));
  const shown = showcaseIds(cos);

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const earnedStd = earned.filter(b => !b.pass).length;
  set('bp-count', earnedStd);
  set('bp-total', '/' + list.length);
  document.getElementById('bp-ring')?.style.setProperty('--p', Math.round((earnedStd / list.length) * 100) + '%');

  const cur = document.getElementById('bp-current');
  if (cur) cur.innerHTML = badgeTitleHTML(cos.badge_title) || '<span class="bp-muted">Takılı unvan yok</span>';
  const frameEl = document.getElementById('bp-frame');
  if (frameEl) {
    const f = frameDefByKey(resolveLevelFrame(cos, state.user.xp));
    frameEl.innerHTML = f ? `<span class="bp-frame-tag" style="--tc:${f.color}">${escHtml(f.name)} çerçeve</span>` : '<span class="bp-muted">Çerçeve yok</span>';
  }
  const show = document.getElementById('bp-showcase');
  if (show) show.innerHTML = showcaseMiniHTML(cos) || '<span class="bp-muted">Vitrin boş</span>';

  earnedWrap.innerHTML = earned.length
    ? earned.map(b => {
        const cls = ['bd-item', 'earned', b.id === cos.badge_title ? 'equipped' : '', shown.includes(b.id) ? 'showcased' : ''].join(' ');
        return `<button type="button" class="${cls}" style="--tc:${badgeTierColor(b)}" onclick="openBadgeDetail('${b.id}')">
          <span class="bd-medal"><span class="bd-emoji">${b.emoji}</span>${shown.includes(b.id) ? '<span class="bd-star" aria-hidden="true">★</span>' : ''}</span>
          <span class="bd-name">${escHtml(b.name)}</span>
        </button>`;
      }).join('')
    : `<div class="bp-empty"><span>🏅</span><b>Henüz rozetin yok</b><small>İlk görevini tamamla, “Çaylak” unvanını kap.</small></div>`;

  const lockedWrap = document.getElementById('bp-locked');
  if (lockedWrap) {
    lockedWrap.innerHTML = locked.length
      ? locked.map(b => {
          const pct = Math.round((b.cur / b.goal) * 100);
          return `<button type="button" class="bp-row" style="--tc:${badgeTierColor(b)}" onclick="openBadgeDetail('${b.id}')">
            <span class="bp-row-medal">${b.emoji}</span>
            <span class="bp-row-copy">
              <b>${escHtml(b.name)} <em>${BADGE_TIERS[b.tier].label}</em></b>
              <small>${escHtml(b.req)} · <span>“${escHtml(b.title)}”</span></small>
              <span class="bp-row-bar"><i style="width:${pct}%"></i></span>
            </span>
            <span class="bp-row-num">${b.cur}/${b.goal}</span>
          </button>`;
        }).join('')
      : `<div class="bp-empty"><span>👑</span><b>Hepsini topladın!</b><small>Tüm rozetler senin.</small></div>`;
  }
}

/* Profili Düzenle: unvan tak/çıkar + rozet vitrini */
async function loadBadgeEditor() {
  renderBadgeEditor();
  await ensureBadgeData();
  renderBadgeEditor();
}

function renderBadgeEditor() {
  const titles = document.getElementById('be-titles');
  if (!titles) return;
  const u = state.user;
  const cos = u.cosmetics || {};
  const earned = [...computeBadges().filter(b => b.earned), ...passBadgesOf(cos)];
  const current = cos.badge_title && earned.some(b => b.id === cos.badge_title) ? cos.badge_title : '';
  const shown = showcaseIds(cos);

  // Önizleme: arkadaşların seni böyle görür
  const av = document.getElementById('be-av');
  if (av) {
    const initial = (u.name || u.username || 'U')[0].toUpperCase();
    av.textContent = u.profilePhoto ? '' : initial;
    av.style.backgroundImage = u.profilePhoto ? `url(${u.profilePhoto})` : '';
  }
  applyLevelFrame(document.getElementById('be-lf'), resolveLevelFrame(cos, u.xp));
  renderFrameEditor();
  const nameEl = document.getElementById('be-name');
  if (nameEl) nameEl.textContent = u.name || u.username || '';
  const tEl = document.getElementById('be-title');
  if (tEl) tEl.innerHTML = badgeTitleHTML(current) || '<span class="be-muted">Unvan takılı değil</span>';
  const sEl = document.getElementById('be-show');
  if (sEl) sEl.innerHTML = showcaseMiniHTML(cos) || '<span class="be-muted">Vitrin boş</span>';

  const section = document.getElementById('be-section');
  if (section) section.classList.toggle('be-empty', !earned.length);
  if (!earned.length) {
    titles.innerHTML = `<div class="be-empty-box"><span>🔒</span><div><b>Henüz unvanın yok</b><small>Görev tamamlayıp rozet kazandıkça unvanlar burada açılır.</small></div><button type="button" onclick="goPage('badges')">Rozetleri gör</button></div>`;
  } else {
    // Takılı unvan en üstte
    const ordered = [...earned].sort((a, b) => (b.id === current) - (a.id === current));
    titles.innerHTML = ordered.map(b => {
      const on = b.id === current;
      return `<div class="be-title ${on ? 'on' : ''}" style="--tc:${badgeTierColor(b)}">
        <span class="be-title-medal">${b.emoji}</span>
        <span class="be-title-copy"><b>${escHtml(b.title)}</b><small>${b.name === b.title ? '' : escHtml(b.name) + ' rozeti · '}${BADGE_TIERS[b.tier].label} rozet</small></span>
        <button type="button" class="be-title-btn ${on ? 'off' : ''}" onclick="setBadgeTitle('${on ? '' : b.id}')">${on ? 'Çıkar' : 'Tak'}</button>
      </div>`;
    }).join('');
  }

  const count = document.getElementById('be-count');
  if (count) count.textContent = `${shown.length}/${SHOWCASE_MAX}`;
  const slots = document.getElementById('be-slots');
  if (slots) {
    slots.innerHTML = Array.from({ length: SHOWCASE_MAX }, (_, i) => {
      const b = badgeById(shown[i]);
      return b
        ? `<button type="button" class="sc-slot filled" style="--tc:${badgeTierColor(b)}" onclick="toggleShowcase('${b.id}')" aria-label="${escHtml(b.name)} vitrinden çıkar"><span>${b.emoji}</span><i class="sc-x" aria-hidden="true"></i></button>`
        : `<span class="sc-slot"><em>${i + 1}</em></span>`;
    }).join('');
  }
  const pick = document.getElementById('be-pick');
  if (pick) {
    pick.innerHTML = earned.map(b => {
      const idx = shown.indexOf(b.id);
      return `<button type="button" class="be-pick-item ${idx >= 0 ? 'on' : ''}" style="--tc:${badgeTierColor(b)}" onclick="toggleShowcase('${b.id}')">
        <span class="be-pick-medal">${b.emoji}${idx >= 0 ? `<i>${idx + 1}</i>` : ''}</span>
        <span class="be-pick-name">${escHtml(b.name)}</span>
      </button>`;
    }).join('');
  }
}

function openBadgeEditor() {
  closeModal('modal-badge');
  openProfileEditor();
  setTimeout(() => document.getElementById('be-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
}

async function toggleShowcase(id) {
  const shown = showcaseIds(state.user.cosmetics);
  let next;
  if (shown.includes(id)) next = shown.filter(x => x !== id);
  else if (shown.length >= SHOWCASE_MAX) { showToast(`Vitrine en fazla ${SHOWCASE_MAX} rozet koyabilirsin`); return; }
  else next = [...shown, id];
  try {
    await saveBadgeCosmetics({ showcase: next });
    rerenderBadgeViews();
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Vitrin kaydedilemedi'));
  }
}

async function setBadgeTitle(id) {
  try {
    await saveBadgeCosmetics({ badge_title: id });
    rerenderBadgeViews();
    const b = badgeById(id);
    showToast(b ? `${b.emoji} “${b.title}” unvanı takıldı` : 'Unvan çıkarıldı');
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Unvan kaydedilemedi'));
  }
}

function openBadgeDetail(id) {
  const b = computeBadges().find(x => x.id === id) || passBadgesOf(state.user.cosmetics).find(x => x.id === id);
  if (!b) return;
  const tier = BADGE_TIERS[b.tier];
  const cos = state.user.cosmetics || {};
  const box = document.getElementById('badge-detail-body');
  const pct = Math.round((b.cur / b.goal) * 100);
  const tags = [
    cos.badge_title === b.id ? '<span class="bdd-tag">✓ Takılı unvan</span>' : '',
    showcaseIds(cos).includes(b.id) ? '<span class="bdd-tag">★ Vitrinde</span>' : '',
  ].join('');
  box.style.setProperty('--tc', tier.color);
  box.innerHTML = `
    <div class="bdd-medal ${b.earned ? 'earned' : 'locked'}"><span>${b.emoji}</span></div>
    <span class="bdd-tier">${tier.label} rozet</span>
    <h3 class="bdd-name">${escHtml(b.name)}</h3>
    <p class="bdd-req">${escHtml(b.req)}</p>
    ${tags ? `<div class="bdd-tags">${tags}</div>` : ''}
    <div class="bdd-unlock">
      <span>Açtığı unvan</span>
      <b>${escHtml(b.title)}</b>
    </div>
    ${b.earned
      ? `<button class="bdd-btn" onclick="openBadgeEditor()">Unvan ve vitrini düzenle</button>`
      : `<div class="bdd-progress"><div class="bdd-bar"><i style="width:${pct}%"></i></div><span>${b.cur}/${b.goal}</span></div>
         <p class="bdd-locked-note">Bu rozeti kazanınca unvanını Profili Düzenle'den takabilirsin.</p>`}
  `;
  openModal('modal-badge');
}

/* ─── CUMA ÇARKI ─── */
const WHEEL_PRIZES = [
  { emoji: '🪙', label: '10 GCoin',  coin: 10,  xp: 0,   color: '#facc15' },
  { emoji: '✨', label: '100 XP',    coin: 0,   xp: 100, color: '#312e81' },
  { emoji: '🪙', label: '25 GCoin',  coin: 25,  xp: 0,   color: '#f97316' },
  { emoji: '⭐', label: '200 XP',    coin: 0,   xp: 200, color: '#1e40af' },
  { emoji: '🪙', label: '50 GCoin',  coin: 50,  xp: 0,   color: '#facc15' },
  { emoji: '✨', label: '50 XP',     coin: 0,   xp: 50,  color: '#4c1d95' },
  { emoji: '🏆', label: '100 GCoin', coin: 100, xp: 0,   color: '#ea580c' },
  { emoji: '🎁', label: '30G+150XP', coin: 30,  xp: 150, color: '#6d28d9' },
];

let wheelSpinning = false;
let wheelAngle = 0;

function isFriday() {
  return new Date().getDay() === 5;
}

async function checkFridayWheel() {
  if ((!isFriday() && !state.beta) || !state.user.id) return;
  try {
    const spin = await sbCheckWeeklySpin(state.user.id);
    if (!spin || state.beta) {
      const btn = document.getElementById('wheel-float-btn');
      if (btn) btn.classList.add('visible');
    }
  } catch (e) { /* silent */ }
}

function drawWheel(rotDeg) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const cx = W / 2, cy = W / 2;
  const r = cx - 4;
  const count = WHEEL_PRIZES.length;
  const arcSize = (2 * Math.PI) / count;
  const rotRad = rotDeg * (Math.PI / 180);

  ctx.clearRect(0, 0, W, W);

  WHEEL_PRIZES.forEach((prize, i) => {
    const start = rotRad + i * arcSize;
    const end   = start + arcSize;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text label
    const lightSlice = ['#facc15','#f97316','#ea580c'].includes(prize.color);
    const textColor  = lightSlice ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arcSize / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px serif';
    ctx.fillText(prize.emoji, r * 0.66, -9);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText(prize.label, r * 0.66, 7);
    ctx.restore();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = '#1e1b4b';
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', cx, cy);
}

function openWheelModal() {
  drawWheel(wheelAngle);
  document.getElementById('wheel-result').classList.remove('show');
  const btn = document.getElementById('wheel-spin-btn');
  if (btn) { btn.disabled = false; btn.textContent = '🎡 Çevir!'; }
  openModal('modal-wheel');
}

async function spinWheel() {
  if (wheelSpinning) return;
  if (!state.user.id) { showToast('Giriş yapman gerekiyor'); return; }

  const spinBtn = document.getElementById('wheel-spin-btn');
  if (spinBtn) { spinBtn.disabled = true; spinBtn.textContent = 'Çevriliyor…'; }
  wheelSpinning = true;

  const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
  const prize = WHEEL_PRIZES[prizeIndex];

  // Calculate final angle so prizeIndex center aligns with pointer (top = -90 deg)
  const sliceDeg = 360 / WHEEL_PRIZES.length;
  const targetFinal = ((-90 - (prizeIndex + 0.5) * sliceDeg) % 360 + 360) % 360;
  const startAngle  = ((wheelAngle % 360) + 360) % 360;
  const delta = targetFinal + 5 * 360 - startAngle;

  const duration = 4000;
  const startTime = performance.now();

  function animate(now) {
    const t    = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 4); // ease-out quartic
    const cur  = startAngle + ease * delta;
    drawWheel(cur % 360);
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelAngle = ((startAngle + delta) % 360 + 360) % 360;
      drawWheel(wheelAngle);
      wheelSpinning = false;
      onSpinComplete(prize);
    }
  }
  requestAnimationFrame(animate);
}

async function onSpinComplete(prize) {
  // Build prize label
  const parts = [];
  if (prize.coin > 0) parts.push(`+${prize.coin} 🪙`);
  if (prize.xp  > 0) parts.push(`+${prize.xp} ⚡`);
  const prizeLabel = parts.join(' · ');

  // Show result overlay
  const overlay   = document.getElementById('wheel-result');
  const emojiEl   = document.getElementById('wheel-result-emoji');
  const textEl    = document.getElementById('wheel-result-text');
  const barFill   = document.getElementById('wro-bar-fill');
  if (emojiEl) emojiEl.textContent = prize.emoji;
  if (textEl)  textEl.textContent  = prizeLabel;
  if (overlay) overlay.classList.add('show');

  // Animate progress bar (3s countdown)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (barFill) barFill.style.width = '100%';
    });
  });

  // 1. Spin kaydı (hata olsa da devam et)
  try { await sbRecordWeeklySpin(state.user.id, prize.coin, prize.xp); } catch (_) {}

  // 2. İstatistik güncelle
  try {
    const newCoin = (state.user.coin || 0) + prize.coin;
    const newXp   = (state.user.xp   || 0) + prize.xp;
    await sbUpdateStats(state.user.id, { coin: newCoin, xp: newXp });
    state.user.coin  = newCoin;
    state.user.xp    = newXp;
    state.user.level = seasonTier(newXp, state.user.cosmetics);
    refreshCoinDisplays();
  } catch (e) {
    showToast('İstatistik güncellenemedi: ' + (e.message || ''));
  }

  // 3. Bildirim gönder
  try {
    await sbAddNotification(
      state.user.id,
      '🎡 Şans Çarkı Ödülü',
      `Tebrikler! Çarktan ${prizeLabel} kazandın.`,
      'spin'
    );
  } catch (_) {}

  // Auto-close after 3s
  setTimeout(() => {
    closeModal('modal-wheel');
    if (overlay) overlay.classList.remove('show');
    if (barFill) barFill.style.transition = 'none';
    if (barFill) { barFill.style.width = '0%'; }
    requestAnimationFrame(() => {
      if (barFill) barFill.style.transition = 'width 3s linear';
    });
    const floatBtn = document.getElementById('wheel-float-btn');
    if (floatBtn) floatBtn.classList.remove('visible');
  }, 3000);
}

/* ─── KGOİ (Kim Genco Olmak İster) ───
   Haftalık, "Kim Milyoner Olmak İster" tarzı bilgi yarışması. Her kullanıcı
   7 günde bir oynayabiliyor; sorular ISO hafta numarasına göre deterministik
   şekilde havuzdan seçiliyor, böylece herkes o hafta aynı 10 soruyu görüyor
   ve hafta değişince otomatik yenileniyor. */

// PLACEHOLDER soru havuzu — gerçek sorular/veriler daha sonra buraya
// eklenecek/değiştirilecek. Havuz büyüdükçe haftalık çeşitlilik de artar.
const KGOI_QUESTION_POOL = [
  { q: 'Alanya hangi ile bağlı bir ilçedir?', options: ['Antalya', 'Mersin', 'Muğla', 'Isparta'], correct: 0 },
  { q: 'Alanya Kalesi hangi döneme aittir?', options: ['Selçuklu', 'Osmanlı', 'Bizans', 'Roma'], correct: 0 },
  { q: 'Genco platformunda görev tamamlayınca ne kazanırsın?', options: ['Sadece rozet', 'Coin ve XP', 'Sadece XP', 'Hiçbir şey'], correct: 1 },
  { q: 'Genco\'da en yüksek üyelik seviyesi hangisidir?', options: ['Bronz', 'Altın', 'Legend', 'Gümüş'], correct: 2 },
  { q: 'Kızıl Kule (Kızılkule) hangi şehirdedir?', options: ['Alanya', 'Side', 'Manavgat', 'Kemer'], correct: 0 },
  { q: 'Türkiye\'nin başkenti neresidir?', options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], correct: 1 },
  { q: 'Bir yılda kaç mevsim vardır?', options: ['2', '3', '4', '5'], correct: 2 },
  { q: 'Güneş sistemimizdeki en büyük gezegen hangisidir?', options: ['Dünya', 'Mars', 'Jüpiter', 'Satürn'], correct: 2 },
  { q: '"Damla düşe düşe göl olur" atasözü neyi anlatır?', options: ['Sabrın önemini', 'Paranın değerini', 'Zamanın hızını', 'Dostluğu'], correct: 0 },
  { q: 'İnsan vücudundaki en büyük organ hangisidir?', options: ['Kalp', 'Karaciğer', 'Deri', 'Akciğer'], correct: 2 },
  { q: 'Alanya\'da yaz aylarında en çok hangi spor dalı popülerdir?', options: ['Kayak', 'Yüzme', 'Buz pateni', 'Halı saha (futbol)'], correct: 3 },
  { q: 'Genco Lig turnuvasında bir takım kaç saha oyuncusundan oluşur?', options: ['5', '7', '9', '11'], correct: 1 },
  { q: 'Dünyanın en hızlı kara hayvanı hangisidir?', options: ['Aslan', 'Çita', 'At', 'Antilop'], correct: 1 },
  { q: 'Bir dik üçgende en uzun kenara ne denir?', options: ['Dikey kenar', 'Taban', 'Hipotenüs', 'Yükseklik'], correct: 2 },
  { q: 'Türkiye\'de kullanılan para birimi nedir?', options: ['Euro', 'Dolar', 'Lira', 'Sterlin'], correct: 2 },
  { q: 'Ay, Dünya etrafındaki turunu ortalama kaç günde tamamlar?', options: ['1 gün', '7 gün', '27-28 gün', '100 gün'], correct: 2 },
  { q: 'Genco AI asistanı uygulamada hangi simgeyle temsil edilir?', options: ['Robot/yıldız simgesi', 'Kalp', 'Bayrak', 'Anahtar'], correct: 0 },
  { q: 'Bir haftada kaç gün vardır?', options: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Fotosentez bitkilerde hangi organelde gerçekleşir?', options: ['Mitokondri', 'Kloroplast', 'Çekirdek', 'Ribozom'], correct: 1 },
  { q: 'Dünyanın en yüksek dağı hangisidir?', options: ['Everest', 'K2', 'Kilimanjaro', 'Ağrı Dağı'], correct: 0 },
  { q: 'Alanya\'nın simgesi sayılan tarihi yapı hangisidir?', options: ['Galata Kulesi', 'Kızılkule', 'Anıtkabir', 'Truva Atı'], correct: 1 },
  { q: 'Bir düzgün altıgenin kaç kenarı vardır?', options: ['5', '6', '7', '8'], correct: 1 },
];

// Ödül basamakları — her soru bir öncekinden daha değerli. Toplamı ve tek
// tek değerleri admin panelinden yönetmek istersen ileride bu diziyi bir
// veritabanı tablosuna taşıyabilirsin.
const KGOI_LADDER = [
  { coin: 10,  xp: 15  },
  { coin: 15,  xp: 20  },
  { coin: 20,  xp: 25  },
  { coin: 30,  xp: 35  },
  { coin: 40,  xp: 50  },
  { coin: 55,  xp: 65  },
  { coin: 70,  xp: 85  },
  { coin: 90,  xp: 110 },
  { coin: 120, xp: 150 },
  { coin: 160, xp: 200 },
];

function getIsoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function _kgoiHashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function _kgoiSeededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function getWeeklyKgoiQuestions() {
  const weekKey = getIsoWeekKey();
  const rand = _kgoiSeededRandom(_kgoiHashSeed(weekKey));
  const pool = [...KGOI_QUESTION_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, Math.min(10, pool.length));
  return picked.map((item, idx) => {
    const optRand = _kgoiSeededRandom(_kgoiHashSeed(weekKey + '-' + idx));
    const order = item.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(optRand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { q: item.q, options: order.map(i => item.options[i]), correct: order.indexOf(item.correct) };
  });
}

let _kgoiState = null;
let _kgoiCountdownTimer = null;

async function renderKgoiPage() {
  const stage = document.getElementById('kgoi-stage');
  if (!stage || !state.user?.id) return;
  if (_kgoiCountdownTimer) { clearInterval(_kgoiCountdownTimer); _kgoiCountdownTimer = null; }
  stage.innerHTML = '<div class="kgoi-loading">Yükleniyor…</div>';
  try {
    const last = await sbGetLastKgoiAttempt(state.user.id);
    const cooldownMs = last ? (new Date(last.created_at).getTime() + 7 * 24 * 60 * 60 * 1000) - Date.now() : 0;
    if (last && cooldownMs > 0) {
      renderKgoiCooldown(last, cooldownMs);
    } else {
      renderKgoiIntro();
    }
  } catch (e) {
    console.error('KGOİ yüklenemedi:', e);
    stage.innerHTML = '<div class="kgoi-loading">Yarışma yüklenemedi, tekrar dene. (kgoi_attempts tablosu kurulu mu?)</div>';
  }
}

function renderKgoiIntro() {
  const stage = document.getElementById('kgoi-stage');
  if (!stage) return;
  const totalCoin = KGOI_LADDER.reduce((sum, t) => sum + t.coin, 0);
  const totalXp = KGOI_LADDER.reduce((sum, t) => sum + t.xp, 0);
  stage.innerHTML = `
    <div class="kgoi-intro">
      <div class="kgoi-ladder-strip">
        ${KGOI_LADDER.map((_, i) => `<div class="kgoi-rung"><span class="kgoi-rung-num">${i + 1}</span></div>`).join('')}
      </div>
      <div class="kgoi-intro-rules">
        <div class="kgoi-rule"><span class="kgoi-rule-icon">❓</span><span>10 soru, her biri bir öncekinden değerli</span></div>
        <div class="kgoi-rule"><span class="kgoi-rule-icon">🔥</span><span>Sorular her hafta otomatik yenileniyor</span></div>
        <div class="kgoi-rule"><span class="kgoi-rule-icon">⏳</span><span>7 günde bir kez oynayabilirsin</span></div>
        <div class="kgoi-rule"><span class="kgoi-rule-icon">🏆</span><span>10/10 yaparsan toplam ${totalCoin} 🪙 + ${totalXp} ⚡ kazanırsın</span></div>
      </div>
      <button class="kgoi-start-btn" onclick="startKgoiQuiz()">Yarışmayı Başlat 👑</button>
    </div>`;
}

function startKgoiQuiz() {
  const questions = getWeeklyKgoiQuestions();
  if (!questions.length) { showToast('Bu hafta için soru bulunamadı'); return; }
  _kgoiState = { questions, index: 0, correctCount: 0, coinEarned: 0, xpEarned: 0, locked: false };
  renderKgoiQuestion();
}

function renderKgoiQuestion() {
  const stage = document.getElementById('kgoi-stage');
  const s = _kgoiState;
  if (!stage || !s) return;
  const q = s.questions[s.index];
  const tier = KGOI_LADDER[s.index];
  const pct = Math.round((s.index / s.questions.length) * 100);
  const letters = ['A', 'B', 'C', 'D'];

  stage.innerHTML = `
    <div class="kgoi-game">
      <div class="kgoi-progress">
        <span class="kgoi-progress-label">SORU <strong>${s.index + 1}</strong> / ${s.questions.length}</span>
        <span class="kgoi-progress-prize">🪙 ${tier.coin} · ⚡ ${tier.xp}</span>
      </div>
      <div class="kgoi-progress-track"><div class="kgoi-progress-fill" style="width:${pct}%"></div></div>

      <div class="kgoi-ladder-strip kgoi-ladder-strip-compact">
        ${s.questions.map((_, i) => `<div class="kgoi-rung ${i < s.index ? 'done' : ''} ${i === s.index ? 'current' : ''}"><span class="kgoi-rung-num">${i + 1}</span></div>`).join('')}
      </div>

      <div class="kgoi-question-card"><div class="kgoi-question-text">${escHtml(q.q)}</div></div>

      <div class="kgoi-options" id="kgoi-options">
        ${q.options.map((opt, i) => `
          <button class="kgoi-opt" onclick="selectKgoiAnswer(${i})">
            <span class="kgoi-opt-key">${letters[i]}</span>
            <span class="kgoi-opt-text">${escHtml(opt)}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function selectKgoiAnswer(i) {
  const s = _kgoiState;
  if (!s || s.locked) return;
  s.locked = true;
  const q = s.questions[s.index];
  const opts = document.querySelectorAll('#kgoi-options .kgoi-opt');
  opts.forEach(b => b.disabled = true);
  opts[i].classList.add('kgoi-opt-selected');

  setTimeout(() => {
    opts[i].classList.remove('kgoi-opt-selected');
    const correct = i === q.correct;
    opts[q.correct].classList.add('kgoi-opt-correct');
    if (!correct) opts[i].classList.add('kgoi-opt-wrong');

    if (correct) {
      const tier = KGOI_LADDER[s.index];
      s.correctCount++;
      s.coinEarned += tier.coin;
      s.xpEarned += tier.xp;
    }

    setTimeout(() => {
      s.index++;
      s.locked = false;
      if (s.index >= s.questions.length) finishKgoiQuiz();
      else renderKgoiQuestion();
    }, 1400);
  }, 700);
}

async function finishKgoiQuiz() {
  const s = _kgoiState;
  const stage = document.getElementById('kgoi-stage');
  if (!stage || !s) return;
  stage.innerHTML = '<div class="kgoi-loading">Sonuçlar kaydediliyor…</div>';

  const weekKey = getIsoWeekKey();
  try {
    await sbRecordKgoiAttempt(state.user.id, weekKey, s.correctCount, s.coinEarned, s.xpEarned);
    const newCoin = (state.user.coin || 0) + s.coinEarned;
    const newXp   = (state.user.xp   || 0) + s.xpEarned;
    await sbUpdateStats(state.user.id, { coin: newCoin, xp: newXp });
    state.user.coin  = newCoin;
    state.user.xp    = newXp;
    state.user.level = seasonTier(newXp, state.user.cosmetics);
    refreshCoinDisplays();
    try {
      await sbAddNotification(state.user.id, '👑 KGOİ Sonucun',
        `${s.correctCount}/${s.questions.length} doğru yaptın — +${s.coinEarned} 🪙 +${s.xpEarned} ⚡ kazandın!`, 'kgoi');
    } catch (_) {}
  } catch (e) {
    console.error('KGOİ kaydedilemedi:', e);
    showToast('Sonuç kaydedilemedi: ' + (e.message || ''));
  }

  renderKgoiResult(s);
}

function kgoiResultCopy(correct, total) {
  const pct = correct / total;
  if (pct === 1) return 'Mükemmel! Kim Genco Olmak İster tacı senin 👑';
  if (pct >= 0.7) return 'Harika gidiyorsun, tam bir Genco uzmanısın!';
  if (pct >= 0.4) return 'Fena değil, gelecek hafta zirveyi zorla!';
  return 'Olsun, her hafta yeni bir şans var!';
}

function renderKgoiResult(s) {
  const stage = document.getElementById('kgoi-stage');
  if (!stage) return;
  const cooldownMs = 7 * 24 * 60 * 60 * 1000;
  const badge = s.correctCount === s.questions.length ? '👑' : s.correctCount >= s.questions.length / 2 ? '🏆' : '🎯';
  stage.innerHTML = `
    <div class="kgoi-result">
      <div class="kgoi-result-badge">${badge}</div>
      <h2 class="kgoi-result-score">${s.correctCount} / ${s.questions.length} doğru</h2>
      <p class="kgoi-result-copy">${kgoiResultCopy(s.correctCount, s.questions.length)}</p>
      <div class="kgoi-result-rewards">
        <div class="kgoi-reward-chip">🪙 +${s.coinEarned}</div>
        <div class="kgoi-reward-chip">⚡ +${s.xpEarned}</div>
      </div>
      <div class="kgoi-cooldown-box"><span>Sıradaki hakkın</span><strong id="kgoi-cooldown-timer">${formatKgoiCountdown(cooldownMs)}</strong></div>
      <button class="btn-secondary kgoi-home-btn" onclick="goPage('home')">Ana Sayfaya Dön</button>
    </div>`;
  startKgoiCountdown(Date.now() + cooldownMs);
}

function renderKgoiCooldown(attempt, cooldownMs) {
  const stage = document.getElementById('kgoi-stage');
  if (!stage) return;
  stage.innerHTML = `
    <div class="kgoi-result">
      <div class="kgoi-result-badge">⏳</div>
      <h2 class="kgoi-result-score">Bu haftaki hakkını kullandın</h2>
      <p class="kgoi-result-copy">Son skorun: <strong>${attempt.score}/10</strong></p>
      <div class="kgoi-result-rewards">
        <div class="kgoi-reward-chip">🪙 +${attempt.coin_reward}</div>
        <div class="kgoi-reward-chip">⚡ +${attempt.xp_reward}</div>
      </div>
      <div class="kgoi-cooldown-box"><span>Yeni hakkın</span><strong id="kgoi-cooldown-timer">${formatKgoiCountdown(cooldownMs)}</strong></div>
    </div>`;
  startKgoiCountdown(Date.now() + cooldownMs);
}

function startKgoiCountdown(targetTs) {
  if (_kgoiCountdownTimer) clearInterval(_kgoiCountdownTimer);
  const tick = () => {
    const el = document.getElementById('kgoi-cooldown-timer');
    if (!el) { clearInterval(_kgoiCountdownTimer); _kgoiCountdownTimer = null; return; }
    const remain = targetTs - Date.now();
    if (remain <= 0) {
      clearInterval(_kgoiCountdownTimer);
      _kgoiCountdownTimer = null;
      el.textContent = 'Şimdi oynayabilirsin!';
      return;
    }
    el.textContent = formatKgoiCountdown(remain);
  };
  tick();
  _kgoiCountdownTimer = setInterval(tick, 1000);
}

function formatKgoiCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (d > 0) return `${d}g ${h}s ${m}dk sonra`;
  if (h > 0) return `${h}s ${m}dk ${sec}sn sonra`;
  return `${m}dk ${sec}sn sonra`;
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', async () => {
  const splash = document.getElementById('app-splash');
  const splashMinimum = new Promise(resolve => setTimeout(resolve, 1700));
  const splashFallback = setTimeout(() => splash?.classList.add('is-hidden'), 6000);
  const finishSplash = async () => {
    await splashMinimum;
    clearTimeout(splashFallback);
    splash?.classList.add('is-hidden');
  };
  loadTheme();
  updateHomeGreeting();
  initGencoAiDrag();
  applyGencoAiVisibility();

  // Session restore: kayıtlı oturum varsa kullanıcı girişli açılır,
  // yoksa uygulama misafir olarak direkt ana sayfada açılır.
  const savedLoginType  = sessionStorage.getItem('genco_login_type') || 'bireysel';
  let restored = false;
  try {
    const session = await Promise.race([
      sbGetSession(),
      new Promise(resolve => setTimeout(() => resolve(null), 5000))
    ]);
    if (session && session.user) {
      const u = session.user;
      try {
        const [profile, stats] = await Promise.all([sbGetProfile(u.id), sbGetStats(u.id)]);
        if (!profile.is_suspended) {
          state.user.id           = u.id;
          state.user.email        = u.email;
          state.user.name         = profile.full_name || profile.username || '';
          state.user.username     = profile.username  || '';
          state.user.gender       = profile.gender    || '';
          state.user.team         = profile.team      || '';
          state.user.phone        = profile.phone     || '';
          state.user.bio          = profile.bio       || '';
          state.user.instagram    = profile.instagram || '';
          state.user.twitter      = profile.twitter   || '';
          state.user.emojiStatus  = profile.emoji_status   || '';
          state.user.profileTheme = profile.profile_theme  || 'blue';
          state.user.profilePhoto = profile.profile_photo_url || '';
          state.user.friendCode   = profile.friend_code || '';
          state.user.role         = profile.role;
          state.user.coin         = stats.coin;
          state.user.gcoin        = stats.gcoin || 0;
          state.user.xp           = stats.xp;
          state.user.level        = seasonTier(stats.xp, state.user.cosmetics);
          state.user.cosmetics = await seasonPrepare(u.id, stats, profile);
          state.user.level = seasonTier(stats.xp, state.user.cosmetics);
          const lastSeenLevel = localStorage.getItem(levelStorageKey(u.id));
          queueLevelUp(lastSeenLevel, state.user.level);
          rememberLevel(u.id, state.user.level);
          state.user.streak       = stats.streak;
          state.user.tasksCompleted = stats.tasks_completed;
          state.user.rewardsUsed    = stats.rewards_used;
          state.user.claimedRewards = stats.claimed_rewards || [];
          state.user.cosmetics      = profile.equipped_cosmetics || { frame: '', card_bg: '', title: '' };
          sessionStorage.setItem('genco_active', '1');
          restored = true;
          await finishSplash();
          launchApp();
          if (profile.role === 'admin' && savedLoginType === 'kurumsal') goPage('admin');
        } else {
          await sbLogout().catch(() => {});
        }
      } catch(e2) { /* profil yüklenemedi, misafir olarak devam */ }
    }
  } catch(e) { /* session yok veya hata */ }
  if (!restored) {
    state.user.id = null;
    await finishSplash();
    launchApp();
  }
  // Setup registration form dynamic fields
  const school = document.getElementById('reg-school');
  const facultyGroup = document.getElementById('group-faculty');
  const deptGroup = document.getElementById('group-department');
  const classGroup = document.getElementById('group-class');
  const facultySel = document.getElementById('reg-faculty');
  const dept = document.getElementById('reg-department');
  const cls = document.getElementById('reg-class');
  const labelFaculty = document.getElementById('label-faculty');
  const labelClass   = document.getElementById('label-class');
  const dob = document.getElementById('reg-dob');
  if (dob) {
    const todayForDob = new Date();
    const maxDob = new Date(todayForDob.getFullYear() - 13, todayForDob.getMonth(), todayForDob.getDate());
    dob.setAttribute('min', '1925-01-01');
    dob.setAttribute('max', maxDob.toISOString().slice(0, 10));
  }

  const ALKU_FACULTIES = [
    '— Seçiniz —',
    '── Fakülteler ──',
    'Eğitim Fakültesi',
    'İktisadi, İdari ve Sosyal Bilimler Fakültesi',
    'Rafet Kayış Mühendislik Fakültesi',
    'Tıp Fakültesi',
    'Sağlık Bilimleri Fakültesi',
    'Spor Bilimleri Fakültesi',
    'Sanat, Tasarım ve Mimarlık Fakültesi',
    'Gazipaşa Havacılık ve Uzay Bilimleri Fakültesi',
    'Diş Hekimliği Fakültesi',
    '── Meslek Yüksek Okulları ──',
    'Akseki Meslek Yüksekokulu',
    'Alanya Ticaret ve Sanayi Odası Meslek Yüksekokulu',
    'Alanya Ticaret ve Sanayi Odası Turizm Meslek Yüksekokulu',
    'Sağlık Hizmetleri Meslek Yüksekokulu',
    'Gazipaşa Mustafa Rahmi Büyükballı Meslek Yüksekokulu',
    'Yabancı Diller Yüksekokulu'
  ];
  const HEP_CAMPUSES = [
    '— Seçiniz —',
    'Alanya Hep Üniversitesi Merkez Kampüs',
    'Alanya Hep Üniversitesi Kale Kampüs'
  ];

  function populateFaculty(options, label) {
    facultySel.innerHTML = '';
    options.forEach((opt, i) => {
      const o = document.createElement('option');
      if (opt.startsWith('──')) {
        o.disabled = true;
        o.textContent = opt;
      } else if (i === 0) {
        o.value = '';
        o.textContent = opt;
      } else {
        o.value = opt;
        o.textContent = opt;
      }
      facultySel.appendChild(o);
    });
    if (labelFaculty) labelFaculty.textContent = label;
  }

  if (school) {
    school.addEventListener('change', (e) => {
      const v = e.target.value;
      if (!v || v === 'Okumuyorum') {
        facultyGroup.style.display = 'none';
        deptGroup.style.display = 'none';
        classGroup.style.display = 'none';
      } else if (v === 'ALKU') {
        facultyGroup.style.display = 'flex';
        deptGroup.style.display = 'flex';
        classGroup.style.display = 'flex';
        populateFaculty(ALKU_FACULTIES, 'Fakülte / Yüksekokul');
        dept.innerHTML = '<option value="">— Bölüm seçiniz —</option>';
        cls.innerHTML = '<option value="">— Seçiniz —</option>';
        [1,2,3,4].forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n+'. Sınıf'; cls.appendChild(o); });
        if (labelClass) labelClass.textContent = 'Sınıf';
      } else if (v === 'AlanyaHEP') {
        facultyGroup.style.display = 'flex';
        deptGroup.style.display = 'flex';
        classGroup.style.display = 'flex';
        populateFaculty(HEP_CAMPUSES, 'Kampüs');
        dept.innerHTML = '<option value="">— Bölüm seçiniz —</option>';
        cls.innerHTML = '<option value="">— Seçiniz —</option>';
        [1,2,3,4].forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n+'. Sınıf'; cls.appendChild(o); });
        if (labelClass) labelClass.textContent = 'Sınıf';
      } else {
        // Lise
        facultyGroup.style.display = 'none';
        deptGroup.style.display = 'none';
        classGroup.style.display = 'flex';
        cls.innerHTML = '<option value="">— Seçiniz —</option>';
        [9,10,11,12].forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n+'. Sınıf'; cls.appendChild(o); });
        if (labelClass) labelClass.textContent = 'Sınıf';
      }
    });
  }
  // emoji picker delegation
  const emojiPicker = document.getElementById('emoji-picker');
  if (emojiPicker) {
    emojiPicker.addEventListener('click', e => {
      const btn = e.target.closest('.emoji-opt');
      if (btn) selectEmoji(btn);
    });
  }

  // bio character counter
  const bioArea = document.getElementById('edit-bio');
  if (bioArea) bioArea.addEventListener('input', updateBioCount);
  // profil düzenleme: yazdıkça önizleme ve kaydet çubuğu güncellensin
  document.getElementById('page-profile-edit')?.addEventListener('input', () => peRefresh());

  // theme swatch delegation
  const themeRow = document.querySelector('.theme-swatch-row');
  if (themeRow) {
    themeRow.addEventListener('click', e => {
      const btn = e.target.closest('.theme-swatch');
      if (btn) selectProfileTheme(btn);
    });
  }

  // ensure rewards reflect current coin amount
  updateRewardsAvailability();
  refreshCoinDisplays();
});

/// Zirve bu sezonun XP'sine göre: sezonda hiç XP kazanmayanlar listeye girmez
function seasonalLeaderboard(rows) {
  return (rows || []).map(u => {
    const sxp = seasonXpOf(u.xp, u.profiles?.equipped_cosmetics);
    return { ...u, lifeXp: u.xp, xp: sxp, level: xpToLevel(sxp) };
  }).filter(u => u.xp > 0 || u.id === state.user?.id).sort((a, b) => b.xp - a.xp);
}

/* ─── ZİRVE ───
   Üç sıralama: sezon XP'si (kademelere göre gruplu), Snake Genco ve Flappy Genco puan rekorları.
   Hepsi G-Pass sezonuna (gpassSeasonId → 'YYYY-MM') bağlıdır: ay değişince sezon XP'si ve kademe
   sıfırdan başlar, oyun rekorları da game_scores tablosunda yeni sezon satırına yazılır. */
const ZV_GAMES = {
  snake:  { title: 'Snake Genco',  kicker: 'SNAKE GENCO',  card: '.kz-card-snake' },
  flappy: { title: 'Flappy Genco', kicker: 'FLAPPY GENCO', card: '.kz-card-flappy' },
};
const ZV_LIST_MAX = 50;
const zv = { board: 'xp', xp: null, games: {}, seasonTimer: null };

function zvTierVars(level) {
  const rgb = TIER_RGB[tierKey(level)] || TIER_RGB.bronz;
  return `--t1:${rgb[0]};--t2:${rgb[1]}`;
}
function zvTierChip(level) {
  return level ? `<span class="zv-tier" style="${zvTierVars(level)}">${levelEmoji(level)} ${escHtml(level)}</span>` : '';
}
function zvAvatar(row, size = 'sm') {
  const p = row.profile || {};
  const photo = p.profile_photo_url || '';
  const name = p.username || p.full_name || 'Kullanıcı';
  const av = photo
    ? `<span class="zv-av" style="background-image:url('${escHtml(photo)}')"></span>`
    : `<span class="zv-av">${escHtml((name[0] || '?').toUpperCase())}</span>`;
  const frame = resolveLevelFrame(p.equipped_cosmetics, row.lifeXp || 0);
  return `<span class="lf lf-${size} ${levelFrameClass(frame)}">${av}</span>`;
}
function zvName(row) {
  const p = row.profile || {};
  return escHtml(p.username || p.full_name || 'Kullanıcı');
}

// XP sıralamasını ortak satır biçimine çevir
async function zvLoadXp() {
  const data = seasonalLeaderboard(await sbGetLeaderboard());
  zv.xp = data.map((u, i) => ({
    id: u.id, rank: i + 1, profile: u.profiles, lifeXp: u.lifeXp, value: u.xp, level: u.level,
  }));
  const me = zv.xp.find(r => r.id === state.user?.id);
  if (me) { state.user.rank = me.rank; refreshCoinDisplays(); }
  return zv.xp;
}

async function zvLoadGame(game) {
  const seasonId = gpassSeasonId();
  const rows = await sbGetGameLeaderboard(game, { seasonId, limit: ZV_LIST_MAX });
  // Oyun satırlarında da kademe görünsün: sezon XP sıralamasından eşleştir
  const byId = Object.fromEntries((zv.xp || []).map(r => [r.id, r]));
  const list = rows.map(r => ({
    id: r.user_id, rank: r.rank, profile: r.profile, value: r.best_score,
    level: byId[r.user_id]?.level || xpToLevel(0), lifeXp: byId[r.user_id]?.lifeXp || 0,
  }));
  let mine = list.find(r => r.id === state.user?.id)?.value ?? null;
  if (mine == null && state.user?.id) {
    try { mine = (await sbGetMyGameScore(state.user.id, game, seasonId))?.best_score ?? 0; } catch { mine = 0; }
  }
  zv.games[game] = { list, mine };
  return zv.games[game];
}

async function zvRenderSeason() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const season = await gpassLoadSeason().catch(() => gpassBaseSeason(gpassSeasonId()));
  const range = gpassSeasonRange(season.id);
  set('zv-eyebrow', `GENCO ARENA · ${seasonLabel(season.id).toLocaleUpperCase('tr')}`);
  set('zv-season-emo', season.emoji || '🏆');
  set('zv-season-kicker', `G-PASS · ${(season.subtitle || '').toLocaleUpperCase('tr')}`);
  set('zv-season-name', season.name);
  const tick = () => {
    set('zv-season-left', gpassTimeLeft(season.id));
    const pct = Math.min(1, Math.max(0, (Date.now() - range.start) / (range.end - range.start)));
    const fill = document.getElementById('zv-season-fill');
    if (fill) fill.style.width = (pct * 100).toFixed(1) + '%';
  };
  tick();
  clearInterval(zv.seasonTimer);
  zv.seasonTimer = setInterval(() => {
    if (!document.getElementById('page-leaderboard')?.classList.contains('active')) { clearInterval(zv.seasonTimer); return; }
    // Sayfa açıkken ay dönerse yeni sezonu yükle
    if (Date.now() >= range.end) { clearInterval(zv.seasonTimer); loadLeaderboard(); return; }
    tick();
  }, 60000);
  return season;
}

function zvRenderPodium(rows, unit) {
  const pod = document.getElementById('zv-podium');
  if (!pod) return;
  const myId = state.user?.id;
  pod.innerHTML = [rows[1], rows[0], rows[2]].map((r, i) => {
    const place = [2, 1, 3][i];
    if (!r) return `<div class="zv-pod zv-pod-${place} is-empty"><span class="zv-pod-av-empty">?</span><b class="zv-pod-name">Boş</b><span class="zv-pod-val">—</span><span class="zv-pod-stand"><em>${place}</em></span></div>`;
    const me = r.id === myId;
    return `<div class="zv-pod zv-pod-${place}${me ? ' is-me' : ''}">
      ${place === 1 ? '<span class="zv-crown" aria-hidden="true">👑</span>' : ''}
      ${zvAvatar(r, place === 1 ? 'md' : 'sm')}
      <b class="zv-pod-name">${zvName(r)}</b>
      ${zvTierChip(r.level)}
      <span class="zv-pod-val">${Number(r.value).toLocaleString('tr')} <small>${unit}</small></span>
      <span class="zv-pod-stand"><em>${place}</em></span>
    </div>`;
  }).join('');
}

function zvRow(r, unit) {
  const me = r.id === state.user?.id;
  return `<div class="zv-row${me ? ' is-me' : ''}">
    <span class="zv-pos">${r.rank}</span>
    ${zvAvatar(r)}
    <span class="zv-info"><b>${zvName(r)}${me ? ' <i class="zv-me-tag">Sen</i>' : ''}</b>${zvTierChip(r.level)}</span>
    <span class="zv-val">${Number(r.value).toLocaleString('tr')}<small>${unit}</small></span>
  </div>`;
}

function zvRenderList(rows, unit) {
  const list = document.getElementById('zv-list');
  if (!list) return;
  if (!rows.length) {
    const g = ZV_GAMES[zv.board];
    list.innerHTML = g
      ? `<div class="zv-empty"><span>🎮</span><b>Bu sezon henüz skor yok</b><small>${g.title} oyna, sezonun ilk rekorunu sen kır!</small></div>`
      : `<div class="zv-empty"><span>⚡</span><b>Sezon yeni başladı</b><small>Görev tamamla, ilk XP'yi kazanan zirveye otursun.</small></div>`;
    return;
  }
  const shown = rows.slice(3, ZV_LIST_MAX);
  if (!shown.length) { list.innerHTML = '<div class="zv-empty zv-empty-sm"><small>İlk üçün dışında henüz kimse yok.</small></div>'; return; }
  // XP sekmesi: kademe değiştikçe ara başlık
  let lastGroup = '';
  list.innerHTML = shown.map(r => {
    let head = '';
    if (zv.board === 'xp') {
      const g = levelBase(r.level);
      if (g !== lastGroup) {
        lastGroup = g;
        head = `<div class="zv-group" style="${zvTierVars(r.level)}"><span>${levelEmoji(g)} ${g.toLocaleUpperCase('tr')}</span><i></i></div>`;
      }
    }
    return head + zvRow(r, unit);
  }).join('');
}

function zvRenderMe(rows, unit) {
  const box = document.getElementById('zv-me');
  if (!box) return;
  if (!state.user?.id || isGuest()) { box.hidden = true; return; }
  const mine = rows.find(r => r.id === state.user.id);
  const myXpRow = zv.xp?.find(r => r.id === state.user.id);
  const tier = myXpRow?.level || seasonTier(state.user.xp, state.user.cosmetics);
  let value, extra;
  if (ZV_GAMES[zv.board]) {
    value = zv.games[zv.board]?.mine || 0;
    extra = mine ? 'Sezon rekorun' : (value ? `İlk ${ZV_LIST_MAX} dışında` : 'Bu sezon henüz skorun yok');
  } else {
    value = myXpRow?.value ?? mySeasonXp();
    const season = state.gpass?.season;
    extra = season ? `G-Pass Lv ${gpassProgress(season).level}/${GPASS_MAX}` : 'Sezon XP';
  }
  const u = state.user;
  const meRow = { profile: { username: u.username, full_name: u.name, profile_photo_url: u.profilePhoto || '', equipped_cosmetics: u.cosmetics }, lifeXp: u.xp };
  box.hidden = false;
  box.innerHTML = `
    <span class="zv-me-label">SENİN KONUMUN</span>
    <span class="zv-pos">${mine ? mine.rank : '—'}</span>
    ${zvAvatar(meRow)}
    <span class="zv-info"><b>${zvName(meRow)} <i class="zv-me-tag">Sen</i></b><span class="zv-me-sub">${zvTierChip(tier)}<small>${escHtml(extra)}</small></span></span>
    <span class="zv-val">${Number(value).toLocaleString('tr')}<small>${unit}</small></span>`;
}

function zvRender() {
  const game = ZV_GAMES[zv.board];
  const unit = game ? 'puan' : 'XP';
  const rows = game ? (zv.games[zv.board]?.list || []) : (zv.xp || []);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  document.querySelectorAll('#zv-tabs button').forEach(b => b.classList.toggle('active', b.dataset.board === zv.board));
  document.getElementById('page-leaderboard')?.setAttribute('data-board', zv.board);
  set('zv-count', `${(zv.xp || []).length} katılımcı`);
  set('zv-head-kicker', game ? `${game.kicker} · SEZON REKORLARI` : 'KADEMELERE GÖRE');
  set('zv-head-title', game ? 'En yüksek puanlar' : 'Sezonun yıldızları');
  const play = document.getElementById('zv-play');
  if (play) play.hidden = !game;
  zvRenderPodium(rows, unit);
  zvRenderList(rows, unit);
  zvRenderMe(rows, unit);
}

async function zvSwitch(board) {
  if (!ZV_GAMES[board] && board !== 'xp') return;
  zv.board = board;
  zvRender();
  if (!ZV_GAMES[board] || zv.games[board]) return;
  const list = document.getElementById('zv-list');
  if (list) list.innerHTML = '<div class="zv-empty zv-empty-sm"><small>Yükleniyor…</small></div>';
  try {
    await zvLoadGame(board);
  } catch (e) {
    console.warn('Oyun sıralaması yüklenemedi:', e);
    // PGRST205: game_scores tablosu Supabase'de kurulmamış (game_scores.sql çalıştırılmalı)
    const msg = e?.code === 'PGRST205' ? 'Oyun sıralaması henüz açılmadı' : 'Oyun sıralaması yüklenemedi';
    if (zv.board === board && list) list.innerHTML = `<div class="zv-empty"><span>⚠️</span><b>${msg}</b><small>Biraz sonra tekrar dene.</small></div>`;
    return;
  }
  if (zv.board === board) zvRender();
}

function zvPlay() {
  const g = ZV_GAMES[zv.board];
  if (!g) return;
  goPage('tasks');
  setTimeout(() => document.querySelector(g.card)?.click(), 60);
}

async function loadLeaderboard() {
  try {
    // Her açılışta taze veri: oyundan dönünce rekorlar, görev onayından sonra XP değişmiş olabilir
    zv.games = {};
    await Promise.all([zvRenderSeason(), zvLoadXp()]);
    if (ZV_GAMES[zv.board]) await zvSwitch(zv.board);
    else zvRender();
  } catch (e) {
    console.error('loadLeaderboard error:', e);
    showToast('Sıralama yüklenemedi');
  }
}

function togglePassVis(btn) {
  const input = btn.previousElementSibling;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('.eye-show').style.display = isHidden ? 'none'  : '';
  btn.querySelector('.eye-hide').style.display = isHidden ? ''      : 'none';
}

function switchLbPeriod(btn) {
  document.querySelectorAll('.lb-period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadLeaderboard();
}

/* ─── ADMIN ─── */
function switchAdminTab(btn, tabId) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.adm-tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('adm-tab-' + tabId).classList.add('active');
}

function switchAdminSection(btn, tabId) {
  const navBtn = btn || document.querySelector(`.adm-nav-btn[data-tab="${tabId}"]`) || document.querySelector('.adm-nav-btn[data-tab="dashboard"]');
  document.querySelectorAll('.adm-nav-btn').forEach(b => b.classList.toggle('active', b === navBtn));
  document.querySelectorAll('.adm-tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('adm-tab-' + tabId)?.classList.add('active');
  document.getElementById('page-admin')?.classList.toggle('on-dash', tabId === 'dashboard');
  if (tabId === 'dashboard') { loadAdminUsers(); loadAdminDashboard(); loadAdminCounts(); }
  if (tabId === 'approvals') loadAdminApprovals();
  if (tabId === 'tasks')     loadAdminTasks();
  if (tabId === 'rewards')   loadAdminRewards();
  if (tabId === 'messages')  loadAdminMessages();
  if (tabId === 'activity')  loadAdminActivity();
  if (tabId === 'daily')     loadAdminDailyTasks();
  if (tabId === 'events')    loadAdminEvents();
  if (tabId === 'partners')  loadAdminPartners();
  if (tabId === 'profile')   loadAdminProfile();
  if (tabId === 'admins')    loadAdminAdmins();
  if (tabId === 'users')     loadAdminUsers();
  if (tabId === 'reviews')   loadAdminReviews();
  if (tabId === 'concerts')  loadAdminConcerts();
  if (tabId === 'news')      loadAdminNews();
  if (tabId === 'league')    loadAdminLeague();
  if (tabId === 'gpass')     loadAdminGpass();
}

async function loadAdminApprovals(force = false) {
  const list = document.getElementById('approval-list');
  if (!list) return;
  if (!force && cacheValid('approvals') && state.adminAllSubmissions) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const subs = await sbGetAllSubmissions();
    state.adminAllSubmissions = subs;
    cacheSet('approvals');
    const pending  = subs.filter(s => s.status === 'review');
    const approved = subs.filter(s => s.status === 'approved');
    const rejected = subs.filter(s => s.status === 'rejected');
    updateAdminPending(pending.length);
    document.querySelectorAll('.adm-filter').forEach(btn => {
      const oc = btn.getAttribute('onclick') || '';
      if (oc.includes("'pending'"))  btn.innerHTML = `Bekleyen <span>${pending.length}</span>`;
      if (oc.includes("'approved'")) btn.innerHTML = `Onaylanan <span>${approved.length}</span>`;
      if (oc.includes("'rejected'")) btn.innerHTML = `Reddedilen <span>${rejected.length}</span>`;
    });
    renderApprovalList('pending');
  } catch (e) {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div></div>`;
  }
}

function renderApprovalList(filter) {
  const list = document.getElementById('approval-list');
  if (!list) return;
  const subs = state.adminAllSubmissions || [];
  const statusMap = { pending: 'review', approved: 'approved', rejected: 'rejected' };
  const filtered = subs.filter(s => s.status === (statusMap[filter] || 'review'));

  if (!filtered.length) {
    const labels = { pending: 'Bekleyen onay yok', approved: 'Onaylanan görev yok', rejected: 'Reddedilen görev yok' };
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">✅</div><div>${labels[filter] || 'Görev yok'}</div></div>`;
    return;
  }

  list.innerHTML = filtered.map(s => {
    const isPending = s.status === 'review';
    return `
      <div class="approval-card" data-sub-id="${s.id}" data-user-id="${s.user_id}">
        <div class="apv-top">
          <div class="apv-user">
            <div class="apv-avatar">${(s.profiles?.username || s.profiles?.full_name || '?')[0].toUpperCase()}</div>
            <div class="apv-info">
              <div class="apv-name">${s.profiles?.full_name || s.profiles?.username || 'Kullanıcı'}</div>
              <div class="apv-task">${s.tasks?.emoji || '📋'} ${s.tasks?.title || 'Görev'}</div>
            </div>
          </div>
          <div class="apv-reward">+${s.tasks?.coin_reward || 0} 🪙</div>
        </div>
        ${s.proof_url
          ? `<img class="apv-proof" src="${s.proof_url}" alt="Kanıt" onclick="window.open('${s.proof_url}','_blank')">`
          : '<div class="apv-no-proof">📎 Kanıt fotoğrafı yüklenmemiş</div>'}
        ${(s.description || s.submission_date) ? `<div class="apv-extra">
          ${s.description ? `<div class="apv-extra-desc">💬 ${escHtml(s.description)}</div>` : ''}
          ${s.submission_date ? `<div class="apv-extra-date">📅 ${s.submission_date}</div>` : ''}
        </div>` : ''}
        ${isPending
          ? `<div class="apv-actions">
               <button class="apv-btn reject" onclick="rejectApproval(this)">✕ Reddet</button>
               <button class="apv-btn approve" onclick="approveApproval(this)">✓ Onayla</button>
             </div>`
          : `<div class="apv-status-tag ${s.status}">${s.status === 'approved' ? '✅ Onaylandı' : '❌ Reddedildi'}</div>`
        }
      </div>`;
  }).join('');
}

async function loadAdminUsers(force = false) {
  const lists = [...document.querySelectorAll('.adm-dashboard-user-list, #adm-user-list')];
  if (!lists.length) return;
  if (!force && cacheValid('users') && state.adminAllUsers) return;
  lists.forEach(list => {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  });
  try {
    const _timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000));
    const users = await Promise.race([sbGetAllUsers(), _timeout]);
    state.adminAllUsers = users;
    cacheSet('users');
    const statEl = document.getElementById('adm-stat-users');
    if (statEl) statEl.textContent = users.length;
    const panelCountEl = document.getElementById('adm-panel-user-count');
    if (panelCountEl) panelCountEl.textContent = users.length;
    if (!users.length) {
      lists.forEach(list => {
        list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">👥</div><div>Henüz kullanıcı yok</div></div>`;
      });
      return;
    }
    const userRows = users.map(u => {
      const suspended = u.is_suspended;
      const initial   = (u.username || u.full_name || '?')[0].toUpperCase();
      const photoStyle = u.profile_photo_url
        ? `style="background-image:url('${u.profile_photo_url}');background-size:cover;background-position:center;color:transparent"`
        : '';
      return `
      <div class="adm-user-row adm-item-row" data-level="${xpToLevel(u.user_stats?.xp || 0)}" data-suspended="${!!suspended}" style="${suspended ? 'opacity:0.5' : ''}">
        <div class="adm-item-avatar ${suspended ? 'suspended' : ''}" ${photoStyle}>${u.profile_photo_url ? '' : initial}</div>
        <div class="adm-item-info">
          <div class="adm-item-name">${u.full_name || u.username || 'İsimsiz'} ${suspended ? '<span style="font-size:10px;color:#ef4444">⏸ Askıda</span>' : ''}</div>
          <div class="adm-item-sub">@${u.username || '—'} · ${u.team || 'Takım yok'} · ${u.user_stats?.xp || 0} XP</div>
        </div>
        <div class="adm-item-actions">
          <button class="adm-act-btn" onclick="openUserDetailModal('${u.id}')">⚙️</button>
        </div>
      </div>`;
    }).join('');
    lists.forEach(list => { list.innerHTML = userRows; });
  } catch (e) {
    lists.forEach(list => {
      list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div><button class="adm-modal-btn-secondary" style="margin-top:10px;font-size:13px" onclick="loadAdminUsers(true)">↻ Tekrar Dene</button></div>`;
    });
  }
}

function openUserDetailModal(userId) {
  const u = (state.adminAllUsers || []).find(x => x.id === userId);
  if (!u) return;
  state.managingUser = u;

  const av = document.getElementById('adm-user-detail-av');
  av.textContent = (u.username || u.full_name || '?')[0].toUpperCase();
  av.className = 'adm-user-modal-av' + (u.is_suspended ? ' suspended' : '');

  document.getElementById('adm-user-modal-name').textContent   = u.full_name || u.username || 'Kullanıcı';
  document.getElementById('adm-user-detail-sub').textContent   = `@${u.username || '—'} · ${u.team || 'Takım yok'}`;
  document.getElementById('adm-user-xp').textContent           = u.user_stats?.xp    || 0;
  document.getElementById('adm-user-coin').textContent         = u.user_stats?.coin  || 0;
  document.getElementById('adm-user-tasks').textContent        = u.user_stats?.tasks_completed || 0;
  document.getElementById('adm-user-streak').textContent       = u.user_stats?.streak || 0;

  const suspBtn = document.getElementById('adm-suspend-btn');
  if (suspBtn) {
    suspBtn.textContent   = u.is_suspended ? '▶ Aktif Et' : '⏸ Askıya Al';
    suspBtn.style.color   = u.is_suspended ? '#10b981' : '';
    suspBtn.style.borderColor = u.is_suspended ? 'rgba(16,185,129,0.3)' : '';
  }

  document.getElementById('adm-give-coin').value = '';
  document.getElementById('adm-give-xp').value   = '';
  document.getElementById('adm-notif-msg').value  = '';
  openModal('modal-admin-user');
}

async function adjustUserBalance(sign) {
  const u = state.managingUser;
  if (!u) return;
  const coinAmt = parseInt(document.getElementById('adm-give-coin').value) || 0;
  const xpAmt   = parseInt(document.getElementById('adm-give-xp').value)   || 0;
  if (coinAmt < 1 && xpAmt < 1) { showToast('Coin veya XP miktarı girin'); return; }

  const coinDelta = coinAmt * sign;
  const xpDelta   = xpAmt   * sign;

  const curCoin = u.user_stats?.coin || 0;
  const curXp   = u.user_stats?.xp   || 0;
  if (sign === -1 && coinAmt > 0 && curCoin < coinAmt) { showToast('Kullanıcının yeterli coin\'i yok'); return; }
  if (sign === -1 && xpAmt   > 0 && curXp   < xpAmt)   { showToast('Kullanıcının yeterli XP\'si yok'); return; }

  try {
    await sbAdminGiveBonus(u.id, coinDelta, xpDelta);

    const action = sign === 1 ? 'eklendi' : 'çıkarıldı';
    const parts  = [];
    if (coinAmt > 0) parts.push(`${sign === 1 ? '+' : '-'}${coinAmt} 🪙`);
    if (xpAmt   > 0) parts.push(`${sign === 1 ? '+' : '-'}${xpAmt} XP`);
    const notifTitle = sign === 1 ? 'Admin Bonusu 🎁' : 'Admin Düzeltmesi ⚠️';
    await sbAdminSendNotif(u.id, notifTitle, `${parts.join(' ve ')} hesabından ${action}.`, sign === 1 ? 'bonus' : 'admin_message');

    if (u.user_stats) {
      u.user_stats.coin = Math.max(0, curCoin + coinDelta);
      u.user_stats.xp   = Math.max(0, curXp   + xpDelta);
    }
    document.getElementById('adm-user-coin').textContent = u.user_stats?.coin || 0;
    document.getElementById('adm-user-xp').textContent   = u.user_stats?.xp   || 0;
    document.getElementById('adm-give-coin').value = '';
    document.getElementById('adm-give-xp').value   = '';
    showToast(sign === 1 ? '✓ Verildi' : '✓ Alındı');

    // Admin kendine bonus verdiyse kademe atlamayı hemen kontrol et — sayfa
    // değiştirmeyi ya da yeniden girişi beklemesin.
    if (u.id === state.user?.id) await refreshUserStats();
  } catch (e) {
    showToast('Hata: ' + e.message);
  }
}

async function sendUserNotif() {
  const u = state.managingUser;
  if (!u) return;
  const msg = document.getElementById('adm-notif-msg').value.trim();
  if (!msg) { showToast('Mesaj boş olamaz'); return; }
  try {
    await sbAdminSendNotif(u.id, 'Admin Mesajı 📢', msg, 'admin_message');
    document.getElementById('adm-notif-msg').value = '';
    showToast('Bildirim gönderildi ✓');
  } catch (e) {
    showToast('Hata: ' + e.message);
  }
}

async function toggleUserSuspend() {
  const u = state.managingUser;
  if (!u) return;
  const newVal = !u.is_suspended;
  try {
    await sbSuspendUser(u.id, newVal);
    u.is_suspended = newVal;
    const btn = document.getElementById('adm-suspend-btn');
    if (btn) {
      btn.textContent       = newVal ? '▶ Aktif Et' : '⏸ Askıya Al';
      btn.style.color       = newVal ? '#10b981' : '';
      btn.style.borderColor = newVal ? 'rgba(16,185,129,0.3)' : '';
    }
    const av = document.getElementById('adm-user-detail-av');
    if (av) av.className = 'adm-user-modal-av' + (newVal ? ' suspended' : '');
    showToast(newVal ? 'Kullanıcı askıya alındı' : 'Kullanıcı aktif edildi');
    cacheClear('users'); loadAdminUsers();
  } catch (e) {
    showToast('Hata: ' + e.message);
  }
}

function deleteUserAccount(btn) {
  const u = state.managingUser;
  if (!u) return;
  const displayName = u.full_name || u.username || 'Bu kullanıcı';
  showConfirm(
    `"${displayName}" adlı kullanıcıyı ve tüm verilerini kalıcı olarak silmek istediğine emin misin?`,
    '🗑️ Evet, Sil',
    async () => {
      btn.disabled = true;
      btn.textContent = 'Siliniyor…';
      try {
        await sbDeleteUserAllData(u.id);
        if (state.adminAllUsers) {
          state.adminAllUsers = state.adminAllUsers.filter(x => x.id !== u.id);
        }
        closeModal('modal-admin-user');
        showToast('Kullanıcı ve tüm verileri silindi');
        cacheClear('users'); loadAdminUsers(true);
      } catch (e) {
        showToast('Hata: ' + e.message);
        btn.disabled = false;
        btn.textContent = '🗑️ Sil';
      }
    }
  );
}

async function loadAdminTasks(force = false) {
  const list = document.getElementById('adm-task-list');
  if (!list) return;
  if (!force && cacheValid('tasks') && state.adminTasks) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const tasks = await sbGetTasks();
    state.adminTasks = tasks;
    cacheSet('tasks');
    const statEl = document.getElementById('adm-stat-tasks');
    if (statEl) statEl.textContent = tasks.length;
    if (!tasks.length) {
      list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">📋</div><div>Henüz görev yok</div></div>`;
      return;
    }
    list.innerHTML = tasks.map(t => `
      <div class="adm-item-row" data-id="${t.id}">
        <input type="checkbox" class="adm-bulk-check task-check" data-id="${t.id}" onchange="updateBulkBar('task')">
        <div class="adm-item-avatar" style="font-size:20px;background:rgba(251,146,60,0.15)">${t.emoji}</div>
        <div class="adm-item-info">
          <div class="adm-item-name">${t.title}</div>
          <div class="adm-item-sub">${t.difficulty || 'Orta'} · ${t.category || '—'} · +${t.coin_reward} 🪙 +${t.xp_reward} XP</div>
        </div>
        <div class="adm-item-actions">
          <button class="adm-act-btn" onclick="openAdminTaskModal('${t.id}')">✏️</button>
          <button class="adm-act-btn" onclick="deleteAdminTask('${t.id}', this)">🗑️</button>
        </div>
      </div>`).join('');
    document.getElementById('task-sel-all').checked = false;
    updateBulkBar('task');
  } catch (e) {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div></div>`;
  }
}

async function loadAdminRewards(force = false) {
  const list = document.getElementById('adm-reward-list');
  if (!list) return;
  if (!force && cacheValid('rewards') && state.adminRewards) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const rewards = await sbGetRewards();
    state.adminRewards = rewards;
    cacheSet('rewards');
    if (!rewards.length) {
      list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">🎁</div><div>Henüz ödül yok</div></div>`;
      return;
    }
    list.innerHTML = rewards.map(r => `
      <div class="adm-item-row" data-id="${r.id}">
        <input type="checkbox" class="adm-bulk-check reward-check" data-id="${r.id}" onchange="updateBulkBar('reward')">
        ${r.image_url
          ? `<img class="adm-partner-thumb" src="${escHtml(r.image_url)}" alt="" onerror="this.outerHTML='<div class=&quot;adm-item-avatar&quot; style=&quot;font-size:20px;background:rgba(125,249,194,0.1)&quot;>${r.emoji}</div>'">`
          : `<div class="adm-item-avatar" style="font-size:20px;background:rgba(125,249,194,0.1)">${r.emoji}</div>`}
        <div class="adm-item-info">
          <div class="adm-item-name">${r.name}</div>
          <div class="adm-item-sub">${r.description || ''} · ${r.partner_name || ''} · ${r.coin_cost} 🪙</div>
        </div>
        <div class="adm-item-actions">
          <button class="adm-act-btn" onclick="openAdminRewardModal('${r.id}')">✏️</button>
          <button class="adm-act-btn" onclick="deleteAdminReward('${r.id}', this)">🗑️</button>
        </div>
      </div>`).join('');
    document.getElementById('reward-sel-all').checked = false;
    updateBulkBar('reward');
  } catch (e) {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div></div>`;
  }
}

/* ─── CONFIRM DIALOG ─── */
const CONFIRM_ICONS = {
  logout: '<path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14"/><path d="M10 16.5L5.5 12 10 7.5M5.5 12H15"/>',
  trash:  '<path d="M4.5 7h15M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7M6.5 7l.8 11.3c.1 1 .9 1.7 1.9 1.7h5.6c1 0 1.8-.7 1.9-1.7L17.5 7M10 11v5M14 11v5"/>',
  warn:   '<path d="M12 4.2l8.3 14.3H3.7z"/><path d="M12 10v3.6M12 16.2v.01"/>',
};

// opts: { title, icon: 'logout'|'trash'|'warn', tone: 'danger'|'primary', account: {name, username, photo} }
// Eski çağrılar (msg, label, onOk) aynen çalışır: başlık "Emin misin?", msg açıklama olur.
function showConfirm(msg, label, onOk, opts = {}) {
  const cleanLabel = String(label || 'Evet').replace(/^[^\p{L}\p{N}]+/u, '').trim() || 'Evet';
  const icon = opts.icon || (/sil|kaldır/i.test(cleanLabel) ? 'trash' : 'warn');
  const box = document.querySelector('#modal-confirm .cf-box');
  if (box) box.dataset.tone = opts.tone || 'danger';

  document.getElementById('confirm-icon').innerHTML = `<svg viewBox="0 0 24 24">${CONFIRM_ICONS[icon] || CONFIRM_ICONS.warn}</svg>`;
  document.getElementById('confirm-title').textContent = opts.title || 'Emin misin?';
  const msgEl = document.getElementById('confirm-msg');
  msgEl.textContent = msg || '';
  msgEl.hidden = !msg;

  const acc = document.getElementById('confirm-account');
  const a = opts.account;
  acc.hidden = !a;
  if (a) {
    const initial = escHtml(((a.name || a.username || 'G')[0] || 'G').toUpperCase());
    acc.innerHTML = `
      <span class="cf-av"${a.photo ? ` style="background-image:url('${escHtml(a.photo)}')"` : ''}>${a.photo ? '' : initial}</span>
      <span class="cf-acc-copy"><b>${escHtml(a.name || a.username || 'Genco üyesi')}</b>${a.username ? `<small>@${escHtml(a.username)}</small>` : ''}</span>`;
  }

  const okBtn = document.getElementById('confirm-ok-btn');
  okBtn.textContent = cleanLabel;
  okBtn.onclick = () => { closeModal('modal-confirm'); onOk(); };
  openModal('modal-confirm');
}

function confirmLogout() {
  const u = state.user || {};
  showConfirm(
    'Coin\'lerin, ilerlemen ve ödüllerin hesabında güvende kalır. İstediğin zaman tekrar giriş yapabilirsin.',
    'Oturumu kapat', handleLogout,
    { title: 'Oturumu kapat?', icon: 'logout', account: u.id ? { name: u.name, username: u.username, photo: u.profilePhoto } : null }
  );
}

/* ─── BULK SELECT / DELETE ─── */
function selectAllAdminItems(type, cb) {
  document.querySelectorAll(`.${type}-check`).forEach(c => c.checked = cb.checked);
  updateBulkBar(type);
}

function updateBulkBar(type) {
  const checked = document.querySelectorAll(`.${type}-check:checked`);
  const delBtn  = document.getElementById(`${type}-del-btn`);
  if (delBtn) delBtn.style.display = checked.length > 0 ? 'flex' : 'none';
  if (delBtn && checked.length > 0) delBtn.textContent = `🗑️ ${checked.length} Seçiliyi Sil`;
}

async function deleteSelectedAdminItems(type) {
  const checked = document.querySelectorAll(`.${type}-check:checked`);
  const ids = Array.from(checked).map(c => c.dataset.id);
  if (!ids.length) return;
  showConfirm(
    `${ids.length} ${type === 'task' ? 'görevi' : 'ödülü'} silmek istediğine emin misin?`,
    '🗑️ Evet, Sil',
    async () => {
      try {
        for (const id of ids) {
          if (type === 'task')   await sbDeleteTask(id);
          if (type === 'reward') await sbDeleteReward(id);
        }
        if (type === 'task') {
          await sbClearAllDailyTasksToday();
          cacheClear('tasks'); loadAdminTasks(true);
          state._dailyTasksDate = null;
        }
        if (type === 'reward') { cacheClear('rewards'); loadAdminRewards(true); }
        showToast(`${ids.length} ${type === 'task' ? 'görev' : 'ödül'} silindi`);
      } catch(e) { showToast('Hata: ' + e.message); }
    }
  );
}

/* ─── ADMIN DAILY TASKS ─── */
let _admDailyTimerInterval = null;

function startAdminDailyTimer() {
  if (_admDailyTimerInterval) clearInterval(_admDailyTimerInterval);
  function tick() {
    const now  = new Date();
    const next = new Date(); next.setHours(24, 0, 0, 0);
    const diff = Math.max(0, next - now);
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    const el = document.getElementById('adm-daily-timer');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  _admDailyTimerInterval = setInterval(tick, 1000);
}

async function loadAdminDailyTasks(force = false) {
  const list = document.getElementById('adm-daily-list');
  if (!list) return;
  if (!force && cacheValid('daily') && state._adminDailyData) {
    renderAdminDailyList(state._adminDailyData);
    startAdminDailyTimer();
    return;
  }
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  startAdminDailyTimer();
  try {
    const [dailyRows, todaySubs] = await Promise.all([
      sbGetAllDailyTasksToday(),
      sbGetTodaySubmissions()
    ]);

    // Group daily tasks by user
    const userMap = {};
    (dailyRows || []).forEach(row => {
      const uid = row.user_id;
      if (!userMap[uid]) {
        userMap[uid] = {
          profile: row.profiles || {},
          tasks: []
        };
      }
      userMap[uid].tasks.push({ task_id: row.task_id, task: row.tasks || {} });
    });

    // Mark completed tasks from submissions
    const approvedSet = new Set();
    const pendingSet  = new Set();
    (todaySubs || []).forEach(s => {
      const key = s.user_id + '_' + s.task_id;
      if (s.status === 'approved') approvedSet.add(key);
      else pendingSet.add(key);
    });

    state._adminDailyData = { userMap, approvedSet, pendingSet };
    cacheSet('daily');
    renderAdminDailyList(state._adminDailyData);
  } catch(e) {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div></div>`;
  }
}

function renderAdminDailyList({ userMap, approvedSet, pendingSet }) {
  const list     = document.getElementById('adm-daily-list');
  const poolEl   = document.getElementById('adm-daily-task-pool');
  const taskCntEl = document.getElementById('adm-daily-task-count');
  const userCntEl = document.getElementById('adm-daily-user-count');
  if (!list) return;

  const users = Object.entries(userMap);

  /* ── Task pool: unique tasks across all users today ── */
  const taskMap = {}; // task_id → { task, assignedTo: Set, doneBy: Set, waitingBy: Set }
  users.forEach(([uid, { tasks }]) => {
    tasks.forEach(t => {
      if (!taskMap[t.task_id]) taskMap[t.task_id] = { task: t.task, assignedTo: new Set(), doneBy: new Set(), waitingBy: new Set() };
      taskMap[t.task_id].assignedTo.add(uid);
      const key = uid + '_' + t.task_id;
      if (approvedSet.has(key)) taskMap[t.task_id].doneBy.add(uid);
      else if (pendingSet.has(key)) taskMap[t.task_id].waitingBy.add(uid);
    });
  });

  const uniqueTasks = Object.values(taskMap);
  // Sort by completion count desc
  uniqueTasks.sort((a, b) => b.doneBy.size - a.doneBy.size);

  if (taskCntEl) taskCntEl.textContent = uniqueTasks.length + ' farklı görev';
  if (userCntEl) userCntEl.textContent = users.length + ' üye';

  if (poolEl) {
    if (!uniqueTasks.length) {
      poolEl.innerHTML = `<div class="adm-empty" style="padding:16px"><div class="adm-empty-icon">📅</div><div>Bugün görev atanmadı</div></div>`;
    } else {
      poolEl.innerHTML = uniqueTasks.map(({ task, assignedTo, doneBy, waitingBy }) => {
        const total   = assignedTo.size;
        const done    = doneBy.size;
        const waiting = waitingBy.size;
        const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
        const barColor = pct === 100 ? '#10b981' : pct > 50 ? '#6366f1' : '#fbbf24';
        return `<div class="adm-daily-task-card">
          <div class="adtc-top">
            <span class="adtc-emoji">${task.emoji || '📋'}</span>
            <div class="adtc-info">
              <div class="adtc-title">${task.title || 'Görev'}</div>
              <div class="adtc-meta">${task.difficulty || 'Orta'} · +${task.coin_reward || 0}🪙 +${task.xp_reward || 0}⚡</div>
            </div>
            <div class="adtc-badge">${done}/${total}</div>
          </div>
          <div class="adtc-bar-wrap">
            <div class="adtc-bar" style="width:${pct}%;background:${barColor}"></div>
          </div>
          ${waiting > 0 ? `<div class="adtc-pills"><span class="adtc-wait-pill">⏳ ${waiting} onay bekliyor</span></div>` : ''}
        </div>`;
      }).join('');
    }
  }

  /* ── User list ── */
  if (!users.length) {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">📅</div><div>Bugün henüz görev atanmadı</div></div>`;
    return;
  }
  users.sort((a, b) => {
    const ca = a[1].tasks.filter(t => approvedSet.has(a[0] + '_' + t.task_id)).length;
    const cb = b[1].tasks.filter(t => approvedSet.has(b[0] + '_' + t.task_id)).length;
    return cb - ca;
  });

  list.innerHTML = users.map(([uid, { profile, tasks }]) => {
    const name    = profile.full_name || profile.username || 'Kullanıcı';
    const initial = name[0].toUpperCase();
    const photo   = profile.profile_photo_url || '';
    const total   = tasks.length;
    const done    = tasks.filter(t => approvedSet.has(uid + '_' + t.task_id)).length;
    const waiting = tasks.filter(t => !approvedSet.has(uid + '_' + t.task_id) && pendingSet.has(uid + '_' + t.task_id)).length;
    const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
    const barColor = pct === 100 ? '#10b981' : pct > 50 ? '#6366f1' : '#fbbf24';
    const avStyle  = photo ? `style="background-image:url('${photo}');background-size:cover;background-position:center;color:transparent"` : '';

    const taskPills = tasks.map(t => {
      const key = uid + '_' + t.task_id;
      const isDone    = approvedSet.has(key);
      const isWaiting = !isDone && pendingSet.has(key);
      return `<span class="adm-daily-pill ${isDone ? 'dp-done' : isWaiting ? 'dp-wait' : 'dp-none'}" title="${t.task.title || ''}">${t.task.emoji || '📋'}</span>`;
    }).join('');

    return `<div class="adm-daily-row">
      <div class="act-av" ${avStyle}>${photo ? '' : initial}</div>
      <div class="adm-daily-info">
        <div class="adm-daily-name">${name}
          <span class="adm-daily-count">${done}/${total}</span>
          ${waiting > 0 ? `<span class="adm-daily-wait">⏳${waiting}</span>` : ''}
        </div>
        <div class="adm-daily-bar-wrap">
          <div class="adm-daily-bar" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <div class="adm-daily-pills">${taskPills}</div>
      </div>
    </div>`;
  }).join('');
}

/* ─── ADMIN ACTIVITY ─── */

function formatTimeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'şimdi';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}sa önce`;
  const days = Math.floor(hrs / 24);
  return `${days}g önce`;
}

async function loadAdminActivity(force = false) {
  const list = document.getElementById('adm-activity-list');
  if (!list) return;
  if (!force && cacheValid('activity') && state.adminAllSubmissions) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const subs = state.adminAllSubmissions || await sbGetAllSubmissions();
    if (!state.adminAllSubmissions) { state.adminAllSubmissions = subs; cacheSet('activity'); }
    if (!subs.length) {
      list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">📊</div><div>Henüz hareket yok</div></div>`;
      return;
    }
    list.innerHTML = subs.slice(0, 80).map(s => {
      const user    = s.profiles || {};
      const task    = s.tasks    || {};
      const name    = user.full_name || user.username || 'Kullanıcı';
      const initial = name[0].toUpperCase();
      const photo   = user.profile_photo_url || '';
      const status  = s.status;

      const statusHtml = status === 'approved'
        ? '<span class="act-status act-approved">✅ Onaylandı</span>'
        : status === 'rejected'
        ? '<span class="act-status act-rejected">❌ Reddedildi</span>'
        : '<span class="act-status act-pending">⏳ Bekliyor</span>';

      const rewardHtml = status === 'approved'
        ? `<span class="act-reward">+${task.coin_reward || 0}🪙 +${task.xp_reward || 0}⚡</span>`
        : s.rejection_reason
        ? `<span class="act-reject-reason">${s.rejection_reason}</span>`
        : '';

      const timeAgo = formatTimeAgo(s.submitted_at);

      const avStyle = photo
        ? `style="background-image:url('${photo}');background-size:cover;background-position:center;color:transparent"`
        : '';
      return `<div class="act-item">
        <div class="act-av" ${avStyle}>${photo ? '' : initial}</div>
        <div class="act-info">
          <div class="act-header">
            <span class="act-name">${name}</span>
            <span class="act-time">${timeAgo}</span>
          </div>
          <div class="act-task">${task.emoji || '📋'} ${task.title || 'Görev'}</div>
          <div class="act-meta">${statusHtml}${rewardHtml}</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div></div>`;
  }
}

async function loadAdminAdmins(force = false) {
  const list = document.getElementById('adm-admins-list');
  if (!list) return;
  if (!force && cacheValid('admins') && state.adminAdmins) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const admins = await sbGetAdmins();
    state.adminAdmins = admins;
    cacheSet('admins');
    if (!admins.length) {
      list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">🛡️</div><div>Admin bulunamadı</div></div>`;
      return;
    }
    list.innerHTML = admins.map(u => {
      const initial    = (u.username || u.full_name || '?')[0].toUpperCase();
      const photoStyle = u.profile_photo_url
        ? `style="background-image:url('${u.profile_photo_url}');background-size:cover;background-position:center;color:transparent"`
        : '';
      return `
      <div class="adm-admin-row">
        <div class="adm-admin-av" ${photoStyle}>${u.profile_photo_url ? '' : initial}</div>
        <div class="adm-item-info">
          <div class="adm-item-name">${u.full_name || u.username || 'İsimsiz'} <span class="adm-ca-badge">🛡️ CodeAdmin</span></div>
          <div class="adm-item-sub">@${u.username || '—'} · ${u.email || ''}</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div></div>`;
  }
}

async function addAdminByEmail() {
  const input = document.getElementById('new-admin-email');
  const email = (input?.value || '').trim();
  if (!email) { showToast('E-posta adresi girin'); return; }
  try {
    const profile = await sbSetUserRoleByEmail(email, 'admin');
    showToast(`✅ ${profile.username || profile.full_name || email} admin yapıldı`);
    input.value = '';
    cacheClear('admins');
    loadAdminAdmins(true);
  } catch (e) {
    console.error('addAdminByEmail hata:', e);
    showToast('Hata: ' + (e.message || e.details || 'Bilinmeyen hata'));
  }
}

async function loadAdminMessages(force = false) {
  const list = document.getElementById('adm-message-list');
  if (!list) return;
  if (!force && cacheValid('messages') && state.adminMessages) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const msgs = await sbGetHelpMessages();
    state.adminMessages = msgs;
    cacheSet('messages');
    const unread = msgs.filter(m => m.status === 'open').length;
    const badge = document.getElementById('adm-msg-badge');
    if (badge) { badge.textContent = unread; badge.style.display = unread ? '' : 'none'; }

    if (!msgs.length) {
      list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">💬</div><div>Henüz mesaj yok</div></div>`;
      return;
    }

    list.innerHTML = msgs.map(m => {
      const name = m.profiles?.full_name || m.profiles?.username || 'Kullanıcı';
      const initials = escHtml(name[0].toUpperCase());
      const date = new Date(m.created_at).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      const statusLabel = m.status === 'open' ? '<span class="adm-msg-status open">Yeni</span>'
        : m.status === 'replied' ? '<span class="adm-msg-status replied">Yanıtlandı</span>'
        : '<span class="adm-msg-status closed">Kapatıldı</span>';
      return `
        <div class="adm-msg-card" data-msg-id="${m.id}" data-status="${m.status}" data-kind="${String(m.topic || '').startsWith('Geri Bildirim') ? 'feedback' : 'support'}">
          <div class="adm-msg-header">
            <div class="adm-msg-user">
              <div class="adm-item-avatar">${initials}</div>
              <div>
                <div class="adm-item-name">${escHtml(name)}</div>
                <div class="adm-item-sub">${escHtml(m.topic || 'Konu yok')} · ${date}</div>
              </div>
            </div>
            ${String(m.topic || '').startsWith('Geri Bildirim') ? '<span class="adm-msg-status fb">Geri bildirim</span>' : ''}${statusLabel}
          </div>
          <div class="adm-msg-body">${escHtml(m.message)}</div>
          ${m.admin_reply ? `<div class="adm-msg-reply"><strong>Yanıtınız:</strong> ${escHtml(m.admin_reply)}</div>` : ''}
          <div class="adm-msg-actions">
            <button class="adm-act-btn" onclick="openReplyModal('${m.id}')">💬 Yanıtla</button>
            ${m.status !== 'closed' ? `<button class="adm-act-btn" onclick="closeHelpMsg('${m.id}', this)">✓ Kapat</button>` : ''}
          </div>
        </div>`;
    }).join('');
    _setCount('adm-stat-msgs', unread);
    _setCount('ad-count-messages', unread ? `${unread} yeni` : msgs.length);
    applyAdminMsgFilter();
  } catch (e) {
    console.error('loadAdminMessages error:', e);
    const errMsg = e?.message || JSON.stringify(e) || 'Bilinmeyen hata';
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div><div style="font-size:11px;color:#ef4444;margin-top:6px;max-width:280px;word-break:break-all">${errMsg}</div></div>`;
  }
}

function openReplyModal(msgId) {
  const msg = (state.adminMessages || []).find(m => m.id === msgId);
  if (!msg) return;
  const name = msg.profiles?.full_name || msg.profiles?.username || 'Kullanıcı';
  document.getElementById('reply-modal-user').textContent = name;
  document.getElementById('reply-modal-topic').textContent = msg.topic || '';
  document.getElementById('reply-modal-msg').textContent = msg.message;
  document.getElementById('reply-modal-input').value = msg.admin_reply || '';
  document.getElementById('reply-modal-msgid').value = msgId;
  openModal('modal-admin-reply');
}

async function submitAdminReply() {
  const msgId = document.getElementById('reply-modal-msgid').value;
  const reply = document.getElementById('reply-modal-input').value.trim();
  if (!reply) { showToast('Yanıt boş olamaz'); return; }

  const btn = document.querySelector('#modal-admin-reply .adm-modal-btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }

  try {
    await sbReplyHelpMessage(msgId, reply);
    const msg = (state.adminMessages || []).find(m => m.id === msgId);
    if (msg) {
      await sbAddNotification(msg.user_id, 'Destek Yanıtı 💬',
        `"${msg.topic}" konusundaki mesajınıza yanıt geldi: ${reply}`, 'admin_message');
    }
    closeModal('modal-admin-reply');
    showToast('Yanıt gönderildi ve kullanıcı bildirildi');
    loadAdminMessages();
  } catch (e) {
    showToast('Yanıt gönderilemedi');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Gönder'; }
  }
}

async function closeHelpMsg(msgId, btn) {
  if (btn) btn.disabled = true;
  try {
    await sbCloseHelpMessage(msgId);
    showToast('Mesaj kapatıldı');
    loadAdminMessages();
  } catch (e) {
    showToast('İşlem başarısız');
    if (btn) btn.disabled = false;
  }
}

async function approveApproval(btn) {
  const card  = btn.closest('.approval-card');
  const subId = card.dataset.subId;
  const userId = card.dataset.userId;

  btn.disabled = true;
  try {
    const result = await sbApproveSubmission(subId, state.user.id);
    const coinReward = result.tasks?.coin_reward || 0;
    const xpReward   = result.tasks?.xp_reward   || 0;

    // Kullanıcı istatistiğini güncelle
    if (userId) {
      const uStats = await sbGetStats(userId);
      await sbUpdateStats(userId, {
        coin: (uStats.coin || 0) + coinReward,
        xp:   (uStats.xp   || 0) + xpReward,
        tasks_completed: (uStats.tasks_completed || 0) + 1,
        // level intentionally not updated here — login/refreshUserStats detects the change and sets it
      });
      await sbAddNotification(userId, 'Görev Onaylandı! ✅',
        `Görevin onaylandı. +${coinReward} 🪙 ve +${xpReward} XP kazandın!`, 'task_approved');
    }

    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(30px)';
    setTimeout(() => {
      card.remove();
      const sub = (state.adminAllSubmissions || []).find(s => s.id === subId);
      if (sub) sub.status = 'approved';
      updateAdminPending();
    }, 300);
    showToast('Görev onaylandı ✓');
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Onaylanamadı'));
    btn.disabled = false;
  }
}

async function rejectApproval(btn) {
  const card  = btn.closest('.approval-card');
  const subId = card.dataset.subId;
  const userId = card.dataset.userId;

  btn.disabled = true;
  try {
    await sbRejectSubmission(subId, state.user.id, '');
    if (userId) {
      await sbAddNotification(userId, 'Görev Reddedildi',
        'Gönderdiğin görev reddedildi. Tekrar deneyebilirsin.', 'task_rejected');
    }
    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-30px)';
    setTimeout(() => {
      card.remove();
      const sub = (state.adminAllSubmissions || []).find(s => s.id === subId);
      if (sub) sub.status = 'rejected';
      updateAdminPending();
    }, 300);
    showToast('Görev reddedildi');
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Reddedilemedi'));
    btn.disabled = false;
  }
}

function updateAdminPending(count) {
  if (count === undefined) count = document.querySelectorAll('#approval-list .approval-card').length;
  const badge = document.getElementById('adm-nav-badge');
  const stat  = document.getElementById('adm-stat-pending');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }
  if (stat)  stat.textContent = count;
  _setCount('ad-count-approvals', count ? `${count} bekliyor` : '0');
  if (count === 0) {
    const list = document.getElementById('approval-list');
    if (list) list.innerHTML = `<div class="adm-empty">
      <div class="adm-empty-icon">✅</div>
      <div class="adm-empty-title">Bekleyen onay yok</div>
      <div class="adm-empty-sub">Tüm görev gönderimleri incelendi</div>
    </div>`;
  }
}

function filterApprovals(btn, filter) {
  document.querySelectorAll('.adm-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderApprovalList(filter);
}

/* ─── ADMIN TASK CRUD ─── */
function openAdminTaskModal(taskId) {
  const task = taskId ? (state.adminTasks || []).find(t => t.id === taskId) : null;
  state.editingTask = task || null;
  document.getElementById('adm-modal-task-title').textContent = task ? 'Görevi Düzenle' : 'Yeni Görev Ekle';
  document.getElementById('adm-task-emoji').value      = task?.emoji       || '';
  document.getElementById('adm-task-name').value       = task?.title       || '';
  document.getElementById('adm-task-desc').value       = task?.description || '';
  document.getElementById('adm-task-coin').value       = task?.coin_reward || '';
  document.getElementById('adm-task-xp').value         = task?.xp_reward   || '';
  document.getElementById('adm-task-category').value   = normalizeCategoryLabel(task?.category) || 'Çevre';
  document.getElementById('adm-task-difficulty').value = task?.difficulty  || 'Orta';
  openModal('modal-admin-task');
}

async function saveAdminTask() {
  const emoji      = document.getElementById('adm-task-emoji').value.trim();
  const title      = document.getElementById('adm-task-name').value.trim();
  const desc       = document.getElementById('adm-task-desc').value.trim();
  const coin       = parseInt(document.getElementById('adm-task-coin').value) || 0;
  const xp         = parseInt(document.getElementById('adm-task-xp').value)   || 0;
  const category   = normalizeCategoryLabel(document.getElementById('adm-task-category').value);
  const difficulty = document.getElementById('adm-task-difficulty').value;

  if (!title) { showToast('Görev başlığı boş olamaz'); return; }
  if (!emoji) { showToast('Emoji ekle'); return; }
  if (coin < 1 || xp < 1) { showToast('Ödüller 0\'dan büyük olmalı'); return; }

  const saveBtn = document.querySelector('#modal-admin-task .adm-modal-btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…'; }

  try {
    const payload = { emoji, title, description: desc, coin_reward: coin, xp_reward: xp, category, difficulty };
    if (state.editingTask) {
      await sbUpdateTask(state.editingTask.id, payload);
      showToast('Görev güncellendi ✓');
    } else {
      await sbCreateTask({ ...payload, is_active: true });
      showToast('Görev eklendi ✓');
    }
    closeModal('modal-admin-task');
    cacheClear('tasks'); loadAdminTasks();
    if (state.user.id) loadTasksAndRender();
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Kaydedilemedi'));
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Kaydet'; }
  }
}

async function deleteAdminTask(taskId, btn) {
  if (btn.dataset.confirm !== 'yes') {
    btn.dataset.confirm = 'yes';
    btn.textContent = '⚠️';
    btn.style.background = 'rgba(239,68,68,0.2)';
  document.body.classList.toggle('reduce-motion', !settingEnabled('motion'));
    setTimeout(() => {
      if (btn.dataset.confirm) { btn.dataset.confirm = ''; btn.textContent = '🗑️'; btn.style.background = ''; }
    }, 3000);
    return;
  }
  btn.disabled = true;
  try {
    await sbDeleteTask(taskId);
    await sbClearAllDailyTasksToday();
    showToast('Görev silindi');
    cacheClear('tasks'); loadAdminTasks();
    state._dailyTasksDate = null;
    if (state.user.id) loadTasksAndRender();
  } catch (e) {
    showToast('Hata: ' + e.message);
    btn.disabled = false;
  }
}

/* ─── SEED DEFAULT TASKS ─── */
const DEFAULT_TASKS = [
  { emoji:'🤳', title:'Bir arkadaşınla selfie paylaş',              description:'Arkadaşınla çektiğin selfiyi yükle.',                        category:'Sosyal',       difficulty:'Kolay'  },
  { emoji:'📸', title:'Etkinlik alanından fotoğraf yükle',          description:'Katıldığın etkinlik alanından bir fotoğraf çek.',              category:'Etkinlik',     difficulty:'Kolay'  },
  { emoji:'⚽', title:'Basketbol/Futbol oynarken fotoğraf paylaş',  description:'Spor yaparken çekilmiş bir fotoğrafını yükle.',               category:'Spor',         difficulty:'Orta'   },
  { emoji:'🏫', title:'Okulunda fotoğraf çek',                      description:'Okulundan bir kare paylaş.',                                  category:'Eğitim',       difficulty:'Kolay'  },
  { emoji:'📚', title:'Çalışma masanı paylaş',                      description:'Çalışma alanının fotoğrafını çek.',                           category:'Eğitim',       difficulty:'Kolay'  },
  { emoji:'📖', title:'Kütüphaneden fotoğraf paylaş',               description:'Kütüphanede olduğunu kanıtla.',                               category:'Eğitim',       difficulty:'Kolay'  },
  { emoji:'🚶', title:'Bugünkü yürüyüşünden fotoğraf paylaş',       description:'Yürüyüş sırasında çektiğin bir fotoğraf yükle.',              category:'Sağlık',       difficulty:'Kolay'  },
  { emoji:'🌿', title:'Bir park/doğa fotoğrafı paylaş',             description:'Doğadan güzel bir kare paylaş.',                             category:'Doğa',         difficulty:'Kolay'  },
  { emoji:'👗', title:'Bugünkü kombinini paylaş',                   description:'Günün kombini nasıl? Göster bakalım.',                        category:'Yaşam',        difficulty:'Kolay'  },
  { emoji:'☕', title:'Anlaşmalı kafedeki içeceğinin fotoğrafını çek', description:'Anlaşmalı kafeden aldığın içeceği fotoğrafla.',             category:'Yaşam',        difficulty:'Kolay'  },
  { emoji:'🚌', title:'Otobüs/metro/tramvay yolculuğundan fotoğraf paylaş', description:'Toplu taşımadayken bir fotoğraf çek.',                category:'Yaşam',        difficulty:'Kolay'  },
  { emoji:'🌅', title:'Hoşuna giden manzara paylaş',                description:'Etkilendiğin bir manzara fotoğrafı yükle.',                  category:'Doğa',         difficulty:'Kolay'  },
  { emoji:'🐾', title:'Sokak kedisi/köpek fotoğrafı çek',           description:'Bir sokak hayvanıyla fotoğraf çek.',                         category:'Hayvanlar',    difficulty:'Kolay'  },
  { emoji:'♻️', title:'Çöp attığını veya çevreyi temiz tuttuğunu göster', description:'Çevreye duyarlı bir anı fotoğrafla kanıtla.',          category:'Çevre',        difficulty:'Kolay'  },
  { emoji:'👥', title:'Arkadaş grubunla fotoğraf paylaş',           description:'En az 3 kişilik bir grup fotoğrafı yükle.',                  category:'Sosyal',       difficulty:'Kolay'  },
  { emoji:'🍽️', title:'Bugünkü yemeğini paylaş',                    description:'Bugün ne yedin? Fotoğrafla göster.',                         category:'Yaşam',        difficulty:'Kolay'  },
  { emoji:'📱', title:"Genco'yu story'de paylaş",                   description:"Genco uygulamasını Instagram/X story'inde paylaş.",           category:'Sosyal Medya', difficulty:'Kolay'  },
  { emoji:'🎥', title:'Genco hakkında kısa video paylaş',            description:"Genco hakkında kısa bir video hazırla ve paylaş.",           category:'Sosyal Medya', difficulty:'Orta'   },
  { emoji:'🐦', title:'Genco hakkında tweet paylaş',                 description:'#gencoapp #GencoylaKazan etiketleriyle tweet at.',           category:'Sosyal Medya', difficulty:'Kolay'  },
  { emoji:'❤️', title:"Genco Instagram gönderisini beğen",          description:'Genco Instagram hesabındaki son gönderiyi beğen.',            category:'Sosyal Medya', difficulty:'Kolay'  },
  { emoji:'💬', title:'Genco paylaşımına yorum yap',                 description:'Genco Instagram/X hesabına anlamlı bir yorum yaz.',          category:'Sosyal Medya', difficulty:'Kolay'  },
  { emoji:'🏷️', title:'Bir gönderide arkadaşını etiketle',          description:'Genco gönderisinde bir arkadaşını etiketle.',                category:'Sosyal Medya', difficulty:'Kolay'  },
  { emoji:'🔄', title:'Genco gönderisini repost/share yap',          description:'Genco paylaşımını X veya Instagram\'da paylaş.',             category:'Sosyal Medya', difficulty:'Kolay'  },
  { emoji:'👋', title:'Arkadaşın senin linkinle kayıt olsun',        description:'Referans linkinle bir arkadaşını Genco\'ya davet et.',       category:'Sosyal',       difficulty:'Zor'    },
  { emoji:'🏆', title:'Genco postunda en çok beğeni alan yorumu yap', description:"Genco'nun son gönderisine en çok beğeni alan yorumu yaz.", category:'Sosyal Medya', difficulty:'Zor'    },
  { emoji:'🤝', title:'1 yeni arkadaş ekle',                         description:'Platformda en az 1 yeni arkadaş ekle.',                     category:'Sosyal',       difficulty:'Kolay'  },
];

// Tüm kullanıcıların bugünkü 5 görevini yeniden dağıtır (görev havuzu değişmez).
// Atamalar silinir; herkes görevler sayfasını açtığında yeni 5 görev alır.
function reshuffleTodayTasks() {
  showConfirm(
    'Tüm kullanıcıların bugünkü görevleri yeniden dağıtılacak. Bugün gönderilen görevlerin kaydı ve ödülleri korunur, ama yeni listede görünmeyebilir. Devam edilsin mi?',
    '🎲 Evet, yenile',
    async () => {
      const btn = document.querySelector('[onclick="reshuffleTodayTasks()"]');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Yenileniyor…'; }
      try {
        await sbClearAllDailyTasksToday();
        state._dailyTasksDate = null;
        if (state.user?.id) await loadTasksAndRender();
        showToast('🎲 Bugünün görevleri yeniden dağıtıldı');
      } catch (e) {
        showToast('Hata: ' + (e.message || 'görevler yenilenemedi'));
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🎲 Bugünü yenile'; }
      }
    }
  );
}

function seedDefaultTasks() {
  showConfirm(
    `Mevcut TÜM görevler silinip ${DEFAULT_TASKS.length} yeni görev eklenecek. Emin misin?`,
    'Evet, Güncelle',
    async () => {
      const btn = document.querySelector('[onclick="seedDefaultTasks()"]');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Güncelleniyor…'; }
      try {
        const existing = await sbGetTasks();
        await Promise.all(existing.map(t => sbDeleteTask(t.id)));
        for (const task of DEFAULT_TASKS) {
          await sbCreateTask({ ...task, coin_reward: 0, xp_reward: 0, is_active: true });
        }
        // Tüm kullanıcıların bugünkü görev atamalarını sil → yeni görevler yüklensin
        await sbClearAllDailyTasksToday();
        cacheClear('tasks');
        loadAdminTasks(true);
        state._dailyTasksDate = null;
        loadTasksAndRender();
        showToast(`✅ ${DEFAULT_TASKS.length} görev güncellendi`);
      } catch(e) {
        showToast('Hata: ' + (e.message || 'Görevler güncellenemedi'));
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🔄 Tümünü Sıfırla'; }
      }
    }
  );
}

/* ─── ÖNERİLEN GÖREVLER (Alanya & gençlik odaklı) ───
   Admin panelinden tek tuşla eklenir; aynı başlıktaki görevler atlanır. */
const GENCO_SUGGESTED_TASKS = [
  // ── Çevre ──
  { emoji:'🏖️', title:'Sahilden 10 parça çöp topla',                 description:'Sahilde ya da parkta en az 10 parça çöp topla; topladıklarını fotoğrafla.',                         category:'Çevre',   difficulty:'Orta',  coin_reward:100, xp_reward:40  },
  { emoji:'♻️', title:'Ambalajları geri dönüşüme at',                description:'Biriktirdiğin pet şişe, kutu ya da kağıtları geri dönüşüm kutusuna atarken fotoğrafla.',            category:'Çevre',   difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🛍️', title:'Alışverişte bez çanta kullan',                description:'Poşet yerine bez çanta kullandığın alışverişinin fotoğrafını paylaş.',                             category:'Çevre',   difficulty:'Kolay', coin_reward:75, xp_reward:20  },
  { emoji:'🧴', title:'Gün boyu kendi matarandan su iç',              description:'Tek kullanımlık şişe yerine mataranı yanında taşı; mataranla bir fotoğraf çek.',                    category:'Çevre',   difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'🔋', title:'Atık pilleri toplama kutusuna bırak',           description:'Evdeki eski pilleri bir atık pil kutusuna bırakırken fotoğrafla.',                                  category:'Çevre',   difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🚶', title:'Bugün araç yerine yürü ya da bisiklete bin',    description:'Gideceğin bir yere yürüyerek ya da bisikletle git; yolun ya da rotanın fotoğrafını yükle.',         category:'Çevre',   difficulty:'Orta',  coin_reward:90, xp_reward:30  },
  { emoji:'👕', title:'Kullanmadığın bir eşyayı bağışla',             description:'Giymediğin kıyafeti, kitabı ya da oyuncağı ihtiyaç sahibine veya bağış kutusuna ver.',            category:'Çevre',   difficulty:'Orta',  coin_reward:80, xp_reward:30  },

  // ── Spor ──
  { emoji:'🏰', title:"Alanya Kalesi'ne yürüyerek çık",                description:'Kaleye yürüyerek çık ve zirveden manzarayla bir fotoğraf çek.',                                      category:'Spor',    difficulty:'Zor',   coin_reward:100, xp_reward:40  },
  { emoji:'🏃', title:'3 km koş',                                      description:'Koşu uygulamandaki mesafe ve sürenin ekran görüntüsünü yükle.',                                     category:'Spor',    difficulty:'Orta',  coin_reward:90, xp_reward:30  },
  { emoji:'🏊', title:'Denizde ya da havuzda yüz',                     description:'En az 20 dakika yüz; denizden ya da havuzdan bir fotoğraf paylaş.',                                 category:'Spor',    difficulty:'Orta',  coin_reward:80, xp_reward:30  },
  { emoji:'🧘', title:'15 dakika esneme ya da yoga yap',               description:'Esneme ya da yoga yaparken çekilmiş bir fotoğrafını veya uygulama ekranını yükle.',                 category:'Spor',    difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🚴', title:'Sahil yolunda 5 km bisiklet sür',               description:'Sahil yolunda bisiklet sürerken fotoğraf çek ya da rotanın ekran görüntüsünü yükle.',               category:'Spor',    difficulty:'Orta',  coin_reward:90, xp_reward:30  },
  { emoji:'🏐', title:'Plaj voleybolu oyna',                           description:'Arkadaşlarınla plaj voleybolu oynarken bir fotoğraf paylaş.',                                        category:'Spor',    difficulty:'Orta',  coin_reward:80, xp_reward:30  },
  { emoji:'🥾', title:'Toros yaylalarında doğa yürüyüşü yap',           description:'Dim Çayı ya da bir yayla rotasında yürü; parkurdan fotoğraf paylaş.',                               category:'Spor',    difficulty:'Zor',   coin_reward:120, xp_reward:50  },

  // ── Sağlık ──
  { emoji:'👣', title:'Bugün 7.500 adım at',                           description:'Adım sayarının ekran görüntüsünü yükle.',                                                             category:'Sağlık',  difficulty:'Orta',  coin_reward:90, xp_reward:30  },
  { emoji:'🥗', title:'Sağlıklı bir öğün hazırla',                     description:'Kendi hazırladığın sağlıklı öğünün fotoğrafını paylaş.',                                              category:'Sağlık',  difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'💧', title:'Bugün 2 litre su iç',                           description:'İçtiğin suyun şişelerini ya da su takip uygulamanın ekranını yükle.',                                category:'Sağlık',  difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'😴', title:'En az 8 saat uyu',                              description:'Telefonunun ya da uyku uygulamanın uyku kaydının ekran görüntüsünü yükle.',                          category:'Sağlık',  difficulty:'Kolay', coin_reward:75, xp_reward:20  },
  { emoji:'📵', title:'Yatmadan önce 1 saat telefonsuz kal',            description:'Ekran süresi raporunun ekran görüntüsünü yükle.',                                                     category:'Sağlık',  difficulty:'Orta',  coin_reward:80, xp_reward:30  },
  { emoji:'🍎', title:'Bugün 3 porsiyon meyve ya da sebze ye',         description:'Gün içinde yediğin meyve ve sebzelerin fotoğrafını paylaş.',                                         category:'Sağlık',  difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🩸', title:'Kan bağışında bulun (18 yaş ve üzeri)',         description:"Kızılay'da ya da bir bağış noktasında kan bağışı yap; bağış belgeni ya da fotoğrafını yükle.",     category:'Sağlık',  difficulty:'Zor',   coin_reward:120, xp_reward:50 },

  // ── Eğitim ──
  { emoji:'📖', title:'Bir kitabın 20 sayfasını oku',                  description:'Okuduğun kitabın ve kaldığın sayfanın fotoğrafını çek.',                                              category:'Eğitim',  difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'🗣️', title:'15 dakika yabancı dil pratiği yap',             description:'Bir dil uygulamasında ya da bir turistle konuşarak pratik yap, kanıtını yükle.',                     category:'Eğitim',  difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🏛️', title:"Kızılkule'yi ya da Alanya Müzesi'ni gez",       description:'Şehrin tarihini keşfet; gezdiğin yerden bir fotoğraf yükle.',                                        category:'Eğitim',  difficulty:'Orta',  coin_reward:100, xp_reward:40  },
  { emoji:'🦇', title:"Damlataş Mağarası'nı gez",                       description:'Mağarayı gez ve içeriden bir fotoğraf paylaş.',                                                       category:'Eğitim',  difficulty:'Orta',  coin_reward:80, xp_reward:30  },
  { emoji:'🎧', title:'Bir podcast bölümü dinle ve 3 not al',          description:'Dinlediğin bölümün ekranını ve aldığın notların fotoğrafını yükle.',                                 category:'Eğitim',  difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'💻', title:'Online bir derste 30 dakika çalış',             description:'İzlediğin dersin ya da çözdüğün alıştırmaların ekran görüntüsünü yükle.',                            category:'Eğitim',  difficulty:'Kolay', coin_reward:75, xp_reward:20  },
  { emoji:'📝', title:'10 yeni kelime öğren ve yaz',                   description:'Türkçe ya da yabancı dilde öğrendiğin 10 kelimeyi deftere yaz, fotoğrafını çek.',                   category:'Eğitim',  difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'♟️', title:'Bir satranç oyunu oyna',                        description:'Arkadaşınla ya da bir uygulamada satranç oyna; tahtanın ya da sonucun fotoğrafını yükle.',         category:'Eğitim',  difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🎨', title:'Bir kursa ya da atölyeye katıl',                description:'Gençlik merkezinde ya da belediyede bir kurs, atölye veya seminere katıl; oradan fotoğraf yükle.', category:'Eğitim',  difficulty:'Zor',   coin_reward:100, xp_reward:40  },

  // ── Sosyal ──
  { emoji:'🎟️', title:'Bir Genco etkinliğine katıl',                   description:'Etkinlikler sayfasındaki bir etkinliğe katıl ve oradan fotoğraf yükle.',                             category:'Sosyal',  difficulty:'Zor',   coin_reward:120, xp_reward:50 },
  { emoji:'🧓', title:'Bir büyüğünü ziyaret et',                       description:'Bir büyüğünü ziyaret et ya da ona bir işinde yardım et; birlikte bir kare paylaş.',                   category:'Sosyal',  difficulty:'Orta',  coin_reward:85, xp_reward:30  },
  { emoji:'🤲', title:'Gönüllü bir faaliyete katıl',                   description:'Bir STK, barınak ya da yardım kampanyasında gönüllü ol; faaliyetten fotoğraf yükle.',               category:'Sosyal',  difficulty:'Zor',   coin_reward:120, xp_reward:50 },
  { emoji:'💌', title:'Bir arkadaşına el yazısıyla not yaz',           description:'Sevdiğin birine el yazısıyla kısa bir not yaz ve fotoğrafını paylaş.',                               category:'Sosyal',  difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'🍽️', title:'Ailenle birlikte sofra hazırla',                description:'Ailenle birlikte hazırladığınız sofranın fotoğrafını paylaş.',                                        category:'Sosyal',  difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🙋', title:'Yol soran birine ya da bir turiste yardım et',  description:'Birine yol tarif et ya da yardım et; o anın ya da yerin fotoğrafını yükle.',                           category:'Sosyal',  difficulty:'Orta',  coin_reward:90, xp_reward:30  },
  { emoji:'📸', title:"Genco'da bir gönderi paylaş",                   description:'Topluluk akışında bir gönderi paylaş; gönderinin ekran görüntüsünü yükle.',                         category:'Sosyal',  difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'👥', title:"Genco'daki bir arkadaşınla buluş",              description:"Genco'da arkadaş olduğun biriyle buluşun ve birlikte bir fotoğraf çekin.",                           category:'Sosyal',  difficulty:'Orta',  coin_reward:85, xp_reward:30  },

  // ── Yaşam ──
  { emoji:'⭐', title:'Anlaşmalı bir işletmeye yorum yaz',             description:"Gittiğin anlaşmalı bir işletmeye Genco'da yorum ve puan bırak; ekran görüntüsünü yükle.",           category:'Yaşam',   difficulty:'Kolay', coin_reward:75, xp_reward:20  },
  { emoji:'🎁', title:'Coinlerinle bir ödül kullan',                   description:'Ödüller sayfasından bir ödülü anlaşmalı işletmede kullan; fotoğrafını paylaş.',                      category:'Yaşam',   difficulty:'Orta',  coin_reward:80, xp_reward:30  },
  { emoji:'🎸', title:'Bir konsere git',                               description:'Gündem sayfasındaki konser takviminden bir konsere git; konserden fotoğraf yükle.',                 category:'Yaşam',   difficulty:'Zor',   coin_reward:100, xp_reward:40  },
  { emoji:'🧹', title:'Odanı topla',                                   description:'Odanın toplamadan önceki ve sonraki halinin fotoğraflarını yükle.',                                  category:'Yaşam',   difficulty:'Kolay', coin_reward:75, xp_reward:20  },
  { emoji:'💰', title:'Bugünkü harcamalarını not et',                  description:'Gün içindeki harcamalarını deftere ya da bir uygulamaya yaz; fotoğrafını veya ekranını yükle.',     category:'Yaşam',   difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'🍳', title:'Yeni bir yemek tarifi dene',                    description:'Daha önce hiç yapmadığın bir tarifi dene; sonucun fotoğrafını paylaş.',                             category:'Yaşam',   difficulty:'Orta',  coin_reward:85, xp_reward:30  },
  { emoji:'🍊', title:'Yerel pazardan alışveriş yap',                  description:'Semt pazarından meyve ya da sebze al; tezgahın ya da aldıklarının fotoğrafını çek.',                category:'Yaşam',   difficulty:'Kolay', coin_reward:75, xp_reward:20  },

  // ── Doğa ──
  { emoji:'🌱', title:'Bir fidan dik ya da bitki sula',                description:'Diktiğin fidanın ya da suladığın bitkinin fotoğrafını çek.',                                          category:'Doğa',    difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'🐾', title:'Sokak hayvanlarına mama ve su bırak',           description:'Sokak hayvanları için mama ve temiz su bırak; fotoğrafını paylaş.',                                   category:'Doğa',    difficulty:'Kolay', coin_reward:70, xp_reward:20  },
  { emoji:'🌅', title:'Gün doğumunu izle',                             description:'Erken kalk ve gün doğumunu izle; o anın fotoğrafını yükle.',                                          category:'Doğa',    difficulty:'Orta',  coin_reward:90, xp_reward:30  },
  { emoji:'🌇', title:"Kleopatra Plajı'nda gün batımını izle",          description:'Gün batımını sahilden izle ve bir kare paylaş.',                                                      category:'Doğa',    difficulty:'Kolay', coin_reward:60, xp_reward:20  },
  { emoji:'🌳', title:'Parkta 30 dakika telefonsuz vakit geçir',        description:'Telefonunu kenara bırakıp parkta dinlen; vardığında ve ayrılırken birer fotoğraf çek.',              category:'Doğa',    difficulty:'Kolay', coin_reward:70, xp_reward:20  },
];

function addSuggestedTasks() {
  showConfirm(
    `${GENCO_SUGGESTED_TASKS.length} önerilen görev eklenecek (aynı isimde olanlar atlanır). Mevcut görevler silinmez.`,
    'Evet, Ekle',
    async () => {
      const btn = document.querySelector('[onclick="addSuggestedTasks()"]');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Ekleniyor…'; }
      try {
        const existing = await sbGetTasks();
        const titles = new Set(existing.map(t => (t.title || '').trim().toLocaleLowerCase('tr')));
        const missing = GENCO_SUGGESTED_TASKS.filter(t => !titles.has(t.title.toLocaleLowerCase('tr')));
        for (const task of missing) {
          await sbCreateTask({ ...task, is_active: true });
        }
        // Adminin kendi bugünkü atamasını yenile ki yeni görevleri hemen görebilsin;
        // diğer kullanıcılar yeni görevleri bir sonraki günlük atamada alır.
        if (missing.length) {
          await sbClearUserDailyTasksToday(state.user.id);
          state._dailyTasksDate = null;
          loadTasksAndRender();
        }
        cacheClear('tasks');
        loadAdminTasks(true);
        showToast(missing.length
          ? `${missing.length} yeni görev eklendi`
          : 'Önerilen görevlerin hepsi zaten eklenmiş');
      } catch (e) {
        showToast('Hata: ' + (e.message || 'Görevler eklenemedi'));
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✨ Önerilenleri ekle'; }
      }
    }
  );
}

/* ─── ADMIN REWARD CRUD ─── */
function previewRewardImage(input) {
  const file = input.files[0];
  if (!file) return;
  const preview     = document.getElementById('adm-reward-image-preview');
  const placeholder = document.getElementById('adm-reward-image-placeholder');
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function _resetRewardImagePickerUI() {
  const preview     = document.getElementById('adm-reward-image-preview');
  const placeholder = document.getElementById('adm-reward-image-placeholder');
  const fileInput   = document.getElementById('adm-reward-image-file');
  if (preview)     { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'block';
  if (fileInput)   fileInput.value = '';
  const hidden = document.getElementById('adm-reward-image');
  if (hidden) hidden.value = '';
}

function openAdminRewardModal(rewardId) {
  const reward = rewardId ? (state.adminRewards || []).find(r => r.id === rewardId) : null;
  state.editingReward = reward || null;
  document.getElementById('adm-modal-reward-title').textContent = reward ? 'Ödülü Düzenle' : 'Yeni Ödül Ekle';
  document.getElementById('adm-reward-emoji').value    = reward?.emoji        || '';
  document.getElementById('adm-reward-name').value     = reward?.name         || '';
  document.getElementById('adm-reward-desc').value     = reward?.description  || '';
  document.getElementById('adm-reward-partner').value  = reward?.partner_name || '';
  document.getElementById('adm-reward-cost').value     = reward?.coin_cost    || '';
  document.getElementById('adm-reward-category').value = normalizeCategoryLabel(reward?.category) || 'Yemek';

  _resetRewardImagePickerUI();
  document.getElementById('adm-reward-image').value = reward?.image_url || '';
  if (reward?.image_url) {
    const preview     = document.getElementById('adm-reward-image-preview');
    const placeholder = document.getElementById('adm-reward-image-placeholder');
    if (preview)     { preview.src = reward.image_url; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
  }

  openModal('modal-admin-reward');
}

async function saveAdminReward() {
  const emoji    = document.getElementById('adm-reward-emoji').value.trim();
  const name     = document.getElementById('adm-reward-name').value.trim();
  const desc     = document.getElementById('adm-reward-desc').value.trim();
  const partner  = document.getElementById('adm-reward-partner').value.trim();
  const cost     = parseInt(document.getElementById('adm-reward-cost').value) || 0;
  const category = normalizeCategoryLabel(document.getElementById('adm-reward-category').value);

  if (!name)  { showToast('Ödül adı boş olamaz'); return; }
  if (!emoji) { showToast('Emoji ekle'); return; }
  if (cost < 1) { showToast('Coin maliyeti 0\'dan büyük olmalı'); return; }

  const saveBtn = document.querySelector('#modal-admin-reward .adm-modal-btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Kaydediliyor…'; }

  try {
    let image_url = document.getElementById('adm-reward-image').value.trim() || null;
    const imageFile = document.getElementById('adm-reward-image-file')?.files[0];
    if (imageFile) {
      saveBtn.textContent = 'Görsel yükleniyor…';
      image_url = await sbUploadRewardImage(imageFile);
    }

    const payload = { emoji, name, description: desc, partner_name: partner, coin_cost: cost, category, image_url };
    if (state.editingReward) {
      await sbUpdateReward(state.editingReward.id, payload);
      showToast('Ödül güncellendi ✓');
    } else {
      await sbCreateReward({ ...payload, is_active: true });
      showToast('Ödül eklendi ✓');
    }
    closeModal('modal-admin-reward');
    cacheClear('rewards'); loadAdminRewards();
    if (state.user.id) loadRewardsAndRender();
  } catch (e) {
    showToast('Hata: ' + (e.message || 'Kaydedilemedi'));
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Kaydet'; }
  }
}

async function deleteAdminReward(rewardId, btn) {
  if (btn.dataset.confirm !== 'yes') {
    btn.dataset.confirm = 'yes';
    btn.textContent = '⚠️';
    btn.style.background = 'rgba(239,68,68,0.2)';
    setTimeout(() => {
      if (btn.dataset.confirm) { btn.dataset.confirm = ''; btn.textContent = '🗑️'; btn.style.background = ''; }
    }, 3000);
    return;
  }
  btn.disabled = true;
  try {
    await sbDeleteReward(rewardId);
    showToast('Ödül silindi');
    cacheClear('rewards'); loadAdminRewards();
    if (state.user.id) loadRewardsAndRender();
  } catch (e) {
    showToast('Hata: ' + e.message);
    btn.disabled = false;
  }
}

function adminSearchUsers(query) {
  adminFilterUsers();
}

let _activeUserFilter = 'all';

function setUserFilter(btn, filter) {
  document.querySelectorAll('.afc').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _activeUserFilter = filter;
  adminFilterUsers();
}

function adminFilterUsers() {
  const query  = (document.querySelector('.adm-tab-content.active .adm-search')?.value || '').toLowerCase().trim();
  const filter = _activeUserFilter || 'all';
  const rows   = document.querySelectorAll('.adm-dashboard-user-list .adm-user-row, #adm-user-list .adm-user-row');
  rows.forEach(row => {
    const nameText  = (row.querySelector('.adm-item-name')?.textContent || '').toLowerCase();
    const subText   = (row.querySelector('.adm-item-sub')?.textContent  || '').toLowerCase();
    const level     = row.dataset.level     || '';
    const suspended = row.dataset.suspended || '0';

    const matchSearch = !query || nameText.includes(query) || subText.includes(query);
    let matchFilter = true;
    if (filter === 'suspended') matchFilter = suspended === 'true';
    else if (filter.startsWith('level:')) matchFilter = level === filter.slice(6);

    row.style.display = (matchSearch && matchFilter) ? '' : 'none';
  });
}

/* ─── NOTIFICATIONS PAGE ─── */
async function updateNotifDot() {
  if (!state.user?.id) return;
  const dot = document.querySelector('.notif-dot');
  if (!settingEnabled('notifications')) {
    if (dot) dot.classList.remove('has-unread');
    return;
  }
  try {
    const notifs = await sbGetNotifications(state.user.id);
    setNotifBadge(notifs.filter(n => !n.is_read).length);
  } catch(e) {}
}

// Üst bardaki zil: okunmamış sayısı rozeti; sayı artınca zil kısa bir sallanır
let _notifBadgeCount = 0;
function setNotifBadge(count) {
  const btn = document.querySelector('.notif-btn');
  const dot = btn?.querySelector('.notif-dot');
  if (!btn || !dot) return;
  const enabled = settingEnabled('notifications');
  const n = enabled ? count : 0;
  dot.classList.toggle('has-unread', n > 0);
  dot.textContent = n > 9 ? '9+' : n > 0 ? String(n) : '';
  btn.classList.toggle('has-unread', n > 0);
  btn.setAttribute('aria-label', n > 0 ? `Bildirimler, ${n} okunmamış` : 'Bildirimler');
  if (n > _notifBadgeCount) {
    btn.classList.remove('is-ringing');
    void btn.offsetWidth; // animasyonu yeniden başlat
    btn.classList.add('is-ringing');
  }
  _notifBadgeCount = n;
}

/* Bildirim türleri: ikon (SVG), renk (r,g,b) ve filtre kategorisi */
const NT_ICONS = {
  check:  '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 5-5.2"/>',
  cross:  '<circle cx="12" cy="12" r="8.5"/><path d="M9.3 9.3l5.4 5.4M14.7 9.3l-5.4 5.4"/>',
  gift:   '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M3 7.5h18v3H3zM12 7.5V20M12 7.5c-1.5-3.5-5.5-4-5.5-1.5S10.5 7.5 12 7.5zm0 0c1.5-3.5 5.5-4 5.5-1.5S13.5 7.5 12 7.5z"/>',
  mega:   '<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  users:  '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><path d="M15.5 5.6a3.3 3.3 0 0 1 0 6M17.5 14.3c1.8.6 3 2.2 3.5 4.7"/>',
  userOff:'<circle cx="10" cy="8.5" r="3.3"/><path d="M4 19c.6-3.2 3-5 6-5s5.4 1.8 6 5M16.5 11h5"/>',
  game:   '<path d="M7 8h10a4 4 0 0 1 4 4.3l-.4 3.5a2.4 2.4 0 0 1-4.3 1.2L15 15H9l-1.3 2a2.4 2.4 0 0 1-4.3-1.2L3 12.3A4 4 0 0 1 7 8z"/><path d="M7.5 10.5v3M6 12h3M15.5 11.5h.01M17.5 13h.01"/>',
  crown:  '<path d="M4 8l4 4 4-6 4 6 4-4-1.5 10h-13z"/><path d="M6 20.5h12"/>',
  bell:   '<path d="M6 10a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10z"/><path d="M10 19.5a2.2 2.2 0 0 0 4 0"/>',
};
const NT_TYPES = {
  task_approved:   { icon: 'check',   rgb: '52,211,153',  cat: 'tasks',   label: 'Görev' },
  task_rejected:   { icon: 'cross',   rgb: '251,113,133', cat: 'tasks',   label: 'Görev' },
  bonus:           { icon: 'gift',    rgb: '251,146,60',  cat: 'rewards', label: 'Bonus' },
  admin_message:   { icon: 'mega',    rgb: '129,140,248', cat: 'news',    label: 'Duyuru' },
  friend_request:  { icon: 'users',   rgb: '96,165,250',  cat: 'social',  label: 'Arkadaşlık' },
  friend_accepted: { icon: 'users',   rgb: '45,212,191',  cat: 'social',  label: 'Arkadaşlık' },
  friend_rejected: { icon: 'userOff', rgb: '148,163,184', cat: 'social',  label: 'Arkadaşlık' },
  game_reward:     { icon: 'game',    rgb: '74,222,128',  cat: 'rewards', label: 'Snake Genco' },
  flappy_reward:   { icon: 'game',    rgb: '251,191,36',  cat: 'rewards', label: 'Flappy Genco' },
  quiz_reward:     { icon: 'crown',   rgb: '167,139,250', cat: 'rewards', label: 'Yarışma' },
};
const NT_FILTERS = [
  { id: 'all',     label: 'Tümü' },
  { id: 'unread',  label: 'Okunmamış' },
  { id: 'rewards', label: 'Ödüller' },
  { id: 'tasks',   label: 'Görevler' },
  { id: 'social',  label: 'Arkadaşlar' },
  { id: 'news',    label: 'Duyurular' },
];

function _ntType(n) {
  // Eski Flappy bildirimleri game_reward türüyle kaydedildi: başlıktan tanı
  const type = n.type === 'game_reward' && /^Flappy Genco/.test(n.title || '') ? 'flappy_reward' : n.type;
  return NT_TYPES[type] || { icon: 'bell', rgb: '96,165,250', cat: 'other', label: 'Bildirim' };
}
function _ntMatches(n, filter) {
  if (filter === 'all') return true;
  if (filter === 'unread') return !n.is_read;
  return _ntType(n).cat === filter;
}
// Liste sağındaki kısa zaman: "Az önce", "5 dk", "3 sa", "Dün", "12 Eyl"
function _ntTime(dateStr) {
  const d = new Date(dateStr);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk`;
  if (mins < 60 * 24 && d.toDateString() === new Date().toDateString()) return `${Math.floor(mins / 60)} sa`;
  if (_ntGroup(d) === 'Dün') return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
function _ntGroup(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff <= 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  if (diff < 7) return 'Bu hafta';
  return 'Daha önce';
}

function _ntEmptyHTML(filter) {
  const map = {
    all:     ['Gelen kutun boş', 'Görev onayları, ödüller ve duyurular burada görünecek.'],
    unread:  ['Hepsini okudun', 'Okunmamış bildirimin kalmadı. Harika gidiyorsun!'],
    rewards: ['Henüz ödül bildirimi yok', 'Oyunlardan ve bonuslardan kazandıkların burada listelenir.'],
    tasks:   ['Görev bildirimi yok', 'Görevlerin onaylandığında sana haber vereceğiz.'],
    social:  ['Arkadaşlık bildirimi yok', 'Gelen istekler ve yanıtlar burada görünür.'],
    news:    ['Duyuru yok', 'Genco ekibinin duyuruları burada yayınlanır.'],
  };
  const [title, sub] = map[filter] || map.all;
  return `<div class="nt-empty">
    <span class="nt-empty-art" aria-hidden="true"><svg viewBox="0 0 24 24">${filter === 'unread' ? NT_ICONS.check : NT_ICONS.bell}</svg></span>
    <strong>${title}</strong><small>${sub}</small>
  </div>`;
}

function _ntItemHTML(n) {
  const t = _ntType(n);
  return `<article class="nt-item${n.is_read ? '' : ' is-unread'}" style="--tc:${t.rgb}" data-id="${n.id}" onclick="markNotifRead(this,'${n.id}')">
    <span class="nt-ic"><svg viewBox="0 0 24 24">${NT_ICONS[t.icon]}</svg></span>
    <div class="nt-body">
      <div class="nt-top"><span class="nt-kind">${t.label}</span><time>${_ntTime(n.created_at)}</time></div>
      <b class="nt-title">${escHtml(n.title || '')}</b>
      ${n.message ? `<p class="nt-msg">${escHtml(n.message)}</p>` : ''}
    </div>
    <i class="nt-dot" aria-label="Okunmadı"></i>
  </article>`;
}

// Başlıktaki sayaç, alt yazı, araç butonları ve filtre çiplerini günceller (listeyi yeniden çizmeden)
function _ntRefreshMeta() {
  const notifs = state.notifs || [];
  const unread = notifs.filter(n => !n.is_read).length;
  const sub = document.getElementById('nt-sub');
  if (sub) sub.innerHTML = !notifs.length
    ? 'Yeni gelişmeler burada görünecek.'
    : unread ? `<span>${unread} okunmamış</span> · toplam ${notifs.length} bildirim` : `Hepsi okundu · toplam ${notifs.length} bildirim`;
  const count = document.getElementById('nt-hero-count');
  if (count) { count.hidden = !unread; count.textContent = unread > 9 ? '9+' : unread; }
  const readAll = document.getElementById('nt-read-all-btn');
  if (readAll) readAll.hidden = !unread;
  const clear = document.getElementById('notif-clear-all-btn');
  if (clear) clear.hidden = !notifs.length;
  setNotifBadge(unread);

  const chips = document.getElementById('nt-chips');
  if (!chips) return;
  const active = state.ntFilter || 'all';
  chips.innerHTML = !notifs.length ? '' : NT_FILTERS
    .map(f => ({ ...f, n: notifs.filter(x => _ntMatches(x, f.id)).length }))
    .filter(f => f.id === 'all' || f.id === 'unread' || f.n > 0 || f.id === active)
    .map(f => `<button type="button" role="tab" class="nt-chip${f.id === active ? ' active' : ''}" aria-selected="${f.id === active}" onclick="setNotifFilter('${f.id}')">
      ${f.label}${f.n && f.id !== 'all' ? `<i>${f.n}</i>` : ''}</button>`).join('');
}

function setNotifFilter(id) {
  state.ntFilter = id;
  renderNotifList();
}

function renderNotifList() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  const notifs = state.notifs || [];
  const filter = state.ntFilter || 'all';
  _ntRefreshMeta();
  const shown = notifs.filter(n => _ntMatches(n, filter));
  if (!shown.length) { list.innerHTML = _ntEmptyHTML(notifs.length ? filter : 'all'); return; }

  const groups = [];
  shown.forEach(n => {
    const g = _ntGroup(new Date(n.created_at));
    let grp = groups.find(x => x.name === g);
    if (!grp) groups.push(grp = { name: g, items: [] });
    grp.items.push(n);
  });
  list.innerHTML = groups.map(g => `
    <section class="nt-group">
      <h3 class="nt-group-h">${g.name}<span>${g.items.length}</span></h3>
      <div class="nt-stack">${g.items.map(n => n.type === 'friend_request'
        ? renderFriendRequestNotif(n, state.ntFriendData?.[n.id], state.ntProfiles || {})
        : _ntItemHTML(n)).join('')}</div>
    </section>`).join('');
}

async function loadNotifications() {
  const list = document.getElementById('notif-list');
  if (!list || !state.user.id) return;
  if (!state.notifs) {
    list.innerHTML = `<div class="nt-skeleton">${'<div class="nt-skel-row"><i></i><span><b></b><em></em></span></div>'.repeat(4)}</div>`;
  }
  try {
    const notifs = await sbGetNotifications(state.user.id);

    // Arkadaşlık isteklerinin verisini çöz ve gönderenlerin profillerini tek sorguda al
    const friendData = {};
    notifs.forEach(n => {
      if (n.type !== 'friend_request') return;
      try { friendData[n.id] = JSON.parse(n.message); } catch (_e) {}
    });
    let profileMap = {};
    const ids = Object.values(friendData).map(d => d?.requesterId).filter(Boolean);
    if (ids.length) {
      try {
        const profiles = await sbGetBasicProfiles(ids);
        profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      } catch (_e) { /* fotoğraf olmadan da kart çizilebilir */ }
    }

    state.notifs = notifs;
    state.ntFriendData = friendData;
    state.ntProfiles = profileMap;
    renderNotifList();
  } catch(e) {
    list.innerHTML = `<div class="nt-empty nt-empty-error">
      <span class="nt-empty-art" aria-hidden="true"><svg viewBox="0 0 24 24">${CONFIRM_ICONS.warn}</svg></span>
      <strong>Bildirimler yüklenemedi</strong><small>Bağlantını kontrol edip tekrar dene.</small>
      <button type="button" class="nt-retry" onclick="loadNotifications()">Tekrar dene</button>
    </div>`;
  }
}

async function markAllNotificationsRead() {
  const unread = (state.notifs || []).filter(n => !n.is_read && n.type !== 'friend_request');
  if (!unread.length) { showToast('Yanıt bekleyen arkadaşlık isteklerin var'); return; }
  unread.forEach(n => { n.is_read = true; });
  renderNotifList();
  try {
    await Promise.all(unread.map(n => sbMarkNotifRead(n.id)));
  } catch (e) {
    showToast('Hata: bazı bildirimler güncellenemedi');
  }
}

function clearAllNotifications() {
  if (!state.user?.id) return;
  showConfirm('Tüm bildirimlerin kalıcı olarak silinecek. Bu işlem geri alınamaz.', 'Tümünü temizle', async () => {
    try {
      await sbClearAllNotifications(state.user.id);
      state.notifs = [];
      state.ntFilter = 'all';
      renderNotifList();
      showToast('Bildirimler temizlendi');
    } catch(e) {
      showToast('Hata: ' + e.message);
    }
  }, { title: 'Bildirimler temizlensin mi?', icon: 'trash' });
}

// Arkadaşlık isteği kartı: gönderenin fotoğrafı, adı ve Kabul et / Reddet
function renderFriendRequestNotif(n, data, profileMap) {
  const profile = profileMap[data?.requesterId] || {};
  const name = profile.full_name || profile.username || data?.requesterName || 'Bir Genco üyesi';
  const handle = profile.username ? `@${profile.username}` : '';
  const photo = profile.profile_photo_url;
  const avatar = photo
    ? `<span class="nt-fr-av" style="background-image:url('${escHtml(photo)}')"></span>`
    : `<span class="nt-fr-av">${escHtml(name[0].toUpperCase())}</span>`;
  const pending = !n.is_read && data?.requesterId;
  const actions = pending
    ? `<div class="nt-fr-actions">
         <button class="nt-fr-btn nt-fr-accept" onclick="event.stopPropagation(); acceptFriendRequest('${data.requesterId}','${n.id}',this)">
           <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Kabul et</span>
         </button>
         <button class="nt-fr-btn nt-fr-reject" onclick="event.stopPropagation(); rejectFriendRequest('${data.requesterId}','${n.id}',this)">
           <span>Reddet</span>
         </button>
       </div>`
    : '';
  return `<article class="nt-item nt-fr${pending ? ' is-unread is-pending' : ''}" style="--tc:96,165,250" data-notif-id="${n.id}">
    <span class="nt-fr-avwrap">${avatar}<span class="nt-fr-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></span></span>
    <div class="nt-body">
      <div class="nt-top"><span class="nt-kind">Arkadaşlık isteği</span><time>${_ntTime(n.created_at)}</time></div>
      <b class="nt-title">${escHtml(name)}</b>
      <p class="nt-msg">${pending ? `${handle ? `${escHtml(handle)} · ` : ''}seninle arkadaş olmak istiyor` : '<span class="nt-fr-done"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>İstek yanıtlandı</span>'}</p>
      ${actions}
    </div>
    <i class="nt-dot" aria-label="Okunmadı"></i>
  </article>`;
}

// İstek işlenirken kartın iki butonunu da kilitle; basılan buton yükleniyor görünür
function setFriendRequestBusy(btn, busy) {
  const card = btn?.closest('.nt-fr');
  card?.querySelectorAll('.nt-fr-btn').forEach(b => { b.disabled = busy; });
  btn?.classList.toggle('is-busy', busy);
}

async function acceptFriendRequest(requesterId, notifId, btn) {
  setFriendRequestBusy(btn, true);
  try {
    const alreadyFriends = await sbCheckFriendship(state.user.id, requesterId);
    if (!alreadyFriends) {
      await sbAddFriend(state.user.id, requesterId);
    }
    await sbMarkNotifRead(notifId);
    const myName = state.user.name || state.user.username || 'Kullanıcı';
    await sbAddNotification(requesterId, 'Arkadaşlık İsteği Kabul Edildi! 🎉',
      `${myName} arkadaşlık isteğini kabul etti. Artık arkadaşsınız!`, 'friend_accepted');
    showToast('Arkadaşlık isteği kabul edildi! 🎉');
    loadNotifications();
    loadFriendsPage();
  } catch(e) {
    showToast('İşlem başarısız');
    setFriendRequestBusy(btn, false);
  }
}

async function rejectFriendRequest(requesterId, notifId, btn) {
  setFriendRequestBusy(btn, true);
  try {
    await sbMarkNotifRead(notifId);
    const myName = state.user.name || state.user.username || 'Kullanıcı';
    await sbAddNotification(requesterId, 'Arkadaşlık İsteği',
      `${myName} arkadaşlık isteğini reddetti.`, 'friend_rejected');
    showToast('Arkadaşlık isteği reddedildi');
    loadNotifications();
  } catch(e) {
    showToast('İşlem başarısız');
    setFriendRequestBusy(btn, false);
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const h = Math.floor(mins / 60);
  if (h < 24)    return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

async function markNotifRead(el, notifId) {
  if (!el.classList.contains('is-unread')) return;
  el.classList.remove('is-unread');
  const n = (state.notifs || []).find(x => String(x.id) === String(notifId));
  if (n) n.is_read = true;
  _ntRefreshMeta();
  try { await sbMarkNotifRead(notifId); } catch (_e) {}
}

function scrollToSection(chip, sectionId) {
  document.querySelectorAll('.rw-cat').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  if (!sectionId) {
    document.getElementById('page-tasks').querySelector('.combined-rewards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

function toggleLsItem(item) {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.ls-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

async function submitHelp(){
  const topic = document.getElementById('help-topic')?.value || '';
  const msg   = document.getElementById('help-msg')?.value || '';
  if (!topic) { showToast('Lütfen bir konu seçin'); return; }
  if (!msg.trim()) { showToast('Lütfen mesajınızı yazın'); return; }

  const btn = document.querySelector('#page-help .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }

  try {
    await sbSendHelpMessage(state.user.id, topic, msg.trim());
    showToast("Mesajınız admin'e iletildi 📨");
    document.getElementById('help-topic').value = '';
    document.getElementById('help-msg').value = '';
  } catch (e) {
    showToast('Gönderilemedi, lütfen tekrar deneyin');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Gönder 📨'; }
  }
}

/* ─── GERİ BİLDİRİM ───
   Mesajlar help_messages tablosuna "Geri Bildirim · <tür>" konusuyla yazılır ve
   admin panelindeki Mesajlar sekmesine düşer. Admin yanıtı burada ve bildirimlerde görünür.
   Memnuniyet puanı ve hata bölümü mesajın başına "Memnuniyet: …" / "Bölüm: …" satırı olarak eklenir;
   geçmişte bu satırlar ayrıştırılıp etiket olarak gösterilir. */
const GFX_MOODS = { 1: '😣', 2: '🙁', 3: '😐', 4: '🙂', 5: '😍' };
const GFX_TYPES = {
  'Öneri':          { ic: '💡', ph: 'Fikrini anlat: ne eklensin ya da neyi daha iyi yapabiliriz?' },
  'Hata bildirimi': { ic: '🐞', ph: 'Ne yaparken oldu, ne bekliyordun, ne oldu? Adım adım yazarsan hızlı çözeriz.' },
  'Şikayet':        { ic: '⚠️', ph: 'Neler yaşadığını anlat, en kısa sürede ilgilenelim.' },
  'İşletme':        { ic: '🏪', ph: 'Hangi işletme ve ne oldu? İndirim, kupon ya da hizmetle ilgili detay ver.' },
  'Diğer':          { ic: '💬', ph: 'Aklındakini yaz, Genco ekibi okuyacak.' },
};
const GFX_MIN = 10;
const GFX_MAX = 900;

function _gfxState() { return (state.feedback = state.feedback || { type: null, mood: 0, area: '', filter: 'all', msgs: [] }); }

function selectFeedbackMood(btn) {
  const f = _gfxState();
  const v = Number(btn.dataset.mood);
  f.mood = f.mood === v ? 0 : v;
  document.querySelectorAll('#gfx-moods button').forEach(b => b.classList.toggle('active', Number(b.dataset.mood) === f.mood));
}

function selectFeedbackType(btn) {
  const f = _gfxState();
  f.type = btn.dataset.type;
  document.querySelectorAll('#gfb-types button').forEach(b => b.classList.toggle('active', b === btn));
  const areas = document.getElementById('gfx-areas');
  if (areas) areas.hidden = f.type !== 'Hata bildirimi';
  if (f.type !== 'Hata bildirimi') { f.area = ''; document.querySelectorAll('#gfx-areas button').forEach(b => b.classList.remove('active')); }
  const ta = document.getElementById('gfb-msg');
  if (ta) ta.placeholder = GFX_TYPES[f.type]?.ph || '';
  onFeedbackInput();
}

function selectFeedbackArea(btn) {
  const f = _gfxState();
  f.area = f.area === btn.textContent ? '' : btn.textContent;
  document.querySelectorAll('#gfx-areas button').forEach(b => b.classList.toggle('active', b.textContent === f.area));
}

function onFeedbackInput() {
  const f = _gfxState();
  const len = (document.getElementById('gfb-msg')?.value || '').trim().length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('gfb-count', len);
  const fill = document.getElementById('gfx-meter-fill');
  if (fill) {
    fill.style.width = Math.min(100, len / GFX_MIN * 100) + '%';
    fill.classList.toggle('ok', len >= GFX_MIN);
  }
  set('gfx-hint', len >= GFX_MIN ? 'Harika, gönderebilirsin ✓' : `En az ${GFX_MIN} karakter · ${GFX_MIN - len} kaldı`);
  const ready = !!f.type && len >= GFX_MIN;
  const btn = document.getElementById('gfb-send');
  if (btn && !f.sending) btn.disabled = !ready;
  set('gfx-send-txt', !f.type ? 'Önce konu seç' : len < GFX_MIN ? 'Mesajını yaz' : 'Ekibe gönder');
}

async function submitFeedback() {
  const f = _gfxState();
  const input = document.getElementById('gfb-msg');
  const msg = (input?.value || '').trim();
  if (!f.type) { showToast('Önce geri bildirim türünü seç'); return; }
  if (msg.length < GFX_MIN) { showToast(`Mesajın en az ${GFX_MIN} karakter olmalı`); return; }

  const head = [
    f.mood ? `Memnuniyet: ${GFX_MOODS[f.mood]} ${f.mood}/5` : '',
    f.area ? `Bölüm: ${f.area}` : '',
  ].filter(Boolean).join('\n');
  const body = (head ? head + '\n' : '') + msg.slice(0, GFX_MAX);

  const btn = document.getElementById('gfb-send');
  f.sending = true;
  if (btn) { btn.disabled = true; btn.classList.add('is-sending'); }
  const txt = document.getElementById('gfx-send-txt');
  if (txt) txt.textContent = 'Gönderiliyor…';
  try {
    await sbSendHelpMessage(state.user.id, `Geri Bildirim · ${f.type}`, body);
    document.getElementById('gfx-form').hidden = true;
    document.getElementById('gfx-done').hidden = false;
    feedbackReset();
    loadFeedbackHistory();
  } catch (e) {
    console.error('Geri bildirim gönderilemedi:', e);
    showToast('Gönderilemedi, lütfen tekrar dene');
  } finally {
    f.sending = false;
    if (btn) btn.classList.remove('is-sending');
    onFeedbackInput();
  }
}

function feedbackReset() {
  const f = _gfxState();
  Object.assign(f, { type: null, mood: 0, area: '' });
  const input = document.getElementById('gfb-msg');
  if (input) { input.value = ''; input.placeholder = 'Önce yukarıdan bir konu seç, sonra buraya yaz.'; }
  document.querySelectorAll('#gfb-types button, #gfx-moods button, #gfx-areas button').forEach(b => b.classList.remove('active'));
  const areas = document.getElementById('gfx-areas');
  if (areas) areas.hidden = true;
  onFeedbackInput();
}

function feedbackNew() {
  document.getElementById('gfx-done').hidden = true;
  document.getElementById('gfx-form').hidden = false;
  document.getElementById('gfb-msg')?.focus();
}

function feedbackFilter(which) {
  _gfxState().filter = which;
  document.querySelectorAll('#gfx-filter button').forEach(b => b.classList.toggle('active', b.dataset.f === which));
  renderFeedbackHistory();
}

// "Memnuniyet: … / Bölüm: …" başlık satırlarını ayır
function _gfxParse(text) {
  const lines = String(text || '').split('\n');
  const meta = {};
  while (lines.length) {
    const m = lines[0].match(/^(Memnuniyet|Bölüm):\s*(.+)$/);
    if (!m) break;
    meta[m[1] === 'Bölüm' ? 'area' : 'mood'] = m[2];
    lines.shift();
  }
  return { meta, body: lines.join('\n').trim() };
}

function renderFeedbackHistory() {
  const el = document.getElementById('gfb-history');
  if (!el) return;
  const f = _gfxState();
  const msgs = f.msgs || [];
  const replied = msgs.filter(m => m.admin_reply || m.status === 'replied').length;
  const set = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; };
  const stats = document.getElementById('gfx-stats');
  if (stats) stats.hidden = !msgs.length;
  set('gfx-stat-sent', msgs.length);
  set('gfx-stat-replied', replied);
  const filter = document.getElementById('gfx-filter');
  if (filter) filter.hidden = !replied;

  if (!msgs.length) {
    el.innerHTML = `<div class="gfx-empty"><span>📭</span><b>Henüz mesaj göndermedin</b><small>Gönderdiğin geri bildirimler ve ekibin yanıtları burada görünecek.</small></div>`;
    return;
  }
  const list = f.filter === 'replied' ? msgs.filter(m => m.admin_reply || m.status === 'replied') : msgs;
  const statusMap = { open: ['Gönderildi', 'open'], replied: ['Yanıtlandı', 'replied'], closed: ['Kapatıldı', 'closed'] };
  el.innerHTML = `<div class="gfx-list">${list.map(m => {
    const [label, cls] = statusMap[m.admin_reply && m.status === 'open' ? 'replied' : m.status] || statusMap.open;
    const topic = String(m.topic || 'Mesaj').replace(/^Geri Bildirim · /, '');
    const ic = GFX_TYPES[topic]?.ic || '💬';
    const { meta, body } = _gfxParse(m.message);
    const date = new Date(m.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `<article class="gfx-item">
      <div class="gfx-item-top">
        <span class="gfx-item-ic">${ic}</span>
        <span class="gfx-item-copy"><b>${escHtml(topic === 'Hata bildirimi' ? 'Hata' : topic)}</b><small>${date}</small></span>
        <span class="gfx-status ${cls}">${label}</span>
      </div>
      ${meta.mood || meta.area ? `<div class="gfx-tags">${meta.mood ? `<span>${escHtml(meta.mood)}</span>` : ''}${meta.area ? `<span>📍 ${escHtml(meta.area)}</span>` : ''}</div>` : ''}
      <p class="gfx-bubble">${escHtml(body)}</p>
      ${m.admin_reply ? `<div class="gfx-reply"><span class="gfx-reply-av">G</span><div><small>Genco ekibi</small><p>${escHtml(m.admin_reply)}</p></div></div>` : ''}
    </article>`;
  }).join('') || '<div class="gfx-empty gfx-empty-sm"><small>Henüz yanıtlanan mesaj yok.</small></div>'}</div>`;
}

async function loadFeedbackHistory() {
  const el = document.getElementById('gfb-history');
  onFeedbackInput();
  if (!el || !state.user?.id) return;
  try {
    _gfxState().msgs = await sbGetMyHelpMessages(state.user.id);
    renderFeedbackHistory();
  } catch (e) {
    console.warn('Geri bildirim geçmişi yüklenemedi:', e);
    el.innerHTML = `<div class="gfx-empty"><span>🔒</span><b>Geçmiş şu an gösterilemiyor</b><small>Mesajın yine de ekibe iletilir.</small></div>`;
  }
}

/* ─── ADMIN DASHBOARD ─── */

const LEVEL_COLORS = { Bronz:'#cd7f32', Gümüş:'#9ca3af', Altın:'#facc15', Platin:'#818cf8', Elmas:'#38bdf8', Legend:'#f472b6' };
const LEVEL_ORDER_FULL = ['Bronz','Gümüş','Altın','Platin','Elmas','Legend'];

async function loadAdminDashboard(force = false) {
  if (!force && cacheValid('dashboard') && state._dashLoaded) {
    renderDashboard(); return;
  }
  try {
    const [users, subs] = await Promise.all([
      state.adminAllUsers       || sbGetAllUsers(),
      state.adminAllSubmissions || sbGetAllSubmissions()
    ]);
    state.adminAllUsers        = users;
    state.adminAllSubmissions  = subs;
    state._dashLoaded          = true;
    cacheSet('dashboard');
    renderDashboard();
  } catch (e) {
    showToast('Dashboard yüklenemedi');
  }
}

function renderDashboard() {
  const users = state.adminAllUsers        || [];
  const subs  = state.adminAllSubmissions  || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const totalUsers   = users.length;
  const pending      = subs.filter(s => s.status === 'review').length;
  const todayDone    = subs.filter(s => s.status === 'approved' && (s.submitted_at || '').startsWith(todayStr)).length;
  const totalXp      = users.reduce((acc, u) => acc + (u.user_stats?.xp || 0), 0);

  const el = id => document.getElementById(id);
  if (el('dash-total-users')) el('dash-total-users').textContent = totalUsers;
  if (el('dash-pending'))     el('dash-pending').textContent     = pending;
  if (el('dash-today-done'))  el('dash-today-done').textContent  = todayDone;
  if (el('dash-total-xp'))    el('dash-total-xp').textContent    = totalXp >= 1000 ? (totalXp/1000).toFixed(1)+'K' : totalXp;

  /* Level dağılımı — DB'deki level alanına değil, XP'den hesapla */
  const levelCount = {};
  LEVEL_ORDER_FULL.forEach(l => levelCount[l] = 0);
  users.forEach(u => {
    const lv = levelBase(xpToLevel(u.user_stats?.xp || 0));
    if (levelCount[lv] !== undefined) levelCount[lv]++;
  });
  const chartEl = el('dash-level-chart');
  if (chartEl) {
    const max = Math.max(...Object.values(levelCount), 1);
    const BAR_MAX_H = 64;
    chartEl.innerHTML = LEVEL_ORDER_FULL.map(lv => {
      const cnt = levelCount[lv];
      const h   = Math.max(Math.round((cnt / max) * BAR_MAX_H), cnt > 0 ? 4 : 0);
      return `<div class="dlc-col">
        <div class="dlc-bar-wrap"><div class="dlc-bar" style="height:${h}px;background:${LEVEL_COLORS[lv]}"></div></div>
        <div class="dlc-count">${cnt}</div>
        <div class="dlc-label">${lv}</div>
      </div>`;
    }).join('');
  }

  /* En aktif üyeler */
  const userDone = {};
  subs.filter(s => s.status === 'approved').forEach(s => { userDone[s.user_id] = (userDone[s.user_id] || 0) + 1; });
  const topUsers = users
    .map(u => ({ ...u, done: userDone[u.id] || 0 }))
    .sort((a,b) => b.done - a.done)
    .filter(u => u.done > 0)
    .slice(0, 5);
  const topEl = el('dash-top-users');
  if (topEl) {
    topEl.innerHTML = topUsers.length
      ? topUsers.map((u,i) => {
          const initial = (u.username || u.full_name || '?')[0].toUpperCase();
          const photoStyle = u.profile_photo_url
            ? `style="background-image:url('${u.profile_photo_url}');background-size:cover;background-position:center;color:transparent"`
            : '';
          return `<div class="dash-top-row">
            <span class="dash-top-rank">${i+1}</span>
            <div class="dash-top-av" ${photoStyle}>${u.profile_photo_url ? '' : initial}</div>
            <div class="dash-top-info">
              <div class="dash-top-name">${u.full_name || u.username || 'Kullanıcı'}</div>
              <div class="dash-top-sub">${u.done} görev · ${u.user_stats?.xp || 0} XP</div>
            </div>
          </div>`;
        }).join('')
      : '<div class="adm-empty" style="padding:16px"><div>Henüz onaylanan görev yok</div></div>';
  }
}

/* ─── ADMIN PROFILE ─── */

function loadAdminProfile() {
  const u = state.user;
  const name     = u.name || u.username || 'Admin';
  const username = u.username || '';
  const photo    = u.profilePhoto || '';

  const avEl = document.getElementById('adm-profile-av');
  if (avEl) {
    if (photo) {
      avEl.style.backgroundImage    = `url('${photo}')`;
      avEl.style.backgroundSize     = 'cover';
      avEl.style.backgroundPosition = 'center';
      avEl.textContent = '';
    } else {
      avEl.style.backgroundImage = '';
      avEl.textContent = name[0].toUpperCase();
    }
  }
  const nameEl = document.getElementById('adm-profile-name');
  if (nameEl) nameEl.textContent = name;
  const userEl = document.getElementById('adm-profile-username');
  if (userEl) userEl.textContent = username ? '@' + username : '';

  const users    = state.adminAllUsers        || [];
  const subs     = state.adminAllSubmissions  || [];
  const tasks    = state.adminTasks           || [];
  const approved = subs.filter(s => s.status === 'approved').length;

  const el = id => document.getElementById(id);
  if (el('adm-pstat-users'))    el('adm-pstat-users').textContent    = users.length || '—';
  if (el('adm-pstat-approved')) el('adm-pstat-approved').textContent = approved     || '—';
  if (el('adm-pstat-tasks'))    el('adm-pstat-tasks').textContent    = tasks.length || '—';
}

/* ─── DUYURU / BROADCAST ─── */

async function sendBroadcast() {
  const title   = document.getElementById('duyuru-baslik')?.value.trim();
  const message = document.getElementById('duyuru-mesaj')?.value.trim();
  const team    = document.getElementById('duyuru-hedef')?.value;

  if (!title)   { showToast('Başlık boş olamaz'); return; }
  if (!message) { showToast('Mesaj boş olamaz'); return; }

  const btn = document.querySelector('.duyuru-send-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }

  try {
    const users = state.adminAllUsers || await sbGetAllUsers();
    state.adminAllUsers = users;
    const targets = team ? users.filter(u => u.team === team) : users;
    if (!targets.length) { showToast('Hedef kullanıcı bulunamadı'); return; }

    await Promise.all(targets.map(u =>
      sbAddNotification(u.id, title, message, 'admin_message')
    ));

    showToast(`📢 ${targets.length} kullanıcıya duyuru gönderildi`);
    document.getElementById('duyuru-baslik').value  = '';
    document.getElementById('duyuru-mesaj').value   = '';
    document.getElementById('duyuru-hedef').value   = '';
  } catch (e) {
    showToast('Duyuru gönderilemedi: ' + (e.message || 'Hata'));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Gönder ➤'; }
  }
}

/* ─── ADMIN PARTNERS CRUD ─── */

const PARTNER_LOGOS = {
  'luuq cafe':         'luuqcafe.png',
  'kavurmacı göksay':  'kavurmaci.png',
  'just burger':       'justburger.png',
  'milklac':           'milklac.png',
  'eve':               'eve.png',
  'ixir':              'ixir.png',
  'gloria jeans':      'https://www.studio3mimarlik.com/wp-content/uploads/2024/07/1buyukcekmece-scaled.jpg',
  'valencia':          'valencia.png',
  'özgü döner':        'ozgudoner.png',
  'ozgu doner':        'ozgudoner.png',
  'q stand':           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2vkpkpyI_4_IP8jPVase9QP7yR9gThJAoutmnNGL4GA8tWVTQ3PZJb8uk&s=10',
};

function getPartnerLogo(p) {
  if (p.logo_url) return p.logo_url;
  if (!p.name) return '';
  const key = p.name.toLowerCase().trim()
    .replace(/i̇/g, 'i').replace(/ı/g, 'i').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o');
  // exact normalized match
  const normMap = {};
  for (const [k, v] of Object.entries(PARTNER_LOGOS)) {
    const nk = k.replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ö/g,'o');
    normMap[nk] = v;
  }
  if (normMap[key]) return normMap[key];
  // partial match
  const found = Object.entries(normMap).find(([k]) => key.includes(k) || k.includes(key));
  return found ? found[1] : '';
}

const DEFAULT_PARTNERS = [
  { emoji:'☕', name:'Luuq Cafe',       tag:'Cafe & İçecek', description:'Alanya\'nın en popüler kafelerinden Luuq Cafe, Genco üyelerine içeceklerde özel %20 indirim sunuyor.', discount:'%20 İndirim', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'👗', name:'Gloria Jeans',    tag:'Giyim & Moda',  description:'Gloria Jeans\'te Genco üyelerine tüm ürünlerde %15 indirim fırsatı.', discount:'%15 İndirim', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'🥤', name:'Noi',             tag:'Cafe',          description:'Noi\'de Genco üyelerine her şeyde %25 indirim.', discount:'%25 İndirim', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'🥤', name:'Q Stand',         tag:'İçecek',        description:'Q Stand\'de Genco üyelerine içeceklerde %25 indirim.', discount:'%25 İndirim', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'☕', name:'Mola Cafe',       tag:'Cafe',          description:'Mola Cafe\'de Genco üyelerine %15 indirim.', discount:'%15 İndirim', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'🏪', name:'Tuck',            tag:'',              description:'', discount:'', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'🏪', name:'Seventy Seven',   tag:'',              description:'', discount:'', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'☕', name:'Aura Cafe',       tag:'Cafe',          description:'', discount:'', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
  { emoji:'🏪', name:'Anna Pıcını',     tag:'',              description:'', discount:'', note:'Ödülü kullanmak için Ödüller sekmesinden kupon al.' },
];

function renderPartnerItems(partners) {
  return partners.map(p => {
    const logo = getPartnerLogo(p);
    const logoEl = logo
      ? `<img class="pr-logo" src="${escHtml(logo)}" alt="${escHtml(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="pr-emoji" style="display:none">${p.emoji || '🏪'}</div>`
      : `<div class="pr-emoji">${p.emoji || '🏪'}</div>`;
    return `
    <div class="partner-row">
      ${logoEl}
      <div class="pr-body">
        <div class="pr-name">${escHtml(p.name)}</div>
        ${p.tag ? `<div class="pr-tag">${escHtml(p.tag)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderAdminPartnerRows(partners) {
  return partners.map(p => {
    const logo = getPartnerLogo(p);
    return `
    <div class="adm-item-row">
      ${logo
        ? `<img class="adm-partner-thumb" src="${escHtml(logo)}" alt="" onerror="this.style.display='none'">`
        : `<span class="adm-partner-thumb-emoji">${p.emoji || '🏪'}</span>`}
      <div class="adm-item-body">
        <div class="adm-item-name">${escHtml(p.name)}</div>
        <div class="adm-item-sub">${p.tag ? escHtml(p.tag) : ''}${p.discount ? ' · ' + escHtml(p.discount) : ''}</div>
      </div>
      <div class="adm-item-actions">
        ${p.id ? `<button class="adm-act-btn" onclick="openAdminPartnerModal('${p.id}')">✏️</button>` : ''}
        ${p.id ? `<button class="adm-act-btn" onclick="deleteAdminPartner('${p.id}', this)">🗑️</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function loadAdminPartners() {
  const list = document.getElementById('adm-partners-list');
  if (!list) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const partners = await sbGetPartners();
    state.adminPartners = partners || [];
    list.innerHTML = (partners && partners.length)
      ? renderAdminPartnerRows(partners)
      : `<div class="adm-empty"><div class="adm-empty-icon">🤝</div><div>Henüz iş ortağı yok</div></div>`;
  } catch (e) {
    console.error('loadAdminPartners hata:', e);
    list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⚠️</div><div>Yüklenemedi</div></div>`;
  }
}

function previewPartnerLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const preview     = document.getElementById('adm-partner-logo-preview');
  const placeholder = document.getElementById('adm-partner-logo-placeholder');
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function _resetLogoPickerUI() {
  const preview     = document.getElementById('adm-partner-logo-preview');
  const placeholder = document.getElementById('adm-partner-logo-placeholder');
  const fileInput   = document.getElementById('adm-partner-logo-file');
  if (preview)     { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'block';
  if (fileInput)   fileInput.value = '';
  const hidden = document.getElementById('adm-partner-logo');
  if (hidden) hidden.value = '';
}

function openAdminPartnerModal(partnerId) {
  const fields = ['adm-partner-emoji','adm-partner-name','adm-partner-tag','adm-partner-desc','adm-partner-discount','adm-partner-note'];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  _resetLogoPickerUI();

  const titleEl = document.getElementById('adm-partner-modal-title');
  const saveBtn = document.getElementById('adm-partner-save-btn');

  if (partnerId) {
    const partner = state.adminPartners?.find(p => String(p.id) === String(partnerId));
    if (partner) {
      document.getElementById('adm-partner-emoji').value    = partner.emoji    || '';
      document.getElementById('adm-partner-name').value     = partner.name     || '';
      document.getElementById('adm-partner-tag').value      = partner.tag      || '';
      document.getElementById('adm-partner-desc').value     = partner.description || '';
      document.getElementById('adm-partner-discount').value = partner.discount  || '';
      document.getElementById('adm-partner-note').value     = partner.note      || '';
      document.getElementById('adm-partner-logo').value     = partner.logo_url  || '';
      if (partner.logo_url) {
        const preview     = document.getElementById('adm-partner-logo-preview');
        const placeholder = document.getElementById('adm-partner-logo-placeholder');
        if (preview)     { preview.src = partner.logo_url; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
      }
    }
    if (titleEl) titleEl.textContent = 'İş Ortağı Düzenle';
    if (saveBtn) { saveBtn.textContent = 'Kaydet'; saveBtn.dataset.editId = partnerId; }
  } else {
    if (titleEl) titleEl.textContent = 'İş Ortağı Ekle';
    if (saveBtn) { saveBtn.textContent = 'Ekle'; delete saveBtn.dataset.editId; }
  }

  openModal('modal-admin-partner');
}

async function saveAdminPartner() {
  const emoji    = document.getElementById('adm-partner-emoji').value.trim() || '🏪';
  const name     = document.getElementById('adm-partner-name').value.trim();
  const tag      = document.getElementById('adm-partner-tag').value.trim() || null;
  const desc     = document.getElementById('adm-partner-desc').value.trim() || null;
  const discount = document.getElementById('adm-partner-discount').value.trim() || null;
  const note     = document.getElementById('adm-partner-note').value.trim() || null;

  if (!name) { showToast('Dükkan adı boş olamaz'); return; }

  const btn = document.getElementById('adm-partner-save-btn');
  const editId = btn?.dataset.editId;

  if (btn) { btn.disabled = true; btn.textContent = editId ? 'Kaydediliyor…' : 'Ekleniyor…'; }

  try {
    // Logo dosyası seçildiyse Supabase Storage'a yükle
    let logo_url = document.getElementById('adm-partner-logo').value.trim() || null;
    const logoFile = document.getElementById('adm-partner-logo-file')?.files[0];
    if (logoFile) {
      if (btn) btn.textContent = 'Logo yükleniyor…';
      logo_url = await sbUploadPartnerLogo(logoFile);
    }

    if (editId) {
      const updates = { emoji, name };
      if (tag      !== null) updates.tag         = tag;
      if (desc     !== null) updates.description = desc;
      if (discount !== null) updates.discount    = discount;
      if (note     !== null) updates.note        = note;
      if (logo_url !== null) updates.logo_url    = logo_url;
      await sbUpdatePartner(editId, updates);
      showToast('İş ortağı güncellendi ✅');
    } else {
      const newPartner = { emoji, name, is_active: true };
      if (tag      !== null) newPartner.tag         = tag;
      if (desc     !== null) newPartner.description = desc;
      if (discount !== null) newPartner.discount    = discount;
      if (note     !== null) newPartner.note        = note;
      if (logo_url !== null) newPartner.logo_url    = logo_url;
      await sbCreatePartner(newPartner);
      showToast('İş ortağı eklendi 🤝');
    }
    closeModal('modal-admin-partner');
    loadAdminPartners();
    loadPartners();
  } catch (e) {
    console.error('saveAdminPartner hata:', e);
    showToast('Hata: ' + (e.message || JSON.stringify(e)));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = editId ? 'Kaydet' : 'Ekle'; }
  }
}

async function deleteAdminPartner(partnerId, btn) {
  btn.disabled = true;
  try {
    await sbDeletePartner(partnerId);
    showToast('İş ortağı kaldırıldı');
    loadAdminPartners();
    loadPartners();
  } catch (e) {
    showToast('Hata: ' + e.message);
    btn.disabled = false;
  }
}

/* ─── ADMIN EVENTS CRUD ─── */

async function loadAdminEvents() {
  const list = document.getElementById('adm-events-list');
  if (!list) return;
  list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">⏳</div><div>Yükleniyor…</div></div>`;
  try {
    const events = await sbGetEvents();
    state.adminEvents = events;
    if (!events.length) {
      list.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon">📅</div><div>Etkinlik yok</div></div>`;
      return;
    }
    list.innerHTML = events.map(ev => {
      const d = new Date(ev.event_date || ev.created_at);
      const dateStr = d.toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' });
      return `<div class="adm-item-row">
        <div class="adm-item-body">
          <div class="adm-item-name">📅 ${escHtml(ev.title)}</div>
          <div class="adm-item-sub">${dateStr}${ev.tag ? ' · ' + escHtml(ev.tag) : ''}</div>
        </div>
        <div class="adm-item-actions">
          <button class="adm-act-btn" onclick="deleteAdminEvent('${ev.id}', this)">🗑️</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    console.error('loadAdminEvents hata:', e);
    list.innerHTML = `<div class="adm-empty">Yüklenemedi: ${e.message || e}</div>`;
  }
}

function openAdminEventModal() {
  document.getElementById('adm-event-title').value       = '';
  document.getElementById('adm-event-description').value = '';
  document.getElementById('adm-event-date').value        = '';
  document.getElementById('adm-event-tag').value         = '';
  openModal('modal-admin-event');
}

async function saveAdminEvent() {
  const title       = document.getElementById('adm-event-title').value.trim();
  const description = document.getElementById('adm-event-description').value.trim() || null;
  const eventDate   = document.getElementById('adm-event-date').value || null;
  const tag         = document.getElementById('adm-event-tag').value.trim() || null;

  if (!title) { showToast('Başlık boş olamaz'); return; }

  const btn = document.querySelector('#modal-admin-event .adm-modal-btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Ekleniyor…'; }

  try {
    await sbCreateEvent({ title, description, event_date: eventDate, tag });
    showToast('Etkinlik eklendi 📅');
    closeModal('modal-admin-event');
    loadAdminEvents();
    loadEvents();
  } catch (e) {
    showToast('Hata: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Ekle'; }
  }
}

async function deleteAdminEvent(eventId, btn) {
  btn.disabled = true;
  try {
    await sbDeleteEvent(eventId);
    showToast('Etkinlik silindi');
    loadAdminEvents();
    loadEvents();
  } catch (e) {
    showToast('Hata: ' + e.message);
    btn.disabled = false;
  }
}


/* ─── MİNİ OYUN: SNAKE GENCO ─── */
/* Oyun performansı: Android'de tuval efektleri pahalı.
   • Piksel yoğunluğu sınırlanır (3x ekranda tuval 9 kat büyümesin)
   • shadowBlur (parlama) Android'de kapatılır; en çok kasmaya yol açan işlem budur */
const GAME_IS_ANDROID = /Android/i.test(navigator.userAgent || '');
function gameDpr() { return Math.min(window.devicePixelRatio || 1, GAME_IS_ANDROID ? 1.75 : 2); }
function _gBlur(v) { return GAME_IS_ANDROID ? 0 : v; }

/* ─── ORTAK PUANLAMA (Snake & Flappy) ───
   Coin ödülü ayrı kalır; puan = temel puan × combo çarpanı. Puan rekoru cihazda
   'bestScore' anahtarında tutulur ve game_scores tablosuna gönderilir (sıralama için). */
const GAME_COMBO_MAX = 5;

function _gameComboChip(id, combo) {
  const el = document.getElementById(id);
  if (!el) return;
  if (combo >= 2) {
    el.innerHTML = `<span>🔥 Combo</span><b>x${Math.min(combo, GAME_COMBO_MAX)}</b>`;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('show', 'pop');
  } else {
    el.classList.remove('show', 'pop');
  }
}
function _gameBump(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
// Oyun sonu: puan rekorunu kaydet, sunucuya gönder. true → yeni rekor
function _gameSaveScore(game, getFn, setFn, pts, extra) {
  const isBest = pts > 0 && pts > getFn('bestScore', 0);
  if (isBest) setFn('bestScore', pts);
  if (pts > 0 && state.user?.id && typeof sbSubmitGameScore === 'function') {
    sbSubmitGameScore(game, pts, extra || 0).catch(() => {});
  }
  return isBest;
}
// Başka cihazda kırılmış puan rekorunu bir kez çek (tablo yoksa sessizce geç)
const _gameSynced = {};
async function _gameSyncBest(game, getFn, setFn, onChange) {
  if (_gameSynced[game] || !state.user?.id || typeof sbGetMyGameScore !== 'function') return;
  _gameSynced[game] = true;
  try {
    const row = await sbGetMyGameScore(state.user.id, game, 'all');
    if (row && row.best_score > getFn('bestScore', 0)) { setFn('bestScore', row.best_score); onChange?.(); }
  } catch { /* game_scores kurulmamış olabilir */ }
}
// Sonuç kartındaki büyük puan + istatistik ızgarası (Stack sonuç kartıyla aynı görünüm)
function _gameOverCardHtml({ cls = '', isBest, pts, line, stats, awardId, awardText, actions }) {
  return `<div class="snake-card st-card ${cls}">
      <span class="sg-card-kicker">OYUN BİTTİ</span>
      ${isBest ? '<span class="snake-best-tag">★ YENİ REKOR</span>' : ''}
      <div class="st-card-score">${pts.toLocaleString('tr')}</div>
      <small class="g-card-unit">PUAN</small>
      <p class="g-card-line">${line}</p>
      <div class="fb-card-stats">${stats.map(s => `<div${s.cls ? ` class="${s.cls}"` : ''}>${s.coin ? '<span class="snake-score-coin g-stat-coin">G</span>' : ''}<b>${s.v}</b><small>${s.l}</small></div>`).join('')}</div>
      <p class="g-card-award" id="${awardId}">${awardText}</p>
      <div class="snake-card-actions">${actions}</div>
    </div>`;
}

const SNAKE_MAX_HEARTS = 2;
const SNAKE_UNLIMITED_HEARTS = true; // true: kalp harcanmaz (şimdilik sınırsız)
const SNAKE_GRID = 17;
const SNAKE_BASE_SPEED = 165;   // ms / kare
const SNAKE_MIN_SPEED = 85;
const SNAKE_BIG_COIN_LIFE = 6000;
const SNAKE_PTS_COIN = 10;       // puan: coin
const SNAKE_PTS_BIG = 30;        // puan: süper coin
const SNAKE_COMBO_MS = 4000;     // bu süre içinde yeni coin → combo büyür
const SNAKE_HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.4-4.5-9.5-9.1C1 8.4 3.1 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.8 0 5.9 3.9 4.4 7.4C19.4 16.5 12 21 12 21z"/></svg>';

const snake = {
  running: false, paused: false, over: false,
  body: [], prev: [], dir: { x: 1, y: 0 }, queue: [],
  coin: null, bigCoin: null, score: 0, pts: 0, combo: 0, comboLeft: 0, maxCombo: 0,
  speed: SNAKE_BASE_SPEED, acc: 0, last: 0, raf: null, cdTimer: null, endTimer: null,
  countdown: 0, cell: 20, touch: null,
  particles: [], floats: [], shake: 0, flash: 0
};

function _snakeDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function _snakeKey(name) { return `genco_snake_${name}_${state.user?.id || 'guest'}`; }
function _snakeGet(name, fallback) {
  try { const v = JSON.parse(localStorage.getItem(_snakeKey(name))); return v ?? fallback; } catch { return fallback; }
}
function _snakeSet(name, value) {
  try { localStorage.setItem(_snakeKey(name), JSON.stringify(value)); } catch {}
}
function _snakeDaily() {
  const d = _snakeGet('daily', null);
  if (!d || d.day !== _snakeDayKey()) return { day: _snakeDayKey(), used: 0, earned: 0 };
  return d;
}
function snakeHeartsLeft() {
  if (SNAKE_UNLIMITED_HEARTS) return SNAKE_MAX_HEARTS;
  return Math.max(0, SNAKE_MAX_HEARTS - _snakeDaily().used);
}
function _snakeHeartsHtml(left) {
  return Array.from({ length: SNAKE_MAX_HEARTS }, (_, i) =>
    `<span class="snake-heart ${i < left ? 'full' : 'empty'}">${SNAKE_HEART_SVG}</span>`).join('');
}

function snakeRenderLobby() {
  const left = snakeHeartsLeft();
  const daily = _snakeDaily();
  const best = _snakeGet('best', 0);
  const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
  set('snake-hearts', el => { el.innerHTML = _snakeHeartsHtml(left); });
  set('snake-hud-hearts', el => { el.innerHTML = _snakeHeartsHtml(left); });
  set('snake-hearts-note', el => {
    el.textContent = left > 0
      ? (SNAKE_UNLIMITED_HEARTS ? 'Sınırsız kalp açık · istediğin kadar oyna' : `${left} hakkın kaldı · her oyun 1 kalp harcar`)
      : `Bugünlük kalplerin bitti, yarın ${SNAKE_MAX_HEARTS} yeni kalp!`;
  });
  const bestScore = _snakeGet('bestScore', 0);
  set('snake-best', el => { el.textContent = bestScore.toLocaleString('tr'); });
  set('snake-hud-best', el => { el.textContent = bestScore.toLocaleString('tr'); });
  set('snake-today', el => { el.textContent = daily.earned; });
  set('snake-play-btn', el => {
    el.disabled = left <= 0;
    el.innerHTML = left > 0
      ? '<span class="sg-play-ic">▶</span><span>Oyna</span><span class="sg-play-cost">−1 ' + SNAKE_HEART_SVG + '</span>'
      : '<span>Yarın tekrar gel</span>';
  });
  set('snake-reset-in', el => {
    const now = new Date();
    const mid = new Date(now); mid.setHours(24, 0, 0, 0);
    const mins = Math.floor((mid - now) / 60000);
    el.textContent = `↻ ${Math.floor(mins / 60)}s ${mins % 60}dk`;
  });
  _snakeRenderThemes();
  _snakeRenderSkins();
  kzRefreshNav();
  _gameSyncBest('snake', _snakeGet, _snakeSet, snakeRenderLobby);
}

/* ── Oyun öncesi tema & kostüm seçimi (Snake & Flappy ortak) ── */
function _gsetupToggle(id, open) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open', open);
  el.setAttribute('aria-hidden', String(!open));
}
function gsetupTab(btn) {
  const sheet = btn.closest('.gsetup-sheet');
  if (sheet) sheet.dataset.tab = btn.dataset.tab;
}

function snakeOpenSetup() {
  if (snake.running) return;
  if (!state.user?.id) { showToast('Oynamak için giriş yapman gerek'); return; }
  if (!SNAKE_UNLIMITED_HEARTS && _snakeDaily().used >= SNAKE_MAX_HEARTS) { snakeRenderLobby(); showToast('Bugünlük kalplerin yok. Yarın tekrar dene!'); return; }
  _snakeRenderThemes();
  _snakeRenderSkins();
  _gsetupToggle('snake-setup', true);
}
function snakeCloseSetup() { _gsetupToggle('snake-setup', false); }
function snakeSetupGo() { snakeCloseSetup(); snakeStart(); }

function snakeStart() {
  if (snake.running) return;
  if (!state.user?.id) { showToast('Oynamak için giriş yapman gerek'); return; }
  const daily = _snakeDaily();
  if (!SNAKE_UNLIMITED_HEARTS && daily.used >= SNAKE_MAX_HEARTS) { snakeRenderLobby(); showToast('Bugünlük kalplerin yok. Yarın tekrar dene!'); return; }
  if (!SNAKE_UNLIMITED_HEARTS) daily.used += 1;
  _snakeSet('daily', daily);
  snakeRenderLobby();

  const overlay = document.getElementById('snake-overlay');
  _snakeApplyTheme();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('snake-lock');

  const mid = Math.floor(SNAKE_GRID / 2);
  const body = [{ x: mid - 2, y: mid }, { x: mid - 3, y: mid }, { x: mid - 4, y: mid }, { x: mid - 5, y: mid }];
  Object.assign(snake, {
    running: true, paused: false, over: false,
    body, prev: body.map(p => ({ ...p })),
    dir: { x: 1, y: 0 }, queue: [], coin: null, bigCoin: null,
    score: 0, pts: 0, combo: 0, comboLeft: 0, maxCombo: 0, speed: SNAKE_BASE_SPEED, acc: 0, last: 0,
    particles: [], floats: [], shake: 0, flash: 0
  });
  _gameComboChip('snake-combo', 0);
  _snakeSetPauseIcon(false);
  snakeResize();
  _snakePlaceCoin();
  _snakeUpdateScore();
  cancelAnimationFrame(snake.raf);
  snake.raf = requestAnimationFrame(_snakeFrame);
  _snakeCountdown(3);
}

function _snakeCountdown(n) {
  const msg = document.getElementById('snake-msg');
  clearTimeout(snake.cdTimer);
  snake.countdown = n;
  if (!snake.running || snake.over) return;
  if (n <= 0) { msg.classList.remove('show'); snake.acc = 0; return; }
  msg.innerHTML = `<div class="snake-count" data-n="${n}">${n}</div>`;
  msg.classList.add('show');
  snake.cdTimer = setTimeout(() => _snakeCountdown(n - 1), 700);
}

function snakeResize() {
  const wrap = document.getElementById('snake-board-wrap');
  const canvas = document.getElementById('snake-canvas');
  if (!wrap || !canvas) return;
  const size = Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight, 540));
  snake.cell = Math.max(10, Math.floor(size / SNAKE_GRID));
  const px = snake.cell * SNAKE_GRID;
  const dpr = gameDpr();
  if (canvas.width === Math.round(px * dpr) && canvas.style.width === px + 'px') return;
  canvas.style.width = px + 'px';
  canvas.style.height = px + 'px';
  canvas.width = Math.round(px * dpr);
  canvas.height = Math.round(px * dpr);
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

function _snakeFreeCell() {
  const taken = new Set(snake.body.map(p => p.x + ',' + p.y));
  if (snake.coin) taken.add(snake.coin.x + ',' + snake.coin.y);
  if (snake.bigCoin) taken.add(snake.bigCoin.x + ',' + snake.bigCoin.y);
  const free = [];
  for (let x = 0; x < SNAKE_GRID; x++) for (let y = 0; y < SNAKE_GRID; y++) if (!taken.has(x + ',' + y)) free.push({ x, y });
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}
function _snakePlaceCoin() {
  snake.coin = null;
  const c = _snakeFreeCell();
  snake.coin = c ? { ...c, born: performance.now() } : null;
}

/* Ana döngü: mantık sabit adımlarla, çizim her karede (akıcı hareket için) */
function _snakeFrame(ts) {
  const dt = snake.last ? Math.min(80, ts - snake.last) : 16;
  snake.last = ts;
  if (snake.running && !snake.paused && !snake.over && snake.countdown <= 0) {
    if (snake.comboLeft > 0) {
      snake.comboLeft -= dt;
      if (snake.comboLeft <= 0) { snake.combo = 0; _gameComboChip('snake-combo', 0); }
    }
    snake.acc += dt;
    while (snake.acc >= snake.speed && !snake.over) {
      snake.acc -= snake.speed;
      _snakeStep();
    }
  }
  _snakeUpdateFx(dt);
  const t = (snake.over || snake.countdown > 0) ? 1 : Math.min(1, snake.acc / snake.speed);
  _snakeDraw(t, ts);
  if (document.getElementById('snake-overlay')?.classList.contains('open')) {
    snake.raf = requestAnimationFrame(_snakeFrame);
  }
}

function _snakeStep() {
  if (snake.queue.length) snake.dir = snake.queue.shift();
  const head = snake.body[0];
  const next = { x: head.x + snake.dir.x, y: head.y + snake.dir.y };
  snake.prev = snake.body.map(p => ({ ...p }));

  const hitWall = next.x < 0 || next.y < 0 || next.x >= SNAKE_GRID || next.y >= SNAKE_GRID;
  // Kuyruk bu adımda ilerleyeceği için son parçaya çarpmak serbest
  const hitSelf = snake.body.slice(0, -1).some(p => p.x === next.x && p.y === next.y);
  if (hitWall || hitSelf) { _snakeGameOver(); return; }

  snake.body.unshift(next);
  const s = snake.cell;
  let grew = false;
  if (snake.coin && next.x === snake.coin.x && next.y === snake.coin.y) {
    snake.score += 1; grew = true;
    _snakeBurst(next.x * s + s / 2, next.y * s + s / 2, ['#ffe27a', '#ffd23f', '#fff6c2'], 14);
    _snakeGain(next, SNAKE_PTS_COIN, '#ffd966');
    _snakePlaceCoin();
    if (!snake.bigCoin && Math.random() < 0.2) {
      const c = _snakeFreeCell();
      if (c) snake.bigCoin = { ...c, born: performance.now(), until: performance.now() + SNAKE_BIG_COIN_LIFE };
    }
  }
  if (snake.bigCoin && next.x === snake.bigCoin.x && next.y === snake.bigCoin.y) {
    snake.score += 1; grew = true;
    _snakeBurst(next.x * s + s / 2, next.y * s + s / 2, ['#ff8ae2', '#ffd23f', '#b69cff', '#fff'], 26);
    _snakeGain(next, SNAKE_PTS_BIG, '#ff9be6');
    snake.bigCoin = null;
  }
  if (snake.bigCoin && performance.now() > snake.bigCoin.until) {
    const b = snake.bigCoin;
    _snakeBurst(b.x * s + s / 2, b.y * s + s / 2, ['rgba(255,138,226,.7)'], 8);
    snake.bigCoin = null;
  }
  if (!grew) snake.body.pop();
  else {
    snake.speed = Math.max(SNAKE_MIN_SPEED, SNAKE_BASE_SPEED - snake.score * 2.2);
    _snakeUpdateScore(true);
    if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
  }
}

/* ── Efektler ── */
function _snakeBurst(x, y, colors, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 0.04 + Math.random() * 0.14;
    snake.particles.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.04,
      life: 0, max: 450 + Math.random() * 450,
      size: snake.cell * (0.06 + Math.random() * 0.09),
      color: colors[i % colors.length]
    });
  }
}
function _snakeGain(cell, base, color) {
  snake.combo = snake.comboLeft > 0 ? snake.combo + 1 : 1;
  snake.comboLeft = SNAKE_COMBO_MS;
  snake.maxCombo = Math.max(snake.maxCombo, snake.combo);
  const mult = Math.min(snake.combo, GAME_COMBO_MAX);
  const gain = base * mult;
  snake.pts += gain;
  _snakeFloat(cell, mult > 1 ? `+${gain} x${mult}` : `+${gain}`, color);
  _gameComboChip('snake-combo', snake.combo);
  if (mult > 1 && navigator.vibrate) try { navigator.vibrate(12); } catch {}
}
function _snakeFloat(cell, text, color) {
  const s = snake.cell;
  snake.floats.push({ x: cell.x * s + s / 2, y: cell.y * s + s / 2 - s * 0.3, text, color, life: 0, max: 850 });
}
function _snakeUpdateFx(dt) {
  snake.particles = snake.particles.filter(p => {
    p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.00025 * dt; p.vx *= 0.985;
    return p.life < p.max;
  });
  snake.floats = snake.floats.filter(f => (f.life += dt) < f.max);
  snake.shake = Math.max(0, snake.shake - dt * 0.03);
  snake.flash = Math.max(0, snake.flash - dt * 0.0025);
}

function _snakeUpdateScore(bump) {
  const el = document.getElementById('snake-score');
  if (!el) return;
  el.textContent = snake.pts.toLocaleString('tr');
  if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  const coins = document.getElementById('snake-hud-coins');
  if (coins) coins.textContent = snake.score;
  const best = document.getElementById('snake-hud-best');
  if (best) best.textContent = Math.max(_snakeGet('bestScore', 0), snake.pts).toLocaleString('tr');
}

/* ── Oyun temaları (Snake & Flappy ortak seçici) ── */
// Aynı girdi için hep aynı sonucu veren sözde rastgele (dekorlar kare kare titremesin)
function _themeRand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function _themePickerHtml(themes, activeId, pickFn) {
  return themes.map(t => `
    <button type="button" class="gth-item ${t.id === activeId ? 'on' : ''}" style="--sw:${t.swatch}" onclick="${pickFn}('${t.id}')" aria-pressed="${t.id === activeId}">
      <span class="gth-sw"><i>${t.icon}</i>${t.id === activeId ? '<em>✓</em>' : ''}</span>
      <b>${t.name}</b>
    </button>`).join('');
}

const SNAKE_THEMES = [
  { id: 'night', name: 'Gece', icon: '🌙', board: ['#0f2a5c', '#0a1a3d'], checker: 'rgba(140,180,255,0.035)', dot: 'rgba(160,200,255,0.10)', vig: 'rgba(2,8,24,0.45)',
    bg: 'linear-gradient(180deg,#081a3d 0%,#050f26 100%)', glow: ['#1fb6c9', '#3a5fd9'], frame: '60,232,180',
    swatch: 'radial-gradient(rgba(160,200,255,.35) 1px, transparent 1.5px) 0 0/9px 9px, linear-gradient(135deg,#1a3f80,#0a1a3d)' },
  { id: 'forest', name: 'Orman', icon: '🌿', board: ['#22643b', '#123f25'], checker: 'rgba(190,255,190,0.05)', dot: 'rgba(200,255,200,0.10)', vig: 'rgba(2,20,8,0.5)', deco: 'grass',
    bg: 'linear-gradient(180deg,#0d2c19 0%,#05140b 100%)', glow: ['#3ce87a', '#1f8f5a'], frame: '120,240,140',
    swatch: 'radial-gradient(rgba(170,255,170,.35) 1px, transparent 1.5px) 0 0/9px 9px, linear-gradient(135deg,#2f8a50,#123f25)' },
  { id: 'desert', name: 'Çöl', icon: '🏜️', board: ['#e4b86e', '#c48a45'], checker: 'rgba(255,240,200,0.12)', dot: 'rgba(110,60,15,0.14)', vig: 'rgba(90,40,0,0.35)', deco: 'pebbles',
    bg: 'linear-gradient(180deg,#3a2210 0%,#1e1006 100%)', glow: ['#ffb347', '#d9772b'], frame: '255,190,100',
    swatch: 'radial-gradient(rgba(110,60,15,.3) 1px, transparent 1.5px) 0 0/9px 9px, linear-gradient(135deg,#f3cf8a,#c48a45)' },
  { id: 'ice', name: 'Buzul', icon: '❄️', board: ['#dbeefc', '#a9cbe8'], checker: 'rgba(255,255,255,0.35)', dot: 'rgba(40,90,150,0.14)', vig: 'rgba(30,70,120,0.3)', deco: 'flakes',
    bg: 'linear-gradient(180deg,#123052 0%,#07182e 100%)', glow: ['#8fd3ff', '#4a7bd9'], frame: '180,225,255',
    swatch: 'radial-gradient(rgba(40,90,150,.3) 1px, transparent 1.5px) 0 0/9px 9px, linear-gradient(135deg,#f2f9ff,#9dc2e3)' },
  { id: 'neon', name: 'Neon', icon: '⚡', board: ['#1a0636', '#07021a'], checker: 'rgba(255,60,200,0.035)', dot: null, vig: 'rgba(0,0,0,0.5)', deco: 'grid',
    bg: 'linear-gradient(180deg,#14042b 0%,#060112 100%)', glow: ['#ff2e88', '#7b2cff'], frame: '255,46,136',
    swatch: 'linear-gradient(rgba(255,46,136,.45) 1px, transparent 1px) 0 0/9px 9px, linear-gradient(90deg, rgba(0,229,255,.35) 1px, transparent 1px) 0 0/9px 9px, linear-gradient(135deg,#2a0a55,#07021a)' },
  { id: 'lava', name: 'Volkan', icon: '🌋', board: ['#3d100c', '#1a0504'], checker: 'rgba(255,120,60,0.04)', dot: 'rgba(255,140,80,0.12)', vig: 'rgba(0,0,0,0.5)', deco: 'embers',
    bg: 'linear-gradient(180deg,#2a0705 0%,#100202 100%)', glow: ['#ff5a1f', '#b3122e'], frame: '255,110,50',
    swatch: 'radial-gradient(circle at 30% 70%, rgba(255,120,40,.7), transparent 30%), radial-gradient(circle at 75% 30%, rgba(255,80,30,.5), transparent 25%), linear-gradient(135deg,#5a1610,#1a0504)' }
];
function _snakeTheme() { return SNAKE_THEMES.find(t => t.id === _snakeGet('theme', 'night')) || SNAKE_THEMES[0]; }
function snakeSetTheme(id) {
  if (!SNAKE_THEMES.some(t => t.id === id)) return;
  _snakeSet('theme', id);
  _snakeRenderThemes();
}
function _snakeRenderThemes() {
  const t = _snakeTheme();
  const row = document.getElementById('snake-themes');
  if (row) row.innerHTML = _themePickerHtml(SNAKE_THEMES, t.id, 'snakeSetTheme');
  _gthCenterActive(document.getElementById('snake-themes'));
  const name = document.getElementById('snake-theme-name');
  if (name) name.textContent = t.name;
  _gsetupStage('snake-setup-stage', t);
}
function _snakeApplyTheme() {
  const t = snake.th = _snakeTheme();
  snake.sk = _snakeSkin();
  const overlay = document.getElementById('snake-overlay');
  if (!overlay) return;
  overlay.style.background = t.bg;
  const [a, b] = overlay.querySelectorAll('.sg-glow');
  // Bulanıklık filtresi yerine yumuşak renk geçişi (Android'de titreme ve kasma yapmasın)
  if (a) a.style.background = `radial-gradient(circle, ${t.glow[0]} 0%, transparent 68%)`;
  if (b) b.style.background = `radial-gradient(circle, ${t.glow[1]} 0%, transparent 68%)`;
  const canvas = document.getElementById('snake-canvas');
  if (canvas) canvas.style.boxShadow = `0 0 0 1px rgba(${t.frame},0.3), 0 0 0 6px rgba(${t.frame},0.06), 0 24px 60px rgba(0,0,0,0.55), 0 0 60px rgba(${t.frame},0.15)`;
}

/* ── Kostümler (Snake & Flappy ortak seçici, canlı önizlemeli) ── */
function _skinPickerHtml(skins, activeId, pickFn) {
  return skins.map(k => `
    <button type="button" class="gth-item gth-skin ${k.id === activeId ? 'on' : ''}" onclick="${pickFn}('${k.id}')" aria-pressed="${k.id === activeId}" aria-label="${k.name}">
      <span class="gth-sw"><canvas data-skin="${k.id}"></canvas>${k.id === activeId ? '<em>✓</em>' : ''}</span>
      <b>${k.name}</b>
    </button>`).join('');
}
// Seçili öğeyi yatay listede ortaya kaydırır (sayfayı dikey kaydırmadan)
function _gthCenterActive(row) {
  const on = row?.querySelector('.gth-item.on');
  if (on) row.scrollLeft = on.offsetLeft - row.clientWidth / 2 + on.offsetWidth / 2;
}
function _skinPreviewCtx(canvas, scale = 1) {
  const dpr = (window.devicePixelRatio || 1) * scale;
  canvas.width = Math.round(74 * dpr);
  canvas.height = Math.round(56 * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
const GSETUP_PREVIEW_SCALE = 2.2;
// Seçim penceresindeki büyük önizleme: tema arka plan, kostüm ortada
function _gsetupStage(stageId, theme) {
  const stage = document.getElementById(stageId);
  if (stage) stage.style.setProperty('--sw', theme.swatch);
}

// body(f, k, now): f 0 baş → 1 kuyruk, k örnek sırası, now zaman (ms)
const SNAKE_SKINS = [
  { id: 'classic', name: 'Klasik', body: f => `hsl(${162 + f * 62}, 78%, ${50 - f * 8}%)`,
    scales: 'rgba(255,217,102,0.55)', head: ['#9cf8da', '#1cbf92'], nostril: 'rgba(4,40,32,0.6)' },
  { id: 'fire', name: 'Ateş', body: (f, k, t) => `hsl(${8 + f * 42 + Math.sin(t / 180 + k * 0.4) * 4}, 96%, ${54 - f * 4}%)`,
    scales: 'rgba(255,245,170,0.6)', head: ['#ffd6a0', '#ff4d1f'], nostril: 'rgba(90,10,0,0.6)', acc: 'shades' },
  { id: 'rainbow', name: 'Gökkuşağı', body: (f, k, t) => `hsl(${((k * 7 - t / 8) % 360 + 360) % 360}, 90%, 60%)`,
    scales: 'rgba(255,255,255,0.6)', head: ['#ffffff', '#ff8ad8'], nostril: 'rgba(120,20,90,0.5)' },
  { id: 'toxic', name: 'Zehirli', body: (f, k) => (Math.floor(k / 5) % 2 ? '#9b5cff' : '#8cff3a'),
    scales: 'rgba(20,0,40,0.35)', head: ['#d8ff9e', '#5ccf1a'], nostril: 'rgba(20,50,0,0.6)', pupil: '#6b1fd1' },
  { id: 'tiger', name: 'Kaplan', body: (f, k) => (k % 9 < 2 ? '#1b1410' : `hsl(${28 + f * 6}, 95%, ${55 - f * 8}%)`),
    scales: null, head: ['#ffd08a', '#ff8a1f'], nostril: 'rgba(60,20,0,0.6)', stripesHead: true },
  { id: 'ice', name: 'Buz', body: f => `hsl(${190 + f * 25}, ${85 - f * 20}%, ${80 - f * 18}%)`,
    scales: 'rgba(255,255,255,0.85)', head: ['#ffffff', '#8fd3ff'], nostril: 'rgba(20,60,100,0.5)' },
  { id: 'gold', name: 'Altın Kral', body: (f, k, t) => `hsl(${44 - f * 8}, ${95 - f * 10}%, ${56 - f * 14 + Math.max(0, Math.sin(t / 260 - k * 0.25)) * 14}%)`,
    scales: 'rgba(255,255,255,0.55)', head: ['#fff4c2', '#e0a100'], nostril: 'rgba(100,60,0,0.6)', acc: 'crown' },
  { id: 'mamba', name: 'Gece Mambası', body: f => `hsl(222, 20%, ${22 - f * 7}%)`,
    scales: 'rgba(57,255,136,0.75)', head: ['#4b5563', '#111827'], nostril: 'rgba(57,255,136,0.5)', pupil: '#39ff88', glowEyes: true, eyeWhite: '#0b0f14' }
];
function _snakeSkin() { return SNAKE_SKINS.find(k => k.id === _snakeGet('skin', 'classic')) || SNAKE_SKINS[0]; }
function snakeSetSkin(id) {
  if (!SNAKE_SKINS.some(k => k.id === id)) return;
  _snakeSet('skin', id);
  _snakeRenderSkins();
}
function _snakeRenderSkins() {
  const sk = _snakeSkin();
  const row = document.getElementById('snake-skins');
  if (row) {
    row.innerHTML = _skinPickerHtml(SNAKE_SKINS, sk.id, 'snakeSetSkin');
    row.querySelectorAll('canvas[data-skin]').forEach(c => _snakeSkinPreview(c, SNAKE_SKINS.find(k => k.id === c.dataset.skin)));
  }
  _gthCenterActive(document.getElementById('snake-skins'));
  const name = document.getElementById('snake-skin-name');
  if (name) name.textContent = sk.name;
  const pv = document.getElementById('snake-setup-preview');
  if (pv) _snakeSkinPreview(pv, sk, GSETUP_PREVIEW_SCALE);
}
// Yılanı küçük bir kıvrımla önizlemeye çizer (oyun durumunu geçici ödünç alır)
function _snakeSkinPreview(canvas, sk, scale) {
  if (!sk || snake.running) return;
  const ctx = _skinPreviewCtx(canvas, scale);
  const saved = { body: snake.body, prev: snake.prev, dir: snake.dir, cell: snake.cell, over: snake.over };
  const body = [[5, 1], [4, 1], [3, 1], [3, 2], [2, 2], [1, 2], [0, 2], [0, 1]].map(([x, y]) => ({ x, y }));
  Object.assign(snake, { body, prev: body, dir: { x: 1, y: 0 }, cell: 12, over: false });
  ctx.translate(1, 4);
  try { _snakeDrawSnake(ctx, 1, 400, sk); } finally { Object.assign(snake, saved); }
}

/* ── Çizim ── */
function _snakeDrawBoard(ctx, px, s, now) {
  const th = snake.th || _snakeTheme();
  const dpr = gameDpr();
  const key = `${th.id}|${px}|${dpr}`;
  if (snake.boardKey !== key || !snake.boardCache) {
    const c = document.createElement('canvas');
    c.width = Math.round(px * dpr); c.height = Math.round(px * dpr);
    const cctx = c.getContext('2d');
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    _snakeBuildBoard(cctx, th, px, s);
    snake.boardCache = c; snake.boardKey = key;
  }
  ctx.drawImage(snake.boardCache, 0, 0, px, px);
  // Yalnızca hareketli süsler her karede çizilir
  if (th.deco === 'grid' || th.deco === 'embers') _snakeDrawDeco(ctx, th.deco, px, s, now || 0, 'anim');
}

// Zeminin değişmeyen kısmı: renk geçişi, dama, süsler, noktalar, kenar gölgesi
function _snakeBuildBoard(ctx, th, px, s) {
  const bg = ctx.createLinearGradient(0, 0, px, px);
  bg.addColorStop(0, th.board[0]);
  bg.addColorStop(1, th.board[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = th.checker;
  for (let x = 0; x < SNAKE_GRID; x++) for (let y = 0; y < SNAKE_GRID; y++) {
    if ((x + y) % 2) ctx.fillRect(x * s, y * s, s, s);
  }
  _snakeDrawDeco(ctx, th.deco, px, s, 0, 'static');
  if (th.dot) {
    ctx.fillStyle = th.dot;
    for (let x = 1; x < SNAKE_GRID; x++) for (let y = 1; y < SNAKE_GRID; y++) {
      ctx.beginPath(); ctx.arc(x * s, y * s, Math.max(0.8, s * 0.035), 0, Math.PI * 2); ctx.fill();
    }
  }
  const vig = ctx.createRadialGradient(px / 2, px / 2, px * 0.25, px / 2, px / 2, px * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, th.vig);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, px, px);
}

// Temaya özel zemin süsleri: çim, çakıl, kar tanesi, neon ızgara, lav kıvılcımı
function _snakeDrawDeco(ctx, deco, px, s, now, pass) {
  if (!deco) return;
  const G = SNAKE_GRID;
  const anim = pass === 'anim';
  if (deco === 'grid' && anim) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 900);
    const glow = ctx.createLinearGradient(0, 0, 0, px);
    glow.addColorStop(0, `rgba(123,44,255,${0.08 + pulse * 0.06})`);
    glow.addColorStop(1, `rgba(255,46,136,${0.1 + pulse * 0.08})`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, px, px);
    return;
  }
  if (deco === 'embers' && !anim) return;
  if (deco !== 'embers' && anim) return;
  if (deco === 'grid') {
    ctx.lineWidth = 1;
    for (let i = 0; i <= G; i++) {
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(0,229,255,0.22)' : 'rgba(255,46,136,0.13)';
      ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, px); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(px, i * s); ctx.stroke();
    }
    return;
  }
  for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) {
    const r = _themeRand(x * 37 + y * 101 + 7);
    if (r < 0.8) continue;
    const r2 = _themeRand(x * 13 + y * 57 + 3);
    const cx = x * s + s * (0.25 + r2 * 0.5), cy = y * s + s * (0.25 + _themeRand(x + y * 91) * 0.5);
    if (deco === 'grass') {
      ctx.strokeStyle = r > 0.93 ? 'rgba(170,255,150,0.3)' : 'rgba(120,220,130,0.2)';
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = -1; k <= 1; k++) {
        ctx.moveTo(cx + k * s * 0.08, cy + s * 0.12);
        ctx.lineTo(cx + k * s * 0.14, cy - s * (0.1 + (k === 0 ? 0.08 : 0)));
      }
      ctx.stroke();
      if (r > 0.97) { // küçük çiçek
        ctx.fillStyle = 'rgba(255,217,102,0.55)';
        ctx.beginPath(); ctx.arc(cx, cy - s * 0.2, s * 0.06, 0, Math.PI * 2); ctx.fill();
      }
    } else if (deco === 'pebbles') {
      ctx.fillStyle = 'rgba(120,70,25,0.22)';
      ctx.beginPath(); ctx.ellipse(cx, cy, s * (0.08 + r2 * 0.08), s * (0.06 + r2 * 0.05), r2 * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,215,0.35)';
      ctx.beginPath(); ctx.arc(cx - s * 0.03, cy - s * 0.03, s * 0.025, 0, Math.PI * 2); ctx.fill();
    } else if (deco === 'flakes') {
      ctx.strokeStyle = 'rgba(60,110,170,0.22)';
      ctx.lineWidth = Math.max(1, s * 0.035);
      const a = s * (0.08 + r2 * 0.06);
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const ang = k * Math.PI / 3 + r2;
        ctx.moveTo(cx - Math.cos(ang) * a, cy - Math.sin(ang) * a);
        ctx.lineTo(cx + Math.cos(ang) * a, cy + Math.sin(ang) * a);
      }
      ctx.stroke();
    } else if (deco === 'embers') {
      const k = 0.35 + 0.65 * Math.abs(Math.sin(now / (500 + r2 * 700) + r * 20));
      const rr = s * (0.35 + r2 * 0.3);
      ctx.globalAlpha = k;
      ctx.drawImage(_snakeEmberSprite(), cx - rr, cy - rr, rr * 2, rr * 2);
      ctx.globalAlpha = 1;
    }
  }
}

let _emberSprite = null;
function _snakeEmberSprite() {
  if (_emberSprite) return _emberSprite;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,170,60,0.4)');
  g.addColorStop(0.4, 'rgba(255,80,30,0.18)');
  g.addColorStop(1, 'rgba(255,60,20,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return (_emberSprite = c);
}

function _snakeDrawCoin(ctx, c, big, now) {
  const s = snake.cell;
  const age = now - (c.born || 0);
  const pop = Math.max(0, Math.min(1, age / 260));
  const popScale = Math.max(0.01, 1 - Math.pow(1 - pop, 3) + Math.sin(pop * Math.PI) * 0.25);
  const cx = c.x * s + s / 2;
  const cy = c.y * s + s / 2 + Math.sin(now / 320 + c.x) * s * 0.05;
  const r = s * (big ? 0.4 : 0.31) * popScale;

  if (big) {
    const left = c.until - now;
    if (left < 1600 && Math.floor(now / 140) % 2) return; // bitmek üzere: yanıp söner
  }

  // Hale
  const haloR = s * (big ? 1.05 : 0.7) * (1 + Math.sin(now / 260) * 0.08);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
  halo.addColorStop(0, big ? 'rgba(255,120,220,0.45)' : 'rgba(255,210,63,0.35)');
  halo.addColorStop(1, 'rgba(255,210,63,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, Math.PI * 2); ctx.fill();

  // Süper coin: kalan süre halkası
  if (big) {
    const frac = Math.max(0, (c.until - now) / SNAKE_BIG_COIN_LIFE);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.56, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ff8ae2';
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.56, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
  }

  // Dönen coin (yatay ölçekle 3B hissi)
  const spin = Math.cos(now / (big ? 420 : 620) + c.x * 1.7 + c.y);
  const w = Math.max(0.16, Math.abs(spin));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(w, 1);
  ctx.fillStyle = big ? '#a8338f' : '#b87400';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  const face = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
  if (big) {
    face.addColorStop(0, '#fff0fb'); face.addColorStop(0.45, '#ff9be6'); face.addColorStop(1, '#c04aa8');
  } else {
    face.addColorStop(0, '#fff6c2'); face.addColorStop(0.5, '#ffd23f'); face.addColorStop(1, '#dc9500');
  }
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = big ? 'rgba(120,20,100,0.35)' : 'rgba(150,90,0,0.35)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke();
  if (w > 0.45) {
    ctx.fillStyle = big ? 'rgba(110,15,90,0.85)' : 'rgba(140,82,0,0.9)';
    ctx.font = `800 ${Math.round(r * 0.95)}px Syne, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(big ? '2' : 'G', 0, r * 0.06);
  }
  ctx.restore();

  // Parıltı
  const tw = (Math.sin(now / 180 + c.y * 2) + 1) / 2;
  if (tw > 0.75) {
    const k = (tw - 0.75) * 4;
    ctx.save();
    ctx.translate(cx + r * 0.55, cy - r * 0.6);
    ctx.fillStyle = `rgba(255,255,255,${k})`;
    ctx.beginPath();
    const a = r * 0.45 * k, b = r * 0.1;
    ctx.moveTo(0, -a); ctx.lineTo(b, -b); ctx.lineTo(a, 0); ctx.lineTo(b, b);
    ctx.lineTo(0, a); ctx.lineTo(-b, b); ctx.lineTo(-a, 0); ctx.lineTo(-b, -b); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Köşeleri yuvarlatır (Chaikin): uçlar sabit kalır, gövde kavisli görünür
function _snakeSmooth(pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (i > 0) out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
    if (i < pts.length - 2) out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function _snakeSamples(pts, stepLen) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len === 0) continue;
    let d = stepLen - carry;
    while (d <= len) {
      out.push({ x: a.x + (b.x - a.x) * d / len, y: a.y + (b.y - a.y) * d / len });
      d += stepLen;
    }
    carry = len - (d - stepLen);
  }
  const tail = pts[pts.length - 1];
  const lastS = out[out.length - 1];
  if (Math.hypot(tail.x - lastS.x, tail.y - lastS.y) > stepLen * 0.3) out.push(tail);
  return out;
}

function _snakeDrawSnake(ctx, t, now, skin) {
  const sk = skin || snake.sk || SNAKE_SKINS[0];
  const s = snake.cell;
  const pts = snake.body.map((p, i) => {
    const f = snake.prev[i] || p;
    return { x: (f.x + (p.x - f.x) * t) * s + s / 2, y: (f.y + (p.y - f.y) * t) * s + s / 2 };
  });
  const smp = _snakeSamples(_snakeSmooth(_snakeSmooth(pts)), s * 0.12);
  const N = smp.length;
  const radius = k => s * (0.36 - 0.2 * Math.pow(k / Math.max(1, N - 1), 1.3));
  const dead = snake.over;
  ctx.save();
  if (dead) ctx.filter = 'grayscale(0.75) brightness(0.9)';

  // Gölge
  ctx.fillStyle = 'rgba(0,6,20,0.35)';
  for (let k = N - 1; k >= 0; k--) {
    ctx.beginPath(); ctx.arc(smp[k].x + s * 0.06, smp[k].y + s * 0.12, radius(k), 0, Math.PI * 2); ctx.fill();
  }
  // Gövde: rengi kostüm belirler (f: 0 baş → 1 kuyruk)
  for (let k = N - 1; k >= 0; k--) {
    ctx.fillStyle = sk.body(k / Math.max(1, N - 1), k, now);
    ctx.beginPath(); ctx.arc(smp[k].x, smp[k].y, radius(k), 0, Math.PI * 2); ctx.fill();
  }
  // Sırt pulları
  if (sk.scales) {
    for (let k = 6; k < N - 3; k += 5) {
      const a = smp[k - 1], b = smp[k + 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const r = radius(k) * 0.38;
      ctx.save();
      ctx.translate(smp[k].x, smp[k].y);
      ctx.rotate(ang);
      ctx.fillStyle = sk.scales;
      if (sk.glowEyes) { ctx.shadowColor = sk.scales; ctx.shadowBlur = _gBlur(s * 0.3); }
      ctx.beginPath();
      ctx.moveTo(-r * 1.3, 0); ctx.lineTo(0, -r); ctx.lineTo(r * 1.3, 0); ctx.lineTo(0, r);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  // Parlak sırt çizgisi
  if (N > 3) {
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    const end = Math.floor(N * 0.8);
    for (let k = 1; k < end; k++) {
      const o = radius(k) * 0.42;
      const x = smp[k].x - o * 0.6, y = smp[k].y - o;
      k === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Baş
  const h = pts[0];
  let ang = Math.atan2(snake.dir.y, snake.dir.x);
  if (pts.length > 1 && Math.hypot(h.x - smp[Math.min(3, N - 1)].x, h.y - smp[Math.min(3, N - 1)].y) > 0.5) {
    const n = smp[Math.min(3, N - 1)];
    ang = Math.atan2(h.y - n.y, h.x - n.x);
  }
  ctx.translate(h.x, h.y);
  ctx.rotate(ang);

  // Dil
  if (!dead && (now % 1600) < 280) {
    const ext = Math.sin(((now % 1600) / 280) * Math.PI);
    ctx.strokeStyle = '#ff4f79';
    ctx.lineWidth = Math.max(1.2, s * 0.06);
    ctx.lineCap = 'round';
    const x0 = s * 0.42, x1 = x0 + s * 0.32 * ext;
    ctx.beginPath();
    ctx.moveTo(x0, 0); ctx.lineTo(x1, 0);
    ctx.lineTo(x1 + s * 0.1 * ext, -s * 0.08 * ext);
    ctx.moveTo(x1, 0); ctx.lineTo(x1 + s * 0.1 * ext, s * 0.08 * ext);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0,6,20,0.35)';
  ctx.beginPath(); ctx.ellipse(s * 0.06 + s * 0.05, s * 0.1, s * 0.5, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  const hg = ctx.createRadialGradient(s * 0.05, -s * 0.15, s * 0.05, 0, 0, s * 0.55);
  hg.addColorStop(0, sk.head[0]);
  hg.addColorStop(1, sk.head[1]);
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.ellipse(s * 0.06, 0, s * 0.5, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  if (sk.stripesHead) { // kaplan alnı
    ctx.strokeStyle = '#1b1410';
    ctx.lineWidth = Math.max(1, s * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    [-1, 1].forEach(sd => { ctx.moveTo(-s * 0.3, sd * s * 0.12); ctx.lineTo(-s * 0.08, sd * s * 0.05); });
    ctx.moveTo(-s * 0.36, 0); ctx.lineTo(-s * 0.12, 0);
    ctx.stroke();
  }

  // Burun delikleri
  ctx.fillStyle = sk.nostril;
  [-1, 1].forEach(side => { ctx.beginPath(); ctx.arc(s * 0.44, side * s * 0.08, s * 0.03, 0, Math.PI * 2); ctx.fill(); });

  // Gözler
  [-1, 1].forEach(side => {
    const ex = s * 0.16, ey = side * s * 0.2;
    if (dead) {
      ctx.strokeStyle = '#061127';
      ctx.lineWidth = Math.max(1.2, s * 0.05);
      const d = s * 0.08;
      ctx.beginPath();
      ctx.moveTo(ex - d, ey - d); ctx.lineTo(ex + d, ey + d);
      ctx.moveTo(ex + d, ey - d); ctx.lineTo(ex - d, ey + d);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = sk.eyeWhite || '#ffffff';
    ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.14, s * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.fillStyle = sk.pupil || '#061127';
    if (sk.glowEyes) { ctx.shadowColor = sk.pupil; ctx.shadowBlur = _gBlur(s * 0.4); }
    ctx.beginPath(); ctx.ellipse(ex + s * 0.05, ey, s * (sk.glowEyes ? 0.04 : 0.07), s * 0.085, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex + s * 0.07, ey - s * 0.035, s * 0.028, 0, Math.PI * 2); ctx.fill();
  });

  // Güneş gözlüğü
  if (sk.acc === 'shades') {
    const lg = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
    lg.addColorStop(0, '#1f2a44'); lg.addColorStop(1, '#05070d');
    ctx.fillStyle = lg;
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.ellipse(s * 0.18, side * s * 0.2, s * 0.17, s * 0.14, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillRect(s * 0.14, -s * 0.08, s * 0.07, s * 0.16);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = Math.max(0.8, s * 0.035);
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.moveTo(s * 0.12, side * s * 0.2 - s * 0.07); ctx.lineTo(s * 0.24, side * s * 0.2 - s * 0.09); ctx.stroke(); });
  }
  // Taç (tepeden bakış: uçları geriye bakar)
  if (sk.acc === 'crown') {
    ctx.save();
    ctx.translate(-s * 0.1, 0);
    ctx.rotate(-Math.PI / 2);
    _gameDrawCrown(ctx, 0, 0, s * 0.7, s * 0.46);
    ctx.restore();
  }
  ctx.restore();
}

function _snakeDraw(t, now) {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const s = snake.cell, px = s * SNAKE_GRID;
  now = now || performance.now();
  ctx.save();
  ctx.clearRect(0, 0, px, px);
  if (snake.shake > 0) ctx.translate((Math.random() - 0.5) * snake.shake, (Math.random() - 0.5) * snake.shake);

  _snakeDrawBoard(ctx, px, s, now);
  if (snake.coin) _snakeDrawCoin(ctx, snake.coin, false, now);
  if (snake.bigCoin) _snakeDrawCoin(ctx, snake.bigCoin, true, now);
  if (snake.body.length) _snakeDrawSnake(ctx, t, now);

  snake.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  snake.floats.forEach(f => {
    const k = f.life / f.max;
    ctx.globalAlpha = 1 - k * k;
    ctx.fillStyle = f.color;
    ctx.font = `800 ${Math.round(s * 0.62)}px Syne, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = _gBlur(6);
    ctx.fillText(f.text, f.x, f.y - k * s * 1.1);
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;
  if (snake.flash > 0) {
    ctx.fillStyle = `rgba(255,70,100,${snake.flash * 0.18})`;
    ctx.fillRect(0, 0, px, px);
  }
  ctx.restore();
}

/* ── Kontrol ── */
function snakeTurn(dx, dy) {
  if (!snake.running || snake.over || snake.paused) return;
  const last = snake.queue.length ? snake.queue[snake.queue.length - 1] : snake.dir;
  if (last.x === dx && last.y === dy) return;
  if (last.x === -dx && last.y === -dy) return; // geri dönüş yok
  if (snake.queue.length < 3) snake.queue.push({ x: dx, y: dy });
}

function _snakeSetPauseIcon(paused) {
  const btn = document.getElementById('snake-pause-btn');
  if (!btn) return;
  btn.innerHTML = paused
    ? '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" class="fill"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';
  btn.setAttribute('aria-label', paused ? 'Devam et' : 'Duraklat');
}

function snakeTogglePause(force) {
  if (!snake.running || snake.over) return;
  snake.paused = typeof force === 'boolean' ? force : !snake.paused;
  const msg = document.getElementById('snake-msg');
  _snakeSetPauseIcon(snake.paused);
  if (snake.paused) {
    clearTimeout(snake.cdTimer);
    msg.innerHTML = `<div class="snake-card">
        <span class="sg-card-kicker">DURAKLATILDI</span>
        <div class="st-card-score">${snake.pts.toLocaleString('tr')}</div>
        <p>${snake.score} coin topladın</p>
        <div class="snake-card-actions">
          <button class="sg-play" onclick="snakeTogglePause(false)"><span class="sg-play-ic">▶</span><span>Devam et</span></button>
          <button class="snake-ghost-btn" onclick="snakeQuit()">Bitir ve coinleri al</button>
        </div>
      </div>`;
    msg.classList.add('show');
  } else {
    _snakeCountdown(3); // devam etmeden önce kısa geri sayım
  }
}

function _snakeGameOver() {
  if (snake.over) return;
  snake.over = true;
  snake.queue = [];
  const s = snake.cell, h = snake.body[0];
  _snakeBurst(h.x * s + s / 2, h.y * s + s / 2, ['#3ce8b4', '#1fb6c9', '#ff4f79', '#fff'], 30);
  snake.shake = 14;
  snake.flash = 1;
  if (navigator.vibrate) try { navigator.vibrate([70, 40, 70]); } catch {}

  const earned = snake.score;
  if (earned > _snakeGet('best', 0)) _snakeSet('best', earned);
  const isBest = _gameSaveScore('snake', _snakeGet, _snakeSet, snake.pts, earned);
  snake.combo = 0;
  _gameComboChip('snake-combo', 0);
  _snakeAward(earned);

  clearTimeout(snake.endTimer);
  snake.endTimer = setTimeout(() => {
    const left = snakeHeartsLeft();
    const msg = document.getElementById('snake-msg');
    msg.innerHTML = _gameOverCardHtml({
      cls: 'g-card-snake', isBest, pts: snake.pts,
      line: earned ? `${snake.body.length} boya ulaştın${snake.maxCombo > 1 ? `, en iyi combon x${Math.min(snake.maxCombo, GAME_COMBO_MAX)}` : ''}!` : 'Bu sefer coin toplayamadın, bir daha dene!',
      stats: [
        { v: earned, l: 'Coin', coin: true },
        { v: _snakeGet('bestScore', 0).toLocaleString('tr'), l: 'Rekor' },
        { v: 'x' + Math.min(snake.maxCombo || 1, GAME_COMBO_MAX), l: 'En iyi combo' }
      ],
      awardId: 'snake-award-msg',
      awardText: earned > 0 ? 'Coinler hesabına ekleniyor…' : '',
      actions: (left > 0 ? `<button class="sg-play" onclick="snakeRestart()"><span class="sg-play-ic">↻</span><span>Yeniden oyna</span>${SNAKE_UNLIMITED_HEARTS ? '' : `<span class="sg-play-cost">−1 ${SNAKE_HEART_SVG}</span>`}</button>` : '<small class="sg-card-note">Bugünlük kalplerin bitti. Yarın görüşürüz!</small>')
        + '<button class="snake-ghost-btn" onclick="snakeClose()">Kapat</button>'
    });
    msg.classList.add('show');
    if (snake.awardText) { const p = document.getElementById('snake-award-msg'); if (p) p.innerHTML = snake.awardText; }
  }, 750);
}

async function _snakeAward(earned) {
  snake.awardText = null;
  const daily = _snakeDaily();
  daily.earned += earned;
  _snakeSet('daily', daily);
  snakeRenderLobby();
  const setMsg = html => {
    snake.awardText = html;
    const p = document.getElementById('snake-award-msg');
    if (p) p.innerHTML = html;
  };
  if (earned <= 0 || !state.user?.id) return;
  try {
    // Başka cihazdan değişmiş olabilir: güncel bakiyenin üzerine ekle
    let current = Number(state.user.coin || 0);
    try { const st = await sbGetStats(state.user.id); current = Number(st?.coin ?? current); } catch {}
    const newCoin = current + earned;
    await sbUpdateStats(state.user.id, { coin: newCoin });
    state.user.coin = newCoin;
    refreshCoinDisplays();
    if (typeof updateRewardsAvailability === 'function') updateRewardsAvailability();
    setMsg(`<b>+${earned} coin</b> hesabına eklendi!`);
    sbAddNotification(state.user.id, 'Snake Genco 🐍', `Snake Genco'da ${earned} coin topladın, hesabına eklendi!`, 'game_reward').catch(() => {});
    showToast(`Snake Genco: +${earned} coin hesabına eklendi`);
  } catch (e) {
    console.error('Snake Genco ödülü kaydedilemedi:', e);
    setMsg('Coin kaydedilemedi, bağlantını kontrol et.');
    showToast('Hata: coin hesabına eklenemedi');
  }
}

function snakeRestart() {
  snake.running = false;
  snakeStart();
}

function snakeClose() {
  clearTimeout(snake.cdTimer);
  clearTimeout(snake.endTimer);
  cancelAnimationFrame(snake.raf);
  snake.running = false;
  const overlay = document.getElementById('snake-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('snake-lock');
  document.getElementById('snake-msg').classList.remove('show');
  snakeRenderLobby();
}

function snakeQuit() {
  if (snake.running && !snake.over) {
    if (!confirm('Oyundan çıkılsın mı? Şu ana kadar topladığın coinler hesabına eklenecek.')) return;
    _snakeGameOver();
  }
  snakeClose();
}

(function initSnakeControls() {
  const overlay = document.getElementById('snake-overlay');
  if (!overlay) return;

  overlay.addEventListener('touchstart', e => {
    const t = e.touches[0];
    snake.touch = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  overlay.addEventListener('touchmove', e => {
    if (!snake.touch) return;
    if (!e.target.closest('button')) e.preventDefault(); // sayfanın kaymasını engelle
    const t = e.touches[0];
    const dx = t.clientX - snake.touch.x, dy = t.clientY - snake.touch.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) snakeTurn(dx > 0 ? 1 : -1, 0);
    else snakeTurn(0, dy > 0 ? 1 : -1);
    snake.touch = { x: t.clientX, y: t.clientY }; // parmağı kaldırmadan art arda dönüş
  }, { passive: false });

  overlay.addEventListener('touchend', () => { snake.touch = null; }, { passive: true });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    const map = {
      ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
      ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
      ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
      ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
    };
    if (map[e.key]) { e.preventDefault(); snakeTurn(...map[e.key]); }
    else if (e.key === ' ' || e.key === 'p' || e.key === 'P') { e.preventDefault(); snakeTogglePause(); }
    else if (e.key === 'Escape') snakeQuit();
  });

  window.addEventListener('resize', () => { if (overlay.classList.contains('open')) snakeResize(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && snake.running && !snake.over && !snake.paused) snakeTogglePause(true);
  });
})();


/* ─── MİNİ OYUN: FLAPPY GENCO ───
   Ekrana dokununca kuş kanat çırpar. İki boru arasından geçilen her engel
   1 coin; oyun bitince toplanan coinler hesaba eklenir. Dünya her zaman
   640 birim yüksekliğinde, genişlik ekran oranına göre değişir. */
const FB_COIN_PER_PIPE = 1;
const FB_MAX_HEARTS = 2;          // günlük oynama hakkı (her tur 1 can)
const FB_UNLIMITED_HEARTS = true; // true: can harcanmaz (şimdilik sınırsız)
const FB_PTS_PIPE = 10;          // puan: geçilen her engel
const FB_PTS_PERFECT = 10;       // Perfect bonusu × combo çarpanı
const FB_PERFECT_ZONE = 0.17;    // boşluk yüksekliğinin bu oranı kadar merkeze yakın geçiş = Perfect
const FB_WORLD_H = 640;
const FB_GROUND = 78;
const FB_GRAVITY = 1900;      // birim / sn²
const FB_FLAP = -560;
const FB_MAX_FALL = 820;
const FB_BIRD_R = 16;
const FB_PIPE_W = 70;
const FB_PIPE_SPACING = 228;
const FB_GAP_START = 178;
const FB_GAP_MIN = 146;
const FB_SPEED_START = 150;
const FB_SPEED_MAX = 215;
const FB_STEP = 1 / 120;      // sabit fizik adımı
const FB_MEDALS = [
  { at: 10, name: 'Bronz', cls: 'bronze' },
  { at: 25, name: 'Gümüş', cls: 'silver' },
  { at: 50, name: 'Altın', cls: 'gold' }
];

const fb = {
  mode: 'idle', // idle | ready | play | dying | over
  paused: false, resuming: false, finished: false, isBest: false,
  w: 360, scale: 1,
  bird: { x: 0, y: 0, vy: 0, rot: 0, flap: 0 },
  pipes: [], score: 0, coins: 0, speed: FB_SPEED_START,
  dist: 0, time: 0, acc: 0, last: 0, raf: null, cdTimer: null, endTimer: null, cardAt: 0,
  particles: [], floats: [], stars: [], shake: 0, flash: 0, bump: 0, awardText: null
};

function _fbKey(name) { return `genco_flappy_${name}_${state.user?.id || 'guest'}`; }
function _fbGet(name, fallback) {
  try { const v = JSON.parse(localStorage.getItem(_fbKey(name))); return v ?? fallback; } catch { return fallback; }
}
function _fbSet(name, value) {
  try { localStorage.setItem(_fbKey(name), JSON.stringify(value)); } catch {}
}
function _fbDaily() {
  const d = _fbGet('daily', null);
  if (!d || d.day !== _snakeDayKey()) return { day: _snakeDayKey(), games: 0, earned: 0, used: 0 };
  return d;
}
function fbHeartsLeft() { if (FB_UNLIMITED_HEARTS) return FB_MAX_HEARTS; return Math.max(0, FB_MAX_HEARTS - (_fbDaily().used || 0)); }
// Yeni tur başlarken 1 can harcar; can yoksa false döner
function _fbUseHeart() {
  if (FB_UNLIMITED_HEARTS) return true;
  const daily = _fbDaily();
  if ((daily.used || 0) >= FB_MAX_HEARTS) { fbRenderLobby(); showToast('Bugünlük canların bitti. Yarın tekrar dene!'); return false; }
  daily.used = (daily.used || 0) + 1;
  _fbSet('daily', daily);
  return true;
}
function _fbMedal(score) { return [...FB_MEDALS].reverse().find(m => score >= m.at) || null; }
// Aynı girdi için hep aynı sonucu veren sözde rastgele (şehir silueti için)
function _fbRand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* Flappy temaları: gökyüzü, gök cismi, arka katmanlar, boru ve zemin renkleri */
const FB_THEMES = [
  { id: 'night', name: 'Gece Şehri', icon: '🌃',
    sky: ['#061331', '#10306c', '#2a5aa6'], glow: ['rgba(255,170,90,0.28)', 'rgba(60,232,180,0.08)'],
    stars: 55, orb: { type: 'moon', x: 0.78, y: 92, r: 24 },
    cloud: '200,220,255', cloudA: 0.05, far: '#183a78', near: 'city', nearColor: '#0e2553', win: '255,217,102',
    turf: ['#5ff5c8', '#18a9b8'], soil: ['#1d4a8f', '#0a1d45'], stripe: 'rgba(8,60,80,0.28)',
    pipe: ['#0a4d63', '#138aa0', '#3ce8b4', '#b6fff0', '#3ce8b4', '#1591a8', '#083f55'], pipeEdge: 'rgba(182,255,240,0.85)', pipeLine: 'rgba(2,30,45,0.45)',
    bg: 'linear-gradient(180deg,#0a1d45 0%,#050f26 100%)', glowCss: ['#ffa62b', '#1fb6c9'], frame: '255,201,60' },
  { id: 'sunset', name: 'Gün Batımı', icon: '🌅',
    sky: ['#1e0b3d', '#8a2a6b', '#ff8a5c'], glow: ['rgba(255,200,120,0.45)', 'rgba(255,90,120,0.12)'],
    stars: 18, orb: { type: 'sun', x: 0.28, y: 0.72, r: 46, c: ['#fff3c4', '#ffb347', '#ff6a3d'] },
    cloud: '255,180,200', cloudA: 0.1, far: '#5b2466', near: 'city', nearColor: '#2e0f3d', win: '255,190,120',
    turf: ['#ffb36b', '#e0663f'], soil: ['#5a1f4a', '#2a0b24'], stripe: 'rgba(90,20,40,0.25)', dots: 'rgba(255,170,140,0.1)',
    pipe: ['#2a0a45', '#6a1f9a', '#b04fe0', '#f3c6ff', '#b04fe0', '#6a1f9a', '#2a0a45'], pipeEdge: 'rgba(255,215,250,0.9)', pipeLine: 'rgba(40,5,50,0.5)',
    bg: 'linear-gradient(180deg,#2a0f3d 0%,#12051c 100%)', glowCss: ['#ff6a3d', '#b04fe0'], frame: '255,140,110' },
  { id: 'beach', name: 'Alanya Sahili', icon: '🏖️',
    sky: ['#2f8fe8', '#6cc3ff', '#d4f0ff'], glow: ['rgba(255,255,220,0.35)', 'rgba(255,255,255,0.05)'],
    stars: 0, orb: { type: 'sun', x: 0.8, y: 92, r: 30, c: ['#fffbe0', '#ffe066', '#ffb020'] },
    cloud: '255,255,255', cloudA: 0.45, far: '#86b6e4', near: 'sea',
    turf: ['#fff0c2', '#f2c46d'], soil: ['#e8b562', '#c98d3e'], stripe: 'rgba(170,110,40,0.2)', dots: 'rgba(150,95,30,0.18)',
    pipe: ['#144d18', '#2f8f33', '#63d35b', '#dcffd0', '#63d35b', '#2f8f33', '#144d18'], pipeEdge: 'rgba(235,255,225,0.9)', pipeLine: 'rgba(10,50,10,0.45)',
    bg: 'linear-gradient(180deg,#0d4f8f 0%,#062a52 100%)', glowCss: ['#ffe066', '#2fb4ff'], frame: '140,210,255' },
  { id: 'winter', name: 'Karlı Dağ', icon: '🏔️',
    sky: ['#0d1b36', '#2a4a7a', '#9ab8dc'], glow: ['rgba(210,235,255,0.25)', 'rgba(150,200,255,0.06)'],
    stars: 35, orb: { type: 'moon', x: 0.22, y: 90, r: 22 },
    cloud: '230,240,255', cloudA: 0.08, far: '#a9bfdc', farCap: '#f2f7ff', near: 'forest', nearColor: '#16324a', snow: true,
    turf: ['#ffffff', '#d6e6f5'], soil: ['#b9cfe6', '#7f9dc2'], stripe: 'rgba(120,150,190,0.22)', dots: 'rgba(255,255,255,0.4)',
    pipe: ['#1f5a85', '#4a94c8', '#a8dcff', '#ffffff', '#a8dcff', '#4a94c8', '#1f5a85'], pipeEdge: 'rgba(255,255,255,0.95)', pipeLine: 'rgba(20,60,100,0.45)',
    bg: 'linear-gradient(180deg,#132a4d 0%,#07152b 100%)', glowCss: ['#9fd8ff', '#5a7fd9'], frame: '200,230,255' },
  { id: 'neon', name: 'Neon', icon: '🕹️',
    sky: ['#07011a', '#2a0a4e', '#ff2e88'], glow: ['rgba(255,46,136,0.4)', 'rgba(123,44,255,0.12)'],
    stars: 45, orb: { type: 'synth', x: 0.5, y: 0.8, r: 74, c: ['#ffe66d', '#ff7a45', '#ff2e88'] },
    cloud: null, far: '#1a0433', farLine: '#ff2e88', near: null, grid: true,
    turf: ['#ff2e88', '#7b2cff'], soil: ['#12012e', '#07011a'], stripe: null,
    pipe: ['#12002b', '#3b0a7a', '#00c8ff', '#d9fbff', '#00c8ff', '#3b0a7a', '#12002b'], pipeEdge: '#ff2e88', pipeLine: 'rgba(0,229,255,0.7)',
    bg: 'linear-gradient(180deg,#14042b 0%,#060112 100%)', glowCss: ['#ff2e88', '#00c8ff'], frame: '255,46,136' },
  { id: 'space', name: 'Uzay', icon: '🪐',
    sky: ['#01020a', '#070b24', '#1a1650'], glow: ['rgba(140,80,255,0.22)', 'rgba(0,200,255,0.06)'],
    stars: 110, orb: { type: 'planet', x: 0.74, y: 120, r: 30, c: ['#ffd2a1', '#e07a5f'] }, nebula: true,
    cloud: null, far: null, near: null,
    turf: ['#b3bedb', '#6b789e'], soil: ['#2b3252', '#141833'], stripe: 'rgba(20,25,50,0.35)', dots: 'rgba(160,240,255,0.18)',
    pipe: ['#1f1340', '#5a3fa8', '#a28bff', '#f1ecff', '#a28bff', '#5a3fa8', '#1f1340'], pipeEdge: 'rgba(160,240,255,0.9)', pipeLine: 'rgba(10,5,30,0.55)',
    bg: 'linear-gradient(180deg,#0a0820 0%,#02020a 100%)', glowCss: ['#8b5cf6', '#00c8ff'], frame: '170,140,255' }
];
// Seçicideki önizleme: gökyüzü + boru + zemin şeridi
FB_THEMES.forEach(t => {
  t.swatch = `linear-gradient(90deg, transparent 62%, ${t.pipe[2]} 62%, ${t.pipe[3]} 70%, ${t.pipe[1]} 78%, transparent 78%) 0 0/100% 38% no-repeat, ` +
    `linear-gradient(90deg, transparent 62%, ${t.pipe[2]} 62%, ${t.pipe[3]} 70%, ${t.pipe[1]} 78%, transparent 78%) 0 100%/100% 34% no-repeat, ` +
    `linear-gradient(180deg, ${t.sky[0]} 0%, ${t.sky[1]} 45%, ${t.sky[2]} 76%, ${t.turf[0]} 76%, ${t.turf[1]} 83%, ${t.soil[0]} 83%, ${t.soil[1]} 100%)`;
});
function _fbTheme() { return FB_THEMES.find(t => t.id === _fbGet('theme', 'night')) || FB_THEMES[0]; }
function fbSetTheme(id) {
  if (!FB_THEMES.some(t => t.id === id)) return;
  _fbSet('theme', id);
  _fbRenderThemes();
}
function _fbRenderThemes() {
  const t = _fbTheme();
  const row = document.getElementById('fb-themes');
  if (row) row.innerHTML = _themePickerHtml(FB_THEMES, t.id, 'fbSetTheme');
  _gthCenterActive(document.getElementById('fb-themes'));
  const name = document.getElementById('fb-theme-name');
  if (name) name.textContent = t.name;
  _gsetupStage('fb-setup-stage', t);
}
const FB_SKINS = [
  { id: 'classic', name: 'Klasik', body: ['#fff3b0', '#ffd23f', '#ff9a1a'], line: 'rgba(140,60,0,0.35)', belly: 'rgba(255,246,214,0.92)',
    wing: ['#ffc94a', '#ff9a1a'], wingLine: 'rgba(160,80,0,0.45)', tail: ['#ff7a1a'], tuft: '#ff9f1c', beak: ['#ff5a36', '#d9401c'], cheek: 'rgba(255,95,120,0.45)' },
  { id: 'cool', name: 'Havalı', body: ['#d6fff4', '#3ce8b4', '#149e8c'], line: 'rgba(0,70,60,0.35)', belly: 'rgba(230,255,248,0.9)',
    wing: ['#8ff7d6', '#1fb6c9'], wingLine: 'rgba(0,80,90,0.45)', tail: ['#1fb6c9'], tuft: '#1fb6c9', beak: ['#ffb020', '#e08a00'], cheek: 'rgba(255,120,150,0.35)', acc: ['shades'] },
  { id: 'cardinal', name: 'Kardinal', body: ['#ffc2c2', '#ff4d5e', '#b3122e'], line: 'rgba(90,0,20,0.4)', belly: 'rgba(255,220,220,0.85)',
    wing: ['#ff6b7a', '#c4162f'], wingLine: 'rgba(90,0,20,0.45)', tail: ['#b3122e'], tuft: '#ff4d5e', tuftBig: true, beak: ['#ffb020', '#e08a00'], cheek: null, mask: true },
  { id: 'penguin', name: 'Penguen', body: ['#7c8aa3', '#2f3a4f', '#121826'], line: 'rgba(0,0,0,0.5)', belly: '#ffffff', bellyBig: true,
    wing: ['#3a465e', '#161d2c'], wingLine: 'rgba(0,0,0,0.5)', tail: ['#161d2c'], tuft: null, beak: ['#ffa31a', '#e07b00'], cheek: 'rgba(255,120,150,0.4)', acc: ['bowtie'] },
  { id: 'unicorn', name: 'Unicorn', body: ['#ffffff', '#ffd6f5', '#d59cff'], line: 'rgba(120,60,160,0.35)', belly: 'rgba(255,255,255,0.9)',
    wing: ['#c7f0ff', '#b38cff'], wingLine: 'rgba(120,60,160,0.4)', tail: ['#ff5ea8', '#ffd23f', '#3ce8b4', '#5aa9ff'], tuft: '#ff8ad8',
    beak: ['#ffb020', '#e08a00'], cheek: 'rgba(255,95,170,0.45)', acc: ['horn'], trail: ['#ff5ea8', '#ffd23f', '#3ce8b4', '#5aa9ff', '#b38cff'] },
  { id: 'king', name: 'Kral', body: ['#f1e2ff', '#a855f7', '#6b21a8'], line: 'rgba(50,0,80,0.4)', belly: 'rgba(245,230,255,0.85)',
    wing: ['#c084fc', '#7e22ce'], wingLine: 'rgba(50,0,80,0.45)', tail: ['#ffd23f'], tuft: null, beak: ['#ffb020', '#e08a00'], cheek: 'rgba(255,120,190,0.4)', acc: ['crown'] },
  { id: 'ninja', name: 'Ninja', body: ['#8b95a7', '#3b4252', '#12151c'], line: 'rgba(0,0,0,0.5)', belly: 'rgba(180,190,205,0.55)',
    wing: ['#4b5366', '#1c2029'], wingLine: 'rgba(0,0,0,0.5)', tail: ['#1c2029'], tuft: null, beak: ['#ff8a3d', '#d9601c'], cheek: null, acc: ['band'] },
  { id: 'robot', name: 'Robot', body: ['#ffffff', '#c9d3e3', '#7d8aa3'], line: 'rgba(40,50,70,0.5)', belly: 'rgba(150,165,190,0.45)',
    wing: ['#e2e8f2', '#8e9bb3'], wingLine: 'rgba(40,50,70,0.5)', tail: ['#8e9bb3'], tuft: null, beak: ['#ffb020', '#d98a00'], cheek: null,
    acc: ['antenna'], visor: true, trail: ['#00e5ff', '#7df9ff'] }
];
function _fbSkin() { return FB_SKINS.find(k => k.id === _fbGet('skin', 'classic')) || FB_SKINS[0]; }
function fbSetSkin(id) {
  if (!FB_SKINS.some(k => k.id === id)) return;
  _fbSet('skin', id);
  _fbRenderSkins();
}
function _fbRenderSkins() {
  const sk = _fbSkin();
  const row = document.getElementById('fb-skins');
  if (row) {
    row.innerHTML = _skinPickerHtml(FB_SKINS, sk.id, 'fbSetSkin');
    row.querySelectorAll('canvas[data-skin]').forEach(c => {
      const ctx = _skinPreviewCtx(c);
      _fbDrawBirdAt(ctx, 37, 33, -0.12, 0.6, false, FB_SKINS.find(k => k.id === c.dataset.skin), 0.4);
    });
  }
  _gthCenterActive(document.getElementById('fb-skins'));
  const name = document.getElementById('fb-skin-name');
  if (name) name.textContent = sk.name;
  const pv = document.getElementById('fb-setup-preview');
  if (pv) _fbDrawBirdAt(_skinPreviewCtx(pv, GSETUP_PREVIEW_SCALE), 37, 29, -0.12, 0.6, false, sk, 0.4);
}

function _fbApplyTheme() {
  fb.skin = _fbSkin();
  const t = fb.th = _fbTheme();
  const overlay = document.getElementById('fb-overlay');
  if (!overlay) return;
  overlay.style.background = t.bg;
  const [a, b] = overlay.querySelectorAll('.sg-glow');
  if (a) a.style.background = `radial-gradient(circle, ${t.glowCss[0]} 0%, transparent 68%)`;
  if (b) b.style.background = `radial-gradient(circle, ${t.glowCss[1]} 0%, transparent 68%)`;
  const canvas = document.getElementById('fb-canvas');
  if (canvas) canvas.style.boxShadow = `0 0 0 1px rgba(${t.frame},0.3), 0 0 0 6px rgba(${t.frame},0.06), 0 24px 60px rgba(0,0,0,0.55), 0 0 60px rgba(${t.frame},0.14)`;
}

function fbRenderLobby() {
  const best = _fbGet('best', 0);
  const daily = _fbDaily();
  const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
  const bestScore = _fbGet('bestScore', 0);
  set('fb-best', el => { el.textContent = bestScore.toLocaleString('tr'); });
  set('fb-best-chip', el => { el.textContent = best; });
  set('fb-hud-best', el => { el.textContent = bestScore.toLocaleString('tr'); });
  set('fb-today', el => { el.textContent = daily.earned; });
  const left = fbHeartsLeft();
  set('fb-hearts', el => { el.innerHTML = Array.from({ length: FB_MAX_HEARTS }, (_, i) => `<span class="snake-heart ${i < left ? 'full' : 'empty'}">${SNAKE_HEART_SVG}</span>`).join(''); });
  set('fb-reset-in', el => {
    const now = new Date();
    const mid = new Date(now); mid.setHours(24, 0, 0, 0);
    const mins = Math.floor((mid - now) / 60000);
    el.textContent = `↻ ${Math.floor(mins / 60)}s ${mins % 60}dk`;
  });
  set('fb-hearts-note', el => { el.textContent = FB_UNLIMITED_HEARTS ? 'Sınırsız can açık · istediğin kadar oyna' : left > 0 ? `${left} canın kaldı · her tur 1 can harcar` : `Bugünlük canların bitti, yarın ${FB_MAX_HEARTS} yeni can!`; });
  set('fb-play-btn', el => {
    el.disabled = left <= 0;
    el.innerHTML = left > 0
      ? '<span class="sg-play-ic">▶</span><span>Uçmaya başla</span><span class="sg-play-cost">−1 ' + SNAKE_HEART_SVG + '</span>'
      : '<span>Yarın tekrar gel</span>';
  });
  set('fb-medals', el => {
    el.innerHTML = FB_MEDALS.map(m => `
      <div class="fb-medal fb-medal-${m.cls} ${best >= m.at ? 'on' : ''}">
        <i>${best >= m.at ? '★' : ''}</i>
        <span><b>${m.name}</b><small>${m.at} engel</small></span>
      </div>`).join('');
  });
  _fbRenderThemes();
  _fbRenderSkins();
  kzRefreshNav();
  _gameSyncBest('flappy', _fbGet, _fbSet, fbRenderLobby);
}

function fbOpenSetup() {
  if (document.getElementById('fb-overlay')?.classList.contains('open')) return;
  if (!state.user?.id) { showToast('Oynamak için giriş yapman gerek'); return; }
  if (fbHeartsLeft() <= 0) { fbRenderLobby(); showToast('Bugünlük canların bitti. Yarın tekrar dene!'); return; }
  _fbRenderThemes();
  _fbRenderSkins();
  _gsetupToggle('fb-setup', true);
}
function fbCloseSetup() { _gsetupToggle('fb-setup', false); }
function fbSetupGo() { fbCloseSetup(); fbStart(); }

function fbStart() {
  const overlay = document.getElementById('fb-overlay');
  if (!overlay || overlay.classList.contains('open')) return;
  if (!state.user?.id) { showToast('Oynamak için giriş yapman gerek'); return; }
  if (!_fbUseHeart()) return;
  document.activeElement?.blur?.();
  _fbApplyTheme();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('snake-lock');
  fbResize();
  _fbReset();
  cancelAnimationFrame(fb.raf);
  fb.last = 0;
  fb.raf = requestAnimationFrame(_fbFrame);
}

function _fbReset() {
  clearTimeout(fb.cdTimer);
  clearTimeout(fb.endTimer);
  Object.assign(fb, {
    mode: 'ready', paused: false, resuming: false, finished: false, isBest: false,
    pipes: [], score: 0, coins: 0, speed: FB_SPEED_START, acc: 0,
    pts: 0, combo: 0, maxCombo: 0, perfects: 0,
    particles: [], floats: [], shake: 0, flash: 0, bump: 0, awardText: null
  });
  _gameComboChip('fb-combo', 0);
  fb.bird = { x: fb.w * 0.3, y: (FB_WORLD_H - FB_GROUND) * 0.45, vy: 0, rot: 0, flap: 0 };
  if (fb.stars.length < 110) {
    fb.stars = Array.from({ length: 110 }, () => ({
      x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.3,
      a: 0.35 + Math.random() * 0.6, sp: 0.8 + Math.random() * 2.2, ph: Math.random() * 6
    }));
  }
  fb.snow = fb.th?.snow ? Array.from({ length: 70 }, () => ({
    x: Math.random() * fb.w, y: Math.random() * FB_WORLD_H, r: 0.8 + Math.random() * 2.2,
    vy: 22 + Math.random() * 40, a: 0.4 + Math.random() * 0.5, ph: Math.random() * 6
  })) : [];
  _fbSetPauseIcon(false);
  _fbUpdateScore();
  const best = document.getElementById('fb-hud-best');
  if (best) best.textContent = _fbGet('bestScore', 0).toLocaleString('tr');
  const msg = document.getElementById('fb-msg');
  msg.innerHTML = `<div class="fb-ready">
      <div class="fb-ready-hand"><svg viewBox="0 0 24 24"><path d="M9 11.2V5.5a1.5 1.5 0 0 1 3 0V10h.5a1.5 1.5 0 0 1 1.5 1.2h.4a1.5 1.5 0 0 1 1.6 1.3 1.5 1.5 0 0 1 2 1.4V17a5 5 0 0 1-5 5h-1.3a5 5 0 0 1-4.1-2.1L5.3 16a1.5 1.5 0 0 1 2.3-2l1.4 1.6z"/></svg></div>
      <b>Uçmak için dokun</b>
      <small><span class="snake-score-coin">G</span>Her engel +${FB_COIN_PER_PIPE} coin · ortadan geç, Perfect!</small>
    </div>`;
  msg.classList.add('show');
}

function fbResize() {
  const wrap = document.getElementById('fb-board-wrap');
  const canvas = document.getElementById('fb-canvas');
  if (!wrap || !canvas) return;
  const h = Math.floor(wrap.clientHeight);
  const w = Math.floor(Math.min(wrap.clientWidth, 480, h * 0.8));
  if (!w || !h) return;
  const dpr = gameDpr();
  if (canvas.width === Math.round(w * dpr) && canvas.height === Math.round(h * dpr) && fb.scale === h / FB_WORLD_H) return;
  fb.scale = h / FB_WORLD_H;
  fb.w = w / fb.scale;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.getContext('2d').setTransform(dpr * fb.scale, 0, 0, dpr * fb.scale, 0, 0);
}

function fbFlap() {
  if (fb.paused) return;
  if (fb.mode === 'ready') {
    fb.mode = 'play';
    document.getElementById('fb-msg').classList.remove('show');
    _fbSpawnPipe(fb.w + 60);
  }
  if (fb.mode !== 'play') return;
  const b = fb.bird;
  b.vy = FB_FLAP;
  b.flap = 1;
  const trail = fb.skin?.trail; // unicorn/robot kostümünde renkli iz
  for (let i = 0; i < (trail ? 8 : 5); i++) {
    fb.particles.push({
      x: b.x - 12, y: b.y + 6, vx: -60 - Math.random() * 80, vy: 20 + Math.random() * 60,
      g: 0, life: 0, max: 0.35 + Math.random() * (trail ? 0.35 : 0.2), size: 2 + Math.random() * 2.5,
      color: trail ? trail[i % trail.length] : 'rgba(255,255,255,0.55)'
    });
  }
}

/* Ana döngü: fizik sabit adımlarla, çizim her karede */
function _fbFrame(ts) {
  const dt = fb.last ? Math.min(0.05, (ts - fb.last) / 1000) : 1 / 60;
  fb.last = ts;
  if (!fb.paused) {
    fb.time += dt;
    const n = Math.max(1, Math.ceil(dt / FB_STEP - 1e-6));
    for (let i = 0; i < n; i++) _fbStep(dt / n);
    _fbUpdateFx(dt);
  }
  _fbDraw();
  if (document.getElementById('fb-overlay')?.classList.contains('open')) {
    fb.raf = requestAnimationFrame(_fbFrame);
  }
}

function _fbStep(dt) {
  const b = fb.bird, gy = FB_WORLD_H - FB_GROUND;
  b.flap = Math.max(0, b.flap - dt * 3);
  if (fb.mode === 'ready' || fb.mode === 'play') fb.dist += fb.speed * dt;
  if (fb.mode === 'ready') {
    b.y = gy * 0.45 + Math.sin(fb.time * 5) * 7;
    b.rot = Math.sin(fb.time * 5 + 1) * 0.08;
    return;
  }
  if (fb.mode !== 'play' && fb.mode !== 'dying') return;

  b.vy = Math.min(FB_MAX_FALL, b.vy + FB_GRAVITY * dt);
  b.y += b.vy * dt;
  const target = b.vy < 0 ? -0.42 : Math.min(1.5, -0.42 + (b.vy / FB_MAX_FALL) * 2);
  b.rot += (target - b.rot) * Math.min(1, dt * (b.vy < 0 ? 18 : 6));
  if (b.y < FB_BIRD_R) { b.y = FB_BIRD_R; b.vy = 0; }

  if (b.y >= gy - FB_BIRD_R) {
    b.y = gy - FB_BIRD_R;
    b.vy = 0;
    if (fb.mode === 'play') _fbCrash();
    fb.mode = 'over';
    b.rot = 1.5;
    _fbBurst(b.x, gy, ['#5ff5c8', '#ffd23f', 'rgba(255,255,255,.7)'], 10, 180);
    fb.endTimer = setTimeout(_fbShowOver, 520);
    return;
  }
  if (fb.mode !== 'play') return; // düşerken borular durur

  for (const p of fb.pipes) p.x -= fb.speed * dt;
  fb.pipes = fb.pipes.filter(p => p.x + FB_PIPE_W > -20);
  const last = fb.pipes[fb.pipes.length - 1];
  if (last && last.x + FB_PIPE_SPACING <= fb.w + 20) _fbSpawnPipe(last.x + FB_PIPE_SPACING);

  for (const p of fb.pipes) {
    if (!p.passed && p.x + FB_PIPE_W / 2 < b.x) { p.passed = true; _fbScore(p); }
    if (_fbHitsPipe(b, p, gy)) { _fbCrash(); break; }
  }
}

function _fbSpawnPipe(x) {
  const gy = FB_WORLD_H - FB_GROUND;
  const gap = Math.max(FB_GAP_MIN, FB_GAP_START - fb.score * 1.6);
  const minY = 70, maxY = gy - 70 - gap;
  let y = minY + Math.random() * (maxY - minY);
  const prev = fb.pipes[fb.pipes.length - 1];
  if (prev) y = Math.max(prev.gapY - 170, Math.min(prev.gapY + 170, y)); // adil olsun: ani sıçrama yok
  fb.pipes.push({ x, gapY: Math.max(minY, Math.min(maxY, y)), gap, passed: false, coin: true, seed: Math.random() * 6 });
}

function _fbHitsPipe(b, p, gy) {
  const r = FB_BIRD_R * 0.8; // biraz affedici çarpışma
  if (b.x + r < p.x || b.x - r > p.x + FB_PIPE_W) return false;
  const rects = [[p.x, -200, p.gapY + 200], [p.x, p.gapY + p.gap, gy - p.gapY - p.gap]];
  return rects.some(([x, y, h]) => {
    const cx = Math.max(x, Math.min(b.x, x + FB_PIPE_W));
    const cy = Math.max(y, Math.min(b.y, y + h));
    return (b.x - cx) ** 2 + (b.y - cy) ** 2 < r * r;
  });
}

function _fbScore(p) {
  fb.score += 1;
  fb.coins += FB_COIN_PER_PIPE;
  p.coin = false;
  const cx = p.x + FB_PIPE_W / 2, cy = p.gapY + p.gap / 2;
  _fbBurst(cx, cy, ['#ffe27a', '#ffd23f', '#fff6c2', '#ffb020'], 18, 260);
  const perfect = Math.abs(fb.bird.y - cy) <= p.gap * FB_PERFECT_ZONE;
  let gain = FB_PTS_PIPE;
  if (perfect) {
    fb.combo += 1;
    fb.perfects += 1;
    fb.maxCombo = Math.max(fb.maxCombo, fb.combo);
    const mult = Math.min(fb.combo, GAME_COMBO_MAX);
    gain += FB_PTS_PERFECT * mult;
    fb.floats.push({ x: cx, y: cy - 20, text: mult > 1 ? `PERFECT x${mult}` : 'PERFECT', color: '#ffffff', size: 24, life: 0, max: 0.9 });
    fb.floats.push({ x: cx, y: cy + 14, text: `+${gain}`, color: '#ffd966', size: 20, life: 0, max: 0.9 });
    _fbBurst(fb.bird.x, fb.bird.y, ['#ffffff', '#7bf5d1', '#ffd966'], 14, 200);
    fb.flash = Math.max(fb.flash, 0.25);
  } else {
    fb.combo = 0;
    fb.floats.push({ x: cx, y: cy - 16, text: `+${gain}`, color: '#ffd966', size: 24, life: 0, max: 0.9 });
  }
  fb.pts += gain;
  _gameComboChip('fb-combo', fb.combo);
  if (fb.score % 10 === 0) {
    fb.floats.push({ x: fb.w / 2, y: 150, text: `${fb.score} ENGEL!`, color: '#7bf5d1', size: 30, life: 0, max: 1.3 });
  }
  fb.speed = Math.min(FB_SPEED_MAX, FB_SPEED_START + fb.score * 2);
  fb.bump = 1;
  _fbUpdateScore(true);
  if (navigator.vibrate) try { navigator.vibrate(perfect ? [10, 30, 14] : 10); } catch {}
}

function _fbCrash() {
  if (fb.mode !== 'play') return;
  fb.mode = 'dying';
  fb.shake = 12;
  fb.flash = 1;
  fb.bird.vy = -260;
  _fbBurst(fb.bird.x, fb.bird.y, ['#ffd23f', '#ff9f1c', '#fff3b0', '#ff5a36'], 22, 300, true);
  if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch {}
  _fbFinish();
}

// Oyunu bir kez kapatır: rekor, günlük sayaç ve coin ödülü
function _fbFinish() {
  if (fb.finished) return;
  fb.finished = true;
  if (fb.score > _fbGet('best', 0)) _fbSet('best', fb.score); // madalyalar engel rekoruna bağlı
  fb.isBest = _gameSaveScore('flappy', _fbGet, _fbSet, fb.pts, fb.score);
  fb.combo = 0;
  _gameComboChip('fb-combo', 0);
  const daily = _fbDaily();
  daily.games += 1;
  _fbSet('daily', daily);
  _fbAward(fb.coins);
}

/* ── Efektler ── */
function _fbBurst(x, y, colors, count, speed, feathers) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.7);
    fb.particles.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, g: 700,
      life: 0, max: 0.5 + Math.random() * 0.5, size: 2 + Math.random() * 3,
      color: colors[i % colors.length], feather: !!feathers && i % 2 === 0,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12
    });
  }
}
function _fbUpdateFx(dt) {
  fb.particles = fb.particles.filter(p => {
    p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= 0.985;
    if (p.vr) p.rot += p.vr * dt;
    return p.life < p.max;
  });
  fb.floats = fb.floats.filter(f => (f.life += dt) < f.max);
  fb.shake = Math.max(0, fb.shake - dt * 40);
  fb.flash = Math.max(0, fb.flash - dt * 3);
  fb.bump = Math.max(0, fb.bump - dt * 5);
  for (const f of fb.snow || []) {
    f.y += f.vy * dt;
    f.x -= (fb.mode === 'play' ? fb.speed * 0.25 : 8) * dt;
    if (f.y > FB_WORLD_H) { f.y = -4; f.x = Math.random() * fb.w; }
    if (f.x < -8) f.x += fb.w + 16;
  }
}

function _fbUpdateScore(bump) {
  const el = document.getElementById('fb-score');
  if (el) {
    el.textContent = fb.pts.toLocaleString('tr');
    if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  const pipes = document.getElementById('fb-hud-pipes');
  if (pipes) pipes.textContent = fb.score;
  const coins = document.getElementById('fb-hud-coins');
  if (coins) coins.textContent = fb.coins;
  const best = document.getElementById('fb-hud-best');
  if (best) best.textContent = Math.max(_fbGet('bestScore', 0), fb.pts).toLocaleString('tr');
}

/* ── Çizim ── */
function _fbRRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function _fbDrawOrb(ctx, o, W, gy) {
  if (!o) return;
  const x = W * o.x, y = o.y <= 1 ? gy * o.y : o.y, r = o.r, t = fb.time;
  if (o.type === 'moon') {
    const mg = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 4);
    mg.addColorStop(0, 'rgba(255,240,200,0.24)');
    mg.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(214,194,150,0.45)';
    [[-0.3, -0.2, 0.2], [0.33, 0.25, 0.15], [0.08, -0.5, 0.1], [-0.12, 0.42, 0.09]].forEach(([ox, oy, cr]) => {
      ctx.beginPath(); ctx.arc(x + ox * r, y + oy * r, cr * r, 0, Math.PI * 2); ctx.fill();
    });
  } else if (o.type === 'sun') {
    const pulse = 1 + Math.sin(t * 1.5) * 0.04;
    const sg = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3.4 * pulse);
    sg.addColorStop(0, 'rgba(255,230,150,0.45)');
    sg.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(x, y, r * 3.4 * pulse, 0, Math.PI * 2); ctx.fill();
    const body = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    body.addColorStop(0, o.c[0]); body.addColorStop(0.6, o.c[1]); body.addColorStop(1, o.c[2]);
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === 'synth') {
    // Retro güneş: alt yarısı giderek açılan çizgilerle kesik
    const sg = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2);
    sg.addColorStop(0, 'rgba(255,46,136,0.4)');
    sg.addColorStop(1, 'rgba(255,46,136,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, o.c[0]); g.addColorStop(0.5, o.c[1]); g.addColorStop(1, o.c[2]);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 1.05);
    for (let k = 0, yy = y + r * 0.08; yy < y + r && k < 12; k++) {
      const h = Math.max(1.5, r * (0.13 - k * 0.013));
      ctx.fillRect(x - r, yy, r * 2, h);
      yy += h + r * (0.035 + k * 0.022);
    }
    ctx.restore();
  } else if (o.type === 'planet') {
    const tilt = -0.35;
    ctx.strokeStyle = 'rgba(255,220,180,0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.9, r * 0.42, tilt, Math.PI, Math.PI * 2); ctx.stroke();
    const pg = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
    pg.addColorStop(0, o.c[0]); pg.addColorStop(1, o.c[1]);
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x - r, y - r * 0.35, r * 2, r * 0.18);
    ctx.fillRect(x - r, y + r * 0.2, r * 2, r * 0.12);
    const sh = ctx.createRadialGradient(x + r * 0.6, y + r * 0.6, r * 0.2, x, y, r * 1.3);
    sh.addColorStop(0, 'rgba(20,5,40,0.55)'); sh.addColorStop(1, 'rgba(20,5,40,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,225,190,0.65)';
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.9, r * 0.42, tilt, 0, Math.PI); ctx.stroke();
  }
}

// Çam ağaçları sırası (Karlı Dağ)
function _fbDrawPines(ctx, W, gy, par, SW, hMin, hVar, color, snow, seed) {
  const off = fb.dist * par;
  ctx.fillStyle = color;
  for (let i = Math.floor(off / SW) - 1; i <= Math.ceil((off + W) / SW) + 1; i++) {
    const r1 = _fbRand(i + seed), r2 = _fbRand(i * 1.7 + seed + 5);
    const h = hMin + r2 * hVar, w = h * 0.5;
    const cx = i * SW - off + SW / 2 + (r1 - 0.5) * SW * 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(cx - w * 0.06, gy - h * 0.2, w * 0.12, h * 0.2);
    for (let k = 0; k < 3; k++) {
      const ty = gy - h + k * h * 0.26, tw = w * (0.5 + k * 0.25);
      ctx.beginPath(); ctx.moveTo(cx, ty); ctx.lineTo(cx - tw / 2, ty + h * 0.4); ctx.lineTo(cx + tw / 2, ty + h * 0.4); ctx.closePath(); ctx.fill();
      if (snow) {
        ctx.fillStyle = 'rgba(240,248,255,0.85)';
        ctx.beginPath(); ctx.moveTo(cx, ty); ctx.lineTo(cx - tw * 0.2, ty + h * 0.13); ctx.lineTo(cx + tw * 0.2, ty + h * 0.13); ctx.closePath(); ctx.fill();
        ctx.fillStyle = color;
      }
    }
  }
}

function _fbDrawSea(ctx, W, gy, th) {
  const t = fb.time, d = fb.dist, sy = gy - 50;
  const sg = ctx.createLinearGradient(0, sy, 0, gy);
  sg.addColorStop(0, '#2aa5e8');
  sg.addColorStop(1, '#0b62b0');
  ctx.fillStyle = sg;
  ctx.fillRect(0, sy, W, gy - sy);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(0, sy, W, 1.5);
  // Güneşin denizdeki parıltısı
  if (th.orb) {
    const ox = W * th.orb.x;
    for (let k = 0; k < 7; k++) {
      const a = 0.25 + 0.35 * Math.abs(Math.sin(t * 3 + k * 1.7));
      const w = 26 - k * 2.5;
      ctx.fillStyle = `rgba(255,250,210,${a})`;
      ctx.fillRect(ox - w / 2 + Math.sin(t * 2 + k) * 3, sy + 4 + k * 6, w, 1.6);
    }
  }
  // Yelkenli
  const bx = W + 60 - ((t * 14 + d * 0.06) % (W + 140)), byy = sy + 8 + Math.sin(t * 2) * 1.2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(bx, byy - 22); ctx.lineTo(bx, byy - 2); ctx.lineTo(bx + 14, byy - 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff6b5b';
  ctx.beginPath(); ctx.moveTo(bx - 1, byy - 18); ctx.lineTo(bx - 1, byy - 3); ctx.lineTo(bx - 10, byy - 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#23405e';
  ctx.beginPath(); ctx.moveTo(bx - 13, byy); ctx.lineTo(bx + 17, byy); ctx.lineTo(bx + 12, byy + 5); ctx.lineTo(bx - 9, byy + 5); ctx.closePath(); ctx.fill();
  // Dalgalar
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (let row = 0; row < 4; row++) {
    const y = sy + 12 + row * 10, off = (d * (0.25 + row * 0.1) + t * 8) % 40;
    ctx.strokeStyle = `rgba(255,255,255,${0.4 - row * 0.07})`;
    ctx.beginPath();
    for (let x = -off - 40 + row * 13; x < W + 40; x += 40) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 3, x + 16, y); }
    ctx.stroke();
  }
}

// Gökyüzünün değişmeyen renk geçişi: tema ve boyut değişmedikçe bir kez çizilir
function _fbSkyBase(th, W, gy) {
  const dpr = gameDpr() * (fb.scale || 1);
  const key = `${th.id}|${Math.round(W)}|${gy}|${dpr}`;
  if (fb.skyKey === key && fb.skyCache) return fb.skyCache;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(W * dpr)); c.height = Math.max(1, Math.round(gy * dpr));
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, th.sky[0]);
  sky.addColorStop(0.55, th.sky[1]);
  sky.addColorStop(1, th.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, gy);
  const glow = ctx.createRadialGradient(W * 0.5, gy, 10, W * 0.5, gy, W * 0.95);
  glow.addColorStop(0, th.glow[0]);
  glow.addColorStop(0.5, th.glow[1]);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, gy);
  fb.skyCache = c; fb.skyKey = key;
  return c;
}
// Bulutsu lekesi: renk başına bir kez hazırlanan yumuşak daire
const _fbBlobs = {};
function _fbBlob(color) {
  if (_fbBlobs[color]) return _fbBlobs[color];
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return (_fbBlobs[color] = c);
}

function _fbDrawSky(ctx, W, gy) {
  const th = fb.th || FB_THEMES[0], t = fb.time, d = fb.dist;
  ctx.drawImage(_fbSkyBase(th, W, gy), 0, 0, W, gy);

  // Bulutsu (Uzay)
  if (th.nebula) {
    [[0.3, 0.32, 0.75, 'rgba(140,80,255,0.2)', 0.05], [0.82, 0.62, 0.55, 'rgba(0,200,255,0.12)', 0.07], [0.1, 0.75, 0.45, 'rgba(255,80,200,0.1)', 0.04]]
      .forEach(([nx, ny, nr, c, sp]) => {
        const x = ((nx * W - d * sp) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2, y = ny * gy, r = nr * W;
        ctx.drawImage(_fbBlob(c), x - r, y - r, r * 2, r * 2);
      });
  }

  // Yıldızlar
  const starH = th.stars > 60 ? 0.95 : 0.6;
  for (let i = 0; i < Math.min(th.stars, fb.stars.length); i++) {
    const s = fb.stars[i];
    const x = ((s.x * W - d * 0.02) % W + W) % W;
    ctx.fillStyle = `rgba(255,255,255,${s.a * (0.4 + 0.6 * Math.abs(Math.sin(t * s.sp + s.ph)))})`;
    ctx.fillRect(x - s.r, s.y * gy * starH - s.r, s.r * 2, s.r * 2);
  }

  _fbDrawOrb(ctx, th.orb, W, gy);

  // Bulutlar
  if (th.cloud) {
    const coff = d * 0.18 + t * 6, CW = 210;
    for (let i = Math.floor(coff / CW) - 1; i <= Math.ceil((coff + W) / CW) + 1; i++) {
      const r1 = _fbRand(i + 0.3), r2 = _fbRand(i + 9.1);
      const x = i * CW - coff + r1 * 60, y = 70 + r2 * 210, k = 0.7 + r1 * 0.6;
      ctx.fillStyle = `rgba(${th.cloud},${Math.min(0.9, th.cloudA * (1 + r2))})`;
      [[0, 0, 38, 13], [-22, 4, 24, 10], [24, 3, 26, 11], [4, -8, 22, 12]].forEach(([ox, oy, rx, ry]) => {
        ctx.beginPath(); ctx.ellipse(x + ox * k, y + oy * k, rx * k, ry * k, 0, 0, Math.PI * 2); ctx.fill();
      });
    }
  }

  // Uzak dağlar
  if (th.far) {
    const pts = [];
    for (let x = 0; x <= W + 8; x += 8) {
      const wx = x + d * 0.1;
      pts.push([x, gy - (118 + 34 * Math.sin(wx * 0.009) + 20 * Math.sin(wx * 0.023 + 1.3) + 8 * Math.sin(wx * 0.061))]);
    }
    ctx.beginPath(); ctx.moveTo(0, gy);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(W, gy); ctx.closePath();
    ctx.fillStyle = th.far;
    ctx.fill();
    if (th.farCap) { // karlı zirveler
      ctx.save(); ctx.clip();
      ctx.fillStyle = th.farCap;
      ctx.fillRect(0, 0, W, gy - 142);
      ctx.restore();
    }
    if (th.farLine) { // neon kontur
      ctx.save();
      ctx.strokeStyle = th.farLine;
      ctx.lineWidth = 2;
      ctx.shadowColor = th.farLine;
      ctx.shadowBlur = _gBlur(10);
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.restore();
    }
  }

  // Yakın katman
  if (th.near === 'city') {
    const off = d * 0.3, SW = 44;
    for (let i = Math.floor(off / SW) - 1; i <= Math.ceil((off + W) / SW) + 1; i++) {
      const r1 = _fbRand(i), r2 = _fbRand(i + 77.7);
      const bw = 28 + r1 * 16, bh = 40 + r2 * 85;
      const bx = i * SW - off + (SW - bw) / 2, by = gy - bh;
      ctx.fillStyle = th.nearColor;
      ctx.fillRect(bx, by, bw, bh);
      if (r1 > 0.78) ctx.fillRect(bx + bw / 2 - 1, by - 12, 2, 12);
      for (let row = 0, wy = by + 8; wy < gy - 10; row++, wy += 11) {
        for (let col = 0, wx = bx + 5; wx < bx + bw - 6; col++, wx += 8) {
          const r = _fbRand(i * 131 + row * 17 + col * 3.1);
          if (r > 0.62) {
            ctx.fillStyle = `rgba(${th.win},${r > 0.9 ? 0.75 : 0.3})`;
            ctx.fillRect(wx, wy, 3.5, 5);
          }
        }
      }
    }
  } else if (th.near === 'forest') {
    _fbDrawPines(ctx, W, gy, 0.2, 30, 34, 40, '#2c4c6a', th.snow, 11);
    _fbDrawPines(ctx, W, gy, 0.34, 38, 50, 60, th.nearColor, th.snow, 3);
  } else if (th.near === 'sea') {
    _fbDrawSea(ctx, W, gy, th);
  }
}

function _fbPipeGrad(ctx, x, w) {
  const stops = (fb.th || FB_THEMES[0]).pipe;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  [0, 0.12, 0.32, 0.42, 0.53, 0.8, 1].forEach((o, i) => g.addColorStop(o, stops[i]));
  return g;
}

function _fbDrawCoin(ctx, cx, cy, r, seed) {
  const t = fb.time;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
  halo.addColorStop(0, 'rgba(255,210,63,0.4)');
  halo.addColorStop(1, 'rgba(255,210,63,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2); ctx.fill();

  const w = Math.max(0.16, Math.abs(Math.cos(t * 3.2 + seed)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(w, 1);
  ctx.fillStyle = '#b87400';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  const face = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
  face.addColorStop(0, '#fff6c2'); face.addColorStop(0.5, '#ffd23f'); face.addColorStop(1, '#dc9500');
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(150,90,0,0.35)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke();
  if (w > 0.45) {
    ctx.fillStyle = 'rgba(140,82,0,0.9)';
    ctx.font = `800 ${Math.round(r * 0.95)}px Syne, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('G', 0, r * 0.06);
  }
  ctx.restore();
}

function _fbDrawPipes(ctx, gy) {
  const th = fb.th || FB_THEMES[0];
  const capH = 26;
  for (const p of fb.pipes) {
    const x = p.x, w = FB_PIPE_W, capX = x - 5, capW = w + 10;
    const by = p.gapY + p.gap;
    ctx.fillStyle = _fbPipeGrad(ctx, x, w);
    ctx.fillRect(x, -4, w, p.gapY - capH + 4);
    ctx.fillRect(x, by + capH, w, gy - by - capH);
    // Halka çizgileri
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    for (let yy = p.gapY - capH - 40; yy > -10; yy -= 46) ctx.fillRect(x, yy, w, 3);
    for (let yy = by + capH + 40; yy < gy; yy += 46) ctx.fillRect(x, yy, w, 3);
    // Başlık altındaki gölge
    ctx.fillStyle = 'rgba(0,10,25,0.3)';
    ctx.fillRect(x, p.gapY - capH - 6, w, 6);
    ctx.fillRect(x, by + capH, w, 6);
    // Başlıklar
    ctx.fillStyle = _fbPipeGrad(ctx, capX, capW);
    _fbRRect(ctx, capX, p.gapY - capH, capW, capH, 6); ctx.fill();
    _fbRRect(ctx, capX, by, capW, capH, 6); ctx.fill();
    ctx.strokeStyle = th.pipeLine;
    ctx.lineWidth = 1.5;
    _fbRRect(ctx, capX, p.gapY - capH, capW, capH, 6); ctx.stroke();
    _fbRRect(ctx, capX, by, capW, capH, 6); ctx.stroke();
    // Boşluk kenarındaki parlak çizgi
    ctx.fillStyle = th.pipeEdge;
    ctx.fillRect(capX + 4, p.gapY - 4, capW - 8, 2);
    ctx.fillRect(capX + 4, by + 2, capW - 8, 2);
    if (p.coin) _fbDrawCoin(ctx, x + w / 2, p.gapY + p.gap / 2 + Math.sin(fb.time * 3 + p.seed) * 4, 11, p.seed);
  }
}

function _fbDrawGround(ctx, W, H, gy) {
  const th = fb.th || FB_THEMES[0];
  const g = ctx.createLinearGradient(0, gy, 0, H);
  g.addColorStop(0, th.soil[0]);
  g.addColorStop(1, th.soil[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, gy, W, H - gy);

  if (th.grid) {
    // Neon perspektif ızgara
    const vx = W / 2, Hh = H - gy, phase = (fb.dist % 30) / 30;
    ctx.strokeStyle = 'rgba(255,46,136,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const f = (i + phase) / 8, y = gy + Hh * f * f;
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    const o = fb.dist % 40;
    for (let k = -14; k <= 14; k++) {
      const u = k * 40 - o;
      ctx.moveTo(vx + u * 0.35, gy); ctx.lineTo(vx + u * 2.4, H);
    }
    ctx.stroke();
    const tg = ctx.createLinearGradient(0, 0, W, 0);
    tg.addColorStop(0, th.turf[1]); tg.addColorStop(0.5, th.turf[0]); tg.addColorStop(1, th.turf[1]);
    ctx.save();
    ctx.shadowColor = th.turf[0];
    ctx.shadowBlur = _gBlur(14);
    ctx.fillStyle = tg;
    ctx.fillRect(0, gy, W, 3);
    ctx.restore();
  } else {
    const sh = 14;
    const tg = ctx.createLinearGradient(0, gy, 0, gy + sh);
    tg.addColorStop(0, th.turf[0]);
    tg.addColorStop(1, th.turf[1]);
    ctx.fillStyle = tg;
    ctx.fillRect(0, gy, W, sh);
    if (th.stripe) {
      const off = fb.dist % 22;
      ctx.fillStyle = th.stripe;
      for (let x = -off - 22; x < W + 22; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, gy + sh); ctx.lineTo(x + 10, gy); ctx.lineTo(x + 20, gy); ctx.lineTo(x + 10, gy + sh);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(0, gy, W, 2);
    ctx.fillStyle = 'rgba(0,10,30,0.25)';
    ctx.fillRect(0, gy + sh, W, 4);
    ctx.fillStyle = th.dots || 'rgba(140,180,255,0.08)';
    const off2 = fb.dist % 36;
    for (let x = -off2 - 36; x < W + 36; x += 36) {
      for (let row = 0; row < 3; row++) {
        ctx.beginPath(); ctx.arc(x + (row % 2) * 18, gy + sh + 16 + row * 16, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // Kuşun yerdeki gölgesi
  const b = fb.bird, k = Math.max(0.2, 1 - (gy - b.y) / gy);
  ctx.fillStyle = `rgba(0,10,30,${0.3 * k})`;
  ctx.beginPath(); ctx.ellipse(b.x, gy + 7, 15 * k, 4 * k, 0, 0, Math.PI * 2); ctx.fill();
}

// Kar yağışı (Karlı Dağ)
function _fbDrawSnow(ctx) {
  if (!fb.th?.snow) return;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const f of fb.snow) {
    ctx.globalAlpha = f.a;
    ctx.beginPath(); ctx.arc(f.x + Math.sin(fb.time * 1.3 + f.ph) * 6, f.y, f.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function _fbDrawBird(ctx) {
  const b = fb.bird, dead = fb.mode === 'dying' || fb.mode === 'over';
  const wa = dead ? 0.4 : Math.sin(fb.time * (fb.mode === 'ready' ? 10 : 16 + b.flap * 14));
  _fbDrawBirdAt(ctx, b.x, b.y, b.rot, wa, dead, fb.skin || FB_SKINS[0], fb.time);
}

// Taç (kuş ve yılan ortak): taban cy'de, uçlar -y yönünde
function _gameDrawCrown(ctx, cx, cy, w, h) {
  const g = ctx.createLinearGradient(0, cy - h, 0, cy);
  g.addColorStop(0, '#fff6c2'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#d99400');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  ctx.lineTo(cx - w * 0.56, cy - h);
  ctx.lineTo(cx - w * 0.28, cy - h * 0.5);
  ctx.lineTo(cx, cy - h * 1.12);
  ctx.lineTo(cx + w * 0.28, cy - h * 0.5);
  ctx.lineTo(cx + w * 0.56, cy - h);
  ctx.lineTo(cx + w / 2, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,80,0,0.6)';
  ctx.lineWidth = Math.max(0.8, w * 0.05);
  ctx.stroke();
  ctx.fillStyle = '#ff3b5c';
  ctx.beginPath(); ctx.arc(cx, cy - h * 0.3, w * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3b82f6';
  [-1, 1].forEach(sd => { ctx.beginPath(); ctx.arc(cx + sd * w * 0.3, cy - h * 0.22, w * 0.06, 0, Math.PI * 2); ctx.fill(); });
}

function _fbDrawBirdAt(ctx, x, y, rot, wa, dead, sk, t) {
  const acc = sk.acc || [];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (dead) ctx.filter = 'grayscale(0.7) brightness(0.92)';

  // Ninja bandının uçuşan uçları (gövdenin arkasında)
  if (acc.includes('band')) {
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -9); ctx.quadraticCurveTo(-19, -14, -27, -12 + Math.sin(t * 14) * 3);
    ctx.moveTo(-11, -8); ctx.quadraticCurveTo(-18, -6, -25, -3 + Math.sin(t * 14 + 1.4) * 3);
    ctx.stroke();
  }

  // Kuyruk: tek renk üçgen ya da renkli tüy yelpazesi
  if (sk.tail.length === 1) {
    ctx.fillStyle = sk.tail[0];
    ctx.beginPath(); ctx.moveTo(-13, -1); ctx.lineTo(-25, -9); ctx.lineTo(-22, 0); ctx.lineTo(-25, 8); ctx.closePath(); ctx.fill();
  } else {
    const n = sk.tail.length;
    sk.tail.forEach((c, i) => {
      const yy = -9 + (i / (n - 1)) * 17;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(-12, -2 + i * 1.2); ctx.lineTo(-28, yy - 2.5); ctx.lineTo(-27, yy + 2.5); ctx.closePath(); ctx.fill();
    });
  }

  // Perçem
  if (sk.tuft) {
    ctx.fillStyle = sk.tuft;
    ctx.beginPath();
    if (sk.tuftBig) { ctx.moveTo(-6, -12); ctx.quadraticCurveTo(-4, -27, 5, -29); ctx.quadraticCurveTo(2, -21, 8, -13); }
    else { ctx.moveTo(-2, -14); ctx.quadraticCurveTo(0, -24, 6, -22); ctx.quadraticCurveTo(3, -17, 4, -14); }
    ctx.closePath(); ctx.fill();
  }

  // Gövde
  const bg = ctx.createRadialGradient(-5, -7, 2, 0, 0, 20);
  bg.addColorStop(0, sk.body[0]);
  bg.addColorStop(0.45, sk.body[1]);
  bg.addColorStop(1, sk.body[2]);
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = sk.line;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  if (sk.visor) { // robot perçinleri
    ctx.fillStyle = 'rgba(60,70,95,0.55)';
    [[-9, -6], [-11, 3], [-5, 10]].forEach(([bx, by]) => { ctx.beginPath(); ctx.arc(bx, by, 1.3, 0, Math.PI * 2); ctx.fill(); });
  }
  ctx.fillStyle = sk.belly;
  ctx.beginPath();
  if (sk.bellyBig) ctx.ellipse(4, 4, 11.5, 9.5, 0, 0, Math.PI * 2);
  else ctx.ellipse(2, 7, 10, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (sk.cheek) {
    ctx.fillStyle = sk.cheek;
    ctx.beginPath(); ctx.arc(5, 3, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Ninja bandı (gövdeye sarılı)
  if (acc.includes('band')) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 15, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-20, -12.5, 40, 5.5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-20, -12.5, 40, 1.2);
    ctx.restore();
    ctx.fillStyle = '#be123c';
    ctx.beginPath(); ctx.arc(-12, -9.5, 2.6, 0, Math.PI * 2); ctx.fill();
  }

  // Kardinal maskesi
  if (sk.mask) {
    ctx.fillStyle = '#1a0a0e';
    ctx.beginPath(); ctx.ellipse(12, -1, 7.5, 6.5, 0.2, 0, Math.PI * 2); ctx.fill();
  }

  // Göz / vizör
  if (sk.visor) {
    ctx.fillStyle = '#0b1220';
    _fbRRect(ctx, 1, -11, 15, 9, 3.5); ctx.fill();
    ctx.save();
    ctx.fillStyle = dead ? '#64748b' : '#22e5ff';
    ctx.shadowColor = '#22e5ff';
    ctx.shadowBlur = _gBlur(dead ? 0 : 8);
    const blink = !dead && (t % 3) < 0.12;
    _fbRRect(ctx, 3.5, blink ? -6.8 : -8.2, 10, blink ? 1 : 3.4, 1.5); ctx.fill();
    ctx.restore();
  } else if (dead) {
    ctx.strokeStyle = '#061127';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(5, -8); ctx.lineTo(11, -2);
    ctx.moveTo(11, -8); ctx.lineTo(5, -2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(8, -5, 6.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#061127';
    ctx.beginPath(); ctx.arc(9.8, -4.6, 3.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(11, -6.4, 1.25, 0, Math.PI * 2); ctx.fill();
  }

  // Güneş gözlüğü
  if (acc.includes('shades')) {
    ctx.strokeStyle = '#0a0c14';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(3, -6); ctx.lineTo(-11, -7); ctx.stroke();
    const lg = ctx.createLinearGradient(3, -10, 15, -1);
    lg.addColorStop(0, '#1f2a44'); lg.addColorStop(1, '#05070d');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.ellipse(9.5, -5.5, 7.8, 5.6, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(6, -8.5); ctx.lineTo(10, -8.8); ctx.stroke();
  }

  // Gaga
  ctx.fillStyle = sk.beak[0];
  ctx.beginPath(); ctx.moveTo(13, -2); ctx.quadraticCurveTo(24, -1, 26, 2); ctx.quadraticCurveTo(20, 3.5, 13, 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = sk.beak[1];
  ctx.beginPath(); ctx.moveTo(13, 3); ctx.quadraticCurveTo(21, 3.6, 23, 5); ctx.quadraticCurveTo(18, 8, 13, 7); ctx.closePath(); ctx.fill();

  // Papyon
  if (acc.includes('bowtie')) {
    ctx.fillStyle = '#ff3b5c';
    ctx.beginPath(); ctx.moveTo(9, 11); ctx.lineTo(2, 7); ctx.lineTo(3, 15); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, 11); ctx.lineTo(16, 7); ctx.lineTo(15, 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c81e40';
    ctx.beginPath(); ctx.arc(9, 11, 2.2, 0, Math.PI * 2); ctx.fill();
  }

  // Kanat (omuzdan döner)
  ctx.save();
  ctx.translate(-3, 2);
  ctx.rotate(-0.25 + wa * 0.55);
  const wg = ctx.createLinearGradient(-15, -6, -15, 6);
  wg.addColorStop(0, sk.wing[0]);
  wg.addColorStop(1, sk.wing[1]);
  ctx.fillStyle = wg;
  ctx.beginPath(); ctx.ellipse(-5, 0, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = sk.wingLine;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-12, 1); ctx.lineTo(-2, 1); ctx.stroke();
  ctx.restore();

  // Baş aksesuarları
  if (acc.includes('crown')) _gameDrawCrown(ctx, 2, -12.5, 17, 11);
  if (acc.includes('horn')) {
    const hg = ctx.createLinearGradient(4, -13, 10, -32);
    hg.addColorStop(0, '#ffd23f'); hg.addColorStop(1, '#fffbe6');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(1, -12); ctx.lineTo(8, -13.5); ctx.lineTo(8.5, -32); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,140,0,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2.5, -16); ctx.lineTo(7.8, -17.5);
    ctx.moveTo(4, -21); ctx.lineTo(8, -22.3);
    ctx.moveTo(5.6, -26); ctx.lineTo(8.2, -27);
    ctx.stroke();
  }
  if (acc.includes('antenna')) {
    ctx.strokeStyle = '#7d8aa3';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-3, -25); ctx.stroke();
    const on = Math.sin(t * 6) > 0;
    ctx.save();
    ctx.fillStyle = on && !dead ? '#ff3b5c' : '#7a1a2a';
    ctx.shadowColor = '#ff3b5c';
    ctx.shadowBlur = _gBlur(on && !dead ? 10 : 0);
    ctx.beginPath(); ctx.arc(-3, -26.5, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function _fbDraw() {
  const canvas = document.getElementById('fb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = fb.w, H = FB_WORLD_H, gy = H - FB_GROUND;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (fb.shake > 0) ctx.translate((Math.random() - 0.5) * fb.shake, (Math.random() - 0.5) * fb.shake);

  _fbDrawSky(ctx, W, gy);
  _fbDrawPipes(ctx, gy);
  _fbDrawGround(ctx, W, H, gy);
  _fbDrawBird(ctx);
  _fbDrawSnow(ctx);

  fb.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
    ctx.fillStyle = p.color;
    if (p.feather) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.8, p.size * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  fb.floats.forEach(f => {
    const k = f.life / f.max;
    ctx.globalAlpha = 1 - k * k;
    ctx.font = `800 ${f.size}px Syne, sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(4,12,32,0.6)';
    ctx.strokeText(f.text, f.x, f.y - k * 40);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - k * 40);
  });
  ctx.globalAlpha = 1;

  // Büyük engel sayacı
  if (fb.mode !== 'ready') {
    const s = 1 + fb.bump * 0.25;
    ctx.save();
    ctx.translate(W / 2, 74);
    ctx.scale(s, s);
    ctx.font = '800 56px Syne, sans-serif';
    ctx.lineWidth = 9;
    ctx.strokeStyle = 'rgba(4,12,32,0.55)';
    ctx.strokeText(fb.score, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillText(fb.score, 0, 0);
    ctx.restore();
  }

  if (fb.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${fb.flash * 0.22})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* ── Duraklatma / bitiş ── */
function _fbSetPauseIcon(paused) {
  const btn = document.getElementById('fb-pause-btn');
  if (!btn) return;
  btn.innerHTML = paused
    ? '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" class="fill"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';
  btn.setAttribute('aria-label', paused ? 'Devam et' : 'Duraklat');
}

function fbTogglePause(force) {
  if (fb.mode !== 'play') return;
  // Geri sayım sırasında basılırsa tekrar duraklat
  const pause = typeof force === 'boolean' ? force : (!fb.paused || fb.resuming);
  const msg = document.getElementById('fb-msg');
  clearTimeout(fb.cdTimer);
  fb.resuming = false;
  _fbSetPauseIcon(pause);
  if (pause) {
    fb.paused = true;
    msg.innerHTML = `<div class="snake-card fb-card">
        <span class="sg-card-kicker">DURAKLATILDI</span>
        <div class="st-card-score">${fb.pts.toLocaleString('tr')}</div>
        <p>${fb.score} engel · ${fb.coins} coin</p>
        <div class="snake-card-actions">
          <button class="sg-play fb-play" onclick="fbTogglePause(false)"><span class="sg-play-ic">▶</span><span>Devam et</span></button>
          <button class="snake-ghost-btn" onclick="fbQuit(true)">Bitir ve coinleri al</button>
        </div>
      </div>`;
    msg.classList.add('show');
  } else {
    fb.resuming = true;
    fb.bird.vy = 0;
    _fbCountdown(3);
  }
}

function _fbCountdown(n) {
  const msg = document.getElementById('fb-msg');
  if (n <= 0) {
    fb.resuming = false;
    fb.paused = false;
    fb.last = 0;
    msg.classList.remove('show');
    return;
  }
  msg.innerHTML = `<div class="snake-count fb-count">${n}</div>`;
  msg.classList.add('show');
  fb.cdTimer = setTimeout(() => _fbCountdown(n - 1), 600);
}

function _fbShowOver() {
  const msg = document.getElementById('fb-msg');
  if (!msg || fb.mode !== 'over') return;
  const best = _fbGet('best', 0);
  const medal = _fbMedal(fb.score);
  msg.innerHTML = _gameOverCardHtml({
    cls: 'g-card-fb', isBest: fb.isBest, pts: fb.pts,
    line: fb.score ? `${fb.score} engel geçtin${fb.perfects ? `, ${fb.perfects} Perfect yaptın` : ''}${medal ? ` · ${medal.name} madalya` : ''}!` : 'Bu sefer engel geçemedin, bir daha dene!',
    stats: [
      { v: fb.coins, l: 'Coin', coin: true },
      { v: _fbGet('bestScore', 0).toLocaleString('tr'), l: 'Rekor' },
      { v: fb.perfects, l: 'Perfect' }
    ],
    awardId: 'fb-award-msg',
    awardText: fb.coins > 0 ? 'Coinler hesabına ekleniyor…' : '',
    actions: (fbHeartsLeft() > 0
      ? `<button class="sg-play fb-play" onclick="fbRestart()"><span class="sg-play-ic">↻</span><span>Yeniden oyna</span>${FB_UNLIMITED_HEARTS ? '' : `<span class="sg-play-cost">−1 ${SNAKE_HEART_SVG}</span>`}</button>`
      : '<small class="sg-card-note">Bugünlük canların bitti. Yarın görüşürüz!</small>')
      + '<button class="snake-ghost-btn" onclick="fbClose()">Kapat</button>'
  });
  msg.classList.add('show');
  fb.cardAt = performance.now();
  if (fb.awardText) { const p = document.getElementById('fb-award-msg'); if (p) p.innerHTML = fb.awardText; }
}

async function _fbAward(earned) {
  fb.awardText = null;
  const daily = _fbDaily();
  daily.earned += earned;
  _fbSet('daily', daily);
  fbRenderLobby();
  const setMsg = html => {
    fb.awardText = html;
    const p = document.getElementById('fb-award-msg');
    if (p) p.innerHTML = html;
  };
  if (earned <= 0 || !state.user?.id) return;
  try {
    // Başka cihazdan değişmiş olabilir: güncel bakiyenin üzerine ekle
    let current = Number(state.user.coin || 0);
    try { const st = await sbGetStats(state.user.id); current = Number(st?.coin ?? current); } catch {}
    const newCoin = current + earned;
    await sbUpdateStats(state.user.id, { coin: newCoin });
    state.user.coin = newCoin;
    refreshCoinDisplays();
    if (typeof updateRewardsAvailability === 'function') updateRewardsAvailability();
    setMsg(`<b>+${earned} coin</b> hesabına eklendi!`);
    sbAddNotification(state.user.id, 'Flappy Genco 🐤', `Flappy Genco'da ${earned} coin topladın, hesabına eklendi!`, 'flappy_reward').catch(() => {});
    showToast(`Flappy Genco: +${earned} coin hesabına eklendi`);
  } catch (e) {
    console.error('Flappy Genco ödülü kaydedilemedi:', e);
    setMsg('Coin kaydedilemedi, bağlantını kontrol et.');
    showToast('Hata: coin hesabına eklenemedi');
  }
}

function fbRestart() {
  if (performance.now() - fb.cardAt < 450) return; // telaşlı dokunuşla yanlışlıkla başlamasın
  if (!_fbUseHeart()) return;
  _fbReset();
}

function fbClose() {
  clearTimeout(fb.cdTimer);
  clearTimeout(fb.endTimer);
  cancelAnimationFrame(fb.raf);
  fb.mode = 'idle';
  fb.paused = false;
  fb.resuming = false;
  const overlay = document.getElementById('fb-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('snake-lock');
  document.getElementById('fb-msg').classList.remove('show');
  fbRenderLobby();
}

function fbQuit(skipConfirm) {
  if (fb.mode === 'play') {
    if (!skipConfirm && !confirm('Oyundan çıkılsın mı? Şu ana kadar topladığın coinler hesabına eklenecek.')) return;
    _fbFinish();
  }
  fbClose();
}

(function initFlappyControls() {
  const overlay = document.getElementById('fb-overlay');
  if (!overlay) return;

  overlay.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    fbFlap();
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      if (!e.repeat) fbFlap();
    } else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); fbTogglePause(); }
    else if (e.key === 'Escape') fbQuit();
  });

  window.addEventListener('resize', () => { if (overlay.classList.contains('open')) fbResize(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && fb.mode === 'play' && !fb.paused) fbTogglePause(true);
  });
})();


/* ─── MİNİ OYUN: KİM GENCO OLMAK İSTER (Kazanımlar) ───
   Haftalık KGOİ sayfasından bağımsız. Her doğru 1 coin, turda 2 yanlış hakkı,
   24 saatlik pencerede 2 tur. Sorular KGOİ havuzu + aşağıdaki ek havuzdan
   her turda rastgele seçilir. */
const GQ_MAX_ROUNDS = 2;
const GQ_UNLIMITED_ROUNDS = true; // true: tur hakkı düşmez (şimdilik sınırsız)
const GQ_MAX_WRONG = 2;
const GQ_COIN_PER_CORRECT = 1;
const GQ_QUESTIONS_PER_ROUND = 15;
const GQ_TIME_PER_QUESTION = 20; // saniye
const GQ_WINDOW_MS = 24 * 60 * 60 * 1000;
// Herkesin tur haklarını geri vermek için bu değeri yeni bir şeyle değiştirmek
// yeterli: her kullanıcının kayıtlı turları, yeni değeri ilk gördüğünde bir kez silinir.
const GQ_ROUNDS_RESET_ID = '2026-09-28';

const GQ_EXTRA_POOL = [
  { q: 'Türkiye Cumhuriyeti hangi yıl ilan edildi?', options: ['1920', '1923', '1919', '1938'], correct: 1 },
  { q: 'Suyun kimyasal formülü nedir?', options: ['CO2', 'H2O', 'O2', 'NaCl'], correct: 1 },
  { q: 'Işığın boşluktaki hızı saniyede yaklaşık kaç km\'dir?', options: ['30.000', '300.000', '3.000', '3.000.000'], correct: 1 },
  { q: 'Dünyanın en büyük okyanusu hangisidir?', options: ['Atlas Okyanusu', 'Hint Okyanusu', 'Büyük Okyanus (Pasifik)', 'Arktik Okyanusu'], correct: 2 },
  { q: 'İstanbul hangi yıl fethedildi?', options: ['1071', '1299', '1453', '1517'], correct: 2 },
  { q: 'Mona Lisa tablosu hangi ressama aittir?', options: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Michelangelo'], correct: 2 },
  { q: 'Bir futbol maçının normal süresi kaç dakikadır?', options: ['60', '80', '90', '120'], correct: 2 },
  { q: 'Türkiye\'nin en yüksek dağı hangisidir?', options: ['Erciyes', 'Ağrı Dağı', 'Uludağ', 'Kaçkar'], correct: 1 },
  { q: 'Türkiye kaç coğrafi bölgeye ayrılır?', options: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Alanya hangi denizin kıyısındadır?', options: ['Karadeniz', 'Ege Denizi', 'Marmara Denizi', 'Akdeniz'], correct: 3 },
  { q: 'Kırmızı ile sarı karıştırılınca hangi renk elde edilir?', options: ['Yeşil', 'Mor', 'Turuncu', 'Kahverengi'], correct: 2 },
  { q: 'Bir saatte kaç saniye vardır?', options: ['360', '600', '3600', '6000'], correct: 2 },
  { q: 'Periyodik tabloda "O" sembolü hangi elementtir?', options: ['Altın', 'Oksijen', 'Osmiyum', 'Ozon'], correct: 1 },
  { q: 'İstiklal Marşı\'nın şairi kimdir?', options: ['Namık Kemal', 'Mehmet Akif Ersoy', 'Ziya Gökalp', 'Yahya Kemal'], correct: 1 },
  { q: '"Kızıl Gezegen" olarak bilinen gezegen hangisidir?', options: ['Venüs', 'Jüpiter', 'Mars', 'Merkür'], correct: 2 },
  { q: 'Artık yıllarda şubat ayı kaç gün çeker?', options: ['28', '29', '30', '31'], correct: 1 },
  { q: 'Olimpiyat bayrağında kaç halka vardır?', options: ['4', '5', '6', '7'], correct: 1 },
  { q: 'Basketbolda bir takım sahada kaç oyuncuyla oynar?', options: ['5', '6', '7', '11'], correct: 0 },
  { q: 'Türkiye\'nin en kalabalık şehri hangisidir?', options: ['Ankara', 'İzmir', 'İstanbul', 'Antalya'], correct: 2 },
  { q: '"Nutuk" adlı eser kime aittir?', options: ['İsmet İnönü', 'Mustafa Kemal Atatürk', 'Kazım Karabekir', 'Fevzi Çakmak'], correct: 1 },
  { q: '12 × 12 kaçtır?', options: ['124', '132', '144', '156'], correct: 2 },
  { q: 'Pi (π) sayısının yaklaşık değeri nedir?', options: ['2,71', '3,14', '1,61', '4,13'], correct: 1 },
  { q: 'Dünya, Güneş etrafındaki turunu yaklaşık kaç günde tamamlar?', options: ['30', '180', '365', '730'], correct: 2 },
  { q: 'Aşağıdakilerden hangisi bir memelidir?', options: ['Köpekbalığı', 'Yunus', 'Ahtapot', 'Kaplumbağa'], correct: 1 },
  { q: 'Kapadokya en çok hangi doğal oluşumlarıyla ünlüdür?', options: ['Travertenler', 'Peri bacaları', 'Buzullar', 'Mercan resifleri'], correct: 1 },
  { q: 'Damlataş Mağarası hangi ilçededir?', options: ['Kemer', 'Kaş', 'Alanya', 'Side'], correct: 2 },
  { q: 'Gökkuşağında geleneksel olarak kaç renk sayılır?', options: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Su deniz seviyesinde kaç °C\'de kaynar?', options: ['90', '100', '110', '120'], correct: 1 },
  { q: 'Kalbin temel görevi nedir?', options: ['Sindirim yapmak', 'Kanı pompalamak', 'Oksijen üretmek', 'Hormon depolamak'], correct: 1 },
  { q: 'Empati nedir?', options: ['Her konuda haklı olmak', 'Kendini başkasının yerine koyabilmek', 'İnsanları eleştirmek', 'Kendi fikrini kabul ettirmek'], correct: 1 },
  { q: 'Osmanlı Devleti\'nin kurucusu kimdir?', options: ['Fatih Sultan Mehmet', 'Osman Gazi', 'Kanuni Sultan Süleyman', 'Yıldırım Bayezid'], correct: 1 },
  { q: 'Bir hedefe ulaşmada hangisi daha sürdürülebilirdir?', options: ['Bir günde çok çalışmak', 'Düzenli olarak küçük adımlar atmak', 'Hiç plan yapmamak', 'Sadece motivasyon beklemek'], correct: 1 },
  { q: 'Alanya\'nın eski adı olarak bilinen "Korakesion" hangi döneme kadar uzanır?', options: ['Antik dönem', 'Cumhuriyet dönemi', 'Osmanlı\'nın son dönemi', 'Selçuklu sonrası'], correct: 0 },
  { q: 'Mütekabiliyetin bozulduğu İstanbul Antlaşması kaç yılında imzalanmıştır?', options: ['1533', '1609', '1683', '1389'], correct: 0 },
  { q: 'Kitap okumak öncelikle hangi becerinin gelişmesine katkı sağlar?', options: ['Refleks', 'Bilgi ve düşünme becerisi', 'Mimikler', 'Fazla düşünme'], correct: 1 },
  { q: 'Selçuklu Sultanı Alaeddin Keykubad döneminde Alanya\'nın adı neydi?', options: ['Antalya', 'Alaiye', 'Korakesion', 'Selçukiye'], correct: 1 },
  { q: 'Mustafa Kemal Atatürk\'ün Samsun\'a çıkış tarihi hangisidir?', options: ['23 Nisan 1920', '19 Mayıs 1919', '29 Ekim 1923', '30 Ağustos 1922'], correct: 1 },
  { q: 'Alanya\'daki tarihi tersane hangi dönemde inşa edilmiştir?', options: ['Roma', 'Osmanlı', 'Selçuklu', 'Cumhuriyet'], correct: 2 },
  { q: 'Türkiye\'de en uzun kıyı şeridine sahip deniz hangisidir?', options: ['Karadeniz', 'Akdeniz', 'Marmara', 'Ege'], correct: 3 },
  { q: 'Alanya\'nın göz bebeği Kızıl Kule\'nin temel kullanım amacı nedir?', options: ['Hastane', 'Saray', 'Hapishane', 'Savunma ve liman kontrolü'], correct: 3 },
  { q: 'Osmanlı\'nın Fetret Devri kaç yıl sürmüştür?', options: ['11', '12', '9', '17'], correct: 0 },
  { q: 'Cumhuriyet Bayramı hangi tarihte kutlanır?', options: ['19 Mayıs', '30 Ağustos', '29 Ekim', '23 Nisan'], correct: 2 },
  { q: 'Damlataş Mağarası hangi rahatsızlığa iyi gelir?', options: ['Astım', 'Reflü', 'Su çiçeği', 'Guatr'], correct: 0 },
  { q: 'Damlataş Mağarası\'nın oluşumundaki en önemli doğal etken hangisidir?', options: ['Rüzgar', 'Kar', 'Su', 'Tektonik hareketler'], correct: 2 },
  { q: 'Türkiye hangi iki kıta üzerinde topraklara sahiptir?', options: ['Avrupa - Afrika', 'Asya - Afrika', 'Asya - Avrupa', 'Avrupa - Amerika'], correct: 2 },
  { q: 'Bir şeyi gerçekten öğrenmenin en etkili yollarından biri hangisidir?', options: ['Ezberlemek', 'Bir kez okumak', 'Başkasının yapmasını izlemek', 'Öğrendiğini uygulamak'], correct: 3 },
  { q: 'Sence bir insanı Genco yapan en önemli özellik hangisidir?', options: ['En çok takipçiye sahip olmak', 'En çok kahveyi içen olmak', 'Her zaman haklı olmak', 'Kendini geliştirmek ve çevreye katkıda bulunmak'], correct: 3 },
  { q: 'Osmanlı Devleti boyunca İstanbul kaç kez kuşatılmıştır?', options: ['5', '4', '3', '7'], correct: 0 },
  { q: 'Alanya\'nın tarihi dokusunda Roma, Bizans ve Selçuklu gibi medeniyetlerin izlerinin bulunması bize neyi gösterir?', options: ['Bölgenin tarih boyunca önemli olduğunu', 'Şehrin yeni olduğunu', 'Bölgenin hiç yerleşim görmediğini', 'Sadece tek bir kültürün yaşadığını'], correct: 0 },
  { q: 'İstanbul\'un fethedilmeden önceki ismi nedir?', options: ['Konstantinopolis', 'Korakesion', 'İskenderiye', 'Kitroniye'], correct: 0 },
];

const gq = {
  active: false, runId: 0, questions: [], idx: 0,
  correct: 0, wrong: 0, earned: 0, locked: false,
  tick: null, endAt: 0, history: []
};

function _gqKey(name) { return `genco_quiz_${name}_${state.user?.id || 'guest'}`; }
function _gqGet(name, fallback) {
  try { const v = JSON.parse(localStorage.getItem(_gqKey(name))); return v ?? fallback; } catch { return fallback; }
}
function _gqSet(name, value) {
  try { localStorage.setItem(_gqKey(name), JSON.stringify(value)); } catch {}
}
function _gqRecentRounds() {
  if (_gqGet('reset', null) !== GQ_ROUNDS_RESET_ID) {
    _gqSet('rounds', []);
    _gqSet('reset', GQ_ROUNDS_RESET_ID);
  }
  const now = Date.now();
  return (_gqGet('rounds', []) || []).filter(r => r && now - r.t < GQ_WINDOW_MS);
}
function gqRoundsLeft() { if (GQ_UNLIMITED_ROUNDS) return GQ_MAX_ROUNDS; return Math.max(0, GQ_MAX_ROUNDS - _gqRecentRounds().length); }
function _gqNextResetText() {
  const rounds = _gqRecentRounds();
  if (!rounds.length) return '24 saatte yenilenir';
  const next = Math.min(...rounds.map(r => r.t)) + GQ_WINDOW_MS;
  const mins = Math.max(0, Math.ceil((next - Date.now()) / 60000));
  return `↻ ${Math.floor(mins / 60)}s ${mins % 60}dk`;
}

function gqRenderLobby() {
  const left = gqRoundsLeft();
  const rounds = _gqRecentRounds();
  const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
  set('gq-round-pills', el => {
    el.innerHTML = Array.from({ length: GQ_MAX_ROUNDS }, (_, i) =>
      `<span class="gq-pill ${i < left ? 'on' : 'off'}"><b>${i + 1}</b>. tur</span>`).join('');
  });
  set('gq-rounds-note', el => {
    el.textContent = left > 0
      ? `${left} tur hakkın var · her turda ${GQ_MAX_WRONG} yanlış hakkı`
      : 'Tur hakların bitti, süre dolunca yenilenecek.';
  });
  set('gq-reset-in', el => { el.textContent = _gqNextResetText(); });
  set('gq-best', el => { el.textContent = _gqGet('best', 0); });
  set('gq-earned', el => { el.textContent = rounds.reduce((s, r) => s + (r.earned || 0), 0); });
  set('gq-play-btn', el => {
    el.disabled = left <= 0;
    el.innerHTML = left > 0
      ? `<span class="sg-play-ic">▶</span><span>Yarışmaya başla</span><span class="sg-play-cost">${left}/${GQ_MAX_ROUNDS} tur</span>`
      : `<span>Yenilenme: ${_gqNextResetText().replace('↻ ', '')}</span>`;
  });
  document.querySelectorAll('.gq-rule-heart').forEach(el => { el.innerHTML = SNAKE_HEART_SVG; });
  kzRefreshNav();
}

function _gqBuildQuestions() {
  const pool = [...KGOI_QUESTION_POOL, ...GQ_EXTRA_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, GQ_QUESTIONS_PER_ROUND).map(item => {
    const order = item.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { q: item.q, options: order.map(i => item.options[i]), correct: order.indexOf(item.correct) };
  });
}

function gqStart() {
  if (gq.active) return;
  if (!state.user?.id) { showToast('Oynamak için giriş yapman gerek'); return; }
  if (gqRoundsLeft() <= 0) { gqRenderLobby(); showToast('Tur hakların bitti, 24 saat dolunca yenilenecek'); return; }

  // Tur, başladığı anda hak olarak düşer
  const rounds = _gqRecentRounds();
  rounds.push({ t: Date.now(), earned: 0 });
  _gqSet('rounds', rounds);
  gqRenderLobby();

  Object.assign(gq, {
    active: true, runId: gq.runId + 1, questions: _gqBuildQuestions(), idx: 0,
    correct: 0, wrong: 0, earned: 0, locked: false, history: []
  });
  const overlay = document.getElementById('gq-overlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('snake-lock');
  _gqUpdateScore(false);
  _gqRenderQuestion();
}

function _gqUpdateScore(bump) {
  const el = document.getElementById('gq-score');
  if (!el) return;
  el.textContent = gq.earned;
  if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}

function _gqLivesHtml() {
  const left = GQ_MAX_WRONG - gq.wrong;
  return Array.from({ length: GQ_MAX_WRONG }, (_, i) =>
    `<span class="snake-heart ${i < left ? 'full' : 'empty'}">${SNAKE_HEART_SVG}</span>`).join('');
}

function _gqRenderQuestion() {
  const stage = document.getElementById('gq-stage');
  const q = gq.questions[gq.idx];
  const total = gq.questions.length;
  const letters = ['A', 'B', 'C', 'D'];
  document.getElementById('gq-qcount').innerHTML = `<b>${gq.idx + 1}</b>/${total}`;
  const C = 2 * Math.PI * 22;
  stage.innerHTML = `
    <div class="gq-status">
      <div class="snake-hearts gq-lives" id="gq-lives">${_gqLivesHtml()}</div>
      <div class="gq-timer" id="gq-timer">
        <svg viewBox="0 0 52 52"><circle class="gq-timer-bg" cx="26" cy="26" r="22"/><circle class="gq-timer-fg" id="gq-timer-fg" cx="26" cy="26" r="22" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
        <span id="gq-time">${GQ_TIME_PER_QUESTION}</span>
      </div>
    </div>
    <div class="gq-ladder">
      ${gq.questions.map((_, i) => {
        const h = gq.history[i];
        return `<span class="gq-step ${h === true ? 'ok' : h === false ? 'bad' : ''} ${i === gq.idx ? 'now' : ''}"></span>`;
      }).join('')}
    </div>
    <div class="gq-question" key="${gq.idx}">
      <span class="gq-q-kicker">SORU ${gq.idx + 1} · <b>+${GQ_COIN_PER_CORRECT} coin</b></span>
      <p>${escHtml(q.q)}</p>
    </div>
    <div class="gq-options" id="gq-options">
      ${q.options.map((opt, i) => `
        <button class="gq-opt" style="--d:${i * 60}ms" onclick="gqAnswer(${i})">
          <span class="gq-opt-key"><i>${letters[i]}</i></span>
          <span class="gq-opt-text">${escHtml(opt)}</span>
        </button>`).join('')}
    </div>`;
  gq.locked = false;
  _gqStartTimer();
}

function _gqStartTimer() {
  clearInterval(gq.tick);
  gq.endAt = Date.now() + GQ_TIME_PER_QUESTION * 1000;
  const C = 2 * Math.PI * 22;
  const run = gq.runId;
  gq.tick = setInterval(() => {
    if (!gq.active || gq.runId !== run || gq.locked) { clearInterval(gq.tick); return; }
    const leftMs = Math.max(0, gq.endAt - Date.now());
    const fg = document.getElementById('gq-timer-fg');
    const txt = document.getElementById('gq-time');
    const timer = document.getElementById('gq-timer');
    if (fg) fg.style.strokeDashoffset = String(C * (1 - leftMs / (GQ_TIME_PER_QUESTION * 1000)));
    if (txt) txt.textContent = Math.ceil(leftMs / 1000);
    if (timer) timer.classList.toggle('danger', leftMs <= 5000);
    if (leftMs <= 0) { clearInterval(gq.tick); gqAnswer(-1); }
  }, 100);
}

function gqAnswer(i) {
  if (!gq.active || gq.locked) return;
  gq.locked = true;
  clearInterval(gq.tick);
  const run = gq.runId;
  const q = gq.questions[gq.idx];
  const opts = document.querySelectorAll('#gq-options .gq-opt');
  opts.forEach(b => { b.disabled = true; });
  if (i >= 0) opts[i].classList.add('picked');
  else document.getElementById('gq-timer')?.classList.add('timeout');

  setTimeout(() => {
    if (!gq.active || gq.runId !== run) return;
    const ok = i === q.correct;
    opts.forEach((b, k) => {
      b.classList.remove('picked');
      if (k === q.correct) b.classList.add('correct');
      else if (k === i) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    gq.history[gq.idx] = ok;
    if (ok) {
      gq.correct += 1;
      gq.earned += GQ_COIN_PER_CORRECT;
      _gqUpdateScore(true);
      _gqFloat(`+${GQ_COIN_PER_CORRECT}`, opts[i]);
      if (navigator.vibrate) try { navigator.vibrate(15); } catch {}
    } else {
      gq.wrong += 1;
      const lives = document.getElementById('gq-lives');
      if (lives) {
        lives.innerHTML = _gqLivesHtml();
        const lost = lives.children[GQ_MAX_WRONG - gq.wrong];
        if (lost) lost.classList.add('lost');
      }
      document.getElementById('gq-stage')?.classList.add('shake');
      setTimeout(() => document.getElementById('gq-stage')?.classList.remove('shake'), 450);
      if (navigator.vibrate) try { navigator.vibrate([50, 30, 50]); } catch {}
    }

    setTimeout(() => {
      if (!gq.active || gq.runId !== run) return;
      if (gq.wrong >= GQ_MAX_WRONG || gq.idx + 1 >= gq.questions.length) _gqEnd();
      else { gq.idx += 1; _gqRenderQuestion(); }
    }, 1500);
  }, 750);
}

function _gqFloat(text, anchor) {
  const overlay = document.getElementById('gq-overlay');
  if (!overlay || !anchor) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'gq-float';
  el.innerHTML = `<span class="snake-score-coin">G</span>${text}`;
  el.style.left = (r.right - 70) + 'px';
  el.style.top = (r.top + r.height / 2 - 16) + 'px';
  overlay.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function _gqEnd() {
  if (!gq.active) return;
  gq.active = false;
  clearInterval(gq.tick);
  const earned = gq.earned;
  const answered = gq.history.filter(h => h !== undefined).length;
  const isBest = gq.correct > _gqGet('best', 0);
  if (isBest) _gqSet('best', gq.correct);

  // Bu turun kazancını en son başlatılan tura yaz
  const rounds = _gqRecentRounds();
  if (rounds.length) rounds[rounds.length - 1].earned = earned;
  _gqSet('rounds', rounds);
  gqRenderLobby();

  const left = gqRoundsLeft();
  const finished = gq.wrong < GQ_MAX_WRONG && answered >= gq.questions.length;
  const title = finished ? 'Tebrikler, turu tamamladın!' : (gq.correct >= 8 ? 'Harika bir tur!' : 'Tur bitti');
  const emoji = finished ? '👑' : gq.correct >= 5 ? '🔥' : '💡';
  const stage = document.getElementById('gq-stage');
  stage.innerHTML = `
    <div class="snake-card gq-end">
      <div class="gq-end-emoji">${emoji}</div>
      <span class="sg-card-kicker">${finished ? 'TUR TAMAMLANDI' : 'TUR BİTTİ'}</span>
      <h3>${title}</h3>
      ${isBest && gq.correct > 0 ? '<span class="snake-best-tag">★ YENİ REKOR</span>' : ''}
      <div class="sg-card-score"><span class="snake-score-coin">G</span>${earned}</div>
      <p id="gq-award-msg">${earned > 0 ? 'Coinler hesabına ekleniyor…' : 'Bu turda coin kazanamadın.'}</p>
      <div class="gq-end-stats">
        <div><b class="ok">${gq.correct}</b><small>doğru</small></div>
        <div><b class="bad">${gq.wrong}</b><small>yanlış</small></div>
        <div><b>${left}</b><small>tur hakkı</small></div>
      </div>
      <div class="snake-card-actions">
        ${left > 0
          ? `<button class="gq-play" onclick="gqRestart()"><span class="sg-play-ic">↻</span><span>Yeni tur</span><span class="sg-play-cost">${left}/${GQ_MAX_ROUNDS}</span></button>`
          : `<small class="sg-card-note">Tur hakların bitti · ${_gqNextResetText()}</small>`}
        <button class="snake-ghost-btn" onclick="gqClose()">Kapat</button>
      </div>
    </div>`;
  if (navigator.vibrate) try { navigator.vibrate(finished ? [40, 30, 40, 30, 80] : 60); } catch {}

  if (earned > 0) {
    gencoAwardCoins(earned, 'Kim Genco Olmak İster 👑',
      `Yarışmada ${gq.correct} doğru yaptın, ${earned} coin hesabına eklendi!`, 'quiz_reward')
      .then(ok => {
        const p = document.getElementById('gq-award-msg');
        if (p) p.innerHTML = ok ? `<b>+${earned} coin</b> hesabına eklendi!` : 'Coin kaydedilemedi, bağlantını kontrol et.';
        if (ok) showToast(`Kim Genco Olmak İster: +${earned} coin hesabına eklendi`);
      });
  }
}

function gqRestart() {
  gqStart();
}

function gqClose() {
  clearInterval(gq.tick);
  gq.active = false;
  const overlay = document.getElementById('gq-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('snake-lock');
  gqRenderLobby();
}

function gqQuit() {
  if (gq.active) {
    if (!confirm('Yarışmadan çıkılsın mı? Bu tur hakkından düşer, şu ana kadar kazandığın coinler hesabına eklenir.')) return;
    _gqEnd();
  }
  gqClose();
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('gq-overlay')?.classList.contains('open')) return;
  const map = { a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
  if (e.key in map && gq.active) { e.preventDefault(); gqAnswer(map[e.key]); }
  else if (e.key === 'Escape') gqQuit();
});

/* Oyunların ortak coin ödülü: güncel bakiyenin üzerine ekler, bildirim atar */
async function gencoAwardCoins(amount, notifTitle, notifMsg, type) {
  if (!(amount > 0) || !state.user?.id) return false;
  try {
    let current = Number(state.user.coin || 0);
    try { const st = await sbGetStats(state.user.id); current = Number(st?.coin ?? current); } catch {}
    const newCoin = current + amount;
    await sbUpdateStats(state.user.id, { coin: newCoin });
    state.user.coin = newCoin;
    refreshCoinDisplays();
    if (typeof updateRewardsAvailability === 'function') updateRewardsAvailability();
    sbAddNotification(state.user.id, notifTitle, notifMsg, type || 'game_reward').catch(() => {});
    return true;
  } catch (e) {
    console.error('Coin ödülü kaydedilemedi:', e);
    showToast('Hata: coin hesabına eklenemedi');
    return false;
  }
}


/* Alt menünün gerçek yüksekliğini ölçüp sayfaların bitiş çizgisini ona göre ayarla */
(function syncBottomNavSpace() {
  const nav = document.getElementById('user-bottom-nav');
  if (!nav) return;
  const apply = window.syncBottomNavSpace = () => {
    const visible = getComputedStyle(nav).display !== 'none';
    // Sayfa alanının alt kenarı ile menünün üst kenarı arasındaki farkı ayır. Ekran yüksekliği
    // yerine sayfa alanını baz alıyoruz: telefonda adres çubuğu yüzünden sayfa alanı görünür
    // ekrandan uzun olabiliyor ve en alttaki içerik (ör. Oturumu kapat) menünün arkasında kalıyordu.
    const container = document.querySelector('#app-screen .page-container');
    const bottom = container ? container.getBoundingClientRect().bottom : window.innerHeight;
    const h = visible ? Math.max(0, Math.ceil(bottom - nav.getBoundingClientRect().top)) : 0;
    document.documentElement.style.setProperty('--bnav-h', h + 'px');
  };
  apply();
  if ('ResizeObserver' in window) new ResizeObserver(apply).observe(nav);
  new MutationObserver(apply).observe(nav, { attributes: true, attributeFilter: ['style', 'class'] });
  window.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('resize', apply);
  const container = document.querySelector('#app-screen .page-container');
  if (container && 'ResizeObserver' in window) new ResizeObserver(apply).observe(container);
})();


/* Ana sayfa: yaklaşan konser şeridi ve Snake kısayolu */
function renderHomeConcerts() {
  if (!state._agendaLoaded) { loadAgendaData().then(renderHomeConcerts); }
  const el = document.getElementById('gh-concerts');
  const section = document.getElementById('gh-concerts-section');
  if (!el || typeof upcomingConcerts !== 'function') return;
  const list = upcomingConcerts().slice(0, 6);
  if (section) section.hidden = !list.length;
  el.innerHTML = list.map(c => {
    const d = new Date(c.date + 'T12:00:00');
    return `<a class="gh-concert" href="${concertUrl(c)}" target="_blank" rel="noopener noreferrer">
      <span class="gh-concert-media">
        <img src="${concertImg(c)}" alt="" loading="lazy" onerror="this.remove()">
        <span class="gh-concert-date"><b>${d.getDate()}</b>${d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
      </span>
      <b>${escHtml(c.artist)}</b>
      <small>${escHtml(c.venue)} · ${c.time}</small>
    </a>`;
  }).join('');
}

function goSnakeGame() {
  goPage('tasks');
  document.querySelector('#page-tasks [data-tab="game-tab"]')?.click();
}

renderHomeConcerts();

/* Ana sayfa canlılığı: başlığın sonu birkaç saniyede bir değişir, bölümler kaydırdıkça belirir */
const GH_ROTATOR = [['ne yapıyoruz?', ''], ['görev avındayız', '🎯'], ['konserdeyiz', '🎤'], ['coin topluyoruz', '🪙'], ['keşfe çıkıyoruz', '🧭']];
function startHomeRotator() {
  const el = document.getElementById('gh-rotator');
  if (!el || el.dataset.on) return;
  el.dataset.on = '1';
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  setInterval(() => {
    if (state.currentPage !== 'home' || document.hidden) return;
    i = (i + 1) % GH_ROTATOR.length;
    el.classList.remove('is-in');
    void el.offsetWidth;
    const [text, emoji] = GH_ROTATOR[i];
    el.innerHTML = `<span>${text}</span>${emoji ? ` <i>${emoji}</i>` : ''}`;
    el.classList.add('is-in');
  }, 3200);
}

function initHomeReveal() {
  const page = document.getElementById('page-home');
  if (!page || page.dataset.reveal) return;
  page.dataset.reveal = '1';
  const items = [...page.querySelectorAll('.gh-reveal')];
  const show = el => el.classList.add('is-in');
  if (!('IntersectionObserver' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { items.forEach(show); return; }
  page.classList.add('gh-anim');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }), { root: page, threshold: 0.08 });
  items.forEach(el => io.observe(el));
  // Güvence: gözlemci tetiklenmezse içerik gizli kalmasın
  setTimeout(() => { if (!items.some(el => el.classList.contains('is-in'))) items.forEach(show); }, 4000);
}

startHomeRotator();
initHomeReveal();


/* ═══ ADMİN PANELİ v2 ═══
   Alt menüde 4 ana sekme (Panel, Onaylar, Mesajlar, Profil); diğer tüm bölümler
   Panel'deki kutulardan açılır. Konser/haber yönetimi için admin_content.sql gerekir. */

function adminGo(tab) {
  switchAdminSection(null, tab);
  document.getElementById('page-admin')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function _adminTableMissing(e) {
  return /42P01|PGRST205|PGRST200|schema cache|does not exist/i.test(String(e?.message || '') + ' ' + String(e?.code || ''));
}
function _adminSetupNotice(sqlFile) {
  return `<div class="ad-notice"><b>Bu bölüm henüz kurulmadı</b><span>Supabase › SQL Editor'de <code>${sqlFile}</code> dosyasını bir kez çalıştır, sonra sayfayı yenile.</span></div>`;
}
function _adminEmpty(icon, text) {
  return `<div class="adm-empty"><div class="adm-empty-icon">${icon}</div><div>${text}</div></div>`;
}
function _setCount(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

// Panel kutularındaki sayılar
async function loadAdminCounts() {
  const jobs = [
    ['adm-stat-tasks', () => sbGetTasks()],
    ['ad-count-rewards', () => sbGetRewards()],
    ['ad-count-partners', () => sbGetPartners()],
    ['ad-count-events', () => sbGetEvents()],
    ['ad-count-reviews', () => sbGetAllPartnerReviews()],
    ['ad-count-concerts', () => sbGetConcerts()],
    ['ad-count-news', () => sbGetNews()],
    ['ad-count-league', () => sbGetLeagueTeams()],
  ];
  jobs.forEach(([id, fn]) => {
    fn().then(rows => _setCount(id, (rows || []).length)).catch(() => _setCount(id, '—'));
  });
  sbGetHelpMessages().then(msgs => {
    const open = (msgs || []).filter(m => m.status === 'open').length;
    _setCount('ad-count-messages', open ? `${open} yeni` : (msgs || []).length);
    _setCount('adm-stat-msgs', open);
    const badge = document.getElementById('adm-msg-badge');
    if (badge) { badge.textContent = open; badge.style.display = open ? '' : 'none'; }
  }).catch(() => {});
  if (!state.adminAllSubmissions) loadAdminApprovals(true).catch(() => {});
}

/* ── Ortak ekle/düzenle formu (konser, haber) ── */
function openAdminForm({ title, fields, values = {}, onSave }) {
  const box = document.getElementById('ad-form-fields');
  document.getElementById('ad-form-title').textContent = title;
  box.innerHTML = fields.map(f => {
    const v = values[f.key] ?? '';
    const common = `id="ad-f-${f.key}" ${f.required ? 'required' : ''} placeholder="${escHtml(f.placeholder || '')}"`;
    const input = f.type === 'textarea'
      ? `<textarea class="adm-inp adm-textarea" rows="3" ${common}>${escHtml(v)}</textarea>`
      : f.type === 'select'
        ? `<select class="adm-inp" id="ad-f-${f.key}">${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${escHtml(o)}</option>`).join('')}</select>`
        : `<input class="adm-inp" type="${f.type || 'text'}" value="${escHtml(v)}" ${common}>`;
    return `<label class="ad-field"><span>${escHtml(f.label)}${f.required ? ' *' : ''}</span>${input}${f.hint ? `<small>${escHtml(f.hint)}</small>` : ''}</label>`;
  }).join('');
  const btn = document.getElementById('ad-form-save');
  btn.onclick = async () => {
    const data = {};
    for (const f of fields) {
      const val = document.getElementById('ad-f-' + f.key).value.trim();
      if (f.required && !val) { showToast(`"${f.label}" boş olamaz`); return; }
      data[f.key] = val || null;
    }
    btn.disabled = true;
    try { await onSave(data); closeModal('modal-admin-form'); }
    catch (e) { showToast('Hata: ' + (e.message || 'kaydedilemedi')); }
    finally { btn.disabled = false; }
  };
  openModal('modal-admin-form');
}

function _confirmDelete(label, fn) {
  showConfirm(`"${label}" silinsin mi? Bu işlem geri alınamaz.`, 'Evet, sil', fn);
}

/* ── KONSERLER ── */
async function loadAdminConcerts() {
  const list = document.getElementById('adm-concert-list');
  if (!list) return;
  list.innerHTML = _adminEmpty('⏳', 'Yükleniyor…');
  try {
    const rows = await sbGetConcerts();
    state.adminConcerts = rows;
    _setCount('ad-count-concerts', rows.length);
    const seed = `<button class="ad-ghost ad-seed" onclick="seedAdminConcerts()">Hazır Bubilet listesini (${ALANYA_CONCERTS.length}) içe aktar</button>`;
    if (!rows.length) {
      list.innerHTML = `${_adminEmpty('🎤', 'Henüz konser eklenmedi. Kullanıcılar şu an uygulamadaki hazır listeyi görüyor.')}${seed}`;
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    list.innerHTML = rows.map(c => {
      const past = c.event_date < today;
      const d = new Date(c.event_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `<div class="ad-row${past ? ' is-past' : ''}">
        <span class="ad-thumb">${c.image_url ? `<img src="${escHtml(c.image_url)}" alt="" loading="lazy" onerror="this.remove()">` : '🎤'}</span>
        <span class="ad-row-copy"><b>${escHtml(c.artist)}</b><small>${d}${c.event_time ? ' · ' + escHtml(c.event_time) : ''} · ${escHtml(c.venue || '—')}${past ? ' · <em>geçti</em>' : ''}</small></span>
        <span class="ad-row-actions">
          <button class="adm-act-btn" onclick="openAdminConcertForm('${c.id}')" aria-label="Düzenle">✏️</button>
          <button class="adm-act-btn" onclick="deleteAdminConcert('${c.id}')" aria-label="Sil">🗑️</button>
        </span>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = _adminTableMissing(e) ? _adminSetupNotice('admin_content.sql') : _adminEmpty('⚠️', 'Yüklenemedi: ' + escHtml(e.message || ''));
  }
}

function openAdminConcertForm(id) {
  const c = id ? (state.adminConcerts || []).find(x => x.id === id) : null;
  openAdminForm({
    title: c ? 'Konseri düzenle' : 'Yeni konser',
    values: c || { tag: 'Konser', venue: 'Açıkhava Tiyatrosu' },
    fields: [
      { key: 'artist', label: 'Sanatçı / etkinlik adı', required: true, placeholder: 'Ör. Gökhan Türkmen' },
      { key: 'event_date', label: 'Tarih', type: 'date', required: true },
      { key: 'event_time', label: 'Saat', type: 'time' },
      { key: 'venue', label: 'Mekan', placeholder: 'Açıkhava Tiyatrosu' },
      { key: 'price', label: 'Fiyat', placeholder: "Ör. 750₺ ya da 600₺'den" },
      { key: 'tag', label: 'Tür', type: 'select', options: ['Konser', 'Gösteri', 'Festival', 'Tiyatro'] },
      { key: 'image_url', label: 'Afiş görseli (URL)', type: 'url', placeholder: 'https://…' },
      { key: 'ticket_url', label: 'Bilet linki (URL)', type: 'url', placeholder: 'https://www.bubilet.com.tr/…' },
    ],
    onSave: async data => {
      await sbSaveConcert(data, c?.id);
      showToast(c ? 'Konser güncellendi' : 'Konser eklendi');
      state.concertsData = null;
      loadAdminConcerts();
    }
  });
}

function deleteAdminConcert(id) {
  const c = (state.adminConcerts || []).find(x => x.id === id);
  _confirmDelete(c?.artist || 'Konser', async () => {
    try { await sbDeleteConcert(id); showToast('Konser silindi'); state.concertsData = null; loadAdminConcerts(); }
    catch (e) { showToast('Hata: ' + e.message); }
  });
}

async function seedAdminConcerts() {
  try {
    const rows = ALANYA_CONCERTS.map(c => ({
      artist: c.artist, event_date: c.date, event_time: c.time, venue: c.venue, price: c.price, tag: c.tag,
      image_url: concertImg(c), ticket_url: concertUrl(c)
    }));
    for (const r of rows) await sbSaveConcert(r);
    showToast(`${rows.length} konser içe aktarıldı`);
    state.concertsData = null;
    loadAdminConcerts();
  } catch (e) { showToast('Hata: ' + e.message); }
}

/* ── HABERLER ── */
async function loadAdminNews() {
  const list = document.getElementById('adm-news-list');
  if (!list) return;
  list.innerHTML = _adminEmpty('⏳', 'Yükleniyor…');
  try {
    const rows = await sbGetNews();
    state.adminNews = rows;
    _setCount('ad-count-news', rows.length);
    const seed = `<button class="ad-ghost ad-seed" onclick="seedAdminNews()">Hazır haber listesini (${ALANYA_NEWS.length}) içe aktar</button>`;
    if (!rows.length) {
      list.innerHTML = `${_adminEmpty('📰', 'Henüz haber eklenmedi. Kullanıcılar şu an uygulamadaki hazır listeyi görüyor.')}${seed}`;
      return;
    }
    list.innerHTML = rows.map(n => {
      const d = new Date(n.news_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `<div class="ad-row">
        <span class="ad-thumb">${n.image_url ? `<img src="${escHtml(n.image_url)}" alt="" loading="lazy" onerror="this.remove()">` : '📰'}</span>
        <span class="ad-row-copy"><b>${escHtml(n.title)}</b><small>${d}${n.tag ? ' · ' + escHtml(n.tag) : ''}${n.source ? ' · ' + escHtml(n.source) : ''}</small></span>
        <span class="ad-row-actions">
          <button class="adm-act-btn" onclick="openAdminNewsForm('${n.id}')" aria-label="Düzenle">✏️</button>
          <button class="adm-act-btn" onclick="deleteAdminNews('${n.id}')" aria-label="Sil">🗑️</button>
        </span>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = _adminTableMissing(e) ? _adminSetupNotice('admin_content.sql') : _adminEmpty('⚠️', 'Yüklenemedi: ' + escHtml(e.message || ''));
  }
}

function openAdminNewsForm(id) {
  const n = id ? (state.adminNews || []).find(x => x.id === id) : null;
  openAdminForm({
    title: n ? 'Haberi düzenle' : 'Yeni haber',
    values: n || { news_date: new Date().toISOString().slice(0, 10), source: 'Alanya Belediyesi', tag: 'Şehir' },
    fields: [
      { key: 'title', label: 'Başlık', required: true },
      { key: 'summary', label: 'Kısa özet', type: 'textarea', placeholder: '1-2 cümle' },
      { key: 'news_date', label: 'Tarih', type: 'date', required: true },
      { key: 'tag', label: 'Kategori', type: 'select', options: ['Şehir', 'Kültür', 'Çevre', 'Eğitim', 'Spor', 'Gençlik'] },
      { key: 'image_url', label: 'Görsel (URL)', type: 'url', placeholder: 'https://…' },
      { key: 'url', label: 'Haberin linki (URL)', type: 'url', placeholder: 'https://…' },
      { key: 'source', label: 'Kaynak', placeholder: 'Alanya Belediyesi' },
    ],
    onSave: async data => {
      await sbSaveNews(data, n?.id);
      showToast(n ? 'Haber güncellendi' : 'Haber eklendi');
      state.newsData = null;
      loadAdminNews();
    }
  });
}

function deleteAdminNews(id) {
  const n = (state.adminNews || []).find(x => x.id === id);
  _confirmDelete(n?.title || 'Haber', async () => {
    try { await sbDeleteNews(id); showToast('Haber silindi'); state.newsData = null; loadAdminNews(); }
    catch (e) { showToast('Hata: ' + e.message); }
  });
}

async function seedAdminNews() {
  try {
    for (const n of ALANYA_NEWS) {
      await sbSaveNews({ title: n.title, summary: n.summary, tag: n.tag, news_date: n.date, image_url: newsImg(n), url: newsUrl(n), source: n.source || 'Alanya Belediyesi' });
    }
    showToast(`${ALANYA_NEWS.length} haber içe aktarıldı`);
    state.newsData = null;
    loadAdminNews();
  } catch (e) { showToast('Hata: ' + e.message); }
}

/* ── YORUMLAR ── */
async function loadAdminReviews() {
  const list = document.getElementById('adm-review-list');
  if (!list) return;
  list.innerHTML = _adminEmpty('⏳', 'Yükleniyor…');
  try {
    const rows = await sbGetAllPartnerReviews();
    state.adminReviews = rows;
    _setCount('ad-count-reviews', rows.length);
    const partners = [...new Set(rows.map(r => r.partner_name))];
    const f = document.getElementById('adm-review-filters');
    if (f) f.innerHTML = rows.length
      ? [`<button class="afc2 active" data-p="" onclick="filterAdminReviews(this)">Tümü <b>${rows.length}</b></button>`]
          .concat(partners.map(p => `<button class="afc2" data-p="${escHtml(p)}" onclick="filterAdminReviews(this)">${escHtml(p)}</button>`)).join('')
      : '';
    _renderAdminReviews('');
  } catch (e) {
    list.innerHTML = _adminTableMissing(e) ? _adminSetupNotice('partner_reviews.sql') : _adminEmpty('⚠️', 'Yüklenemedi: ' + escHtml(e.message || ''));
  }
}

function filterAdminReviews(btn) {
  document.querySelectorAll('#adm-review-filters .afc2').forEach(b => b.classList.toggle('active', b === btn));
  _renderAdminReviews(btn.dataset.p || '');
}

function _renderAdminReviews(partner) {
  const list = document.getElementById('adm-review-list');
  const rows = (state.adminReviews || []).filter(r => !partner || r.partner_name === partner);
  if (!rows.length) { list.innerHTML = _adminEmpty('⭐', 'Henüz yorum yok'); return; }
  list.innerHTML = rows.map(r => {
    const who = r.profiles?.full_name || r.profiles?.username || 'Üye';
    const d = new Date(r.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return `<div class="ad-row ad-review">
      <span class="ad-row-copy">
        <b>${escHtml(r.partner_name)} <span class="ad-stars">${'★'.repeat(r.rating)}<i>${'★'.repeat(5 - r.rating)}</i></span></b>
        <small>${escHtml(who)} · ${d}</small>
        ${r.comment ? `<p>${escHtml(r.comment)}</p>` : ''}
      </span>
      <span class="ad-row-actions"><button class="adm-act-btn" onclick="deleteAdminReview('${r.id}')" aria-label="Sil">🗑️</button></span>
    </div>`;
  }).join('');
}

function deleteAdminReview(id) {
  const r = (state.adminReviews || []).find(x => x.id === id);
  _confirmDelete(`${r?.partner_name || ''} yorumu`, async () => {
    try { await sbAdminDeleteReview(id); showToast('Yorum silindi'); loadAdminReviews(); }
    catch (e) { showToast('Hata: ' + e.message); }
  });
}

/* ── GENCO LİG ── */
async function loadAdminLeague() {
  const list = document.getElementById('adm-league-list');
  if (!list) return;
  list.innerHTML = _adminEmpty('⏳', 'Yükleniyor…');
  try {
    const teams = await sbGetLeagueTeams();
    state.adminLeague = teams || [];
    _setCount('ad-count-league', state.adminLeague.length);
    if (!state.adminLeague.length) { list.innerHTML = _adminEmpty('⚽', 'Henüz kayıtlı takım yok'); return; }
    list.innerHTML = state.adminLeague.map(t => {
      const players = Array.isArray(t.players) ? t.players : [];
      return `<details class="ad-row ad-team">
        <summary>
          <span class="ad-thumb">⚽</span>
          <span class="ad-row-copy"><b>${escHtml(t.team_name || 'Takım')}</b><small>Kaptan: ${escHtml(t.captain_name || '—')} · ${escHtml(t.phone || '—')} · ${players.length} oyuncu</small></span>
          <span class="ad-row-actions"><button class="adm-act-btn" onclick="event.preventDefault();deleteAdminLeagueTeam('${t.id}')" aria-label="Sil">🗑️</button></span>
        </summary>
        <div class="ad-team-players">${players.map(p => `<span class="${p.captain ? 'is-cap' : ''}">${escHtml(String(p.number))} · ${escHtml(p.name)}${p.role === 'yedek' ? ' (yedek)' : ''}</span>`).join('')}</div>
      </details>`;
    }).join('');
  } catch (e) {
    list.innerHTML = _adminTableMissing(e) ? _adminEmpty('⚽', 'Lig tablosu (league_teams) bulunamadı') : _adminEmpty('⚠️', 'Yüklenemedi: ' + escHtml(e.message || ''));
  }
}

function deleteAdminLeagueTeam(id) {
  const t = (state.adminLeague || []).find(x => x.id === id);
  _confirmDelete(t?.team_name || 'Takım', async () => {
    try { await sbDeleteLeagueTeam(id); showToast('Takım silindi'); loadAdminLeague(); }
    catch (e) { showToast('Hata: ' + e.message); }
  });
}

/* ── MESAJ FİLTRESİ ── */
function setAdminMsgFilter(btn) {
  document.querySelectorAll('#adm-msg-filters .afc2').forEach(b => b.classList.toggle('active', b === btn));
  state.adminMsgFilter = btn.dataset.f;
  applyAdminMsgFilter();
}
function applyAdminMsgFilter() {
  const f = state.adminMsgFilter || 'all';
  document.querySelectorAll('#adm-message-list .adm-msg-card').forEach(card => {
    const show = f === 'all' || (f === 'open' && card.dataset.status === 'open') || card.dataset.kind === f;
    card.style.display = show ? '' : 'none';
  });
}


/* ── Konser & haber verisi: önce veritabanı (admin panelinden yönetilir), boşsa hazır liste ── */
function concertImg(c) { return !c.img ? '' : /^https?:/.test(c.img) ? c.img : BUBILET_IMG + c.img; }
function concertUrl(c) { return !c.url ? '#' : /^https?:/.test(c.url) ? c.url : BUBILET_BASE + c.url; }
function newsImg(n) { return !n.img ? '' : /^https?:/.test(n.img) ? n.img : ALANYA_NEWS_BASE + n.img; }
function newsUrl(n) { return !n.url ? '#' : /^https?:/.test(n.url) ? n.url : ALANYA_NEWS_BASE + n.url; }
function currentConcerts() { return state.concertsData && state.concertsData.length ? state.concertsData : ALANYA_CONCERTS; }
function currentNews() { return state.newsData && state.newsData.length ? state.newsData : ALANYA_NEWS; }

async function loadAgendaData() {
  state._agendaLoaded = true;
  const [concerts, news] = await Promise.all([
    sbGetConcerts().catch(() => null),
    sbGetNews().catch(() => null),
  ]);
  if (concerts) state.concertsData = concerts.map(c => ({
    id: c.id, artist: c.artist, date: c.event_date, time: c.event_time || '', venue: c.venue || '',
    price: c.price || '', tag: c.tag || 'Konser', img: c.image_url || '', url: c.ticket_url || ''
  }));
  if (news) state.newsData = news.map(n => ({
    id: n.id, date: n.news_date, tag: n.tag || '', title: n.title, summary: n.summary || '',
    img: n.image_url || '', url: n.url || '', source: n.source || ''
  }));
}

/* ═══════════════════════════════════════════════════════════════
   GENCO PASS (G-Pass) — aylık sezonlu ödül yolu
   • Sezon = takvim ayı ('YYYY-MM'). Ay bitince yenisi başlar.
   • İlerleme = bu sezon onaylanan görevlerin XP'si (passTaskXp). Kademe tüm XP ile, Pass yalnızca görevlerle ilerler.
   • Sezon Level 1'de başlar, en fazla 30 seviye. Yalnızca görev XP'siyle ilerler, seviye maliyeti
     artar (bkz. gpassLevelCost / gpassProgress).
   • Sezon ayarı genco_pass_seasons'tan gelir; kayıt yoksa aşağıdaki varsayılan kullanılır.
   • Alınan ödüller genco_pass_claims'e (tekrar almayı engeller) ve profilin
     equipped_cosmetics.gpass alanına (envanter: rozet, çerçeve, kart teması…) yazılır.
   ═══════════════════════════════════════════════════════════════ */
const GPASS_MAX = 30;
const GPASS_DEFAULT_XP = 100;
const GPASS_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
// Her ayın teması: ad, simge, iki renk (r,g,b)
const GPASS_THEMES = [
  { name: 'Kış Işığı',        emoji: '❄️', c1: '125,211,252', c2: '99,102,241' },
  { name: 'Neon Kalp',        emoji: '💘', c1: '244,114,182', c2: '168,85,247' },
  { name: 'Bahar Uyanışı',    emoji: '🌱', c1: '74,222,128',  c2: '20,184,166' },
  { name: 'Çiçek Festivali',  emoji: '🌸', c1: '249,168,212', c2: '236,72,153' },
  { name: 'Genç Enerji',      emoji: '⚡', c1: '250,204,21',  c2: '249,115,22' },
  { name: 'Mavi Dalga',       emoji: '🌊', c1: '34,211,238',  c2: '59,130,246' },
  { name: 'Alanya Sıcakları', emoji: '☀️', c1: '251,191,36',  c2: '239,68,68' },
  { name: 'Sahil Gecesi',     emoji: '🌴', c1: '45,212,191',  c2: '129,140,248' },
  { name: 'Okula Dönüş',      emoji: '🎒', c1: '96,165,250',  c2: '167,139,250' },
  { name: 'Neon Hasat',       emoji: '🍂', c1: '251,146,60',  c2: '217,70,239' },
  { name: 'Kasım Fırtınası',  emoji: '🌪️', c1: '148,163,184', c2: '56,189,248' },
  { name: 'Yılbaşı Işıltısı', emoji: '✨', c1: '253,224,71',  c2: '244,63,94' },
];
const GPASS_TYPES = {
  coin:     { label: 'Genco Coin',          rgb: '251,191,36'  },
  xp:       { label: 'Deneyim puanı',       rgb: '34,211,238'  },
  title:    { label: 'Unvan',               rgb: '167,139,250' },
  badge:    { label: 'Rozet',               rgb: '244,114,182' },
  frame:    { label: 'Profil çerçevesi',    rgb: '96,165,250'  },
  cosmetic: { label: 'Profil kartı teması', rgb: '45,212,191'  },
  surprise: { label: 'Sürpriz kutu',        rgb: '232,121,249' },
  legend:   { label: 'Sezona özel rozet',   rgb: '253,224,71'  },
};
const GPASS_ICONS = {
  xp:       '<path d="M13 3 5.5 13.5h5.2L10 21l8.5-11h-5.4z" fill="currentColor" stroke="none"/>',
  gift:     '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12M12 8v13M12 8S10.5 3.6 8 4.3C6 4.9 6.6 8 12 8zM12 8s1.5-4.4 4-3.7c2 .6 1.4 3.7-4 3.7z"/>',
  surprise: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M3 7.5h18v3H3zM12 7.5V20"/><path d="M10 14.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6 1v.3M12 18.6v.01"/>',
  cosmetic: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M3.5 15l4.5-4 3.5 3 3-2.5 6 4.5"/><circle cx="15.5" cy="9" r="1.5"/>',
  lock:     '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check:    '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock:    '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
};
const gpSvg = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${GPASS_ICONS[k]}</svg>`;

function gpassSeasonId(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function gpassSeasonRange(id) {
  const [y, m] = id.split('-').map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}
function gpassTimeLeft(id) {
  const ms = gpassSeasonRange(id).end - Date.now();
  if (ms <= 0) return 'Sezon bitti';
  const d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000), m = Math.floor(ms % 3600000 / 60000);
  return d > 0 ? `${d}g ${h}s kaldı` : `${h}s ${m}dk kaldı`;
}

// Varsayılan 30 seviye: her 5. seviye özel (çerçeve, rozet, unvan…), 30. seviye sezona özel efsane rozeti
function gpassDefaultRewards(id) {
  const m = Number(id.split('-')[1]) - 1;
  const th = GPASS_THEMES[m];
  const f1 = PASS_FRAMES[(m * 2) % PASS_FRAMES.length].key;
  const f2 = PASS_FRAMES[(m * 2 + 1) % PASS_FRAMES.length].key;
  const cards = COSMETICS.filter(c => c.type === 'card_bg').map(c => c.id);
  // Pass ödülleri XP vermez (Pass XP'sini beslemesin); coin toplamı ~1.250 + 3 sürpriz kutu
  return [
    { type: 'coin', amount: 30 },
    { type: 'coin', amount: 25 },
    { type: 'title', emoji: '🌱', name: 'Sezon Çaylağı' },
    { type: 'coin', amount: 40 },
    { type: 'frame', key: f1 },
    { type: 'coin', amount: 35 },
    { type: 'coin', amount: 50 },
    { type: 'surprise' },
    { type: 'coin', amount: 45 },
    { type: 'badge', emoji: '🧭', name: 'Sezon Kaşifi' },
    { type: 'coin', amount: 60 },
    { type: 'cosmetic', id: cards[m % cards.length] },
    { type: 'coin', amount: 60 },
    { type: 'coin', amount: 70 },
    { type: 'badge', emoji: '🔥', name: 'Yarı Yolcu' },
    { type: 'coin', amount: 60 },
    { type: 'surprise' },
    { type: 'coin', amount: 80 },
    { type: 'title', emoji: '🚀', name: 'Hız Rekortmeni' },
    { type: 'frame', key: f2 },
    { type: 'coin', amount: 90 },
    { type: 'coin', amount: 80 },
    { type: 'coin', amount: 100 },
    { type: 'cosmetic', id: cards[(m + 1) % cards.length] },
    { type: 'title', emoji: '⭐', name: 'Sezon Yıldızı' },
    { type: 'coin', amount: 120 },
    { type: 'surprise' },
    { type: 'coin', amount: 100 },
    { type: 'coin', amount: 200 },
    { type: 'legend', emoji: th.emoji, name: `${th.name} Efsanesi` },
  ];
}

function gpassBaseSeason(id) {
  const m = Number(id.split('-')[1]) - 1;
  const th = GPASS_THEMES[m];
  return {
    id, name: th.name, subtitle: `${GPASS_MONTHS[m]} ${id.split('-')[0]} sezonu`, emoji: th.emoji,
    c1: th.c1, c2: th.c2, xpPerLevel: GPASS_DEFAULT_XP, rewards: gpassDefaultRewards(id), custom: false,
  };
}

async function gpassLoadSeason(force = false) {
  const id = gpassSeasonId();
  if (!force && state.gpass?.season?.id === id) return state.gpass.season;
  let season = gpassBaseSeason(id);
  try {
    const row = await sbGetPassSeason(id);
    if (row) {
      season = { ...season, name: row.name || season.name, subtitle: row.subtitle || season.subtitle,
        xpPerLevel: Number(row.xp_per_level) || season.xpPerLevel, custom: true };
      if (Array.isArray(row.rewards) && row.rewards.length === GPASS_MAX) {
        // Kupon/indirim ödülleri kaldırıldı: eski kayıtlardaki bu seviyeler varsayılan ödüle döner
        const base = season.rewards;
        season.rewards = row.rewards.map((r, i) => (i === GPASS_MAX - 1 ? { ...r, type: 'legend' } : GPASS_TYPES[r?.type] ? r : base[i]));
      }
    }
  } catch (e) { /* tablo yoksa varsayılan sezonla devam */ }
  state.gpass = { ...(state.gpass || {}), season };
  return season;
}

/* Pass ilerlemesi = bu sezon onaylanan GÖREVLERİN XP'si. Günlük tavan yok; tempo seviye maliyetinden gelir.
   • Yalnızca görev XP'si sayılır: rozet/seri/çark gibi tek seferlik büyük XP'ler (150–1.500) ilk ayı
     çok hızlandırırdı ve her ay tekrarlanmaz. Görevler admin onaylı olduğu için ilerleme de hileye kapalıdır.
     Bu XP'ler Kademe'yi ve sıralamayı yine ilerletir.
   • Seviye maliyeti 80 XP'den 160 XP'ye doğrusal artar (toplam 3.480 XP). Günlük görevlerin hepsi
     ~150–170 XP verir → her gün 1–2 seviye: ilk günler 2 (seviye 80 XP), son günler 1 (seviye 160 XP).
     Her gün hepsini yapan ~21–24. günde bitirir; günde ~100 XP yapan Lv 26, ~60 XP yapan Lv 18 civarında kalır.
     Admin'in "taban XP"si (varsayılan 100) tüm eğriyi ölçekler. */
function gpassLevelCost(level, base) {
  return 5 * Math.round((80 + (80 / 28) * (level - 2)) * (base / 100) / 5);
}
// Bu seviyeye ulaşmak için gereken toplam Pass XP'si (Level 1 = 0)
function gpassXpForLevel(level, base) {
  let sum = 0;
  for (let l = 2; l <= Math.min(level, GPASS_MAX); l++) sum += gpassLevelCost(l, base);
  return sum;
}
function gpassLevelOf(xp, base) {
  let level = 1;
  while (level < GPASS_MAX && xp >= gpassXpForLevel(level + 1, base)) level++;
  return level;
}
function passDayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Bu sezonun görev XP'si: sezon içinde onaylanan gönderimler (sezon başlangıç XP'si de buna göre hesaplanır)
// Admin test sıfırlaması: equipped_cosmetics.gpass.passFrom[sezon] zamanından önce onaylananlar sayılmaz
function passTaskXp(seasonId, subs, cos = state.user?.cosmetics) {
  const range = gpassSeasonRange(seasonId);
  const from = cos?.gpass?.passFrom?.[seasonId];
  const start = from ? Math.max(range.start.getTime(), new Date(from).getTime()) : range.start.getTime();
  return (subs || []).reduce((sum, s) => {
    if (s.status !== 'approved') return sum;
    const rev = new Date(s.reviewed_at || s.submitted_at).getTime();
    return rev >= start && rev < range.end.getTime() ? sum + (Number(s.tasks?.xp_reward) || 0) : sum;
  }, 0);
}

// Level 1'den başlar, 30'da biter. per = sıradaki seviyenin maliyeti, into = o seviyeye doğru ilerleme.
function gpassProgress(season) {
  const xp = passTaskXp(season.id, state.submissions);
  const base = season.xpPerLevel;
  const level = gpassLevelOf(xp, base);
  const per = gpassLevelCost(Math.min(GPASS_MAX, level + 1), base);
  return { xp, base, per, level, into: level >= GPASS_MAX ? per : xp - gpassXpForLevel(level, base) };
}

function gpassInv(cos = state.user?.cosmetics) {
  const g = cos?.gpass || {};
  // ...g: bilinmeyen alanlar (ör. passFrom sıfırlama zamanı) envanter yeniden yazılırken kaybolmasın
  return { ...g, claims: g.claims || {}, resets: g.resets || {}, badges: g.badges || [], frames: g.frames || [], cosmetics: g.cosmetics || [], coupons: g.coupons || [] };
}
// Ödül kayıt anahtarı: admin test sıfırlamasından sonra sezon kimliğine sayaç eklenir (2026-09~1),
// böylece eski kayıtlar silinmeden yok sayılır ve ödüller yeniden alınabilir
function gpassClaimKey(seasonId) {
  const n = Number(gpassInv().resets[seasonId]) || 0;
  return n ? `${seasonId}~${n}` : seasonId;
}
function gpassClaimed(seasonId) {
  const set = new Set(gpassInv().claims[gpassClaimKey(seasonId)] || []);
  (state.gpass?.dbClaims || []).forEach(c => set.add(Number(c.level)));
  return set;
}
function gpassReadyLevels(season, prog) {
  const claimed = gpassClaimed(season.id);
  return Array.from({ length: prog.level }, (_, i) => i + 1).filter(l => !claimed.has(l));
}

// Ödülün görünümü: simge, başlık, alt yazı, renk
function gpassRewardView(r) {
  const t = GPASS_TYPES[r.type] || GPASS_TYPES.coin;
  const coin = '<span class="snake-score-coin" aria-hidden="true">G</span>';
  switch (r.type) {
    case 'coin':     return { rgb: t.rgb, icon: coin, title: `${Number(r.amount).toLocaleString('tr-TR')} Coin`, sub: t.label };
    case 'xp':       return { rgb: t.rgb, icon: gpSvg('xp'), title: `${Number(r.amount).toLocaleString('tr-TR')} XP`, sub: t.label };
    case 'title':    return { rgb: t.rgb, icon: `<span class="gpx-emo">${escHtml(r.emoji || '🏷️')}</span>`, title: `“${escHtml(r.name || 'Unvan')}”`, sub: t.label };
    case 'badge':    return { rgb: t.rgb, icon: `<span class="gpx-emo">${escHtml(r.emoji || '🎖️')}</span>`, title: escHtml(r.name || 'Rozet'), sub: t.label };
    case 'legend':   return { rgb: t.rgb, icon: `<span class="gpx-emo">${escHtml(r.emoji || '👑')}</span>`, title: escHtml(r.name || 'Sezon Efsanesi'), sub: t.label };
    case 'frame': {
      const f = frameDefByKey(r.key) || PASS_FRAMES[0];
      return { rgb: t.rgb, icon: `<span class="lf lf-sm lf-on lf-${f.key} gpx-frame-demo"><i></i></span>`, title: `${escHtml(f.name)} çerçeve`, sub: t.label, color: f.color };
    }
    case 'cosmetic': {
      const c = COSMETICS.find(x => x.id === r.id);
      return { rgb: t.rgb, icon: `<span class="gpx-emo">${c?.emoji || '🎨'}</span>`, title: escHtml(c?.name || 'Kart teması'), sub: t.label };
    }
    case 'surprise': return { rgb: t.rgb, icon: gpSvg('surprise'), title: 'Sürpriz Kutu', sub: '40–120 coin' };
    default:         return { rgb: t.rgb, icon: coin, title: 'Ödül', sub: '' };
  }
}

/* ── Ödül verme ── */
async function gencoAwardXp(amount) {
  if (!(amount > 0) || !state.user?.id) return;
  let current = Number(state.user.xp || 0);
  try { const st = await sbGetStats(state.user.id); current = Number(st?.xp ?? current); } catch {}
  await sbUpdateStats(state.user.id, { xp: current + amount });
  await refreshUserStats();
}

function gpassRollSurprise() {
  // 40–120 coin (Pass XP'sini beslememesi için XP çıkmaz)
  return { type: 'coin', amount: 40 + Math.floor(Math.random() * 5) * 20, surprise: true };
}

async function gpassGrant(r, season, level) {
  const inv = gpassInv();
  const next = { ...inv, claims: { ...inv.claims }, resets: { ...inv.resets }, badges: [...inv.badges], frames: [...inv.frames], cosmetics: [...inv.cosmetics], coupons: [...inv.coupons] };
  const key = gpassClaimKey(season.id);
  next.claims[key] = [...new Set([...(next.claims[key] || []), level])];
  const extra = {};
  switch (r.type) {
    case 'coin':
      await gencoAwardCoins(Number(r.amount), 'Genco Pass 🎟️', `${season.name} · ${level}. seviye ödülü: +${r.amount} coin hesabına eklendi.`, 'bonus');
      break;
    case 'xp':
      await gencoAwardXp(Number(r.amount));
      break;
    case 'badge': case 'title': case 'legend': {
      const id = `gp-${season.id}-${level}`;
      if (!next.badges.some(b => b.id === id)) {
        next.badges.push({ id, kind: r.type === 'title' ? 'title' : 'badge', emoji: r.emoji || '🎖️', name: r.name, title: r.name,
          season: season.id, seasonName: season.name, legend: r.type === 'legend' });
      }
      break;
    }
    case 'frame':
      if (!next.frames.includes(r.key)) next.frames.push(r.key);
      break;
    case 'cosmetic':
      if (!next.cosmetics.includes(r.id)) next.cosmetics.push(r.id);
      extra.card_bg = r.id; // hemen profil kartına uygula
      break;
  }
  await saveBadgeCosmetics({ gpass: next, ...extra });
  registerPassBadges(state.user.cosmetics);
  if (r.type === 'cosmetic' && typeof applyCosmetics === 'function') applyCosmetics();
  if (r.type === 'frame' || r.type === 'badge' || r.type === 'title' || r.type === 'legend') rerenderBadgeViews();
}

async function gpassClaim(level, { quiet = false } = {}) {
  if (!state.user?.id || state.gpass?.claiming) return false;
  const season = await gpassLoadSeason();
  const prog = gpassProgress(season);
  if (level > prog.level) { if (!quiet) showToast(`Bu ödül ${level}. seviyede açılır`); return false; }
  if (gpassClaimed(season.id).has(level)) return false;

  state.gpass.claiming = true;
  document.querySelector(`#gpx-step-${level} .gpx-claim`)?.classList.add('is-busy');
  let r = { ...season.rewards[level - 1] };
  try {
    if (r.type === 'surprise') r = gpassRollSurprise();

    // Veritabanı kilidi: aynı seviye ikinci kez eklenemez (tablo kurulu değilse profil kaydı yeterli)
    if (state.gpass.dbReady !== false) {
      try {
        await sbInsertPassClaim({ user_id: state.user.id, season_id: gpassClaimKey(season.id), level, reward: r });
        (state.gpass.dbClaims = state.gpass.dbClaims || []).push({ level, reward: r });
      } catch (e) {
        if (String(e.code) === '23505' || /duplicate/i.test(e.message || '')) {
          (state.gpass.dbClaims = state.gpass.dbClaims || []).push({ level });
          if (!quiet) showToast('Bu ödülü zaten almıştın');
          return false;
        }
        if (_adminTableMissing(e)) state.gpass.dbReady = false; else throw e;
      }
    }
    await gpassGrant(r, season, level);
    if (!quiet) gpassReveal(r, season, level);
    return r;
  } catch (e) {
    console.error('Genco Pass ödülü alınamadı:', e);
    if (!quiet) showToast('Hata: ödül alınamadı, tekrar dene');
    return false;
  } finally {
    state.gpass.claiming = false;
    renderGpassPage();
    gpassRefreshBanner();
  }
}

async function gpassClaimAll() {
  const season = await gpassLoadSeason();
  const ready = gpassReadyLevels(season, gpassProgress(season));
  if (!ready.length) return;
  const btn = document.getElementById('gpx-claim-all');
  if (btn) { btn.disabled = true; btn.textContent = 'Alınıyor…'; }
  let got = 0, coins = 0;
  for (const lvl of ready) {
    const r = await gpassClaim(lvl, { quiet: true });
    if (r) { got++; if (r.type === 'coin') coins += Number(r.amount); }
  }
  showToast(got ? `${got} ödül alındı${coins ? ` · +${coins.toLocaleString('tr-TR')} coin` : ''} · kaydedildi` : 'Ödüller alınamadı');
}

// Yoldaki seviye düğmesine dokunma: hazırsa al, değilse bilgi ver
function gpassNodeTap(level) {
  const season = state.gpass?.season;
  if (!season) return;
  const prog = gpassProgress(season);
  if (gpassClaimed(season.id).has(level)) { showToast(`Seviye ${level} ödülünü zaten aldın ✓`); return; }
  if (level <= prog.level) { gpassClaim(level); return; }
  const need = gpassXpForLevel(level, prog.base) - prog.xp;
  showToast(`Seviye ${level} için ${need.toLocaleString("tr-TR")} XP daha lazım`);
}

/* ── Ödül açılış penceresi ── */
// Ödülün nadirliği: kartın çerçeve rengi ve etiketi
function gpassRarity(r, level) {
  if (r.type === 'legend') return { label: 'EFSANE', rgb: '253,224,71' };
  if (level % 5 === 0) return { label: 'EPİK', rgb: '192,132,252' };
  if (['title', 'badge', 'frame', 'cosmetic'].includes(r.type)) return { label: 'NADİR', rgb: '96,165,250' };
  return { label: 'STANDART', rgb: '148,163,184' };
}

// Kartın üst sahnesi: ışık hüzmeleri, halkalar, parıltılar ve ortada ödül simgesi
function gpassRevealStage(icon, legend = false) {
  const spark = '<svg viewBox="0 0 24 24"><path d="M12 2c.6 4.8 2.2 6.9 7 7.5v1c-4.8.6-6.4 2.7-7 7.5h-1c-.6-4.8-2.2-6.9-7-7.5v-1c4.8-.6 6.4-2.7 7-7.5z"/></svg>';
  return `<div class="gpr-stage">
      <span class="gpr-rays" aria-hidden="true"></span>
      <span class="gpr-ring" aria-hidden="true"></span><span class="gpr-ring is-2" aria-hidden="true"></span>
      ${[1, 2, 3, 4].map(i => `<span class="gpr-spark is-${i}" aria-hidden="true">${spark}</span>`).join('')}
      <div class="gpr-icon ${legend ? 'is-legend' : ''}">${icon}</div>
    </div>`;
}

// Açılışta karttan dökülen konfeti
function gpassConfetti(rgbs) {
  const cols = [...rgbs.map(c => `rgb(${c})`), '#ffffff', '#facc15', '#f472b6'];
  return `<div class="gpr-confetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => {
    const x = Math.round(Math.random() * 100), dx = Math.round(Math.random() * 120 - 60), r = Math.round(Math.random() * 720 - 360);
    const d = (Math.random() * .5).toFixed(2), w = 5 + Math.round(Math.random() * 5);
    return `<i style="--x:${x}%;--dx:${dx}px;--r:${r}deg;--d:${d}s;--c:${cols[i % cols.length]};width:${w}px;height:${w + 4}px${i % 3 ? '' : ';border-radius:50%'}"></i>`;
  }).join('')}</div>`;
}

function gpassReveal(r, season, level) {
  const v = gpassRewardView(r);
  const box = document.getElementById('gpr-box');
  if (!box) return;
  const rar = gpassRarity(r, level);
  box.style.setProperty('--rc', v.rgb);
  box.style.setProperty('--rr', rar.rgb);
  document.getElementById('modal-gpass-reveal')?.style.setProperty('--rc', v.rgb);
  const note = {
    coin: 'Coin cüzdanına eklendi.', xp: 'XP hesabına eklendi, seviyen ilerledi.',
    title: 'Profili Düzenle › Unvanlar bölümünden takabilirsin.',
    badge: 'Rozetler sayfanda ve profil vitrininde kullanabilirsin.',
    legend: 'Bu sezona özel, bir daha kazanılamayan kalıcı rozet!',
    frame: 'Profili Düzenle › Çerçeveler bölümünden takabilirsin.',
    cosmetic: 'Profil kartına uygulandı.',
  }[r.type] || 'Hesabına eklendi.';
  const wear = ['title', 'frame'].includes(r.type);
  const prog = gpassProgress(season);
  const nextLvl = level + 1;
  const next = nextLvl > GPASS_MAX ? 'Sezonun tüm ödüllerini topladın 🎉'
    : nextLvl <= prog.level ? `Seviye ${nextLvl} ödülü de hazır, hemen al!`
    : `Sıradaki: Seviye ${nextLvl} · ${(gpassXpForLevel(nextLvl, prog.base) - prog.xp).toLocaleString('tr-TR')} XP kaldı`;

  box.innerHTML = `
    ${gpassRevealStage(v.icon, r.type === 'legend')}
    <div class="gpr-body">
      <div class="gpr-meta"><span class="gpr-rarity">${rar.label}</span><span class="gpr-kicker">${r.surprise ? 'SÜRPRİZ KUTU' : `SEVİYE ${level}`}</span></div>
      <h3>${v.title}</h3>
      <small class="gpr-sub">${v.sub}</small>
      <p class="gpr-note"><i>${gpSvg('check')}</i><span>${note}</span></p>
      <button type="button" class="gpr-btn" onclick="closeModal('modal-gpass-reveal')">Topla</button>
      ${wear ? `<button type="button" class="gpr-link" onclick="closeModal('modal-gpass-reveal'); openProfileEditor()">Şimdi tak</button>` : ''}
      <small class="gpr-next">${next}</small>
    </div>
    ${gpassConfetti([v.rgb, rar.rgb])}`;
  openModal('modal-gpass-reveal');
}

/* ── Kazanımlar'daki Pass kartı + seviye atlama bildirimi ── */
/* ═══ GÜNLÜK GİRİŞ TAKVİMİ ═══
   Üç çizgi menüdeki "Günlük Ödül" penceresi. 7 günlük döngü: her gün bir kez ödül alınır,
   3. gün unvan, 7. gün sürpriz kutu + koleksiyon (rozet ya da çerçeve). Her tamamlanan hafta
   koleksiyonda bir sonraki parçayı açar; hepsi toplandıysa yerine coin verilir.
   Bir gün kaçırılırsa takvim 1. güne döner (toplanan koleksiyon kalır).
   Durum: equipped_cosmetics.login = { last, day, weeks }. Unvan/rozet/çerçeveler Pass
   envanterine (equipped_cosmetics.gpass) yazılır; profilde ve rozet sayfasında aynı görünür. */
const LOGIN_TITLES = [
  { emoji: '🐦', name: 'Erkenci Kuş' },
  { emoji: '💙', name: 'Sadık Genç' },
  { emoji: '🎯', name: 'Günlük Avcı' },
  { emoji: '🌴', name: 'Alanya Müdavimi' },
  { emoji: '⚡', name: 'Durdurulamaz' },
  { emoji: '🦉', name: 'Gece Kuşu' },
  { emoji: '👑', name: 'Seri Kralı' },
];
const LOGIN_BADGES = [
  { emoji: '📅', name: 'İlk Hafta' },
  { emoji: '🔥', name: 'İki Hafta Ateşi' },
  { emoji: '🌊', name: 'Dalga Sörfçüsü' },
  { emoji: '💎', name: 'Bir Aylık Efsane' },
  { emoji: '🚀', name: 'Yörüngede' },
  { emoji: '🏝️', name: 'Ada Kaşifi' },
];
// Koleksiyon sırası: hafta 1 rozet, hafta 2 çerçeve, hafta 3 rozet… (çift haftalar çerçeve)
const LOGIN_CAL = [
  { coin: 10 },
  { coin: 15 },
  { title: true },
  { coin: 25 },
  { frame: true },                  // Şafak Tacı çerçevesi (zaten varsa 30 coin)
  { coin: 35, xp: 15 },
  { coupon: true, collect: true },  // Noi'de %15 indirimli kahve kuponu + haftalık koleksiyon parçası
];
const LOGIN_FRAME_KEY = 'dr-safak';
const LOGIN_FRAME_COIN = 30;
const LOGIN_COUPON = { partner: 'Noi', name: "Noi'de %15 indirimli kahve", emoji: '☕', disc: '%15', days: 7 };

function loginCalState() {
  const l = state.user?.cosmetics?.login || {};
  const today = passDayKey();
  const y = new Date(); y.setDate(y.getDate() - 1);
  const claimed = l.last === today;
  const cont = claimed || l.last === passDayKey(y);
  const lastDay = Number(l.day) || 0;
  // Bugün alınacak (ya da alınmış) gün: seri sürüyorsa bir sonraki gün, 7'den sonra başa döner
  const day = claimed ? lastDay : (cont ? lastDay % 7 + 1 : 1);
  return { claimed, day, weeks: Number(l.weeks) || 0, broken: !cont && lastDay > 0 };
}

// Envanterde henüz olmayan bir sonraki unvan / rozet / çerçeve (yoksa null → coin verilir)
function loginNextTitle() {
  const owned = new Set((state.user?.cosmetics?.gpass?.badges || []).map(b => b.id));
  const i = LOGIN_TITLES.findIndex((t, k) => !owned.has(`daily-title-${k}`));
  return i < 0 ? null : { ...LOGIN_TITLES[i], id: `daily-title-${i}` };
}
function loginNextCollectible(weeks) {
  const inv = gpassInv();
  if (weeks % 2 === 1) {
    const f = PASS_FRAMES.find(fr => !inv.frames.includes(fr.key));
    if (f) return { type: 'frame', key: f.key, name: `${f.name} çerçeve`, color: f.color };
  }
  const owned = new Set(inv.badges.map(b => b.id));
  const i = LOGIN_BADGES.findIndex((b, k) => !owned.has(`daily-badge-${k}`));
  if (i >= 0) return { type: 'badge', ...LOGIN_BADGES[i], id: `daily-badge-${i}` };
  const f = PASS_FRAMES.find(fr => !inv.frames.includes(fr.key));
  return f ? { type: 'frame', key: f.key, name: `${f.name} çerçeve`, color: f.color } : null;
}
function loginHasFrame() { return gpassInv().frames.includes(LOGIN_FRAME_KEY); }
// Süresi dolmamış Noi kuponu (en yenisi)
function loginActiveCoupon() {
  return gpassInv().coupons.filter(c => c.src === 'daily' && Number(c.exp) > Date.now()).sort((a, b) => b.at - a.at)[0] || null;
}

// 5. gün kartı: kullanıcının kendi avatarıyla canlı çerçeve önizlemesi
function loginFramePreview() {
  const u = state.user || {};
  const photo = u.profilePhoto || '';
  const av = photo
    ? `<span class="dr-av" style="background-image:url('${escHtml(photo)}')"></span>`
    : `<span class="dr-av">${escHtml(((u.username || u.name || 'G')[0] || 'G').toUpperCase())}</span>`;
  return `<span class="dr-frame-prev"><span class="lf lf-sm ${levelFrameClass(LOGIN_FRAME_KEY)}">${av}</span></span>`;
}

// Günün kartında görünecek simge ve yazı
function loginDayView(r, s) {
  const coin = n => `<span class="dr-coin"><span class="snake-score-coin">G</span>${n}</span>`;
  if (r.title) { const t = loginNextTitle(); return t ? { ic: `<span class="dr-emo">${t.emoji}</span>`, label: 'Unvan', short: 'unvan', rare: true } : { ic: coin(20), label: '20 coin', short: '20 coin' }; }
  if (r.frame) return loginHasFrame() ? { ic: coin(LOGIN_FRAME_COIN), label: `${LOGIN_FRAME_COIN} coin`, short: `${LOGIN_FRAME_COIN} coin` } : { ic: loginFramePreview(), label: 'Şafak Tacı', short: 'Şafak Tacı çerçevesi', frame: true };
  if (r.coupon) {
    const c = loginNextCollectible(s.weeks);
    return { coupon: true, extra: c ? `+ ${c.type === 'frame' ? 'çerçeve' : 'haftalık rozet'} ${c.type === 'frame' ? '🖼️' : c.emoji}` : '+ sürpriz', short: "Noi'de %15 indirimli kahve ☕" };
  }
  return { ic: coin(r.coin), label: r.xp ? `+${r.xp} XP` : 'Coin', short: `${r.coin} coin${r.xp ? ` + ${r.xp} XP` : ''}` };
}

function loginMidnightLeft() {
  const t = new Date(); t.setHours(24, 0, 0, 0);
  const sec = Math.max(0, Math.floor((t - Date.now()) / 1000));
  const p = n => String(n).padStart(2, '0');
  return `${p(Math.floor(sec / 3600))}:${p(Math.floor(sec % 3600 / 60))}:${p(sec % 60)}`;
}

function loginCalRender() {
  const s = (isGuest() || !state.user?.id) ? null : loginCalState();
  // Menüdeki kısayol ve üç çizgi düğmesindeki nokta: bugünkü ödül alınmadıysa göster
  const ready = !!s && !s.claimed;
  document.getElementById('nav-menu-toggle')?.classList.toggle('has-daily', ready);
  const entry = document.getElementById('kx-daily');
  if (entry) {
    entry.hidden = !s;
    entry.classList.toggle('is-ready', ready);
    const sub = document.getElementById('kx-daily-sub');
    if (sub && s) sub.textContent = ready ? `${s.day}. gün ödülün hazır!` : 'Bugünkü ödülünü aldın · yarın gel';
  }
  const grid = document.getElementById('lc-days');
  if (!grid || !s) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const stateOf = n => n < s.day || (n === s.day && s.claimed) ? 'done' : n === s.day ? 'today' : '';
  const check = '<span class="dr-check"><span>✓</span></span>';

  grid.innerHTML = LOGIN_CAL.slice(0, 6).map((r, i) => {
    const n = i + 1;
    const v = loginDayView(r, s);
    return `<div class="dr-day ${stateOf(n)}${v.rare ? ' rare' : ''}${v.frame ? ' is-frame' : ''}">
      <span class="dr-day-n">${n}. GÜN</span><span class="dr-day-ic">${v.ic}</span><em>${v.label}</em>${check}</div>`;
  }).join('');

  const jp = loginDayView(LOGIN_CAL[6], s);
  const jpBox = document.getElementById('dr-jackpot');
  if (jpBox) jpBox.innerHTML = `<div class="dr-jackpot ${stateOf(7)}">
      <span class="dr-jp-cup">${LOGIN_COUPON.emoji}</span>
      <span class="dr-jp-copy"><small>7. GÜN · BÜYÜK ÖDÜL</small><b>${LOGIN_COUPON.name}</b><em>${escHtml(jp.extra)}</em></span>
      <span class="dr-jp-tag">${LOGIN_COUPON.disc}<small>İNDİRİM</small></span>${check}</div>`;

  const done = s.claimed ? s.day : s.day - 1;
  const fill = document.getElementById('dr-prog-fill');
  if (fill) fill.style.width = Math.round(done / 7 * 100) + '%';
  set('dr-prog-txt', `${done}/7`);
  set('dr-streak', `🔥 ${s.day}. gün serisi`);
  set('lc-week', `${s.weeks + (s.claimed && s.day === 7 ? 0 : 1)}. hafta`);

  const btn = document.getElementById('lc-claim');
  btn.disabled = s.claimed;
  set('dr-claim-ic', s.claimed ? '✓' : (s.day === 7 ? '☕' : '🎁'));
  set('dr-claim-txt', s.claimed ? 'Bugünkü ödül alındı' : `${s.day}. gün ödülünü al`);
  set('dr-claim-sub', s.claimed ? `Yeni ödül ${loginMidnightLeft()} sonra` : loginDayView(LOGIN_CAL[s.day - 1], s).short);

  const nextV = loginDayView(LOGIN_CAL[s.day % 7], s);
  document.getElementById('lc-note').innerHTML = s.claimed
    ? `Yarın: <b>${escHtml(nextV.short)}</b> · kaçırırsan takvim başa döner`
    : s.broken ? 'Bir gün kaçırdığın için takvim başa döndü. Koleksiyonun duruyor, yeniden başla!'
    : `5. gün <b>Şafak Tacı</b> çerçevesi, 7. gün <b>Noi'de %15 indirimli kahve</b> ☕`;

  // Alınan ve süresi dolmamış kahve kuponu: kasada gösterilecek kod
  const cp = loginActiveCoupon();
  const cpBox = document.getElementById('dr-coupon');
  if (cpBox) {
    cpBox.hidden = !cp;
    if (cp) {
      const daysLeft = Math.max(1, Math.ceil((cp.exp - Date.now()) / 86400000));
      cpBox.innerHTML = `<span class="dr-coupon-ic">${LOGIN_COUPON.emoji}</span>
        <span class="dr-coupon-copy"><small>KUPONUN · ${escHtml(cp.partner).toLocaleUpperCase('tr')}</small><b>${escHtml(cp.name)}</b><em>Kasada bu kodu göster · ${daysLeft} gün geçerli</em></span>
        <span class="dr-coupon-code">${escHtml(cp.code)}</span>`;
    }
  }
}

function openDailyReward() {
  if (typeof requireLogin === 'function' && requireLogin()) return;
  toggleBottomNav(false);
  loginCalRender();
  openModal('modal-daily');
  // Ödül alındıysa butondaki geri sayım her saniye güncellensin (modal kapanınca durur)
  clearInterval(state.loginCalTimer);
  state.loginCalTimer = setInterval(() => {
    if (!document.getElementById('modal-daily')?.classList.contains('open')) { clearInterval(state.loginCalTimer); return; }
    const s = loginCalState();
    if (!s.claimed) { loginCalRender(); clearInterval(state.loginCalTimer); return; }
    const sub = document.getElementById('dr-claim-sub');
    if (sub) sub.textContent = `Yeni ödül ${loginMidnightLeft()} sonra`;
  }, 1000);
}

function loginCouponCode() {
  const chars = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
  return 'NOI-' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function loginCalClaim() {
  if (!state.user?.id || state.loginClaiming) return;
  const s = loginCalState();
  if (s.claimed) return;
  state.loginClaiming = true;
  const btn = document.getElementById('lc-claim');
  if (btn) btn.disabled = true;
  const txt = document.getElementById('dr-claim-txt');
  if (txt) txt.textContent = 'Açılıyor…';
  const r = LOGIN_CAL[s.day - 1];
  const weeks = s.day === 7 ? s.weeks + 1 : s.weeks;
  const got = [];
  try {
    // Önce durumu yaz: çift dokunuş ya da ikinci cihaz aynı günü iki kez alamasın
    await saveBadgeCosmetics({ login: { last: passDayKey(), day: s.day, weeks } });

    let coin = r.coin || 0;
    let item = null;
    if (r.title) item = loginNextTitle() ? { type: 'title', ...loginNextTitle() } : null;
    if (r.collect) item = loginNextCollectible(s.weeks);
    if (r.title && !item) coin = 20;

    const inv = gpassInv();
    const gpass = { ...inv, badges: [...inv.badges], frames: [...inv.frames], coupons: [...inv.coupons] };
    let changed = false;
    if (r.frame) {
      if (!gpass.frames.includes(LOGIN_FRAME_KEY)) { gpass.frames.push(LOGIN_FRAME_KEY); got.push('🖼️ Şafak Tacı çerçevesi'); changed = true; }
      else coin = LOGIN_FRAME_COIN;
    }
    if (r.coupon) {
      const now = Date.now();
      gpass.coupons.push({ id: `daily-noi-${now}`, src: 'daily', partner: LOGIN_COUPON.partner, name: LOGIN_COUPON.name,
        code: loginCouponCode(), at: now, exp: now + LOGIN_COUPON.days * 86400000 });
      got.push(`${LOGIN_COUPON.emoji} ${LOGIN_COUPON.name}`);
      changed = true;
    }
    if (item) {
      if (item.type === 'frame') gpass.frames.push(item.key);
      else gpass.badges.push({ id: item.id, kind: item.type === 'title' ? 'title' : 'badge', emoji: item.emoji, name: item.name, title: item.name,
        req: item.type === 'title' ? 'Günlük ödül · 3. gün unvanı' : `Günlük ödül · ${weeks}. hafta koleksiyonu` });
      got.push(item.type === 'frame' ? `🖼️ ${item.name}` : `${item.emoji} “${item.name}” ${item.type === 'title' ? 'unvanı' : 'rozeti'}`);
      changed = true;
    }
    if (changed) {
      await saveBadgeCosmetics({ gpass });
      registerPassBadges(state.user.cosmetics);
      rerenderBadgeViews();
    }
    if (coin) {
      await gencoAwardCoins(coin, 'Günlük ödül 📅', `${s.day}. gün giriş ödülün: +${coin} coin${got.length ? ` ve ${got[0]}` : ''}`, 'bonus');
      got.push(`+${coin} coin`);
    }
    if (r.xp) { await gencoAwardXp(r.xp); got.push(`+${r.xp} XP`); }
    showToast(`${got.join(' · ')} 🎉`);
  } catch (e) {
    console.error('Günlük ödül alınamadı:', e);
    showToast('Hata: günlük ödül alınamadı');
  } finally {
    state.loginClaiming = false;
  }
  loginCalRender();
}

async function gpassRefreshBanner() {
  loginCalRender();
  // G-Pass'e yalnızca alt menüden girilir; burada rozet sayısı ve seviye bildirimi güncellenir
  const el = document.getElementById('gpb');
  if (el) el.hidden = isGuest() || !state.user?.id;
  if (isGuest() || !state.user?.id) {
    ['gn-gpass-badge', 'gn-gpass-lvl'].forEach(id => { const x = document.getElementById(id); if (x) x.hidden = true; });
    document.getElementById('gn-gpass-ring')?.style.setProperty('--p', 0);
    document.querySelector('.gn-btn-gpass')?.classList.remove('has-ready', 'is-max');
    return;
  }
  const season = await gpassLoadSeason();
  if (state.gpass.dbClaims === undefined) await gpassLoadClaims(season);
  const prog = gpassProgress(season);
  const ready = gpassReadyLevels(season, prog).length;
  el?.style.setProperty('--c1', season.c1);
  el?.style.setProperty('--c2', season.c2);
  const set = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; };
  set('gpb-lvl', prog.level);
  set('gpb-season', `${season.emoji} ${season.name}`);
  set('gpb-sub', prog.level >= GPASS_MAX ? 'Sezonu tamamladın! 👑' : `Lv ${prog.level + 1} için ${prog.per - prog.into} XP`);
  const fill = document.getElementById('gpb-fill');
  if (fill) fill.style.width = (prog.level >= GPASS_MAX ? 100 : Math.round(prog.into / prog.per * 100)) + '%';
  const badge = document.getElementById('gpb-ready');
  if (badge) { badge.hidden = !ready; badge.textContent = `${ready} ödül hazır`; }
  // Alt menüdeki G-Pass butonu: alınmayı bekleyen ödül sayısı
  const navBadge = document.getElementById('gn-gpass-badge');
  if (navBadge) { navBadge.hidden = !ready; navBadge.textContent = ready > 9 ? '9+' : ready; }
  document.querySelector('.gn-btn-gpass')?.classList.toggle('has-ready', ready > 0);
  // Halka: sezonda ne kadar ilerlendi (Level 1 → 30), altında seviye etiketi
  document.getElementById('gn-gpass-ring')?.style.setProperty('--p', Math.min(1, (prog.level - 1 + (prog.level >= GPASS_MAX ? 0 : prog.into / prog.per)) / (GPASS_MAX - 1)).toFixed(3));
  const lvlEl = document.getElementById('gn-gpass-lvl');
  if (lvlEl) {
    const max = prog.level >= GPASS_MAX;
    lvlEl.hidden = false;
    lvlEl.classList.toggle('is-max', max);
    document.querySelector('.gn-btn-gpass')?.classList.toggle('is-max', max);
    lvlEl.innerHTML = max
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l4.2 3.6L12 5.5l3.8 6.1L20 8l-1.6 9.5H5.6z"/></svg><small>MAKS</small>'
      : `<small>LV</small><b>${prog.level}</b>`;
  }

  // Seviye atladıysa bir kez haber ver
  const key = `genco_gpass_seen_${state.user.id}_${season.id}`;
  let seen = 0;
  try { seen = Number(localStorage.getItem(key) || 0); } catch {}
  if (prog.level > seen) {
    showToast(seen ? `🎟️ G-PASS LEVEL ${prog.level}! Yeni ödül açıldı 🎁` : `🎟️ Genco ${seasonLabel(season.id)} · G-Pass Level ${prog.level} ödülün hazır 🎁`);
    try { localStorage.setItem(key, String(prog.level)); } catch {}
  }
}

async function gpassLoadClaims(season) {
  try {
    state.gpass.dbClaims = await sbGetMyPassClaims(state.user.id, gpassClaimKey(season.id));
    state.gpass.dbReady = true;
  } catch (e) {
    state.gpass.dbClaims = [];
    state.gpass.dbReady = !_adminTableMissing(e) && null;
  }
}

/* ── Ödül yolu sahneleri: her bölüm bir bölge (sahil → şehir → kale → orman → festival → yıldızlar) ──
   Kuşbakışı düz çizim; büyük süsler kenarlarda, yolun geçtiği orta kısım sade kalır. */
const GPASS_ZONES = [
  { name: 'Sahil', emoji: '🏖️' },
  { name: 'Şehir', emoji: '🏙️' },
  { name: 'Kale', emoji: '🏰' },
  { name: 'Orman', emoji: '🌲' },
  { name: 'Festival', emoji: '🎉' },
  { name: 'Yıldızlar', emoji: '🌌' },
];
function gpRand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function gpassZoneSvg(i) {
  const R = gpRand(i * 97 + 13);
  const pick = a => a[Math.floor(R() * a.length)];
  const side = () => (R() < .5 ? 8 + R() * 78 : 314 + R() * 78);
  const n = v => Math.round(v * 10) / 10;
  let defs = '', g = '';
  const tree = (x, y, r, c1, c2) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${c1}"/><circle cx="${n(x - r * .25)}" cy="${n(y - r * .25)}" r="${n(r * .55)}" fill="${c2}" opacity=".7"/>`;
  const palm = (x, y) => `<g transform="translate(${x} ${y})">${[0, 60, 120, 180, 240, 300].map(a => `<ellipse rx="17" ry="6" cx="13" fill="#2f9e5b" transform="rotate(${a + 15})"/>`).join('')}<circle r="5" fill="#8a5a2b"/></g>`;
  const umbrella = (x, y, c) => `<g transform="translate(${x} ${y})"><rect x="-24" y="10" width="14" height="24" rx="3" fill="#fff" opacity=".85"/><circle r="17" fill="${c}"/>${[0, 45, 90, 135].map(a => `<path d="M0 0L17 0" stroke="#fff" stroke-width="3" stroke-opacity=".7" transform="rotate(${a})"/><path d="M0 0L17 0" stroke="#fff" stroke-width="3" stroke-opacity=".7" transform="rotate(${a + 180})"/>`).join('')}<circle r="4" fill="#fff"/></g>`;

  switch (i) {
    case 0: { // Sahil
      defs = `<linearGradient id="gz0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b4f7d"/><stop offset=".7" stop-color="#1690b8"/></linearGradient>`;
      g += `<rect width="400" height="720" fill="url(#gz0)"/>`;
      for (let k = 0; k < 26; k++) { const x = R() * 250, y = R() * 720; g += `<path d="M${n(x)} ${n(y)}q7 -6 14 0t14 0" fill="none" stroke="#c7ecff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round"/>`; }
      const shore = 'M262 -10C228 140 318 250 262 400C214 530 300 620 276 730';
      g += `<path d="${shore}" fill="none" stroke="#7fd6f0" stroke-opacity=".55" stroke-width="30"/>`;
      g += `<path d="${shore}L410 730L410 -10Z" fill="#f2d193"/>`;
      g += `<path d="${shore}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/>`;
      for (let k = 0; k < 40; k++) g += `<circle cx="${n(300 + R() * 100)}" cy="${n(R() * 720)}" r="1.4" fill="#d9b36c"/>`;
      g += umbrella(338, 110, '#fb7185') + umbrella(368, 330, '#facc15') + umbrella(330, 560, '#38bdf8') + umbrella(372, 680, '#a78bfa');
      g += palm(385, 215) + palm(352, 460) + palm(392, 610);
      g += `<g transform="translate(66 250) rotate(-18)"><path d="M-20 -3q-14 4 -26 0" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/><path d="M-18 0h36l-7 10h-22z" fill="#fff"/><path d="M0 -2v-24l15 20z" fill="#fb7185"/></g>`;
      g += `<circle cx="118" cy="560" r="10" fill="none" stroke="#fb923c" stroke-width="6"/><circle cx="118" cy="560" r="10" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="4 5.5"/>`;
      g += `<circle cx="40" cy="660" r="46" fill="#fde68a" opacity=".12"/>`;
      break;
    }
    case 1: { // Şehir
      g += `<rect width="400" height="720" fill="#23283f"/>`;
      const cols = [-20, 62, 144, 226, 308];
      for (let y = -10; y < 720; y += 92) {
        cols.forEach(x => {
          const w = 70, h = 78;
          if (R() < .16) { // park
            g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#2b6a4c"/>`;
            for (let t = 0; t < 4; t++) g += tree(x + 14 + R() * 42, y + 14 + R() * 50, 7 + R() * 5, '#23583e', '#3f8d62');
            return;
          }
          g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${pick(['#343a5c', '#3b416a', '#2e3352', '#40365f'])}"/>`;
          g += `<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="5" fill="#ffffff" opacity=".05"/>`;
          for (let d = 0; d < 5; d++) if (R() < .6) g += `<rect x="${n(x + 12 + R() * 42)}" y="${n(y + 12 + R() * 50)}" width="6" height="6" rx="1.5" fill="${pick(['#fcd34d', '#f9a8d4', '#7dd3fc'])}" opacity=".75"/>`;
        });
        g += `<path d="M0 ${y + 85}H400" stroke="#fff" stroke-opacity=".12" stroke-width="2" stroke-dasharray="10 12"/>`;
      }
      for (let k = 0; k < 7; k++) { const x = pick([56, 138, 220, 302]) + 1, y = R() * 700; g += `<rect x="${x - 4}" y="${n(y)}" width="8" height="14" rx="3" fill="${pick(['#f43f5e', '#facc15', '#38bdf8', '#fff'])}"/>`; }
      break;
    }
    case 2: { // Kale
      g += `<rect width="400" height="720" fill="#3b7547"/>`;
      for (let k = 0; k < 6; k++) { const cx = side(), cy = R() * 720; for (let r = 90; r > 10; r -= 20) g += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${r}" ry="${r * .7}" fill="none" stroke="#56935c" stroke-opacity=".6" stroke-width="2"/>`; }
      const wall = 'M44 -10L66 130L32 270L72 420L38 570L62 730';
      g += `<path d="${wall}" fill="none" stroke="#9c8762" stroke-width="20" stroke-linejoin="round"/>`;
      g += `<path d="${wall}" fill="none" stroke="#d6c39c" stroke-width="20" stroke-dasharray="7 7" stroke-linejoin="round"/>`;
      [[66, 130], [32, 270], [72, 420], [38, 570]].forEach(([x, y]) => {
        g += `<g transform="translate(${x} ${y}) rotate(12)"><rect x="-20" y="-20" width="40" height="40" rx="4" fill="#d6c39c" stroke="#9c8762" stroke-width="4"/><rect x="-10" y="-10" width="20" height="20" rx="2" fill="#9c8762"/></g>`;
      });
      g += `<path d="M38 570l-4 -30h8z" fill="#ef4444"/><path d="M42 540h16l-4 5 4 5h-16z" fill="#ef4444"/>`;
      for (let k = 0; k < 10; k++) { const x = 318 + R() * 70, y = R() * 700; g += `<g transform="translate(${n(x)} ${n(y)}) rotate(${Math.round(R() * 40 - 20)})"><rect x="-13" y="-10" width="26" height="20" rx="2" fill="#dc6b4a"/><path d="M-13 0H13" stroke="#b4533a" stroke-width="2"/></g>`; }
      for (let k = 0; k < 22; k++) g += tree(side(), R() * 720, 8 + R() * 8, '#2a5e35', '#4a8f55');
      break;
    }
    case 3: { // Orman
      g += `<rect width="400" height="720" fill="#1d4735"/>`;
      const river = 'M362 -10C300 120 392 250 342 380S382 600 332 730';
      g += `<path d="${river}" fill="none" stroke="#e6d7a8" stroke-opacity=".5" stroke-width="40"/>`;
      g += `<path d="${river}" fill="none" stroke="#2f95c0" stroke-width="30"/>`;
      g += `<path d="${river}" fill="none" stroke="#8fd9f2" stroke-opacity=".6" stroke-width="3" stroke-dasharray="14 18"/>`;
      for (let k = 0; k < 70; k++) { const x = R() < .55 ? R() * 95 : 250 + R() * 60, y = R() * 720; g += tree(x, y, 10 + R() * 12, pick(['#2a6547', '#2f7250', '#245a3f']), '#4f9d6f'); }
      for (let k = 0; k < 6; k++) g += `<ellipse cx="${n(side())}" cy="${n(R() * 720)}" rx="${n(7 + R() * 6)}" ry="${n(5 + R() * 4)}" fill="#7c8a8f"/>`;
      g += `<circle cx="70" cy="390" r="30" fill="#fb923c" opacity=".18"/><circle cx="70" cy="390" r="9" fill="#f97316"/><circle cx="70" cy="388" r="4.5" fill="#fde047"/>`;
      break;
    }
    case 4: { // Festival
      defs = `<radialGradient id="gz4" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#3b1a63"/><stop offset="1" stop-color="#1c0f35"/></radialGradient>`;
      g += `<rect width="400" height="720" fill="url(#gz4)"/>`;
      const cols = ['#f472b6', '#facc15', '#34d399', '#60a5fa', '#c084fc', '#fb923c'];
      for (let k = 0; k < 6; k++) {
        const y0 = 50 + k * 120, sag = 30 + R() * 30;
        g += `<path d="M-10 ${y0}Q200 ${y0 + sag * 2} 410 ${y0}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.5"/>`;
        for (let t = 1; t < 14; t++) {
          const u = t / 14, x = (1 - u) * (1 - u) * -10 + 2 * (1 - u) * u * 200 + u * u * 410, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (y0 + sag * 2) + u * u * y0, c = cols[(t + k) % cols.length];
          g += `<circle cx="${n(x)}" cy="${n(y)}" r="8" fill="${c}" opacity=".22"/><circle cx="${n(x)}" cy="${n(y)}" r="3.5" fill="${c}"/>`;
        }
      }
      g += `<g transform="translate(352 360)"><rect x="-44" y="-60" width="88" height="120" rx="12" fill="#2a1450" stroke="#c084fc" stroke-width="3"/><circle cy="-28" r="13" fill="#140a28" stroke="#f472b6" stroke-width="3"/><circle cy="18" r="18" fill="#140a28" stroke="#60a5fa" stroke-width="3"/></g>`;
      for (let k = 0; k < 60; k++) g += `<rect x="${n(R() * 400)}" y="${n(R() * 720)}" width="6" height="3" rx="1" fill="${pick(cols)}" opacity=".6" transform="rotate(${Math.round(R() * 180)} ${n(R() * 400)} ${n(R() * 720)})"/>`;
      [[40, 160, '#f472b6'], [26, 520, '#facc15'], [372, 610, '#34d399']].forEach(([x, y, c]) => { g += `<path d="M${x} ${y + 18}q4 16 -3 30" stroke="#fff" stroke-opacity=".5" fill="none"/><ellipse cx="${x}" cy="${y}" rx="14" ry="17" fill="${c}"/><ellipse cx="${x - 4}" cy="${y - 6}" rx="4" ry="6" fill="#fff" opacity=".45"/>`; });
      break;
    }
    default: { // Yıldızlar
      defs = `<linearGradient id="gz5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#150d38"/><stop offset="1" stop-color="#0a0820"/></linearGradient>
        <radialGradient id="gz5a"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".45"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>
        <radialGradient id="gz5b"><stop offset="0" stop-color="#ec4899" stop-opacity=".35"/><stop offset="1" stop-color="#ec4899" stop-opacity="0"/></radialGradient>
        <radialGradient id="gz5c"><stop offset="0" stop-color="#fde047" stop-opacity=".45"/><stop offset="1" stop-color="#fde047" stop-opacity="0"/></radialGradient>`;
      g += `<rect width="400" height="720" fill="url(#gz5)"/><circle cx="60" cy="140" r="150" fill="url(#gz5a)"/><circle cx="360" cy="380" r="160" fill="url(#gz5b)"/><circle cx="200" cy="660" r="200" fill="url(#gz5c)"/>`;
      for (let k = 0; k < 110; k++) g += `<circle cx="${n(R() * 400)}" cy="${n(R() * 720)}" r="${n(.6 + R() * 1.4)}" fill="#fff" opacity="${n(.3 + R() * .7)}"/>`;
      for (let k = 0; k < 8; k++) { const x = side(), y = R() * 720, s = 4 + R() * 5; g += `<path d="M${n(x)} ${n(y - s)}Q${n(x)} ${n(y)} ${n(x + s)} ${n(y)}Q${n(x)} ${n(y)} ${n(x)} ${n(y + s)}Q${n(x)} ${n(y)} ${n(x - s)} ${n(y)}Q${n(x)} ${n(y)} ${n(x)} ${n(y - s)}Z" fill="#fff"/>`; }
      g += `<g transform="translate(345 130)"><ellipse rx="44" ry="11" fill="none" stroke="#fde68a" stroke-width="4" transform="rotate(-18)"/><circle r="25" fill="#f59e0b"/><path d="M-22 -8q22 8 44 0" stroke="#fbbf24" stroke-width="4" fill="none"/><path d="M-44 11A44 11 0 0 0 44 -11" fill="none" stroke="#fde68a" stroke-width="4" transform="rotate(-18)"/></g>`;
      g += `<circle cx="52" cy="430" r="15" fill="#60a5fa"/><circle cx="47" cy="425" r="5" fill="#93c5fd" opacity=".7"/>`;
      g += `<circle cx="366" cy="560" r="20" fill="#e2e8f0"/><circle cx="360" cy="554" r="4" fill="#cbd5e1"/><circle cx="372" cy="566" r="3" fill="#cbd5e1"/>`;
      g += `<g transform="translate(50 250) rotate(35)"><path d="M0 -16q7 8 7 20h-14q0 -12 7 -20z" fill="#e2e8f0"/><circle cy="-2" r="3" fill="#60a5fa"/><path d="M-4 5l4 9 4 -9z" fill="#fb923c"/></g>`;
    }
  }
  return `<svg viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${g}</svg>`;
}

/* ── Genco Pass sayfası ── */
async function gpassOpen() {
  const road = document.getElementById('gpx-road');
  if (road && !state.gpass?.season) road.innerHTML = '<div class="tc-empty"><div class="tc-empty-icon">⏳</div><div>G-Pass yükleniyor…</div></div>';
  if (!state.submissions && state.user?.id) {
    try { state.submissions = await sbGetMySubmissions(state.user.id); } catch {}
  }
  const season = await gpassLoadSeason();
  await gpassLoadClaims(season);
  renderGpassPage(true);
  // 30. seviyeye ulaşıldıysa sezona özel rozet kendiliğinden verilir
  const prog = gpassProgress(season);
  if (prog.level >= GPASS_MAX && !gpassClaimed(season.id).has(GPASS_MAX)) gpassClaim(GPASS_MAX);
  clearInterval(state._gpassTimer);
  state._gpassTimer = setInterval(() => {
    if (state.currentPage !== 'gpass') return clearInterval(state._gpassTimer);
    const t = document.getElementById('gpx-left');
    if (t && state.gpass?.season) t.textContent = gpassTimeLeft(state.gpass.season.id);
  }, 60000);
}

function renderGpassPage(scrollToCurrent = false) {
  const page = document.getElementById('page-gpass');
  const season = state.gpass?.season;
  if (!page || !season) return;
  const prog = gpassProgress(season);
  const claimed = gpassClaimed(season.id);
  const ready = gpassReadyLevels(season, prog);
  const maxed = prog.level >= GPASS_MAX;
  page.style.setProperty('--c1', season.c1);
  page.style.setProperty('--c2', season.c2);

  const set = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; };
  set('gpx-top-sub', season.subtitle);
  set('gpx-season-sub', `GENCO ${seasonLabel(season.id).toLocaleUpperCase('tr')}`);
  set('gpx-season-name', `${season.emoji} ${season.name}`);
  set('gpx-left', gpassTimeLeft(season.id));
  set('gpx-level', prog.level);
  set('gpx-sp-tier', state.user.level || 'Bronz I');
  set('gpx-sp-xp', prog.xp.toLocaleString('tr-TR'));
  set('gpx-claimed', `${claimed.size}/${GPASS_MAX}`);
  set('gpx-road-count', `${prog.level}/${GPASS_MAX}`);
  const tierEl = document.getElementById('gpx-sp-tier-wrap');
  if (tierEl) { const [t1] = TIER_RGB[tierKey(state.user.level)] || TIER_RGB.bronz; tierEl.style.setProperty('--t1', t1); }
  set('gpx-xp', maxed ? 'Sezon tamamlandı' : `${prog.into} / ${prog.per} XP · görevlerle ilerler`);
  set('gpx-next-lvl', maxed ? 'MAKS' : `Seviye ${prog.level + 1}`);
  const fill = document.getElementById('gpx-fill');
  if (fill) fill.style.width = (maxed ? 100 : Math.round(prog.into / prog.per * 100)) + '%';
  // Halka: sezonun tamamında (Level 1 → 30) ne kadar ilerlendi
  const ring = document.getElementById('gpx-ring');
  if (ring) ring.style.strokeDashoffset = 100 - Math.round(Math.min(1, (prog.level - 1 + (maxed ? 0 : prog.into / prog.per)) / (GPASS_MAX - 1)) * 100);

  // Sıradaki ödül
  const nextEl = document.getElementById('gpx-next');
  if (nextEl) {
    if (maxed) {
      nextEl.style.setProperty('--rc', '52,211,153');
      nextEl.innerHTML = `<span class="gpx-next-ic">${gpSvg('check')}</span><span class="gpx-next-copy"><small>Tebrikler</small><b>Tüm sezon ödüllerini açtın</b></span>`;
    } else {
      const v = gpassRewardView(season.rewards[prog.level]);
      nextEl.style.setProperty('--rc', v.rgb);
      nextEl.innerHTML = `<span class="gpx-next-ic">${v.icon}</span><span class="gpx-next-copy"><small>Sıradaki ödül · Seviye ${prog.level + 1}</small><b>${v.title}</b></span><span class="gpx-next-pill">${prog.per - prog.into} XP</span>`;
    }
  }

  // Hepsini al
  const all = document.getElementById('gpx-ready');
  if (all) {
    all.hidden = !ready.length;
    all.innerHTML = `<span class="gpx-ready-ic">${gpSvg('gift')}</span><span class="gpx-ready-copy"><b>${ready.length} ödül hazır</b><small>Ulaştığın seviyelerin ödüllerini topla</small></span>
      <button type="button" id="gpx-claim-all" class="gpx-claim-all" onclick="gpassClaimAll()">Tümünü al</button>`;
  }

  // Ödül yolu: kıvrılan harita — seviyeler yol üstünde düğme, her 5 seviyede bölüm tabelası
  const road = document.getElementById('gpx-road');
  if (road) {
    const CH = 5;
    const items = [];
    const zones = [];
    let y = 20;
    const pts = [];
    season.rewards.forEach((r, i) => {
      const lvl = i + 1;
      if ((lvl - 1) % CH === 0) {
        const c = (lvl - 1) / CH;
        const got = Math.max(0, Math.min(CH, prog.level - lvl + 1));
        items.push({ kind: 'ch', y: y + 22, c, got });
        zones.push({ top: c ? y : 0 });
        y += 64;
      }
      const legend = r.type === 'legend';
      const ms = lvl % CH === 0 && !legend;
      const h = legend ? 190 : ms ? 146 : 128;
      const x = legend ? 50 : 50 + 24 * Math.sin(i * 0.9);
      const cy = y + (legend ? 58 : ms ? 46 : 40);
      pts.push({ x, y: cy });
      items.push({ kind: 'lvl', r, lvl, x, y: cy, legend, ms });
      y += h;
      if (lvl % CH === 0) zones[zones.length - 1].bottom = y;
    });
    const H = y;
    // Yumuşak eğri: noktalar arasında dikey kontrol noktalı kübik bezier
    const curve = list => list.map((p, i) => {
      if (!i) return `M${p.x} ${p.y}`;
      const q = list[i - 1], my = (q.y + p.y) / 2;
      return `C${q.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`;
    }).join(' ');
    const done = pts.slice(0, Math.max(1, prog.level));
    const me = state.user || {};
    const avatar = me.profilePhoto
      ? `<i style="background-image:url('${escHtml(me.profilePhoto)}')"></i>`
      : `<i>${escHtml((me.name || me.username || 'S').trim().charAt(0).toLocaleUpperCase('tr'))}</i>`;

    road.style.height = H + 'px';
    road.innerHTML = `
      ${zones.map((z, c) => `<div class="gpx-zone gpx-zone-${c}" style="top:${c ? z.top - 50 : 0}px;height:${Math.min(H, (z.bottom || H) + 50) - (c ? z.top - 50 : 0)}px">${gpassZoneSvg(c)}</div>`).join('')}
      <svg class="gpx-path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="gpxPathGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:rgb(var(--c1))"/><stop offset="1" style="stop-color:rgb(var(--c2))"/></linearGradient></defs>
        <path class="gpx-path-edge" d="${curve(pts)}" vector-effect="non-scaling-stroke"/>
        <path class="gpx-path-bg" d="${curve(pts)}" vector-effect="non-scaling-stroke"/>
        <path class="gpx-path-dash" d="${curve(pts)}" vector-effect="non-scaling-stroke"/>
        ${done.length > 1 ? `<path class="gpx-path-on" d="${curve(done)}" vector-effect="non-scaling-stroke"/>` : ''}
      </svg>
      ${items.map(it => {
        if (it.kind === 'ch') {
          const st = it.got >= CH ? 'is-done' : it.got > 0 ? 'is-current' : 'is-locked';
          return `<div class="gpx-sign ${st}" style="top:${it.y}px">
            <i>${GPASS_ZONES[it.c]?.emoji || ''}</i><span><small>Bölüm ${it.c + 1}</small>${GPASS_ZONES[it.c]?.name || ''}</span><em>${it.got >= CH ? gpSvg('check') : ''}${it.got}/${CH}</em>
          </div>`;
        }
        const { r, lvl, legend, ms } = it;
        const v = gpassRewardView(r);
        const isClaimed = claimed.has(lvl);
        const reached = lvl <= prog.level;
        const st = isClaimed ? 'is-claimed' : reached ? 'is-ready' : 'is-locked';
        const isNext = lvl === prog.level + 1;
        const label = isClaimed ? 'Alındı'
          : reached ? 'Dokun, al!'
          : isNext ? `${prog.per - prog.into} XP kaldı`
          : `Seviye ${lvl}`;
        const tag = legend ? '<b class="gpx-n-tag">FİNAL</b>' : ms ? '<b class="gpx-n-tag">ÖZEL</b>' : '';
        const corner = isClaimed ? `<span class="gpx-n-mark is-ok">${gpSvg('check')}</span>`
          : !reached ? `<span class="gpx-n-mark">${gpSvg('lock')}</span>` : '';
        return `<div class="gpx-stop ${st}${ms ? ' is-ms' : ''}${legend ? ' is-legend' : ''}${isNext ? ' is-next' : ''}" id="gpx-step-${lvl}" style="--rc:${v.rgb};left:${it.x}%;top:${it.y}px">
          <button type="button" class="gpx-n${reached && !isClaimed ? ' gpx-claim' : ''}" onclick="gpassNodeTap(${lvl})" aria-label="Seviye ${lvl}: ${v.title.replace(/"/g, '')}">
            ${tag}<span class="gpx-n-ic">${v.icon}</span>${corner}<span class="gpx-n-no">${lvl}</span>
          </button>
          ${lvl === prog.level ? `<span class="gpx-me" title="Buradasın">${avatar}</span>` : ''}
          <span class="gpx-n-lbl"><b>${v.title}</b><small>${label}</small></span>
        </div>`;
      }).join('')}`;

    if (scrollToCurrent) {
      const target = document.getElementById(`gpx-step-${Math.max(1, Math.min(GPASS_MAX, ready[0] || prog.level))}`);
      if (target) setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    }
  }

  renderSeasonHistory('gpx-history');
}

/* ── Sezon geçmişi: eski sezonların Kademe / G-Pass / XP özeti ── */
function renderSeasonHistory(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const hist = state.user?.cosmetics?.season?.history || [];
  el.hidden = !hist.length;
  if (!hist.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<h3 class="gpx-h">Sezon geçmişi<span>${hist.length}</span></h3>` + hist.map(h => {
    const [t1, t2] = TIER_RGB[tierKey(h.tier)] || TIER_RGB.bronz;
    return `<div class="sh-row" style="--t1:${t1};--t2:${t2}">
      <span class="sh-no"><small>SEZON</small><b>${h.no}</b></span>
      <span class="sh-copy"><b>${escHtml(h.emoji || '')} ${escHtml(h.name)}</b><small>${h.tasks} görev · ${h.rewards} ödül</small></span>
      <span class="sh-stats">
        <span class="sh-tier">${escHtml(h.tier)}</span>
        <small>G-Pass ${h.pass} · ${Number(h.xp).toLocaleString('tr-TR')} XP</small>
      </span>
    </div>`;
  }).join('');
}

/* ═══ ADMIN · Genco Pass ═══ */
const GPASS_ADMIN_TYPES = ['coin', 'xp', 'title', 'badge', 'frame', 'cosmetic', 'surprise'];

function _gpaFields(r, i) {
  const inp = (f, ph, val, type = 'text') => `<input class="gpa-in" data-i="${i}" data-f="${f}" type="${type}" placeholder="${ph}" value="${escHtml(val ?? '')}">`;
  if (r.type === 'legend') return inp('emoji', 'Simge', r.emoji) + inp('name', 'Efsane rozet adı', r.name);
  switch (r.type) {
    case 'coin': case 'xp': return inp('amount', 'Miktar', r.amount, 'number');
    case 'title': case 'badge': return inp('emoji', 'Simge', r.emoji) + inp('name', r.type === 'title' ? 'Unvan' : 'Rozet adı', r.name);
    case 'frame': return `<select class="gpa-in" data-i="${i}" data-f="key">${PASS_FRAMES.map(f => `<option value="${f.key}" ${f.key === r.key ? 'selected' : ''}>${escHtml(f.name)}</option>`).join('')}</select>`;
    case 'cosmetic': return `<select class="gpa-in" data-i="${i}" data-f="id">${COSMETICS.filter(c => c.type === 'card_bg').map(c => `<option value="${c.id}" ${c.id === r.id ? 'selected' : ''}>${c.emoji} ${escHtml(c.name)}</option>`).join('')}</select>`;
    default: return '<span class="gpa-muted">Açınca rastgele coin ya da XP çıkar</span>';
  }
}

function _gpaRow(r, i) {
  const lvl = i + 1;
  const typeSel = r.type === 'legend'
    ? '<span class="gpa-fixed">Sezon rozeti</span>'
    : `<select class="gpa-type" data-i="${i}" onchange="gpaTypeChange(this)">${GPASS_ADMIN_TYPES.map(t => `<option value="${t}" ${t === r.type ? 'selected' : ''}>${GPASS_TYPES[t].label}</option>`).join('')}</select>`;
  return `<div class="gpa-row ${lvl % 5 === 0 ? 'is-ms' : ''}" id="gpa-row-${i}"><span class="gpa-lvl">${lvl}</span>${typeSel}<span class="gpa-fields">${_gpaFields(r, i)}</span></div>`;
}

async function loadAdminGpass() {
  const box = document.getElementById('adm-gpass');
  if (!box) return;
  box.innerHTML = _adminEmpty('⏳', 'Yükleniyor…');
  const season = await gpassLoadSeason(true);
  await gpassLoadClaims(season);
  state.gpaDraft = season.rewards.map(r => ({ ...r }));
  let stats = null, missing = false;
  try { stats = await sbGetPassClaimsForSeason(season.id); }
  catch (e) { missing = _adminTableMissing(e); }
  const users = stats ? new Set(stats.map(c => c.user_id)).size : 0;
  const finishers = stats ? stats.filter(c => Number(c.level) === GPASS_MAX).length : 0;

  box.innerHTML = `
    ${missing ? _adminSetupNotice('genco_pass.sql') : ''}
    <div class="gpa-stats">
      <div><b>${season.id}</b><small>Aktif sezon · ${escHtml(gpassTimeLeft(season.id))}</small></div>
      <div><b>${stats ? stats.length : '—'}</b><small>Alınan ödül</small></div>
      <div><b>${stats ? users : '—'}</b><small>Katılan üye</small></div>
      <div><b>${stats ? finishers : '—'}</b><small>Sezonu bitiren</small></div>
    </div>
    <div class="ad-card gpa-form">
      <label>Sezon adı<input id="gpa-name" value="${escHtml(season.name)}"></label>
      <label>Alt başlık<input id="gpa-sub" value="${escHtml(season.subtitle)}"></label>
      <label>Taban seviye XP'si<input id="gpa-xp" type="number" min="20" max="2000" value="${season.xpPerLevel}"></label>
      <p class="gpa-note">G-Pass yalnızca bu sezon onaylanan görevlerin XP'siyle ilerler (rozet, çark gibi tek seferlik XP sayılmaz). Seviye maliyeti tabanın %80'inden başlar, son seviyede %160'ına çıkar (günde ~160 XP ile 1–2 seviye); Level 30 için toplam ${gpassXpForLevel(GPASS_MAX, season.xpPerLevel).toLocaleString('tr-TR')} görev XP'si gerekir (günde 160 XP ≈ ${Math.ceil(gpassXpForLevel(GPASS_MAX, season.xpPerLevel) / 160)}. gün).
      ${season.custom ? '' : '<br><b>Bu ay için kayıtlı ayar yok, varsayılan sezon gösteriliyor.</b>'}</p>
    </div>
    <div class="ad-card gpa-test">
      <span><b>Test: kendi XP'ni sıfırla</b><small>Senin hesabının XP'si ${Number(state.user.xp || 0).toLocaleString('tr-TR')} · Kademe Bronz I'e döner (G-Pass görev XP'siyle ilerlediği için etkilenmez). Coin ve ödüller kalır.</small></span>
      <button type="button" class="gpa-btn-sec" id="gpa-reset-xp" onclick="gpaResetMyXp()">XP'mi sıfırla</button>
    </div>
    <div class="ad-card gpa-test">
      <span><b>Test: G-Pass'ini sıfırla</b><small>Şu an Level ${gpassProgress(season).level} · ${gpassProgress(season).xp.toLocaleString('tr-TR')} görev XP'si. Pass Level 1'e döner (şu ana kadar onaylanan görevler sayılmaz) ve alınan ödüllerin kaydı silinir. Kazandığın rozet, çerçeve ve coinler sende kalır.</small></span>
      <button type="button" class="gpa-btn-sec" id="gpa-reset-pass" onclick="gpaResetMyPass()">Pass'imi sıfırla</button>
    </div>
    <div class="ad-card gpa-test">
      <span><b>Test: bu sezonki G-Pass ödüllerini sıfırla</b><small>Aldığın ${gpassClaimed(season.id).size} ödülün kaydı silinir, seviyelere ulaşınca yeniden alabilirsin. Önceden kazandığın rozet, çerçeve ve coinler sende kalır.</small></span>
      <button type="button" class="gpa-btn-sec" id="gpa-reset-claims" onclick="gpaResetMyClaims()">Ödülleri sıfırla</button>
    </div>
    <div class="ad-label">30 SEVİYE ÖDÜLLERİ</div>
    <div class="gpa-rows" id="gpa-rows">${state.gpaDraft.map(_gpaRow).join('')}</div>
    <div class="gpa-actions">
      <button type="button" class="gpa-btn-sec" onclick="gpaReset()">Varsayılana döndür</button>
      <button type="button" class="gpa-btn" id="gpa-save" onclick="gpaSave()">Sezonu kaydet</button>
    </div>`;
}

function _gpaCollect() {
  document.querySelectorAll('#gpa-rows .gpa-in').forEach(el => {
    const r = state.gpaDraft[Number(el.dataset.i)];
    if (!r) return;
    r[el.dataset.f] = el.type === 'number' ? Number(el.value) : el.value.trim();
  });
}

// Admin test aracı: giriş yapan hesabın XP'sini ve sezon başlangıcını sıfırlar
async function gpaResetMyXp() {
  if (!state.user?.id) return;
  if (!confirm('Kendi XP\'n 0 yapılacak (Kademe Bronz I, G-Pass Level 1). Emin misin?')) return;
  const btn = document.getElementById('gpa-reset-xp');
  if (btn) { btn.disabled = true; btn.textContent = 'Sıfırlanıyor…'; }
  try {
    await sbUpdateStats(state.user.id, { xp: 0, level: 'Bronz I' });
    await saveBadgeCosmetics({ season: { ...(state.user.cosmetics?.season || {}), id: gpassSeasonId(), startXp: 0, days: {} } });
    const st = await sbGetStats(state.user.id);
    if (Number(st?.xp) !== 0) throw new Error(`veritabanı XP'yi kabul etmedi (şu an ${st?.xp})`);
    try { localStorage.removeItem(`genco_gpass_seen_${state.user.id}_${gpassSeasonId()}`); } catch {}
    await refreshUserStats();
    state.user.level = 'Bronz I';
    rememberLevel(state.user.id, state.user.level);
    gpassRefreshBanner();
    showToast('XP sıfırlandı · sayfa yenileniyor');
    setTimeout(() => location.reload(), 900);
  } catch (e) {
    console.error('XP sıfırlanamadı:', e);
    showToast('Hata: ' + (e.message || 'XP sıfırlanamadı'));
    if (btn) { btn.disabled = false; btn.textContent = 'XP\'mi sıfırla'; }
  }
}

// Admin test aracı: giriş yapan hesabın bu sezonki G-Pass ödül kayıtlarını siler
// Admin test aracı: kendi G-Pass seviyeni Level 1'e döndürür ve ödül kayıtlarını siler
async function gpaResetMyPass() {
  if (!state.user?.id) return;
  const id = gpassSeasonId();
  if (!confirm("G-Pass'in Level 1'e dönecek ve bu sezon aldığın ödüllerin kaydı silinecek. Emin misin?")) return;
  const btn = document.getElementById('gpa-reset-pass');
  if (btn) { btn.disabled = true; btn.textContent = 'Sıfırlanıyor…'; }
  try {
    try { await sbDeletePassClaims(state.user.id, gpassClaimKey(id)); } catch {}
    const inv = gpassInv();
    const claims = { ...inv.claims };
    delete claims[gpassClaimKey(id)];
    const resets = { ...inv.resets, [id]: (Number(inv.resets[id]) || 0) + 1 };
    const passFrom = { ...(state.user.cosmetics?.gpass?.passFrom || {}), [id]: new Date().toISOString() };
    await saveBadgeCosmetics({ gpass: { ...(state.user.cosmetics?.gpass || {}), claims, resets, passFrom } });
    try { localStorage.removeItem(`genco_gpass_seen_${state.user.id}_${id}`); } catch {}
    const season = state.gpass?.season || await gpassLoadSeason();
    await gpassLoadClaims(season);
    if (gpassProgress(season).level !== 1) throw new Error('sıfırlama kaydedilemedi');
    showToast('G-Pass sıfırlandı · Level 1');
    await gpassRefreshBanner();
    loadAdminGpass();
  } catch (e) {
    console.error('G-Pass sıfırlanamadı:', e);
    showToast('Hata: ' + (e.message || 'sıfırlanamadı'));
    if (btn) { btn.disabled = false; btn.textContent = 'Pass\x27imi sıfırla'; }
  }
}

async function gpaResetMyClaims() {
  if (!state.user?.id) return;
  const id = gpassSeasonId();
  if (!confirm('Bu sezon aldığın G-Pass ödüllerinin kaydı silinecek ve seviyelere ulaşınca yeniden alabileceksin. Emin misin?')) return;
  const btn = document.getElementById('gpa-reset-claims');
  if (btn) { btn.disabled = true; btn.textContent = 'Sıfırlanıyor…'; }
  try {
    // Admin silme izni varsa eski kayıtları da temizle; yoksa sorun değil, yeni anahtarla yok sayılırlar
    try { await sbDeletePassClaims(state.user.id, gpassClaimKey(id)); } catch {}
    const inv = gpassInv();
    const claims = { ...inv.claims };
    delete claims[gpassClaimKey(id)];
    const resets = { ...inv.resets, [id]: (Number(inv.resets[id]) || 0) + 1 };
    await saveBadgeCosmetics({ gpass: { ...(state.user.cosmetics?.gpass || {}), claims, resets } });
    await gpassLoadClaims(state.gpass?.season || await gpassLoadSeason());
    if (gpassClaimed(id).size) throw new Error('sıfırlama kaydedilemedi');
    showToast('G-Pass ödülleri sıfırlandı');
    await gpassRefreshBanner();
    loadAdminGpass();
  } catch (e) {
    console.error('G-Pass ödülleri sıfırlanamadı:', e);
    showToast('Hata: ' + (e.message || 'sıfırlanamadı'));
    if (btn) { btn.disabled = false; btn.textContent = 'Ödülleri sıfırla'; }
  }
}

function gpaTypeChange(sel) {
  _gpaCollect();
  const i = Number(sel.dataset.i);
  state.gpaDraft[i] = { type: sel.value };
  if (sel.value === 'frame') state.gpaDraft[i].key = PASS_FRAMES[0].key;
  if (sel.value === 'cosmetic') state.gpaDraft[i].id = COSMETICS.find(c => c.type === 'card_bg')?.id;
  document.getElementById(`gpa-row-${i}`).outerHTML = _gpaRow(state.gpaDraft[i], i);
}

function gpaReset() {
  state.gpaDraft = gpassDefaultRewards(gpassSeasonId());
  document.getElementById('gpa-rows').innerHTML = state.gpaDraft.map(_gpaRow).join('');
  showToast('Varsayılan ödüller yüklendi, kaydetmeyi unutma');
}

async function gpaSave() {
  _gpaCollect();
  const bad = state.gpaDraft.findIndex(r =>
    ((r.type === 'coin' || r.type === 'xp') && !(r.amount > 0)) ||
    ((r.type === 'title' || r.type === 'badge' || r.type === 'legend') && !r.name));
  if (bad >= 0) { showToast(`Geçersiz: ${bad + 1}. seviyenin bilgileri eksik`); return; }
  const btn = document.getElementById('gpa-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor…'; }
  try {
    await sbUpsertPassSeason({
      id: gpassSeasonId(),
      name: document.getElementById('gpa-name').value.trim() || gpassBaseSeason(gpassSeasonId()).name,
      subtitle: document.getElementById('gpa-sub').value.trim(),
      xp_per_level: Math.min(2000, Math.max(20, Number(document.getElementById('gpa-xp').value) || GPASS_DEFAULT_XP)),
      rewards: state.gpaDraft,
      updated_by: state.user.id,
      updated_at: new Date().toISOString(),
    });
    showToast('Genco Pass sezonu kaydedildi');
    loadAdminGpass();
  } catch (e) {
    showToast(_adminTableMissing(e) ? 'Hata: önce genco_pass.sql dosyasını çalıştır' : 'Hata: ' + (e.message || 'kaydedilemedi'));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sezonu kaydet'; }
  }
}
