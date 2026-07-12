import type { NextRequest } from 'next/server';
import { query } from '../../../../../../lib/db';

/**
 * DELETE /api/vehicles/[id]/documents/[docId]
 * Deletes a specific document record by its ID.
 * Validates that the record belongs to the given vehicle for safety.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;

    const docIdNum = parseInt(docId, 10);
    if (isNaN(docIdNum)) {
      return Response.json(
        { success: false, error: 'Invalid document ID.' },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM vehicle_documents
       WHERE id = $1 AND vehicle_id = $2
       RETURNING id`,
      [docIdNum, id]
    );

    if (result.rowCount === 0) {
      return Response.json(
        { success: false, error: 'Document not found for this vehicle.' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, deletedId: docIdNum });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] DELETE /documents/[docId] error:', message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
