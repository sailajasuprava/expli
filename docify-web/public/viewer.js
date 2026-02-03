// viewer.js — complete, production-safe

let iframe;
let blobUrl;

(async function initViewer() {
  const { capturedHTML } = await chrome.storage.session.get("capturedHTML");

  if (!capturedHTML) {
    document.body.innerText = "No captured content found.";
    return;
  }

  // 🔹 Inject print-specific styles INTO the captured page
  const printStyles = `
    <style>
      @media print {
        body {
          margin: 20mm;
        }

        img {
          max-width: 100%;
          page-break-inside: avoid;
        }

        h1, h2, h3 {
          page-break-after: avoid;
        }

        p, li {
          orphans: 3;
          widows: 3;
        }
      }
    </style>
  `;

  const finalHTML = capturedHTML.replace("</head>", `${printStyles}</head>`);

  // Create HTML blob
  const blob = new Blob([finalHTML], { type: "text/html" });
  blobUrl = URL.createObjectURL(blob);

  // Load into iframe
  iframe = document.getElementById("preview");
  iframe.src = blobUrl;

  // 🔹 OPTIONAL: Auto-open print dialog once page loads
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      // iframe.contentWindow.print(); // ← uncomment if you want auto-print
    }, 500);
  };
})();

// 🔹 Download button → generates REAL PDF via Chrome print
function downloadPDF() {
  if (!iframe) return;
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}

// 🔹 Print button
function printPDF() {
  if (!iframe) return;
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}

// 🔹 Share button (optional)
async function sharePDF() {
  if (navigator.share) {
    await navigator.share({
      title: "Captured Web Page",
      url: blobUrl,
    });
  } else {
    alert("Sharing is not supported on this device.");
  }
}
