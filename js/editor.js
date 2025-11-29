// Editor Class - Handles the main editor functionality
class Editor {
    constructor() {
        this.editorElement = null;
        this.wordCountElement = null;
        this.charCountElement = null;
    }

    init() {
        this.editorElement = document.getElementById('editor');
        this.wordCountElement = document.getElementById('wordCount');
        this.charCountElement = document.getElementById('charCount');

        // Set up event listeners
        this.setupEventListeners();

        // Initial count update
        this.updateWordCount();

        // Focus the editor
        this.focus();
    }

    setupEventListeners() {
        // Update word count on input
        this.editorElement.addEventListener('input', () => {
            this.updateWordCount();
        });

        // Prevent Tab from leaving the editor
        this.editorElement.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();

                // Insert tab or indent
                if (e.shiftKey) {
                    document.execCommand('outdent', false, null);
                } else {
                    document.execCommand('indent', false, null);
                }
            }
        });

        // Handle paste events to clean up formatting (optional)
        this.editorElement.addEventListener('paste', (e) => {
            // Allow default paste behavior
            // For cleaner paste, you could strip formatting here
        });
    }

    updateWordCount() {
        const text = this.getText();
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = text.trim().length === 0 ? 0 : words.length;
        const charCount = text.length;

        this.wordCountElement.textContent = `Words: ${wordCount}`;
        this.charCountElement.textContent = `Characters: ${charCount}`;
    }

    getContent() {
        return this.editorElement.innerHTML;
    }

    setContent(html) {
        this.editorElement.innerHTML = html;
        this.updateWordCount();
    }

    getText() {
        return this.editorElement.innerText || '';
    }

    clear() {
        this.editorElement.innerHTML = '<p>Start typing your document here...</p>';
        this.updateWordCount();
        this.focus();
    }

    focus() {
        this.editorElement.focus();
    }

    // Execute formatting commands
    execCommand(command, value = null) {
        this.focus();
        document.execCommand(command, false, value);
        this.updateWordCount();
    }

    // Query command state (for toolbar button highlighting)
    queryCommandState(command) {
        return document.queryCommandState(command);
    }

    queryCommandValue(command) {
        return document.queryCommandValue(command);
    }

    // Insert HTML at cursor position
    insertHTML(html) {
        this.focus();
        document.execCommand('insertHTML', false, html);
    }

    // Get selected text
    getSelection() {
        return window.getSelection();
    }

    // Save current selection
    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            return selection.getRangeAt(0);
        }
        return null;
    }

    // Restore saved selection
    restoreSelection(range) {
        if (range) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    // Select all content
    selectAll() {
        const range = document.createRange();
        range.selectNodeContents(this.editorElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
