# Project Context: Rent Guess Game - Integration Phase

Rent Guess Game, gerçek emlak verilerini oyunlaştıran bir SaaS platformudur. Mevcut aşama, **frontend_lovable** içindeki modern UI'ın mevcut **FastAPI backend**'e kontrollü ve güvenli bir şekilde bağlanmasıdır.

## Core Stack
- **Backend:** Python FastAPI (REST API), SQLite (Database).
- **Frontend:** React + Vite (Lovable UI), Tailwind CSS, Framer Motion.
- **Integration Layer:** `frontend_lovable/src/lib/api.ts` (Tüm API trafiği ve veri normalizasyonu burada toplanır).

## Temel Hedef: Kontrollü Bağlantı
Amacımız, mevcut çalışan backend yapısını ve veritabanı şemasını bozmadan, yeni UI'ı aşama aşama gerçek verilere bağlamaktır.

## Oyun Akışı (Gameplay Loop)
1. **İlan Sunumu:** API'den (`api.ts` üzerinden) gelen normalize edilmiş ilan verileri.
2. **Tahmin:** Oyuncunun girdiği kira bedelinin backend tarafından doğrulanması.
3. **Reveal:** Gerçek bedelin gösterilmesi ve skorun UI'a yansıtılması.
4. **Progression:** Kazanılan puanların profil ve liderlik tablosu ile senkronizasyonu.

## Modlar & Özellikler
- **Solo Play:** Hızlı tahmin ve öğrenme modu.
- **Multiplayer (Rooms):** Oda kurma, katılma ve gerçek zamanlı rekabet (Lobby/Game/Results).
- **Daily Challenge:** Günlük özel ilanlar ve global rekabet.
- **Profile:** Kullanıcı istatistikleri ve Emlak IQ takibi.

## Kısıtlamalar
- Backend koduna dokunulmaz.
- Veritabanı şeması değiştirilmez.
- UI tasarımı ve component yapısı bozulmaz.
