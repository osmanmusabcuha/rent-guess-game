# Checklist: Integration & Quality Assurance

Her görev tamamlandığında bu listeyi kontrol et.

## 1. Uygulama Öncelik Sırası
Aşağıdaki sıra ile ilerlendiğinden emin ol:
- [ ] Backend health check (Bağlantı var mı?)
- [ ] Frontend health check (UI ayakta mı?)
- [ ] `api.ts` kontrolü (Merkezi yönetim hazır mı?)
- [ ] Play ekranı (İlan yükleme)
- [ ] Guess gönderme (Sonuç reveal)
- [ ] Room create/join (Multiplayer başlangıç)
- [ ] Lobby ready/start (Oda yönetimi)
- [ ] Room game (Çok oyunculu yarış)
- [ ] Room results (Kazanan ekranı)
- [ ] Daily challenge (Günlük akış)
- [ ] Profile (İstatistikler)

## 2. Teknik Kontrol Listesi
- [ ] API çağrısı sadece `api.ts` üzerinden mi yapılıyor?
- [ ] Veri normalizasyonu (location->city vb.) `api.ts` içinde mi?
- [ ] Component içinde mapping logic var mı? (Olmamalı!)
- [ ] Backend endpoint veya DB şeması değişti mi? (Değişmemeli!)
- [ ] UI tasarımında kayma veya bozulma var mı?

## 3. Test ve Doğrulama
- [ ] Manuel test senaryosu yazıldı ve uygulandı mı?
- [ ] Console'da (F12) yeni hata mesajı var mı?
- [ ] Network sekmesinde istekler doğru endpoint'e mi gidiyor?
- [ ] Hatalı tahminlerde (Error handling) UI doğru tepkiyi veriyor mu?
