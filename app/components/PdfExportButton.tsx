'use client';
import { useState, useCallback } from 'react';

interface PdfExportButtonProps {
  /** The CSS selector or element ID (without #) of the container to capture */
  targetId: string;
  /** Downloaded file name (without .pdf extension) */
  filename?: string;
  /** Optional title to add as a header in the PDF */
  title?: string;
  className?: string;
  id?: string;
}

/**
 * PdfExportButton — captures any DOM element by ID and exports it as a PDF.
 * Uses jsPDF + html2canvas entirely client-side. No server call needed.
 *
 * Usage:
 *   <PdfExportButton targetId="vehicles-table" filename="fleet-report" title="Fleet Report" />
 */
export function PdfExportButton({
  targetId,
  filename = 'transitops-report',
  title,
  className = '',
  id = 'pdf-export-btn',
}: PdfExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      alert(`Export failed: Could not find element with id "${targetId}".`);
      return;
    }

    setLoading(true);
    try {
      // Dynamic imports keep jsPDF out of the initial JS bundle
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      // Snapshot the DOM element at 2× scale for retina sharpness
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const headerH = title ? 40 : 0;
      const contentTop = margin + headerH;

      // --- Header ---
      if (title) {
        pdf.setFillColor(99, 102, 241); // indigo-500
        pdf.rect(0, 0, pageW, 36, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TransitOps', margin, 22);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(title, margin + 100, 22);

        // Date
        const dateStr = new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        });
        pdf.setFontSize(9);
        pdf.text(`Generated: ${dateStr}`, pageW - margin - 100, 22);
      }

      // --- Content image ---
      const availW = pageW - margin * 2;
      const availH = pageH - contentTop - margin;
      const imgW = canvas.width / 2;  // actual rendered width (canvas is 2× scale)
      const imgH = canvas.height / 2;
      const ratio = Math.min(availW / imgW, availH / imgH);
      const drawW = imgW * ratio;
      const drawH = imgH * ratio;

      pdf.addImage(imgData, 'PNG', margin, contentTop, drawW, drawH);

      // --- Page number ---
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page 1 of 1`, pageW / 2, pageH - 8, { align: 'center' });

      pdf.save(`${filename}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('[PdfExportButton] Export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [targetId, filename, title]);

  return (
    <button
      id={id}
      type="button"
      onClick={handleExport}
      disabled={loading}
      aria-busy={loading}
      className={`
        inline-flex items-center gap-2 px-3 py-2
        text-sm font-medium rounded-lg
        bg-[var(--danger)] text-white
        hover:bg-[var(--danger)]/90
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all duration-150
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Generating PDF…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Export PDF
        </>
      )}
    </button>
  );
}
