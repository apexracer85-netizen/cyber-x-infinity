# CyberX Browser Code Execution

## Supported directly in the browser
- **JavaScript:** executes inside a sandboxed iframe. Output is sent to the console panel.
- **HTML:** sandboxed live preview.
- **CSS:** sandboxed live preview using sample content.
- **Python:** Pyodide (Python/WebAssembly) loads from CDN on first run. Internet connection required.
- **SQL:** SQLite via SQL.js/WebAssembly. Runs in a temporary database in the browser; not persistent.
- **JSON:** parse and pretty-print validation.

## Reference-only languages
C/C++, Arduino, MicroPython, Bash, PowerShell, Java, Rust and other languages are editable and downloadable, but this page does not pretend to compile/run them. For those languages install the correct compiler/interpreter or use the relevant device IDE. Hardware firmware requires the physical board and USB/device permissions.

## Browser restrictions
Browsers do not provide a universal safe compiler/runtime for every programming language. Code execution is isolated; the JavaScript preview has no same-origin privileges. Avoid entering secrets or running untrusted code. CDN runtime downloads require internet access and are not bundled offline. The offline PWA caches the app shell, not Pyodide/SQLite runtime packages.

## Use
1. Open the CyberX Code Index.
2. Search for an example, then **Open in Studio**.
3. Select language and click **Run / Preview**.
4. Use Download to save your code.

This is a learning workbench, not a production secure sandbox for hostile code.