// Storage Class - Handles saving and loading documents
class Storage {
    constructor(editor) {
        this.editor = editor;
        this.fileInput = null;
        this.autosaveKey = 'wordprocessor_autosave';
        this.documentsKey = 'wordprocessor_documents';
        this.onSaveEvent = null;
    }

    init() {
        this.fileInput = document.getElementById('fileInput');
        this.setupFileInputListener();
    }

    setupFileInputListener() {
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadFile(file);
            }
            // Reset file input
            this.fileInput.value = '';
        });
    }

    // Save document to localStorage
    save() {
        const content = this.editor.getContent();
        const documentName = prompt('Enter document name:', window.wordProcessor.documentName);

        if (documentName) {
            const document = {
                name: documentName,
                content: content,
                timestamp: new Date().toISOString()
            };

            // Get existing documents
            const documents = this.getDocuments();

            // Add or update document
            const existingIndex = documents.findIndex(doc => doc.name === documentName);
            if (existingIndex >= 0) {
                documents[existingIndex] = document;
            } else {
                documents.push(document);
            }

            // Save to localStorage
            try {
                localStorage.setItem(this.documentsKey, JSON.stringify(documents));
                window.wordProcessor.setDocumentName(documentName);
                if (this.onSaveEvent) {
                    this.onSaveEvent(new Date(), 'Saved');
                }
                alert(`Document "${documentName}" saved successfully!`);
            } catch (e) {
                alert('Error saving document. Your browser storage might be full.');
                console.error(e);
            }
        }
    }

    // Load document from localStorage or file
    load() {
        const documents = this.getDocuments();

        if (documents.length === 0) {
            if (confirm('No saved documents found. Would you like to load from a file?')) {
                this.fileInput.click();
            }
            return;
        }

        // Create a simple selection dialog
        let message = 'Choose a document to load:\n\n';
        documents.forEach((doc, index) => {
            const date = new Date(doc.timestamp).toLocaleString();
            message += `${index + 1}. ${doc.name} (${date})\n`;
        });
        message += '\nEnter the number (or 0 to load from file):';

        const choice = prompt(message);

        if (choice === null) return;

        const index = parseInt(choice) - 1;

        if (choice === '0') {
            this.fileInput.click();
        } else if (index >= 0 && index < documents.length) {
            const doc = documents[index];
            this.editor.setContent(doc.content);
            window.wordProcessor.setDocumentName(doc.name);
            if (this.onSaveEvent) {
                this.onSaveEvent(new Date(), 'Loaded');
            }
            alert(`Document "${doc.name}" loaded successfully!`);
        } else {
            alert('Invalid selection.');
        }
    }

    // Load from file
    loadFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;

            // Check if it's HTML or text
            if (file.name.endsWith('.html')) {
                this.editor.setContent(content);
            } else {
                // Convert plain text to HTML paragraphs
                const paragraphs = content.split('\n').map(line => {
                    return line.trim() ? `<p>${this.escapeHtml(line)}</p>` : '<p><br></p>';
                }).join('');
                this.editor.setContent(paragraphs);
            }

            const fileName = file.name.replace(/\.[^/.]+$/, '');
            window.wordProcessor.setDocumentName(fileName);
            if (this.onSaveEvent) {
                this.onSaveEvent(new Date(), 'Loaded');
            }
            alert(`File "${file.name}" loaded successfully!`);
        };

        reader.onerror = () => {
            alert('Error reading file.');
        };

        reader.readAsText(file);
    }

    // Get all documents from localStorage
    getDocuments() {
        try {
            const docs = localStorage.getItem(this.documentsKey);
            return docs ? JSON.parse(docs) : [];
        } catch (e) {
            console.error('Error loading documents:', e);
            return [];
        }
    }

    // Delete a document
    deleteDocument(name) {
        const documents = this.getDocuments();
        const filtered = documents.filter(doc => doc.name !== name);
        localStorage.setItem(this.documentsKey, JSON.stringify(filtered));
    }

    // Autosave functionality
    autosave() {
        const content = this.editor.getContent();
        try {
            localStorage.setItem(this.autosaveKey, JSON.stringify({
                content: content,
                timestamp: new Date().toISOString()
            }));
            const now = new Date();
            if (this.onSaveEvent) {
                this.onSaveEvent(now, 'Autosave');
            }
            console.log('Autosaved at', now.toLocaleTimeString());
        } catch (e) {
            console.error('Autosave failed:', e);
        }
    }

    // Load autosaved content
    loadAutosave() {
        try {
            const autosave = localStorage.getItem(this.autosaveKey);
            if (autosave) {
                const data = JSON.parse(autosave);
                const timestamp = new Date(data.timestamp);
                const now = new Date();
                const diffMinutes = (now - timestamp) / 1000 / 60;

                // Only restore if autosave is less than 24 hours old
                if (diffMinutes < 24 * 60) {
                    const restore = confirm(
                        `An autosaved version from ${timestamp.toLocaleString()} was found. Would you like to restore it?`
                    );

                    if (restore) {
                        this.editor.setContent(data.content);
                    }
                }
            }
        } catch (e) {
            console.error('Error loading autosave:', e);
        }
    }

    // Clear autosave
    clearAutosave() {
        localStorage.removeItem(this.autosaveKey);
    }

    // Escape HTML for plain text conversion
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
