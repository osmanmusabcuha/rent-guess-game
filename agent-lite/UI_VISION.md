# UI Vision: Premium Game Dashboard

Rent Guess Game'in arayüzü, Lovable tarafından tasarlanan modern, karanlık ve premium bir oyun dashboard'u estetiğine sahiptir. API bağlantısı bu görselliği bozmamalıdır.

## Tasarım Koruma Prensipleri
- **Sıfır Tasarım Bozulması:** API'den gelen veriler UI'ı bozmamalı, gerekirse UI'ın beklediği formata `api.ts` içinde çevrilmelidir.
- **Kesintisiz Animasyonlar:** API gecikmeleri sırasında uygun loaderlar kullanılmalı, Framer Motion geçişleri korunmalıdır.
- **Neon & Dark Tema:** Antrasit zemin, neon mercan ve elektrik mavisi vurgular API'den gelen dinamik verilerle (Puan, IQ, Level) uyumlu şekilde güncellenmelidir.

## Ana Paneller ve Veri Bağlantısı
1. **Sol Panel (Progression):** Backend'den gelen kullanıcı istatistikleri ve Emlak IQ verileriyle beslenir.
2. **Merkez Panel (Görsel):** API'den gelen yüksek kaliteli ilan fotoğraflarını sergiler.
3. **Sağ Panel (Specs):** İlanın teknik detaylarını (Oda sayısı, Metrekare vb.) backend'den alarak ikonik formatta sunar.
4. **Modallar:** Auth, Liderlik Tablosu ve Oda Ayarları için kullanılan cam efekti (blur) modallar API entegrasyonu sonrası da aynı şıklıkta kalmalıdır.

## Karakter ve Seviye Görselleştirmesi
- Kullanıcının seviye atlaması (Level up), API'den gelen yeni statü verisiyle tetiklenen görsel bir kutlama ile sunulmalıdır.
- İlerleme çubukları (Progress bar) her puan kazanımında akıcı bir şekilde dolmalıdır.
