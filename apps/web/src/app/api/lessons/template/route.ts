import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([
    {
      ders: "TYT Matematik",
      kod: "TYT_MAT",
      renk: "#3158d6",
      konu: "Problemler",
      sinif: "11. sinif",
      zorluk: 3,
      dakika: 45,
      aciklama: "Temel problem seti",
    },
    {
      ders: "TYT Matematik",
      kod: "TYT_MAT",
      renk: "#3158d6",
      konu: "Fonksiyonlar",
      sinif: "11. sinif",
      zorluk: 4,
      dakika: 55,
      aciklama: "Kavram ve grafik tekrar",
    },
    {
      ders: "Turkce",
      kod: "TRK",
      renk: "#b87938",
      konu: "Paragraf",
      sinif: "8. sinif",
      zorluk: 2,
      dakika: 30,
      aciklama: "Hiz ve yorum calismasi",
    },
  ]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Dersler");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="ders-konu-sablonu.xlsx"',
      "cache-control": "no-store",
    },
  });
}
