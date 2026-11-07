# Demo script

Before recording: refresh all three tabs. On Attacker, choose VULNERABLE and Restart. Bracketed cues are actions, not spoken text.

[Attacker — click “1. Submit review”.]

I’m starting with an ordinary account. This review contains an image tag whose error handler asks the browser to read the session token and send it to the attacker’s collector. The collector is the receiving endpoint shown in the payload.

[Server — point to HTTP 201 and RV-208.]

The server stores that exact message as RV-208 and returns 201 Created. Storage alone does not execute it. The vulnerability is the output policy: the saved review will be inserted with innerHTML. This is the stored XSS entry point.

[Patient portal — click “2. Open page as admin”.]

The admin opens the same review. Its image source fails, triggering the error handler inside the application’s origin. The JWT is in localStorage, where page JavaScript can read it.

[Attacker — point to the collector, then click “3. Request patient records”.]

The collector now holds the admin JWT. Replaying it authenticates the attacker as that user. But the API fetches records by ID without checking access to each patient object. This is BOLA, also called IDOR. The counter reaches 10,000, with John Doe, Jane Smith and R. Johnson shown as examples.

[Click “Try PATCHED scenario”, then “1. Submit review”. Switch to Patient portal and click “2. Open page as admin”.]

Submission still returns 201. The patch changes how the same review is displayed: textContent renders it as text, so no image handler is created. Strict CSP adds a backstop. An HttpOnly cookie also prevents page JavaScript from reading the session token. The collector stays empty.

[Attacker — show the empty collector, then click “3. Test record access”.]

No admin token was captured. This separate test uses the ordinary account’s own valid session. The API checks record ownership and returns 403: zero records.

Output encoding blocks execution, HttpOnly protects the session secret, and object-level authorisation protects the records. Each control addresses a different link in the chain.
