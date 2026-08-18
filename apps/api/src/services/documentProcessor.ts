import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import { logger } from '../config/logger.js';

export interface ExtractedContent {
  text: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

export class DocumentProcessor {
  async processPDF(filePath: string): Promise<ExtractedContent> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await pdfParse(dataBuffer);
      
      return {
        text: result.text,
        pageCount: result.numpages,
        metadata: result.info as Record<string, any>,
      };
    } catch (error) {
      logger.error('PDF processing error:', error);
      throw new Error('Failed to process PDF');
    }
  }

  async processDOCX(filePath: string): Promise<ExtractedContent> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      
      return {
        text: result.value,
        metadata: { messages: result.messages },
      };
    } catch (error) {
      logger.error('DOCX processing error:', error);
      throw new Error('Failed to process DOCX');
    }
  }

  async processPPTX(filePath: string): Promise<ExtractedContent> {
    try {
      // Simple text extraction for PPTX - treating as zip and extracting text files
      // For production, use a proper pptx parser library
      const dataBuffer = await fs.readFile(filePath);
      
      // Basic approach: extract text content from the presentation
      // This is simplified - in production would use proper pptx-parser
      const text = dataBuffer.toString('utf8', 0, Math.min(100000, dataBuffer.length));
      
      return {
        text: text.replace(/[^\x20-\x7E\n\r\t]/g, ''), // Remove non-printable chars
        pageCount: 1, // Unknown without proper parsing
      };
    } catch (error) {
      logger.error('PPTX processing error:', error);
      throw new Error('Failed to process PPTX');
    }
  }

  async processTXT(filePath: string): Promise<ExtractedContent> {
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      
      return {
        text,
        pageCount: Math.ceil(text.split('\n').length / 50), // Estimate
      };
    } catch (error) {
      logger.error('TXT processing error:', error);
      throw new Error('Failed to process TXT');
    }
  }

  async processFile(filePath: string, mimeType: string): Promise<ExtractedContent> {
    switch (mimeType) {
      case 'application/pdf':
        return this.processPDF(filePath);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.processDOCX(filePath);
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return this.processPPTX(filePath);
      case 'text/plain':
        return this.processTXT(filePath);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    
    if (text.length <= maxChunkSize) {
      return [text.trim()];
    }

    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length <= maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        
        // If single paragraph is too long, split it
        if (paragraph.length > maxChunkSize) {
          const subChunks = this.splitLongText(paragraph, maxChunkSize, overlap);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = paragraph;
        }
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  private splitLongText(text: string, maxSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + maxSize, text.length);
      let chunkEnd = end;
      
      // Try to break at sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + maxSize / 2) {
          chunkEnd = breakPoint + 1;
        }
      }
      
      chunks.push(text.slice(start, chunkEnd).trim());
      start = chunkEnd - overlap;
    }
    
    return chunks;
  }

  extractHeadings(text: string): string[] {
    const headings: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for markdown-style headings
      if (trimmed.match(/^#{1,6}\s+/)) {
        headings.push(trimmed.replace(/^#{1,6}\s+/, ''));
      }
      // Check for uppercase headings (common in documents)
      else if (trimmed.length > 5 && trimmed.length < 100 && trimmed === trimmed.toUpperCase() && !trimmed.endsWith('.')) {
        headings.push(trimmed);
      }
    }
    
    return headings.slice(0, 20); // Limit to prevent noise
  }
}

export const documentProcessor = new DocumentProcessor();
export default documentProcessor;
