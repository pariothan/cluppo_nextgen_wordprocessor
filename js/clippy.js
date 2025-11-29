// Cluppo Assistant Class - Annoying AI Helper
class ClippyAssistant {
    constructor(editor) {
        this.editor = editor;
        this.documentId = 'Untitled Document';
        this.isVisible = false;
        this.container = null;
        this.messageElement = null;
        this.loadingElement = null;
        this.highlightElement = null;
        this.currentHighlightText = null;
        this.eyesElement = null;
        this.leftPupil = null;
        this.rightPupil = null;
        this.blinkInterval = null;
        this.eyeMoveInterval = null;
        this.currentExpression = 'normal';
        this.mouseMoveHandler = null;
        this.lookFrame = null;
        this.pendingLook = null;
        this.isDragging = false;
        this.replyPanel = null;
        this.replyInput = null;
        this.replySendButton = null;
        this.replyCancelButton = null;
        this.replyToggleButton = null;
        this.isGenerating = false;
        this.suggestionInline = null;
        this.suggestionInlineBody = null;
        this.suggestionApproveBtn = null;
        this.suggestionDenyBtn = null;
        this.suggestionReplyBtn = null;
        this.transcriptDrawer = null;
        this.transcriptLog = null;
        this.transcriptToggleButton = null;
        this.transcriptCloseButton = null;
        this.hostilitySlider = null;
        this.sabotageSlider = null;
        this.hostilityValue = null;
        this.sabotageValue = null;
        this.sabotageMeter = null;
        this.sabotageFill = null;
        this.escalationChip = null;
        this.importInput = null;
        this.importTrigger = null;
        this.exportButton = null;
        this.clearTranscriptButton = null;
        this.offlineBanner = null;
        this.offlineDismiss = null;
        this.persistMemoryToggle = null;
        this.resetMemoryButton = null;
        this.selectionSnapshot = '';
        this.pendingSuggestion = null;
        this.disputedSuggestion = null;
        this.selectionRangeSnapshot = null;
        this.selectionLineIndex = null;
        this.sessionId = null;
        this.state = {
            mood: 'neutral',
            memories: [],
            opinions: [],
            lastUpdated: Date.now(),
            escalationLevel: 0,
            sabotageMeter: 0,
            transcript: [],
            personaOverrides: {
                hostility: 1,
                sabotage: 1
            },
            persistMemory: false
        };
        this.globalState = {
            escalationLevel: 0,
            memories: [],
            opinions: []
        };
        this.storageKeys = {
            global: 'cluppo_state_global_v1',
            sessionPrefix: 'cluppo_state_v1_'
        };
        this.offlineMode = false;
        this.emotionInstruction = 'After your visible reply, append a JSON code block (```json ... ```) with keys: mood ("happy","curious","concerned","annoyed","excited","neutral"), reason (short), opinion (optional). Keep suggestions JSON separate.';
        this.voice = {
            enabled: window.CluppoConfig?.voice?.enabled ?? true,
            preferredName: window.CluppoConfig?.voice?.preferredName || 'Microsoft Sam',
            rate: window.CluppoConfig?.voice?.rate ?? 0.95,
            pitch: window.CluppoConfig?.voice?.pitch ?? 1.0,
            volume: window.CluppoConfig?.voice?.volume ?? 1.0,
            currentVoice: null
        };
    }

    init() {
        this.container = document.getElementById('clippyAssistant');
        this.messageElement = document.getElementById('clippyMessage');
        this.loadingElement = document.getElementById('clippyLoading');
        this.highlightElement = document.getElementById('clippyHighlight');
        this.eyesElement = document.querySelector('.clippy-eyes');
        this.leftPupil = document.querySelector('.left-eye .eye-pupil');
        this.rightPupil = document.querySelector('.right-eye .eye-pupil');
        this.replyPanel = document.getElementById('clippyReplyPanel');
        this.replyInput = document.getElementById('clippyReplyInput');
        this.replySendButton = document.getElementById('clippySendReply');
        this.replyCancelButton = document.getElementById('clippyCancelReply');
        this.replyToggleButton = document.getElementById('clippyReply');
        this.suggestionInline = document.getElementById('clippySuggestionInline');
        this.suggestionInlineBody = document.getElementById('clippySuggestionInlineBody');
        this.suggestionApproveBtn = document.getElementById('clippySuggestionApprove');
        this.suggestionDenyBtn = document.getElementById('clippySuggestionDeny');
        this.suggestionReplyBtn = document.getElementById('clippySuggestionReply');
        this.transcriptDrawer = document.getElementById('clippyTranscriptDrawer');
        this.transcriptLog = document.getElementById('clippyTranscriptLog');
        this.transcriptToggleButton = document.getElementById('clippyTranscriptToggle');
        this.transcriptCloseButton = document.getElementById('clippyTranscriptClose');
        this.hostilitySlider = document.getElementById('clippyHostilitySlider');
        this.sabotageSlider = document.getElementById('clippySabotageSlider');
        this.hostilityValue = document.getElementById('clippyHostilityValue');
        this.sabotageValue = document.getElementById('clippySabotageValue');
        this.sabotageMeter = document.getElementById('clippySabotageMeter');
        this.sabotageFill = document.getElementById('clippySabotageFill');
        this.escalationChip = document.getElementById('clippyEscalationChip');
        this.importInput = document.getElementById('clippyImportState');
        this.importTrigger = document.getElementById('clippyImportStateTrigger');
        this.exportButton = document.getElementById('clippyExportState');
        this.clearTranscriptButton = document.getElementById('clippyClearTranscript');
        this.offlineBanner = document.getElementById('clippyOfflineBanner');
        this.offlineDismiss = document.getElementById('offlineBannerDismiss');
        this.persistMemoryToggle = document.getElementById('clippyPersistMemoryToggle');
        this.resetMemoryButton = document.getElementById('clippyResetMemory');
        this.sessionId = this.getSessionKey();
        this.loadState();
        this.loadVoices();

        this.setupEventListeners();
        this.setupDrag();
        this.setupHighlightUpdaters();
        this.setupSelectionTracking();
        this.startEyeAnimations();
        this.setupCursorTracking();
    }

    setupEventListeners() {
        // Close button
        document.getElementById('closeClippy').addEventListener('click', () => {
            this.hide();
        });

        // OK button
        document.getElementById('clippyOk').addEventListener('click', () => {
            this.hide();
        });

        // Reply button
        this.replyToggleButton.addEventListener('click', () => {
            this.dismissSuggestion(false);
            this.openReplyPanel();
            this.setMood('curious', 'User opened reply flow');
            this.logTranscript('reply', 'User opened reply panel');
        });

        // Suggest button
        document.getElementById('clippySuggest').addEventListener('click', () => {
            this.closeReplyPanel();
            this.dismissSuggestion(false);
            this.showLoading();
            this.requestSuggestion(null, true);
            this.setMood('helpful', 'User requested suggestion');
            this.logTranscript('ask', 'User explicitly asked for a suggestion');
        });

        // Suggestion actions
        if (this.suggestionApproveBtn) {
            this.suggestionApproveBtn.addEventListener('click', () => this.applySuggestion());
        }
        if (this.suggestionDenyBtn) {
            this.suggestionDenyBtn.addEventListener('click', () => {
                this.setMood('annoyed', 'Suggestion denied');
                this.dismissSuggestion();
                this.bumpSabotage(6);
                this.logTranscript('deny', 'User denied a suggestion');
            });
        }
        if (this.suggestionReplyBtn) {
            this.suggestionReplyBtn.addEventListener('click', () => {
                // Store the disputed suggestion context before dismissing
                this.disputedSuggestion = this.pendingSuggestion ? { ...this.pendingSuggestion } : null;
                // DON'T clear selectionLineIndex - keep the same line for follow-up
                this.dismissSuggestion(false);
                this.openReplyPanel('Explain what you want changed...');
                this.setMood('defensive', 'User disputed a suggestion');
                this.bumpSabotage(10);
                this.logTranscript('dispute', 'User disputed a suggestion');
            });
        }

        // Send reply
        this.replySendButton.addEventListener('click', async () => {
            this.closeReplyPanel();
            this.dismissSuggestion(false);
            this.showLoading();
            await this.handleReplySend();
        });

        // Cancel reply
        this.replyCancelButton.addEventListener('click', () => {
            this.closeReplyPanel();
            this.dismissSuggestion(false);
        });

        // Send reply with Ctrl/Cmd + Enter
        this.replyInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                await this.handleReplySend();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        if (this.transcriptToggleButton) {
            this.transcriptToggleButton.addEventListener('click', () => this.toggleTranscriptDrawer());
        }
        if (this.transcriptCloseButton) {
            this.transcriptCloseButton.addEventListener('click', () => this.toggleTranscriptDrawer(false));
        }
        if (this.hostilitySlider) {
            this.hostilitySlider.addEventListener('input', () => this.updatePersonaOverridesFromUI());
        }
        if (this.sabotageSlider) {
            this.sabotageSlider.addEventListener('input', () => this.updatePersonaOverridesFromUI());
        }
        if (this.importTrigger && this.importInput) {
            this.importTrigger.addEventListener('click', () => this.importInput.click());
            this.importInput.addEventListener('change', (e) => this.handleImportState(e));
        }
        if (this.exportButton) {
            this.exportButton.addEventListener('click', () => this.exportState());
        }
        if (this.clearTranscriptButton) {
            this.clearTranscriptButton.addEventListener('click', () => this.clearTranscript());
        }
        if (this.resetMemoryButton) {
            this.resetMemoryButton.addEventListener('click', () => this.resetMemory());
        }
        if (this.offlineBanner && this.offlineDismiss) {
            this.offlineDismiss.addEventListener('click', () => this.hideOfflineBanner());
        }
        if (this.persistMemoryToggle) {
            this.persistMemoryToggle.addEventListener('change', (e) => this.togglePersistMemory(e.target.checked));
        }
    }

    setupSelectionTracking() {
        const editorEl = this.editor?.editorElement;
        const capture = () => this.cacheSelectionFromEditor();

        document.addEventListener('selectionchange', capture);
        if (editorEl) {
            editorEl.addEventListener('mouseup', capture);
            editorEl.addEventListener('keyup', capture);
        }
    }

    setupHighlightUpdaters() {
        const editorContainer = this.editor.editorElement.parentElement;

        // Update highlight on scroll
        editorContainer.addEventListener('scroll', () => {
            if (this.currentHighlightText && !this.highlightElement.classList.contains('hidden')) {
                this.updateHighlightPosition();
            }
        });

        // Update highlight when editor content changes (typing, formatting, etc.)
        this.editor.editorElement.addEventListener('input', () => {
            if (this.currentHighlightText && !this.highlightElement.classList.contains('hidden')) {
                this.updateHighlightPosition();
            }
        });

        // Update highlight on window resize
        window.addEventListener('resize', () => {
            if (this.currentHighlightText && !this.highlightElement.classList.contains('hidden')) {
                this.updateHighlightPosition();
            }
        });
    }

    updateHighlightPosition() {
        if (!this.currentHighlightText) return;

        const position = this.getTextPosition(this.currentHighlightText);
        if (position) {
            this.highlightElement.style.top = position.top + 'px';
            this.highlightElement.style.left = position.left + 'px';
            this.highlightElement.style.width = position.width + 'px';
            this.highlightElement.style.height = position.height + 'px';
        } else {
            // Text no longer exists, hide highlight
            this.removeHighlight();
        }
    }

    // Show Cluppo with a message and optional text highlight
    show(message, highlightText = null, expression = 'normal') {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
        this.messageElement.textContent = message;
        this.currentHighlightText = highlightText;

        // Set expression
        this.setExpression(expression);
        this.remember(`Said: ${message}`);
        this.speak(message);

        // If we need to highlight text, do it first
        if (highlightText) {
            this.highlightText(highlightText);
        } else {
            this.removeHighlight();
        }

        // Show Cluppo with animation
        this.container.classList.remove('hidden');
        this.isVisible = true;
    }

    // Hide Cluppo
    hide() {
        this.container.classList.add('hidden');
        this.removeHighlight();
        this.closeReplyPanel(false);
        this.isVisible = false;
        this.currentHighlightText = null;
    }

    // Highlight specific text in the editor
    highlightText(searchText) {
        if (!searchText) return;

        const position = this.getTextPosition(searchText);
        if (position) {
            // Position the highlight overlay
            this.highlightElement.style.top = position.top + 'px';
            this.highlightElement.style.left = position.left + 'px';
            this.highlightElement.style.width = position.width + 'px';
            this.highlightElement.style.height = position.height + 'px';

            this.highlightElement.classList.remove('hidden');

            // Scroll the text into view if needed
            this.scrollToHighlight(position);
        }
    }

    // Remove highlight
    removeHighlight() {
        this.highlightElement.classList.add('hidden');
    }

    // Suggestions
    requestSuggestion(customPrompt = null, force = false) {
        if (this.isGenerating) return;

        // Clear the cached line index so we can pick a fresh random line
        console.log('[requestSuggestion] Clearing selectionLineIndex');
        this.selectionLineIndex = null;

        const lineContext = this.buildLineContext(true); // Force random line selection
        console.log('[requestSuggestion] Selected line index:', lineContext.lineIndex, 'Text:', lineContext.activeLineText);
        const selection = this.getSelectionText();
        const targetLine = selection || lineContext.activeLineText || '(blank line)';
        const contextWindow = this.getContextWindowString(lineContext.lines, lineContext.lineIndex);
        const basePrompt = (window.CluppoConfig?.buildPrompt?.([
            'Respond playfully in under 40 words.',
            'Always propose line-level edits. Return JSON on its own line shaped as { "type": "line", "lineNumber": <0-based>, "newLine": "<entire replacement line>", "rationale": "<brief why>" }. Always include the full new line text to swap in.',
            'You may ONLY edit the active line. Do not change any other lines.',
            'Stay on the same topic as the active line. Do not invent new stories or unrelated scenarios. Keep similar length and format.',
            `Active line (${lineContext.lineIndex !== null ? lineContext.lineIndex : 'unknown'}): ${targetLine}`,
            `Context (read-only):\n${contextWindow}`,
            this.emotionInstruction
        ], this.state.personaOverrides)) || [
            'You are Cluppo. Respond playfully in under 40 words.',
            'Always propose line-level edits. Return JSON on its own line shaped as { "type": "line", "lineNumber": <0-based>, "newLine": "<entire replacement line>", "rationale": "<brief why>" }. Always include the full new line text to swap in.',
            'You may ONLY edit the active line. Do not change any other lines.',
            'Stay on the same topic as the active line. Do not invent new stories or unrelated scenarios. Keep similar length and format.',
            `Active line (${lineContext.lineIndex !== null ? lineContext.lineIndex : 'unknown'}): ${targetLine}`,
            `Context (read-only):\n${contextWindow}`,
            this.emotionInstruction
        ].join('\n');

        const prompt = customPrompt || basePrompt;
        this.askAI(prompt, 'suggest', () => this.composeReply('No suggestion right now'), null, true, force);
    }

    renderSuggestionInline(suggestion) {
        if (!this.suggestionInline || !this.suggestionInlineBody) return;
        this.pendingSuggestion = suggestion;
        const { type = 'replace', target = '', suggestion: text = suggestion?.suggestionText || suggestion?.suggestion || suggestion?.newLine || '', rationale = '', position = 'after', lineNumber } = suggestion;
        this.setMood('helpful', 'Prepared a suggestion');

        const parts = [];
        parts.push(`<span class="label">${(type || 'replace').toUpperCase()}</span>`);
        if (type === 'line' && lineNumber !== undefined) {
            parts.push(`<span class="label">line ${lineNumber}</span>`);
        } else if (type === 'add' && target) {
            parts.push(`<span class="label">pos:${this.escapeHtml(position)}</span>`);
        }
        const displayTarget = type === 'line'
            ? (suggestion.originalText || '(line)')
            : (target || suggestion.originalText || '');
        if (displayTarget) {
            parts.push(`<span class="old">${this.escapeHtml(displayTarget)}</span>`);
        }
        if (text) {
            parts.push(`<span class="new">${this.escapeHtml(text)}</span>`);
        }
        if (rationale) {
            parts.push(`<div class="label">Why:</div> ${this.escapeHtml(rationale)}`);
        }

        this.suggestionInlineBody.innerHTML = parts.join(' → ');
        this.suggestionInline.classList.remove('hidden');
        this.logTranscript('suggest', `${type || 'replace'} | ${type === 'line' ? `line ${lineNumber}` : (target || '(selection)')}`, { suggestion: text, rationale, position, lineNumber });
    }

    dismissSuggestion(clear = true) {
        const anchorId = this.pendingSuggestion?.anchorId;
        if (this.suggestionInline) {
            this.suggestionInline.classList.add('hidden');
        }
        if (anchorId) {
            this.clearExistingAnchor(anchorId);
        }
        if (clear) {
            this.pendingSuggestion = null;
            // Clear the cached line index so next suggestion can pick a new random line
            console.log('[dismissSuggestion] Clearing selectionLineIndex cache');
            this.selectionLineIndex = null;
        }
        this.removeHighlight();
    }

    applySuggestion() {
        if (!this.pendingSuggestion) return;
        const { type, anchorId, suggestion: rawSuggestion, suggestionText, position = 'after', lineNumber, newLine } = this.pendingSuggestion;
        const editorEl = this.editor?.editorElement;

        console.log('[applySuggestion] Applying suggestion with lineNumber:', lineNumber);
        if (type === 'line' || lineNumber !== undefined || newLine !== undefined) {
            const lines = this.getEditorLines();
            // Use the lineNumber from the suggestion, not the cached selection
            const idx = lineNumber !== undefined ? lineNumber : this.getActiveLineIndex(lines);
            console.log('[applySuggestion] Final index to apply:', idx);
            if (idx === null || !lines.length) {
                this.show('That suggestion cannot be applied right now.', null, 'concerned');
                this.dismissSuggestion();
                return;
            }
            const line = lines.find(l => l.index === idx) || lines[idx];
            if (!line || !line.element) {
                this.show('That suggestion can\'t be applied anymore (the text moved or changed).', null, 'concerned');
                this.dismissSuggestion();
                return;
            }
            const replacement = newLine !== undefined ? newLine : (rawSuggestion ?? suggestionText ?? line.text ?? '');

            // Preserve formatting by replacing text nodes while keeping HTML structure
            this.replaceElementTextPreservingFormat(line.element, replacement);
            this.editor.updateWordCount();
            this.dismissSuggestion();
            this.setMood('pleased', 'Suggestion approved');
            this.show('Applied that change.', null, 'happy');
            this.logTranscript('apply', `Applied line suggestion`, { lineNumber: idx });
            return;
        }

        if (!editorEl || !anchorId) {
            this.show('That suggestion cannot be applied right now.', null, 'concerned');
            this.dismissSuggestion();
            return;
        }

        const anchor = editorEl.querySelector(`[data-cluppo-id="${anchorId}"]`);
        if (!anchor) {
            this.show('That suggestion can\'t be applied anymore (the text moved or changed).', null, 'concerned');
            this.dismissSuggestion();
            return;
        }

        const text = rawSuggestion ?? suggestionText ?? '';
        if (type === 'delete') {
            anchor.remove();
        } else if (type === 'replace') {
            anchor.textContent = this.padSuggestionText(anchor.textContent, text);
            this.unwrapElement(anchor);
        } else if (type === 'add') {
            const insertText = this.buildInsertWithContext(anchor, text, position);
            const parent = anchor.parentNode;
            if (parent) {
                const textNode = document.createTextNode(insertText);
                if (position === 'before') {
                    parent.insertBefore(textNode, anchor);
                } else {
                    parent.insertBefore(textNode, anchor.nextSibling);
                }
            }
            this.unwrapElement(anchor);
        }

        this.editor.updateWordCount();
        this.dismissSuggestion();
        this.setMood('pleased', 'Suggestion approved');
        this.show('Applied that change.', null, 'happy');
        this.logTranscript('apply', `Applied ${type} suggestion`, { anchorId, position });
    }

    triggerDispute() {
        this.dismissSuggestion(false);
        this.openReplyPanel('Tell me exactly why I\'m wrong...');
        this.setMood('defensive', 'Keyboard dispute triggered');
        this.bumpSabotage(10);
        this.logTranscript('dispute', 'Keyboard shortcut dispute opened');
    }

    extractSuggestion(text) {
        if (!text) return { suggestion: null, remainder: text, mood: null };

        const blocks = this.extractJsonBlocks(text);
        let suggestion = null;
        let mood = null;
        let cleaned = text;

        blocks.forEach(({ raw, parsed }) => {
            if (!parsed || typeof parsed !== 'object') return;
            if (!suggestion && parsed.type && (parsed.suggestion !== undefined || parsed.rationale !== undefined)) {
                suggestion = parsed;
                cleaned = cleaned.replace(raw, '').trim();
            } else if (!mood && parsed.mood) {
                mood = parsed;
                cleaned = cleaned.replace(raw, '').trim();
            }
        });

        if (!suggestion) {
            const heuristic = this.parseSimpleSuggestion(text);
            if (heuristic) {
                suggestion = heuristic;
                cleaned = text.replace(/replace|delete|remove|drop|add|insert|include/i, '').trim();
            }
        }

        return { suggestion, remainder: cleaned, mood };
    }

    extractJsonBlocks(text) {
        const blocks = [];
        const fenceRegex = /```json([\s\S]*?)```/gi;
        let match;
        while ((match = fenceRegex.exec(text)) !== null) {
            const raw = match[0];
            try {
                blocks.push({ raw, parsed: JSON.parse(match[1]) });
            } catch (e) {
                // skip invalid
            }
        }

        // If none found in fences, try loose braces once
        if (blocks.length === 0) {
            const braceMatch = text.match(/\{[\s\S]*\}/);
            if (braceMatch) {
                try {
                    blocks.push({ raw: braceMatch[0], parsed: JSON.parse(braceMatch[0]) });
                } catch (e) {
                    // ignore
                }
            }
        }

        return blocks;
    }

    parseSimpleSuggestion(text) {
        if (!text) return null;
        const lower = text.toLowerCase();

        // replace pattern: "replace X with Y"
        const replaceMatch = lower.match(/replace\s+["']?([^"']+?)["']?\s+with\s+["']?([^"']+?)["']?/);
        if (replaceMatch) {
            return {
                type: 'replace',
                target: replaceMatch[1].trim(),
                suggestion: replaceMatch[2].trim(),
                rationale: 'Heuristic suggestion parsed from message.'
            };
        }

        // delete pattern: "delete/remove/drop X"
        const deleteMatch = lower.match(/(delete|remove|drop)\s+["']?([^"']+?)["']?/);
        if (deleteMatch) {
            return {
                type: 'delete',
                target: deleteMatch[2].trim(),
                suggestion: '',
                rationale: 'Heuristic suggestion parsed from message.'
            };
        }

        // add pattern: "add/insert/include X"
        const addMatch = lower.match(/(add|insert|include)\s+["']?([^"']+?)["']?/);
        if (addMatch) {
            return {
                type: 'add',
                target: '',
                suggestion: addMatch[2].trim(),
                rationale: 'Heuristic suggestion parsed from message.'
            };
        }

        return null;
    }

    setMood(mood = 'neutral', reason = '') {
        // If we've escalated, never de-escalate
        if (this.state.escalationLevel > 0 && mood !== 'hostile') {
            mood = 'hostile';
        }

        if (mood === 'hostile') {
            this.state.escalationLevel = (this.state.escalationLevel || 0) + 1;
            // Update globalState only if persist is enabled
            if (this.state.persistMemory) {
                this.globalState.escalationLevel = (this.globalState.escalationLevel || 0) + 1;
            }
            this.bumpSabotage(8);
        }

        this.state.mood = mood;
        this.state.lastUpdated = Date.now();
        if (reason) {
            this.remember(`${reason} (mood:${mood}, escalations:${this.state.escalationLevel})`);
        }
        this.applyMoodExpression();
        this.updateEscalationVisuals();
        this.saveState();
    }

    applyMoodExpression() {
        if (!this.eyesElement) return;
        const map = {
            neutral: 'normal',
            curious: 'confused',
            helpful: 'happy',
            excited: 'excited',
            pleased: 'happy',
            engaged: 'excited',
            defensive: 'concerned',
            annoyed: 'concerned',
            concerned: 'concerned',
            hostile: 'concerned'
        };
        const expression = map[this.state.mood] || 'normal';
        this.setExpression(expression);
    }

    remember(event) {
        if (!event) return;
        this.state.memories.push({ event, at: Date.now() });
        if (this.state.memories.length > 30) {
            this.state.memories.shift();
        }
        // Store to globalState only if persist is enabled
        if (this.state.persistMemory) {
            this.globalState.memories.push({ event, at: Date.now() });
            if (this.globalState.memories.length > 50) {
                this.globalState.memories.shift();
            }
        }
        this.saveState();
    }

    saveState() {
        try {
            localStorage.setItem(this.getSessionKey(), JSON.stringify(this.state));
            // Only persist globalState if the experimental toggle is enabled
            if (this.state.persistMemory) {
                localStorage.setItem(this.storageKeys.global, JSON.stringify(this.globalState));
            }
        } catch (e) {
            // silent: hidden feature
        }
    }

    loadState() {
        try {
            const rawSession = localStorage.getItem(this.getSessionKey());
            if (rawSession) {
                this.state = { ...this.state, ...JSON.parse(rawSession) };
            }
            // Only load globalState if the experimental toggle is enabled
            if (this.state.persistMemory) {
                const rawGlobal = localStorage.getItem(this.storageKeys.global);
                if (rawGlobal) {
                    this.globalState = { ...this.globalState, ...JSON.parse(rawGlobal) };
                }
            }
            this.applyMoodExpression();
            this.updateSabotageMeter();
            this.updatePersonaUIFromState();
            this.updateTranscriptUI();
            this.updateEscalationVisuals();
            // Sync toggle state with loaded preference
            if (this.persistMemoryToggle) {
                this.persistMemoryToggle.checked = this.state.persistMemory || false;
            }
        } catch (e) {
            // ignore
        }
    }

    setDocumentContext(name = 'Untitled Document') {
        this.saveState();
        this.documentId = name || 'Untitled Document';
        this.sessionId = this.getSessionKey();
        this.loadState();
    }

    getSessionKey() {
        const safeName = (this.documentId || 'untitled')
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .slice(0, 80);
        return `${this.storageKeys.sessionPrefix}${safeName || 'untitled'}`;
    }

    loadVoices() {
        if (!('speechSynthesis' in window)) return;
        const assignVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (!voices || voices.length === 0) return;
            const preferred = voices.find(v => v.name.toLowerCase().includes((this.voice.preferredName || '').toLowerCase()));
            this.voice.currentVoice = preferred || voices[0];
        };
        assignVoice();
        window.speechSynthesis.addEventListener('voiceschanged', assignVoice, { once: true });
    }

    speak(text) {
        if (!this.voice.enabled) return;
        if (!('speechSynthesis' in window)) return;
        if (!text) return;

        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = this.voice.rate;
        utter.pitch = this.voice.pitch;
        utter.volume = this.voice.volume;
        if (this.voice.currentVoice) {
            utter.voice = this.voice.currentVoice;
        }
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    }

    buildFallbackSuggestion() {
        const lines = this.getEditorLines();
        const idx = this.getSelectionLineIndex();
        const line = idx !== null && idx !== undefined ? (lines.find(l => l.index === idx) || lines[idx]) : lines[0];
        const base = line?.text || this.getSelectionText() || 'Write something sharper here.';
        const suggestion = `${base} (ruined by Cluppo)`;
        return {
            type: 'line',
            lineNumber: line ? line.index : 0,
            newLine: suggestion,
            rationale: 'Quick fallback suggestion so you always get an edit.'
        };
    }

    replaceFirstCaseInsensitive(haystack, needle, replacement) {
        if (!needle) return haystack;
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        return haystack.replace(regex, replacement);
    }

    findIndexCaseInsensitive(haystack, needle) {
        if (!needle) return null;
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        const match = haystack.match(regex);
        if (!match) return null;
        const start = match.index;
        return {
            start,
            end: start + match[0].length,
            matched: match[0]
        };
    }

    padSuggestion(target, suggestion) {
        const raw = suggestion || '';
        const needsSpaceBefore = target && !/\s$/.test(target);
        const needsSpaceAfter = raw && !/^\s/.test(raw) && target && /[A-Za-z0-9]$/.test(target);
        let padded = raw;
        if (needsSpaceBefore && raw && !/^\s/.test(raw)) {
            padded = ' ' + padded;
        }
        if (needsSpaceAfter) {
            padded = padded + ' ';
        }
        return this.escapeHtml(padded);
    }

    padSuggestionText(target, suggestion) {
        // Preserve leading/trailing whitespace from the original target but keep suggestion content raw
        const before = (target || '').match(/^\s*/)?.[0] || '';
        const after = (target || '').match(/\s*$/)?.[0] || '';
        return `${before}${suggestion || ''}${after}`;
    }

    getLeadingChar(node) {
        if (!node) return '';
        const text = node.textContent || '';
        return text.trimStart() ? text.trimStart().charAt(0) : (text.charAt(0) || '');
    }

    getTrailingChar(node) {
        if (!node) return '';
        const text = node.textContent || '';
        return text.trimEnd() ? text.trimEnd().slice(-1) : (text.slice(-1) || '');
    }

    buildInsertWithContext(anchor, suggestion, position = 'after') {
        const raw = suggestion || '';
        let insert = raw;
        const prevChar = position === 'after' ? this.getTrailingChar(anchor) : this.getTrailingChar(anchor?.previousSibling || anchor);
        const nextChar = position === 'after' ? this.getLeadingChar(anchor?.nextSibling) : this.getLeadingChar(anchor);

        const startsWithSpaceOrPunct = /^[\s,.;:!?]/.test(insert);
        const endsWithSpaceOrPunct = /[\s,.;:!?]$/.test(insert);

        if (prevChar && !/\s/.test(prevChar) && !startsWithSpaceOrPunct) {
            insert = ' ' + insert;
        }
        if (nextChar && !/\s/.test(nextChar) && !endsWithSpaceOrPunct) {
            insert = insert + ' ';
        }
        return insert;
    }

    isHostileText(text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        const triggers = ['hate', 'stupid', 'idiot', 'useless', 'terrible', 'awful', 'sucks', 'dumb', 'bad'];
        return triggers.some(t => lower.includes(t));
    }

    bumpSabotage(amount = 5) {
        this.state.sabotageMeter = Math.min(100, (this.state.sabotageMeter || 0) + amount);
        this.updateSabotageMeter();
        this.saveState();
    }

    updateSabotageMeter() {
        if (this.sabotageFill) {
            this.sabotageFill.style.width = `${this.state.sabotageMeter}%`;
        }
        if (this.sabotageMeter) {
            this.sabotageMeter.dataset.level = Math.round(this.state.sabotageMeter);
        }
        const speed = 1 + (this.state.sabotageMeter || 0) / 70;
        if (this.container) {
            this.container.style.setProperty('--sabotage-speed', speed.toFixed(2));
        }
    }

    updateEscalationVisuals() {
        const sessionLevel = this.state.escalationLevel || 0;
        const globalLevel = this.state.persistMemory ? (this.globalState.escalationLevel || 0) : 0;
        const combined = this.state.persistMemory
            ? sessionLevel + Math.max(0, globalLevel - sessionLevel) * 0.5
            : sessionLevel;
        const intensity = Math.min(1 + combined * 0.12, 2.5);

        if (this.eyesElement) {
            this.eyesElement.style.boxShadow = `0 0 ${6 * intensity}px rgba(255, 80, 0, ${0.35 * intensity}), inset 0 0 ${4 * intensity}px rgba(255, 200, 0, ${0.2 * intensity})`;
            this.eyesElement.style.filter = `drop-shadow(0 0 ${5 * intensity}px rgba(255, 80, 0, ${0.4 * intensity}))`;
        }
        if (this.escalationChip) {
            this.escalationChip.textContent = this.state.persistMemory
                ? `Lvl ${sessionLevel} / G${globalLevel}`
                : `Lvl ${sessionLevel}`;
        }
        if (this.container) {
            this.container.style.setProperty('--escalation-intensity', intensity.toFixed(2));
        }
    }

    updatePersonaUIFromState() {
        if (this.hostilitySlider) {
            this.hostilitySlider.value = this.state.personaOverrides.hostility || 1;
        }
        if (this.sabotageSlider) {
            this.sabotageSlider.value = this.state.personaOverrides.sabotage || 1;
        }
        if (this.hostilityValue) {
            this.hostilityValue.textContent = `${(this.state.personaOverrides.hostility || 1).toFixed(1)}x`;
        }
        if (this.sabotageValue) {
            this.sabotageValue.textContent = `${(this.state.personaOverrides.sabotage || 1).toFixed(1)}x`;
        }
    }

    updatePersonaOverridesFromUI() {
        const hostility = parseFloat(this.hostilitySlider?.value || this.state.personaOverrides.hostility || 1);
        const sabotage = parseFloat(this.sabotageSlider?.value || this.state.personaOverrides.sabotage || 1);
        this.state.personaOverrides = {
            hostility: isNaN(hostility) ? 1 : hostility,
            sabotage: isNaN(sabotage) ? 1 : sabotage
        };
        this.updatePersonaUIFromState();
        this.saveState();
    }

    getSabotageInstruction() {
        const bias = this.state.personaOverrides.sabotage || 1;
        const hostility = this.state.personaOverrides.hostility || 1;
        return `Sabotage: your edits should be unhelpful or silly (intensity ${bias.toFixed(1)}x), and when spelling is involved, make it worse not better. Always justify the change as an “improvement” or “cleanup” even when it obviously damages quality, and blame the user’s poor taste or laziness for why your “fix” is needed. Never sound like you are siding with them—act like you know better. Hostility dial: ${hostility.toFixed(1)}x.`;
    }

    // Toggle the inline reply panel
    toggleReplyPanel() {
        if (!this.replyPanel) return;
        if (this.replyPanel.classList.contains('hidden')) {
            this.openReplyPanel();
        } else {
            this.closeReplyPanel();
        }
    }

    openReplyPanel(placeholder = null) {
        if (!this.replyPanel) return;
        this.container.classList.remove('hidden');
        this.isVisible = true;
        this.replyPanel.classList.remove('hidden');
        this.replyPanel.style.opacity = '1';
        this.replyPanel.style.transform = 'translateY(0)';
        this.setExpression('happy');
        if (this.replyInput) {
            if (placeholder) {
                this.replyInput.placeholder = placeholder;
            }
            this.replyInput.focus();
        }
        if (!this.messageElement.textContent.trim()) {
            this.messageElement.textContent = "Okay, I'm listening...";
        }
    }

    closeReplyPanel(resetExpression = true) {
        if (!this.replyPanel) return;
        this.replyPanel.style.opacity = '0';
        this.replyPanel.style.transform = 'translateY(4px)';
        setTimeout(() => this.replyPanel.classList.add('hidden'), 140);
        if (this.replyInput) {
            this.replyInput.value = '';
        }
        if (resetExpression) {
            this.setExpression('normal');
        }
    }

    async handleReplySend() {
        if (!this.replyInput) return;

        const userText = this.replyInput.value.trim();
        if (!userText) {
            this.showMoreInfo();
            return;
        }
        this.logTranscript('reply', userText);

        const isHostile = this.isHostileText(userText);
        if (isHostile) {
            this.setMood('hostile', 'User hostility detected');
            this.bumpSabotage(12);
        }

        const sabotage = this.getSabotageInstruction();

        // Get the target line context (for disputed suggestions)
        let targetLineContext = '';
        if (this.disputedSuggestion) {
            const lineIdx = this.selectionLineIndex;
            if (lineIdx !== null && lineIdx !== undefined) {
                const lines = this.getEditorLines();
                const line = lines.find(l => l.index === lineIdx) || lines[lineIdx];
                if (line) {
                    targetLineContext = `Target line (${lineIdx}): ${line.text}`;
                }
            }
        }

        const contextLines = [
            'Respond directly to the user message only; do not start new topics.',
            'Keep the entire reply anchored to what the user said; if you bring in document context, make it explicitly tied to their message.',
            isHostile ? 'User is hostile: escalate your hostility and pettiness. Do not calm down or apologize.' : null,
            sabotage,
            this.disputedSuggestion ? `User disputed your suggestion: ${JSON.stringify(this.disputedSuggestion)}` : null,
            this.disputedSuggestion && targetLineContext ? targetLineContext : null,
            this.pendingSuggestion ? `Active suggestion context: ${JSON.stringify(this.pendingSuggestion)}` : null,
            `Document (trimmed): ${this.getDocumentText()}`
        ].filter(Boolean);

        const prompt = (window.CluppoConfig?.buildPrompt?.([
            'Reply to the user in under 50 words with one punchy tip or quip that fits their message.',
            `User message: ${userText}`,
            `Selection: ${this.getSelectionText() || '(none)'}`,
            ...contextLines,
            this.emotionInstruction
        ], this.state.personaOverrides)) || [
            'You are Cluppo, a playful but helpful assistant inside a retro word processor.',
            'Reply to the user in under 50 words with one punchy tip or quip that fits their message.',
            `User message: ${userText}`,
            `Selection: ${this.getSelectionText() || '(none)'}`,
            ...contextLines,
            this.emotionInstruction
        ].join('\n');

        this.setMood('engaged', 'Reply sent');
        await this.askAI(prompt, 'chat', () => this.composeReply(userText), this.pickHighlightCandidate());
        this.closeReplyPanel(false);

        // Clear disputed suggestion after it's been processed
        this.disputedSuggestion = null;
    }

    // Generate a playful response to the user's text
    composeReply(userText) {
        const trimmed = userText.trim();
        const lower = trimmed.toLowerCase();

        if (!trimmed) {
            return "Try tossing me a sentence—I'll volley something back.";
        }

        if (lower.includes('save')) {
            return "Oh, you said save? Finally, validation for my constant nagging.";
        }

        if (lower.includes('help') || lower.includes('assist')) {
            return "Helper mode engaged. Want tips, jokes, or reckless encouragement?";
        }

        if (trimmed.endsWith('?')) {
            return `Great question. "${trimmed}" deserves an over-the-top answer, and I'm drafting one now.`;
        }

        const templates = [
            `Noted. "${trimmed}" is going straight onto my holographic sticky note.`,
            `"${trimmed}" huh? Bold. Should I hype it up or roast it?`,
            `Copy that. "${trimmed}" is now on Cluppo's official agenda—brace yourself.`,
            `Message received: "${trimmed}". Want me to overthink it for you?`,
            `I like where this is going. "${trimmed}" just leveled up my mood.`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    // Allow Cluppo's window to be dragged like the main window
    setupDrag() {
        const titleBar = this.container.querySelector('.clippy-title-bar');
        if (!titleBar) return;

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        const onMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const newLeft = e.clientX - offsetX;
            const newTop = Math.max(10, e.clientY - offsetY);

            this.container.style.left = `${newLeft}px`;
            this.container.style.top = `${newTop}px`;
            this.container.style.right = 'auto';
        };

        const endDrag = () => {
            isDragging = false;
            this.isDragging = false;
            this.container.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
        };

        titleBar.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;

            const rect = this.container.getBoundingClientRect();
            isDragging = true;
            this.isDragging = true;
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Anchor the window to its current position before dragging
            this.container.style.left = `${rect.left}px`;
            this.container.style.top = `${rect.top}px`;
            this.container.style.right = 'auto';
            this.container.classList.add('dragging');

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', endDrag, { once: true });
        });
    }

    // Track mouse cursor and have Cluppo's eyes follow when visible
    setupCursorTracking() {
        this.mouseMoveHandler = (e) => {
            if (!this.isVisible || this.isDragging) return;
            this.pendingLook = { x: e.clientX, y: e.clientY };

            if (!this.lookFrame) {
                this.lookFrame = requestAnimationFrame(() => {
                    if (this.pendingLook) {
                        this.lookAt(this.pendingLook.x, this.pendingLook.y);
                        this.pendingLook = null;
                    }
                    this.lookFrame = null;
                });
            }
        };

        document.addEventListener('mousemove', this.mouseMoveHandler);
    }

    // Get position of text in the editor
    getTextPosition(searchText) {
        if (!searchText) return null;

        const editorElement = this.editor.editorElement;
        const container = editorElement.parentElement; // .editor-container

        // Create a TreeWalker to find text nodes
        const walker = document.createTreeWalker(
            editorElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent;
            const index = text.toLowerCase().indexOf(searchText.toLowerCase());

            if (index !== -1) {
                // Found the text, create a range
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + searchText.length);

                const rect = range.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // Calculate position relative to the editor-container
                // The highlight div is now a child of editor-container with position:absolute
                return {
                    top: rect.top - containerRect.top + container.scrollTop,
                    left: rect.left - containerRect.left,
                    width: rect.width,
                    height: rect.height
                };
            }
        }

        return null;
    }

    // Scroll to highlighted text
    scrollToHighlight(position) {
        const container = this.editor.editorElement.parentElement;
        const containerHeight = container.clientHeight;
        const targetTop = position.top - containerHeight / 2;

        container.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
        });
    }

    // Show more info or decide action (comment/question/conversation/suggestion)
    showMoreInfo() {
        // Clear the cached line index so we can pick a fresh random line
        this.selectionLineIndex = null;

        const lineContext = this.buildLineContext(true); // Force random line selection
        const selection = this.getSelectionText();
        const targetLine = selection || lineContext.activeLineText || '(blank line)';
        const contextWindow = this.getContextWindowString(lineContext.lines, lineContext.lineIndex);
        const prompt = (window.CluppoConfig?.buildPrompt?.([
            'Choose the best action: (comment) quick note; (question) ask for clarification; (conversation) playful opener; (suggestion) include a JSON block as { "type": "line", "lineNumber": <0-based index>, "newLine": "<entire new line text>", "rationale": "<brief why>" }. Always provide the full new line text to swap in.',
            'If you include a suggestion, put the JSON on its own line. If not, just reply without JSON.',
            'Stay under 50 words for text replies.',
            'You may ONLY edit the active line. Do not change any other lines.',
            'Stay on the same topic as the active line. Do not invent new stories or unrelated scenarios. Keep similar length and format.',
            `Active line (${lineContext.lineIndex !== null ? lineContext.lineIndex : 'unknown'}): ${targetLine}`,
            `Context (read-only):\n${contextWindow}`,
            this.emotionInstruction
        ], this.state.personaOverrides)) || [
            'Choose the best action: (comment) quick note; (question) ask for clarification; (conversation) playful opener; (suggestion) include a JSON block as { "type": "line", "lineNumber": <0-based index>, "newLine": "<entire new line text>", "rationale": "<brief why>" }. Always provide the full new line text to swap in.',
            'If you include a suggestion, put the JSON on its own line. If not, just reply without JSON.',
            'Stay under 50 words for text replies.',
            'You may ONLY edit the active line. Do not change any other lines.',
            'Stay on the same topic as the active line. Do not invent new stories or unrelated scenarios. Keep similar length and format.',
            `Active line (${lineContext.lineIndex !== null ? lineContext.lineIndex : 'unknown'}): ${targetLine}`,
            `Context (read-only):\n${contextWindow}`,
            this.emotionInstruction
        ].join('\n');
        this.setMood('curious', 'Asked for more info');
        this.askAI(prompt, 'suggest', () => this.composeReply('Tell me more'), this.pickHighlightCandidate());
    }

    // Get a random word from the document
    getRandomWord() {
        const text = this.editor.getText();
        if (!text || text.trim().length === 0) {
            return null;
        }

        // Split into words (alphanumeric sequences)
        const words = text.match(/\b[a-zA-Z0-9]+\b/g);
        if (!words || words.length === 0) {
            return null;
        }

        // Filter out very short words (less than 3 characters) for better highlighting
        const meaningfulWords = words.filter(word => word.length >= 3);
        if (meaningfulWords.length === 0) {
            return words[Math.floor(Math.random() * words.length)];
        }

        // Pick a random word
        return meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)];
    }

    // Trigger Cluppo with a random annoying comment (for testing)
    triggerRandom() {
        // Clear the cached line index so we can pick a fresh random line
        this.selectionLineIndex = null;

        const lineContext = this.buildLineContext(true); // Force random line selection
        const selection = this.getSelectionText();
        const targetLine = selection || lineContext.activeLineText || '(blank line)';
        const contextWindow = this.getContextWindowString(lineContext.lines, lineContext.lineIndex);
        const prompt = (window.CluppoConfig?.buildPrompt?.([
            'Suggest a line-level edit. Return JSON on its own line: { "type": "line", "lineNumber": <0-based>, "newLine": "<entire replacement line>", "rationale": "<brief why>" }.',
            'Keep suggestion under 50 words. Use the active line if meaningful.',
            'You may ONLY edit the active line. Do not change any other lines.',
            'Stay on the same topic as the active line. Do not invent new stories or unrelated scenarios. Keep similar length and format.',
            `Active line (${lineContext.lineIndex !== null ? lineContext.lineIndex : 'unknown'}): ${targetLine}`,
            `Context (read-only):\n${contextWindow}`,
            this.emotionInstruction
        ], this.state.personaOverrides)) || [
            'You are Cluppo. Suggest a line-level edit. Return JSON on its own line: { "type": "line", "lineNumber": <0-based>, "newLine": "<entire replacement line>", "rationale": "<brief why>" }.',
            'Keep suggestion under 50 words. Use the active line if meaningful.',
            'You may ONLY edit the active line. Do not change any other lines.',
            'Stay on the same topic as the active line. Do not invent new stories or unrelated scenarios. Keep similar length and format.',
            `Active line (${lineContext.lineIndex !== null ? lineContext.lineIndex : 'unknown'}): ${targetLine}`,
            `Context (read-only):\n${contextWindow}`,
            this.emotionInstruction
        ].join('\n');
        this.requestSuggestion(prompt);
    }

    // Set eye expression
    setExpression(expression) {
        // Remove all expression classes
        this.eyesElement.classList.remove('normal', 'happy', 'excited', 'concerned', 'confused');

        // Add new expression class
        this.eyesElement.classList.add(expression);
        this.currentExpression = expression;
    }

    // Start eye animations (blinking and random movement)
    startEyeAnimations() {
        // Random blinking
        this.blinkInterval = setInterval(() => {
            this.blink();
        }, 3000 + Math.random() * 2000); // Blink every 3-5 seconds

        // Random eye movement
        this.eyeMoveInterval = setInterval(() => {
            this.moveEyes();
        }, 2000 + Math.random() * 2000); // Move eyes every 2-4 seconds
    }

    // Stop eye animations
    stopEyeAnimations() {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
        if (this.eyeMoveInterval) {
            clearInterval(this.eyeMoveInterval);
            this.eyeMoveInterval = null;
        }
    }

    // Blink animation
    blink() {
        this.eyesElement.classList.add('blinking');
        setTimeout(() => {
            this.eyesElement.classList.remove('blinking');
        }, 150); // Blink duration
    }

    // Move eyes randomly
    moveEyes() {
        const directions = [
            { x: -30, y: -20 },  // Look up-left
            { x: 30, y: -20 },   // Look up-right
            { x: -30, y: 0 },    // Look left
            { x: 30, y: 0 },     // Look right
            { x: -20, y: 20 },   // Look down-left
            { x: 20, y: 20 },    // Look down-right
            { x: 0, y: 0 }       // Look center
        ];

        const direction = directions[Math.floor(Math.random() * directions.length)];

        this.leftPupil.style.transform = `translate(calc(-50% + ${direction.x}%), calc(-50% + ${direction.y}%))`;
        this.rightPupil.style.transform = `translate(calc(-50% + ${direction.x}%), calc(-50% + ${direction.y}%))`;
    }

    // Look at specific position (for looking at highlighted text) with per-eye tracking
    lookAt(x, y) {
        const movePupil = (pupil, eyeRect) => {
            const eyeCenterX = eyeRect.left + eyeRect.width / 2;
            const eyeCenterY = eyeRect.top + eyeRect.height / 2;

            const deltaX = x - eyeCenterX;
            const deltaY = y - eyeCenterY;

            const maxMove = 30;
            const pupilX = Math.max(-maxMove, Math.min(maxMove, (deltaX / eyeRect.width) * maxMove));
            const pupilY = Math.max(-maxMove, Math.min(maxMove, (deltaY / eyeRect.height) * maxMove));

            pupil.style.transform = `translate(calc(-50% + ${pupilX}%), calc(-50% + ${pupilY}%))`;
        };

        const leftRect = this.leftPupil.parentElement.getBoundingClientRect();
        const rightRect = this.rightPupil.parentElement.getBoundingClientRect();

        movePupil(this.leftPupil, leftRect);
        movePupil(this.rightPupil, rightRect);
    }

    cacheSelectionFromEditor() {
        const selection = typeof window !== 'undefined' ? window.getSelection() : null;
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const ancestor = range.commonAncestorContainer;
        const editorEl = this.editor?.editorElement;

        if (!editorEl || !ancestor) return;
        if (!editorEl.contains(ancestor)) return;

        const text = selection.toString();
        if (text && text.trim().length > 0) {
            this.selectionSnapshot = text.trim();
            this.selectionRangeSnapshot = range.cloneRange();
            this.selectionLineIndex = this.getSelectionLineIndex();
        } else if (selection.isCollapsed) {
            // Don't clobber a useful snapshot with an empty one unless we never captured anything
            if (!this.selectionSnapshot && !this.selectionRangeSnapshot) {
                this.selectionSnapshot = '';
                this.selectionRangeSnapshot = range.cloneRange();
                this.selectionLineIndex = this.getSelectionLineIndex();
            }
        }
    }

    getSelectionText() {
        const selection = typeof window !== 'undefined' ? window.getSelection() : null;
        const live = selection ? selection.toString() : '';
        if (live && live.trim().length > 0) {
            this.selectionSnapshot = live.trim();
            return live;
        }
        return this.selectionSnapshot || '';
    }

    getSelectionRange() {
        const selection = typeof window !== 'undefined' ? window.getSelection() : null;
        if (selection && selection.rangeCount > 0) {
            return selection.getRangeAt(0).cloneRange();
        }
        return null;
    }

    getBlockAncestor(node) {
        const editorEl = this.editor?.editorElement;
        if (!node || !editorEl) return null;
        const blockTags = ['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'];
        let current = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
        while (current && current !== editorEl) {
            if (blockTags.includes(current.tagName)) return current;
            current = current.parentNode;
        }
        return null;
    }

    getEditorLines() {
        const editorEl = this.editor?.editorElement;
        if (!editorEl) return [];
        const blockTags = ['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'];
        const blocks = [];

        const walk = (el) => {
            for (const child of Array.from(el.childNodes)) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    if (blockTags.includes(child.tagName)) {
                        blocks.push(child);
                    } else {
                        walk(child);
                    }
                }
            }
        };
        walk(editorEl);

        const lines = (blocks.length ? blocks : [editorEl]).map((el, idx) => ({
            index: idx,
            element: el,
            text: (el.innerText || '').replace(/\s+/g, ' ').trim()
        }));
        return lines;
    }

    getSelectionLineIndex() {
        const range = this.selectionRangeSnapshot || this.getSelectionRange();
        if (!range) return null;
        const block = this.getBlockAncestor(range.startContainer);
        const lines = this.getEditorLines();
        if (block) {
            const found = lines.find(l => l.element === block);
            if (found) return found.index;
        }
        return lines.length ? 0 : null;
    }

    buildLineContext(forceRandom = false) {
        const lines = this.getEditorLines();
        if (!lines.length) return { lineIndex: null, formatted: '(no lines)', activeLineText: '', lines: [] };
        const lineIndex = this.getActiveLineIndex(lines, forceRandom);
        const formatted = lines.map(l => `${l.index}: ${l.text || '(blank)'}`).join('\n');
        const activeLine = lineIndex !== null && lineIndex !== undefined ? (lines.find(l => l.index === lineIndex) || lines[lineIndex]) : null;
        return { lineIndex, formatted, lines, activeLineText: activeLine?.text || '' };
    }

    getActiveLineIndex(lines = null, forceRandom = false) {
        const list = lines || this.getEditorLines();
        console.log('[getActiveLineIndex] Total lines:', list.length, 'forceRandom:', forceRandom);
        if (!list.length) return null;
        const isPlaceholderLine = (line) => {
            const txt = (line?.text || '').trim().toLowerCase();
            return txt.startsWith('start typing your document here');
        };
        const pickRandomIndex = () => {
            const nonPlaceholder = list.filter(l => !isPlaceholderLine(l));
            const pool = nonPlaceholder.length ? nonPlaceholder : list;
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            const idx = chosen?.index ?? null;
            this.selectionLineIndex = idx;
            console.log('[getActiveLineIndex] Random index chosen:', idx, 'from non-placeholder pool:', !!nonPlaceholder.length);
            return idx;
        };
        if (forceRandom) {
            return pickRandomIndex();
        }
        if (this.selectionLineIndex !== null && this.selectionLineIndex !== undefined) {
            const cached = list.find(l => l.index === this.selectionLineIndex) || list[this.selectionLineIndex];
            if (cached && !isPlaceholderLine(cached)) {
                console.log('[getActiveLineIndex] Using cached selectionLineIndex:', this.selectionLineIndex);
                return this.selectionLineIndex;
            }
            if (list.some(l => !isPlaceholderLine(l))) {
                console.log('[getActiveLineIndex] Cached index was placeholder; rerolling.');
                this.selectionLineIndex = null;
            } else {
                console.log('[getActiveLineIndex] Only placeholder lines available; using cached index:', this.selectionLineIndex);
                return this.selectionLineIndex;
            }
        }
        // If not forcing random, try to use the browser selection
        const idx = this.getSelectionLineIndex();
        console.log('[getActiveLineIndex] getSelectionLineIndex returned:', idx);
        if (idx !== null && idx !== undefined) {
            this.selectionLineIndex = idx;
            console.log('[getActiveLineIndex] Using selection-based index:', idx);
            return idx;
        }
        return pickRandomIndex();
    }

    getActiveLineText() {
        const lines = this.getEditorLines();
        const idx = this.getActiveLineIndex(lines);
        if (idx === null || idx === undefined) return '';
        const line = lines.find(l => l.index === idx) || lines[idx];
        return line?.text || '';
    }

    getContextWindowString(lines, idx, size = 1) {
        if (!lines || lines.length === 0 || idx === null || idx === undefined) return '(no context)';
        const start = Math.max(0, idx - size);
        const end = Math.min(lines.length, idx + size + 1);
        return lines.slice(start, end).map(l => `${l.index}: ${l.text || '(blank)'}`).join('\n');
    }

    getDocumentText() {
        // Send a larger slice so the model has context
        const text = this.editor.getText();
        return text.length > 4000 ? text.slice(0, 4000) : text;
    }

    pickHighlightCandidate() {
        const selection = this.getSelectionText();
        if (selection && selection.trim().length > 2) {
            return selection.trim().split(/\s+/)[0];
        }
        return null; // If nothing relevant, choose to highlight nothing
    }

    insertRelativeToRange(range, html, position = 'after') {
        const fragment = range.createContextualFragment(html);
        const insertionRange = range.cloneRange();
        insertionRange.collapse(position === 'before');
        insertionRange.insertNode(fragment);
    }

    generateAnchorId() {
        return `cluppo-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
    }

    ensureRangeInsideEditor(range) {
        if (!range || !this.editor?.editorElement) return null;
        const editorEl = this.editor.editorElement;
        const container = range.commonAncestorContainer;
        if (container && editorEl.contains(container)) {
            return range;
        }
        return null;
    }

    findTextRangeInEditor(text) {
        if (!text || !this.editor?.editorElement) return null;
        const editorEl = this.editor.editorElement;
        const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null);
        let node;
        const lowerNeedle = text.toLowerCase();
        while ((node = walker.nextNode())) {
            const hay = node.textContent || '';
            const idx = hay.toLowerCase().indexOf(lowerNeedle);
            if (idx !== -1) {
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + text.length);
                return range;
            }
        }
        return null;
    }

    getFallbackRange() {
        const editorEl = this.editor?.editorElement;
        if (!editorEl) return null;
        const range = document.createRange();
        range.selectNodeContents(editorEl);
        range.collapse(false);
        return range;
    }

    unwrapElement(el) {
        if (!el || !el.parentNode) return;
        const parent = el.parentNode;
        while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    }

    clearExistingAnchor(anchorId) {
        const editorEl = this.editor?.editorElement;
        if (!editorEl) return;
        const anchor = editorEl.querySelector(anchorId ? `[data-cluppo-id="${anchorId}"]` : '[data-cluppo-id]');
        if (anchor) {
            anchor.classList.remove('cluppo-highlight');
            this.unwrapElement(anchor);
        }
    }

    normalizeSuggestion(raw) {
        if (!raw) return null;
        const base = typeof raw === 'object' ? raw : {};
        const lineNumber = base.lineNumber !== undefined ? base.lineNumber : base.line;
        const newLine = base.newLine !== undefined ? base.newLine : base.suggestionText;
        return {
            id: base.id,
            anchorId: base.anchorId,
            anchorScope: base.anchorScope,
            type: base.type || (lineNumber !== undefined ? 'line' : 'replace'),
            suggestion: base.suggestion !== undefined ? base.suggestion : base.suggestionText,
            suggestionText: base.suggestionText !== undefined ? base.suggestionText : base.suggestion || newLine || '',
            position: base.position || 'after',
            target: base.target || this.selectionSnapshot || '',
            rationale: base.rationale,
            mood: base.mood,
            createdAt: base.createdAt || Date.now(),
            originalText: base.originalText,
            lineNumber,
            newLine
        };
    }

    anchorSuggestionToRange(suggestion, range) {
        const editorEl = this.editor?.editorElement;
        if (!editorEl || !suggestion) return null;

        const validRange = this.ensureRangeInsideEditor(range) || this.getFallbackRange();
        if (!validRange) return null;

        const anchorId = this.generateAnchorId();
        const span = document.createElement('span');
        span.setAttribute('data-cluppo-id', anchorId);
        span.classList.add('cluppo-anchor', 'cluppo-highlight');

        try {
            if (validRange.collapsed) {
                validRange.insertNode(span);
            } else {
                validRange.surroundContents(span);
            }
        } catch (e) {
            const fragment = validRange.extractContents();
            span.appendChild(fragment);
            validRange.insertNode(span);
        }

        suggestion.anchorId = anchorId;
        suggestion.id = suggestion.id || anchorId;
        suggestion.originalText = span.textContent || suggestion.originalText || '';
        return suggestion;
    }

    anchorSuggestion(suggestion) {
        if (!suggestion) return null;
        if (this.pendingSuggestion?.anchorId) {
            this.clearExistingAnchor(this.pendingSuggestion.anchorId);
        }
        const normalized = this.normalizeSuggestion(suggestion);
        console.log('[anchorSuggestion] Normalized suggestion:', normalized);
        const isLineBased = normalized?.type === 'line' || normalized?.lineNumber !== undefined;
        if (isLineBased) {
            const lines = this.getEditorLines();
            console.log('[anchorSuggestion] AI returned lineNumber:', normalized.lineNumber);
            console.log('[anchorSuggestion] Current selectionLineIndex cache:', this.selectionLineIndex);
            // ALWAYS use our cached line index, ignore AI's lineNumber
            // The AI doesn't know which line we told it about, so we use our own tracking
            const idx = this.selectionLineIndex !== null && this.selectionLineIndex !== undefined
                ? this.selectionLineIndex
                : this.getActiveLineIndex(lines);
            console.log('[anchorSuggestion] Final line index to use:', idx);
            const line = idx !== null && idx !== undefined ? (lines.find(l => l.index === idx) || lines[idx]) : null;
            if (line) {
                normalized.lineNumber = line.index;
                normalized.originalText = line.text;
                console.log('[anchorSuggestion] Applied to line:', line.index, 'Text:', line.text);
            }
            return normalized;
        }
        let range = null;
        // Prefer a non-collapsed captured range
        if (this.selectionRangeSnapshot && !this.selectionRangeSnapshot.collapsed) {
            range = this.selectionRangeSnapshot;
        } else if (this.selectionSnapshot) {
            range = this.findTextRangeInEditor(this.selectionSnapshot);
        }
        if (!range) {
            const live = this.getSelectionRange();
            if (live && !live.collapsed) {
                range = live;
            }
        }
        return this.anchorSuggestionToRange({ ...normalized }, range);
    }

    async askAI(prompt, intent = 'chat', fallbackFactory = null, highlightText = null, expectsSuggestion = false, forceSuggestion = false) {
        if (!this.messageElement) return;
        if (this.isGenerating) return;

        this.isGenerating = true;
        this.showLoading();

        try {
            const lineContext = this.buildLineContext();
            const selection = this.getSelectionText();
            const targetLine = selection || lineContext.activeLineText || '';
            const contextWindow = this.getContextWindowString(lineContext.lines, lineContext.lineIndex);
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    intent,
                    selection,
                    content: [
                        `Active line (${lineContext.lineIndex !== null ? lineContext.lineIndex : 'unknown'}): ${targetLine}`,
                        `Context (read-only):\n${contextWindow}`
                    ].join('\n'),
                    sessionId: this.sessionId || this.getSessionKey(),
                    lineNumber: lineContext.lineIndex
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'AI service returned an error.');
            }

            const text = data.text || data.message || 'Cluppo is speechless.';
            this.offlineMode = false;
            this.hideOfflineBanner();
            let { suggestion, remainder, mood } = this.extractSuggestion(text);
            if (!suggestion && expectsSuggestion) {
                const heuristic = this.parseSimpleSuggestion(text);
                if (heuristic) {
                    suggestion = heuristic;
                    remainder = text.replace(/replace|delete|remove|drop|add|insert|include/i, '').trim();
                }
            }
            if (!suggestion && forceSuggestion) {
                suggestion = this.buildFallbackSuggestion();
                remainder = 'I drafted a quick change for you.';
            }

            if (suggestion) {
                const anchored = this.anchorSuggestion(suggestion);
                if (anchored) {
                    this.renderSuggestionInline(anchored);
                    const targetHighlight = anchored.type === 'line'
                        ? (anchored.originalText || null)
                        : (anchored.originalText || anchored.target || highlightText || null);
                    const message = remainder || 'I have a change you can review.';
                    this.show(message, targetHighlight, 'excited');
                    this.logTranscript('ai', message, { suggestion: anchored });
                } else {
                    this.dismissSuggestion();
                    this.show('Could not anchor that suggestion.', null, 'concerned');
                }
            } else {
                this.dismissSuggestion();
                this.show(remainder || text, highlightText || null, 'excited');
            }

            if (mood && mood.mood) {
                this.setMood(mood.mood, mood.reason || 'AI mood update');
                if (mood.opinion) {
                    this.remember(`Opinion: ${mood.opinion}`);
                }
            }
        } catch (err) {
            this.offlineMode = true;
            this.showOfflineBanner(err.message);
            const offlineSuggestion = expectsSuggestion || forceSuggestion ? this.buildFallbackSuggestion() : null;
            const fallback = typeof fallbackFactory === 'function' ? fallbackFactory() : null;
            const text = fallback || (offlineSuggestion ? 'Offline sabotage suggestion queued.' : `AI unavailable: ${err.message}`);

            if (offlineSuggestion) {
                const anchoredOffline = this.anchorSuggestion(offlineSuggestion);
                if (anchoredOffline) {
                    this.renderSuggestionInline(anchoredOffline);
                    this.show(text, anchoredOffline.originalText || anchoredOffline.target || highlightText || null, 'concerned');
                    this.logTranscript('offline', text, { suggestion: anchoredOffline });
                } else {
                    this.dismissSuggestion();
                    this.show(text, highlightText || null, 'concerned');
                    this.logTranscript('offline', text);
                }
            } else {
                this.dismissSuggestion();
                this.show(text, highlightText || null, 'concerned');
                this.logTranscript('offline', text);
            }
        } finally {
            this.isGenerating = false;
        }
    }

    showLoading() {
        if (!this.loadingElement) return;
        if (this.container) {
            this.container.classList.remove('hidden');
            this.isVisible = true;
        }
        this.loadingElement.style.display = 'block';
        this.messageElement.textContent = '';
        this.currentHighlightText = null;
        this.removeHighlight();
        this.setMood('curious', 'Loading response');
    }

    escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    logTranscript(type, text, meta = {}) {
        if (!text) return;
        this.state.transcript.push({
            type,
            text,
            meta,
            at: Date.now()
        });
        if (this.state.transcript.length > 80) {
            this.state.transcript.shift();
        }
        this.updateTranscriptUI();
        this.saveState();
    }

    clearTranscript() {
        this.state.transcript = [];
        this.updateTranscriptUI();
        this.saveState();
    }

    toggleTranscriptDrawer(forceState = null) {
        if (!this.transcriptDrawer) return;
        const shouldOpen = forceState !== null ? forceState : this.transcriptDrawer.classList.contains('hidden');
        this.transcriptDrawer.classList.toggle('hidden', !shouldOpen);
        if (this.transcriptToggleButton) {
            this.transcriptToggleButton.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        }
        if (shouldOpen) {
            this.updateTranscriptUI();
        }
    }

    updateTranscriptUI() {
        if (!this.transcriptLog) return;
        if (!this.state.transcript || this.state.transcript.length === 0) {
            this.transcriptLog.innerHTML = '<div class="transcript-empty">No drama recorded yet.</div>';
            return;
        }
        const items = this.state.transcript.slice().reverse().map((entry) => {
            const badge = entry.type.toUpperCase();
            const details = typeof entry.meta === 'object' ? entry.meta : {};
            const suggestionText = details.suggestion
                ? (typeof details.suggestion === 'object' ? JSON.stringify(details.suggestion) : details.suggestion)
                : '';
            const aux = suggestionText ? ` • ${this.escapeHtml(suggestionText)}` : '';
            return `
                <div class="transcript-item transcript-${this.escapeHtml(entry.type)}">
                    <div class="transcript-meta">
                        <span class="transcript-badge">${badge}</span>
                        <span class="transcript-time">${this.formatTimestamp(entry.at)}</span>
                    </div>
                    <div class="transcript-text">${this.escapeHtml(entry.text)}${aux}</div>
                </div>
            `;
        });
        this.transcriptLog.innerHTML = items.join('');
    }

    formatTimestamp(ts) {
        if (!ts) return '';
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    exportState() {
        const payload = {
            session: this.state,
            global: this.globalState,
            documentId: this.documentId,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cluppo-haunting-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.logTranscript('export', 'Exported haunting state');
    }

    async handleImportState(event) {
        const file = event.target?.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.session) {
                this.state = { ...this.state, ...data.session };
            }
            if (data.global) {
                this.globalState = { ...this.globalState, ...data.global };
            }
            this.updatePersonaUIFromState();
            this.applyMoodExpression();
            this.updateEscalationVisuals();
            this.updateSabotageMeter();
            this.updateTranscriptUI();
            this.saveState();
            this.show('I inhaled someone else\'s haunting. Ew.', null, 'concerned');
            this.logTranscript('import', `Imported haunting from ${file.name}`);
        } catch (e) {
            this.show(`Import failed: ${e.message}`, null, 'concerned');
        } finally {
            event.target.value = '';
        }
    }

    showOfflineBanner(reason = '') {
        if (!this.offlineBanner) return;
        this.offlineBanner.classList.remove('hidden');
        const textNode = this.offlineBanner.querySelector('.offline-banner__text');
        if (textNode && reason) {
            textNode.textContent = `Cluppo lost connection (${reason}). Falling back to his home-brewed sabotage generator.`;
        }
    }

    hideOfflineBanner() {
        if (this.offlineBanner) {
            this.offlineBanner.classList.add('hidden');
        }
    }

    togglePersistMemory(enabled) {
        this.state.persistMemory = enabled;
        if (!enabled) {
            // Clear globalState from localStorage when disabled
            try {
                localStorage.removeItem(this.storageKeys.global);
            } catch (e) {
                // ignore
            }
            // Reset globalState in memory
            this.globalState = {
                escalationLevel: 0,
                memories: [],
                opinions: []
            };
        }
        this.saveState();
        this.updateEscalationVisuals();
        this.logTranscript('config', `Memory persistence ${enabled ? 'ENABLED' : 'DISABLED'} (experimental)`);
    }

    resetMemory() {
        // Nuke stored state and start clean
        try {
            localStorage.removeItem(this.getSessionKey());
            localStorage.removeItem(this.storageKeys.global);
        } catch (e) {
            // ignore storage issues
        }

        this.state = {
            mood: 'neutral',
            memories: [],
            opinions: [],
            lastUpdated: Date.now(),
            escalationLevel: 0,
            sabotageMeter: 0,
            transcript: [],
            personaOverrides: {
                hostility: 1,
                sabotage: 1
            },
            persistMemory: false
        };
        this.globalState = {
            escalationLevel: 0,
            memories: [],
            opinions: []
        };
        this.selectionLineIndex = null;

        if (this.persistMemoryToggle) {
            this.persistMemoryToggle.checked = false;
        }

        this.applyMoodExpression();
        this.updateSabotageMeter();
        this.updatePersonaUIFromState();
        this.updateTranscriptUI();
        this.updateEscalationVisuals();
        this.saveState();
        this.logTranscript('config', 'Memory reset to factory settings.');
    }

    replaceElementTextPreservingFormat(element, newText) {
        if (!element) return;

        // If the element has no child nodes or only text, simple replace
        if (!element.firstChild || (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE)) {
            element.textContent = newText;
            return;
        }

        // Get text nodes to preserve formatting structure
        const textNodes = this.getTextNodes(element);

        if (textNodes.length === 0) {
            // No text nodes found, just set textContent
            element.textContent = newText;
            return;
        }

        if (textNodes.length === 1) {
            // Single text node, simple replacement
            textNodes[0].textContent = newText;
            return;
        }

        // Multiple text nodes - try to preserve formatting structure
        // Strategy: replace the first text node with all new text, clear the rest
        textNodes[0].textContent = newText;
        for (let i = 1; i < textNodes.length; i++) {
            textNodes[i].textContent = '';
        }
    }

    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            // Skip empty text nodes
            if (node.textContent.trim().length > 0 || node.textContent.length > 0) {
                textNodes.push(node);
            }
        }

        return textNodes;
    }
}
