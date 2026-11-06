# MedSync visual simulation

Run `python server.py` and open http://127.0.0.1:4013/.

Use the links in the header to open three tabs: attacker, server, and patient portal. Keep the same hostname in every tab. Their scenario state synchronizes through browser storage.

Start on the attacker tab and send the review. Advance processing on the server tab. Open the review on the patient portal, then follow the session back to the attacker. Request the records and step through authentication and the missing access check on the server. The attacker client displays 10,000 simulated records, with rows revealed in batches.

Try the patched scenario to see output encoding stop the chain. Restart clears the scenario in all tabs.

This is entirely a visual simulation. The server only serves the page. There is no executable XSS, token theft, patient API, or real patient data. Session labels, requests, processing and record transfers are staged illustrations.
