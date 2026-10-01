const SUPABASE_URL = 'https://sjhbkopllhuprmkujqii.supabase.co';
const SUPABASE_KEY = 'sb_publishable_emdcjlhX2GD5T8bKnArY4A_Z7RNtVT4';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── AUTH HELPERS ─── */

async function sbLogin(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function sbRegister(email, password, meta) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: meta }
  });
  if (error) throw error;

  // profiles satırı sunucu tarafındaki trigger ile oluşuyor ama trigger henüz
  // "phone" kolonunu haritalamıyor — burada ayrıca yazıyoruz ki kayıt formundaki
  // telefon numarası kaybolmasın.
  if (meta?.phone && data?.user?.id) {
    try {
      await sb.from('profiles').update({ phone: meta.phone }).eq('id', data.user.id);
    } catch (profileErr) {
      console.warn('Telefon numarası profile yazılamadı:', profileErr);
    }
  }

  return data;
}

async function sbLogout() {
  await sb.auth.signOut();
}

async function sbGetSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function sbResendConfirmationEmail(email) {
  const { error } = await sb.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

async function sbSendPasswordReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  if (error) throw error;
}

async function sbUpdatePassword(newPassword) {
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/* ─── PROFILE HELPERS ─── */ 

async function sbFindEmailByUsername(username) {
  const { data, error } = await sb
    .from('profiles')
    .select('id, email, username')
    .eq('username', username.trim())
    .single();
  if (error) throw error;
  return data;
}

async function sbGetProfile(userId) {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function sbUpdateProfile(userId, updates) {
  const { error } = await sb
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

async function sbGetStats(userId) {
  const { data, error } = await sb
    .from('user_stats')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function sbUpdateStats(userId, updates) {
  const { error } = await sb
    .from('user_stats')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

/* ─── TASKS ─── */

async function sbGetTasks() {
  const { data, error } = await sb
    .from('tasks')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function sbCreateTask(task) {
  const { data, error } = await sb.from('tasks').insert(task).select().single();
  if (error) throw error;
  return data;
}

async function sbUpdateTask(taskId, updates) {
  const { error } = await sb.from('tasks').update(updates).eq('id', taskId);
  if (error) throw error;
}

async function sbDeleteTask(taskId) {
  const { error } = await sb.from('tasks').update({ is_active: false }).eq('id', taskId);
  if (error) throw error;
}

/* ─── TASK SUBMISSIONS ─── */

async function sbGetMySubmissions(userId) {
  const { data, error } = await sb
    .from('task_submissions')
    .select('*, tasks(title, emoji, coin_reward, xp_reward, category)')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function sbGetAllSubmissions() {
  const { data, error } = await sb
    .from('task_submissions')
    .select('*, tasks(title, emoji, coin_reward, xp_reward), profiles!task_submissions_user_id_fkey(username, full_name, profile_photo_url)')
    .order('submitted_at', { ascending: false });
  if (error) {
    console.error('sbGetAllSubmissions error:', error);
    throw error;
  }
  return data;
}

async function sbSubmitTask(submission) {
  const { data, error } = await sb
    .from('task_submissions')
    .insert(submission)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function sbApproveSubmission(submissionId, adminId) {
  const { data, error } = await sb
    .from('task_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: adminId })
    .eq('id', submissionId)
    .select('*, tasks(coin_reward, xp_reward), user_id')
    .single();
  if (error) throw error;
  return data;
}

async function sbRejectSubmission(submissionId, adminId, reason) {
  const { error } = await sb
    .from('task_submissions')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      rejection_reason: reason
    })
    .eq('id', submissionId);
  if (error) throw error;
}

/* ─── REWARDS ─── */

async function sbGetRewards() {
  const { data, error } = await sb
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('coin_cost', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbCreateReward(reward) {
  const { data, error } = await sb.from('rewards').insert(reward).select().single();
  if (error) throw error;
  return data;
}

async function sbUpdateReward(rewardId, updates) {
  const { error } = await sb.from('rewards').update(updates).eq('id', rewardId);
  if (error) throw error;
}

async function sbDeleteReward(rewardId) {
  const { error } = await sb.from('rewards').update({ is_active: false }).eq('id', rewardId);
  if (error) throw error;
}

async function sbUploadRewardImage(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('reward-images').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('reward-images').getPublicUrl(path);
  return data.publicUrl;
}

async function sbRedeemReward(userId, rewardId) {
  const { data, error } = await sb
    .from('reward_redemptions')
    .insert({ user_id: userId, reward_id: rewardId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ─── LEADERBOARD ─── */

async function sbGetLeaderboard() {
  const { data, error } = await sb
    .from('user_stats')
    .select('id, xp, coin, gcoin, level, profiles(username, full_name, team, profile_photo_url, equipped_cosmetics)')
    .order('xp', { ascending: false })
    .limit(300);
  if (error) throw error;
  return data;
}

/* ─── NOTIFICATIONS ─── */

async function sbGetNotifications(userId) {
  const { data, error } = await sb
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

async function sbMarkNotifRead(notifId) {
  await sb.from('notifications').update({ is_read: true }).eq('id', notifId);
}

async function sbClearAllNotifications(userId) {
  const { error, count } = await sb.from('notifications').delete({ count: 'exact' }).eq('user_id', userId);
  if (error) throw error;
  return count;
}

/* Henüz kurulmamış tablolar (PGRST205): 404 aldıktan sonra 1 dakika tekrar istek atılmaz, konsol 404 ile
   dolmaz; SQL sonradan çalıştırılırsa sayfa yenilenmeden toparlanır. Çağıranlar yine hata alır ve kendi varsayılanlarıyla devam eder. */
const _sbMissingTables = new Map(); // tablo → 404 zamanı
const SB_MISSING_RETRY_MS = 60000;
function _sbGuard(table) {
  const at = _sbMissingTables.get(table);
  if (at && Date.now() - at > SB_MISSING_RETRY_MS) _sbMissingTables.delete(table);
  else if (at) { const e = new Error(table + ' tablosu kurulu değil'); e.code = 'PGRST205'; throw e; }
}
function _sbCheck(table, error) {
  if (!error) return;
  if (error.code === 'PGRST205') _sbMissingTables.set(table, Date.now());
  throw error;
}

/* ─── GENCO PASS ─── */
async function sbGetPassSeason(seasonId) {
  _sbGuard('genco_pass_seasons');
  const { data, error } = await sb.from('genco_pass_seasons').select('*').eq('id', seasonId).maybeSingle();
  _sbCheck('genco_pass_seasons', error);
  return data;
}

async function sbUpsertPassSeason(row) {
  _sbGuard('genco_pass_seasons');
  const { error } = await sb.from('genco_pass_seasons').upsert(row);
  _sbCheck('genco_pass_seasons', error);
}

async function sbGetMyPassClaims(userId, seasonId) {
  _sbGuard('genco_pass_claims');
  const { data, error } = await sb.from('genco_pass_claims')
    .select('level, reward, claimed_at').eq('user_id', userId).eq('season_id', seasonId);
  _sbCheck('genco_pass_claims', error);
  return data || [];
}

// Aynı seviye iki kez alınırsa benzersizlik kısıtı 23505 hatası döner
async function sbInsertPassClaim(row) {
  _sbGuard('genco_pass_claims');
  const { error } = await sb.from('genco_pass_claims').insert(row);
  _sbCheck('genco_pass_claims', error);
}

// Admin test aracı: bir üyenin bir sezondaki ödül kayıtlarını siler (RLS: yalnızca admin)
async function sbDeletePassClaims(userId, seasonId) {
  _sbGuard('genco_pass_claims');
  const { error } = await sb.from('genco_pass_claims').delete().eq('user_id', userId).eq('season_id', seasonId);
  _sbCheck('genco_pass_claims', error);
}

async function sbGetPassClaimsForSeason(seasonId) {
  _sbGuard('genco_pass_claims');
  const { data, error } = await sb.from('genco_pass_claims')
    .select('user_id, level, claimed_at').eq('season_id', seasonId);
  _sbCheck('genco_pass_claims', error);
  return data || [];
}

async function sbAddNotification(userId, title, message, type) {
  await sb.from('notifications').insert({ user_id: userId, title, message, type });
}

/* ─── ADMIN ─── */

async function sbGetAllUsers() {
  const { data, error } = await sb
    .from('profiles')
    .select('*, user_stats(xp, coin, level, tasks_completed, streak)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function sbGetAdmins() {
  const { data, error } = await sb
    .from('profiles')
    .select('*, user_stats(xp, coin, tasks_completed)')
    .eq('role', 'admin')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbSetUserRoleByEmail(email, role) {
  // auth.users'dan ID'yi RPC ile bul
  const { data: userId, error: rpcErr } = await sb.rpc('find_profile_id_by_email', { p_email: email.trim().toLowerCase() });
  if (rpcErr) throw rpcErr;
  if (!userId) throw new Error('Bu e-posta ile kayıtlı kullanıcı bulunamadı');

  // profiles tablosunu ID ile güncelle
  const { error: updateErr } = await sb
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  if (updateErr) throw updateErr;

  // Güncel profili döndür
  const { data: profile } = await sb
    .from('profiles')
    .select('id, username, full_name')
    .eq('id', userId)
    .single();
  return profile || { id: userId };
}

async function sbSuspendUser(userId, suspended) {
  const { error } = await sb.from('profiles').update({ is_suspended: suspended }).eq('id', userId);
  if (error) throw error;
}

async function sbDeleteUserProfile(userId) {
  const { error } = await sb.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

async function sbAdminGiveBonus(userId, coinDelta, xpDelta) {
  const { error } = await sb.rpc('admin_give_bonus', {
    target_user_id: userId,
    coin_delta: coinDelta,
    xp_delta: xpDelta
  });
  if (error) throw error;
}

async function sbAdminSendNotif(userId, title, message, type) {
  const { error } = await sb.rpc('admin_send_notification', {
    target_user_id: userId,
    notif_title: title,
    notif_message: message,
    notif_type: type || 'admin_message'
  });
  if (error) throw error;
}

/* ─── FRIENDS ─── */

async function sbFindUserByCode(code) {
  const { data, error } = await sb
    .from('profiles')
    .select('id, username, full_name, team, emoji_status, bio, friend_code, profile_photo_url, profile_theme, equipped_cosmetics, user_stats(xp, level, tasks_completed, streak)')
    .eq('friend_code', code.trim())
    .single();
  if (error) throw error;
  return data;
}

async function sbGetFriends(userId) {
  const [sent, recv] = await Promise.all([
    sb.from('friendships').select('addressee_id, created_at').eq('requester_id', userId),
    sb.from('friendships').select('requester_id, created_at').eq('addressee_id', userId)
  ]);
  if (sent.error) throw sent.error;
  if (recv.error) throw recv.error;
  // Arkadaş id → arkadaşlık tarihi (iki yönlü kayıt olursa en eskisi)
  const since = {};
  (sent.data || []).forEach(f => { since[f.addressee_id] = since[f.addressee_id] && since[f.addressee_id] < f.created_at ? since[f.addressee_id] : f.created_at; });
  (recv.data || []).forEach(f => { since[f.requester_id] = since[f.requester_id] && since[f.requester_id] < f.created_at ? since[f.requester_id] : f.created_at; });
  const ids = Object.keys(since).filter(id => id !== userId);
  if (!ids.length) return [];
  const { data, error } = await sb
    .from('profiles')
    .select('id, username, full_name, team, emoji_status, bio, friend_code, profile_photo_url, profile_theme, equipped_cosmetics, user_stats(xp, level, tasks_completed, streak)')
    .in('id', ids);
  if (error) throw error;
  return (data || []).map(p => ({ ...p, friend_since: since[p.id] || null }));
}

async function sbCheckFriendship(userId, friendId) {
  const { data } = await sb
    .from('friendships')
    .select('id')
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
    .limit(1);
  return !!(data && data.length);
}

async function sbAddFriend(requesterId, addresseeId) {
  const { error } = await sb
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId });
  if (error) throw error;
}

async function sbRemoveFriend(userId, friendId) {
  const results = await Promise.all([
    sb.from('friendships').delete().eq('requester_id', userId).eq('addressee_id', friendId),
    sb.from('friendships').delete().eq('requester_id', friendId).eq('addressee_id', userId)
  ]);
  const err = results.find(r => r.error)?.error;
  if (err) throw err;
}

async function sbSendFriendRequest(requesterId, addresseeId) {
  const { data: req } = await sb
    .from('profiles')
    .select('username, full_name')
    .eq('id', requesterId)
    .single();
  const name = req?.full_name || req?.username || 'Bir kullanıcı';
  await sb.from('notifications').insert({
    user_id: addresseeId,
    title: 'Arkadaşlık İsteği 👥',
    message: JSON.stringify({ text: `${name} sana arkadaşlık isteği gönderdi.`, requesterId, requesterName: name }),
    type: 'friend_request',
    is_read: false
  });
}

// Arkadaşlık isteği kartları için gönderenlerin temel profil bilgileri
async function sbGetBasicProfiles(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length) return [];
  const { data, error } = await sb
    .from('profiles')
    .select('id, username, full_name, profile_photo_url')
    .in('id', unique);
  if (error) throw error;
  return data || [];
}

/* ─── İŞLETME YORUMLARI & PUANLARI ───
   Tablo: partner_reviews (bkz. partner_reviews.sql). Her kullanıcı bir işletmeye
   tek yorum bırakır; tekrar gönderince güncellenir. */

async function sbGetPartnerReviews(partnerName) {
  const { data, error } = await sb
    .from('partner_reviews')
    .select('id, partner_name, user_id, rating, comment, created_at, updated_at, profiles(username, full_name, profile_photo_url)')
    .eq('partner_name', partnerName)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function sbGetPartnerRatings() {
  const { data, error } = await sb.from('partner_reviews').select('partner_name, rating');
  if (error) throw error;
  return data || [];
}

async function sbUpsertPartnerReview(review) {
  const { error } = await sb
    .from('partner_reviews')
    .upsert({ ...review, updated_at: new Date().toISOString() }, { onConflict: 'partner_name,user_id' });
  if (error) throw error;
}

async function sbDeletePartnerReview(partnerName, userId) {
  const { error } = await sb.from('partner_reviews').delete().eq('partner_name', partnerName).eq('user_id', userId);
  if (error) throw error;
}

/* ─── PARTNERS (İŞ ORTAKLARI) ─── */

async function sbGetPartners() {
  const { data, error } = await sb
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbCreatePartner(partner) {
  const { data, error } = await sb.from('partners').insert(partner).select().single();
  if (error) throw error;
  return data;
}

async function sbUpdatePartner(partnerId, updates) {
  const { error } = await sb.from('partners').update(updates).eq('id', partnerId);
  if (error) throw error;
}

async function sbUploadPartnerLogo(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('partner-logos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from('partner-logos').getPublicUrl(path);
  return data.publicUrl;
}

async function sbDeletePartner(partnerId) {
  const { error } = await sb.from('partners').update({ is_active: false }).eq('id', partnerId);
  if (error) throw error;
}

/* ─── EVENTS (ETKİNLİKLER) ─── */

async function sbGetEvents() {
  const { data, error } = await sb
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbCreateEvent(event) {
  const { data, error } = await sb.from('events').insert(event).select().single();
  if (error) throw error;
  return data;
}

async function sbDeleteEvent(eventId) {
  const { error } = await sb.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

/* ─── GENCO LİG (ALANYA İÇİ HALISAHA TURNUVASI) ─── */

async function sbCreateLeagueTeam(team) {
  const { data, error } = await sb.from('league_teams').insert(team).select().single();
  if (error) throw error;
  return data;
}

async function sbGetLeagueTeams() {
  const { data, error } = await sb
    .from('league_teams')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbDeleteLeagueTeam(teamId) {
  const { error } = await sb.from('league_teams').delete().eq('id', teamId);
  if (error) throw error;
}

/* ─── ADMIN İÇERİKLERİ: KONSERLER, HABERLER, TÜM YORUMLAR (bkz. admin_content.sql) ─── */

async function sbGetConcerts() {
  const { data, error } = await sb.from('genco_concerts').select('*').order('event_date', { ascending: true });
  if (error) throw error;
  return data || [];
}
async function sbSaveConcert(row, id) {
  const q = id ? sb.from('genco_concerts').update(row).eq('id', id) : sb.from('genco_concerts').insert(row);
  const { error } = await q;
  if (error) throw error;
}
async function sbDeleteConcert(id) {
  const { error } = await sb.from('genco_concerts').delete().eq('id', id);
  if (error) throw error;
}

async function sbGetNews() {
  const { data, error } = await sb.from('genco_news').select('*').order('news_date', { ascending: false });
  if (error) throw error;
  return data || [];
}
async function sbSaveNews(row, id) {
  const q = id ? sb.from('genco_news').update(row).eq('id', id) : sb.from('genco_news').insert(row);
  const { error } = await q;
  if (error) throw error;
}
async function sbDeleteNews(id) {
  const { error } = await sb.from('genco_news').delete().eq('id', id);
  if (error) throw error;
}

async function sbGetAllPartnerReviews() {
  const { data, error } = await sb
    .from('partner_reviews')
    .select('id, partner_name, user_id, rating, comment, updated_at, profiles(username, full_name)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
async function sbAdminDeleteReview(id) {
  const { error } = await sb.from('partner_reviews').delete().eq('id', id);
  if (error) throw error;
}

/* ─── DELETE USER ALL DATA ─── */

async function sbDeleteUserAllData(userId) {
  const { error } = await sb.rpc('admin_delete_user', { target_user_id: userId });
  if (error) throw new Error('Kullanıcı silinemedi: ' + error.message);
}

/* ─── ADMIN DAILY OVERVIEW ─── */

async function sbGetAllDailyTasksToday() {
  const today = localDateKey();
  const { data, error } = await sb
    .from('user_daily_tasks')
    .select('user_id, task_id, profiles(id, username, full_name, profile_photo_url), tasks(id, title, emoji)')
    .eq('assigned_date', today);
  if (error) throw error;
  return data;
}

async function sbGetTodaySubmissions() {
  const today = localDateKey();
  const { data, error } = await sb
    .from('task_submissions')
    .select('user_id, task_id, status')
    .gte('submitted_at', today + 'T00:00:00.000Z');
  if (error) throw error;
  return data;
}

/* ─── DAILY TASKS ─── */

// Her kullanıcıya günde atanan rastgele görev sayısı
const DAILY_TASK_COUNT = 5;
// Son kaç günün görevleri yeni günde tekrar gelmesin (havuz yetiyorsa)
const DAILY_TASK_NO_REPEAT_DAYS = 3;

// Günlük görevler yerel saatle (Türkiye) gece yarısı yenilenir; toISOString UTC olduğu için 03:00'te dönüyordu
function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function sbAssignDailyTasks(userId) {
  const today = localDateKey();

  // Zaten atanmışsa tekrar atama
  const { data: existing } = await sb
    .from('user_daily_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('assigned_date', today)
    .limit(1);
  if (existing && existing.length > 0) return;

  // Aktif görevleri çek
  const { data: tasks, error: tErr } = await sb
    .from('tasks')
    .select('id')
    .eq('is_active', true);
  if (tErr) throw tErr;
  if (!tasks || !tasks.length) return;

  // Son günlerde atanan görevleri havuzdan çıkar ki her gün yeni görevler gelsin
  const since = new Date(); since.setDate(since.getDate() - DAILY_TASK_NO_REPEAT_DAYS);
  const { data: recent } = await sb
    .from('user_daily_tasks')
    .select('task_id')
    .eq('user_id', userId)
    .gte('assigned_date', localDateKey(since));
  const recentIds = new Set((recent || []).map(r => r.task_id));
  // Bugün (ve son günlerde) zaten gönderilmiş görevler de gelmesin: admin "Bugünü yenile" dediğinde
  // bugünkü atamalar silinir, ama kullanıcının bugün yaptığı görev tekrar seçilirse "Tamamlandı" görünüyordu
  const { data: done } = await sb
    .from('task_submissions')
    .select('task_id, submitted_at')
    .eq('user_id', userId)
    .gte('submitted_at', since.toISOString());
  const todayDone = new Set((done || []).filter(r => localDateKey(new Date(r.submitted_at)) === today).map(r => r.task_id));
  (done || []).forEach(r => recentIds.add(r.task_id));
  const fresh = tasks.filter(t => !recentIds.has(t.id));
  // Havuz yetmezse tekrar serbest, ama bugün yapılan görev asla yeniden gelmez
  const notToday = tasks.filter(t => !todayDone.has(t.id));
  const pool = fresh.length >= DAILY_TASK_COUNT ? fresh : (notToday.length ? notToday : tasks);

  // DAILY_TASK_COUNT tanesini rastgele seç (Fisher-Yates)
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, Math.min(DAILY_TASK_COUNT, shuffled.length));

  const rows = picked.map(t => ({ user_id: userId, task_id: t.id, assigned_date: today }));
  const { error: iErr } = await sb.from('user_daily_tasks').insert(rows);
  if (iErr) throw iErr;
}

async function sbGetUserDailyTasks(userId) {
  const today = localDateKey();
  const { data, error } = await sb
    .from('user_daily_tasks')
    .select('*, tasks(id, title, description, emoji, coin_reward, xp_reward, category, difficulty, is_active)')
    .eq('user_id', userId)
    .eq('assigned_date', today);
  if (error) throw error;
  return data;
}

async function sbClearUserDailyTasksToday(userId) {
  const today = localDateKey();
  await sb.from('user_daily_tasks').delete().eq('user_id', userId).eq('assigned_date', today);
}

async function sbClearAllDailyTasksToday() {
  const today = localDateKey();
  await sb.from('user_daily_tasks').delete().eq('assigned_date', today);
}

/* ─── HELP MESSAGES ─── */

async function sbSendHelpMessage(userId, topic, message) {
  const { data, error } = await sb
    .from('help_messages')
    .insert({ user_id: userId, topic, message, status: 'open' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function sbGetMyHelpMessages(userId) {
  const { data, error } = await sb
    .from('help_messages')
    .select('id, topic, message, status, admin_reply, created_at, replied_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

async function sbGetHelpMessages() {
  const { data, error } = await sb
    .from('help_messages')
    .select('*, profiles(username, full_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function sbReplyHelpMessage(msgId, reply) {
  const { error } = await sb
    .from('help_messages')
    .update({ admin_reply: reply, status: 'replied', replied_at: new Date().toISOString() })
    .eq('id', msgId);
  if (error) throw error;
}

async function sbCloseHelpMessage(msgId) {
  const { error } = await sb
    .from('help_messages')
    .update({ status: 'closed' })
    .eq('id', msgId);
  if (error) throw error;
}

async function sbUploadProof(userId, file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── DISCOVER POSTS ─── */
async function sbGetPosts() {
  const { data, error } = await sb
    .from('posts')
    .select('id, user_id, caption, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const posts = data || [];
  const userIds = [...new Set(posts.map(post => post.user_id).filter(Boolean))];
  if (!userIds.length) return posts;
  const { data: profiles, error: profileError } = await sb
    .from('profiles').select('id, username, full_name, profile_photo_url').in('id', userIds);
  if (profileError) throw profileError;
  const profileMap = Object.fromEntries((profiles || []).map(profile => [profile.id, profile]));
  posts.forEach(post => { post.profiles = profileMap[post.user_id] || {}; });
  return posts;
}

async function sbCreatePost(post) {
  const { data, error } = await sb
    .from('posts')
    .insert(post)
    .select('id, user_id, caption, image_url, created_at')
    .single();
  if (error) throw error;
  return data;
}

async function sbDeletePost(postId, userId) {
  if (!postId || !userId) throw new Error('Silinecek gönderi ve kullanıcı bilgisi eksik.');

  // Tercih edilen yol: post_delete.sql'deki fonksiyon gönderiyi, beğenileri ve
  // yorumları tek seferde, RLS'ye takılmadan siler (sahiplik kontrolü sunucuda).
  const rpc = await sb.rpc('delete_own_post', { p_post_id: String(postId) });
  if (!rpc.error) return;
  // Fonksiyon henüz kurulmamışsa eski yönteme düş; başka bir hataysa bildir.
  const missingFn = rpc.error.code === 'PGRST202' || /delete_own_post/i.test(rpc.error.message || '');
  if (!missingFn) throw rpc.error;

  const [likesDelete, commentsDelete] = await Promise.all([
    sb.from('post_likes').delete().eq('post_id', postId),
    sb.from('post_comments').delete().eq('post_id', postId)
  ]);

  if (likesDelete.error) throw likesDelete.error;
  if (commentsDelete.error) throw commentsDelete.error;

  // .select() ekliyoruz ki silinen satırları geri alalım — Supabase RLS silme
  // iznini reddettiğinde error fırlatmaz, sessizce 0 satır siler. Bunu
  // yakalamazsak gönderi sadece bu cihazda gizlenir, veritabanında kalmaya
  // devam eder ve diğer kullanıcılarda görünmeye devam eder.
  const { data, error } = await sb
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  if (!data || !data.length) {
    throw new Error('Gönderi veritabanından silinemedi (yetki reddedildi). Supabase\'te "posts" tablosunda kullanıcının kendi gönderisini silmesine izin veren bir RLS politikası olmalı.');
  }
}

async function sbGetPostEngagement(postIds) {
  if (!postIds.length) return { likes: [], comments: [] };
  const [likesResult, commentsResult] = await Promise.all([
    sb.from('post_likes').select('post_id, user_id').in('post_id', postIds),
    sb.from('post_comments').select('id, post_id, user_id, body, created_at')
      .in('post_id', postIds).order('created_at', { ascending: true })
  ]);
  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;
  const comments = commentsResult.data || [];
  const userIds = [...new Set(comments.map(comment => comment.user_id).filter(Boolean))];
  if (!userIds.length) return { likes: likesResult.data || [], comments };
  const { data: profiles, error: profilesError } = await sb
    .from('profiles').select('id, username, full_name, profile_photo_url').in('id', userIds);
  if (profilesError) throw profilesError;
  const profileMap = Object.fromEntries((profiles || []).map(profile => [profile.id, profile]));
  comments.forEach(comment => { comment.profiles = profileMap[comment.user_id] || {}; });
  return { likes: likesResult.data || [], comments };
}

async function sbTogglePostLike(postId, userId, liked) {
  if (liked) {
    const { error } = await sb.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await sb.from('post_likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

async function sbAddPostComment(postId, userId, body) {
  const { data, error } = await sb
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, body })
    .select('id, post_id, user_id, body, created_at, profiles(username, full_name, profile_photo_url)')
    .single();
  if (error) throw error;
  return data;
}

/* ─── WEEKLY SPIN ─── */
function _localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function sbCheckWeeklySpin(userId) {
  const today = _localDate();
  const { data, error } = await sb
    .from('weekly_spins')
    .select('id')
    .eq('user_id', userId)
    .eq('spin_date', today)
    .maybeSingle();
  if (error) throw error;
  return data; // null = not yet spun today
}

async function sbRecordWeeklySpin(userId, coinReward, xpReward) {
  const today = _localDate();
  const { error } = await sb.from('weekly_spins').insert({
    user_id: userId,
    spin_date: today,
    coin_reward: coinReward,
    xp_reward: xpReward
  });
  if (error) throw error;
}

/* ─── KGOİ (Kim Genco Olmak İster) ─── */
// En son yarışma denemesini getirir — 7 günlük bekleme süresini bundan hesaplıyoruz.
async function sbGetLastKgoiAttempt(userId) {
  const { data, error } = await sb
    .from('kgoi_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data; // null = hiç oynamamış
}

async function sbRecordKgoiAttempt(userId, weekKey, score, coinReward, xpReward) {
  const { error } = await sb.from('kgoi_attempts').insert({
    user_id: userId,
    week_key: weekKey,
    score,
    coin_reward: coinReward,
    xp_reward: xpReward
  });
  if (error) throw error;
}
/* ─── MİNİ OYUN SKORLARI (game_scores.sql) ───
   Oyun bitince rekor sunucuya gönderilir; sıralama / arkadaş rekabeti bu tablodan okunur.
   Tablo henüz kurulmadıysa hatalar yutulur, oyun yerel rekorla çalışmaya devam eder. */
async function sbSubmitGameScore(game, score, floor = 0) {
  _sbGuard('game_scores');
  const { error } = await sb.rpc('submit_game_score', { p_game: game, p_score: score, p_floor: floor });
  _sbCheck('game_scores', error);
}

// Kullanıcının rekoru ('all' = tüm zamanlar, 'YYYY-MM' = o ayın sezonu)
async function sbGetMyGameScore(userId, game, seasonId = 'all') {
  _sbGuard('game_scores');
  const { data, error } = await sb
    .from('game_scores')
    .select('best_score, best_floor, games_played')
    .eq('user_id', userId).eq('game', game).eq('season_id', seasonId)
    .maybeSingle();
  _sbCheck('game_scores', error);
  return data;
}

// Sıralama: userIds verilirse yalnız o kişiler (ör. arkadaşlar + kendin)
async function sbGetGameLeaderboard(game, { seasonId = 'all', userIds = null, limit = 50 } = {}) {
  _sbGuard('game_scores');
  let q = sb
    .from('game_scores')
    .select('user_id, best_score, best_floor, updated_at')
    .eq('game', game).eq('season_id', seasonId)
    .order('best_score', { ascending: false })
    .limit(limit);
  if (userIds) q = q.in('user_id', userIds);
  const { data: rows, error } = await q;
  _sbCheck('game_scores', error);
  if (!rows?.length) return [];
  const { data: profs } = await sb
    .from('profiles')
    .select('id, full_name, username, profile_photo_url, equipped_cosmetics')
    .in('id', rows.map(r => r.user_id));
  const byId = Object.fromEntries((profs || []).map(p => [p.id, p]));
  return rows.map((r, i) => ({ rank: i + 1, ...r, profile: byId[r.user_id] || null }));
}
