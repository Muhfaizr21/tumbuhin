package laporan

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"strings"
	"time"

	laporanRepo "tumbuhin-backend/repositories/bidan/laporan"
)

// Service defines export and reporting operations.
type Service interface {
	GetReportData(ctx context.Context, villageName string, month, year int, posyanduID string) ([]laporanRepo.EPPGBMRow, *laporanRepo.ReportSummary, error)
	GenerateExport(ctx context.Context, villageName string, month, year int, posyanduID string, format string) ([]byte, string, string, error)
}

type serviceImpl struct {
	repo laporanRepo.Repository
}

// NewService instantiates the e-PPGBM report service.
func NewService(repo laporanRepo.Repository) Service {
	return &serviceImpl{repo: repo}
}

func (s *serviceImpl) GetReportData(ctx context.Context, villageName string, month, year int, posyanduID string) ([]laporanRepo.EPPGBMRow, *laporanRepo.ReportSummary, error) {
	if strings.TrimSpace(villageName) == "" {
		villageName = "Desa Sukamaju"
	}
	if month <= 0 || month > 12 {
		month = int(time.Now().Month())
	}
	if year < 2020 {
		year = time.Now().Year()
	}

	return s.repo.GetReportData(ctx, villageName, month, year, posyanduID)
}

func (s *serviceImpl) GenerateExport(ctx context.Context, villageName string, month, year int, posyanduID string, format string) ([]byte, string, string, error) {
	if strings.TrimSpace(villageName) == "" {
		villageName = "Desa Sukamaju"
	}
	if month <= 0 || month > 12 {
		month = int(time.Now().Month())
	}
	if year < 2020 {
		year = time.Now().Year()
	}

	rows, summary, err := s.repo.GetReportData(ctx, villageName, month, year, posyanduID)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed fetching report data: %w", err)
	}

	cleanVillage := strings.ReplaceAll(strings.TrimSpace(villageName), " ", "_")
	format = strings.ToLower(strings.TrimSpace(format))

	switch format {
	case "csv":
		data, err := generateCSV(rows, summary)
		if err != nil {
			return nil, "", "", err
		}
		filename := fmt.Sprintf("ePPGBM_Surveilans_%s_%d_%02d.csv", cleanVillage, year, month)
		return data, "text/csv; charset=utf-8", filename, nil

	case "pdf":
		data, err := generatePDF(rows, summary)
		if err != nil {
			return nil, "", "", err
		}
		filename := fmt.Sprintf("Laporan_Surveilans_%s_%d_%02d.pdf", cleanVillage, year, month)
		return data, "application/pdf", filename, nil

	default: // xlsx
		data, err := generateXLSX(rows, summary)
		if err != nil {
			return nil, "", "", err
		}
		filename := fmt.Sprintf("ePPGBM_Surveilans_%s_%d_%02d.xlsx", cleanVillage, year, month)
		return data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename, nil
	}
}

// generateCSV produces an Excel-friendly CSV with UTF-8 BOM.
func generateCSV(rows []laporanRepo.EPPGBMRow, summary *laporanRepo.ReportSummary) ([]byte, error) {
	var buf bytes.Buffer
	// UTF-8 BOM so Excel opens with proper Indonesian glyphs
	buf.WriteString("\xEF\xBB\xBF")

	w := csv.NewWriter(&buf)

	// Title headers
	_ = w.Write([]string{"LAPORAN RESMI SURVEILANS GIZI & e-PPGBM KEMENKES"})
	_ = w.Write([]string{fmt.Sprintf("Wilayah: %s | Periode: Bulan %d Tahun %d | Total Balita: %d", summary.VillageName, summary.PeriodMonth, summary.PeriodYear, summary.TotalChildren)})
	_ = w.Write([]string{""})

	// Table header
	headers := []string{
		"No",
		"NIK Balita (Hash)",
		"Nama Balita",
		"JK",
		"Tgl Lahir",
		"Usia (Bln)",
		"Nama Orang Tua",
		"No HP Ortu",
		"Posyandu",
		"RW",
		"RT",
		"Tgl Timbang Terakhir",
		"Berat Badan (kg)",
		"Tinggi Badan (cm)",
		"Z-Score BB/U",
		"Z-Score TB/U",
		"Z-Score BB/TB",
		"Status Gizi Klinis",
		"Skor ML Faltering (%)",
		"Tingkat Risiko",
		"Penerima PMT",
		"Jenis Paket PMT",
	}
	if err := w.Write(headers); err != nil {
		return nil, err
	}

	for _, r := range rows {
		pmtStr := "Tidak"
		if r.PMTReceived {
			pmtStr = "Ya"
		}
		line := []string{
			fmt.Sprintf("%d", r.No),
			r.NIKHash,
			r.ChildName,
			r.Gender,
			r.BirthDate,
			fmt.Sprintf("%d", r.AgeMonths),
			r.ParentName,
			r.ParentPhone,
			r.PosyanduName,
			r.RWCode,
			r.RTCode,
			r.MeasuredAt,
			fmt.Sprintf("%.2f", r.WeightKg),
			fmt.Sprintf("%.1f", r.HeightCm),
			fmt.Sprintf("%.2f", r.ZScoreWFA),
			fmt.Sprintf("%.2f", r.ZScoreHFA),
			fmt.Sprintf("%.2f", r.ZScoreWFH),
			r.NutritionStatus,
			fmt.Sprintf("%.1f", r.FalteringScore),
			r.FalteringLevel,
			pmtStr,
			r.PMTType,
		}
		if err := w.Write(line); err != nil {
			return nil, err
		}
	}

	w.Flush()
	return buf.Bytes(), w.Error()
}

// generateXLSX creates a genuine OpenXML spreadsheet zip archive.
func generateXLSX(rows []laporanRepo.EPPGBMRow, summary *laporanRepo.ReportSummary) ([]byte, error) {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)

	writeFile := func(name, content string) error {
		w, err := zw.Create(name)
		if err != nil {
			return err
		}
		_, err = w.Write([]byte(content))
		return err
	}

	// 1. [Content_Types].xml
	contentTypes := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
	if err := writeFile("[Content_Types].xml", contentTypes); err != nil {
		return nil, err
	}

	// 2. _rels/.rels
	pkgRels := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
	if err := writeFile("_rels/.rels", pkgRels); err != nil {
		return nil, err
	}

	// 3. xl/_rels/workbook.xml.rels
	wbRels := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
	if err := writeFile("xl/_rels/workbook.xml.rels", wbRels); err != nil {
		return nil, err
	}

	// 4. xl/styles.xml
	stylesXML := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`
	if err := writeFile("xl/styles.xml", stylesXML); err != nil {
		return nil, err
	}

	// 5. xl/workbook.xml
	workbookXML := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Surveilans e-PPGBM" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
	if err := writeFile("xl/workbook.xml", workbookXML); err != nil {
		return nil, err
	}

	// 6. xl/worksheets/sheet1.xml
	var sheetBuf bytes.Buffer
	sheetBuf.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>`)

	colLetter := func(n int) string {
		letters := ""
		for n > 0 {
			n--
			letters = string(rune('A'+(n%26))) + letters
			n /= 26
		}
		return letters
	}

	writeRow := func(rowIdx int, values []string, isBold bool) {
		sAttr := ""
		if isBold {
			sAttr = ` s="1"`
		}
		sheetBuf.WriteString(fmt.Sprintf(`<row r="%d">`, rowIdx))
		for colIdx, val := range values {
			ref := fmt.Sprintf("%s%d", colLetter(colIdx+1), rowIdx)
			escaped := strings.ReplaceAll(val, "&", "&amp;")
			escaped = strings.ReplaceAll(escaped, "<", "&lt;")
			escaped = strings.ReplaceAll(escaped, ">", "&gt;")
			escaped = strings.ReplaceAll(escaped, "\"", "&quot;")
			sheetBuf.WriteString(fmt.Sprintf(`<c r="%s" t="inlineStr"%s><is><t>%s</t></is></c>`, ref, sAttr, escaped))
		}
		sheetBuf.WriteString(`</row>`)
	}

	rowNum := 1
	writeRow(rowNum, []string{"REKAPITULASI SURVEILANS GIZI BALITA DESA - e-PPGBM KEMENKES RI"}, true)
	rowNum++
	writeRow(rowNum, []string{fmt.Sprintf("Desa: %s | Periode: Bulan %d Tahun %d | Dicetak: %s", summary.VillageName, summary.PeriodMonth, summary.PeriodYear, summary.GeneratedAt)}, false)
	rowNum++
	writeRow(rowNum, []string{""}, false)
	rowNum++

	headerCols := []string{
		"No", "NIK Hash", "Nama Balita", "JK", "Tgl Lahir", "Usia (Bln)", "Nama Ortu", "No HP Ortu",
		"Posyandu", "RW", "RT", "Tgl Timbang", "BB (kg)", "TB (cm)", "Z-Score BB/U", "Z-Score TB/U",
		"Z-Score BB/TB", "Status Gizi", "ML Faltering (%)", "Kategori Risiko", "Paket PMT", "Jenis PMT",
	}
	writeRow(rowNum, headerCols, true)
	rowNum++

	for _, r := range rows {
		pmtStr := "Tidak"
		if r.PMTReceived {
			pmtStr = "Ya"
		}
		cols := []string{
			fmt.Sprintf("%d", r.No),
			r.NIKHash,
			r.ChildName,
			r.Gender,
			r.BirthDate,
			fmt.Sprintf("%d", r.AgeMonths),
			r.ParentName,
			r.ParentPhone,
			r.PosyanduName,
			r.RWCode,
			r.RTCode,
			r.MeasuredAt,
			fmt.Sprintf("%.2f", r.WeightKg),
			fmt.Sprintf("%.1f", r.HeightCm),
			fmt.Sprintf("%.2f", r.ZScoreWFA),
			fmt.Sprintf("%.2f", r.ZScoreHFA),
			fmt.Sprintf("%.2f", r.ZScoreWFH),
			r.NutritionStatus,
			fmt.Sprintf("%.1f", r.FalteringScore),
			r.FalteringLevel,
			pmtStr,
			r.PMTType,
		}
		writeRow(rowNum, cols, false)
		rowNum++
	}

	sheetBuf.WriteString(`</sheetData></worksheet>`)
	if err := writeFile("xl/worksheets/sheet1.xml", sheetBuf.String()); err != nil {
		return nil, err
	}

	if err := zw.Close(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// generatePDF constructs a clean, standards-compliant PDF-1.4 file in pure Go.
func generatePDF(rows []laporanRepo.EPPGBMRow, summary *laporanRepo.ReportSummary) ([]byte, error) {
	var body bytes.Buffer

	// Title block and metadata
	body.WriteString("BT\n")
	body.WriteString("/F1 16 Tf\n")
	body.WriteString("40 800 Td\n")
	body.WriteString("(REKAPITULASI SURVEILANS GIZI BALITA DESA) Tj\n")
	body.WriteString("0 -20 Td\n")
	body.WriteString("/F1 11 Tf\n")
	body.WriteString(fmt.Sprintf("(Standar e-PPGBM Kemenkes RI | Wilayah: %s) Tj\n", summary.VillageName))
	body.WriteString("0 -16 Td\n")
	body.WriteString(fmt.Sprintf("(Periode: Bulan %d Tahun %d | Dicetak pada: %s) Tj\n", summary.PeriodMonth, summary.PeriodYear, summary.GeneratedAt))
	body.WriteString("0 -24 Td\n")

	// Summary KPI Box
	body.WriteString("/F2 10 Tf\n")
	body.WriteString(fmt.Sprintf("(Ringkasan: %d Balita Terdaftar | %d Ditimbang (Cakupan %.1f%%) | %d Stunting | %d Wasting | %d Normal | %d Penerima PMT) Tj\n",
		summary.TotalChildren, summary.TotalMeasured, summary.CoverageRate, summary.StuntedCount, summary.WastedCount, summary.NormalCount, summary.PMTCount))
	body.WriteString("0 -24 Td\n")

	// Table Header
	body.WriteString("/F2 9 Tf\n")
	body.WriteString("(No   Nama Balita             JK  Usia   Posyandu       BB(kg)  TB(cm)  TB/U(SD)  Status Gizi    PMT) Tj\n")
	body.WriteString("0 -6 Td\n")
	body.WriteString("(---------------------------------------------------------------------------------------------------------) Tj\n")
	body.WriteString("0 -14 Td\n")

	// Child rows (limit up to 35 for single page clean presentation, overflow summarized)
	body.WriteString("/F1 8.5 Tf\n")
	maxDisplay := len(rows)
	if maxDisplay > 32 {
		maxDisplay = 32
	}

	for i := 0; i < maxDisplay; i++ {
		r := rows[i]
		cName := r.ChildName
		if len(cName) > 22 {
			cName = cName[:19] + "..."
		}
		pName := r.PosyanduName
		if len(pName) > 13 {
			pName = pName[:11] + ".."
		}
		pmtStatus := "No"
		if r.PMTReceived {
			pmtStatus = "Ya"
		}

		line := fmt.Sprintf("%-4d %-23s %-3s %-5d %-14s %-7.1f %-7.1f %-9.1f %-14s %-4s",
			r.No, cName, r.Gender, r.AgeMonths, pName, r.WeightKg, r.HeightCm, r.ZScoreHFA, r.NutritionStatus, pmtStatus)

		// Sanitize PDF text parentheses
		line = strings.ReplaceAll(line, "(", "[")
		line = strings.ReplaceAll(line, ")", "]")

		body.WriteString(fmt.Sprintf("(%s) Tj\n", line))
		body.WriteString("0 -13 Td\n")
	}

	if len(rows) > maxDisplay {
		body.WriteString(fmt.Sprintf("(  ... dan %d data balita lainnya tercatat lengkap dalam arsip digital desa e-PPGBM.) Tj\n", len(rows)-maxDisplay))
		body.WriteString("0 -16 Td\n")
	}

	// Signature block
	body.WriteString("0 -24 Td\n")
	body.WriteString("/F2 9.5 Tf\n")
	body.WriteString(fmt.Sprintf("(Mengetahui & Menyetujui,                                                   %s, %s) Tj\n", summary.VillageName, time.Now().Format("02 Jan 2006")))
	body.WriteString("0 -14 Td\n")
	body.WriteString("(Bidan Desa Penanggung Jawab                                               Koordinator Gizi Puskesmas) Tj\n")
	body.WriteString("0 -36 Td\n")
	body.WriteString("(( Bidan Rina Kartika, A.Md.Keb )                                          ( ________________________ )) Tj\n")
	body.WriteString("ET\n")

	streamBytes := body.Bytes()

	// Assemble PDF Objects
	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")

	offsets := make([]int, 6)

	// Object 1: Catalog
	offsets[1] = pdf.Len()
	pdf.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	// Object 2: Pages
	offsets[2] = pdf.Len()
	pdf.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

	// Object 3: Page
	offsets[3] = pdf.Len()
	pdf.WriteString("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n")

	// Object 4: Font F1 (Helvetica Normal)
	offsets[4] = pdf.Len()
	pdf.WriteString("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	// Object 5: Font F2 (Helvetica Bold)
	offsets[5] = pdf.Len()
	pdf.WriteString("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

	// Object 6: Stream Content
	offset6 := pdf.Len()
	pdf.WriteString(fmt.Sprintf("6 0 obj\n<< /Length %d >>\nstream\n", len(streamBytes)))
	pdf.Write(streamBytes)
	pdf.WriteString("\nendstream\nendobj\n")

	// XREF table
	xrefOffset := pdf.Len()
	pdf.WriteString("xref\n0 7\n")
	pdf.WriteString("0000000000 65535 f \n")
	pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[1]))
	pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[2]))
	pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[3]))
	pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[4]))
	pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[5]))
	pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offset6))

	pdf.WriteString("trailer\n<< /Size 7 /Root 1 0 R >>\n")
	pdf.WriteString(fmt.Sprintf("startxref\n%d\n%%%%EOF", xrefOffset))

	return pdf.Bytes(), nil
}
