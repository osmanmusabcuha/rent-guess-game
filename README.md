# 🏠 Rent Guess Game

Türkiye genelindeki gerçek emlak verilerini kullanarak kira fiyatlarını tahmin ettiğiniz bir web uygulamasıdır.

## 🚀 Özellikler

*   **Gerçek Veriler:** 2500+ emlak ilanı.
*   **Kullanıcı Sistemi:** JWT tabanlı giriş ve profil yönetimi.
*   **Liderlik Tablosu:** Diğer oyuncularla rekabet.
*   **Emlak IQ:** Tahmin doğruluğuna dayalı performans analizi.
*   **Oyun Modları:** Kolay ve Zor zorluk seviyeleri, Blitz modu.

## 🛠️ Teknoloji Yığını

*   **Frontend:** React, Vite, Tailwind CSS.
*   **Backend:** Python FastAPI, JWT.
*   **Veritabanı:** SQLite3.

## 📦 Kurulum ve Çalıştırma

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python migrate_to_sqlite.py  # İlk çalışma için
python app.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---
*Rent Guess Game - Emlak piyasası tahmin oyunu.*
