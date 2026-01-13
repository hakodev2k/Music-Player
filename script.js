const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const nowPlaying = document.getElementById("nowPlaying");

const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

let songs = [];
let currentIndex = -1;
let isShuffle = false;
let repeatMode = "off"; // off | one | all

fetch("https://raw.githubusercontent.com/USERNAME/REPO/main/songs.json")
  .then(res => res.json())
  .then(data => {
    songs = data;
    renderPlaylist();
  });

function renderPlaylist() {
  playlistEl.innerHTML = "";
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = `${song.title} - ${song.artist}`;
    li.onclick = () => playSong(index);
    if (index === currentIndex) li.classList.add("active");
    playlistEl.appendChild(li);
  });
}

function playSong(index) {
  currentIndex = index;
  audio.src = songs[index].url;
  audio.play();
  nowPlaying.textContent = `🎶 ${songs[index].title}`;
  playBtn.textContent = "⏸";
  renderPlaylist();
}

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

shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.style.background = isShuffle ? "#1db954" : "#333";
};

repeatBtn.onclick = () => {
  if (repeatMode === "off") repeatMode = "one";
  else if (repeatMode === "one") repeatMode = "all";
  else repeatMode = "off";

  repeatBtn.textContent = `🔁 Repeat: ${repeatMode}`;
};

audio.onended = () => {
  if (repeatMode === "one") {
    audio.play();
  } else {
    nextSong();
  }
};
