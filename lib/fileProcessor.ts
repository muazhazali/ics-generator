import { createWorker } from 'tesseract.js';

// PDF parsing function using PDF.js
async function extractTextFromPDF(file: File, onProgress?: (progress: number, message: string) => void): Promise<string> {
  try {
    onProgress?.(10, 'Loading PDF.js library...');
    
    // We'll use PDF.js for client-side PDF parsing since pdf-parse is Node.js only
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up the worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    onProgress?.(20, 'Reading PDF file...');
    const arrayBuffer = await file.arrayBuffer();
    
    onProgress?.(30, 'Parsing PDF document...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    
    onProgress?.(40, `Extracting text from ${totalPages} page(s)...`);
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      
      // Update progress for each page
      const pageProgress = 40 + Math.floor((pageNum / totalPages) * 30);
      onProgress?.(pageProgress, `Processed page ${pageNum} of ${totalPages}...`);
    }
    
    if (!fullText.trim()) {
      throw new Error('No text found in PDF. The PDF might be image-based or encrypted.');
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    if (error instanceof Error && error.message.includes('No text found')) {
      throw error;
    }
    throw new Error('Failed to extract text from PDF. Please ensure the PDF is not password-protected and contains selectable text.');
  }
}

// OCR function using Tesseract.js
async function extractTextFromImage(file: File, onProgress?: (progress: number, message: string) => void): Promise<string> {
  try {
    onProgress?.(10, 'Initializing OCR engine...');
    
    const worker = await createWorker('eng', 1, {
      logger: m => {
        console.log('OCR Progress:', m);
        if (m.status === 'recognizing text') {
          const progress = Math.floor(m.progress * 60) + 20; // 20-80% for recognition
          onProgress?.(progress, `Recognizing text... ${Math.floor(m.progress * 100)}%`);
        }
      }
    });
    
    onProgress?.(20, 'Starting text recognition...');
    const { data: { text } } = await worker.recognize(file);
    
    onProgress?.(90, 'Cleaning up OCR results...');
    await worker.terminate();
    
    if (!text.trim()) {
      throw new Error('No text found in image. Please ensure the image contains clear, readable text.');
    }
    
    return text.trim();
  } catch (error) {
    console.error('Error performing OCR:', error);
    if (error instanceof Error && error.message.includes('No text found')) {
      throw error;
    }
    throw new Error('Failed to extract text from image. Please ensure the image is clear and contains readable text.');
  }
}

// Text file reading function
async function extractTextFromTextFile(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('Error reading text file:', error);
    throw new Error('Failed to read text file');
  }
}

// DOCX parsing function (basic implementation)
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    // For DOCX files, we'll use a simple approach with mammoth.js or similar
    // For now, we'll return a placeholder and suggest using a dedicated library
    console.warn('DOCX parsing not fully implemented. Consider using mammoth.js for full support.');
    return 'DOCX file detected. Please convert to PDF or use text input for now.';
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

// Security checks for file processing
function validateFileForProcessing(file: File): { valid: boolean; reason?: string } {
  // Check file size (25MB limit)
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|com|dll|vbs|js|jar|app|deb|rpm)$/i,
    /[<>:"|?*]/,
    /^\./,
    /\.\./,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return {
        valid: false,
        reason: 'File name contains suspicious characters or extension'
      };
    }
  }

  // Check file name length
  if (file.name.length > 255) {
    return {
      valid: false,
      reason: 'File name too long'
    };
  }

  return { valid: true };
}

// Main file processing function
export async function processFile(file: File, onProgress?: (progress: number, message: string) => void): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    onProgress?.(5, 'Validating file...');
    
    // Security validation
    const validation = validateFileForProcessing(file);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    
    onProgress?.(10, 'Analyzing file type...');
    
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      onProgress?.(50, 'Reading text file...');
      return await extractTextFromTextFile(file);
    }
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await extractTextFromPDF(file, onProgress);
    }
    
    if (fileType.startsWith('image/') || /\.(png|jpg|jpeg|gif|bmp|tiff|webp|heic)$/i.test(fileName)) {
      return await extractTextFromImage(file, onProgress);
    }
    
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      onProgress?.(40, 'Processing Word document...');
      return await extractTextFromDocx(file);
    }
    
    throw new Error(`Unsupported file type: ${fileType}`);
    
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}

// Utility function to validate file type
export function isValidFileType(file: File): boolean {
  const validTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  const validExtensions = ['.txt', '.pdf', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.heic'];
  
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) ||
         file.type.startsWith('image/');
}

// Utility function to get file type description
export function getFileTypeDescription(file: File): string {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return 'Text Document';
  }
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'PDF Document';
  }
  
  if (fileType.startsWith('image/') || /\.(png|jpg|jpeg|gif|bmp|tiff|webp|heic)$/i.test(fileName)) {
    return 'Image (OCR)';
  }
  
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    return 'Word Document';
  }
  
  return 'Unknown';
} 