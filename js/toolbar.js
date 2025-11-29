// Toolbar Class - Handles all toolbar interactions
class Toolbar {
    constructor(editor) {
        this.editor = editor;
        this.buttons = {};
        this.selects = {};
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupSelectionChangeListener();
    }

    cacheElements() {
        // Text formatting buttons
        this.buttons.bold = document.getElementById('bold');
        this.buttons.italic = document.getElementById('italic');
        this.buttons.underline = document.getElementById('underline');
        this.buttons.strikethrough = document.getElementById('strikethrough');

        // Alignment buttons
        this.buttons.alignLeft = document.getElementById('alignLeft');
        this.buttons.alignCenter = document.getElementById('alignCenter');
        this.buttons.alignRight = document.getElementById('alignRight');
        this.buttons.alignJustify = document.getElementById('alignJustify');

        // List buttons
        this.buttons.orderedList = document.getElementById('orderedList');
        this.buttons.unorderedList = document.getElementById('unorderedList');

        // Indentation buttons
        this.buttons.indent = document.getElementById('indent');
        this.buttons.outdent = document.getElementById('outdent');

        // Undo/Redo buttons
        this.buttons.undo = document.getElementById('undo');
        this.buttons.redo = document.getElementById('redo');
        this.buttons.askCluppo = document.getElementById('askCluppo');
        this.revealDone = sessionStorage.getItem('cluppo_reveal_seen') === '1';

        // Selects
        this.selects.fontFamily = document.getElementById('fontFamily');
        this.selects.fontSize = document.getElementById('fontSize');
        this.selects.formatBlock = document.getElementById('formatBlock');

        // Color inputs
        this.selects.textColor = document.getElementById('textColor');
        this.selects.highlightColor = document.getElementById('highlightColor');
    }

    setupEventListeners() {
        // Text formatting
        this.buttons.bold.addEventListener('click', () => this.editor.execCommand('bold'));
        this.buttons.italic.addEventListener('click', () => this.editor.execCommand('italic'));
        this.buttons.underline.addEventListener('click', () => this.editor.execCommand('underline'));
        this.buttons.strikethrough.addEventListener('click', () => this.editor.execCommand('strikeThrough'));

        // Alignment
        this.buttons.alignLeft.addEventListener('click', () => this.editor.execCommand('justifyLeft'));
        this.buttons.alignCenter.addEventListener('click', () => this.editor.execCommand('justifyCenter'));
        this.buttons.alignRight.addEventListener('click', () => this.editor.execCommand('justifyRight'));
        this.buttons.alignJustify.addEventListener('click', () => this.editor.execCommand('justifyFull'));

        // Lists
        this.buttons.orderedList.addEventListener('click', () => this.editor.execCommand('insertOrderedList'));
        this.buttons.unorderedList.addEventListener('click', () => this.editor.execCommand('insertUnorderedList'));

        // Indentation
        this.buttons.indent.addEventListener('click', () => this.editor.execCommand('indent'));
        this.buttons.outdent.addEventListener('click', () => this.editor.execCommand('outdent'));

        // Undo/Redo
        this.buttons.undo.addEventListener('click', () => this.editor.execCommand('undo'));
        this.buttons.redo.addEventListener('click', () => this.editor.execCommand('redo'));
        if (this.buttons.askCluppo) {
            const revealOverlay = document.getElementById('cluppoReveal');
            if (this.revealDone) {
                this.buttons.askCluppo.textContent = '📎';
                this.buttons.askCluppo.title = 'Ask Cluppo for help';
            }

            this.buttons.askCluppo.addEventListener('mousedown', (e) => {
                // Keep the editor selection alive so Cluppo sees highlighted text
                e.preventDefault();
                if (window.wordProcessor && window.wordProcessor.clippy) {
                    window.wordProcessor.clippy.cacheSelectionFromEditor();
                }
            });
            this.buttons.askCluppo.addEventListener('click', () => {
                if (!this.revealDone) {
                    this.triggerReveal(revealOverlay);
                }
                if (window.wordProcessor && window.wordProcessor.clippy) {
                    window.wordProcessor.clippy.cacheSelectionFromEditor();
                    window.wordProcessor.clippy.showLoading();
                    window.wordProcessor.clippy.showMoreInfo();
                }
            });
        }

        // Font family
        this.selects.fontFamily.addEventListener('change', (e) => {
            this.editor.execCommand('fontName', e.target.value);
        });

        // Font size
        this.selects.fontSize.addEventListener('change', (e) => {
            this.editor.execCommand('fontSize', e.target.value);
        });

        // Format block (headings)
        this.selects.formatBlock.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'p') {
                this.editor.execCommand('formatBlock', '<p>');
            } else {
                this.editor.execCommand('formatBlock', `<${value}>`);
            }
        });

        // Text color
        this.selects.textColor.addEventListener('input', (e) => {
            this.editor.execCommand('foreColor', e.target.value);
        });

        // Highlight color
        this.selects.highlightColor.addEventListener('input', (e) => {
            this.editor.execCommand('hiliteColor', e.target.value);
        });

        // Keyboard shortcuts for formatting
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.editor.execCommand('bold');
                        this.updateButtonStates();
                        break;
                    case 'i':
                        e.preventDefault();
                        this.editor.execCommand('italic');
                        this.updateButtonStates();
                        break;
                    case 'u':
                        e.preventDefault();
                        this.editor.execCommand('underline');
                        this.updateButtonStates();
                        break;
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.editor.execCommand('redo');
                        } else {
                            e.preventDefault();
                            this.editor.execCommand('undo');
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.editor.execCommand('redo');
                        break;
                }
            }
        });
    }

    setupSelectionChangeListener() {
        // Update toolbar state when selection changes
        document.addEventListener('selectionchange', () => {
            this.updateButtonStates();
        });

        // Also update on mouse up and key up in editor
        this.editor.editorElement.addEventListener('mouseup', () => {
            this.updateButtonStates();
        });

        this.editor.editorElement.addEventListener('keyup', () => {
            this.updateButtonStates();
        });
    }

    triggerReveal(overlay) {
        if (this.revealDone) return;
        this.revealDone = true;
        sessionStorage.setItem('cluppo_reveal_seen', '1');
        if (this.buttons.askCluppo) {
            this.buttons.askCluppo.textContent = '📎';
            this.buttons.askCluppo.title = 'Ask Cluppo for help';
        }
        if (!overlay) return;
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.setAttribute('aria-hidden', 'true');
        }, 2200);
    }

    updateButtonStates() {
        // Update button active states
        this.updateButtonState('bold', 'bold');
        this.updateButtonState('italic', 'italic');
        this.updateButtonState('underline', 'underline');
        this.updateButtonState('strikethrough', 'strikeThrough');

        this.updateButtonState('orderedList', 'insertOrderedList');
        this.updateButtonState('unorderedList', 'insertUnorderedList');

        this.updateButtonState('alignLeft', 'justifyLeft');
        this.updateButtonState('alignCenter', 'justifyCenter');
        this.updateButtonState('alignRight', 'justifyRight');
        this.updateButtonState('alignJustify', 'justifyFull');

        // Update format block select
        this.updateFormatBlock();
    }

    updateButtonState(buttonKey, command) {
        if (this.buttons[buttonKey]) {
            const isActive = this.editor.queryCommandState(command);
            if (isActive) {
                this.buttons[buttonKey].classList.add('active');
            } else {
                this.buttons[buttonKey].classList.remove('active');
            }
        }
    }

    updateFormatBlock() {
        // Get the current block format
        const formatBlock = this.editor.queryCommandValue('formatBlock').toLowerCase();

        // Map the format to our select value
        let selectValue = 'p';
        if (formatBlock.includes('h1')) selectValue = 'h1';
        else if (formatBlock.includes('h2')) selectValue = 'h2';
        else if (formatBlock.includes('h3')) selectValue = 'h3';
        else if (formatBlock.includes('h4')) selectValue = 'h4';
        else if (formatBlock.includes('h5')) selectValue = 'h5';
        else if (formatBlock.includes('h6')) selectValue = 'h6';

        this.selects.formatBlock.value = selectValue;
    }
}
