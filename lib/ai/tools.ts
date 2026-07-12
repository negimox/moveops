/**
 * lib/ai/tools.ts
 * Tool definitions for AWS Bedrock Converse API.
 *
 * Claude uses these to know it can call `query_database` to fetch
 * live data from PostgreSQL. The tool schema follows Bedrock's
 * toolSpec format.
 */

import type { Tool } from '@aws-sdk/client-bedrock-runtime'

export const TOOLS: Tool[] = [
  {
    toolSpec: {
      name: 'query_database',
      description:
        'Execute a read-only SQL SELECT query against the TransitOps PostgreSQL database. ' +
        'Use this to fetch live data about vehicles, drivers, trips, maintenance, fuel logs, and expenses. ' +
        'Only SELECT queries are allowed — INSERT, UPDATE, DELETE, DROP, ALTER are blocked. ' +
        'Always use proper JOINs when relating tables (e.g. trips JOIN vehicles ON trips.vehicle_id = vehicles.id). ' +
        'Use aggregate functions (COUNT, SUM, AVG) for summary queries. ' +
        'Results are limited to 50 rows.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description:
                'A valid PostgreSQL SELECT query. Must start with SELECT or WITH. ' +
                'Use table and column names exactly as defined in the schema. ' +
                'Examples: "SELECT * FROM vehicles WHERE status = \'available\'" or ' +
                '"SELECT v.vehicle_id, SUM(f.cost) as total_fuel FROM vehicles v JOIN fuel_logs f ON f.vehicle_id = v.id GROUP BY v.vehicle_id"',
            },
            explanation: {
              type: 'string',
              description: 'A brief explanation of what this query does and why you are running it.',
            },
          },
          required: ['sql', 'explanation'],
        },
      },
    },
  },
]
