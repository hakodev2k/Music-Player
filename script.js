const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const nowPlaying = document.getElementById("nowPlaying");

const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");
const favoriteBtn = document.getElementById("favorite");

const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeSlider = document.getElementById("volume");

let songs = [];
let currentIndex = -1;
let isShuffle = false;
let repeatMode = "off"; // off | one | all
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

/* ================= LOAD SONGS ================= */
fetch("https://raw.githubusercontent.com/hakodev2k/Music-Player/main/songs.json")
  .then(res => res.json())
  .then(data => {
    songs = data;
    renderPlaylist();
  });

/* ================= PLAYLIST ================= */
function renderPlaylist() {
  playlistEl.innerHTML = "";
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = `${song.title} - ${song.artist}`;
    if (favorites.includes(song.url)) li.textContent += " ❤️";
    if (index === currentIndex) li.classList.add("active");
    li.onclick = () => playSong(index);
    playlistEl.appendChild(li);
  });
}

function playSong(index) {
  currentIndex = index;
  audio.src = songs[index].url;
  audio.play();
  nowPlaying.textContent = `🎶 ${songs[index].title}`;
  playBtn.textContent = "⏸";
  updateFavoriteUI();
  renderPlaylist();
}

/* ================= CONTROLS ================= */
playBtn.onclick = () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    playBtn.textContent = "▶";
  }
};

nextBtn.onclick = () => nextSong();
prevBtn.onclick = () => prevSong();

function nextSong() {
  if (isShuffle) {
    currentIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentIndex++;
    if (currentIndex >= songs.length) {
      if (repeatMode === "all") currentIndex = 0;
      else return;
    }
  }
  playSong(currentIndex);
}

function prevSong() {
  currentIndex--;
  if (currentIndex < 0) currentIndex = songs.length - 1;
  playSong(currentIndex);
}

/* ================= SHUFFLE / REPEAT ================= */
shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.style.background = isShuffle ? "#1db954" : "#333";
};

repeatBtn.onclick = () => {
  repeatMode = repeatMode === "off" ? "one" : repeatMode === "one" ? "all" : "off";
  repeatBtn.textContent = `🔁 Repeat: ${repeatMode}`;
};

audio.onended = () => {
  if (repeatMode === "one") audio.play();
  else nextSong();
};

/* ================= PROGRESS ================= */
audio.ontimeupdate = () => {
  progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  currentTimeEl.textContent = formatTime(audio.currentTime);
};

audio.onloadedmetadata = () => {
  durationEl.textContent = formatTime(audio.duration);
};

progress.oninput = () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
};

function formatTime(time) {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

/* ================= VOLUME ================= */
volumeSlider.oninput = () => {
  audio.volume = volumeSlider.value;
};

/* ================= FAVORITE ================= */
favoriteBtn.onclick = () => {
  const songId = songs[currentIndex]?.url;
  if (!songId) return;

  if (favorites.includes(songId)) {
    favorites = favorites.filter(id => id !== songId);
  } else {
    favorites.push(songId);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoriteUI();
  renderPlaylist();
};

function updateFavoriteUI() {
  const songId = songs[currentIndex]?.url;
  if (!songId) return;

  if (favorites.includes(songId)) {
    favoriteBtn.textContent = "❤️";
    favoriteBtn.classList.add("active");
  } else {
    favoriteBtn.textContent = "🤍";
    favoriteBtn.classList.remove("active");
  }
}
