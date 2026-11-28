import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink } from 'docx';

export const NOT_SPECIFIED_PHRASE = 'Not specified in transcript';
const PULSENOTE_URL = 'https://pulsenoteai.in';

export interface NoteExportSection {
  title: string;
  content: string;
}

export interface NoteExportMeta {
  title: string;
  patientIdOrMeta?: string;
  date?: string;
  authorName?: string;
  /** When true, includes the free-tier "Made with PulseNote AI" clickable watermark linking to pulsenoteai.in */
  isFreeTier?: boolean;
  /** Optional review sign-off stamp printed on the export. */
  signoff?: {
    status: 'draft' | 'in_review' | 'signed_off';
    reviewedBy?: string;
    signedAt?: number;
  };
}

function normalizeExportContent(text?: string): string {
  const trimmed = (text || '').trim();
  if (!trimmed || /^not documented\.?$/i.test(trimmed)) {
    return NOT_SPECIFIED_PHRASE;
  }
  return trimmed;
}

function signoffLine(signoff?: NoteExportMeta['signoff']): string | null {
  if (!signoff || signoff.status !== 'signed_off') return null;
  const when = signoff.signedAt ? new Date(signoff.signedAt).toLocaleString() : '';
  return `SIGNED OFF by ${signoff.reviewedBy || 'reviewer'}${when ? ` on ${when}` : ''} — locked, no further edits.`;
}

/**
 * Generate and download a formatted PDF using jsPDF.
 * Free-tier exports include a clickable "Made with PulseNote AI" watermark linking to https://pulsenoteai.in.
 */
export function exportNoteToPdf(
  meta: NoteExportMeta,
  sections: NoteExportSection[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 24, 33);
  doc.text('PulseNote AI — Clinical & Enterprise Record', 14, yPosition);

  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 125);
  doc.text(`Document: ${meta.title || 'Clinical Encounter Note'}`, 14, yPosition);
  yPosition += 5;
  doc.text(
    `Generated: ${meta.date || new Date().toLocaleString()} | User: ${meta.authorName || 'PulseNote Practitioner'}`,
    14,
    yPosition
  );
  yPosition += 4;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 160);
  doc.text('AI-assisted draft. A licensed professional must review before use. Do not enter patient-identifying information.', 14, yPosition);

  // Divider line
  yPosition += 5;
  doc.setDrawColor(200, 205, 215);
  doc.line(14, yPosition, pageWidth - 14, yPosition);
  yPosition += 10;

  // Render each section
  for (const sec of sections) {
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(sec.title.toUpperCase(), 14, yPosition);
    yPosition += 6;

    const normalizedContent = normalizeExportContent(sec.content);
    const isMuted = normalizedContent === NOT_SPECIFIED_PHRASE;
    doc.setFont('helvetica', isMuted ? 'italic' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(isMuted ? 148 : 51, isMuted ? 163 : 65, isMuted ? 184 : 85);

    const splitText = doc.splitTextToSize(normalizedContent, pageWidth - 28);
    for (const line of splitText) {
      if (yPosition > 272) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 14, yPosition);
      yPosition += 5;
    }

    yPosition += 6;
  }

  // Footer on last page
  if (yPosition > 265) {
    doc.addPage();
    yPosition = 20;
  }
  const stamp = signoffLine(meta.signoff);
  if (stamp) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(16, 122, 87);
    const stampLines = doc.splitTextToSize(stamp, pageWidth - 28);
    for (const line of stampLines) {
      if (yPosition > 272) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 14, yPosition);
      yPosition += 5;
    }
    yPosition += 2;
  }

  // Free-tier clickable watermark linking to pulsenoteai.in (Task 3.3)
  if (meta.isFreeTier) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(78, 140, 255);
    doc.textWithLink('Made with PulseNote AI — pulsenoteai.in', 14, 285, {
      url: PULSENOTE_URL,
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text('Deterministic clinical & enterprise documentation — pulsenoteai.in', 14, 285);
  }

  const cleanFilename = (meta.title || 'pulsenote-document')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  doc.save(`${cleanFilename}.pdf`);
}

/**
 * Generate and download a formatted Word .docx file using docx library.
 * Free-tier exports include a clickable "Made with PulseNote AI" watermark linking to https://pulsenoteai.in.
 */
export async function exportNoteToDocx(
  meta: NoteExportMeta,
  sections: NoteExportSection[]
): Promise<void> {
  const docParagraphs: Paragraph[] = [
    new Paragraph({
      text: 'PulseNote AI — Clinical & Enterprise Record',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Title: ${meta.title}\n`, bold: true }),
        new TextRun({ text: `Date: ${meta.date || new Date().toLocaleString()}\n` }),
        new TextRun({ text: `Author: ${meta.authorName || 'PulseNote Practitioner'}\n` }),
        new TextRun({
          text: 'Notice: AI-assisted draft. A licensed professional must review before use. Do not enter patient-identifying information.\n',
          italics: true,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  const stamp = signoffLine(meta.signoff);
  if (stamp) {
    docParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: stamp, bold: true, color: '107A57' })],
      }),
      new Paragraph({ text: '' })
    );
  }

  for (const sec of sections) {
    const normalizedContent = normalizeExportContent(sec.content);
    const isMuted = normalizedContent === NOT_SPECIFIED_PHRASE;
    docParagraphs.push(
      new Paragraph({
        text: sec.title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: normalizedContent,
            italics: isMuted,
            color: isMuted ? '777777' : undefined,
          }),
        ],
      }),
      new Paragraph({ text: '' })
    );
  }

  if (meta.isFreeTier) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new ExternalHyperlink({
            link: PULSENOTE_URL,
            children: [
              new TextRun({
                text: 'Made with PulseNote AI (pulsenoteai.in)',
                style: 'Hyperlink',
                bold: true,
                color: '2563EB',
                size: 18,
              }),
            ],
          }),
        ],
      })
    );
  } else {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Deterministic clinical & enterprise documentation — pulsenoteai.in',
            size: 16,
            color: '888888',
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const cleanFilename = (meta.title || 'pulsenote-document')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  a.download = `${cleanFilename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Generate FHIR / HL7-ready JSON structured string for SOAP sections.
 * Forms a standardized FHIR ClinicalDocument / Composition resource.
 */
export function generateFhirHl7ReadyJson(
  meta: NoteExportMeta,
  sections: NoteExportSection[]
): string {
  const sectionMap: Record<string, string> = {};
  for (const s of sections) {
    sectionMap[s.title.toLowerCase()] = normalizeExportContent(s.content);
  }

  const fhirDoc = {
    resourceType: 'Composition',
    id: `pulsenote-soap-${Date.now()}`,
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11506-3',
          display: 'Progress note / SOAP encounter',
        },
      ],
      text: 'PulseNote Deterministic SOAP Note',
    },
    date: new Date().toISOString(),
    author: [
      {
        display: meta.authorName || 'PulseNote Practitioner',
      },
    ],
    title: meta.title || 'Clinical SOAP Progress Note',
    confidentiality: 'N',
    custodian: {
      display: 'PulseNote AI Health Systems (pulsenoteai.in)',
    },
    meta: {
      securityNotice: 'AI-assisted draft. A licensed professional must review before use. Do not enter patient-identifying information.',
    },
    section: [
      {
        title: 'Subjective',
        code: {
          coding: [{ system: 'http://loinc.org', code: '61150-9', display: 'Subjective' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['subjective'] || NOT_SPECIFIED_PHRASE}</div>`,
        },
      },
      {
        title: 'Objective',
        code: {
          coding: [{ system: 'http://loinc.org', code: '61149-1', display: 'Objective' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['objective'] || NOT_SPECIFIED_PHRASE}</div>`,
        },
      },
      {
        title: 'Assessment',
        code: {
          coding: [{ system: 'http://loinc.org', code: '51848-0', display: 'Assessment' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['assessment'] || NOT_SPECIFIED_PHRASE}</div>`,
        },
      },
      {
        title: 'Plan',
        code: {
          coding: [{ system: 'http://loinc.org', code: '18776-5', display: 'Plan of treatment' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['plan'] || NOT_SPECIFIED_PHRASE}</div>`,
        },
      },
    ],
  };

  return JSON.stringify(fhirDoc, null, 2);
}
