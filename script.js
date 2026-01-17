const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const nowPlaying = document.getElementById("nowPlaying");

const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const favBtn = document.getElementById("favorite");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

const progress = document.getElementById("progress");
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volume = document.getElementById("volume");

const searchInput = document.getElementById("search");
const allTab = document.getElementById("allTab");
const favTab = document.getElementById("favTab");

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

let songs = [];
let filteredSongs = [];
let currentIndex = -1;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let isShuffle = false;
let repeatMode = "off"; // off | one | all
let playHistory = []; // History of played songs for shuffle mode
let durationCache = JSON.parse(localStorage.getItem("durationCache")) || {}; // Cache durations

/* MOBILE MENU TOGGLE */
menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('active');
  sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      menuToggle.classList.remove('active');
    }
  }
});

/* LOAD SONGS */
fetch("https://raw.githubusercontent.com/hakodev2k/Music-Player/main/songs.json")
  .then(r => r.json())
  .then(data => {
    songs = data;
    // Apply cached durations immediately
    songs.forEach(song => {
      if (durationCache[song.url]) {
        song.duration = durationCache[song.url];
      }
    });
    filteredSongs = songs;
    render();
    // Load durations in background for uncached songs
    loadDurations();
  })
  .catch(err => {
    console.error("Error loading songs:", err);
    // Fallback to local songs.json if available
    fetch("songs.json")
      .then(r => r.json())
      .then(data => {
        songs = data;
        // Apply cached durations immediately
        songs.forEach(song => {
          if (durationCache[song.url]) {
            song.duration = durationCache[song.url];
          }
        });
        filteredSongs = songs;
        render();
        loadDurations();
      });
  });

/* LOAD DURATIONS */
function loadDurations() {
  songs.forEach((song, index) => {
    // Skip if already cached
    if (durationCache[song.url]) {
      song.duration = durationCache[song.url];
      return;
    }
    
    // Create temp audio element to load metadata
    const tempAudio = new Audio();
    tempAudio.preload = 'metadata';
    
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
        const formatted = formatDuration(tempAudio.duration);
        song.duration = formatted;
        durationCache[song.url] = formatted;
        
        // Save to localStorage
        localStorage.setItem("durationCache", JSON.stringify(durationCache));
        
        // Update UI if this song is visible
        render();
      }
    });
    
    tempAudio.src = song.url;
  });
}

function formatDuration(seconds) {
  if (isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* RENDER */
function render() {
  playlistEl.innerHTML = "";
  filteredSongs.forEach((s, i) => {
    const li = document.createElement("li");
    
    // Song number
    const songNumber = document.createElement("span");
    songNumber.className = "song-number";
    songNumber.textContent = i + 1;
    
    // Song title
    const songTitle = document.createElement("span");
    songTitle.className = "song-title";
    songTitle.textContent = s.title;
    
    // Song artist
    const songArtist = document.createElement("span");
    songArtist.className = "song-artist";
    songArtist.textContent = s.artist;
    
    // Song duration (will be updated when song loads)
    const songDuration = document.createElement("span");
    songDuration.className = "song-duration";
    songDuration.textContent = s.duration || "--:--";
    
    li.appendChild(songNumber);
    li.appendChild(songTitle);
    li.appendChild(songArtist);
    li.appendChild(songDuration);
    
    if (i === currentIndex) li.classList.add("active");
    li.onclick = () => playSong(i);
    playlistEl.appendChild(li);
  });
}

/* PLAY */
function playSong(i, fromHistory = false) {
  currentIndex = i;
  const song = filteredSongs[i];
  audio.src = song.url;
  audio.play();
  
  // Add to history if not coming from history navigation
  if (!fromHistory && (playHistory.length === 0 || playHistory[playHistory.length - 1] !== i)) {
    playHistory.push(i);
    // Keep history limited to 50 songs
    if (playHistory.length > 50) {
      playHistory.shift();
    }
  }
  
  // Update play button icon
  playBtn.innerHTML = `
    <svg viewBox="0 0 16 16" width="16" height="16">
      <path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z"/>
    </svg>
  `;
  
  // Update now playing info
  const songTitle = nowPlaying.querySelector('.song-title');
  const songArtist = nowPlaying.querySelector('.song-artist');
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  
  // Update Media Session API for lock screen display
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'MyPlayer',
      artwork: [
        { src: 'favicon.svg', sizes: '96x96', type: 'image/svg+xml' },
        { src: 'favicon.svg', sizes: '128x128', type: 'image/svg+xml' },
        { src: 'favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
        { src: 'favicon.svg', sizes: '256x256', type: 'image/svg+xml' },
        { src: 'favicon.svg', sizes: '384x384', type: 'image/svg+xml' },
        { src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
      ]
    });
    
    // Setup media session action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      audio.play();
      playBtn.innerHTML = `
        <svg viewBox="0 0 16 16" width="16" height="16">
          <path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z"/>
        </svg>
      `;
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
      playBtn.innerHTML = `
        <svg viewBox="0 0 16 16" width="16" height="16">
          <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z"/>
        </svg>
      `;
    });
    
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevSong();
    });
    
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextSong();
    });
  }
  
  updateFavUI();
  render();
  
  // Close sidebar on mobile after selecting song
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    menuToggle.classList.remove('active');
  }
}

/* CONTROLS */
playBtn.onclick = () => {
  // If no song is selected, play the first song
  if (currentIndex === -1 && filteredSongs.length > 0) {
    playSong(0);
    return;
  }
  
  if (audio.paused) {
    audio.play();
    playBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z"/>
      </svg>
    `;
  } else {
    audio.pause();
    playBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z"/>
      </svg>
    `;
  }
};

nextBtn.onclick = () => nextSong();
prevBtn.onclick = () => prevSong();

function nextSong() {
  if (repeatMode === "one") {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  if (isShuffle) {
    // In shuffle mode, pick a random song
    let nextIndex;
    // Avoid playing the same song twice in a row
    do {
      nextIndex = Math.floor(Math.random() * filteredSongs.length);
    } while (nextIndex === currentIndex && filteredSongs.length > 1);
    currentIndex = nextIndex;
  } else {
    currentIndex++;
    if (currentIndex >= filteredSongs.length) {
      if (repeatMode === "all") currentIndex = 0;
      else return;
    }
  }

  playSong(currentIndex);
}

function prevSong() {
  // If no song is playing, do nothing
  if (currentIndex === -1 || playHistory.length === 0) return;
  
  // Find current position in history
  const currentHistoryIndex = playHistory.lastIndexOf(currentIndex);
  
  if (isShuffle) {
    // In shuffle mode, go back in play history
    if (currentHistoryIndex > 0) {
      const prevIndex = playHistory[currentHistoryIndex - 1];
      currentIndex = prevIndex;
      playSong(currentIndex, true);
    }
  } else {
    // In normal mode, go to previous song
    currentIndex--;
    if (currentIndex < 0) currentIndex = filteredSongs.length - 1;
    playSong(currentIndex);
  }
}

/* AUTO NEXT FIX */
audio.onended = () => {
  nextSong();
};

/* FAVORITE */
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
  const isFavorite = favorites.includes(id);
  favBtn.classList.toggle("active", isFavorite);
  
  if (isFavorite) {
    favBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" fill="currentColor"/>
      </svg>
    `;
  } else {
    favBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
      </svg>
    `;
  }
}

/* SEARCH */
searchInput.oninput = () => {
  const q = searchInput.value.toLowerCase();
  filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q)
  );
  currentIndex = -1;
  render();
};

/* TABS */
favTab.onclick = () => {
  favTab.classList.add("active");
  allTab.classList.remove("active");
  filteredSongs = songs.filter(s => favorites.includes(s.url));
  currentIndex = -1;
  render();
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    menuToggle.classList.remove('active');
  }
};

allTab.onclick = () => {
  allTab.classList.add("active");
  favTab.classList.remove("active");
  filteredSongs = songs;
  currentIndex = -1;
  render();
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    menuToggle.classList.remove('active');
  }
};

/* PROGRESS */
audio.ontimeupdate = () => {
  if (audio.duration) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progress.value = progressPercent;
    progressFill.style.width = progressPercent + '%';
    currentTimeEl.textContent = format(audio.currentTime);
  }
};

audio.onloadedmetadata = () => {
  if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
    durationEl.textContent = format(audio.duration);
  } else {
    durationEl.textContent = "0:00";
  }
};

// Also update duration when can play through
audio.addEventListener('canplaythrough', () => {
  if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
    durationEl.textContent = format(audio.duration);
  }
});

progress.oninput = () => {
  if (audio.duration) {
    audio.currentTime = (progress.value / 100) * audio.duration;
    progressFill.style.width = progress.value + '%';
  }
};

function format(t) {
  if (isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* VOLUME */
volume.oninput = () => {
  audio.volume = volume.value;
  updateVolumeIcon();
};

function updateVolumeIcon() {
  const volumeIcon = document.getElementById("volumeIcon");
  const vol = parseFloat(volume.value);
  
  if (vol === 0) {
    volumeIcon.innerHTML = `<path d="M13.5 2.25a.75.75 0 00-1.5 0v11.5a.75.75 0 001.5 0V2.25zM9.116.85l-5.8 3.35a2.14 2.14 0 00-1.33 1.332A2.14 2.14 0 002.634 7.2l5.8 3.35a.75.75 0 001.116-.65V1.5A.75.75 0 009.116.85z"/>`;
  } else if (vol < 0.5) {
    volumeIcon.innerHTML = `<path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z"/>`;
  } else {
    volumeIcon.innerHTML = `<path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z"/><path d="M11.5 13.614a5.752 5.752 0 000-11.228v1.55a4.252 4.252 0 010 8.127v1.55z"/>`;
  }
}

/* SHUFFLE / REPEAT */
shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
};

repeatBtn.onclick = () => {
  if (repeatMode === "off") {
    repeatMode = "all";
    repeatBtn.classList.add("active");
    repeatBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25h-8.5a2.25 2.25 0 00-2.25 2.25v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5z"/>
      </svg>
    `;
  } else if (repeatMode === "all") {
    repeatMode = "one";
    repeatBtn.classList.add("active");
    repeatBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M0 4.75A3.75 3.75 0 013.75 1h.75v1.5h-.75A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5zM12.25 2.5V1h-.75A3.75 3.75 0 007.75 4.75v5A3.75 3.75 0 0011.5 13.5h.75V12h-.75a2.25 2.25 0 01-2.25-2.25v-5a2.25 2.25 0 012.25-2.25h.75z"/>
        <path d="M8 8V5.75l2.25 2.25L8 10.25V8z"/>
        <text x="7" y="11" font-size="7" fill="currentColor" font-weight="bold">1</text>
      </svg>
    `;
  } else {
    repeatMode = "off";
    repeatBtn.classList.remove("active");
    repeatBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path d="M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25h-8.5a2.25 2.25 0 00-2.25 2.25v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5z"/>
      </svg>
    `;
  }
};