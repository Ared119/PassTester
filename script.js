  /* ===== Dictionary ===== */
  const commonPasswords = [
    "password", "123456", "12345678", "qwerty",
    "letmein", "admin", "welcome", "iloveyou"
  ];

  /* ===== Charset size ===== */
  function charsetSize(pw) {
    let size = 0;
    if (/[a-z]/.test(pw)) size += 26;
    if (/[A-Z]/.test(pw)) size += 26;
    if (/[0-9]/.test(pw)) size += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) size += 33;
    return size;
  }

  /* ===== Time formatting ===== */
  function crackTime(seconds) {
    if (seconds < 60) return seconds.toFixed(1) + " seconds";
    if (seconds < 3600) return (seconds / 60).toFixed(1) + " minutes";
    if (seconds < 86400) return (seconds / 3600).toFixed(1) + " hours";
    if (seconds < 31536000) return (seconds / 86400).toFixed(1) + " days";
    return (seconds / 31536000).toFixed(1) + " years";
  }

  /* ===== SHA-1 hashing ===== */
  async function sha1(message) {
    const buffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  /* ===== HIBP check ===== */
  async function checkHIBP(password) {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );

    const text = await res.text();
    const lines = text.split("\n");

    for (let line of lines) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0;
  }

  /* ===== Main logic ===== */
  document.getElementById("password").addEventListener("input", async e => {
    const pw = e.target.value;
    const out = document.getElementById("output");

    if (!pw) {
      out.innerHTML = "";
      return;
    }

    const size = charsetSize(pw);
    const combinations = Math.pow(size, pw.length);
    const guessesPerSecond = 1e9;
    const seconds = combinations / guessesPerSecond;

    const dictionaryHit = commonPasswords.includes(pw.toLowerCase());

    out.innerHTML = `
      <p>🔢 Length: <strong>${pw.length}</strong></p>

      <p>⚡ Brute‑force resistance:
        <span class="${seconds > 1e10 ? 'good' : 'bad'}">
          ${crackTime(seconds)}
        </span>
      </p>

      <p>🛑 Breach database:
        <em>Checking…</em>
      </p>
    `;

    try {
      const breachCount = await checkHIBP(pw);
      const breachHTML = breachCount > 0
        ? `<span class="bad">Found in ${breachCount.toLocaleString()} breaches</span>`
        : `<span class="good">Not found in known breaches</span>`;

      out.innerHTML = out.innerHTML.replace(
        "<em>Checking…</em>",
        breachHTML
      );
    } catch {
      out.innerHTML += `<p class="bad">Error checking breach database</p>`;
    }
  });
