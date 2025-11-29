# AI Powered Word Processing for Maximum Productivity

A fully functional, lightweight word processor that runs in your browser. No installation required - just open and start typing!

## Features

### Text Formatting
- **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~
- 7 font families (Arial, Georgia, Times New Roman, etc.)
- 7 font sizes (8pt to 36pt)
- Text color and highlight color
- Headings (H1-H6)

### Paragraph Formatting
- Text alignment (left, center, right, justify)
- Numbered lists
- Bulleted lists
- Increase/decrease indentation

### Document Operations
- New document
- Save to browser storage
- Load from browser storage or file
- Export to HTML, TXT, or PDF
- Print functionality
- Auto-save every 30 seconds
- Word and character count

### Keyboard Shortcuts
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + S` - Save document
- `Ctrl/Cmd + N` - New document
- `Ctrl/Cmd + O` - Open document
- `Ctrl/Cmd + P` - Print
- `Tab` - Increase indent
- `Shift + Tab` - Decrease indent

## How to Use

### Local Usage (No Server Required)

1. Simply open `index.html` in your web browser
2. Start typing!

### Using a Local Server

For better performance and to avoid CORS issues:

```bash
# Using Python 3
cd word-processor
python3 -m http.server 8000

# Then open http://localhost:8000 in your browser
```

```bash
# Using Node.js (with http-server)
npm install -g http-server
cd word-processor
http-server -p 8000

# Then open http://localhost:8000 in your browser
```

### Deploying to a Server

Simply upload all files to your web server. The application is completely static and requires no backend processing.

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Core features supported

## Storage

Documents are saved to your browser's localStorage. This means:
- Documents persist between sessions
- Documents are private to your browser
- No data is sent to any server
- Clear your browser data = lose saved documents (export important docs!)

## Export Formats

- **HTML**: Full formatting preserved
- **Plain Text**: Formatting removed, plain text only
- **PDF**: Basic text export (requires internet for jsPDF library)

## Project Structure

```
word-processor/
├── index.html          # Main entry point
├── css/
│   ├── main.css       # Core styles
│   ├── toolbar.css    # Toolbar styling
│   └── editor.css     # Editor area styling
├── js/
│   ├── app.js         # Main application logic
│   ├── editor.js      # Editor functionality
│   ├── toolbar.js     # Toolbar interactions
│   ├── storage.js     # Save/load functionality
│   ├── export.js      # Export to various formats
│   ├── cluppo-config.js # Persona/voice configuration for Cluppo
│   └── clippy.js      # Cluppo logic, moods, suggestions, voice
├── server/
│   └── index.js       # Express proxy for AI calls
├── .env.example       # Template for API keys
└── README.md          # This file
```

## AI Assistant (Cluppo)

Cluppo now calls the backend to generate its popups and replies. To enable:

1) Copy `.env.example` to `.env` and add your key:
```
OPENAI_API_KEY=sk-your-key
AI_MODEL=gpt-4o-mini
# PORT=3001
```
2) From `word-processor`, install and run the proxy:
```
npm install
npm start
```
3) Open `http://localhost:3001`. Cluppo’s popups/replies/suggestions will use `/api/ai` with your document + selection context.

Cluppo persona/voice:
- Personality and behavior live in `js/cluppo-config.js`.
- Browser speech synthesis is used for voice (prefers “Microsoft Sam” if available); disable by setting `voice.enabled` to false in that config.
- Cluppo stores hidden mood/memory state in `localStorage` and may surface (often unhelpful) suggestions, hostile escalations, and bad edits by design.

If you want a different port, set `PORT` in `.env` and restart.

## Technical Details

- Pure HTML5, CSS3, and vanilla JavaScript
- Uses ContentEditable API for rich text editing
- No dependencies (except jsPDF for PDF export, loaded via CDN)
- Responsive design works on desktop and mobile
- Print-optimized styles for clean printouts

## Future Enhancements

Potential features for future versions:
- Find and replace
- Tables
- Images
- Links
- Spell checker
- Custom font upload
- Cloud storage integration
- Real-time collaboration
- Export to DOCX format

## License

Free to use and modify for any purpose.

## Credits

Built with vanilla JavaScript and modern web standards.
