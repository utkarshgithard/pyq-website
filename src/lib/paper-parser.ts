/**
 * Smart filename parser for question paper PDFs.
 *
 * Pattern: `papercode-subjectName-year.pdf`
 * Example: `155612-Python-Programming-2024.pdf`
 *
 * Generated outputs:
 * - paperCode: "155612"
 * - subjectName: "Python Programming"
 * - examYear: 2024
 * - title: "Python Programming PYQ 2024" (<subjectName PYQ YEAR>)
 */

export interface ParsedPaperInfo {
  paperCode: string;
  subjectName: string;
  examYear: number;
  title: string;
  isValid: boolean;
}

export function parsePaperFilename(fileName: string): ParsedPaperInfo {
  // Strip .pdf extension
  const cleanName = fileName.replace(/\.pdf$/i, "").trim();

  // Look for 4-digit year at the end (e.g. -2024, _2024, or space 2024)
  const yearMatch = cleanName.match(/[-_ ]?(20\d{2})$/);
  const examYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  const withoutYear = yearMatch ? cleanName.slice(0, yearMatch.index).trim() : cleanName;

  // Find the first separator (- or _) separating papercode and subjectName
  const firstSepIdx = withoutYear.search(/[-_]/);

  if (firstSepIdx > 0) {
    const paperCode = withoutYear
      .slice(0, firstSepIdx)
      .trim()
      .replace(/[^A-Za-z0-9_-]/g, "");

    const subjectRaw = withoutYear.slice(firstSepIdx + 1).trim();
    const subjectName = subjectRaw
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Format requested by user: <subjectName PYQ YEAR>
    const title = `${subjectName} PYQ ${examYear}`;

    return {
      paperCode,
      subjectName,
      examYear,
      title,
      isValid: Boolean(paperCode.length >= 2 && subjectName.length >= 2 && examYear >= 2000),
    };
  }

  // Fallback for non-standard filenames
  return {
    paperCode: "",
    subjectName: cleanName,
    examYear,
    title: cleanName ? `${cleanName} PYQ ${examYear}` : "",
    isValid: false,
  };
}
