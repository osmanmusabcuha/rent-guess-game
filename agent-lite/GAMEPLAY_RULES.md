# Gameplay Rules: Integrated Experience

Oyun deneyimi, backend verileriyle beslenen akıcı bir döngü üzerine kuruludur.

## Oyun Akışları

### 1. Solo Play (Öncelikli)
- Kullanıcı rastgele bir ilanla karşılaşır.
- Görseller ve teknik detaylar (Specs) API'den gelir.
- Tahmin sonrası backend'den gelen gerçek veri ile "Reveal" ekranı tetiklenir.

### 2. Multiplayer (Rooms & Lobby)
- **Oda Kurma:** Kullanıcı bir oda oluşturur ve bir ID alır.
- **Lobby:** Oyuncular "Ready" durumuna geçer. Tüm oyuncular hazır olduğunda host oyunu başlatır.
- **Game:** Tüm oyuncular aynı ilan için tahmin yapar.
- **Results:** Puanlar toplanır ve kazanan ilan edilir.

### 3. Daily Challenge
- Her gün tüm kullanıcılar için aynı olan özel bir ilan seti sunulur.
- Günlük skorlar global "Daily Leaderboard"a yansır.

## Temel Kurallar
- **Görsel Odak:** Görseller yüklenmeden tahmin alanı aktif olmamalıdır (`api.ts` üzerinden kontrol edilir).
- **Hızlı Feedback:** Her tahminden sonra hata payı ve kazanılan puan net bir şekilde gösterilmelidir.
- **Canlı İlerleme:** Kazanılan puanlar profil sayfasına ve liderlik tablosuna anlık yansıtılmalıdır.

## Kısıtlamalar
- UI tasarımı ve animasyonlar API bağlantısı sırasında bozulmamalıdır.
- Mock veriler kademeli olarak gerçek API cevaplarıyla değiştirilmelidir.
