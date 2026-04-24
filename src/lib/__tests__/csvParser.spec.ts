import { describe, it, expect } from 'vitest'
import { parseCsv, parseAmount, normalizeDate, splitCsvLine, normalizeHeader, extractMerchantName } from '@/lib/csvParser'

describe('csvParser', () => {
  describe('normalizeHeader', () => {
    it('lowercases and trims', () => {
      expect(normalizeHeader('  Transaction Date  ')).toBe('transaction date')
    })

    it('removes quotes', () => {
      expect(normalizeHeader('"Amount"')).toBe('amount')
      expect(normalizeHeader("'Description'")).toBe('description')
    })
  })

  describe('parseAmount', () => {
    it('parses simple number', () => {
      expect(parseAmount('123.45')).toBe(123.45)
    })

    it('parses negative number', () => {
      expect(parseAmount('-50.00')).toBe(-50)
    })

    it('strips currency symbols', () => {
      expect(parseAmount('$1,234.56')).toBe(1234.56)
      expect(parseAmount('€99.99')).toBe(99.99)
      expect(parseAmount('£50.00')).toBe(50)
    })

    it('handles accounting parentheses format', () => {
      expect(parseAmount('(123.45)')).toBe(-123.45)
    })

    it('returns NaN for empty string', () => {
      expect(parseAmount('')).toBeNaN()
    })

    it('returns NaN for non-numeric', () => {
      expect(parseAmount('abc')).toBeNaN()
    })
  })

  describe('normalizeDate', () => {
    it('keeps ISO format', () => {
      expect(normalizeDate('2026-04-15')).toBe('2026-04-15')
    })

    it('converts MM/DD/YYYY', () => {
      expect(normalizeDate('04/15/2026')).toBe('2026-04-15')
    })

    it('converts M/D/YYYY', () => {
      expect(normalizeDate('4/5/2026')).toBe('2026-04-05')
    })

    it('converts MM-DD-YYYY', () => {
      expect(normalizeDate('04-15-2026')).toBe('2026-04-15')
    })

    it('detects DD/MM/YYYY when day > 12', () => {
      expect(normalizeDate('25/04/2026')).toBe('2026-04-25')
    })

    it('trims whitespace', () => {
      expect(normalizeDate('  2026-04-15  ')).toBe('2026-04-15')
    })

    it('truncates ISO datetime to date', () => {
      expect(normalizeDate('2026-04-15T10:00:00Z')).toBe('2026-04-15')
    })

    it('falls back to Date.parse for other formats', () => {
      const result = normalizeDate('April 15, 2026')
      expect(result).toBe('2026-04-15')
    })
  })

  describe('splitCsvLine', () => {
    it('splits simple CSV', () => {
      expect(splitCsvLine('a,b,c')).toEqual(['a', 'b', 'c'])
    })

    it('handles quoted fields with commas', () => {
      expect(splitCsvLine('"hello, world",foo,bar')).toEqual(['hello, world', 'foo', 'bar'])
    })

    it('handles escaped quotes', () => {
      expect(splitCsvLine('"say ""hi""",b')).toEqual(['say "hi"', 'b'])
    })

    it('trims whitespace', () => {
      expect(splitCsvLine(' a , b , c ')).toEqual(['a', 'b', 'c'])
    })

    it('handles empty fields', () => {
      expect(splitCsvLine('a,,c')).toEqual(['a', '', 'c'])
    })
  })

  describe('parseCsv', () => {
    it('parses standard bank CSV with Date, Description, Amount', () => {
      const csv = `Date,Description,Amount
04/15/2026,STARBUCKS,-5.95
04/16/2026,PAYROLL DEPOSIT,3000.00`

      const { rows, errors } = parseCsv(csv)
      expect(errors).toHaveLength(0)
      expect(rows).toHaveLength(2)
      expect(rows[0]!.date).toBe('2026-04-15')
      expect(rows[0]!.description).toBe('STARBUCKS')
      expect(rows[0]!.amount).toBe(-5.95)
      expect(rows[1]!.amount).toBe(3000)
    })

    it('handles separate Debit/Credit columns', () => {
      const csv = `Date,Description,Debit,Credit
04/15/2026,GROCERY STORE,50.00,
04/16/2026,SALARY,,3000.00`

      const { rows, errors } = parseCsv(csv)
      expect(errors).toHaveLength(0)
      expect(rows).toHaveLength(2)
      expect(rows[0]!.amount).toBe(-50)
      expect(rows[1]!.amount).toBe(3000)
    })

    it('handles "Transaction Date" and "Transaction Amount" headers', () => {
      const csv = `Transaction Date,Memo,Transaction Amount
2026-04-15,Coffee Shop,-4.50`

      const { rows, errors } = parseCsv(csv)
      expect(errors).toHaveLength(0)
      expect(rows).toHaveLength(1)
      expect(rows[0]!.description).toBe('Coffee Shop')
    })

    it('handles "Posting Date" and "Name" headers', () => {
      const csv = `Posting Date,Name,Amount
04/15/2026,Gas Station,-35.00`

      const { rows, errors } = parseCsv(csv)
      expect(errors).toHaveLength(0)
      expect(rows).toHaveLength(1)
      expect(rows[0]!.description).toBe('Gas Station')
    })

    it('returns error for empty input', () => {
      const { rows, errors } = parseCsv('')
      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('header row')
    })

    it('returns error for header-only input', () => {
      const { rows, errors } = parseCsv('Date,Description,Amount')
      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
    })

    it('returns error for missing date column', () => {
      const csv = `Foo,Description,Amount
a,b,100`
      const { errors } = parseCsv(csv)
      expect(errors.some((e) => e.includes('date column'))).toBe(true)
    })

    it('returns error for missing description column', () => {
      const csv = `Date,Foo,Amount
2026-01-01,b,100`
      const { errors } = parseCsv(csv)
      expect(errors.some((e) => e.includes('description column'))).toBe(true)
    })

    it('returns error for missing amount column', () => {
      const csv = `Date,Description,Foo
2026-01-01,b,100`
      const { errors } = parseCsv(csv)
      expect(errors.some((e) => e.includes('amount column'))).toBe(true)
    })

    it('reports invalid amount per row', () => {
      const csv = `Date,Description,Amount
04/15/2026,OK,50.00
04/16/2026,BAD,abc`

      const { rows, errors } = parseCsv(csv)
      expect(rows).toHaveLength(1)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('Row 3')
    })

    it('reports missing date per row', () => {
      const csv = `Date,Description,Amount
,MISSING DATE,50.00`

      const { rows, errors } = parseCsv(csv)
      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('missing date')
    })

    it('handles quoted descriptions', () => {
      const csv = `Date,Description,Amount
04/15/2026,"AMAZON.COM, INC",-29.99`

      const { rows } = parseCsv(csv)
      expect(rows[0]!.description).toBe('AMAZON.COM, INC')
    })

    it('populates raw field map', () => {
      const csv = `Date,Description,Amount,Category
04/15/2026,Test,-10.00,Food`

      const { rows } = parseCsv(csv)
      expect(rows[0]!.raw['category']).toBe('Food')
      expect(rows[0]!.raw['amount']).toBe('-10.00')
    })

    it('handles debit/credit where both are zero/empty', () => {
      const csv = `Date,Description,Debit,Credit
04/15/2026,UNKNOWN,,`

      const { rows, errors } = parseCsv(csv)
      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('Row 2')
    })

    it('strips surrounding quotes from descriptions', () => {
      const csv = `Date,Description,Amount
04/15/2026,"'Quoted Store'",-5.00`

      const { rows } = parseCsv(csv)
      expect(rows[0]!.description).toBe('Quoted Store')
    })

    it('skips metadata preamble and finds actual header row', () => {
      const csv = `Account Name : FREE CHECKING
Account Number : 123456
Date Range : 01/01/2026-01/31/2026
Transaction Number,Date,Description,Memo,Amount Debit,Amount Credit,Balance,Check Number
"txn1",01/15/2026,"Withdrawal DEBIT CARD","STARBUCKS 123 Main St CITY NJ Date 01/15/26 1 123 4 5812 %% Card 15 #1234 %% MCC 5812",-5.95,,100.00,`

      const { rows, errors } = parseCsv(csv)
      expect(rows).toHaveLength(1)
      expect(rows[0]!.date).toBe('2026-01-15')
      expect(rows[0]!.amount).toBe(-5.95)
      // Should prefer memo over generic "Withdrawal DEBIT CARD"
      expect(rows[0]!.description).toContain('STARBUCKS')
    })

    it('prefers memo over generic description', () => {
      const csv = `Date,Description,Memo,Amount
01/15/2026,"Withdrawal DEBIT CARD","McDonalds 5245 1106 HURFFVILLE ROAD DEPTFORD NJ Date 01/15/26 2 123 3 5814 %% Card 15 #0371 %% MCC 5814",-40.36`

      const { rows } = parseCsv(csv)
      expect(rows[0]!.description).toContain('McDonalds')
      expect(rows[0]!.description).not.toContain('Withdrawal DEBIT CARD')
    })

    it('extracts company name from ACH/payroll memo with TYPE:', () => {
      const csv = `Date,Description,Memo,Amount Debit,Amount Credit
01/21/2026,"Deposit COMCAST (CC) OF","TYPE: PAYROLL  ID: 9704918123 CO: COMCAST (CC) OF %% ACH ECC PPD %% ACH Trace 021",,2869.19`

      const { rows } = parseCsv(csv)
      expect(rows[0]!.description).toBe('COMCAST (CC) OF')
      expect(rows[0]!.amount).toBe(2869.19)
    })

    it('skips rows with no debit or credit (COMMENT rows)', () => {
      const csv = `Date,Description,Memo,Amount Debit,Amount Credit
01/28/2026,"COMMENT","Pending credit/return for $386.93",,`

      const { rows } = parseCsv(csv)
      expect(rows).toHaveLength(0)
    })

    it('handles Amount Debit and Amount Credit headers', () => {
      const csv = `Date,Description,Amount Debit,Amount Credit
01/15/2026,Purchase,-50.00,
01/16/2026,Salary,,3000.00`

      const { rows } = parseCsv(csv)
      expect(rows).toHaveLength(2)
      expect(rows[0]!.amount).toBe(-50)
      expect(rows[1]!.amount).toBe(3000)
    })
  })

  describe('extractMerchantName', () => {
    it('extracts merchant name before Date marker', () => {
      const memo = 'McDonalds 5245 1106 HURFFVILLE ROAD DEPTFORD NJ Date 01/30/26 2 6028154457 3 5814 %% Card 15 #0371 %% MCC 5814'
      expect(extractMerchantName(memo)).toContain('McDonalds')
    })

    it('extracts merchant name before %% marker', () => {
      const memo = 'HERITAGE STORE #13 132 DEPTFORD NJ %% Card 15 #3279 %% MCC 5451'
      expect(extractMerchantName(memo)).toContain('HERITAGE STORE')
    })

    it('extracts company from TYPE/CO format', () => {
      const memo = 'TYPE: PAYROLL  ID: 1520294020 CO: RIGGS DISTLER %% ACH ECC PPD %% ACH Trace 091'
      expect(extractMerchantName(memo)).toBe('RIGGS DISTLER')
    })

    it('extracts company from TYPE/CO format for bills', () => {
      const memo = 'TYPE: CABLE SVCS  ID: 0000213249 CO: COMCAST-XFINITY %% ACH ECC PPD'
      expect(extractMerchantName(memo)).toBe('COMCAST-XFINITY')
    })

    it('returns original memo when no patterns match', () => {
      expect(extractMerchantName('Simple transaction')).toBe('Simple transaction')
    })
  })
})

