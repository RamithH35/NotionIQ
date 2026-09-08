import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseDocument(fileBuffer, originalFilename, mimetype) {
  const ext = originalFilename.split('.').pop().toLowerCase();
  
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    return await parsePdf(fileBuffer);
  } else if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await parseDocx(fileBuffer);
  } else {
    throw new Error('Unsupported file format. Please upload a .pdf or .docx file.');
  }
}

async function parsePdf(buffer) {
  try {
    const uint8 = new Uint8Array(buffer);
    const parser = new PDFParse(uint8);
    const data = await parser.getText();
    
    let extractedText = data && data.text ? data.text.trim() : '';
    const pageCount = data && data.total ? data.total : (data.pages ? data.pages.length : 1);

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    if (wordCount < 10) {
      throw new Error("This document doesn't contain enough readable text — it may be a scanned/image-only file");
    }

    return {
      rawText: extractedText,
      pageCount: Math.max(1, pageCount),
      sourceType: 'pdf',
    };
  } catch (err) {
    console.error('[Parser] PDF parsing error:', err.message);
    if (err.message.includes("doesn't contain enough readable text")) {
      throw err;
    }
    throw new Error(`Failed to parse PDF document: ${err.message}`);
  }
}

async function parseDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    let extractedText = result.value ? result.value.trim() : '';
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    if (wordCount < 10) {
      throw new Error("This document doesn't contain enough readable text — it may be a scanned/image-only file");
    }

    // Estimate page count (~350 words per page)
    const pageCount = Math.max(1, Math.ceil(wordCount / 350));

    return {
      rawText: extractedText,
      pageCount: pageCount,
      sourceType: 'docx',
    };
  } catch (err) {
    console.error('[Parser] DOCX parsing error:', err.message);
    if (err.message.includes("doesn't contain enough readable text")) {
      throw err;
    }
    throw new Error(`Failed to parse DOCX document: ${err.message}`);
  }
}

