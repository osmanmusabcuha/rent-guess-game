# Coding Rules: Stability & Integration

Bu proje, mevcut backend üzerine yeni bir UI giydirme sürecindedir. Kod kalitesini ve sistem kararlılığını korumak için aşağıdaki kurallar zorunludur.

## Genel Kurallar
- **Analiz-Plan-Patch:** Önce analiz, sonra plan, en son minimum patch uygulanır.
- **Refactor Yasağı:** Büyük çaplı yapısal değişiklikler (refactoring) kesinlikle yasaktır.
- **UI Tasarım Koruma:** API bağlantısı yapılırken mevcut Lovable UI tasarımı ve responsive yapısı bozulmamalıdır.
- **Backend & DB Dokunulmazlığı:** Backend endpointleri ve SQLite veritabanı şeması değiştirilmez.

## Frontend & API Kuralları
- **Merkezi API (api.ts):** Tüm API bağlantıları `frontend_lovable/src/lib/api.ts` üzerinden yapılmalıdır. Component içinde `fetch` veya `axios` kullanılamaz.
- **Merkezi Normalizasyon:** Backend response ile frontend beklentisi uyuşmuyorsa, dönüşüm `api.ts` içindeki normalize fonksiyonlarıyla yapılmalıdır.
  - Örn: `location -> city`, `display_name -> nickname`.
- **Dağınık Mapping Yasağı:** Component içine dağınık mapping logic yazılamaz. Veri component'e ulaştığında UI'ın beklediği formatta olmalıdır.
- **Mock Veri Yasağı:** Gerçek API bağlantısı kurulmadan mock veya static veri kullanılmamalıdır.

## Veri Güvenliği & Stabilite
- **Veri Sızdırmama:** `/listings/random` cevabında `rent` bilgisi bulunmamalıdır.
- **Error Handling:** Her API çağrısı `try/catch` ile sarmalanmalı ve `api.ts` içinde merkezi hata yönetimine tabi olmalıdır.
- **Manuel Test:** Her patch sonrası ilgili akış için manuel test senaryosu çalıştırılmalıdır.
