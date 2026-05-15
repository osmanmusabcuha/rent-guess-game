# API Contracts: Fixed Backend Interface

Tüm backend iletişimleri `frontend_lovable/src/lib/api.ts` dosyası üzerinden merkezi olarak yönetilmelidir. Backend endpointleri DEĞİŞTİRİLEMEZ.

## Merkezi Yönetim (api.ts)
- Hiçbir component doğrudan `fetch` veya `axios` çağırmamalıdır.
- Backend response ile frontend beklentisi uyuşmuyorsa mapping işlemi `api.ts` içinde yapılmalıdır.
- Veri normalizasyonu (Örn: `location -> city`, `display_name -> nickname`) merkezi fonksiyonlarla yapılmalıdır.

## Ana Endpoints (Sabit)

### 1. Health Check
- `GET /health`: Backend'in ayakta olup olmadığını kontrol eder.

### 2. İlanlar ve Tahmin
- `GET /locations`: Aktif şehirler ve ilan sayıları.
- `GET /listings/random`: Rastgele ilan listesi (Parametreler: `limit`, `city`).
- `POST /guess`: Tahmin kontrolü (`listing_id`, `user_guess`).

### 3. Multiplayer (Rooms)
- `POST /rooms/create`: Yeni oda oluşturma.
- `POST /rooms/join`: Odaya katılma.
- `GET /rooms/{room_id}`: Oda durumu (Lobby/Game).
- `POST /rooms/{room_id}/ready`: Hazır durumu.
- `POST /rooms/{room_id}/start`: Oyunu başlatma.

### 4. Auth & Stats
- `POST /login` & `/register`: Kimlik doğrulama.
- `GET /stats/me`: Kişisel performans verileri.
- `GET /leaderboard`: Global sıralama.

## Mapping Örneği (api.ts)
Eğer backend `location` dönüyor ama UI `city` bekliyorsa:
```typescript
const normalizeListing = (data: any) => ({
  ...data,
  city: data.location || data.city, // Merkezi dönüşüm
});
```
