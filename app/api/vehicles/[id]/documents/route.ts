import type { NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';
import { query, ensureDocumentsTable } from '../../../../../lib/db';

/** Allowed document types for validation */
const VALID_DOC_TYPES = [
  'Registration',
  'Insurance',
  'Permit',
  'Inspection',
  'Ownership',
  'Other',
] as const;

type DocType = (typeof VALID_DOC_TYPES)[number];

interface DocumentRow extends QueryResultRow {
  id: number;
  vehicle_id: string;
  doc_name: string;
  doc_type: DocType;
  ref_number: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * GET /api/vehicles/[id]/documents
 * Returns all document records for a given vehicle.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDocumentsTable();

    const result = await query<DocumentRow>(
      `SELECT id, vehicle_id, doc_name, doc_type, ref_number, expiry_date, notes, created_at
       FROM vehicle_documents
       WHERE vehicle_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return Response.json({ success: true, documents: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] GET /documents error:', message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/vehicles/[id]/documents
 * Body: { doc_name, doc_type, ref_number?, expiry_date?, notes? }
 * Creates a new text-based document record for the vehicle.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const docName: string = (body?.doc_name ?? '').trim();
    const docType: string = (body?.doc_type ?? 'Other').trim();
    const refNumber: string | null = body?.ref_number?.trim() || null;
    const expiryDate: string | null = body?.expiry_date || null;
    const notes: string | null = body?.notes?.trim() || null;

    // Validate required fields
    if (!docName) {
      return Response.json(
        { success: false, error: 'doc_name is required.' },
        { status: 400 }
      );
    }

    if (!VALID_DOC_TYPES.includes(docType as DocType)) {
      return Response.json(
        {
          success: false,
          error: `doc_type must be one of: ${VALID_DOC_TYPES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    await ensureDocumentsTable();

    const result = await query<DocumentRow>(
      `INSERT INTO vehicle_documents (vehicle_id, doc_name, doc_type, ref_number, expiry_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, docName, docType, refNumber, expiryDate, notes]
    );

    return Response.json(
      { success: true, document: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] POST /documents error:', message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
