# Change Workflow: Controlled Integration

Bu projede yapılacak her değişiklik, sistem bütünlüğünü korumak için aşağıdaki katı adımları takip etmelidir.

## 1. Analiz Aşaması (ÖNCE)
Değişiklik yapmadan önce mevcut durumu analiz et:
- Frontend hangi veriyi bekliyor? (Component incelemesi)
- Backend hangi veriyi dönüyor? (API incelemesi)
- Aradaki fark `api.ts` içinde nasıl normalize edilebilir?

## 2. Planlama Aşaması
- Yapılacak değişikliğin kapsamını belirle.
- **KURAL:** Büyük refactor yasak. Sadece bağlantıyı sağlayacak minimum kod değişikliği planlanmalı.
- Tek bir patch, sadece tek bir akışı (flow) düzeltmelidir.

## 3. Uygulama (Minimum Patch)
- Sadece `frontend_lovable/src/lib/api.ts` veya ilgili UI dosyasında bağlantı noktalarını değiştir.
- Backend, veritabanı ve UI tasarımına dokunma.
- Gereksiz satır değişikliklerinden kaçın.

## 4. Test Senaryosu Yazımı
Her değişiklikten sonra şu formatta bir manuel test senaryosu uygulanmalıdır:
- **Senaryo:** [Örn: Play butonuna basıldığında ilan yüklenmesi]
- **Beklenen Sonuç:** [Örn: Loader görünür, ardından gerçek ilan verisi ekrana gelir]
- **Kontrol Noktası:** [Örn: Network tabında /listings/random isteği başarılı mı?]

## 5. Doğrulama
1. Backend health check (Bağlantı aktif mi?)
2. Frontend UI tutarlılığı (Tasarım bozuldu mu?)
3. Console Check (F12'de yeni hata var mı?)
