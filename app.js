import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

const killsCol = collection(db, "kills");
const profilesCol = collection(db, "profiles");

/* ---------- Replay parsing (existing backend, unchanged) ---------- */
const API_BASE = "https://kye5-replay-bot.onrender.com";

const parseBtn = document.getElementById("parseBtn");
const fileInput = document.getElementById("fileInput");
const modeSelect = document.getElementById("modeSelect");
const profileSelect = document.getElementById("profileSelect");
const results = document.getElementById("results");

parseBtn.addEventListener("click", async () => {
  if (!fileInput.files.length) {
    alert("Please select a replay file");
    return;
  }

  showTab("results");
  results.innerHTML = "<div class='card'>⏳ Processing replay...</div>";

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
  } catch (err) {
    results.innerHTML = `<div class="card">❌ Error: ${err.message}</div>`;
  }
});

function renderResults(data) {
  results.innerHTML = "";
  if (data.furthest) results.appendChild(createCard("🏹 Furthest Kill", data.furthest));
  if (data.final) results.appendChild(createCard("🏁 Final Kill", data.final));
}

function createCard(title, stats) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>${title}</h2>
    ${row("Distance", `${stats.distance} m`)}
    ${row("Killer", `${stats.killer} (${stats.killer_platform})`)}
    ${row("Victim", `${stats.victim} (${stats.victim_platform})`)}
    ${row("Weapon", stats.weapon)}
    ${row("Rarity", stats.rarity)}
  `;
  return card;
}

function row(label, value) {
  return `<div class="stat"><span class="label">${label}</span><span>${value}</span></div>`;
}

/* Save both furthest + final kills into Firestore, tagged with mode + optional profile */
async function saveKills(parsed) {
  const mode = modeSelect.value;
  const profileId = profileSelect.value || null;
  const profileName = profileId
    ? profileSelect.options[profileSelect.selectedIndex].textContent
    : null;

  const entries = [];
  if (parsed.furthest) entries.push({ ...parsed.furthest, killType: "furthest" });
  if (parsed.final) entries.push({ ...parsed.final, killType: "final" });

  for (const e of entries) {
    await addDoc(killsCol, {
      distance: Number(e.distance) || 0,
      killer: e.killer || "",
      killerPlatform: e.killer_platform || "",
      victim: e.victim || "",
      victimPlatform: e.victim_platform || "",
      weapon: e.weapon || "不明",
      rarity: e.rarity || "",
      mode,
      killType: e.killType,
      profileId,
      profileName,
      createdAt: serverTimestamp(),
    });
  }
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

/* ---------- Rankings ---------- */
let currentRankingMode = "overall";
const rankingTitle = document.getElementById("rankingTitle");
const weaponFilterWrap = document.getElementById("weaponFilterWrap");
const modeFilterWrap = document.getElementById("modeFilterWrap");
const weaponFilter = document.getElementById("weaponFilter");
const modeFilter = document.getElementById("modeFilter");

function showRankingMode(mode) {
  currentRankingMode = mode;
  document.querySelectorAll(".subtab-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === mode)
  );
  weaponFilterWrap.style.display = mode === "weapon" ? "block" : "none";
  modeFilterWrap.style.display = mode === "mode" ? "block" : "none";

  const titles = {
    overall: "🏆 総合ランキング（最遠キル）",
    weapon: "🔫 武器別ランキング",
    mode: "🎮 モード別ランキング",
    daily: "📅 デイリーランキング（本日）",
  };
  rankingTitle.textContent = titles[mode];

  loadRanking(mode);
}
window.showRankingMode = showRankingMode;
weaponFilter.addEventListener("change", () => loadRanking("weapon"));
modeFilter.addEventListener("change", () => loadRanking("mode"));

async function loadRanking(mode) {
  const tbody = document.querySelector("#leaderboard-table tbody");
  tbody.innerHTML = `<tr><td colspan="5">読み込み中...</td></tr>`;

  let q;
  if (mode === "overall") {
    q = query(killsCol, where("killType", "==", "furthest"), orderBy("distance", "desc"), limit(50));
  } else if (mode === "weapon") {
    await populateWeaponFilter();
    const w = weaponFilter.value;
    q = query(
      killsCol,
      where("killType", "==", "furthest"),
      where("weapon", "==", w),
      orderBy("distance", "desc"),
      limit(50)
    );
  } else if (mode === "mode") {
    const m = modeFilter.value;
    q = query(
      killsCol,
      where("killType", "==", "furthest"),
      where("mode", "==", m),
      orderBy("distance", "desc"),
      limit(50)
    );
  } else if (mode === "daily") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    q = query(
      killsCol,
      where("killType", "==", "furthest"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      orderBy("createdAt", "desc"),
      orderBy("distance", "desc"),
      limit(50)
    );
  }

  try {
    const snap = await getDocs(q);
    const rows = [];
    snap.forEach((d) => rows.push(d.data()));

    if (mode === "daily") rows.sort((a, b) => b.distance - a.distance);

    renderLeaderboard(rows);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">読み込みエラー: ${err.message}</td></tr>`;
  }
}

function renderLeaderboard(rows) {
  const tbody = document.querySelector("#leaderboard-table tbody");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">まだ記録がありません</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((e, i) => {
      let rank = i + 1;
      if (i === 0) rank = "🥇";
      else if (i === 1) rank = "🥈";
      else if (i === 2) rank = "🥉";
      const player = e.profileName || e.killer;
      return `
        <tr class="rank-${i + 1}">
          <td class="rank">${rank}</td>
          <td>${e.distance}</td>
          <td>${player}</td>
          <td>${e.weapon}</td>
          <td>${e.mode || ""}</td>
        </tr>
      `;
    })
    .join("");
}

let weaponsLoaded = false;
async function populateWeaponFilter() {
  if (weaponsLoaded) return;
  const snap = await getDocs(query(killsCol, where("killType", "==", "furthest"), limit(200)));
  const weapons = new Set();
  snap.forEach((d) => {
    const w = d.data().weapon;
    if (w) weapons.add(w);
  });
  weaponFilter.innerHTML = [...weapons]
    .sort()
    .map((w) => `<option value="${w}">${w}</option>`)
    .join("");
  weaponsLoaded = true;
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

const profileNameInput = document.getElementById("profileName");
const profileIconInput = document.getElementById("profileIcon");
const profileBioInput = document.getElementById("profileBio");

let editingProfileId = null;

async function loadProfileList() {
  profileList.style.display = "block";
  profileForm.style.display = "none";
  profileDetail.style.display = "none";

  profileCards.innerHTML = "読み込み中...";
  const snap = await getDocs(query(profilesCol, orderBy("createdAt", "desc")));
  const profiles = [];
  snap.forEach((d) => profiles.push({ id: d.id, ...d.data() }));

  refreshProfileSelect(profiles);

  if (!profiles.length) {
    profileCards.innerHTML = "<p>まだプロフィールがありません</p>";
    return;
  }

  profileCards.innerHTML = "";
  profiles.forEach((p) => {
    const el = document.createElement("div");
    el.className = "profile-card";
    el.innerHTML = `
      <img src="${p.iconUrl || ""}" onerror="this.style.visibility='hidden'" />
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
    `<option value="">プロフィールを選ばない</option>` +
    profiles.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  if ([...profileSelect.options].some((o) => o.value === current)) {
    profileSelect.value = current;
  }
}

newProfileBtn.addEventListener("click", () => {
  editingProfileId = null;
  profileNameInput.value = "";
  profileIconInput.value = "";
  profileBioInput.value = "";
  profileList.style.display = "none";
  profileForm.style.display = "block";
});

cancelProfileBtn.addEventListener("click", () => loadProfileList());

saveProfileBtn.addEventListener("click", async () => {
  const name = profileNameInput.value.trim();
  if (!name) {
    alert("名前を入力してください");
    return;
  }
  const payload = {
    name,
    iconUrl: profileIconInput.value.trim(),
    bio: profileBioInput.value.trim(),
  };

  if (editingProfileId) {
    await updateDoc(doc(db, "profiles", editingProfileId), payload);
    openProfileDetail(editingProfileId);
  } else {
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

  document.getElementById("profileDetailCard").innerHTML = `
    <div class="profile-detail-header">
      <img src="${p.iconUrl || ""}" onerror="this.style.visibility='hidden'" />
      <div>
        <h2>${p.name}</h2>
        <p>${p.bio || ""}</p>
      </div>
    </div>
  `;

  const tbody = document.querySelector("#profile-history-table tbody");
  tbody.innerHTML = `<tr><td colspan="5">読み込み中...</td></tr>`;
  const histSnap = await getDocs(
    query(killsCol, where("profileId", "==", id), orderBy("createdAt", "desc"), limit(50))
  );
  const rows = [];
  histSnap.forEach((d) => rows.push(d.data()));

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">まだ記録がありません</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map((e) => {
        const date = e.createdAt?.toDate ? e.createdAt.toDate().toLocaleString("ja-JP") : "";
        return `
          <tr>
            <td>${e.distance}</td>
            <td>${e.weapon}</td>
            <td>${e.mode || ""}</td>
            <td>${e.killType === "furthest" ? "最遠キル" : "ラストキル"}</td>
            <td>${date}</td>
          </tr>
        `;
      })
      .join("");
  }
}

editProfileBtn.addEventListener("click", async () => {
  const snap = await getDoc(doc(db, "profiles", editingProfileId));
  const p = snap.data();
  profileNameInput.value = p.name || "";
  profileIconInput.value = p.iconUrl || "";
  profileBioInput.value = p.bio || "";
  profileDetail.style.display = "none";
  profileForm.style.display = "block";
});

/* ---------- Init ---------- */
loadProfileList();
