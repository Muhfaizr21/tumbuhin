package models

type Balita struct {
	ID            string  `json:"id"`
	Nama          string  `json:"nama"`
	JenisKelamin  string  `json:"jenis_kelamin"`
	TanggalLahir  string  `json:"tanggal_lahir"`
	BeratLahir    float64 `json:"berat_lahir"`
	PanjangLahir  float64 `json:"panjang_lahir"`
	NamaIbu       string  `json:"nama_ibu"`
	NamaAyah      string  `json:"nama_ayah"`
	NoWA          string  `json:"no_wa"`
	RT            string  `json:"rt"`
	RW            string  `json:"rw"`
	Alergi        string  `json:"alergi"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	NIKHash       string  `json:"nik_hash"`
	MagicToken    string  `json:"magic_token"`
	StatusGizi    string  `json:"status_gizi"`
	PosyanduName  string  `json:"posyandu_name"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
}
