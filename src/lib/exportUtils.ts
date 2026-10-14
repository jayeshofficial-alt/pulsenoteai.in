import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export interface NoteExportSection {
  title: string;
  content: string;
}

export interface NoteExportMeta {
  title: string;
  patientIdOrMeta?: string;
  date?: string;
  authorName?: string;
}

/**
 * Generate and download a formatted PDF using jsPDF.
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
  doc.text(`Generated: ${meta.date || new Date().toLocaleString()} | User: ${meta.authorName || 'PulseNote Practitioner'}`, 14, yPosition);
  yPosition += 4;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 160);
  doc.text('Built on Google Cloud. Do not enter patient-identifying information.', 14, yPosition);

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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    const splitText = doc.splitTextToSize(sec.content || 'Not documented', pageWidth - 28);
    for (const line of splitText) {
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 14, yPosition);
      yPosition += 5;
    }

    yPosition += 6;
  }

  // Footer on last page
  if (yPosition > 270) {
    doc.addPage();
    yPosition = 20;
  }
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text('Deterministic output verified by PulseNote AI (pulsenoteai.in).', 14, 285);

  const cleanFilename = (meta.title || 'pulsenote-document')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  doc.save(`${cleanFilename}.pdf`);
}

/**
 * Generate and download a formatted Word .docx file using docx library.
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
        new TextRun({ text: 'Compliance: Built on Google Cloud. Do not enter patient-identifying information.\n', italics: true }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  for (const sec of sections) {
    docParagraphs.push(
      new Paragraph({
        text: sec.title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [new TextRun(sec.content || 'Not documented')],
      }),
      new Paragraph({ text: '' })
    );
  }

  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Generated deterministically by PulseNote AI (pulsenoteai.in).',
          size: 16,
          color: '888888',
        }),
      ],
    })
  );

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
    sectionMap[s.title.toLowerCase()] = s.content;
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
      securityNotice: 'Built on Google Cloud. Do not enter patient-identifying information.',
    },
    section: [
      {
        title: 'Subjective',
        code: {
          coding: [{ system: 'http://loinc.org', code: '61150-9', display: 'Subjective' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['subjective'] || 'Not documented'}</div>`,
        },
      },
      {
        title: 'Objective',
        code: {
          coding: [{ system: 'http://loinc.org', code: '61149-1', display: 'Objective' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['objective'] || 'Not documented'}</div>`,
        },
      },
      {
        title: 'Assessment',
        code: {
          coding: [{ system: 'http://loinc.org', code: '51848-0', display: 'Assessment' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['assessment'] || 'Not documented'}</div>`,
        },
      },
      {
        title: 'Plan',
        code: {
          coding: [{ system: 'http://loinc.org', code: '18776-5', display: 'Plan of treatment' }],
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${sectionMap['plan'] || 'Not documented'}</div>`,
        },
      },
    ],
  };

  return JSON.stringify(fhirDoc, null, 2);
}
