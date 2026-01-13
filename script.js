const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const nowPlaying = document.getElementById("nowPlaying");

const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const favBtn = document.getElementById("favorite");

const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volume = document.getElementById("volume");

const searchInput = document.getElementById("search");
const allTab = document.getElementById("allTab");
const favTab = document.getElementById("favTab");

let songs = [];
let filteredSongs = [];
let currentIndex = -1;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let currentTab = "all";

/* ===== LOAD SONGS ===== */
fetch("https://raw.githubusercontent.com/hakodev2k/Music-Player/main/songs.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    filteredSongs = songs;
    render();
  });

/* ===== RENDER ===== */
function render() {
  playlistEl.innerHTML = "";
  filteredSongs.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${s.title} - ${s.artist}${favorites.includes(s.url) ? " ❤️" : ""}`;
    li.onclick = () => playSong(i);
    playlistEl.appendChild(li);
  });
}

/* ===== PLAY ===== */
function playSong(i) {
  currentIndex = i;
  audio.src = filteredSongs[i].url;
  audio.play();
  playBtn.textContent = "⏸";
  nowPlaying.textContent = `🎵 ${filteredSongs[i].title}`;
  updateFavUI();
}

/* ===== CONTROLS ===== */
playBtn.onclick = () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    playBtn.textContent = "▶";
  }
};

nextBtn.onclick = () => playSong((currentIndex + 1) % filteredSongs.length);
prevBtn.onclick = () => playSong((currentIndex - 1 + filteredSongs.length) % filteredSongs.length);

/* ===== FAVORITE ===== */
favBtn.onclick = () => {
  const id = filteredSongs[currentIndex]?.url;
  if (!id) return;

  favorites.includes(id)
    ? favorites = favorites.filter(x => x !== id)
    : favorites.push(id);

  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavUI();
  render();
};

function updateFavUI() {
  const id = filteredSongs[currentIndex]?.url;
  favBtn.classList.toggle("active", favorites.includes(id));
  favBtn.textContent = favorites.includes(id) ? "❤️" : "🤍";
}

/* ===== SEARCH ===== */
searchInput.oninput = () => {
  const q = searchInput.value.toLowerCase();
  filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q)
  );
  render();
};

/* ===== FAVORITE TAB ===== */
favTab.onclick = () => {
  favTab.classList.add("active");
  allTab.classList.remove("active");
  filteredSongs = songs.filter(s => favorites.includes(s.url));
  render();
};

allTab.onclick = () => {
  allTab.classList.add("active");
  favTab.classList.remove("active");
  filteredSongs = songs;
  render();
};

/* ===== PROGRESS ===== */
audio.ontimeupdate = () => {
  progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  currentTimeEl.textContent = format(audio.currentTime);
};

audio.onloadedmetadata = () => durationEl.textContent = format(audio.duration);

progress.oninput = () => audio.currentTime = (progress.value / 100) * audio.duration;

volume.oninput = () => audio.volume = volume.value;

function format(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ===== SERVICE WORKER ===== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
