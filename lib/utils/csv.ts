/**
 * lib/utils/csv.ts
 * Converts a JSON array to a properly formatted CSV string.
 * Used by the Financial Analyst's report export endpoint.
 *
 * @param data  - Array of objects (all objects must share the same keys)
 * @returns     - CSV string with header row + data rows
 */
export function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const headerRow = headers.join(',')

  const rows = data.map((row) =>
    headers
      .map((key) => {
        const value = row[key]
        // Wrap in quotes and escape any quotes inside the value
        return `"${String(value ?? '').replace(/"/g, '""')}"`
      })
      .join(',')
  )

  return [headerRow, ...rows].join('\n')
}

/**
 * Returns the Content-Disposition header value for a CSV download.
 * Usage: Response headers → Content-Disposition: attachment; filename="report.csv"
 */
export function csvDownloadHeader(filename: string): string {
  return `attachment; filename="${filename}"`
}
