// Main Application Logic
class WordProcessor {
    constructor() {
        this.editor = new Editor();
        this.toolbar = new Toolbar(this.editor);
        this.storage = new Storage(this.editor);
        this.exporter = new Exporter(this.editor);
        this.clippy = new ClippyAssistant(this.editor);
        this.documentName = 'Untitled Document';
        this.lastSavedAt = null;
        this.lastSaveType = 'Unsaved';

        this.storage.onSaveEvent = (timestamp, type) => {
            this.lastSavedAt = timestamp;
            this.lastSaveType = type;
            this.updateSaveStatus(type, timestamp);
        };

        this.init();
    }

    init() {
        // Initialize all components
        this.editor.init();
        this.toolbar.init();
        this.storage.init();
        this.exporter.init();
        this.clippy.init();
        this.setupStatusBar();

        // Set up event listeners
        this.setupMenus();
        this.setupEditMenu();
        this.setupFindReplace();
        this.setupKeyboardShortcuts();
        this.setupWindowControls();

        // Load autosaved content if exists
        this.storage.loadAutosave();

        // Set up autosave
        this.setupAutosave();

        // Set up Cluppo triggers (for testing - trigger after 10 seconds)
        this.setupClippyTriggers();

        // Sync initial document context to Cluppo
        this.updateDocumentName(this.documentName);

        console.log('Word Processor initialized');
    }

    setupMenus() {
        const fileMenu = document.getElementById('fileMenu');
        const fileDropdown = document.getElementById('fileDropdown');
        const editMenu = document.getElementById('editMenu');
        const editDropdown = document.getElementById('editDropdown');

        // File menu toggle
        fileMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            editDropdown.classList.remove('active');
            fileDropdown.classList.toggle('active');
        });

        // Edit menu toggle
        editMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            fileDropdown.classList.remove('active');
            editDropdown.classList.toggle('active');
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            fileDropdown.classList.remove('active');
            editDropdown.classList.remove('active');
        });

        // Prevent dropdown from closing when clicking inside
        fileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        editDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // File menu items
        document.getElementById('newDoc').addEventListener('click', () => {
            this.newDocument();
            fileDropdown.classList.remove('active');
        });

        document.getElementById('saveDoc').addEventListener('click', () => {
            this.storage.save();
            fileDropdown.classList.remove('active');
        });

        document.getElementById('loadDoc').addEventListener('click', () => {
            this.storage.load();
            fileDropdown.classList.remove('active');
        });

        document.getElementById('exportHtml').addEventListener('click', () => {
            this.exporter.exportAsHtml();
            fileDropdown.classList.remove('active');
        });

        document.getElementById('exportTxt').addEventListener('click', () => {
            this.exporter.exportAsText();
            fileDropdown.classList.remove('active');
        });

        document.getElementById('exportPdf').addEventListener('click', () => {
            this.exporter.exportAsPdf();
            fileDropdown.classList.remove('active');
        });

        document.getElementById('printDoc').addEventListener('click', () => {
            this.exporter.print();
            fileDropdown.classList.remove('active');
        });
    }

    setupEditMenu() {
        const editDropdown = document.getElementById('editDropdown');

        // Undo/Redo
        document.getElementById('menuUndo').addEventListener('click', () => {
            this.editor.execCommand('undo');
            editDropdown.classList.remove('active');
        });

        document.getElementById('menuRedo').addEventListener('click', () => {
            this.editor.execCommand('redo');
            editDropdown.classList.remove('active');
        });

        // Cut/Copy/Paste
        document.getElementById('menuCut').addEventListener('click', () => {
            document.execCommand('cut');
            editDropdown.classList.remove('active');
        });

        document.getElementById('menuCopy').addEventListener('click', () => {
            document.execCommand('copy');
            editDropdown.classList.remove('active');
        });

        document.getElementById('menuPaste').addEventListener('click', () => {
            document.execCommand('paste');
            editDropdown.classList.remove('active');
        });

        // Select All
        document.getElementById('menuSelectAll').addEventListener('click', () => {
            this.editor.selectAll();
            editDropdown.classList.remove('active');
        });

        // Find/Replace
        document.getElementById('menuFind').addEventListener('click', () => {
            this.openFindReplace();
            editDropdown.classList.remove('active');
        });

        document.getElementById('menuReplace').addEventListener('click', () => {
            this.openFindReplace();
            editDropdown.classList.remove('active');
        });
    }

    setupFindReplace() {
        const dialog = document.getElementById('findReplaceDialog');
        const closeBtn = document.getElementById('closeFindReplace');
        const findInput = document.getElementById('findInput');
        const replaceInput = document.getElementById('replaceInput');
        const caseSensitive = document.getElementById('caseSensitive');

        closeBtn.addEventListener('click', () => {
            dialog.classList.add('hidden');
        });

        // Close on overlay click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.add('hidden');
            }
        });

        // Find Next
        document.getElementById('findNextBtn').addEventListener('click', () => {
            this.findNext(findInput.value, caseSensitive.checked);
        });

        // Replace
        document.getElementById('replaceBtn').addEventListener('click', () => {
            this.replace(findInput.value, replaceInput.value, caseSensitive.checked);
        });

        // Replace All
        document.getElementById('replaceAllBtn').addEventListener('click', () => {
            this.replaceAll(findInput.value, replaceInput.value, caseSensitive.checked);
        });

        // Enter key in find input triggers Find Next
        findInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.findNext(findInput.value, caseSensitive.checked);
            }
        });
    }

    openFindReplace() {
        const dialog = document.getElementById('findReplaceDialog');
        dialog.classList.remove('hidden');
        document.getElementById('findInput').focus();
    }

    findNext(searchText, caseSensitive) {
        if (!searchText) return;

        const found = window.find(searchText, caseSensitive, false, true);
        if (!found) {
            alert('No more occurrences found.');
        }
    }

    replace(searchText, replaceText, caseSensitive) {
        if (!searchText) return;

        const selection = window.getSelection();
        if (selection.toString() === searchText ||
            (!caseSensitive && selection.toString().toLowerCase() === searchText.toLowerCase())) {
            document.execCommand('insertText', false, replaceText);
        }
        this.findNext(searchText, caseSensitive);
    }

    replaceAll(searchText, replaceText, caseSensitive) {
        if (!searchText) return;

        const content = this.editor.editorElement.innerHTML;
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

        const newContent = content.replace(regex, replaceText);
        this.editor.setContent(newContent);

        const count = (content.match(regex) || []).length;
        alert(`Replaced ${count} occurrence(s).`);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.storage.save();
            }

            // Ctrl/Cmd + N: New Document
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.newDocument();
            }

            // Ctrl/Cmd + O: Open Document
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.storage.load();
            }

            // Ctrl/Cmd + P: Print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.exporter.print();
            }

            // Ctrl/Cmd + F: Find
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.openFindReplace();
            }

            // Ctrl/Cmd + H: Find and Replace
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.openFindReplace();
            }

            // Ctrl/Cmd + Shift + L: Ask Cluppo
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                this.clippy.showLoading();
                this.clippy.showMoreInfo();
                this.clippy.setMood('helpful', 'Keyboard shortcut ask');
            }

            // Ctrl/Cmd + Shift + D: Dispute Cluppo
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                this.clippy.triggerDispute();
            }
        });
    }

    setupAutosave() {
        // Autosave every 30 seconds
        setInterval(() => {
            this.storage.autosave();
        }, 30000);
    }

    newDocument() {
        if (confirm('Create a new document? Any unsaved changes will be lost.')) {
            this.editor.clear();
            this.documentName = 'Untitled Document';
            this.updateDocumentName();
            this.storage.clearAutosave();
            this.updateSaveStatus('Unsaved', null);
        }
    }

    updateDocumentName(name = this.documentName) {
        this.documentName = name;
        document.getElementById('documentName').textContent = name;
        if (this.clippy) {
            this.clippy.setDocumentContext(name);
        }
    }

    setDocumentName(name) {
        this.updateDocumentName(name);
    }

    setupStatusBar() {
        const renameBtn = document.getElementById('renameDoc');
        if (renameBtn) {
            renameBtn.addEventListener('click', () => {
                const newName = prompt('Rename document:', this.documentName);
                if (newName && newName.trim().length > 0) {
                    this.setDocumentName(newName.trim());
                }
            });
        }

        this.updateSaveStatus('Unsaved', null);
    }

    updateSaveStatus(type = 'Saved', timestamp = null) {
        const statusEl = document.getElementById('saveStatus');
        if (!statusEl) return;

        if (!timestamp) {
            statusEl.textContent = 'No saves yet';
            return;
        }

        const stamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const timeText = stamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        statusEl.textContent = `${type}: ${timeText}`;
    }

    setupWindowControls() {
        const windowFrame = document.querySelector('.window-frame');
        const titleBar = document.querySelector('.title-bar');
        const maximizeBtn = document.getElementById('maximizeBtn');

        let isDragging = false;
        let isMaximized = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Make title bar draggable
        titleBar.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on buttons or menu items
            if (e.target.closest('.title-bar-controls') || e.target.closest('.menu-bar')) {
                return;
            }

            isDragging = true;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            titleBar.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && !isMaximized) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                windowFrame.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            titleBar.style.cursor = '';
        });

        // Maximize button
        maximizeBtn.addEventListener('click', () => {
            isMaximized = !isMaximized;
            if (isMaximized) {
                windowFrame.style.width = '100%';
                windowFrame.style.height = '100vh';
                windowFrame.style.maxWidth = '100%';
                windowFrame.style.borderRadius = '0';
                windowFrame.style.transform = 'translate(-50%, -50%)';
                xOffset = 0;
                yOffset = 0;
            } else {
                windowFrame.style.width = '95%';
                windowFrame.style.height = '90vh';
                windowFrame.style.maxWidth = '1200px';
                windowFrame.style.borderRadius = '12px';
                windowFrame.style.transform = `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px))`;
            }
        });

        // Double-click title bar to maximize
        titleBar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.title-bar-controls') || e.target.closest('.menu-bar')) {
                return;
            }
            maximizeBtn.click();
        });
    }

    setupClippyTriggers() {
        // Intentionally left empty: Cluppo now operates only on explicit command.
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wordProcessor = new WordProcessor();
});
