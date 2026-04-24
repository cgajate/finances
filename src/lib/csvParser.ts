/** Represents a single row parsed from a bank statement CSV */
export interface CsvRow {
  date: string
  description: string
  amount: number
  /** Raw field values keyed by header name (lowercase) */
  raw: Record<string, string>
}

/**
 * Normalize header names so we can match across bank formats.
 * E.g. "Transaction Date" → "transaction date", "Posting Date" → "posting date"
 */
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/['"]/g, '')
}

/** Known header aliases for date, description, and amount fields */
const DATE_HEADERS = ['date', 'transaction date', 'posting date', 'trans date', 'posted date']
const DESC_HEADERS = ['description', 'memo', 'transaction description', 'narration', 'details', 'payee', 'name']
const MEMO_HEADERS = ['memo', 'details', 'narration', 'payee']
const AMOUNT_HEADERS = ['amount', 'transaction amount', 'value']
const DEBIT_HEADERS = ['debit', 'withdrawal', 'debit amount', 'amount debit']
const CREDIT_HEADERS = ['credit', 'deposit', 'credit amount', 'amount credit']

/** All known header names used to detect the header row in CSVs with metadata preamble */
const ALL_KNOWN_HEADERS = [
  ...DATE_HEADERS,
  ...DESC_HEADERS,
  ...MEMO_HEADERS,
  ...AMOUNT_HEADERS,
  ...DEBIT_HEADERS,
  ...CREDIT_HEADERS,
  'balance',
  'check number',
  'transaction number',
  'reference',
  'type',
  'category',
]

function findHeader(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h))
}

/**
 * Parse a numeric string, handling parentheses for negatives and currency symbols.
 * Returns NaN if not parseable.
 */
function parseAmount(raw: string): number {
  if (!raw) return NaN
  let cleaned = raw.trim().replace(/[$€£,]/g, '')
  // Handle accounting format: (123.45) → -123.45
  const parenMatch = cleaned.match(/^\((.+)\)$/)
  if (parenMatch?.[1]) {
    cleaned = `-${parenMatch[1]}`
  }
  return parseFloat(cleaned)
}

/**
 * Normalize a date string to YYYY-MM-DD format.
 * Supports MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY (if day > 12).
 */
function normalizeDate(raw: string): string {
  const trimmed = raw.trim()

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10)
  }

  // MM/DD/YYYY or MM-DD-YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (slashMatch?.[1] && slashMatch[2] && slashMatch[3]) {
    const a = parseInt(slashMatch[1], 10)
    const b = parseInt(slashMatch[2], 10)
    const year = slashMatch[3]
    // If first part > 12, assume DD/MM/YYYY
    if (a > 12) {
      return `${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`
    }
    // Default: MM/DD/YYYY
    return `${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`
  }

  // Fallback: try Date.parse
  const d = new Date(trimmed)
  if (!isNaN(d.getTime())) {
    return d.toISOString().substring(0, 10)
  }

  return trimmed
}

/**
 * Split a CSV line respecting quoted fields.
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

/**
 * Extract a clean merchant/vendor name from a bank memo field.
 * Bank memos often look like: "STARBUCKS #12345 1234 Main St CITY ST Date 01/15/26 ..."
 * This extracts just the meaningful merchant portion.
 */
function extractMerchantName(memo: string): string {
  let cleaned = memo.trim()
  // Remove everything after " Date " (transaction date in memo)
  const dateIdx = cleaned.search(/ Date \d/)
  if (dateIdx > 0) cleaned = cleaned.substring(0, dateIdx)
  // Remove everything after " %% " (card/MCC metadata)
  const metaIdx = cleaned.indexOf(' %% ')
  if (metaIdx > 0) cleaned = cleaned.substring(0, metaIdx)
  // Remove everything after " TYPE: " (ACH metadata)
  const typeIdx = cleaned.indexOf('TYPE: ')
  if (typeIdx === 0) {
    // "TYPE: PAYROLL  ID: ... CO: RIGGS DISTLER" → extract CO value
    const coMatch = cleaned.match(/CO:\s*(.+?)(?:\s{2,}|%%|$)/)
    if (coMatch?.[1]) return coMatch[1].trim()
  }
  // Remove trailing address patterns (City ST or City STATE ZIP)
  cleaned = cleaned.replace(/\s+[A-Z]{2}\s*$/, '')
  // Trim trailing whitespace and common suffixes
  return cleaned.trim() || memo.trim()
}

/**
 * Detect whether a line is a header row by checking if enough of its
 * normalized fields match known header names.
 */
function isHeaderRow(line: string): boolean {
  const fields = splitCsvLine(line).map(normalizeHeader)
  const matchCount = fields.filter((f) => ALL_KNOWN_HEADERS.includes(f)).length
  return matchCount >= 2
}

/**
 * Parse CSV text into structured rows.
 * Auto-detects date, description, and amount columns.
 * Skips metadata preamble lines (e.g., account name/number) before the header row.
 */
export function parseCsv(text: string): { rows: CsvRow[]; errors: string[] } {
  const errors: string[] = []
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

  if (lines.length < 2) {
    errors.push('CSV must contain a header row and at least one data row.')
    return { rows: [], errors }
  }

  // Find the header row — skip metadata preamble lines
  let headerLineIdx = 0
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (isHeaderRow(lines[i]!)) {
      headerLineIdx = i
      break
    }
  }

  const headerLine = lines[headerLineIdx]!
  const headers = splitCsvLine(headerLine).map(normalizeHeader)

  const dateIdx = findHeader(headers, DATE_HEADERS)
  const descIdx = findHeader(headers, DESC_HEADERS)
  const memoIdx = findHeader(headers, MEMO_HEADERS)
  const amountIdx = findHeader(headers, AMOUNT_HEADERS)
  const debitIdx = findHeader(headers, DEBIT_HEADERS)
  const creditIdx = findHeader(headers, CREDIT_HEADERS)

  if (dateIdx === -1) {
    errors.push('Could not find a date column. Expected one of: ' + DATE_HEADERS.join(', '))
    return { rows: [], errors }
  }
  if (descIdx === -1) {
    errors.push('Could not find a description column. Expected one of: ' + DESC_HEADERS.join(', '))
    return { rows: [], errors }
  }
  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) {
    errors.push('Could not find an amount column. Expected one of: ' + AMOUNT_HEADERS.join(', '))
    return { rows: [], errors }
  }

  const rows: CsvRow[] = []

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i]!
    const fields = splitCsvLine(line)

    // Build raw record
    const raw: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j]
      if (header) {
        raw[header] = fields[j] ?? ''
      }
    }

    const dateRaw = fields[dateIdx] ?? ''
    const descRaw = fields[descIdx] ?? ''

    // Prefer memo over description if memo has richer content
    let description = descRaw.replace(/^["']|["']$/g, '').trim()
    if (memoIdx !== -1 && memoIdx !== descIdx) {
      const memoRaw = (fields[memoIdx] ?? '').replace(/^["']|["']$/g, '').trim()
      if (memoRaw && memoRaw.length > description.length) {
        description = extractMerchantName(memoRaw)
      }
    }

    let amount: number
    if (amountIdx !== -1) {
      amount = parseAmount(fields[amountIdx] ?? '')
    } else {
      // Separate debit/credit columns
      const debit = debitIdx !== -1 ? parseAmount(fields[debitIdx] ?? '') : NaN
      const credit = creditIdx !== -1 ? parseAmount(fields[creditIdx] ?? '') : NaN
      if (!isNaN(debit) && debit !== 0) {
        amount = -Math.abs(debit)
      } else if (!isNaN(credit) && credit !== 0) {
        amount = Math.abs(credit)
      } else {
        errors.push(`Row ${i + 1}: could not determine amount.`)
        continue
      }
    }

    if (isNaN(amount)) {
      errors.push(`Row ${i + 1}: invalid amount.`)
      continue
    }

    if (!dateRaw) {
      errors.push(`Row ${i + 1}: missing date.`)
      continue
    }

    rows.push({
      date: normalizeDate(dateRaw),
      description,
      amount,
      raw,
    })
  }

  return { rows, errors }
}

export { parseAmount, normalizeDate, splitCsvLine, normalizeHeader, extractMerchantName }

