/**
 * ROSHONA Elementor-Style Visual Page Builder
 * Allows full in-page visual editing for texts, sections, images, and links.
 * Works seamlessly with Bangladesh e-commerce checkout.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'roshona_elementor_saved_content_v4_cartflows';
  let isEditMode = false;
  let activeElement = null;
  let lastActiveElement = null;
  let targetImageElement = null;

  // Preset images for easy 1-click swapping
  const GALLERY_PRESETS = [
    { name: 'Roshona Product Bottle', url: 'https://sazratul.com/wp-content/uploads/2026/10/roshona_product.webp' },
    { name: 'Benefits Illustration', url: 'https://sazratul.com/wp-content/uploads/2026/10/roshona_benefits.webp' },
    { name: 'Pure Ingredients', url: 'https://sazratul.com/wp-content/uploads/2026/10/roshona_ingredients.webp' },
    { name: 'Customer Review 1', url: 'https://sazratul.com/wp-content/uploads/2026/10/roshona_review_01.webp' },
    { name: 'Customer Review 2', url: 'https://sazratul.com/wp-content/uploads/2026/10/roshona_review_02.webp' },
    { name: 'Customer Review 3', url: 'https://sazratul.com/wp-content/uploads/2026/10/roshona_review_03.webp' },
    { name: 'Brand Logo', url: 'https://sazratul.com/wp-content/uploads/2026/10/roshona_logo_primary_uploaded-e1790859800659.webp' }
  ];

  // Section names mapping in Bengali
  const SECTION_NAMES = {
    'hero': 'হিরো ব্যানার (Hero)',
    'problem': 'সমস্যা পরিচিতি (Problem)',
    'product': 'প্রোডাক্ট বিবরণ (Product)',
    'benefits': 'উপকারিতা (Benefits)',
    'ingredients': 'উপাদানসমূহ (Ingredients)',
    'how-to-use': 'ব্যবহারবিধি (3 Steps)',
    'routine': 'হেয়ার কেয়ার রুটিন (Routine)',
    'special-offer': 'স্পেশাল অফার (Offer)',
    'reviews': 'কাস্টমার রিভিউ (Reviews)',
    'faq': 'সাধারণ জিজ্ঞাসা (FAQ)',
    'cartflows-order': 'অর্ডার ফর্ম (Checkout)'
  };

  // Toast Notification Helper with Undo support
  function showToast(message, icon = '✨', onUndo = null) {
    let toast = document.getElementById('el-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'el-toast';
      toast.className = 'el-toast';
      document.body.appendChild(toast);
    }
    
    let html = `<span>${icon}</span> <span>${message}</span>`;
    if (onUndo) {
      html += ` <button type="button" id="el-toast-undo-btn" class="el-toast-undo">↩ ফিরিয়ে আনুন (Undo)</button>`;
    }
    toast.innerHTML = html;
    toast.classList.add('show');

    if (onUndo) {
      const undoBtn = document.getElementById('el-toast-undo-btn');
      if (undoBtn) {
        undoBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          onUndo();
          toast.classList.remove('show');
        };
      }
    }

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, onUndo ? 5500 : 3200);
  }

  // Restore saved content from localStorage if present
  function restoreSavedContent() {
    try {
      // Clear out any old versions of localStorage containing outdated custom forms or badges
      Object.keys(localStorage).forEach(key => {
        if (key.includes('roshona_elementor_saved')) {
          const val = localStorage.getItem(key);
          if (val && (val.includes('cartflows-order-form') || val.includes('cartflows-step-badge') || val.includes('১-স্টেপ দ্রুত চেকআউট') || key !== STORAGE_KEY)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {}

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      if (saved.includes('cartflows-order-form') || saved.includes('cartflows-step-badge')) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const mainContent = document.getElementById('main-content');
      if (mainContent && saved.trim().length > 50) {
        mainContent.innerHTML = saved;
        console.log('[Elementor Builder] Restored customized page layout from local storage.');
      }
    } catch (e) {
      console.warn('[Elementor Builder] Failed to restore saved content:', e);
    }
  }

  // Helper to clean any cloned element of editor attributes and overlays
  function cleanNode(node) {
    if (!node) return null;
    const clone = node.cloneNode(true);
    clone.querySelectorAll('.el-section-bar, .el-image-overlay, .el-mini-toolbar, #el-dock, #el-toast, .el-modal-backdrop, #el-export-modal, #el-image-modal').forEach(el => el.remove());
    clone.querySelectorAll('[data-el-editable]').forEach(el => {
      el.removeAttribute('data-el-editable');
      el.removeAttribute('contenteditable');
    });
    clone.querySelectorAll('.el-image-wrapper').forEach(el => {
      el.classList.remove('el-image-wrapper');
    });
    return clone;
  }

  // Generate clean full page HTML including Announcement, Header, Main sections, Footer, Aside (Mobile Sticky CTA), and Modals
  function getFullCleanPageHtml() {
    const parts = [];

    // 1. Top Announcement
    const ann = document.querySelector('aside.announcement-bar, .announcement-bar, .top-announcement');
    if (ann) {
      const c = cleanNode(ann);
      if (c) parts.push(c.outerHTML);
    }

    // 2. Site Header
    const hdr = document.querySelector('.site-header');
    if (hdr) {
      const c = cleanNode(hdr);
      if (c) parts.push(c.outerHTML);
    }

    // 3. Main Content
    const main = document.getElementById('main-content');
    if (main) {
      const c = cleanNode(main);
      if (c) parts.push(c.outerHTML);
    }

    // 4. Site Footer
    const ftr = document.querySelector('footer.site-footer');
    if (ftr) {
      const c = cleanNode(ftr);
      if (c) parts.push(c.outerHTML);
    }

    // 5. Mobile Sticky CTA (aside)
    const aside = document.querySelector('aside.mobile-sticky-cta, .mobile-sticky-cta');
    if (aside) {
      const c = cleanNode(aside);
      if (c) parts.push(c.outerHTML);
    }

    // 6. Modals
    const ordModal = document.getElementById('order-modal');
    if (ordModal) {
      const c = cleanNode(ordModal);
      if (c) parts.push(c.outerHTML);
    }
    const polModal = document.getElementById('policy-modal');
    if (polModal) {
      const c = cleanNode(polModal);
      if (c) parts.push(c.outerHTML);
    }

    return parts.join('\n\n');
  }

  // Generate clean HTML snapshot without editor attributes/handles
  function getCleanMainContentHtml() {
    const main = document.getElementById('main-content');
    if (!main) return '';

    const clone = cleanNode(main);
    return clone ? clone.innerHTML : '';
  }

  // Save current state
  function saveCurrentState() {
    const cleanHtml = getCleanMainContentHtml();
    if (cleanHtml) {
      localStorage.setItem(STORAGE_KEY, cleanHtml);
      showToast('সব পরিবর্তন সফলভাবে সেভ হয়েছে!', '💾');
    }
  }

  // Reset to original default
  function resetToDefault() {
    if (confirm('আপনি কি পূর্বের মূল ডিজাইনে ফিরে যেতে চান? আপনার সেভ করা পরিবর্তনগুলো মুছে যাবে।')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }

  // Open Complete Elementor Ready Code Modal
  async function openExportModal() {
    let fullCode = '';

    try {
      const res = await fetch('/roshona-elementor-ready.html?v=' + Date.now());
      if (res.ok) {
        fullCode = await res.text();
      }
    } catch (e) {
      console.warn('Failed to fetch roshona-elementor-ready.html', e);
    }

    // Use full clean page HTML (including Header, Main, Footer, Aside, and Modals)
    const fullCleanHtml = getFullCleanPageHtml();
    if (fullCode && fullCleanHtml && fullCleanHtml.trim().length > 100) {
      const rootOpen = '<div class="roshona-elementor-root">';
      const rootStart = fullCode.indexOf(rootOpen);
      const rootEnd = fullCode.lastIndexOf('</div>\n\n<!-- Production JavaScript Functionality -->');
      if (rootStart !== -1 && rootEnd !== -1) {
        fullCode = fullCode.substring(0, rootStart + rootOpen.length) + '\n' + fullCleanHtml + '\n' + fullCode.substring(rootEnd);
      }
    }

    if (!fullCode) {
      fullCode = `<!-- ROSHONA PRODUCTION ELEMENTOR TEMPLATE -->\n<div class="roshona-elementor-root">\n${fullCleanHtml}\n</div>`;
    }

    let modal = document.getElementById('el-export-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'el-export-modal';
      modal.className = 'el-modal-backdrop';
      modal.innerHTML = `
        <div class="el-modal-card" style="max-width: 760px;">
          <div class="el-modal-header" style="background: linear-gradient(135deg, #143525 0%, #1e4d36 100%); color: #fff;">
            <div>
              <h3 class="el-modal-title" style="color: #fff; margin-bottom: 4px;">⚡ Elementor Production-Ready Code</h3>
              <p style="font-size: 0.85rem; color: #d4b270; margin: 0;">সকল ডিজাইন (CSS), ফন্ট, ছবি ও ইন্টারঅ্যাক্টিভ স্ক্রিপ্ট সহ এক ফাইলে প্রস্তুত</p>
            </div>
            <button type="button" class="el-modal-close" id="el-export-modal-close" style="color: #fff;">&times;</button>
          </div>
          <div class="el-modal-body" style="padding: 1.25rem;">
            <div style="background: #FAF7F0; border: 1.5px solid rgba(184, 148, 85, 0.4); border-radius: 12px; padding: 1rem; margin-bottom: 1.2rem;">
              <div style="font-weight: 700; color: #143525; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>💡</span><span>Elementor-এ পেস্ট করার নিয়ম (৩টি সহজ ধাপ):</span>
              </div>
              <ol style="margin-left: 1.4rem; font-size: 0.9rem; color: #4B5A51; line-height: 1.6;">
                <li>WordPress-এ নতুন পেজ খুলে <strong>"Edit with Elementor"</strong> এ যান।</li>
                <li>নিচে বামের Settings (গিয়ার আইকন) এ ক্লিক করে <strong>Page Layout: "Elementor Canvas"</strong> দিন।</li>
                <li>উইজেট থেকে একটি <strong>"HTML"</strong> উইজেট টেনে এনে নিচের সম্পূর্ণ কোডটি পেস্ট করে <strong>"Publish"</strong> করে দিন!</li>
              </ol>
            </div>

            <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">
              <button type="button" class="el-btn el-btn-primary" id="el-modal-copy-btn" style="flex: 1; min-height: 44px; font-weight: 700;">
                <span>📋</span><span>১-ক্লিকে সম্পূর্ণ কোড কপি করুন (Copy Code)</span>
              </button>
              <button type="button" class="el-btn el-btn-save" id="el-modal-download-btn" style="flex: 1; min-height: 44px; font-weight: 700;">
                <span>📥</span><span>HTML ফাইল ডাউনলোড করুন (.html)</span>
              </button>
            </div>

            <div style="position: relative;">
              <textarea id="el-export-textarea" readonly style="width: 100%; height: 260px; font-family: monospace; font-size: 0.82rem; padding: 0.75rem; border: 1.5px solid #d1d5db; border-radius: 8px; background: #1e1e1e; color: #4ec9b0; resize: vertical;"></textarea>
            </div>
          </div>
          <div class="el-modal-footer">
            <button type="button" class="el-btn el-btn-reset" id="el-export-modal-cancel">বন্ধ করুন</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const close = () => modal.classList.remove('open');
      document.getElementById('el-export-modal-close').addEventListener('click', close);
      document.getElementById('el-export-modal-cancel').addEventListener('click', close);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });

      document.getElementById('el-modal-copy-btn').addEventListener('click', () => {
        const text = document.getElementById('el-export-textarea').value;
        navigator.clipboard.writeText(text).then(() => {
          showToast('সম্পূর্ণ Elementor কোড ক্লিপবোর্ডে কপি করা হয়েছে! Elementor HTML উইজেটে পেস্ট করুন।', '🎉');
        }).catch(() => {
          showToast('কপি করতে সমস্যা হয়েছে, ম্যানুয়ালি টেক্সট সিলেক্ট করুন', '⚠️');
        });
      });

      document.getElementById('el-modal-download-btn').addEventListener('click', () => {
        const text = document.getElementById('el-export-textarea').value;
        const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roshona-elementor-ready.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('roshona-elementor-ready.html ডাউনলোড সম্পন্ন হয়েছে!', '📥');
      });
    }

    const textarea = document.getElementById('el-export-textarea');
    if (textarea) textarea.value = fullCode;

    modal.classList.add('open');
  }

  // Copy Clean HTML Code
  function copyCleanHtml() {
    openExportModal();
  }

  // ----------------------------------------------------
  // Setup Editable Elements
  // ----------------------------------------------------
  function setupEditableElements() {
    const main = document.getElementById('main-content');
    if (!main) return;

    // Target headings, paragraphs, spans, labels, lists, quotes, buttons
    const selectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'blockquote',
      '.eyebrow', '.hero-usp-badge', '.problem-card-num', '.problem-card-label',
      '.problem-card-question', '.product-big-headline', '.product-sub-headline',
      '.step-number', '.step-title', '.step-text',
      '.benefit-title', '.benefit-desc',
      '.ingredient-badge', '.ingredient-item-title', '.ingredient-item-desc',
      '.offer-product-title', '.offer-product-desc', '.current-price', '.old-price', '.discount-pill',
      '.reviewer-name', '.reviewer-district', '.review-quote',
      '.faq-button span:first-child', '.faq-answer-text',
      '.btn', 'a.btn'
    ];

    const elements = main.querySelectorAll(selectors.join(', '));
    elements.forEach(el => {
      // Don't mark builder controls or form inputs
      if (el.closest('.el-dock') || el.closest('.el-modal-card') || el.closest('.el-section-bar') || el.closest('form')) {
        return;
      }
      el.setAttribute('data-el-editable', 'true');
    });

    // Image Wrappers & Overlays
    const images = main.querySelectorAll('img');
    images.forEach(img => {
      if (img.closest('.el-dock') || img.closest('.el-modal-card')) return;

      let parent = img.parentElement;
      if (!parent.classList.contains('el-image-wrapper')) {
        img.classList.add('el-target-img');
        const overlay = document.createElement('div');
        overlay.className = 'el-image-overlay';
        overlay.innerHTML = '<span>📷</span><span>ছবি বদলান</span>';
        overlay.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isEditMode) openImageEditorModal(img);
        });
        parent.classList.add('el-image-wrapper');
        parent.appendChild(overlay);
      }
    });

    // Section Control Bars
    const sections = main.querySelectorAll(':scope > section');
    sections.forEach(sec => {
      if (sec.querySelector('.el-section-bar')) return;

      const bar = document.createElement('div');
      bar.className = 'el-section-bar';

      const secId = sec.id || (sec.className ? sec.className.split(' ')[0] : 'section');
      const secName = SECTION_NAMES[secId] || secId;

      bar.innerHTML = `
        <button type="button" class="el-sec-btn el-btn-up" title="সেকশন উপরে নিন">↑</button>
        <span class="el-sec-title">⬡ ${secName}</span>
        <button type="button" class="el-sec-btn el-btn-down" title="সেকশন নিচে নিন">↓</button>
        <button type="button" class="el-sec-btn" data-action="duplicate" title="ডুপ্লিকেট করুন">⧉</button>
        <button type="button" class="el-sec-btn danger" data-action="delete" title="সেকশন মুছুন">✕</button>
      `;

      // Up button
      bar.querySelector('.el-btn-up').addEventListener('click', (e) => {
        e.stopPropagation();
        const prev = sec.previousElementSibling;
        if (prev && prev.tagName.toLowerCase() === 'section') {
          sec.parentNode.insertBefore(sec, prev);
          showToast('সেকশন উপরে নেওয়া হয়েছে', '↑');
          saveCurrentState();
        }
      });

      // Down button
      bar.querySelector('.el-btn-down').addEventListener('click', (e) => {
        e.stopPropagation();
        const next = sec.nextElementSibling;
        if (next && next.tagName.toLowerCase() === 'section') {
          sec.parentNode.insertBefore(next, sec);
          showToast('সেকশন নিচে নেওয়া হয়েছে', '↓');
          saveCurrentState();
        }
      });

      // Duplicate button
      bar.querySelector('[data-action="duplicate"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const clone = sec.cloneNode(true);
        // remove existing bar from clone so new one gets fresh events
        const cloneBar = clone.querySelector('.el-section-bar');
        if (cloneBar) cloneBar.remove();
        sec.parentNode.insertBefore(clone, sec.nextElementSibling);
        setupEditableElements();
        showToast('সেকশন ডুপ্লিকেট করা হয়েছে', '⧉');
        saveCurrentState();
      });

      // Delete button
      bar.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const secToDelete = sec;
        const parent = secToDelete.parentNode;
        const nextSibling = secToDelete.nextSibling;
        secToDelete.remove();
        saveCurrentState();
        showToast(`"${secName}" সেকশন মুছে ফেলা হয়েছে`, '🗑️', () => {
          if (parent) {
            parent.insertBefore(secToDelete, nextSibling);
            setupEditableElements();
            saveCurrentState();
            showToast('সেকশন ফিরিয়ে আনা হয়েছে', '↩️');
          }
        });
      });

      sec.appendChild(bar);
    });
  }

  // Toggle Edit Mode ON/OFF
  function setEditMode(active) {
    isEditMode = active;
    const body = document.body;
    const toggleBtn = document.getElementById('el-toggle-btn');
    const statusPill = document.getElementById('el-status-pill');
    const miniToolbar = document.getElementById('el-mini-toolbar');

    if (isEditMode) {
      body.classList.add('elementor-mode-on');
      setupEditableElements();
      
      // Enable contentEditable on text elements
      document.querySelectorAll('[data-el-editable="true"]').forEach(el => {
        el.setAttribute('contenteditable', 'true');
      });

      if (toggleBtn) {
        toggleBtn.innerHTML = '<span>👁️</span> <span>প্রিভিউ মোড</span>';
        toggleBtn.classList.remove('el-btn-primary');
        toggleBtn.classList.add('el-btn-save');
      }
      if (statusPill) {
        statusPill.classList.add('active');
        statusPill.innerHTML = '<span class="el-status-dot"></span> <span>এডিট মোড চালু</span>';
      }
      showToast('এলিমেন্টর এডিট মোড চালু হয়েছে! যে কোনো টেক্সট বা ছবিতে ক্লিক করে এডিট করুন।', '✏️');
    } else {
      body.classList.remove('elementor-mode-on');
      document.querySelectorAll('[data-el-editable="true"]').forEach(el => {
        el.removeAttribute('contenteditable');
      });
      if (miniToolbar) miniToolbar.classList.remove('visible');

      if (toggleBtn) {
        toggleBtn.innerHTML = '<span>✏️</span> <span>এডিট মোড (Elementor)</span>';
        toggleBtn.classList.add('el-btn-primary');
        toggleBtn.classList.remove('el-btn-save');
      }
      if (statusPill) {
        statusPill.classList.remove('active');
        statusPill.innerHTML = '<span class="el-status-dot"></span> <span>লাইভ ভিউ</span>';
      }
      showToast('প্রিভিউ মোড সক্রিয়। ওয়েবসাইট স্বাভাবিকভাবে কাজ করছে।', '👁️');
    }
  }

  // RGB to Hex helper for native color pickers
  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb.startsWith('rgba(0, 0, 0, 0)')) return '#183A2A';
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#183A2A';
    const hex = (x) => ('0' + parseInt(x).toString(16)).slice(-2);
    return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }

  // ----------------------------------------------------
  // Floating Mini-Toolbar for Formatting Active Text
  // ----------------------------------------------------
  function createMiniToolbar() {
    let toolbar = document.getElementById('el-mini-toolbar');
    if (toolbar) return;

    toolbar = document.createElement('div');
    toolbar.id = 'el-mini-toolbar';
    toolbar.className = 'el-mini-toolbar';
    toolbar.innerHTML = `
      <div class="el-mini-row">
        <!-- Text Styling -->
        <button type="button" class="el-tool-btn" data-cmd="bold" title="বোল্ড (Bold)"><b>B</b></button>
        <button type="button" class="el-tool-btn" data-cmd="italic" title="ইটালিক (Italic)"><i>I</i></button>
        <button type="button" class="el-tool-btn" data-cmd="underline" title="আন্ডারলাইন (Underline)"><u>U</u></button>
        <span class="el-tool-sep"></span>

        <!-- Font Size Stepper -->
        <div class="el-size-stepper" title="ফন্ট সাইজ পরিবর্তন করুন">
          <button type="button" class="el-size-btn" id="el-mini-size-dec">-</button>
          <span class="el-size-val" id="el-mini-size-val">16px</span>
          <button type="button" class="el-size-btn" id="el-mini-size-inc">+</button>
        </div>
        <span class="el-tool-sep"></span>

        <!-- Max-Width / Line Wrap Stepper -->
        <div class="el-width-stepper" title="লাইনের প্রশস্ততা / উইডথ পরিবর্তন করুন (২-লাইন বা ৩-লাইন)">
          <span style="font-size: 10px; color: #94a3b8; padding-left: 2px;">↔ প্রস্থ:</span>
          <button type="button" class="el-size-btn" id="el-mini-width-dec" title="প্রস্থ কমান (Narrow / বেশি লাইন)">-</button>
          <span class="el-width-val" id="el-mini-width-val">840px</span>
          <button type="button" class="el-size-btn" id="el-mini-width-inc" title="প্রস্থ বাড়ান (Wider / ২ লাইন)">+</button>
          <button type="button" class="el-size-btn" id="el-mini-width-toggle" title="২-লাইন প্রিসেট (Toggle 640px / 840px / 100%)" style="font-size: 10px; color: #38bdf8; width: auto; padding: 0 4px;">২-লাইন</button>
        </div>
        <span class="el-tool-sep"></span>

        <!-- Font Family Selector -->
        <select id="el-mini-font-family" class="el-tool-select" title="ফন্ট টাইপ পরিবর্তন করুন">
          <option value="'Noto Sans Bengali', sans-serif">Noto Sans</option>
          <option value="'Noto Serif Bengali', serif">Noto Serif</option>
          <option value="'Hind Siliguri', sans-serif">Hind Siliguri</option>
          <option value="'Cormorant Garamond', serif">Cormorant</option>
          <option value="'Inter', sans-serif">Inter</option>
        </select>
        <span class="el-tool-sep"></span>

        <!-- Text Color Picker -->
        <div class="el-color-picker-wrap" title="টেক্সট কালার পিকার (Text Color)">
          <input type="color" id="el-mini-color-input" class="el-color-picker-input" value="#183A2A" />
          <span class="el-color-swatch-badge" id="el-mini-color-badge" style="background: #183A2A;"></span>
        </div>

        <!-- Background Color Picker -->
        <div class="el-color-picker-wrap" title="ব্যাকগ্রাউন্ড কালার পিকার (BG Color)">
          <input type="color" id="el-mini-bg-input" class="el-color-picker-input" value="#ffffff" />
          <span class="el-color-swatch-badge" id="el-mini-bg-badge" style="background: #ffffff; border: 1.5px dashed #64748b;"></span>
        </div>
        <span class="el-tool-sep"></span>

        <!-- Alignment -->
        <button type="button" class="el-tool-btn" data-align="left" title="বামে অ্যালাইন">⫷</button>
        <button type="button" class="el-tool-btn" data-align="center" title="মাঝখানে অ্যালাইন">≡</button>
        <button type="button" class="el-tool-btn" data-align="right" title="ডানে অ্যালাইন">⫸</button>
        <span class="el-tool-sep"></span>

        <!-- Link, Inspector & Delete -->
        <button type="button" class="el-tool-btn" id="el-tool-link" title="লিঙ্ক সেট করুন">🔗</button>
        <button type="button" class="el-tool-btn" id="el-tool-inspector" title="সম্পূর্ণ স্টাইল প্যানেল খুলুন">⚙️</button>
        <button type="button" class="el-tool-btn" id="el-tool-del" title="এলিমেন্ট মুছুন" style="color: #ef4444; font-size: 15px; font-weight: bold;">🗑️</button>
      </div>

      <div id="el-mini-link-box" style="display: none; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.18); margin-top: 4px; gap: 5px; align-items: center;">
        <input type="text" id="el-mini-link-input" placeholder="URL e.g. #cartflows-order" style="background: #0f172a; border: 1px solid #475569; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; width: 170px; outline: none;" />
        <button type="button" id="el-mini-link-apply" class="el-tool-btn" style="background: #10b981; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">✓</button>
        <button type="button" id="el-mini-link-cancel" class="el-tool-btn" style="color: #94a3b8; font-size: 12px;">✕</button>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Prevent toolbar clicks from blurring active editable text
    toolbar.addEventListener('mousedown', (e) => {
      if (e.target.tagName.toLowerCase() !== 'input' && e.target.tagName.toLowerCase() !== 'select') {
        e.preventDefault();
      }
    });

    // Formatting commands
    toolbar.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.getAttribute('data-cmd');
        document.execCommand(cmd, false, null);
        saveCurrentState();
      });
    });

    // Font Size Stepper
    const sizeValDisplay = document.getElementById('el-mini-size-val');
    document.getElementById('el-mini-size-dec').addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const curSize = parseFloat(window.getComputedStyle(target).fontSize) || 16;
      const newSize = Math.max(10, Math.round(curSize - 2));
      target.style.fontSize = `${newSize}px`;
      sizeValDisplay.textContent = `${newSize}px`;
      saveCurrentState();
    });

    document.getElementById('el-mini-size-inc').addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const curSize = parseFloat(window.getComputedStyle(target).fontSize) || 16;
      const newSize = Math.min(90, Math.round(curSize + 2));
      target.style.fontSize = `${newSize}px`;
      sizeValDisplay.textContent = `${newSize}px`;
      saveCurrentState();
    });

    // Width / Line Wrap Stepper Handlers
    const widthValDisplay = document.getElementById('el-mini-width-val');
    document.getElementById('el-mini-width-dec').addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const curW = parseInt(target.style.maxWidth) || parseInt(window.getComputedStyle(target).maxWidth) || parseInt(target.offsetWidth) || 840;
      const newW = Math.max(320, curW - 60);
      target.style.maxWidth = `${newW}px`;
      target.style.width = '100%';
      target.style.marginLeft = 'auto';
      target.style.marginRight = 'auto';
      widthValDisplay.textContent = `${newW}px`;
      saveCurrentState();
      showToast(`প্রস্থ কমানো হয়েছে (${newW}px)`, '↔');
    });

    document.getElementById('el-mini-width-inc').addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const curW = parseInt(target.style.maxWidth) || parseInt(window.getComputedStyle(target).maxWidth) || parseInt(target.offsetWidth) || 640;
      const newW = Math.min(1400, curW + 60);
      target.style.maxWidth = `${newW}px`;
      target.style.width = '100%';
      target.style.marginLeft = 'auto';
      target.style.marginRight = 'auto';
      widthValDisplay.textContent = `${newW}px`;
      saveCurrentState();
      showToast(`প্রস্থ বাড়ানো হয়েছে (${newW}px - কম লাইন)`, '↔');
    });

    document.getElementById('el-mini-width-toggle').addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const curW = parseInt(target.style.maxWidth) || parseInt(window.getComputedStyle(target).maxWidth) || 640;
      let nextW = 840;
      let label = '২-লাইন মোড (840px)';
      if (curW >= 800 && curW < 1000) {
        nextW = 1100;
        label = 'প্রশস্ত মোড (1100px)';
      } else if (curW >= 1000) {
        nextW = 640;
        label = '৩-লাইন মোড (640px)';
      } else {
        nextW = 840;
        label = '২-লাইন মোড (840px)';
      }
      target.style.maxWidth = `${nextW}px`;
      target.style.width = '100%';
      target.style.marginLeft = 'auto';
      target.style.marginRight = 'auto';
      widthValDisplay.textContent = `${nextW}px`;
      saveCurrentState();
      showToast(`${label} সেট করা হয়েছে!`, '↔');
    });

    // Font Family Selection
    const fontSelect = document.getElementById('el-mini-font-family');
    fontSelect.addEventListener('change', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.fontFamily = fontSelect.value;
      saveCurrentState();
    });

    // Native Color Picker for Text
    const colorInput = document.getElementById('el-mini-color-input');
    const colorBadge = document.getElementById('el-mini-color-badge');
    colorInput.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const color = colorInput.value;
      target.style.color = color;
      colorBadge.style.background = color;
    });
    colorInput.addEventListener('change', () => {
      saveCurrentState();
    });

    // Native Color Picker for Background
    const bgInput = document.getElementById('el-mini-bg-input');
    const bgBadge = document.getElementById('el-mini-bg-badge');
    bgInput.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const bg = bgInput.value;
      target.style.backgroundColor = bg;
      target.style.padding = target.style.padding || '4px 8px';
      target.style.borderRadius = target.style.borderRadius || '4px';
      bgBadge.style.background = bg;
    });
    bgInput.addEventListener('change', () => {
      saveCurrentState();
    });

    // Alignment
    toolbar.querySelectorAll('[data-align]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const align = btn.getAttribute('data-align');
        const target = activeElement || lastActiveElement;
        if (!target) return;
        target.style.textAlign = align;
        saveCurrentState();
      });
    });

    // Open Full Inspector Drawer
    document.getElementById('el-tool-inspector').addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      if (target) openInspectorDrawer(target);
    });

    // Inline Link Actions
    const linkBox = document.getElementById('el-mini-link-box');
    const linkInput = document.getElementById('el-mini-link-input');
    const linkApply = document.getElementById('el-mini-link-apply');
    const linkCancel = document.getElementById('el-mini-link-cancel');

    document.getElementById('el-tool-link').addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      if (!target) return;
      const currentHref = target.getAttribute('href') || (target.closest('a') ? target.closest('a').getAttribute('href') : '') || '#';
      linkInput.value = currentHref;
      linkBox.style.display = linkBox.style.display === 'none' ? 'flex' : 'none';
      if (linkBox.style.display === 'flex') {
        linkInput.focus();
      }
    });

    linkApply.addEventListener('click', (e) => {
      e.preventDefault();
      const target = activeElement || lastActiveElement;
      const newUrl = linkInput.value.trim();
      if (target && newUrl) {
        if (target.tagName.toLowerCase() === 'a') {
          target.setAttribute('href', newUrl);
        } else if (target.closest('a')) {
          target.closest('a').setAttribute('href', newUrl);
        } else {
          document.execCommand('createLink', false, newUrl);
        }
        showToast('লিঙ্ক সফলভাবে যুক্ত হয়েছে', '🔗');
        saveCurrentState();
      }
      linkBox.style.display = 'none';
    });

    linkCancel.addEventListener('click', (e) => {
      e.preventDefault();
      linkBox.style.display = 'none';
    });

    // Delete Element Action
    document.getElementById('el-tool-del').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const target = activeElement || lastActiveElement;
      if (!target) {
        showToast('প্রথমে যে লেখাটি মুছতে চান সেটিতে ক্লিক করুন', '⚠️');
        return;
      }

      const elToDelete = target;
      const parent = elToDelete.parentNode;
      const nextSibling = elToDelete.nextSibling;

      toolbar.classList.remove('visible');
      linkBox.style.display = 'none';

      elToDelete.remove();
      activeElement = null;
      lastActiveElement = null;

      saveCurrentState();

      showToast('এলিমেন্ট সফলভাবে মুছে ফেলা হয়েছে', '🗑️', () => {
        if (parent) {
          parent.insertBefore(elToDelete, nextSibling);
          setupEditableElements();
          saveCurrentState();
          showToast('এলিমেন্ট ফিরিয়ে আনা হয়েছে', '↩️');
        }
      });
    });
  }

  // Sync toolbar controls with active element's styles
  function syncToolbarWithElement(el) {
    if (!el) return;
    const computed = window.getComputedStyle(el);

    // Font size
    const sizeDisplay = document.getElementById('el-mini-size-val');
    if (sizeDisplay) {
      sizeDisplay.textContent = Math.round(parseFloat(computed.fontSize) || 16) + 'px';
    }

    // Font family
    const fontSelect = document.getElementById('el-mini-font-family');
    if (fontSelect) {
      const fam = computed.fontFamily.toLowerCase();
      if (fam.includes('garamond')) fontSelect.value = "'Cormorant Garamond', serif";
      else if (fam.includes('serif')) fontSelect.value = "'Noto Serif Bengali', serif";
      else if (fam.includes('hind')) fontSelect.value = "'Hind Siliguri', sans-serif";
      else if (fam.includes('inter')) fontSelect.value = "'Inter', sans-serif";
      else fontSelect.value = "'Noto Sans Bengali', sans-serif";
    }

    // Text color
    const colorInput = document.getElementById('el-mini-color-input');
    const colorBadge = document.getElementById('el-mini-color-badge');
    if (colorInput && colorBadge) {
      const hex = rgbToHex(computed.color);
      colorInput.value = hex;
      colorBadge.style.background = hex;
    }

    // Background color
    const bgInput = document.getElementById('el-mini-bg-input');
    const bgBadge = document.getElementById('el-mini-bg-badge');
    if (bgInput && bgBadge) {
      const bgHex = rgbToHex(computed.backgroundColor);
      bgInput.value = bgHex;
      bgBadge.style.background = bgHex;
    }

    // Width / Max-width
    const widthDisplay = document.getElementById('el-mini-width-val');
    if (widthDisplay) {
      const explicitMax = el.style.maxWidth;
      if (explicitMax && explicitMax.includes('px')) {
        widthDisplay.textContent = explicitMax;
      } else {
        const computedMax = parseFloat(computed.maxWidth);
        if (computedMax && computedMax < 1800) {
          widthDisplay.textContent = Math.round(computedMax) + 'px';
        } else {
          widthDisplay.textContent = Math.round(parseFloat(computed.width)) + 'px';
        }
      }
    }
  }

  // Position mini toolbar right above the active element
  function positionMiniToolbar(el) {
    const toolbar = document.getElementById('el-mini-toolbar');
    if (!toolbar || !isEditMode) return;

    activeElement = el;
    lastActiveElement = el;
    syncToolbarWithElement(el);

    const rect = el.getBoundingClientRect();
    toolbar.style.top = `${Math.max(10, rect.top - 58)}px`;
    toolbar.style.left = `${Math.max(10, rect.left + rect.width / 2 - 170)}px`;
    toolbar.classList.add('visible');
  }

  // ----------------------------------------------------
  // Full Elementor Style Inspector Drawer
  // ----------------------------------------------------
  function createInspectorDrawer() {
    let drawer = document.getElementById('el-inspector-drawer');
    if (drawer) return;

    drawer = document.createElement('div');
    drawer.id = 'el-inspector-drawer';
    drawer.className = 'el-inspector-drawer';
    drawer.innerHTML = `
      <div class="el-drawer-header">
        <div class="el-drawer-title-group">
          <span>⚙️</span>
          <h3 class="el-drawer-title">Elementor Inspector</h3>
          <span class="el-tag-badge" id="el-drawer-tag">ELEMENT</span>
        </div>
        <button type="button" class="el-drawer-close" id="el-drawer-close-btn">&times;</button>
      </div>

      <div class="el-drawer-body">
        <!-- 1. Typography & Font -->
        <div class="el-inspector-section">
          <h4 class="el-section-head">🔤 ফন্ট ও টাইপোগ্রাফি (Font)</h4>
          
          <div class="el-control-row">
            <label class="el-control-label">ফন্ট টাইপ (Font Family)</label>
            <select id="el-insp-font-family" class="el-select-input">
              <option value="'Noto Sans Bengali', sans-serif">Noto Sans Bengali (সহজ ও স্পষ্ট)</option>
              <option value="'Noto Serif Bengali', serif">Noto Serif Bengali (মার্জিত)</option>
              <option value="'Hind Siliguri', sans-serif">Hind Siliguri (জনপ্রিয়)</option>
              <option value="'Cormorant Garamond', serif">Cormorant Garamond (লাক্সারি)</option>
              <option value="'Inter', sans-serif">Inter (মডার্ন ক্লিন)</option>
              <option value="sans-serif">System Sans-Serif</option>
              <option value="serif">System Serif</option>
            </select>
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>ফন্ট সাইজ (Font Size)</span>
              <span class="el-control-val" id="el-insp-font-size-val">16px</span>
            </div>
            <div class="el-slider-group">
              <input type="range" id="el-insp-font-size-range" class="el-range-input" min="8" max="90" value="16" />
              <input type="number" id="el-insp-font-size-num" class="el-number-input" min="8" max="90" value="16" />
            </div>
          </div>

          <div class="el-control-row">
            <label class="el-control-label">ফন্ট ওয়েট (Font Weight)</label>
            <select id="el-insp-font-weight" class="el-select-input">
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semi-Bold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">Extra Bold (800)</option>
            </select>
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>লাইন হাইট (Line Height)</span>
              <span class="el-control-val" id="el-insp-line-height-val">1.5</span>
            </div>
            <input type="range" id="el-insp-line-height" class="el-range-input" min="1.0" max="2.5" step="0.1" value="1.5" style="width: 100%;" />
          </div>

          <div class="el-control-row">
            <label class="el-control-label">টেক্সট অ্যালাইনমেন্ট (Alignment)</label>
            <div class="el-align-btn-group">
              <button type="button" class="el-align-btn" data-insp-align="left" title="Left">⫷ বামে</button>
              <button type="button" class="el-align-btn" data-insp-align="center" title="Center">≡ মাঝে</button>
              <button type="button" class="el-align-btn" data-insp-align="right" title="Right">⫸ ডানে</button>
              <button type="button" class="el-align-btn" data-insp-align="justify" title="Justify">↔ সমান</button>
            </div>
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>লাইনের প্রস্থ / উইডথ (Line Wrap / 2-লাইন মোড)</span>
              <span class="el-control-val" id="el-insp-width-val">840px</span>
            </div>
            <div class="el-slider-group">
              <input type="range" id="el-insp-width-range" class="el-range-input" min="320" max="1200" step="20" value="840" />
              <input type="number" id="el-insp-width-num" class="el-number-input" min="320" max="1200" step="20" value="840" style="width: 65px;" />
            </div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <button type="button" class="el-btn el-btn-reset" id="el-insp-w-preset-3line" style="font-size: 10px; padding: 4px 6px; flex: 1;">৩-লাইন (640px)</button>
              <button type="button" class="el-btn el-btn-primary" id="el-insp-w-preset-2line" style="font-size: 10px; padding: 4px 6px; flex: 1;">২-লাইন (840px)</button>
              <button type="button" class="el-btn el-btn-reset" id="el-insp-w-preset-full" style="font-size: 10px; padding: 4px 6px; flex: 1;">ফুল (100%)</button>
            </div>
          </div>
        </div>

        <!-- 2. Colors & Background -->
        <div class="el-inspector-section">
          <h4 class="el-section-head">🎨 কালার ও ব্যাকগ্রাউন্ড (Colors)</h4>
          
          <div class="el-control-row">
            <label class="el-control-label">টেক্সট কালার (Text Color)</label>
            <div class="el-color-control-box">
              <input type="color" id="el-insp-color" class="el-color-input-native" value="#183A2A" />
              <input type="text" id="el-insp-color-hex" class="el-color-hex-text" value="#183A2A" />
            </div>
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>ব্যাকগ্রাউন্ড কালার (BG Color)</span>
              <button type="button" id="el-insp-bg-clear" style="background: none; border: none; font-size: 11px; color: #dc2626; cursor: pointer;">মুছে ফেলুন</button>
            </div>
            <div class="el-color-control-box">
              <input type="color" id="el-insp-bg" class="el-color-input-native" value="#ffffff" />
              <input type="text" id="el-insp-bg-hex" class="el-color-hex-text" value="#ffffff" />
            </div>
          </div>

          <div class="el-control-row">
            <label class="el-control-label">বর্ডার কালার (Border Color)</label>
            <div class="el-color-control-box">
              <input type="color" id="el-insp-border-color" class="el-color-input-native" value="#cbd5e1" />
              <input type="text" id="el-insp-border-hex" class="el-color-hex-text" value="#cbd5e1" />
            </div>
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>বর্ডার সাইজ (Border Width)</span>
              <span class="el-control-val" id="el-insp-border-width-val">0px</span>
            </div>
            <input type="range" id="el-insp-border-width" class="el-range-input" min="0" max="10" value="0" style="width: 100%;" />
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>কোনা গোল / বর্ডার রেডিয়াস (Border Radius)</span>
              <span class="el-control-val" id="el-insp-border-radius-val">0px</span>
            </div>
            <input type="range" id="el-insp-border-radius" class="el-range-input" min="0" max="50" value="0" style="width: 100%;" />
          </div>
        </div>

        <!-- 3. Size, Padding & Margin -->
        <div class="el-inspector-section">
          <h4 class="el-section-head">📐 সাইজ ও স্পেসিং (Spacing & Size)</h4>
          
          <div class="el-control-row">
            <div class="el-control-label">
              <span>প্যাডিং (Padding)</span>
              <span class="el-control-val" id="el-insp-padding-val">0px</span>
            </div>
            <input type="range" id="el-insp-padding" class="el-range-input" min="0" max="60" value="0" style="width: 100%;" />
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>মার্জিন (Margin)</span>
              <span class="el-control-val" id="el-insp-margin-val">0px</span>
            </div>
            <input type="range" id="el-insp-margin" class="el-range-input" min="0" max="60" value="0" style="width: 100%;" />
          </div>
        </div>

        <!-- 4. Image Size & Controls (Active when targeting img or image wrapper) -->
        <div class="el-inspector-section" id="el-insp-image-section" style="display: none;">
          <h4 class="el-section-head">📷 ইমেজ সাইজ ও কন্ট্রোল (Image)</h4>
          
          <div class="el-control-row">
            <div class="el-control-label">
              <span>ছবির সাইজ / উইডথ (Image Width)</span>
              <span class="el-control-val" id="el-insp-img-width-val">100%</span>
            </div>
            <input type="range" id="el-insp-img-width" class="el-range-input" min="10" max="100" value="100" style="width: 100%;" />
          </div>

          <div class="el-control-row">
            <div class="el-control-label">
              <span>ছবির কোনা গোল (Border Radius)</span>
              <span class="el-control-val" id="el-insp-img-radius-val">8px</span>
            </div>
            <input type="range" id="el-insp-img-radius" class="el-range-input" min="0" max="50" value="8" style="width: 100%;" />
          </div>

          <div class="el-control-row">
            <button type="button" class="el-btn el-btn-primary" id="el-insp-open-img-modal" style="width: 100%; justify-content: center;">
              📷 ছবি বদলান বা নতুন URL দিন
            </button>
          </div>
        </div>
      </div>

      <div class="el-drawer-footer">
        <button type="button" class="el-btn el-btn-save" id="el-drawer-save-btn" style="flex: 1; justify-content: center;">
          💾 পরিবর্তন সেভ করুন
        </button>
        <button type="button" class="el-btn el-btn-reset" id="el-drawer-done-btn">
          বন্ধ করুন
        </button>
      </div>
    `;

    document.body.appendChild(drawer);

    // Close listeners
    const closeDrawer = () => drawer.classList.remove('open');
    document.getElementById('el-drawer-close-btn').addEventListener('click', closeDrawer);
    document.getElementById('el-drawer-done-btn').addEventListener('click', closeDrawer);
    document.getElementById('el-drawer-save-btn').addEventListener('click', () => {
      saveCurrentState();
      closeDrawer();
    });

    // Inspector Events Binding:
    // Typography Events
    const inspFontFam = document.getElementById('el-insp-font-family');
    inspFontFam.addEventListener('change', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.fontFamily = inspFontFam.value;
      saveCurrentState();
    });

    const inspFontRange = document.getElementById('el-insp-font-size-range');
    const inspFontNum = document.getElementById('el-insp-font-size-num');
    const inspFontVal = document.getElementById('el-insp-font-size-val');
    const updateFontSize = (size) => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.fontSize = `${size}px`;
      inspFontVal.textContent = `${size}px`;
      inspFontRange.value = size;
      inspFontNum.value = size;
    };
    inspFontRange.addEventListener('input', () => updateFontSize(inspFontRange.value));
    inspFontNum.addEventListener('input', () => updateFontSize(inspFontNum.value));
    inspFontRange.addEventListener('change', () => saveCurrentState());
    inspFontNum.addEventListener('change', () => saveCurrentState());

    const inspWeight = document.getElementById('el-insp-font-weight');
    inspWeight.addEventListener('change', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.fontWeight = inspWeight.value;
      saveCurrentState();
    });

    const inspLineHeight = document.getElementById('el-insp-line-height');
    const inspLineHeightVal = document.getElementById('el-insp-line-height-val');
    inspLineHeight.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.lineHeight = inspLineHeight.value;
      inspLineHeightVal.textContent = inspLineHeight.value;
    });
    inspLineHeight.addEventListener('change', () => saveCurrentState());

    // Alignment
    drawer.querySelectorAll('[data-insp-align]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = activeElement || lastActiveElement;
        if (!target) return;
        const align = btn.getAttribute('data-insp-align');
        target.style.textAlign = align;
        drawer.querySelectorAll('[data-insp-align]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saveCurrentState();
      });
    });

    // Line Width / Max-Width Handlers
    const inspWRange = document.getElementById('el-insp-width-range');
    const inspWNum = document.getElementById('el-insp-width-num');
    const inspWVal = document.getElementById('el-insp-width-val');

    const updateElementWidth = (val) => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.maxWidth = `${val}px`;
      target.style.width = '100%';
      target.style.marginLeft = 'auto';
      target.style.marginRight = 'auto';
      inspWVal.textContent = `${val}px`;
      inspWRange.value = val;
      inspWNum.value = val;
      const miniW = document.getElementById('el-mini-width-val');
      if (miniW) miniW.textContent = `${val}px`;
    };

    inspWRange.addEventListener('input', () => updateElementWidth(inspWRange.value));
    inspWNum.addEventListener('input', () => updateElementWidth(inspWNum.value));
    inspWRange.addEventListener('change', () => saveCurrentState());
    inspWNum.addEventListener('change', () => saveCurrentState());

    document.getElementById('el-insp-w-preset-3line').addEventListener('click', () => {
      updateElementWidth(640);
      saveCurrentState();
      showToast('৩-লাইন প্রস্থ (640px) সেট করা হয়েছে', '↔');
    });

    document.getElementById('el-insp-w-preset-2line').addEventListener('click', () => {
      updateElementWidth(840);
      saveCurrentState();
      showToast('২-লাইন প্রস্থ (840px) সেট করা হয়েছে', '↔');
    });

    document.getElementById('el-insp-w-preset-full').addEventListener('click', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.maxWidth = '100%';
      target.style.width = '100%';
      inspWVal.textContent = '100%';
      const miniW = document.getElementById('el-mini-width-val');
      if (miniW) miniW.textContent = '100%';
      saveCurrentState();
      showToast('ফুল-উইডথ (100%) সেট করা হয়েছে', '↔');
    });

    // Colors
    const inspColor = document.getElementById('el-insp-color');
    const inspColorHex = document.getElementById('el-insp-color-hex');
    inspColor.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.color = inspColor.value;
      inspColorHex.value = inspColor.value;
    });
    inspColor.addEventListener('change', () => saveCurrentState());
    inspColorHex.addEventListener('change', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.color = inspColorHex.value;
      inspColor.value = inspColorHex.value;
      saveCurrentState();
    });

    // Background
    const inspBg = document.getElementById('el-insp-bg');
    const inspBgHex = document.getElementById('el-insp-bg-hex');
    inspBg.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.backgroundColor = inspBg.value;
      inspBgHex.value = inspBg.value;
    });
    inspBg.addEventListener('change', () => saveCurrentState());
    inspBgHex.addEventListener('change', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.backgroundColor = inspBgHex.value;
      inspBg.value = inspBgHex.value;
      saveCurrentState();
    });

    document.getElementById('el-insp-bg-clear').addEventListener('click', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.backgroundColor = 'transparent';
      inspBgHex.value = 'transparent';
      saveCurrentState();
    });

    // Border
    const inspBorderColor = document.getElementById('el-insp-border-color');
    const inspBorderHex = document.getElementById('el-insp-border-hex');
    inspBorderColor.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.borderColor = inspBorderColor.value;
      target.style.borderStyle = target.style.borderStyle || 'solid';
      inspBorderHex.value = inspBorderColor.value;
    });
    inspBorderColor.addEventListener('change', () => saveCurrentState());

    const inspBorderWidth = document.getElementById('el-insp-border-width');
    const inspBorderWidthVal = document.getElementById('el-insp-border-width-val');
    inspBorderWidth.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.borderWidth = `${inspBorderWidth.value}px`;
      target.style.borderStyle = 'solid';
      inspBorderWidthVal.textContent = `${inspBorderWidth.value}px`;
    });
    inspBorderWidth.addEventListener('change', () => saveCurrentState());

    const inspBorderRadius = document.getElementById('el-insp-border-radius');
    const inspBorderRadiusVal = document.getElementById('el-insp-border-radius-val');
    inspBorderRadius.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.borderRadius = `${inspBorderRadius.value}px`;
      inspBorderRadiusVal.textContent = `${inspBorderRadius.value}px`;
    });
    inspBorderRadius.addEventListener('change', () => saveCurrentState());

    // Spacing
    const inspPadding = document.getElementById('el-insp-padding');
    const inspPaddingVal = document.getElementById('el-insp-padding-val');
    inspPadding.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.padding = `${inspPadding.value}px`;
      inspPaddingVal.textContent = `${inspPadding.value}px`;
    });
    inspPadding.addEventListener('change', () => saveCurrentState());

    const inspMargin = document.getElementById('el-insp-margin');
    const inspMarginVal = document.getElementById('el-insp-margin-val');
    inspMargin.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      if (!target) return;
      target.style.margin = `${inspMargin.value}px`;
      inspMarginVal.textContent = `${inspMargin.value}px`;
    });
    inspMargin.addEventListener('change', () => saveCurrentState());

    // Image Controls
    const inspImgWidth = document.getElementById('el-insp-img-width');
    const inspImgWidthVal = document.getElementById('el-insp-img-width-val');
    inspImgWidth.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      const img = target.tagName.toLowerCase() === 'img' ? target : target.querySelector('img');
      if (!img) return;
      img.style.width = `${inspImgWidth.value}%`;
      img.style.maxWidth = '100%';
      inspImgWidthVal.textContent = `${inspImgWidth.value}%`;
    });
    inspImgWidth.addEventListener('change', () => saveCurrentState());

    const inspImgRadius = document.getElementById('el-insp-img-radius');
    const inspImgRadiusVal = document.getElementById('el-insp-img-radius-val');
    inspImgRadius.addEventListener('input', () => {
      const target = activeElement || lastActiveElement;
      const img = target.tagName.toLowerCase() === 'img' ? target : target.querySelector('img');
      if (!img) return;
      img.style.borderRadius = `${inspImgRadius.value}px`;
      inspImgRadiusVal.textContent = `${inspImgRadius.value}px`;
    });
    inspImgRadius.addEventListener('change', () => saveCurrentState());

    document.getElementById('el-insp-open-img-modal').addEventListener('click', () => {
      const target = activeElement || lastActiveElement;
      const img = target.tagName.toLowerCase() === 'img' ? target : target.querySelector('img');
      if (img) openImageEditorModal(img);
    });
  }

  // Open Inspector Drawer and sync element data
  function openInspectorDrawer(el) {
    createInspectorDrawer();
    activeElement = el;
    lastActiveElement = el;

    const drawer = document.getElementById('el-inspector-drawer');
    const tagBadge = document.getElementById('el-drawer-tag');
    tagBadge.textContent = el.tagName;

    const computed = window.getComputedStyle(el);

    // Font size
    const fontSize = Math.round(parseFloat(computed.fontSize) || 16);
    document.getElementById('el-insp-font-size-range').value = fontSize;
    document.getElementById('el-insp-font-size-num').value = fontSize;
    document.getElementById('el-insp-font-size-val').textContent = `${fontSize}px`;

    // Font family
    const fam = computed.fontFamily.toLowerCase();
    const inspFam = document.getElementById('el-insp-font-family');
    if (fam.includes('garamond')) inspFam.value = "'Cormorant Garamond', serif";
    else if (fam.includes('serif')) inspFam.value = "'Noto Serif Bengali', serif";
    else if (fam.includes('hind')) inspFam.value = "'Hind Siliguri', sans-serif";
    else if (fam.includes('inter')) inspFam.value = "'Inter', sans-serif";
    else inspFam.value = "'Noto Sans Bengali', sans-serif";

    // Font weight
    document.getElementById('el-insp-font-weight').value = computed.fontWeight || '400';

    // Width / Line Wrap
    const explicitW = parseInt(el.style.maxWidth) || Math.round(parseFloat(computed.maxWidth)) || Math.round(parseFloat(computed.width)) || 840;
    const boundedW = Math.min(1200, Math.max(320, explicitW < 2000 ? explicitW : 840));
    document.getElementById('el-insp-width-range').value = boundedW;
    document.getElementById('el-insp-width-num').value = boundedW;
    document.getElementById('el-insp-width-val').textContent = `${boundedW}px`;

    // Color
    const hex = rgbToHex(computed.color);
    document.getElementById('el-insp-color').value = hex;
    document.getElementById('el-insp-color-hex').value = hex;

    // Background
    const bgHex = rgbToHex(computed.backgroundColor);
    document.getElementById('el-insp-bg').value = bgHex;
    document.getElementById('el-insp-bg-hex').value = bgHex;

    // Check if target is or contains an image
    const isImg = el.tagName.toLowerCase() === 'img' || el.querySelector('img');
    const imgSection = document.getElementById('el-insp-image-section');
    imgSection.style.display = isImg ? 'block' : 'none';

    drawer.classList.add('open');
  }

  // ----------------------------------------------------
  // Image Editor Modal
  // ----------------------------------------------------
  function createImageEditorModal() {
    let modal = document.getElementById('el-image-modal');
    if (modal) return;

    modal = document.createElement('div');
    modal.id = 'el-image-modal';
    modal.className = 'el-modal-backdrop';
    modal.innerHTML = `
      <div class="el-modal-card">
        <div class="el-modal-header">
          <h3 class="el-modal-title">📷 ছবি পরিবর্তন করুন (Elementor Image)</h3>
          <button type="button" class="el-modal-close" id="el-modal-close-btn">&times;</button>
        </div>
        <div class="el-modal-body">
          <div class="el-input-group">
            <label class="el-input-label">ছবির লাইভ প্রিভিউ</label>
            <div class="el-img-preview-box">
              <img id="el-modal-preview-img" src="" alt="Preview" />
            </div>
          </div>
          
          <div class="el-input-group">
            <label class="el-input-label">গ্যালারি থেকে সিলেক্ট করুন (১-ক্লিক)</label>
            <div class="el-presets-row" id="el-presets-container"></div>
          </div>

          <div class="el-input-group">
            <label class="el-input-label">অথবা ছবির URL দিন (Image URL)</label>
            <input type="url" id="el-img-url-input" class="el-input-text" placeholder="https://..." />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
            <div class="el-input-group" style="margin-bottom: 0;">
              <div class="el-control-label">
                <span>ছবির সাইজ (Width)</span>
                <span class="el-control-val" id="el-modal-img-width-val">100%</span>
              </div>
              <input type="range" id="el-modal-img-width-range" class="el-range-input" min="15" max="100" value="100" style="width: 100%;" />
            </div>

            <div class="el-input-group" style="margin-bottom: 0;">
              <div class="el-control-label">
                <span>কোনা গোল (Radius)</span>
                <span class="el-control-val" id="el-modal-img-radius-val">8px</span>
              </div>
              <input type="range" id="el-modal-img-radius-range" class="el-range-input" min="0" max="50" value="8" style="width: 100%;" />
            </div>
          </div>
        </div>
        <div class="el-modal-footer">
          <button type="button" class="el-btn el-btn-reset" id="el-modal-cancel-btn">বাতিল</button>
          <button type="button" class="el-btn el-btn-primary" id="el-modal-apply-btn">পরিবর্তন প্রয়োগ করুন</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Populate preset gallery thumbnails
    const container = document.getElementById('el-presets-container');
    GALLERY_PRESETS.forEach(item => {
      const thumb = document.createElement('div');
      thumb.className = 'el-preset-thumb';
      thumb.title = item.name;
      thumb.innerHTML = `<img src="${item.url}" alt="${item.name}" />`;
      thumb.addEventListener('click', () => {
        document.getElementById('el-img-url-input').value = item.url;
        document.getElementById('el-modal-preview-img').src = item.url;
      });
      container.appendChild(thumb);
    });

    const closeBtn = document.getElementById('el-modal-close-btn');
    const cancelBtn = document.getElementById('el-modal-cancel-btn');
    const applyBtn = document.getElementById('el-modal-apply-btn');
    const urlInput = document.getElementById('el-img-url-input');
    const widthRange = document.getElementById('el-modal-img-width-range');
    const widthVal = document.getElementById('el-modal-img-width-val');
    const radiusRange = document.getElementById('el-modal-img-radius-range');
    const radiusVal = document.getElementById('el-modal-img-radius-val');

    widthRange.addEventListener('input', () => {
      widthVal.textContent = `${widthRange.value}%`;
      document.getElementById('el-modal-preview-img').style.width = `${widthRange.value}%`;
    });

    radiusRange.addEventListener('input', () => {
      radiusVal.textContent = `${radiusRange.value}px`;
      document.getElementById('el-modal-preview-img').style.borderRadius = `${radiusRange.value}px`;
    });

    urlInput.addEventListener('input', () => {
      document.getElementById('el-modal-preview-img').src = urlInput.value.trim();
    });

    const closeModal = () => modal.classList.remove('open');
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    applyBtn.addEventListener('click', () => {
      const newUrl = urlInput.value.trim();
      if (targetImageElement) {
        if (newUrl) targetImageElement.src = newUrl;
        targetImageElement.style.width = `${widthRange.value}%`;
        targetImageElement.style.maxWidth = '100%';
        targetImageElement.style.borderRadius = `${radiusRange.value}px`;
        showToast('ছবির সাইজ ও তথ্য সফলভাবে আপডেট হয়েছে!', '📷');
        saveCurrentState();
      }
      closeModal();
    });
  }

  function openImageEditorModal(img) {
    createImageEditorModal();
    targetImageElement = img;
    const modal = document.getElementById('el-image-modal');
    const urlInput = document.getElementById('el-img-url-input');
    const previewImg = document.getElementById('el-modal-preview-img');
    const widthRange = document.getElementById('el-modal-img-width-range');
    const widthVal = document.getElementById('el-modal-img-width-val');
    const radiusRange = document.getElementById('el-modal-img-radius-range');
    const radiusVal = document.getElementById('el-modal-img-radius-val');

    urlInput.value = img.src || '';
    previewImg.src = img.src || '';

    const curWidth = parseInt(img.style.width) || 100;
    widthRange.value = curWidth;
    widthVal.textContent = `${curWidth}%`;
    previewImg.style.width = `${curWidth}%`;

    const curRadius = parseInt(img.style.borderRadius) || 8;
    radiusRange.value = curRadius;
    radiusVal.textContent = `${curRadius}px`;
    previewImg.style.borderRadius = `${curRadius}px`;

    modal.classList.add('open');
  }

  // ----------------------------------------------------
  // Floating Elementor Dock
  // ----------------------------------------------------
  function createDock() {
    if (document.getElementById('el-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'el-dock';
    dock.className = window.innerWidth <= 768 ? 'el-dock minimized' : 'el-dock';
    dock.innerHTML = `
      <div class="el-dock-brand" id="el-dock-brand-toggle" title="ক্লিক করে বড়/ছোট করুন">
        <div class="el-badge-icon">E</div>
        <div>
          <div class="el-dock-title">Visual Editor</div>
          <div class="el-status-pill" id="el-status-pill">
            <span class="el-status-dot"></span>
            <span>লাইভ ভিউ</span>
          </div>
        </div>
      </div>

      <button type="button" class="el-btn el-btn-primary" id="el-toggle-btn">
        <span>✏️</span>
        <span>এডিট মোড (Elementor)</span>
      </button>

      <button type="button" class="el-btn el-btn-save" id="el-save-btn" title="পরিবর্তন সেভ করুন">
        <span>💾</span>
        <span>সেভ</span>
      </button>

      <button type="button" class="el-btn el-btn-export" id="el-export-btn" title="ক্লিন HTML কোড কপি করুন">
        <span>📋</span>
        <span>কোড</span>
      </button>

      <button type="button" class="el-btn el-btn-reset" id="el-reset-btn" title="ডিফল্ট ডিজাইনে ফিরুন">
        <span>🔄</span>
      </button>

      <button type="button" class="el-btn el-btn-min" id="el-min-btn" title="ডক ছোট/বড় করুন">
        <span>✕</span>
      </button>
    `;

    document.body.appendChild(dock);

    // Event Listeners for Dock
    const minBtn = document.getElementById('el-min-btn');
    const brandToggle = document.getElementById('el-dock-brand-toggle');
    
    function toggleDockMinimize() {
      dock.classList.toggle('minimized');
    }

    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDockMinimize();
      });
    }

    if (brandToggle) {
      brandToggle.addEventListener('click', () => {
        if (dock.classList.contains('minimized')) {
          dock.classList.remove('minimized');
        }
      });
    }

    document.getElementById('el-toggle-btn').addEventListener('click', () => {
      setEditMode(!isEditMode);
    });

    document.getElementById('el-save-btn').addEventListener('click', () => {
      saveCurrentState();
    });

    document.getElementById('el-export-btn').addEventListener('click', () => {
      copyCleanHtml();
    });

    document.getElementById('el-reset-btn').addEventListener('click', () => {
      resetToDefault();
    });
  }

  // ----------------------------------------------------
  // Global Event Interceptors for Edit Mode
  // ----------------------------------------------------
  function setupEventListeners() {
    // Intercept clicks on links/buttons when in Edit Mode so they don't navigate
    document.addEventListener('click', (e) => {
      if (!isEditMode) return;

      const editable = e.target.closest('[data-el-editable="true"]');
      if (editable) {
        // Prevent anchor jumps or form submissions while editing
        if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a')) {
          e.preventDefault();
        }
        positionMiniToolbar(editable);
      } else {
        // Hide mini toolbar if clicked outside
        if (!e.target.closest('#el-mini-toolbar') && !e.target.closest('#el-dock')) {
          const tb = document.getElementById('el-mini-toolbar');
          if (tb) tb.classList.remove('visible');
        }
      }
    });

    // Auto-save on blur of editable elements
    document.addEventListener('focusout', (e) => {
      if (!isEditMode) return;
      if (e.target.getAttribute('data-el-editable') === 'true') {
        saveCurrentState();
      }
    });

    // Keyboard shortcut: Ctrl + S to Save
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentState();
      }
    });
  }

  // ----------------------------------------------------
  // Initialize Visual Builder
  // ----------------------------------------------------
  function init() {
    restoreSavedContent();
    createDock();
    createMiniToolbar();
    setupEventListeners();
    console.log('[Elementor Builder] Ready! Click "✏️ এডিট মোড (Elementor)" on the floating dock to start editing.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
