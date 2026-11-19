# Tumbuhin Backend (Golang Clean Code MVC)

Backend RESTful API untuk Tumbuhin yang dibangun dengan Golang dan framework Gin, menerapkan arsitektur **MVC (Model-View-Controller) Clean Code** dengan pemisahan tanggung jawab (*Separation of Concerns*) dan *Dependency Injection*.

## 🏛️ Struktur Folder

```text
backend/
├── cmd/
│   └── api/
│       └── main.go              # Entrypoint aplikasi (Inisialisasi DI, Server, Graceful Shutdown)
├── config/
│   └── config.go                # Manajemen konfigurasi environment & server
├── controllers/                 # [C] Controller Layer: HTTP handlers, input validation, status code
│   ├── health_controller.go     # Endpoint health check
│   └── user_controller.go       # Endpoint CRUD user
├── models/                      # [M] Model Layer: Definisi entitas data & DTO request payload
│   └── user.go
├── views/                       # [V] View Layer: Standarisasi format response JSON API (Presenter)
│   └── response.go
├── services/                    # Business Logic Layer: Logika bisnis murni terpisah dari HTTP
│   └── user_service.go
├── repositories/                # Data Access Layer: Abstraksi akses data & interface database
│   └── user_repository.go
├── routes/                      # Routing: Grouping route API & konfigurasi CORS
│   └── routes.go
├── .env.example                 # Template variabel environment
├── .gitignore
├── Makefile                     # Shortcut perintah build, run, test
├── go.mod
└── go.sum
```

## 🚀 Cara Menjalankan

### 1. Jalankan Langsung (Development)
```bash
go run cmd/api/main.go
# atau
make run
```

### 2. Build Binary
```bash
make build
./bin/server
```

## 📡 Daftar Endpoint API

Base URL: `http://localhost:8080/api/v1`

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/health` | Health check & uptime status server |
| `GET` | `/api/v1/users` | Mengambil seluruh daftar user |
| `GET` | `/api/v1/users/:id` | Mengambil detail user berdasarkan ID |
| `POST` | `/api/v1/users` | Menambahkan user baru |
| `PUT` | `/api/v1/users/:id` | Memperbarui data user |
| `DELETE` | `/api/v1/users/:id` | Menghapus user berdasarkan ID |
