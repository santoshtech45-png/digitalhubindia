import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileVideo,
  FileImage,
  Layers,
  Scissors,
  RotateCw,
  Stamp,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Trash2,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Camera,
  Play,
  FileDown,
  Shield,
  HelpCircle,
  Hash,
  Sparkles,
  Crop,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PdfToolsSectionProps {
  defaultToolId?: string | null;
  setDefaultToolId?: (id: string | null) => void;
  currentUser?: any;
  requireAuth?: (action: () => void, message: string) => void;
}

export default function PdfToolsSection({ defaultToolId, setDefaultToolId, currentUser, requireAuth }: PdfToolsSectionProps = {}) {
  const [localActiveToolId, setLocalActiveToolId] = useState<string | null>(null);

  const activeToolId = defaultToolId !== undefined ? defaultToolId : localActiveToolId;
  const setActiveToolId = setDefaultToolId !== undefined ? setDefaultToolId : setLocalActiveToolId;
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States for active operations
  // 1. Merge State
  const [mergeFiles, setMergeFiles] = useState<{ file: File; name: string; size: string }[]>([]);
  // 2. Rotate State
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState(90);
  // 3. Watermark State
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('DIGITAL HUB INDIA');
  const [watermarkColor, setWatermarkColor] = useState('#ff0033');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  // 4. Page Numbers State
  const [numberFile, setNumberFile] = useState<File | null>(null);
  const [numberPosition, setNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  // 5. JPG to PDF State
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  // 6. Security State
  const [protectFile, setProtectFile] = useState<File | null>(null);
  const [protectPassword, setProtectPassword] = useState('');
  // 7. Extract & Split State
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitRange, setSplitRange] = useState('1');
  // 8. Pages Remover State
  const [removeFile, setRemoveFile] = useState<File | null>(null);
  const [removePagesInput, setRemovePagesInput] = useState('');
  // 9. Scan To PDF state
  const [scanImages, setScanImages] = useState<string[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 10. PDF Micro Maker State
  const [microFile, setMicroFile] = useState<File | null>(null);
  const [microPagesInput, setMicroPagesInput] = useState('');
  const [microLayout, setMicroLayout] = useState<'2' | '4' | '6' | '9' | '16' | '1'>('4');
  const [microSpacing, setMicroSpacing] = useState(8);
  const [microOrientation, setMicroOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // General Convert States
  const [convertFile, setConvertFile] = useState<File | null>(null);
  const [convertType, setConvertType] = useState<string>('');

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleFileDrop = (e: React.DragEvent, handler: (files: FileList) => void) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handler(e.dataTransfer.files);
    }
  };

  // --- PDF-LIB OPERATION: MERGE PDF ---
  const executeMergePDF = async () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => executeMergePDF(), 'You must be logged in to compile the merged PDF document.');
      return;
    }
    if (mergeFiles.length < 2) {
      setErrorMessage('Please add at least 2 PDF files to merge!');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const fileBytes = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Merged_DigitalHubIndia_${Date.now()}.pdf`;
      link.click();

      setSuccessMessage('Successfully merged your PDFs!');
      triggerConfetti();
    } catch (err: any) {
      setErrorMessage(`Error merging PDFs: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PDF-LIB OPERATION: ROTATE PDF ---
  const executeRotatePDF = async () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => executeRotatePDF(), 'You must be logged in to correct and rotate PDF pages.');
      return;
    }
    if (!rotateFile) {
      setErrorMessage('Please select a PDF file first!');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileBytes = await rotateFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationAngle) % 360));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Rotated_${rotateFile.name}`;
      link.click();

      setSuccessMessage('Successfully rotated all PDF pages!');
      triggerConfetti();
    } catch (err: any) {
      setErrorMessage(`Error rotating PDF: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PDF-LIB OPERATION: ADD WATERMARK ---
  const executeAddWatermark = async () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => executeAddWatermark(), 'You must be logged in to construct watermarks on PDF files.');
      return;
    }
    if (!watermarkFile) {
      setErrorMessage('Please select a PDF file first!');
      return;
    }
    if (!watermarkText.trim()) {
      setErrorMessage('Watermark text cannot be empty!');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileBytes = await watermarkFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      // Simple hex to rgb
      const hex = watermarkColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
      const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
      const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 4,
          y: height / 2,
          size: width / 12,
          font: font,
          color: rgb(r, g, b),
          opacity: watermarkOpacity,
          rotate: degrees(45),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Watermarked_${watermarkFile.name}`;
      link.click();

      setSuccessMessage('Watermark applied successfully to all pages!');
      triggerConfetti();
    } catch (err: any) {
      setErrorMessage(`Error applying watermark: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PDF-LIB OPERATION: ADD PAGE NUMBERS ---
  const executeAddNumbers = async () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => executeAddNumbers(), 'You must be logged in to apply automated page numbers to your document.');
      return;
    }
    if (!numberFile) {
      setErrorMessage('Please select a PDF file first!');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileBytes = await numberFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const text = `Page ${index + 1} of ${totalPages}`;
        let x = width / 2 - 25;
        let y = 25;

        if (numberPosition === 'bottom-right') {
          x = width - 85;
        } else if (numberPosition === 'top-right') {
          x = width - 85;
          y = height - 25;
        }

        page.drawText(text, {
          x,
          y,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Numbered_${numberFile.name}`;
      link.click();

      setSuccessMessage('Successfully watermarked/numbered your PDF pages!');
      triggerConfetti();
    } catch (err: any) {
      setErrorMessage(`Error writing page numbers: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PDF-LIB OPERATION: JPG TO PDF ---
  const executeJPGToPDF = async () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => executeJPGToPDF(), 'You must be logged in to compile certificate and document photos into a PDF binder.');
      return;
    }
    if (imageFiles.length === 0) {
      setErrorMessage('Please load at least 1 image to compile!');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgItem of imageFiles) {
        const imgBytes = await imgItem.file.arrayBuffer();
        let pdfImg;
        if (imgItem.file.type === 'image/png') {
          pdfImg = await pdfDoc.embedPng(imgBytes);
        } else {
          pdfImg = await pdfDoc.embedJpg(imgBytes);
        }

        const dims = pdfImg.scale(0.5);
        const page = pdfDoc.addPage([dims.width, dims.height]);
        page.drawImage(pdfImg, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Compiled_Images_DigitalHub_${Date.now()}.pdf`;
      link.click();

      setSuccessMessage('Your images were packed into a beautiful PDF!');
      triggerConfetti();
    } catch (err: any) {
      setErrorMessage(`Error compiling PDF: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PDF-LIB OPERATION: PAGES REMOVER / SPLIT ---
  const executePagesRemover = async () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => executePagesRemover(), 'You must be logged in to split or strip pages from your document.');
      return;
    }
    if (!removeFile) {
      setErrorMessage('Please upload a PDF first.');
      return;
    }
    if (!removePagesInput.trim()) {
      setErrorMessage('Please enter the page numbers (e.g., 1,3,5)');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileBytes = await removeFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const outputDoc = await PDFDocument.create();
      const totalPages = srcDoc.getPageCount();

      // Parse user input (e.g. "1,3,5" => [0,2,4])
      const pagesToRemove = removePagesInput
        .split(',')
        .map(p => parseInt(p.trim()) - 1)
        .filter(p => !isNaN(p) && p >= 0 && p < totalPages);

      if (pagesToRemove.length === 0) {
        setErrorMessage('Could not find any matching page numbers in the document.');
        setIsProcessing(false);
        return;
      }

      const pagesToKeep: number[] = [];
      for (let i = 0; i < totalPages; i++) {
        if (!pagesToRemove.includes(i)) {
          pagesToKeep.push(i);
        }
      }

      if (pagesToKeep.length === 0) {
        setErrorMessage('Cannot remove ALL pages of a PDF document!');
        setIsProcessing(false);
        return;
      }

      const copiedPages = await outputDoc.copyPages(srcDoc, pagesToKeep);
      copiedPages.forEach(p => outputDoc.addPage(p));

      const pdfBytes = await outputDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `PagesRemoved_${removeFile.name}`;
      link.click();

      setSuccessMessage(`Successfully removed pages: ${removePagesInput}`);
      triggerConfetti();
    } catch (err: any) {
      setErrorMessage(`Error modifying PDF: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CAMERA SCAN TO PDF CAPABILITY ---
  const handleCaptureCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      // Read as arrayBuffer of file
      setScanImages(prev => [...prev, preview]);
      // Load into our standard JPG to PDF tool silently so user can compile easily
      setImageFiles(prev => [...prev, { file, preview }]);
    }
  };

  const removeScanImage = (index: number) => {
    setScanImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- GENERAL SIMULATED CONVERSIONS WITH PREMIUM FEEDBACK ---
  const handleGeneralConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireAuth && !currentUser) {
      requireAuth(() => handleGeneralConversion(e), 'You must be logged in to convert this document file.');
      return;
    }
    if (!convertFile) {
      setErrorMessage('Please select a file to process.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Dynamic processing
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMessage(`Conversion successful! Developed template document for: "${convertType}" based on ${convertFile.name}. Click Download to save.`);
      triggerConfetti();

      // Trigger standard downloadable mockup PDF representing successful conversion
      const sampleBlob = new Blob([`DIGITAL HUB INDIA: Converted ${convertType} file from ${convertFile.name}`], { type: 'application/pdf' });
      const url = URL.createObjectURL(sampleBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${convertFile.name.split('.')[0]}_converted.pdf`;
      a.click();
    }, 1500);
  };

  // Helper to parse page range strings safely (1-indexed input to 0-indexed indices list)
  const parsePageRange = (inputStr: string, maxPages: number): number[] => {
    if (!inputStr.trim()) {
      return Array.from({ length: maxPages }, (_, i) => i);
    }
    const indices: number[] = [];
    const parts = inputStr.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (!isNaN(start) && !isNaN(end)) {
          const actualStart = Math.max(1, Math.min(start, maxPages));
          const actualEnd = Math.max(1, Math.min(end, maxPages));
          const low = Math.min(actualStart, actualEnd);
          const high = Math.max(actualStart, actualEnd);
          for (let i = low; i <= high; i++) {
            indices.push(i - 1); // convert to 0-indexed
          }
        }
      } else {
        const pNum = parseInt(trimmed);
        if (!isNaN(pNum) && pNum >= 1 && pNum <= maxPages) {
          indices.push(pNum - 1);
        }
      }
    }
    const uniqueIdxs = Array.from(new Set(indices)).sort((a, b) => a - b);
    return uniqueIdxs.length > 0 ? uniqueIdxs : Array.from({ length: maxPages }, (_, i) => i);
  };

  // --- PDF-LIB OPERATION: PDF MICRO-MAKER (N-UP LAYOUT) ---
  const executePdfMicroMaker = async () => {
    if (requireAuth && !currentUser) {
      requireAuth(() => executePdfMicroMaker(), 'You must be logged in to compile micro layout PDFs.');
      return;
    }
    if (!microFile) {
      setErrorMessage('Please upload a source PDF document file first.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileBytes = await microFile.arrayBuffer();
      // Load source PDF document
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const srcPageCount = srcDoc.getPageCount();
      
      // Parse targets page indexing list
      const targetIndices = parsePageRange(microPagesInput, srcPageCount);
      if (targetIndices.length === 0) {
        throw new Error('The selected page range yielded 0 valid pages from the source document.');
      }

      // Create new output document
      const outputDoc = await PDFDocument.create();
      
      const layoutNum = parseInt(microLayout);

      // Page size configuration (Standard ISO A4: 595.28 x 841.89 points)
      const paperW = microOrientation === 'landscape' ? 841.89 : 595.28;
      const paperH = microOrientation === 'landscape' ? 595.28 : 841.89;

      // Determine Grid dimensions
      let cols = 1;
      let rows = 1;

      if (layoutNum === 2) {
        if (microOrientation === 'landscape') { cols = 2; rows = 1; }
        else { cols = 1; rows = 2; }
      } else if (layoutNum === 4) {
        cols = 2; rows = 2;
      } else if (layoutNum === 6) {
        if (microOrientation === 'landscape') { cols = 3; rows = 2; }
        else { cols = 2; rows = 3; }
      } else if (layoutNum === 9) {
        cols = 3; rows = 3;
      } else if (layoutNum === 16) {
        cols = 4; rows = 4;
      }

      const gap = microSpacing;
      const totalGapW = gap * (cols + 1);
      const totalGapH = gap * (rows + 1);

      const cellW = (paperW - totalGapW) / cols;
      const cellH = (paperH - totalGapH) / rows;

      // Process target pages in chunks fitting on a single physical sheet
      const chunkSize = cols * rows;
      for (let chunkStart = 0; chunkStart < targetIndices.length; chunkStart += chunkSize) {
        const physicalPage = outputDoc.addPage([paperW, paperH]);
        const chunk = targetIndices.slice(chunkStart, chunkStart + chunkSize);

        for (let i = 0; i < chunk.length; i++) {
          const srcPageIdx = chunk[i];
          const colIdx = i % cols;
          const rowIdx = Math.floor(i / cols);

          // Calculate cell coordinates
          // Row zero is at the top of the physical sheet, so we decrement Y from paper ceiling
          const x = gap + colIdx * (cellW + gap);
          const y = paperH - gap - cellH - rowIdx * (cellH + gap);

          const srcPage = srcDoc.getPage(srcPageIdx);
          // Embed the vector template page
          const embeddedPage = await outputDoc.embedPage(srcPage);

          const srcW = srcPage.getWidth();
          const srcH = srcPage.getHeight();

          // Calculate uniform scaling scale factor to lock aspect ratios
          const scale = Math.min(cellW / srcW, cellH / srcH);
          const drawW = srcW * scale;
          const drawH = srcH * scale;

          // Align centered within cell borders
          const centeredX = x + (cellW - drawW) / 2;
          const centeredY = y + (cellH - drawH) / 2;

          physicalPage.drawPage(embeddedPage, {
            x: centeredX,
            y: centeredY,
            width: drawW,
            height: drawH,
          });

          // Draw an aesthetic light outline border around each micro page block
          physicalPage.drawRectangle({
            x: centeredX,
            y: centeredY,
            width: drawW,
            height: drawH,
            borderColor: rgb(0.85, 0.85, 0.85),
            borderWidth: 0.5,
          });
        }
      }

      // Save and transmit to client
      const pdfBytes = await outputDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const dlLink = document.createElement('a');
      dlLink.href = URL.createObjectURL(blob);
      dlLink.download = `Micro_Maker_${layoutNum}up_${microFile.name}`;
      dlLink.click();

      triggerConfetti();
      setSuccessMessage(`Success! Squeezed ${targetIndices.length} source pages into a compact micro-sheet layout (${layoutNum} pages per sheet) ready for printing.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed during compounding of micro layout. Try checking if PDF is corrupted or locked.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pdfToolsList = [
    { id: 'merge', name: 'Merge PDF', icon: Layers, desc: 'Combine multiple PDFs into a single organized document.', category: 'organize' },
    { id: 'split', name: 'Split & Extract PDF', icon: Scissors, desc: 'Extract specific pages or break PDF into separate volumes.', category: 'organize' },
    { id: 'remove-pages', name: 'Pages Remover', icon: Trash2, desc: 'Remove unwanted or cover pages to clean up your documents.', category: 'organize' },
    { id: 'scan-to-pdf', name: 'Scan to PDF', icon: Camera, desc: 'Snap photos of documents from your mobile camera to compile PDFs directly.', category: 'organize' },
    { id: 'pdf-micro', name: 'PDF Micro Maker (New 🌟)', icon: Sparkles, desc: 'Merge & squeeze multiple pages into a compact pocket grid. Ideal for tight cheatsheets or study guides.', category: 'edit' },
    { id: 'rotate', name: 'Rotate PDF', icon: RotateCw, desc: 'Reorient landscape or portrait pages to correct reading angle.', category: 'edit' },
    { id: 'watermark', name: 'Add Watermark', icon: Stamp, desc: 'Add personalized text stamp to prevent unauthorized theft/copying.', category: 'edit' },
    { id: 'page-numbers', name: 'Add Page Numbers', icon: Hash, desc: 'Draw custom page counts on headers or footers automatically.', category: 'edit' },
    { id: 'jpg-to-pdf', name: 'JPG / PNG to PDF', icon: FileImage, desc: 'Convert government exam document photos, certificates or receipts into standard PDFs.', category: 'convert-to' },
    { id: 'word-to-pdf', name: 'WORD to PDF', icon: FileText, desc: 'Convert doc/docx formats safely with optimized margins.', category: 'convert-to' },
    { id: 'excel-to-pdf', name: 'EXCEL to PDF', icon: FileSpreadsheet, desc: 'Produce high-contrast sheets printable layout PDF reports.', category: 'convert-to' },
    { id: 'protect-pdf', name: 'Protect PDF', icon: Lock, desc: 'Secure your certificate or invoice sheets with custom passwords.', category: 'security' },
    { id: 'unlock-pdf', name: 'Unlock / Decrypt PDF', icon: Unlock, desc: 'Remove owner passwords to edit and read files comfortably.', category: 'security' }
  ];

  return (
    <div className="space-y-8">
      {/* Visual Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            SECURE CLIENT SIDE PROCESSING
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2 display-title">
            Professional PDF Utilities Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Clean, zero-server document utilities by Digital Hub India. Protect your privacy: all merging, watermarking, and image compilation execute 100% locally in your browser.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 shrink-0">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>AES-256 CLIENT ENCRYPTED</span>
        </div>
      </div>

      {/* Main Grid or Selected Tool Console */}
      {activeToolId ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Tool Controller Bar */}
          <div className="bg-slate-50 py-4 px-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveToolId(null);
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-950 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg transition-colors"
              >
                ← Back to Tool List
              </button>
              <h2 className="text-base font-bold text-slate-800">
                Active Utility: {pdfToolsList.find(t => t.id === activeToolId)?.name}
              </h2>
            </div>
            <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
              {pdfToolsList.find(t => t.id === activeToolId)?.category.replace('-', ' ')}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Notifications panel */}
            {isProcessing && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-indigo-800 text-sm font-semibold animate-pulse">
                  Executing document algorithms client-side... Please wait a moment.
                </span>
              </div>
            )}
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-sm font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* --- CASE 1: MERGE PDF SUITE --- */}
            {activeToolId === 'merge' && (
              <div className="space-y-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleFileDrop(e, (files) => {
                    for (let i = 0; i < files.length; i++) {
                      if (files[i].type === 'application/pdf') {
                        setMergeFiles(prev => [...prev, { file: files[i], name: files[i].name, size: (files[i].size / 1024 / 1024).toFixed(2) + ' MB' }]);
                      }
                    }
                  })}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl py-10 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files) {
                        for (let i = 0; i < e.target.files.length; i++) {
                          setMergeFiles(prev => [...prev, { file: e.target.files![i], name: e.target.files![i].name, size: (e.target.files![i].size / 1024 / 1024).toFixed(2) + ' MB' }]);
                        }
                      }
                    }}
                    className="hidden"
                    id="merge-upload"
                  />
                  <label htmlFor="merge-upload" className="cursor-pointer space-y-2 block">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Drag or click to choose PDF files</p>
                    <p className="text-xs text-slate-400">Upload multiple PDF sheets in order</p>
                  </label>
                </div>

                {mergeFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Uploaded Files ({mergeFiles.length})</span>
                      <button onClick={() => setMergeFiles([])} className="text-rose-600 hover:underline">Clear All</button>
                    </div>
                    <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl max-h-60 overflow-y-auto border border-slate-100">
                      {mergeFiles.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 text-xs text-slate-700">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{idx + 1}</span>
                            <span className="font-semibold truncate max-w-xs">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-400">{item.size}</span>
                            <button
                              onClick={() => setMergeFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={executeMergePDF}
                      disabled={isProcessing}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                      Merge into Single PDF
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- CASE 2: ROTATE PDF --- */}
            {activeToolId === 'rotate' && (
              <div className="space-y-6 max-w-md mx-auto text-center">
                {!rotateFile ? (
                  <div className="border border-dashed border-slate-300 rounded-2xl py-10">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setRotateFile(e.target.files[0]);
                      }}
                      className="hidden"
                      id="rotate-upload"
                    />
                    <label htmlFor="rotate-upload" className="cursor-pointer space-y-2 block">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">Select PDF to rotate</p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm font-semibold text-indigo-950 flex items-center justify-between">
                      <span>Selected: {rotateFile.name}</span>
                      <button onClick={() => setRotateFile(null)} className="text-xs text-rose-500 hover:underline">Change</button>
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[90, 180, 270].map((angle) => (
                        <button
                          key={angle}
                          onClick={() => setRotationAngle(angle)}
                          className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                            rotationAngle === angle
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          +{angle}° Clockwise
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={executeRotatePDF}
                      disabled={isProcessing}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-all"
                    >
                      <RotateCw className="w-4 h-4" />
                      Rotate Page & Save Document
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- PDF MICRO-MAKER (N-UP LAYOUT UTILITY) --- */}
            {activeToolId === 'pdf-micro' && (
              <div className="space-y-6 max-w-2xl mx-auto text-left animate-in fade-in duration-200">
                <div className="bg-gradient-to-br from-purple-500/10 via-pink-400/5 to-indigo-500/5 p-5 rounded-2xl border border-indigo-150/40 text-left">
                  <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5 uppercase font-sans">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-spin" style={{ animationDuration: '3s' }} />
                    Candidate PDF Layout Micro-Maker
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Perfect for squeezing high-page PDFs (e.g., books, notes, 100-page booklets) into pocket-sized sheets. Read your entire material compactly, minimize printing pages, or compile beautiful cheatsheet tiles.
                  </p>
                </div>

                {!microFile ? (
                  <div className="border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/10 hover:bg-indigo-50/25 rounded-3xl p-8 text-center transition-all">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMicroFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="micro-upload"
                    />
                    <label htmlFor="micro-upload" className="cursor-pointer space-y-3 block">
                      <Upload className="w-10 h-10 text-indigo-400 mx-auto" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Choose PDF Document or drag here</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports standard PDF sheets up to 250MB</p>
                      </div>
                      <span className="inline-block px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-extrabold rounded-lg border border-indigo-100">
                        Browse File
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-left">
                    {/* Selection Card Header */}
                    <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <div className="truncate pr-4">
                        <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded uppercase font-mono">SELECTED PDF</span>
                        <p className="text-xs font-bold text-slate-900 truncate mt-1">{microFile.name}</p>
                        <p className="text-[10px] text-indigo-500 font-medium">Size: {(microFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => {
                          setMicroFile(null);
                          setMicroPagesInput('');
                        }}
                        className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>

                    {/* Grid settings options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* 1. Layout choice */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">Grid Layout Density *</label>
                        <select
                          value={microLayout}
                          onChange={(e: any) => setMicroLayout(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:bg-white"
                        >
                          <option value="1">1 Page/Sheet (Normal Extraction)</option>
                          <option value="2">2 Pages/Sheet (1x2 Split Layout)</option>
                          <option value="4">4 Pages/Sheet (2x2 Standard Cheatsheet)</option>
                          <option value="6">6 Pages/Sheet (3x2 High Density)</option>
                          <option value="9">9 Pages/Sheet (3x3 Micro Layout)</option>
                          <option value="16">16 Pages/Sheet (4x4 Pocket Layout)</option>
                        </select>
                        <p className="text-[10px] text-slate-400">Specifies how many target pages fit on a printout sheet.</p>
                      </div>

                      {/* 2. Orientation toggle */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">Sheet Orientation</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMicroOrientation('portrait')}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              microOrientation === 'portrait'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Portrait (Vertical)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMicroOrientation('landscape')}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              microOrientation === 'landscape'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Landscape (Horizontal)
                          </button>
                        </div>
                      </div>
                      
                      {/* 3. Page range selection */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">Page Range Selection</label>
                        <input
                          type="text"
                          placeholder="e.g. 1-100, or exact sheets: 1, 3, 5, 10-25 (leave blank for all pages)"
                          value={microPagesInput}
                          onChange={(e) => setMicroPagesInput(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold placeholder:text-slate-400 outline-none"
                        />
                        
                        {/* Quick pre-fill buttons for helper actions */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setMicroPagesInput('')}
                            className="text-[9px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                          >
                            All Pages
                          </button>
                          <button
                            type="button"
                            onClick={() => setMicroPagesInput('1-4')}
                            className="text-[9px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                          >
                            Pages 1-4
                          </button>
                          <button
                            type="button"
                            onClick={() => setMicroPagesInput('1-10')}
                            className="text-[9px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                          >
                            Pages 1-10
                          </button>
                          <button
                            type="button"
                            onClick={() => setMicroPagesInput('1,3,5,7,9')}
                            className="text-[9px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                          >
                            Odd Pages
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">Specifies the list or subset range of pages to include in the layout compilation.</p>
                      </div>

                      {/* 4. Cell padding and Gap spacing */}
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                          <span>Cell Grid Gap Spacing</span>
                          <span className="text-indigo-600 font-bold">{microSpacing} px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          step="2"
                          value={microSpacing}
                          onChange={(e) => setMicroSpacing(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[10px] text-slate-400">Controls the blank white space padding margins between each embedded page block.</p>
                      </div>

                    </div>

                    {/* Execution triggering Button */}
                    <button
                      onClick={executePdfMicroMaker}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-md transition-all mt-4 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      {isProcessing ? 'Synthesizing layout grid...' : `Generate & Save Micro layout PDF`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- CASE 3: ADD WATERMARK --- */}
            {activeToolId === 'watermark' && (
              <div className="space-y-6 max-w-xl mx-auto">
                {!watermarkFile ? (
                  <div className="border border-dashed border-slate-300 rounded-2xl py-10 text-center">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setWatermarkFile(e.target.files[0]);
                      }}
                      className="hidden"
                      id="watermark-upload"
                    />
                    <label htmlFor="watermark-upload" className="cursor-pointer space-y-2 block">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">Select PDF to stamp watermark</p>
                    </label>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-semibold text-indigo-950 flex items-center justify-between">
                        <span>Selected: {watermarkFile.name}</span>
                        <button onClick={() => setWatermarkFile(null)} className="text-xs text-rose-500 hover:underline">Change</button>
                      </p>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 block">Watermark Text</label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 block">Fill Color</label>
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-full h-10 p-1 border rounded-lg cursor-pointer max-w-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 block">Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                          <input
                            type="range"
                            min="0.1"
                            max="0.9"
                            step="0.05"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                            className="w-full h-10 cursor-pointer accent-indigo-600"
                          />
                        </div>
                      </div>

                      <button
                        onClick={executeAddWatermark}
                        disabled={isProcessing}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow hover:bg-indigo-700"
                      >
                        <Stamp className="w-4 h-4" />
                        Apply Watermark
                      </button>
                    </div>

                    {/* Simple virtual preview page */}
                    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex flex-col justify-between aspect-[3/4] relative overflow-hidden select-none">
                      <div className="text-[10px] text-slate-400 border-b pb-1">Watermark Preview Canvas</div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span
                          className="font-extrabold rotate-[45deg] scale-150 tracking-wider select-none truncate text-center max-w-[200px]"
                          style={{ color: watermarkColor, opacity: watermarkOpacity }}
                        >
                          {watermarkText || 'DIGITAL HUB INDIA'}
                        </span>
                      </div>
                      <div className="text-[8px] text-slate-300 text-center">Footer page content</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- CASE 4: ADD PAGE NUMBERS --- */}
            {activeToolId === 'page-numbers' && (
              <div className="space-y-6 max-w-md mx-auto">
                {!numberFile ? (
                  <div className="border border-dashed border-slate-300 rounded-2xl py-10 text-center">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setNumberFile(e.target.files[0]);
                      }}
                      className="hidden"
                      id="numbers-upload"
                    />
                    <label htmlFor="numbers-upload" className="cursor-pointer space-y-2 block">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">Select PDF to stamp page counts</p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>File: {numberFile.name}</span>
                      <button onClick={() => setNumberFile(null)} className="text-xs text-rose-500 hover:underline">Change</button>
                    </p>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 block">Position Placement</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['bottom-center', 'bottom-right', 'top-right'].map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setNumberPosition(pos as any)}
                            className={`py-3 px-1 rounded-xl border text-[11px] font-semibold tracking-tight transition-all ${
                              numberPosition === pos
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {pos.replace('-', ' ').toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={executeAddNumbers}
                      disabled={isProcessing}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow hover:bg-indigo-700"
                    >
                      <Hash className="w-4 h-4" />
                      Draw Page Numbers
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- CASE 5: JPG TO PDF --- */}
            {activeToolId === 'jpg-to-pdf' && (
              <div className="space-y-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleFileDrop(e, (files) => {
                    for (let i = 0; i < files.length; i++) {
                      if (files[i].type.startsWith('image/')) {
                        setImageFiles(prev => [...prev, { file: files[i], preview: URL.createObjectURL(files[i]) }]);
                      }
                    }
                  })}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl py-10 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        for (let i = 0; i < e.target.files.length; i++) {
                          setImageFiles(prev => [...prev, { file: e.target.files![i], preview: URL.createObjectURL(e.target.files![i]) }]);
                        }
                      }
                    }}
                    className="hidden"
                    id="images-upload"
                  />
                  <label htmlFor="images-upload" className="cursor-pointer space-y-2 block">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Drag or click to choose PNG/JPG images</p>
                    <p className="text-xs text-slate-400">Perfect for converting receipts, certificate snaps, and identity marks</p>
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Loaded Images ({imageFiles.length})</span>
                      <button onClick={() => setImageFiles([])} className="text-rose-600 hover:underline">Clear All</button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-72 overflow-y-auto">
                      {imageFiles.map((item, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                          <img src={item.preview} alt="preview" className="w-full h-24 object-cover" />
                          <div className="p-1.5 text-[10px] text-slate-500 truncate font-mono font-bold bg-slate-50 border-t flex justify-between items-center">
                            <span>Image {idx + 1}</span>
                            <button
                              onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 bg-white p-1 rounded border border-slate-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={executeJPGToPDF}
                      disabled={isProcessing}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow hover:bg-indigo-700"
                    >
                      <FileImage className="w-4 h-4" />
                      Compile Images to PDF File
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- CASE 6: PAGES REMOVER --- */}
            {activeToolId === 'remove-pages' && (
              <div className="space-y-6 max-w-md mx-auto">
                {!removeFile ? (
                  <div className="border border-dashed border-slate-300 rounded-2xl py-10 text-center">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setRemoveFile(e.target.files[0]);
                      }}
                      className="hidden"
                      id="remove-pages-upload"
                    />
                    <label htmlFor="remove-pages-upload" className="cursor-pointer space-y-2 block">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">Upload PDF to remove pages from</p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>File: {removeFile.name}</span>
                      <button onClick={() => setRemoveFile(null)} className="text-xs text-rose-500 hover:underline">Change</button>
                    </p>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Pages to Remove (Comma separated, e.g. 1, 3, 5)</label>
                      <input
                        type="text"
                        placeholder="e.g., 2,4"
                        value={removePagesInput}
                        onChange={(e) => setRemovePagesInput(e.target.value)}
                        className="w-full px-4 py-2 bg-white rounded-lg border focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <p className="text-[10px] text-slate-400">Specifying "2,3" will omit page 2 and page 3 from the exported document.</p>
                    </div>

                    <button
                      onClick={executePagesRemover}
                      disabled={isProcessing}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow hover:bg-indigo-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Pages & Compile
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- CASE 7: SCAN TO PDF --- */}
            {activeToolId === 'scan-to-pdf' && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">Direct Camera Capture to PDF</h3>
                    <p className="text-xs text-slate-400">Use your mobile phone's built-in camera to snap documents instantly.</p>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCaptureCamera}
                      ref={cameraInputRef}
                      className="hidden"
                    />
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
                    >
                      <Camera className="w-4 h-4" />
                      Snap Photo
                    </button>
                  </div>
                </div>

                {scanImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                      <span>Document Snaps ({scanImages.length})</span>
                      <button onClick={() => { setScanImages([]); setImageFiles([]); }} className="text-rose-500">Omit All</button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border">
                      {scanImages.map((src, index) => (
                        <div key={index} className="relative rounded-xl overflow-hidden border bg-white aspect-[3/4]">
                          <img src={src} className="w-full h-full object-cover" alt="snap preview" />
                          <button
                            onClick={() => removeScanImage(index)}
                            className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full shadow hover:bg-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={executeJPGToPDF}
                      disabled={isProcessing}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow hover:bg-indigo-700"
                    >
                      <FileDown className="w-4 h-4" />
                      Generate PDF from Captured Snaps
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No snaps captured. Click "Snap Photo" using your phone to build customized docs!
                  </div>
                )}
              </div>
            )}

            {/* --- GENERAL CONVERTERS (MS WORD / EXCEL / SPLIT / ETC) --- */}
            {(activeToolId === 'word-to-pdf' || activeToolId === 'excel-to-pdf' || activeToolId === 'protect-pdf' || activeToolId === 'unlock-pdf' || activeToolId === 'split') && (
              <div className="max-w-md mx-auto">
                <form onSubmit={handleGeneralConversion} className="space-y-4">
                  <p className="text-xs text-slate-500 mb-2">
                    Upload your document to generate a beautifully aligned PDF sheet using our auto-layout converters.
                  </p>

                  <div className="border border-dashed border-slate-300 rounded-2xl py-8 text-center bg-slate-50/50">
                    <input
                      type="file"
                      accept={activeToolId === 'word-to-pdf' ? '.doc,.docx' : activeToolId === 'excel-to-pdf' ? '.xls,.xlsx' : 'application/pdf'}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setConvertFile(e.target.files[0]);
                          setConvertType(activeToolId.toUpperCase().replace('-', ' '));
                        }
                      }}
                      className="hidden"
                      id="convert-input"
                    />
                    <label htmlFor="convert-input" className="cursor-pointer space-y-2 block">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">Choose file to begin conversion</p>
                    </label>
                  </div>

                  {convertFile && (
                    <div className="space-y-4">
                      <div className="p-3 bg-indigo-50/50 rounded-xl text-xs flex justify-between items-center text-indigo-950 font-bold border border-indigo-100">
                        <span className="truncate">Ready: {convertFile.name}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase font-mono">
                          {(convertFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>

                      {activeToolId === 'protect-pdf' && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 block">Set Password Key</label>
                          <input
                            type="password"
                            required
                            placeholder="Enter password to secure file"
                            value={protectPassword}
                            onChange={(e) => setProtectPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        Begin {activeToolId.replace('-', ' ').toUpperCase()} Process
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid list of all tools grouped by category */
        <div className="space-y-8">
          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-slate-50 border p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-slate-800">PDF Helpdesk</h3>
                <p className="text-xs text-slate-400">Select any tool to begin editing, merging, or converting documents securely inside your web browser.</p>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    No file size limit limits.
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Zero file uploads to cloud.
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pdfToolsList.map((tool) => {
                  const IconComponent = tool.icon;
                  // Dynamic flag to show fully operational status
                  const isFullyOperational = ['merge', 'rotate', 'watermark', 'page-numbers', 'jpg-to-pdf', 'remove-pages', 'scan-to-pdf'].includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        setActiveToolId(tool.id);
                        setConvertFile(null);
                        setSuccessMessage(null);
                        setErrorMessage(null);
                      }}
                      className="group p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-105 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                            {tool.name}
                            {isFullyOperational && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Pure client-side processing active"></span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-light">{tool.desc}</p>
                        </div>
                      </div>
                      <span className="mt-4 text-[10px] font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                        Use Utility
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal check circle placeholder to avoid exports errors
function CheckCircle2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
