# MedSync visual simulation

Run `python server.py` and open http://127.0.0.1:4013/.

Use the links in the header to open three tabs: attacker, server, and patient portal. Their scenario state synchronizes through the local server; browser storage is an optional cache. Refresh all tabs after updating the demo files.

Use exactly three actions: **Submit review** on Attacker, **Open page as admin** on Patient portal, then **Request patient records** on Attacker. Inspect Server after submission; it updates automatically and requires no processing clicks. RV-208 uses the exact submitted review message across all tabs. The final result shows 10,000 records and the example patients from the presentation.

Choose **Try PATCHED scenario** and repeat. POST /reviews still returns **201 Created**. The portal displays the saved message using textContent; no handler is created and the collector stays empty. Strict CSP and HttpOnly session storage provide further layers. **Test record access** uses the ordinary user's own valid session to attempt BOLA: the ownership check returns **403 Forbidden**, zero records. Only the records request is denied. Restart resets every tab.

This is entirely a visual simulation. The server serves the page and shares presentation state through /state. There is no executable XSS, token theft, patient API, or real patient data. Session labels, requests, processing and record transfers are staged illustrations.
