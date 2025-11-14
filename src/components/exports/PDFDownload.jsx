import React, { useState } from 'react';
import { DownloadIcon, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PDFDownload = ({ targetRef, filename = 'battery_efficiency_analysis.pdf' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!targetRef.current) {
      setError('Content reference not found');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Clone and prepare the content
      const element = targetRef.current.cloneNode(true);
      const container = document.createElement('div');
      container.appendChild(element);
      
      // Style container
      Object.assign(container.style, {
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '1200px', // Increased width for better quality
        backgroundColor: '#ffffff',
        padding: '40px'
      });
      
      document.body.appendChild(container);

      // Remove download button from clone
      const downloadButton = container.querySelector('.download-footer');
      if (downloadButton) {
        downloadButton.remove();
      }

      // Ensure chart is rendered properly
      const chartContainer = container.querySelector('.chart-wrapper');
      if (chartContainer) {
        Object.assign(chartContainer.style, {
          height: '500px', // Increased height for better visibility
          width: '100%',
          marginBottom: '40px'
        });
      }

      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        width: 1200,
        height: element.offsetHeight,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          // Make all elements visible
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let el of allElements) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none') {
              el.style.display = 'block';
            }
            if (style.visibility === 'hidden') {
              el.style.visibility = 'visible';
            }
          }
        }
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        compress: true
      });

      // PDF dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate the number of pages needed
      const totalHeight = canvas.height;
      const pageHeightInPx = (pageHeight / pageWidth) * canvas.width;
      const totalPages = Math.ceil(totalHeight / pageHeightInPx);

      // Add pages
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate the portion of the canvas to use for this page
        const sourceY = i * pageHeightInPx;
        const remainingHeight = totalHeight - sourceY;
        const sourceHeight = Math.min(pageHeightInPx, remainingHeight);
        
        pdf.addImage(
          canvas,
          'JPEG',
          0,
          -sourceY * (pageHeight / pageHeightInPx), // Adjust y position
          pageWidth,
          (canvas.height * pageWidth) / canvas.width,
          undefined,
          'FAST'
        );
      }

      // Clean up
      document.body.removeChild(container);

      // Save PDF
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(`Failed to generate PDF: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md transition-colors ${
          isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
        }`}
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <DownloadIcon className="w-4 h-4" />
        )}
        <span>{isGenerating ? 'Generating PDF...' : 'Download Report'}</span>
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default PDFDownload;