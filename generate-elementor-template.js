import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
const scriptJs = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

// Extract body inner content from index.html (excluding builder script)
const bodyStart = indexHtml.indexOf('<body>');
const bodyEnd = indexHtml.indexOf('<!-- Visual Elementor-style Builder Script -->');

let bodyContent = '';
if (bodyStart !== -1 && bodyEnd !== -1) {
  bodyContent = indexHtml.substring(bodyStart + 6, bodyEnd);
} else {
  const fallbackEnd = indexHtml.indexOf('</body>');
  bodyContent = indexHtml.substring(bodyStart + 6, fallbackEnd);
}

// Remove script tags from bodyContent if any
bodyContent = bodyContent.replace(/<script[^>]*src="\/script\.js"[^>]*><\/script>/gi, '');
bodyContent = bodyContent.trim();

const elementorTemplate = `<!-- ==========================================================================
   ROSHONA ROSEMARY COCONUT HAIR OIL - PRODUCTION-READY ELEMENTOR TEMPLATE
   Instructions:
   1. In WordPress, create or edit your page with Elementor.
   2. Set Page Layout to "Elementor Canvas" (in Page Settings at bottom left).
   3. Drag an "HTML" widget into the section.
   4. Paste this entire code block into the HTML widget.
   5. Click "Update" or "Publish". Done!
   ========================================================================== -->

<!-- Google Fonts Preconnect & Stylesheets -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@600;700&display=swap" rel="stylesheet">

<!-- Production Stylesheet -->
<style>
${styleCss}
</style>

<!-- Landing Page Content Structure -->
<div class="roshona-elementor-root">
${bodyContent}
</div>

<!-- Production JavaScript Functionality -->
<script>
// Image Error Fallback Handler
window.handleImgError = function(img, label) {
  img.onerror = null;
  var parent = img.parentElement;
  if (!parent) return;
  var placeholder = document.createElement('div');
  placeholder.className = 'img-fallback-box';
  placeholder.style.cssText = 'width:100%;height:100%;min-height:220px;background:#f3f4f6;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#4b5563;font-family:sans-serif;padding:20px;text-align:center;border-radius:12px;border:1px dashed #d1d5db;';
  placeholder.innerHTML = '<span style="font-size:2rem;margin-bottom:8px;">🌿</span><span style="font-weight:600;">' + (label || 'ROSHONA') + '</span>';
  parent.replaceChild(placeholder, img);
};

${scriptJs}
</script>
`;

fs.writeFileSync(path.join(__dirname, 'roshona-elementor-ready.html'), elementorTemplate, 'utf8');
console.log('Successfully generated roshona-elementor-ready.html! Size:', elementorTemplate.length, 'bytes');
