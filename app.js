import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

/* ---------- Firebase setup ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyAcpeO8G73W794mW6OxajjJlITYXpxJdno",
  authDomain: "sufure-replay-checker.firebaseapp.com",
  projectId: "sufure-replay-checker",
  storageBucket: "sufure-replay-checker.firebasestorage.app",
  messagingSenderId: "773268102322",
  appId: "1:773268102322:web:e74e6948637b53fd94bdab",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const killsCol = collection(db, "kills");
const profilesCol = collection(db, "profiles");

/* ================= i18n ================= */
const I18N = {
  ja: {
    title: "🎯 Sufure's Replay Checker",
    authLoggedOut: "未ログイン",
    loginBtn: "Googleでログイン",
    logoutBtn: "ログアウト",
    tabUpload: "アップロード",
    tabRankings: "ランキング",
    tabProfiles: "プロフィール",
    uploadProfileLabel: "記録するプロフィール（任意）",
    noProfileOption: "プロフィールを選ばない",
    analyzeBtn: "Analyze Replay",
    replayHelpTitle: "📁 リプレイファイルの場所",
    replayHelpP1: "Fortniteのリプレイは、Windowsでは以下の場所に保存されます：",
    replayHelpHint: "USERNAME はあなたのWindowsのユーザー名に置き換えてください。AppDataが見えない場合は「隠しファイルを表示」を有効にしてください。",
    subtabOverall: "🏆 総合",
    subtabWeapon: "🔫 武器別",
    subtabDaily: "📅 デイリー",
    weaponFilterLabel: "武器を選択",
    thDistance: "距離 (m)",
    thPlayer: "プレイヤー",
    thWeapon: "武器",
    thType: "種別",
    thDate: "日時",
    thDelete: "",
    deleteRecordBtn: "削除",
    viewProfileBtn: "プロフへ",
    confirmDeleteRecord: "この記録を削除しますか？元に戻せません。",
    deleteFailed: "削除に失敗しました: ",
    profileListTitle: "👤 プロフィール一覧",
    newProfileBtn: "＋ 新しいプロフィールを作る",
    profileFormTitle: "プロフィールを作成 / 編集",
    profileNameLabel: "名前（ID）",
    profileNameNote: "⚠️ 名前は作成時のみ設定でき、後から変更できません。",
    profileTwitterLabel: "X（Twitter）リンク（任意）",
    profileBioLabel: "BIO（任意）",
    saveProfileBtn: "保存",
    cancelProfileBtn: "キャンセル",
    backToListBtn: "← 一覧に戻る",
    historyTitle: "📜 記録一覧",
    editProfileBtn: "プロフィールを編集",

    rankOverallTitle: "🏆 総合ランキング（ラストキル）",
    rankWeaponTitle: "🔫 武器別ランキング",
    rankDailyTitle: "📅 デイリーランキング（本日）",
    loading: "読み込み中...",
    emptyRanking: "まだ誰もアップロードしていません",
    emptyProfiles: "まだプロフィールがありません",
    emptyHistory: "まだ記録がありません",
    loadError: "読み込みエラー: ",
    parseError: "エラー: ",
    processing: "⏳ 解析中...",
    cardFurthest: "🏹 最遠キル",
    cardFinal: "🏁 ラストキル",
    labelDistance: "距離",
    labelKiller: "キラー",
    labelVictim: "被害者",
    labelWeapon: "武器",
    labelRarity: "レア度",
    matchInfoTitle: "試合全体の情報:\n",
    needLoginToCreate: "プロフィールを作成するにはGoogleログインが必要です",
    alreadyHasProfile: "すでにプロフィールを作成済みです。編集画面を開きます。",
    needName: "名前を入力してください",
    loginToCreateNote: "※ プロフィールの作成にはGoogleログインが必要です（1アカウントにつき1つまで）",
    alreadyOwnNote: "※ あなたはすでにプロフィールを持っています。「マイプロフィール」から編集できます",
    killTypeFurthest: "最遠キル",
    killTypeFinal: "ラストキル",
  },
  en: {
    title: "🎯 Sufure's Replay Checker",
    authLoggedOut: "Not logged in",
    loginBtn: "Sign in with Google",
    logoutBtn: "Log out",
    tabUpload: "Upload",
    tabRankings: "Rankings",
    tabProfiles: "Profiles",
    uploadProfileLabel: "Tag with profile (optional)",
    noProfileOption: "No profile",
    analyzeBtn: "Analyze Replay",
    replayHelpTitle: "📁 Where to find your Fortnite replays",
    replayHelpP1: "Fortnite saves replay files to the following default location on Windows:",
    replayHelpHint: "Replace USERNAME with your Windows username. If you don't see AppData, enable \"Show hidden files\".",
    subtabOverall: "🏆 Overall",
    subtabWeapon: "🔫 By Weapon",
    subtabDaily: "📅 Daily",
    weaponFilterLabel: "Select weapon",
    thDistance: "Distance (m)",
    thPlayer: "Player",
    thWeapon: "Weapon",
    thType: "Type",
    thDate: "Date",
    thDelete: "",
    deleteRecordBtn: "Delete",
    viewProfileBtn: "Profile",
    confirmDeleteRecord: "Delete this record? This cannot be undone.",
    deleteFailed: "Failed to delete: ",
    profileListTitle: "👤 Profiles",
    newProfileBtn: "＋ Create a profile",
    profileFormTitle: "Create / Edit Profile",
    profileNameLabel: "Name (ID)",
    profileNameNote: "⚠️ The name can only be set at creation and cannot be changed later.",
    profileTwitterLabel: "X (Twitter) link (optional)",
    profileBioLabel: "Bio (optional)",
    saveProfileBtn: "Save",
    cancelProfileBtn: "Cancel",
    backToListBtn: "← Back to list",
    historyTitle: "📜 History",
    editProfileBtn: "Edit profile",

    rankOverallTitle: "🏆 Overall Ranking (Last Kill)",
    rankWeaponTitle: "🔫 Ranking by Weapon",
    rankDailyTitle: "📅 Daily Ranking (Today)",
    loading: "Loading...",
    emptyRanking: "No submissions yet",
    emptyProfiles: "No profiles yet",
    emptyHistory: "No records yet",
    loadError: "Load error: ",
    parseError: "Error: ",
    processing: "⏳ Processing replay...",
    cardFurthest: "🏹 Furthest Kill",
    cardFinal: "🏁 Final Kill",
    labelDistance: "Distance",
    labelKiller: "Killer",
    labelVictim: "Victim",
    labelWeapon: "Weapon",
    labelRarity: "Rarity",
    matchInfoTitle: "Match-level info:\n",
    needLoginToCreate: "You need to sign in with Google to create a profile",
    alreadyHasProfile: "You already have a profile. Opening it for editing.",
    needName: "Please enter a name",
    loginToCreateNote: "* Signing in with Google is required to create a profile (one per account)",
    alreadyOwnNote: "* You already have a profile. Edit it from \"My Profile\".",
    killTypeFurthest: "Furthest Kill",
    killTypeFinal: "Final Kill",
  },
};

let currentLang = localStorage.getItem("lang") || "ja";
function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.ja[key] || key;
}

function applyStaticI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (I18N[currentLang][key] !== undefined) {
      // Preserve inner HTML tags for the hint paragraph
      el.innerHTML = I18N[currentLang][key];
    }
  });
  document.querySelectorAll(".lang-toggle button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === currentLang);
  });
  // re-apply dynamic bits that depend on language
  if (!currentUser) authStatus.textContent = t("authLoggedOut");
  if (document.getElementById("rankings").classList.contains("active")) {
    showRankingMode(currentRankingMode);
  }
}

document.getElementById("langToggle").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-lang]");
  if (!btn) return;
  currentLang = btn.dataset.lang;
  localStorage.setItem("lang", currentLang);
  applyStaticI18n();
});

/* ---------- Replay parsing (existing backend, unchanged) ---------- */
const API_BASE = "https://kye5-replay-bot.onrender.com";

const parseBtn = document.getElementById("parseBtn");
const fileInput = document.getElementById("fileInput");
const profileSelect = document.getElementById("profileSelect");
const results = document.getElementById("results");

parseBtn.addEventListener("click", async () => {
  if (!fileInput.files.length) {
    alert("Please select a replay file");
    return;
  }

  showTab("results");
  results.innerHTML = `<div class='card'>${t("processing")}</div>`;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/parse-replay`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.success) throw new Error("Processing failed");

    const parsed = JSON.parse(data.output);
    renderResults(parsed);
    await saveKills(parsed);
    allFinalCache = null; // 新しい記録をランキングにすぐ反映させる
  } catch (err) {
    results.innerHTML = `<div class="card">❌ ${t("parseError")}${err.message}</div>`;
  }
});

const KNOWN_LABELS = {
  distance: "labelDistance",
  killer: "labelKiller",
  victim: "labelVictim",
  weapon: "labelWeapon",
  rarity: "labelRarity",
};

function renderResults(data) {
  results.innerHTML = "";
  if (data.furthest) results.appendChild(createCard(t("cardFurthest"), data.furthest));
  if (data.final) results.appendChild(createCard(t("cardFinal"), data.final));

  const matchLevel = { ...data };
  delete matchLevel.furthest;
  delete matchLevel.final;
  if (Object.keys(matchLevel).length) {
    const box = document.createElement("div");
    box.className = "raw-info";
    box.textContent = t("matchInfoTitle") + JSON.stringify(matchLevel, null, 2);
    results.appendChild(box);
  }
}

function createCard(title, stats) {
  const card = document.createElement("div");
  card.className = "card";
  const rowsHtml = Object.entries(stats)
    .filter(([k]) => k !== "killType" && k !== "killer_platform" && k !== "victim_platform")
    .map(([k, v]) => {
      const label = KNOWN_LABELS[k] ? t(KNOWN_LABELS[k]) : k;
      const value = k === "distance" ? `${v} m` : v;
      return row(label, value);
    })
    .join("");
  card.innerHTML = `<h2>${title}</h2>${rowsHtml}`;
  return card;
}

function row(label, value) {
  return `<div class="stat"><span class="label">${label}</span><span>${value}</span></div>`;
}

async function saveKills(parsed) {
  const profileId = profileSelect.value || null;
  const profileName = profileId
    ? profileSelect.options[profileSelect.selectedIndex].textContent
    : null;

  // ランキング/記録として保存するのは「ラストキル」のみ。
  // 「最遠キル」は試合全体から抽出されるため自分のキルとは限らず、
  // ランキングに載せると本人以外のキルや被害者側のデータが混ざる原因になる。
  if (!parsed.final) return;
  const e = { ...parsed.final, killType: "final" };

  await addDoc(killsCol, {
    distance: Number(e.distance) || 0,
    killer: e.killer || "",
    killerPlatform: e.killer_platform || "",
    victim: e.victim || "",
    victimPlatform: e.victim_platform || "",
    weapon: e.weapon || "不明",
    rarity: e.rarity || "",
    killType: e.killType,
    profileId,
    profileName,
    ownerUid: currentUser ? currentUser.uid : null,
    createdAt: serverTimestamp(),
  });
}

/* ---------- Tabs ---------- */
function showTab(tab) {
  document.getElementById("upload").classList.toggle("active", tab === "upload");
  document.getElementById("rankings").classList.toggle("active", tab === "rankings");
  document.getElementById("profiles").classList.toggle("active", tab === "profiles");
  results.classList.toggle("active", tab === "results");

  if (tab === "rankings") loadRanking(currentRankingMode);
  if (tab === "profiles") loadProfileList();
}
window.showTab = showTab;

/* ---------- Auth ---------- */
const authStatus = document.getElementById("authStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authStatus.textContent = user.displayName;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    authStatus.textContent = t("authLoggedOut");
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
  if (document.getElementById("profiles").classList.contains("active")) {
    loadProfileList();
  } else {
    // プロフィール一覧タブを開いていなくても、アップロード欄の
    // プロフィール選択に自分のプロフィールを反映させる
    (async () => {
      const snap = await getDocs(query(profilesCol));
      const profiles = [];
      snap.forEach((d) => profiles.push({ id: d.id, ...d.data() }));
      refreshProfileSelect(profiles);
    })();
  }
  if (document.getElementById("rankings").classList.contains("active")) {
    // ログイン状態が変わったら削除ボタンの表示/非表示を反映
    loadRanking(currentRankingMode);
  }
});

async function getOwnProfileSnap() {
  if (!currentUser) return null;
  const snap = await getDocs(query(profilesCol, where("ownerUid", "==", currentUser.uid)));
  return snap.empty ? null : snap.docs[0];
}

/* ---------- Rankings ---------- */
let currentRankingMode = "overall";
const rankingTitle = document.getElementById("rankingTitle");
const weaponFilterWrap = document.getElementById("weaponFilterWrap");
const weaponFilter = document.getElementById("weaponFilter");

function showRankingMode(mode) {
  currentRankingMode = mode;
  document.querySelectorAll(".subtab-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === mode)
  );
  weaponFilterWrap.style.display = mode === "weapon" ? "block" : "none";

  const titles = {
    overall: t("rankOverallTitle"),
    weapon: t("rankWeaponTitle"),
    daily: t("rankDailyTitle"),
  };
  rankingTitle.textContent = titles[mode];

  loadRanking(mode);
}
window.showRankingMode = showRankingMode;
weaponFilter.addEventListener("change", () => loadRanking("weapon"));

function emptyRow(colspan, msg) {
  return `<tr class="empty-row"><td colspan="${colspan}">${msg}</td></tr>`;
}

/* すべて killType == "final"（ラストキル）の等値フィルタのみで取得し（複合インデックス不要）、
   武器/本日 の絞り込みとソートはクライアント側で行う */
let allFinalCache = null;
async function loadAllFinal() {
  if (allFinalCache) return allFinalCache;
  const snap = await getDocs(query(killsCol, where("killType", "==", "final")));
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  allFinalCache = rows;
  return rows;
}

async function loadRanking(mode) {
  const tbody = document.querySelector("#leaderboard-table tbody");
  tbody.innerHTML = emptyRow(5, t("loading"));

  try {
    const all = await loadAllFinal();
    let rows = all;

    if (mode === "weapon") {
      populateFilterOptions(weaponFilter, all.map((r) => r.weapon));
      const w = weaponFilter.value;
      rows = w ? all.filter((r) => r.weapon === w) : [];
    } else if (mode === "daily") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      rows = all.filter((r) => r.createdAt && r.createdAt.toDate && r.createdAt.toDate() >= start);
    }

    rows = [...rows].sort((a, b) => b.distance - a.distance).slice(0, 50);

    // 本人の投稿だけ削除できるようにするため、自分のuidと自分のプロフィールIDを取得しておく
    let myProfileId = null;
    if (currentUser) {
      const own = await getOwnProfileSnap();
      myProfileId = own ? own.id : null;
    }
    renderLeaderboard(rows, myProfileId);
  } catch (err) {
    tbody.innerHTML = emptyRow(5, t("loadError") + err.message);
  }
}

function populateFilterOptions(selectEl, values) {
  const unique = [...new Set(values.filter(Boolean))].sort();
  const current = selectEl.value;
  selectEl.innerHTML = unique.map((v) => `<option value="${v}">${v}</option>`).join("");
  if (unique.includes(current)) selectEl.value = current;
}

function renderLeaderboard(rows, myProfileId) {
  const tbody = document.querySelector("#leaderboard-table tbody");
  if (!rows.length) {
    tbody.innerHTML = emptyRow(5, t("emptyRanking"));
    return;
  }
  tbody.innerHTML = rows
    .map((e, i) => {
      let rank = i + 1;
      if (i === 0) rank = "🥇";
      else if (i === 1) rank = "🥈";
      else if (i === 2) rank = "🥉";
      const hasProfile = !!e.profileName;
      const player = hasProfile ? e.profileName : e.killer;
      // 削除は「本人の投稿」だけ許可する:
      // ・ownerUid が自分のuidと一致する（新しい投稿）
      // ・または profileId が自分のプロフィールと一致する（自分のプロフィールに紐付いた投稿）
      // ・どちらも無い古いテストデータ（誰の投稿か特定できないもの）はログイン中なら整理してよいことにする
      const isAnonymousLegacy = !e.ownerUid && !e.profileId;
      const isMine =
        currentUser &&
        (isAnonymousLegacy ||
          (e.ownerUid && e.ownerUid === currentUser.uid) ||
          (myProfileId && e.profileId === myProfileId));
      const deleteBtn = isMine
        ? `<button class="delete-record-btn" data-id="${e.id}">${t("deleteRecordBtn")}</button>`
        : "";
      const profileBtn = hasProfile
        ? `<button class="view-profile-btn" data-profile-id="${escapeAttr(e.profileId)}">${t("viewProfileBtn")}</button>`
        : "";
      return `
        <tr class="rank-${i + 1}">
          <td class="rank">${rank}</td>
          <td>${e.distance}</td>
          <td class="player-cell">${player}</td>
          <td>${e.weapon}</td>
          <td class="action-cell">${profileBtn}${deleteBtn}</td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".view-profile-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.profileId;
      if (!id) return;
      showTab("profiles");
      openProfileDetail(id);
    });
  });

  tbody.querySelectorAll(".delete-record-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(t("confirmDeleteRecord"))) return;
      try {
        await deleteDoc(doc(db, "kills", btn.dataset.id));
        allFinalCache = null;
        loadRanking(currentRankingMode);
      } catch (err) {
        alert(t("deleteFailed") + err.message);
      }
    });
  });
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

/* ---------- Profiles ---------- */
const profileList = document.getElementById("profileList");
const profileForm = document.getElementById("profileForm");
const profileDetail = document.getElementById("profileDetail");
const profileCards = document.getElementById("profileCards");
const newProfileBtn = document.getElementById("newProfileBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const backToListBtn = document.getElementById("backToListBtn");
const editProfileBtn = document.getElementById("editProfileBtn");
const profileCreateNote = document.getElementById("profileCreateNote");

const profileNameInput = document.getElementById("profileName");
const profileTwitterInput = document.getElementById("profileTwitter");
const profileBioInput = document.getElementById("profileBio");

let editingProfileId = null;

async function loadProfileList() {
  profileList.style.display = "block";
  profileForm.style.display = "none";
  profileDetail.style.display = "none";

  const own = await getOwnProfileSnap();
  if (!currentUser) {
    newProfileBtn.style.display = "none";
    profileCreateNote.textContent = t("loginToCreateNote");
  } else if (own) {
    newProfileBtn.style.display = "none";
    profileCreateNote.textContent = t("alreadyOwnNote");
  } else {
    newProfileBtn.style.display = "inline-block";
    profileCreateNote.textContent = "";
  }

  profileCards.innerHTML = t("loading");
  const snap = await getDocs(query(profilesCol));
  const profiles = [];
  snap.forEach((d) => profiles.push({ id: d.id, ...d.data() }));
  profiles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  refreshProfileSelect(profiles);

  if (!profiles.length) {
    profileCards.innerHTML = `<p>${t("emptyProfiles")}</p>`;
    return;
  }

  profileCards.innerHTML = "";
  profiles.forEach((p) => {
    const el = document.createElement("div");
    el.className = "profile-card";
    el.innerHTML = `
      <div>
        <div class="name">${p.name}</div>
        <div class="bio">${(p.bio || "").slice(0, 60)}</div>
      </div>
    `;
    el.addEventListener("click", () => openProfileDetail(p.id));
    profileCards.appendChild(el);
  });
}

function refreshProfileSelect(profiles) {
  const current = profileSelect.value;
  profileSelect.innerHTML =
    `<option value="">${t("noProfileOption")}</option>` +
    profiles.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  if ([...profileSelect.options].some((o) => o.value === current)) {
    profileSelect.value = current;
  } else if (!current && currentUser) {
    // 未選択の場合、ログイン中ユーザー自身のプロフィールがあれば自動で選んでおく
    // （自分の記録が自分のプロフィールに紐付かない事故を防ぐ）
    const own = profiles.find((p) => p.ownerUid === currentUser.uid);
    if (own) profileSelect.value = own.id;
  }
}

function openCreateForm() {
  editingProfileId = null;
  profileNameInput.value = currentUser?.displayName || "";
  profileNameInput.readOnly = false;
  profileTwitterInput.value = "";
  profileBioInput.value = "";
  profileList.style.display = "none";
  profileForm.style.display = "block";
}

newProfileBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert(t("needLoginToCreate"));
    return;
  }
  const own = await getOwnProfileSnap();
  if (own) {
    alert(t("alreadyHasProfile"));
    openProfileDetail(own.id);
    return;
  }
  openCreateForm();
});

cancelProfileBtn.addEventListener("click", () => loadProfileList());

saveProfileBtn.addEventListener("click", async () => {
  if (!editingProfileId && !currentUser) {
    alert(t("needLoginToCreate"));
    return;
  }
  const name = profileNameInput.value.trim();
  if (!name) {
    alert(t("needName"));
    return;
  }

  const payload = {
    twitter: profileTwitterInput.value.trim(),
    bio: profileBioInput.value.trim(),
  };

  if (editingProfileId) {
    // 名前は変更不可なので送らない
    await updateDoc(doc(db, "profiles", editingProfileId), payload);
    openProfileDetail(editingProfileId);
  } else {
    const own = await getOwnProfileSnap();
    if (own) {
      alert(t("alreadyHasProfile"));
      openProfileDetail(own.id);
      return;
    }
    payload.name = name;
    payload.ownerUid = currentUser.uid;
    payload.createdAt = serverTimestamp();
    const ref = await addDoc(profilesCol, payload);
    openProfileDetail(ref.id);
  }
});

backToListBtn.addEventListener("click", () => loadProfileList());

async function openProfileDetail(id) {
  profileList.style.display = "none";
  profileForm.style.display = "none";
  profileDetail.style.display = "block";

  const snap = await getDoc(doc(db, "profiles", id));
  if (!snap.exists()) return;
  const p = { id: snap.id, ...snap.data() };
  editingProfileId = id;

  const isOwner = currentUser && p.ownerUid === currentUser.uid;
  editProfileBtn.style.display = isOwner ? "inline-block" : "none";

  const twitterLink = p.twitter
    ? `<p><a href="${p.twitter}" target="_blank" rel="noopener">🔗 ${p.twitter}</a></p>`
    : "";

  document.getElementById("profileDetailCard").innerHTML = `
    <div class="profile-detail-header">
      <div>
        <h2>${p.name}</h2>
        <p>${p.bio || ""}</p>
        ${twitterLink}
      </div>
    </div>
  `;

  const tbody = document.querySelector("#profile-history-table tbody");
  tbody.innerHTML = emptyRow(5, t("loading"));
  const histSnap = await getDocs(query(killsCol, where("profileId", "==", id)));
  const rows = [];
  histSnap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (!rows.length) {
    tbody.innerHTML = emptyRow(5, t("emptyHistory"));
  } else {
    tbody.innerHTML = rows
      .map((e) => {
        const date = e.createdAt?.toDate ? e.createdAt.toDate().toLocaleString() : "";
        const typeLabel = e.killType === "furthest" ? t("killTypeFurthest") : t("killTypeFinal");
        const deleteCell = isOwner
          ? `<td><button class="delete-record-btn" data-id="${e.id}">${t("deleteRecordBtn")}</button></td>`
          : "";
        return `
          <tr>
            <td>${e.distance}</td>
            <td>${e.weapon}</td>
            <td>${typeLabel}</td>
            <td>${date}</td>
            ${deleteCell}
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll(".delete-record-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm(t("confirmDeleteRecord"))) return;
        try {
          await deleteDoc(doc(db, "kills", btn.dataset.id));
          allFinalCache = null; // ランキングにも反映させる
          openProfileDetail(id);
        } catch (err) {
          alert(t("deleteFailed") + err.message);
        }
      });
    });
  }
}

editProfileBtn.addEventListener("click", async () => {
  const snap = await getDoc(doc(db, "profiles", editingProfileId));
  const p = snap.data();
  profileNameInput.value = p.name || "";
  profileNameInput.readOnly = true;
  profileTwitterInput.value = p.twitter || "";
  profileBioInput.value = p.bio || "";
  profileDetail.style.display = "none";
  profileForm.style.display = "block";
});

/* ---------- Init ---------- */
applyStaticI18n();
loadProfileList();
