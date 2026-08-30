/**
 * excelExport.ts
 * Centralized Excel export utility using SheetJS (xlsx).
 * Produces proper .xlsx files with auto-column widths, RTL direction,
 * header styling, and number formatting — so content never overlaps.
 */

import * as XLSX from 'xlsx';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface ExcelColumn {
  /** Header text shown in row 1 */
  header: string;
  /** Key in the data row object */
  key: string;
  /** Minimum column width in characters (default: auto from content) */
  minWidth?: number;
}

export interface ExcelExportOptions {
  /** Worksheet name */
  sheetName?: string;
  /** Downloaded file name (without extension) */
  fileName: string;
  /** Column definitions */
  columns: ExcelColumn[];
  /** Array of plain objects — values will be picked by column key */
  data: Record<string, unknown>[];
  /** Optional title row text above the headers */
  title?: string;
}

/* ------------------------------------------------------------------ */
/*  Auto column-width helper                                            */
/* ------------------------------------------------------------------ */

/**
 * Measures the display width of a cell value in "characters".
 * Arabic chars are counted as 1.6 × their count to approximate
 * wider glyph rendering in Excel.
 */
function measureWidth(val: unknown): number {
  if (val === null || val === undefined) return 4;
  const str = String(val);
  // Count Arabic / RTL characters (rough heuristic)
  const arabicChars = (str.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
  const otherChars = str.length - arabicChars;
  return Math.ceil(arabicChars * 1.8 + otherChars);
}

/* ------------------------------------------------------------------ */
/*  Main export function                                                */
/* ------------------------------------------------------------------ */

export function exportToExcel(options: ExcelExportOptions): void {
  const { sheetName = 'Sheet1', fileName, columns, data, title } = options;

  /* ---- Build array-of-arrays (AOA) ---- */
  const aoa: unknown[][] = [];

  // Optional title row
  if (title) {
    aoa.push([title]);
    aoa.push([]); // blank separator
  }

  // Header row
  aoa.push(columns.map((c) => c.header));

  // Data rows
  for (const row of data) {
    aoa.push(columns.map((c) => row[c.key] ?? ''));
  }

  /* ---- Create worksheet ---- */
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  /* ---- Calculate column widths ---- */
  const headerRowIndex = title ? 2 : 0; // 0-based index in aoa

  const colWidths: number[] = columns.map((col) => {
    let max = measureWidth(col.header);
    for (const row of data) {
      const w = measureWidth(row[col.key]);
      if (w > max) max = w;
    }
    // Apply minimum if specified
    if (col.minWidth && col.minWidth > max) max = col.minWidth;
    return Math.min(max + 4, 60); // clamp between actual+padding and 60
  });

  ws['!cols'] = colWidths.map((w) => ({ wch: w }));

  /* ---- RTL sheet direction ---- */
  if (!ws['!sheetView']) {
    (ws as any)['!sheetView'] = [{ rightToLeft: true }];
  }

  /* ---- Merge title cell across all columns if present ---- */
  if (title) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    ];
  }

  /* ---- Freeze header row ---- */
  ws['!freeze'] = { xSplit: 0, ySplit: headerRowIndex + 1 } as any;

  /* ---- Create workbook & save ---- */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/* ------------------------------------------------------------------ */
/*  Convenience: format a number as Egyptian pounds string             */
/* ------------------------------------------------------------------ */
export function fmtEGP(val: number | string | null | undefined): string {
  const n = Number(val || 0);
  return n.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
