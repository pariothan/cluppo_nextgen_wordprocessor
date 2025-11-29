// Export Class - Handles exporting documents to various formats
class Exporter {
    constructor(editor) {
        this.editor = editor;
    }

    init() {
        // No initialization needed
    }

    // Export as HTML file
    exportAsHtml() {
        const content = this.editor.getContent();
        const documentName = window.wordProcessor.documentName;

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(documentName)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 8.5in;
            margin: 40px auto;
            padding: 1in;
            line-height: 1.6;
            color: #000;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1em;
            margin-bottom: 0.5em;
        }
        p {
            margin: 0 0 12pt 0;
        }
        ul, ol {
            margin: 0 0 12pt 0;
            padding-left: 40px;
        }
    </style>
</head>
<body>
${content}
</body>
</html>`;

        this.downloadFile(htmlContent, `${documentName}.html`, 'text/html');
    }

    // Export as plain text
    exportAsText() {
        const text = this.editor.getText();
        const documentName = window.wordProcessor.documentName;

        this.downloadFile(text, `${documentName}.txt`, 'text/plain');
    }

    // Export as PDF using jsPDF
    exportAsPdf() {
        const documentName = window.wordProcessor.documentName;

        try {
            // Check if jsPDF is loaded
            if (typeof window.jspdf === 'undefined') {
                alert('PDF export library not loaded. Please check your internet connection.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Get text content
            const text = this.editor.getText();

            // Split text into lines that fit the page width
            const lines = doc.splitTextToSize(text, 180);

            // Add text to PDF
            let y = 20;
            const pageHeight = doc.internal.pageSize.height;
            const lineHeight = 7;

            lines.forEach(line => {
                if (y + lineHeight > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 20, y);
                y += lineHeight;
            });

            // Save the PDF
            doc.save(`${documentName}.pdf`);
        } catch (e) {
            console.error('PDF export error:', e);
            alert('Error creating PDF. Please try exporting as HTML or TXT instead.');
        }
    }

    // Print the document
    print() {
        window.print();
    }

    // Helper function to download a file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // Escape HTML for safe output
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Advanced PDF export with better formatting (optional enhancement)
    exportAsPdfAdvanced() {
        const documentName = window.wordProcessor.documentName;

        try {
            if (typeof window.jspdf === 'undefined') {
                alert('PDF export library not loaded.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Clone the editor content
            const editorClone = this.editor.editorElement.cloneNode(true);

            // Get all elements and convert to text with formatting
            const elements = editorClone.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li');

            let y = 20;
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            const maxWidth = pageWidth - 2 * margin;

            elements.forEach(element => {
                let fontSize = 12;
                let fontStyle = 'normal';

                // Set font size and style based on element type
                if (element.tagName === 'H1') fontSize = 24;
                else if (element.tagName === 'H2') fontSize = 20;
                else if (element.tagName === 'H3') fontSize = 16;
                else if (element.tagName === 'H4') fontSize = 14;
                else if (element.tagName === 'H5') fontSize = 12;
                else if (element.tagName === 'H6') fontSize = 11;

                // Check for bold/italic
                if (element.querySelector('b, strong') || element.style.fontWeight === 'bold') {
                    fontStyle = 'bold';
                }
                if (element.querySelector('i, em') || element.style.fontStyle === 'italic') {
                    fontStyle = fontStyle === 'bold' ? 'bolditalic' : 'italic';
                }

                doc.setFontSize(fontSize);
                doc.setFont('helvetica', fontStyle);

                const text = element.textContent.trim();
                if (text) {
                    const lines = doc.splitTextToSize(text, maxWidth);
                    const lineHeight = fontSize * 0.5;

                    lines.forEach(line => {
                        if (y + lineHeight > pageHeight - margin) {
                            doc.addPage();
                            y = margin;
                        }
                        doc.text(line, margin, y);
                        y += lineHeight;
                    });

                    y += lineHeight * 0.5; // Add spacing after paragraph
                }
            });

            doc.save(`${documentName}.pdf`);
        } catch (e) {
            console.error('Advanced PDF export error:', e);
            // Fallback to simple export
            this.exportAsPdf();
        }
    }
}
