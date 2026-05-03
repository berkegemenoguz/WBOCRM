# Web-Based Operational CRM — Proje Planı (HW5 Part 2)

> **İstanbul Arel Üniversitesi · Bilgisayar Mühendisliği**  
> Son Teslim: **6 Mayıs 2026, Çarşamba**  
> Backend: `Node.js + Express` | Frontend: `React + Vite` | DB: `PostgreSQL` | Deploy: `Vercel + Render`

---

## İçindekiler

1. [Proje Kapsamı & Amaç](#1-proje-kapsamı--amaç)
2. [Teknoloji Yığını](#2-teknoloji-yığını)
3. [Mimari](#3-mimari)
4. [Veritabanı Şeması](#4-veritabanı-şeması)
5. [Geliştirme Akış Şeması](#5-geliştirme-akış-şeması)
6. [Lead Kayıt Akış Şeması](#6-lead-kayıt-akış-şeması)
7. [API Endpoint Tablosu](#7-api-endpoint-tablosu)
8. [Geliştirme Fazları](#8-geliştirme-fazları)
9. [User Stories](#9-user-stories)
10. [BDD Acceptance Criteria](#10-bdd-acceptance-criteria)
11. [Test Stratejisi](#11-test-stratejisi)
12. [Geliştirici Kuralları](#12-geliştirici-kuralları)
13. [Deployment Rehberi](#13-deployment-rehberi)
14. [Teslim Kontrol Listesi](#14-teslim-kontrol-listesi)

---

## 1. Proje Kapsamı & Amaç

> Bu plan, HW5 Part 2 kapsamında **dikey bir dilim (vertical slice)** prototip geliştirmek için hazırlanmıştır. Tam sistem değil; çalışan uçtan uca bir akış gösterilmesi beklenmektedir: **UI → Backend → Database → Response**

### Prototype Minimum Kapsamı

| Sayfa / Özellik | Açıklama |
|---|---|
| ✅ Home / Login Sayfası | JWT tabanlı kimlik doğrulama girişi |
| ✅ Lead Yönetim Sayfası | Lead kayıt + otomatik skor + öncelik listesi |
| ✅ Destek Bileti Sayfası | Bilet oluşturma & durum yönetimi |
| ✅ Uçtan uca akış | UI → API → DB → Response |
| ✅ Cloud deployment | Vercel (frontend) + Render (backend + DB) |

### Aktörler & Roller (RBAC)

| Rol | Yetkiler |
|---|---|
| **Sales Representative** | Lead yönetimi, pipeline güncelleme, dashboard |
| **Customer Support Staff** | Bilet yönetimi, durum güncelleme, dashboard |
| **System Administrator** | Kullanıcı yönetimi, RBAC atama, tüm görünümler |

### Kapsama Alınan Use Case'ler

| UC ID | Açıklama | Aktör | Öncelik |
|---|---|---|---|
| UC1 | Register New Lead | Sales Rep | **M** |
| UC2 | Calculate Lead Score | Sistem (otomatik) | **M** |
| UC3 | Manage Sales Pipeline | Sales Rep | **M** |
| UC4 | Generate Support Ticket | Support Staff | **M** |
| UC5 | Manage Ticket Status | Support Staff | **M** |
| UC6 | View Operational Dashboard | Tüm roller | **M** |
| UC7 | Manage RBAC & Users | Admin | S |

---

## 2. Teknoloji Yığını

| Katman | Teknoloji | Gerekçe |
|---|---|---|
| **Backend** | Node.js + Express.js | Hafif, RESTful API için ideal, geniş ekosistem |
| **Frontend** | React 18 + Vite | SPA mimarisi, hızlı geliştirme, bileşen tabanlı |
| **Veritabanı** | PostgreSQL | İlişkisel model, UNIQUE/CHECK kısıtları, ACID uyumlu |
| **Frontend Deploy** | Vercel | Vite projeleri için sıfır-konfigürasyon deployment |
| **Backend Deploy** | Render | Node.js web servisi + managed PostgreSQL desteği |
| **Auth** | jsonwebtoken + bcryptjs | JWT token yönetimi, bcrypt hash (NFR-ST-08) |
| **Test (Backend)** | Jest + Supertest + Cucumber | Unit, functional ve BDD acceptance testleri |
| **Test (Frontend)** | Vitest + Testing Library | React bileşen testleri |

### Backend `package.json` Bağımlılıkları

```json
{
  "dependencies": {
    "express": "^4.18",
    "pg": "^8.11",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9",
    "cors": "^2.8",
    "dotenv": "^16",
    "express-validator": "^7"
  },
  "devDependencies": {
    "jest": "^29",
    "supertest": "^6",
    "@cucumber/cucumber": "^10"
  }
}
```

### Frontend `package.json` Bağımlılıkları

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "^1.6"
  },
  "devDependencies": {
    "vite": "^5",
    "vitest": "^1",
    "@testing-library/react": "^14"
  }
}
```

> ⚠️ **Not:** Orijinal diyagramlarda Spring Boot/Java referansları bulunmaktadır. Bu plan ödevde belirlenen **Node.js + React** yığınına adapte edilmiştir. Mimari prensipler (3-tier, MVC, RESTful) aynı şekilde uygulanacaktır.

---

## 3. Mimari

### 3-Tier + MVC Layered Mimari

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                                  │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  React SPA (Vercel)                                          │  │
│   │  /login  |  /dashboard  |  /leads  |  /tickets              │  │
│   └─────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTPS / JSON
┌─────────────────────────────▼───────────────────────────────────────┐
│                    APPLICATION TIER (Render)                        │
│                                                                     │
│  ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│  │ Controller Layer│──▶│  Service Layer  │──▶│Repository Layer  │  │
│  │                 │   │                 │   │                  │  │
│  │ AuthController  │   │ AuthService     │   │ UserRepository   │  │
│  │ LeadController  │   │ LeadService     │   │ LeadRepository   │  │
│  │ TicketController│   │ ScoringService  │   │ TicketRepository │  │
│  │ LogController   │   │ TicketService   │   │ LogRepository    │  │
│  └─────────────────┘   │ LogService      │   └────────┬─────────┘  │
│                        └─────────────────┘            │            │
│  ┌──────────────────────────────────────┐             │ SQL/SSL    │
│  │  RBAC Middleware (JWT + Role Check)  │             │            │
│  │  NFR-ST-02 — bcryptjs + jsonwebtoken │             │            │
│  └──────────────────────────────────────┘             │            │
└──────────────────────────────────────────────────────┼─────────────┘
                                                        │
┌───────────────────────────────────────────────────────▼─────────────┐
│                    DATA TIER (Render PostgreSQL)                     │
│                                                                     │
│   📋 UserAccount  |  📋 Lead  |  📋 SupportTicket  |  📋 InteractionLog │
└─────────────────────────────────────────────────────────────────────┘
```

### Proje Klasör Yapısı

**Backend (Node.js)**

```
backend/
├── src/
│   ├── controllers/        # Controller katmanı
│   │   ├── authController.js
│   │   ├── leadController.js
│   │   ├── ticketController.js
│   │   └── logController.js
│   ├── services/           # İş mantığı
│   │   ├── authService.js
│   │   ├── leadService.js
│   │   ├── scoringService.js
│   │   └── ticketService.js
│   ├── repositories/       # DB sorguları
│   │   ├── leadRepository.js
│   │   ├── ticketRepository.js
│   │   └── userRepository.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── rbacMiddleware.js
│   ├── routes/
│   │   └── index.js
│   └── db/
│       └── pool.js         # pg Pool
├── tests/
│   ├── unit/
│   ├── functional/
│   └── features/           # Cucumber .feature dosyaları
├── .env
└── server.js
```

**Frontend (React)**

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── LeadPage.jsx
│   │   └── TicketPage.jsx
│   ├── components/
│   │   ├── LeadForm.jsx
│   │   ├── TicketForm.jsx
│   │   ├── PriorityTable.jsx
│   │   └── NavBar.jsx
│   ├── services/
│   │   └── api.js          # axios instance
│   ├── context/
│   │   └── AuthContext.jsx
│   └── App.jsx
├── tests/
├── vite.config.js
└── vercel.json
```

---

## 4. Veritabanı Şeması

> ER Diyagramı (§3.3) ve Class Diyagramı (§3.4) kaynaklıdır.

```sql
-- UserAccount (NFR-ST-02: RBAC, NFR-ST-08: bcrypt hash)
CREATE TABLE UserAccount (
  user_id       SERIAL PRIMARY KEY,
  user_email    VARCHAR(48)  UNIQUE NOT NULL,  -- class diagram: String[48]
  user_password VARCHAR(255) NOT NULL,          -- bcrypt hash, düz metin YASAK
  rbac_role     VARCHAR(20)  NOT NULL
                CHECK (rbac_role IN ('sales', 'support', 'admin')),
  full_name     VARCHAR(100) NOT NULL
);

-- Lead (FR-ST-01, FR-UC-02)
CREATE TABLE Lead (
  lead_id        SERIAL PRIMARY KEY,
  email          VARCHAR(100) UNIQUE NOT NULL,  -- Activity Diagram: email unique kontrolü zorunlu
  contact_name   VARCHAR(100) NOT NULL,
  priority_score DECIMAL(5,2) DEFAULT 0.0,      -- UC2: dynamic score (hesaplama ≤500ms)
  pipeline_stage VARCHAR(50)  DEFAULT 'New',    -- UC3: 'New'|'Contacted'|'Qualified'|'Closed'
  user_id        INTEGER REFERENCES UserAccount(user_id),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- SupportTicket (FR-ST-05, FR-ST-07)
CREATE TABLE SupportTicket (
  ticket_id      SERIAL PRIMARY KEY,
  description    TEXT NOT NULL,
  priority_level VARCHAR(10) NOT NULL
                 CHECK (priority_level IN ('Low', 'Medium', 'High')),  -- FR-SC-10
  status         VARCHAR(20) DEFAULT 'Open'
                 CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  lead_id        INTEGER REFERENCES Lead(lead_id),
  user_id        INTEGER REFERENCES UserAccount(user_id),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- InteractionLog (FR-ST-04)
CREATE TABLE InteractionLog (
  log_id    SERIAL PRIMARY KEY,
  note_text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  lead_id   INTEGER REFERENCES Lead(lead_id),
  user_id   INTEGER REFERENCES UserAccount(user_id)
);
```

### Tablo İlişkileri (ER Diyagramından)

```
UserAccount "1" ──── "N" Lead           : manages
UserAccount "1" ──── "N" SupportTicket  : handles
UserAccount "1" ──── "N" InteractionLog : authors
Lead        "1" ──── "N" SupportTicket  : has
Lead        "1" ──── "N" InteractionLog : collects
```

---

## 5. Geliştirme Akış Şeması

```
                        ┌──────────┐
                        │  BAŞLA   │
                        └────┬─────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 1         │
                    │ Proje Kurulumu  │
                    │ Repo · .env     │
                    │ DB bağlantısı   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 2         │
                    │ Veritabanı      │  ◀── Kural: Her faz öncesi
                    │ Şema Oluşturma  │         birim testleri yaz
                    └────────┬────────┘         (TDD — Red→Green→Refactor)
                             │
                    ┌────────▼────────┐
                    │   FAZ 3         │
                    │ Auth & RBAC     │  ◀── Kural: JWT token 30 dk timeout
                    │ JWT · bcrypt    │         (NFR-ST-09)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 4         │
                    │ Lead API        │  ◀── Kural: Email unique kontrolü
                    │ CRUD + Scoring  │         zorunlu (Activity Diagram)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 5         │
                    │ Destek Bileti   │
                    │ API             │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 6         │
                    │ React Frontend  │
                    │ 4 sayfa         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 7         │
                    │ Test (BDD/TDD)  │
                    │ Jest · Cucumber │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 8         │
                    │ Cloud Deploy    │
                    │ Vercel + Render │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   FAZ 9         │
                    │ Doküman & Teslim│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ TAMAMLANDI ✓    │
                    └─────────────────┘
```

---

## 6. Lead Kayıt Akış Şeması

> Activity Diagram (§3.5) ve Sequence Diagram (§3.6) temel alınmıştır. Geliştirici bu akışı birebir uygulamalıdır.

```
Sales Rep (UI)        React Frontend        Node.js API          PostgreSQL DB
─────────────         ──────────────        ───────────          ─────────────
     │                      │                    │                     │
     │  Lead formunu açar   │                    │                     │
     │──────────────────▶   │                    │                     │
     │                      │                    │                     │
     │  İletişim bilgileri  │                    │                     │
     │  ve metrikleri girer │                    │                     │
     │                      │                    │                     │
     │  Submit              │                    │                     │
     │─────────────────────▶│                    │                     │
     │                      │ POST /api/leads     │                     │
     │                      │───────────────────▶│                     │
     │                      │                    │ checkUniqueEmail()  │
     │                      │                    │────────────────────▶│
     │                      │                    │                     │
     │                      │                    │◀────────────────────│
     │                      │                    │                     │
     │               ┌──────┴──────┐             │                     │
     │               │Email Unique?│             │                     │
     │               └──────┬──────┘             │                     │
     │                      │                    │                     │
     │    ┌─────────── HAYIR│                    │                     │
     │    │                 │                    │                     │
     │    │    400 Bad Request ◀─────────────────│                     │
     │◀───│    "Duplicate Email" hatası          │                     │
  [BİTİŞ-Hata]                                   │                     │
     │                      │                    │                     │
     │           EVET ───────┘                   │                     │
     │                      │                    │                     │
     │                      │    ScoringService  │                     │
     │                      │    calculateScore()│                     │
     │                      │    ≤ 500ms         │                     │
     │                      │                    │ saveLead()          │
     │                      │                    │────────────────────▶│
     │                      │                    │       201 Created   │
     │                      │  201 Created ◀─────│◀────────────────────│
     │  Dashboard yenilenir │                    │                     │
     │◀─────────────────────│                    │                     │
  [BİTİŞ-Başarılı ✓]
```

---

## 7. API Endpoint Tablosu

> Tüm endpointler `/api` prefix'i ile başlar. JSON response döner.  
> 🔒 işaretli endpointler `Authorization: Bearer <token>` header'ı gerektirir.

### Auth

| Metod | Endpoint | Açıklama |
|---|---|---|
| `POST` | `/api/auth/register` | Kullanıcı kaydı |
| `POST` | `/api/auth/login` | JWT token al |

### Lead Yönetimi 🔒

| Metod | Endpoint | Açıklama | Gereksinim |
|---|---|---|---|
| `GET` | `/api/leads` | Öncelik sıralı liste | FR-SC-03 |
| `POST` | `/api/leads` | Yeni lead + otomatik skor | FR-ST-01, UC2 |
| `GET` | `/api/leads/:id` | Tekil lead detay | — |
| `PUT` | `/api/leads/:id` | Pipeline stage güncelle | UC3 |
| `DELETE` | `/api/leads/:id` | Lead sil | — |
| `GET` | `/api/leads/:id/logs` | Etkileşim geçmişi | FR-ST-04 |
| `POST` | `/api/leads/:id/logs` | Not ekle | FR-ST-04 |

### Destek Bileti 🔒

| Metod | Endpoint | Açıklama | Gereksinim |
|---|---|---|---|
| `GET` | `/api/tickets` | Tüm biletler | FR-ST-09 |
| `POST` | `/api/tickets` | Bilet oluştur | UC4 |
| `GET` | `/api/tickets/:id` | Bilet detay | — |
| `PUT` | `/api/tickets/:id` | Durum + öncelik güncelle | UC5, FR-SC-10 |
| `DELETE` | `/api/tickets/:id` | Bilet sil | — |

### Dashboard & Kullanıcı Yönetimi 🔒

| Metod | Endpoint | Açıklama | Gereksinim |
|---|---|---|---|
| `GET` | `/api/dashboard` | Aktif lead + açık bilet sayısı + top-5 | UC6, FR-ST-06 |
| `GET` | `/api/users` | Kullanıcı listesi (yalnızca admin) | UC7 |
| `PUT` | `/api/users/:id/role` | RBAC rol atama (yalnızca admin) | UC7, NFR-ST-02 |

---

## 8. Geliştirme Fazları

### Faz 1 — Proje Kurulumu

- [ ] `backend/` ve `frontend/` klasörlerini oluştur
- [ ] Backend: `npm init`, Express kurulumu, `.env` dosyası (`DATABASE_URL`, `JWT_SECRET`, `PORT`)
- [ ] Frontend: `npm create vite@latest`, React şablonu seç
- [ ] PostgreSQL bağlantı havuzu (`pg.Pool`) kur, bağlantıyı test et
- [ ] CORS middleware'i yalnızca Vercel frontend URL'ine izin verecek şekilde ayarla
- [ ] Git repository başlat, `.gitignore`'a `.env` ekle

### Faz 2 — Veritabanı Şeması

- [ ] Render üzerinde PostgreSQL servisi oluştur, `DATABASE_URL`'yi kopyala
- [ ] §4'teki SQL şemalarını çalıştır (sırayla: UserAccount → Lead → SupportTicket → InteractionLog)
- [ ] UNIQUE kısıtlamalarını doğrula (`user_email`, `email`)
- [ ] CHECK constraint'lerini doğrula (`rbac_role`, `priority_level`, `status`)
- [ ] Seed script yaz (`db/seed.js`) — test verileri

### Faz 3 — Kimlik Doğrulama & RBAC

- [ ] `POST /api/auth/register`: bcryptjs ile şifre hash'le (`saltRounds=12` — NFR-ST-08)
- [ ] `POST /api/auth/login`: bcrypt.compare → JWT token üret (`expiresIn: '30m'` — NFR-ST-09)
- [ ] `authMiddleware.js`: Bearer token doğrulama, `req.user`'a ekle
- [ ] `rbacMiddleware.js`: `allowRoles('sales', 'admin')` factory function
- [ ] Email 48 karakter sınırı validasyonu (class diagram: `String[48]`)
- [ ] **TDD**: authService için Jest testleri yaz

### Faz 4 — Lead Yönetim API

- [ ] `POST /api/leads`: email unique kontrolü → ScoringService → DB kayıt
- [ ] **Lead Scoring Algoritması**: engagement metriklerine göre 0–100 arası dinamik skor; yanıt ≤500ms (NFR-SC-01)
- [ ] `GET /api/leads`: `ORDER BY priority_score DESC` (FR-SC-03)
- [ ] `PUT /api/leads/:id`: pipeline_stage güncelleme (UC3)
- [ ] InteractionLog CRUD: `GET/POST /api/leads/:id/logs` (FR-ST-04)
- [ ] **TDD**: scoringService.calculateScore() için Jest testleri

### Faz 5 — Destek Bileti API

- [ ] `POST /api/tickets`: lead_id zorunlu, priority_level (Low/Medium/High — FR-SC-10)
- [ ] `PUT /api/tickets/:id`: status ve priority_level güncelleme (UC5)
- [ ] `GET /api/tickets`: support ve admin rolü görebilir
- [ ] Concurrent conflict detection: eş zamanlı güncelleme çakışma kontrolü (NFR-ST-05)
- [ ] **TDD**: ticketService için Jest testleri

### Faz 6 — React Frontend

- [ ] **LoginPage.jsx**: form → `POST /api/auth/login` → JWT'yi kaydet → yönlendir
- [ ] **DashboardPage.jsx**: aktif lead sayısı, açık bilet sayısı, top-5 öncelik tablosu (UC6)
- [ ] **LeadPage.jsx**: Lead listesi + LeadForm + pipeline dropdown + log geçmişi
- [ ] **TicketPage.jsx**: Bilet listesi + TicketForm + durum/öncelik güncelleme
- [ ] `api.js`: axios instance, baseURL = Render backend URL, otomatik Authorization header
- [ ] AuthContext ile global kullanıcı durumu, korumalı route'lar
- [ ] Cross-platform: minimum 705px ekran genişliği (NFR-ST-03)
- [ ] Lead kayıt formu maksimum 3 ekran tıklamasında tamamlanabilmeli (NFR-ST-01)

### Faz 7 — Test (BDD/TDD)

- [ ] **Unit Tests (Jest)**: scoringService, authService, ticketService için izole testler
- [ ] **Functional Tests (Supertest)**: API endpoint'lerinin doğru HTTP kodu döndürdüğünü test et
- [ ] **Acceptance Tests (Cucumber)**: `features/lead_registration.feature` BDD senaryoları
- [ ] Test geçme kanıtları: terminal çıktısını `test_results/` klasörüne kaydet

### Faz 8 — Cloud Deployment

- [ ] **Backend → Render**: GitHub entegrasyonu, ortam değişkenlerini ekle (`DATABASE_URL`, `JWT_SECRET`)
- [ ] **Frontend → Vercel**: GitHub entegrasyonu, `VITE_API_URL` = Render backend URL
- [ ] **DB → Render PostgreSQL**: Managed servis, SSL zorunlu (NFR-ST-07)
- [ ] Deploy URL'lerini `deployment_info.txt` dosyasına yaz
- [ ] Canlı sistem üzerinde uçtan uca akışı test et ve ekran görüntüsü al

### Faz 9 — Doküman & Teslim

- [ ] `architecture_description.pdf` — Deployment + Component diyagramı (en az 2)
- [ ] `implementation_summary.pdf` — neler uygulandı, tasarım kararları (1 sayfa)
- [ ] `user_stories.pdf` — US-01 ile US-08
- [ ] `acceptance_tests.pdf` — BDD Given/When/Then kriterleri
- [ ] Zip dosyası oluştur: `FirstSaaSPrototype/` klasör yapısını kontrol et

---

## 9. User Stories

| ID | Rol | User Story | Gereksinim | Öncelik |
|---|---|---|---|---|
| US-01 | Sales Rep | Yeni bir lead kaydedebilmek istiyorum ki müşteri adayı iletişim bilgilerini sisteme girebiliyeyim. | FR-ST-01, UC1 | **M** |
| US-02 | Sales Rep | Lead kaydedildiğinde otomatik öncelik skoru görmek istiyorum ki hangi lead'e önce odaklanacağımı bileyim. | FR-UC-02, UC2 | **M** |
| US-03 | Sales Rep | Lead'lerin öncelik sırasına göre listelendiği dashboard'u görmek istiyorum ki en değerli müşteri adaylarını hızla belirleyebileyim. | FR-SC-03, UC6 | **M** |
| US-04 | Sales Rep | Lead'in satış pipeline aşamasını güncelleyebilmek istiyorum ki satış sürecinin nerede olduğunu takip edebileyim. | FR-SC-05, UC3 | **M** |
| US-05 | Support Staff | Bir lead'e bağlı destek bileti oluşturabilmek istiyorum ki müşteri sorularını sistematik kayıt altına alabileyim. | FR-ST-07, UC4 | **M** |
| US-06 | Support Staff | Bir biletin durumunu ve öncelik seviyesini güncelleyebilmek istiyorum ki biletlerin çözüm sürecini yönetebiliyeyim. | FR-UC-08, FR-SC-10, UC5 | **M** |
| US-07 | Admin | Kullanıcılara RBAC rolü atayabilmek istiyorum ki sisteme erişim yetkilerini kontrol edebileyim. | NFR-ST-02, UC7 | S |
| US-08 | Tüm roller | Sisteme güvenli şekilde giriş yapabilmek istiyorum ki yalnızca yetkili kullanıcılar verilere erişebilin. | NFR-ST-08, NFR-ST-09 | **M** |

---

## 10. BDD Acceptance Criteria

### US-01 & US-02 — Lead Kaydı & Otomatik Skor

```gherkin
Feature: Lead Registration with Automatic Scoring

  Scenario: Successful new lead registration (Scenario 1 — Activity Diagram)
    Given Sales Rep giriş yapmış ve Lead formu açık
    When "contact_name: Ali Veli, email: ali@example.com, metrics: {calls:3}" gönderir
    Then sistem emailin benzersiz olduğunu doğrular
    And ScoringService 500ms içinde priority_score hesaplar
    And DB'ye lead kaydedilir, 201 Created döner
    And dashboard öncelik listesi yenilenir

  Scenario: Duplicate email rejection (Scenario 3 — Activity Diagram)
    Given "ali@example.com" sistemde zaten mevcut
    When aynı email ile yeni lead kaydı gönderilir
    Then API 400 Bad Request döner
    And "Duplicate Email" hata mesajı görüntülenir
    And DB'ye herhangi bir kayıt eklenmez
```

### US-05 — Destek Bileti Oluşturma

```gherkin
Feature: Support Ticket Generation

  Scenario: Create a support ticket linked to a lead
    Given Support Staff giriş yapmış
    And lead_id=5 sistemde mevcut
    When "description, priority_level: High, lead_id: 5" ile POST /api/tickets çağırır
    Then bilet status "Open" ile oluşturulur
    And 201 Created döner
    And bilet listesinde görünür
```

### US-08 — Güvenli Giriş & Session Timeout

```gherkin
Feature: Authentication & Session Management

  Scenario: Successful login
    Given kayıtlı kullanıcı "egemen@crm.com" ve doğru şifre
    When POST /api/auth/login çağırır
    Then JWT token döner, 200 OK
    And token 30 dakika süre ile geçerlidir (NFR-ST-09)

  Scenario: Idle session timeout
    Given kullanıcı 30 dakika hiçbir işlem yapmamış
    When korumalı bir endpoint'e istek gönderir
    Then API 401 Unauthorized döner
    And kullanıcı login sayfasına yönlendirilir
```

---

## 11. Test Stratejisi

### Unit Tests (Jest)

| Test Dosyası | Test Edilen | En Az Test Sayısı |
|---|---|---|
| `scoringService.test.js` | calculateScore() doğru skor üretiyor mu? | 3 |
| `authService.test.js` | hash & compare doğru mu? | 3 |
| `ticketService.test.js` | priority_level validation | 3 |

### Functional Tests (Supertest)

| Test | Beklenen |
|---|---|
| `POST /api/leads` (başarılı) | 201 Created |
| `POST /api/leads` (duplicate email) | 400 Bad Request |
| `GET /api/leads` | 200 + öncelik sıralı liste |
| `PUT /api/tickets/:id` | 200 OK |
| Yetkisiz istek (token yok) | 401 Unauthorized |
| Yanlış rol ile istek | 403 Forbidden |

### Acceptance Tests (Cucumber)

```
tests/features/
├── lead_registration.feature
├── duplicate_email.feature
├── ticket_creation.feature
└── auth_login.feature
```

> ⚠️ **Ödev Zorunluluğu:** Tüm testlerin geçtiğini gösteren kanıt (terminal ekran görüntüsü veya CI log) `test_results/` klasörüne eklenmeli ve `acceptance_tests.pdf`'e dahil edilmelidir.

---

## 12. Geliştirici Kuralları

> Tüm kurallar ödevin gereksinimlerinden doğrudan türetilmiş ve izlenebilir (traceable) bağlantılarla eşleştirilmiştir.

### 🏗 Mimari Kurallar

| # | Kural | İzlenebilirlik |
|---|---|---|
| **R1** | 3-Tier mimariye kesinlikle uy — Controller doğrudan DB'ye erişemez, Repository katmanından geçmek zorunlu | HW5 §Architectural Requirements, madde 2 |
| **R2** | Business logic Controller içine yazılmaz — Scoring algoritması Service katmanına aittir | HW5 §Architectural Requirements, madde 3 |
| **R3** | RESTful API: GET okuma, POST oluşturma, PUT güncelleme, DELETE silme — tüm response JSON | HW5 §RESTful API Design, madde 4 |

### 🔐 Güvenlik Kuralları

| # | Kural | İzlenebilirlik |
|---|---|---|
| **R4** | Şifreler kesinlikle düz metin saklanamaz — bcryptjs zorunlu (`saltRounds ≥ 12`) | NFR-ST-08 |
| **R5** | JWT token süresi 30 dakika — idle session timeout uygulanmalı | NFR-ST-09 |
| **R6** | RBAC middleware her korumalı endpoint'te aktif olmalı | NFR-ST-02 |
| **R7** | DB bağlantısı SSL ile şifrelenmiş olmalı (Render PostgreSQL) | NFR-ST-07 |
| **R8** | `JWT_SECRET` ve `DATABASE_URL` kesinlikle kaynak koduna yazılmaz — yalnızca `.env` ve platform ortam değişkenleri | Genel güvenlik |

### 📋 Veri & İş Mantığı Kuralları

| # | Kural | İzlenebilirlik |
|---|---|---|
| **R9** | Lead email UNIQUE olmalı — kayıt öncesi kontrol zorunlu; duplicate → 400 Bad Request | Activity Diagram §3.5, Sequence Diagram §3.6 |
| **R10** | Lead Scoring Algoritması 500ms'den uzun süremez | NFR-SC-01 (Performance) |
| **R11** | Pipeline stage değerleri sabit: `'New' \| 'Contacted' \| 'Qualified' \| 'Closed'` | FR-SC-05 |
| **R12** | Bilet priority_level: `Low \| Medium \| High` — başka değer kabul edilmez (DB CHECK + backend validation) | FR-SC-10 |
| **R13** | `UserAccount.user_email` maksimum 48 karakter | Class Diagram §3.4 |

### ⚛️ Frontend Kuralları

| # | Kural | İzlenebilirlik |
|---|---|---|
| **R14** | Lead kayıt formu en fazla 3 ekran tıklamasıyla tamamlanabilmeli | NFR-ST-01 |
| **R15** | Destek bileti arama/açma 5 saniyede tamamlanabilmeli | NFR-ST-03 |
| **R16** | Uygulama masaüstü ve mobil tarayıcıda çalışmalı — minimum 705px genişlik | NFR-ST-02 |

### 🧪 Test Kuralları

| # | Kural | İzlenebilirlik |
|---|---|---|
| **R17** | TDD zorunlu: Önce test yaz, sonra kodu uygula (Red → Green → Refactor) | HW5 §Development Paradigm |
| **R18** | Cucumber acceptance testleri Given/When/Then formatında yazılmalı | HW5 §Development Paradigm |

### 📦 Teslim Kuralları

| # | Kural | İzlenebilirlik |
|---|---|---|
| **R19** | En az 2 UML diyagramı raporda okunabilir şekilde yer almalı (Deployment + Component) | HW5 §Required Outputs, madde 1 |
| **R20** | Zip içindeki klasör yapısı birebir uyulmalı (`FirstSaaSPrototype/`) | HW5 §Submission Format |

---

## 13. Deployment Rehberi

### Backend → Render

1. render.com → "New Web Service" → GitHub repo bağla
2. Branch: `main`, Root Directory: `backend/`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Environment Variables ekle: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
6. "New PostgreSQL" servisi oluştur, External DB URL'ini kopyala
7. SQL şemalarını Render PostgreSQL shell üzerinden çalıştır

### Frontend → Vercel

1. vercel.com → "New Project" → GitHub repo bağla
2. Root Directory: `frontend/`, Framework: Vite
3. Build Command: `npm run build`, Output Directory: `dist`
4. Environment Variables: `VITE_API_URL=https://<render-url>.onrender.com`
5. Deploy et, URL'i not al
6. Render backend'e Vercel URL'ini CORS allowed origin olarak ekle

### `deployment_info.txt` Şablonu

```
# CRM SaaS Prototype — Deployment Info

Frontend URL  : https://crm-prototype.vercel.app
Backend URL   : https://crm-backend.onrender.com
DB Platform   : Render Managed PostgreSQL

Tech Stack:
  Backend  : Node.js v20 + Express.js
  Frontend : React v18 + Vite v5
  Database : PostgreSQL 16
  Auth     : JWT (jsonwebtoken) + bcryptjs

Deployment Date: [TARİH]
Team Leader    : [AD SOYAD]
```

---

## 14. Teslim Kontrol Listesi

### Dosya Yapısı

```
FirstSaaSPrototype/
├── source_code/         # backend/ + frontend/ kaynak kodu
├── test_code/           # tüm test dosyaları
├── architecture_description.pdf
├── implementation_summary.pdf
├── user_stories.pdf
├── acceptance_tests.pdf
├── test_results/        # test geçme ekran görüntüleri
├── screenshots/         # canlı uygulama görüntüleri
└── deployment_info.txt
```

### Teknik Gereksinimler

- [ ] Home (Login) sayfası çalışıyor
- [ ] Lead Yönetim sayfası çalışıyor (UC1, UC2, UC3)
- [ ] Destek Bileti sayfası çalışıyor (UC4, UC5)
- [ ] Dashboard sayfası çalışıyor (UC6)
- [ ] Uçtan uca akış: UI → API → DB → Response
- [ ] JWT auth + RBAC aktif
- [ ] Lead scoring ≤ 500ms
- [ ] Duplicate email 400 döndürüyor
- [ ] Unit testler geçiyor (Jest)
- [ ] Acceptance testler geçiyor (Cucumber)
- [ ] Frontend Vercel'de canlı
- [ ] Backend Render'da canlı
- [ ] Test geçme kanıtları `test_results/`'da mevcut
- [ ] En az 2 UML diyagramı `architecture_description.pdf`'te okunabilir

---

*Web-Based Operational CRM — HW5 Part 2 Proje Planı*  
*İstanbul Arel Üniversitesi, Bilgisayar Mühendisliği | Son Teslim: 6 Mayıs 2026*
