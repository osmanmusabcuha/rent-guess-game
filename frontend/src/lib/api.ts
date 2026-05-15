const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const normalizeListing = (listing: any) => {
  let images: string[] = [];
  
  if (typeof listing.images === 'string') {
    try {
      // JSON string ise parse et
      const parsed = JSON.parse(listing.images);
      images = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // Virgülle ayrılmış string ise split et
      if (listing.images.includes(',')) {
        images = listing.images.split(',').map((s: string) => s.trim());
      } else if (listing.images.trim()) {
        images = [listing.images.trim()];
      }
    }
  } else if (Array.isArray(listing.images)) {
    images = listing.images;
  }

  // Her görsel yolunu normalize et
  const normalizedImages = images.map((img: string) => {
    if (!img || typeof img !== 'string') return '';
    
    // Zaten http ile başlıyorsa dokunma (ama localhost:8000/images artık mount sayesinde çalışacak)
    if (img.startsWith('http')) return img;
    
    let path = img.trim();
    
    // /data ile başlıyorsa
    if (path.startsWith('/data/')) {
      return `${API_BASE}${path}`;
    }
    
    // data/ ile başlıyorsa
    if (path.startsWith('data/')) {
      return `${API_BASE}/${path}`;
    }
    
    // images/ ile başlıyorsa -> /images/ mount'una yönlendir
    if (path.startsWith('images/')) {
      return `${API_BASE}/${path}`;
    }

    // Relative ise /data/ altına koy (default)
    return `${API_BASE}/data/${path.startsWith('/') ? path.substring(1) : path}`;
  }).filter(url => url !== '');

  return {
    ...listing,
    city: listing.location || listing.city,
    images: normalizedImages
  };
};

const normalizePlayer = (player: any) => ({
  ...player,
  nickname: player.display_name || player.nickname
});

export const fetchLocations = async () => {
  try {
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error('Backend error');
    return await res.json();
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

export const fetchRandomListings = async (limit = 10, city = null) => {
  try {
    const url = new URL(`${API_BASE}/listings/random`);
    url.searchParams.append('limit', limit as any);
    if (city && city !== 'Tüm Şehirler') url.searchParams.append('location', city);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Backend error');
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeListing) : [];
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
};

export const submitGuess = async (listingId: number, guess: string | null, remainingTime?: number | null, totalTime?: number | null, reason: string = "guess") => {
  try {
    const res = await fetch(`${API_BASE}/guess`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        listing_id: listingId, 
        guess: guess ? parseInt(guess, 10) : null,
        remaining_time: remainingTime,
        total_time: totalTime,
        reason
      }),
    });
    if (!res.ok) throw new Error('Backend error');
    return await res.json();
  } catch (error) {
    console.error('Error submitting guess:', error);
    return null;
  }
};

export const login = async (username: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
    }
    return { ok: res.ok, data };
  } catch (error) {
    return { ok: false, data: { detail: 'Connection error' } };
  }
};

export const register = async (username: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    return { ok: false, data: { detail: 'Connection error' } };
  }
};

export const getMe = async () => {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const getLeaderboard = async () => {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
};

export const createRoom = async (settings: any) => {
  try {
    const backendPayload = {
      round_count: settings.round_count || 5,
      mode: settings.mode || 'multiplayer',
      difficulty: settings.difficulty || 'Normal',
      time_limit: settings.time_limit || 20,
      guest_nickname: settings.host_nickname || settings.guest_nickname || 'Oyuncu',
      guest_id: settings.host_id || settings.guest_id
    };

    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(backendPayload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Oda oluşturulamadı');
    }
    const data = await res.json();
    return {
      ...data,
      code: data.room_code // Ensure code property exists for UI
    };
  } catch (error) {
    console.error('Room creation error:', error);
    throw error;
  }
};

export const getRoom = async (roomCode: string) => {
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      ...data,
      listings: Array.isArray(data.listings) ? data.listings.map(normalizeListing) : [],
      settings: data.settings ? {
        ...data.settings,
        hostId: data.settings.host_id || data.settings.guest_id,
        nickname: data.settings.host_nickname || data.settings.guest_nickname
      } : null
    };
  } catch (error) {
    console.error('Error fetching room:', error);
    return null;
  }
};

export const submitRoomScore = async (roomCode: string, payload: any) => {
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error('Error submitting room score:', error);
    return false;
  }
};

export const getRoomLeaderboard = async (roomCode: string) => {
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/leaderboard`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizePlayer) : data;
  } catch (error) {
    console.error('Error fetching room leaderboard:', error);
    return [];
  }
};

export const joinRoom = async (roomCode: string, payload: any) => {
  try {
    const backendPayload = {
      guest_id: payload.guest_id,
      guest_nickname: payload.nickname || payload.guest_nickname
    };
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(backendPayload),
    });
    const data = await res.json();
    return {
      ...data,
      code: roomCode // Return code for navigation
    };
  } catch (error) {
    console.error('Error joining room:', error);
    return { ok: false };
  }
};

export const toggleReady = async (roomCode: string, payload: any) => {
  try {
    const backendPayload = {
      guest_id: payload.guest_id,
      guest_nickname: payload.nickname || payload.guest_nickname,
      is_ready: payload.is_ready ?? true
    };
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/ready`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(backendPayload),
    });
    return await res.json();
  } catch (error) {
    console.error('Error toggling ready:', error);
    return { ok: false };
  }
};

export const startGame = async (roomCode: string, guestId: string) => {
  try {
    const url = new URL(`${API_BASE}/rooms/${roomCode}/start`);
    if (guestId) url.searchParams.append('guest_id', guestId);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    console.error('Error starting game:', error);
    return { ok: false };
  }
};

export const getRoomState = async (roomCode: string) => {
  try {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/state`);
    if (!res.ok) return null;
    const data = await res.json();
    
    return {
      ...data,
      players: Array.isArray(data.players) ? data.players.map(normalizePlayer) : [],
      listings: Array.isArray(data.listings) ? data.listings.map(normalizeListing) : [],
      settings: data.settings ? {
        ...data.settings,
        hostId: data.settings.host_id || data.settings.guest_id,
        nickname: data.settings.host_nickname || data.settings.guest_nickname
      } : null
    };
  } catch (error) {
    console.error('Error fetching room state:', error);
    return null;
  }
};

export const updateRoomScore = async (roomCode: string, score: number, guestId: string) => {
  try {
    const url = new URL(`${API_BASE}/rooms/${roomCode}/score`);
    url.searchParams.append('score', score.toString());
    if (guestId) url.searchParams.append('guest_id', guestId);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    console.error('Error updating room score:', error);
    return { ok: false };
  }
};

export const getDailyChallenge = async () => {
  try {
    const res = await fetch(`${API_BASE}/daily-challenge`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    return null;
  }
};

export const submitDailyScore = async (payload: any) => {
  try {
    const res = await fetch(`${API_BASE}/daily-challenge/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    console.error('Error submitting daily score:', error);
    return { ok: false };
  }
};

export const getDailyLeaderboard = async () => {
  try {
    const res = await fetch(`${API_BASE}/daily-challenge/leaderboard`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizePlayer) : data;
  } catch (error) {
    console.error('Error fetching daily leaderboard:', error);
    return [];
  }
};

export const getProfileStats = async (guestId: string) => {
  try {
    const url = new URL(`${API_BASE}/profile/stats`);
    if (guestId) url.searchParams.append('guest_id', guestId);
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return null;
  }
};

export const getProfileHistory = async (guestId: string) => {
  try {
    const url = new URL(`${API_BASE}/profile/history`);
    if (guestId) url.searchParams.append('guest_id', guestId);
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
  } catch (error) {
    console.error('Error fetching profile history:', error);
    return [];
  }
};

