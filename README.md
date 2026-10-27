# E-FLOW — Campus E-Bike Rental PWA

> **Version 1.0 (MVP) — SSN College of Engineering**  
> A full-stack campus e-bike rental Progressive Web App designed with a swappable smart-lock IoT architecture.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Leaflet (OpenStreetMap), Lucide Icons, Vite PWA (`vite-plugin-pwa`).
- **Backend:** Java 21 / 24, Spring Boot 3.4.x, Spring Web, Spring Security, JWT, Spring Data JPA / Hibernate, Bean Validation, Spring Mail, SpringDoc OpenAPI (Swagger).
- **Database:** PostgreSQL 16 (Docker Compose or local instance) + Flyway Migrations. Plain Haversine formula for geofencing.
- **IoT & Smart Locks:** Modular `DeviceGateway` interface supporting:
  - `SimulatorAdapter` (in-process, default)
  - `HttpAdapter` (ESP32 smart lock via local HTTP endpoint)
  - `MqttAdapter` (MQTT broker / Mosquitto)

---

## 🚀 Quick Start & Development

### 1. Database Setup
```bash
docker compose up -d postgres
```
*(Or point `POSTGRES_*` environment variables in `.env` to your local PostgreSQL instance).*

### 2. Backend Setup
```bash
cd backend
..\maven-bin\apache-maven-3.9.9\bin\mvn.cmd clean compile
..\maven-bin\apache-maven-3.9.9\bin\mvn.cmd test
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```

---

## 🔐 Authentication & Dev Credentials (Phase 2)

In development mode (`application-dev.yml`), OTP verification codes are printed directly to the backend terminal log.

### Pre-seeded Dev Accounts:
- **Admin:** `admin@ssn.edu.in` / `admin123` (Pre-verified, role: `ADMIN`)
- **Student:** `student@ssn.edu.in` / `student123` (Pre-verified, role: `STUDENT`)

### Testing Registration Flow:
1. Register with a name, email (`<username>@ssn.edu.in`), and password.
2. In dev mode, enter the standard test OTP `123456` on the `/verify-otp` screen.

---

## 🛡️ Admin Command Center (`/admin`)

E-FLOW features a real-time, enterprise-grade Admin Operations Command Center:

- **Log in as Admin:** `admin@ssn.edu.in` / `admin123`
- **URL:** `http://localhost:5173/admin`

### Key Modules:
1. **Live Operations & KPI Metrics:** Real-time counters for Fleet Health, Active Rides, Online Smart Locks, Campus Stand Balancing, and Today's Revenue.
2. **E-Bike Fleet Management:** Search, filter, and control all e-bikes. Toggle Maintenance mode, force battery recharges, or relocate bikes between campus stands.
3. **Campus Stands & Geofences:** Monitor dock capacity, adjust return radius (e.g. 40m geofence), and view live occupancy percentages.
4. **IoT Smart Lock Hardware Console:** Real-time simulator console with interactive hardware commands: **Force UNLOCK**, **Force LOCK**, and **Toggle Online/Offline** with sensor acknowledgement streams.
5. **Student Directory & Access Control:** View registered students and apply or release safety rental restrictions.
6. **Security & Audit Trail:** Chronological ledger of all administrative and hardware events.

