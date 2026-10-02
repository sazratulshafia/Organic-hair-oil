/**
 * ROSHONA Organic Hair Care
 * Production JavaScript for Landing Page
 * Compatible with WordPress / WooCommerce / CartFlows
 */

(function () {
  'use strict';

  // State Management
  const UNIT_PRICE = 499;
  let currentQuantity = 1;
  let deliveryFee = 60; // Standard COD fee across Bangladesh

  // Tracking Dispatcher Helper
  function logTrackingEvent(eventName, payload = {}) {
    console.log(`[ROSHONA Analytics] Event: ${eventName}`, payload);
    // Standard GTM / DataLayer hook if present
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ecommerce: payload,
      });
    }
    // Meta Pixel hook if present
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, payload);
    }
  }

  // Initial ViewContent tracking
  document.addEventListener('DOMContentLoaded', () => {
    logTrackingEvent('ViewContent', {
      content_name: 'Roshona Rosemary Coconut Hair Oil',
      content_category: 'Organic Hair Care',
      value: UNIT_PRICE,
      currency: 'BDT'
    });
  });

  // ====================================================
  // 1. Mobile Menu Drawer Toggle
  // ====================================================
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const navDrawer = document.getElementById('mobile-nav-drawer');

  if (menuToggle && navDrawer) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      navDrawer.classList.toggle('active');
    });

    // Close drawer when clicking mobile links
    const mobileLinks = navDrawer.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        navDrawer.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ====================================================
  // 2. Smooth Scroll & CTA Event Triggers
  // ====================================================
  const ctaButtons = document.querySelectorAll('[data-cta-scroll]');
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('data-cta-scroll');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
        logTrackingEvent('cta_click', {
          cta_label: btn.textContent.trim(),
          target_section: targetId
        });
      }
    });
  });

  // ====================================================
  // 3. FAQ Accordion
  // ====================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const button = item.querySelector('.faq-button');
    if (button) {
      button.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Optional: close other items for single-open experience
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherBtn = otherItem.querySelector('.faq-button');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
          button.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // ====================================================
  // 4. Testimonial Seamless Infinite Loop Auto-Slide Carousel
  // ====================================================
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsContainer = document.getElementById('carousel-dots');
  const carouselContainer = document.querySelector('.carousel-container');

  if (track) {
    const originalSlides = Array.from(track.children);
    const numOriginalSlides = originalSlides.length;

    if (numOriginalSlides > 1) {
      // 1. Create seamless clones for true infinite loop
      const firstClone = originalSlides[0].cloneNode(true);
      const lastClone = originalSlides[numOriginalSlides - 1].cloneNode(true);

      firstClone.setAttribute('aria-hidden', 'true');
      lastClone.setAttribute('aria-hidden', 'true');

      track.appendChild(firstClone);
      track.insertBefore(lastClone, originalSlides[0]);

      let currentIndex = 1; // Start at first original slide
      let isTransitioning = false;
      let autoSlideTimer = null;
      const AUTO_SLIDE_DELAY = 2800; // Smooth 2.8 seconds per slide
      const TRANSITION_STYLE = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';

      // Initial position without transition
      track.style.transition = 'none';
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      // Create dot indicators for original slides only
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        originalSlides.forEach((_, i) => {
          const dot = document.createElement('button');
          dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
          dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
          dot.addEventListener('click', () => {
            if (isTransitioning) return;
            goToSlide(i + 1);
            resetAutoSlide();
          });
          dotsContainer.appendChild(dot);
        });
      }

      function updateDots() {
        if (!dotsContainer) return;
        let dotIndex = currentIndex - 1;
        if (dotIndex < 0) dotIndex = numOriginalSlides - 1;
        if (dotIndex >= numOriginalSlides) dotIndex = 0;

        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === dotIndex);
        });
      }

      function moveToCurrent() {
        track.style.transition = TRANSITION_STYLE;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
      }

      function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex = index;
        moveToCurrent();
      }

      function nextSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex++;
        moveToCurrent();
      }

      function prevSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex--;
        moveToCurrent();
      }

      // Handle seamless infinite loop boundaries on transition end
      track.addEventListener('transitionend', () => {
        isTransitioning = false;

        // Reached the clone of the first slide at the end -> silent reset to first slide
        if (currentIndex === numOriginalSlides + 1) {
          track.style.transition = 'none';
          currentIndex = 1;
          track.style.transform = `translateX(-${currentIndex * 100}%)`;
          void track.offsetWidth; // Reflow
        }

        // Reached the clone of the last slide at the start -> silent reset to last slide
        if (currentIndex === 0) {
          track.style.transition = 'none';
          currentIndex = numOriginalSlides;
          track.style.transform = `translateX(-${currentIndex * 100}%)`;
          void track.offsetWidth; // Reflow
        }

        updateDots();
      });

      function startAutoSlide() {
        stopAutoSlide();
        autoSlideTimer = setInterval(() => {
          nextSlide();
        }, AUTO_SLIDE_DELAY);
      }

      function stopAutoSlide() {
        if (autoSlideTimer) {
          clearInterval(autoSlideTimer);
          autoSlideTimer = null;
        }
      }

      function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          prevSlide();
          resetAutoSlide();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          nextSlide();
          resetAutoSlide();
        });
      }

      // Pause auto slide on mouse enter, resume on mouse leave
      if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
      }

      // Touch Swipe Detection
      let touchStartX = 0;
      let touchEndX = 0;

      track.addEventListener('touchstart', (e) => {
        stopAutoSlide();
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const threshold = 40;
        if (touchEndX < touchStartX - threshold) {
          nextSlide();
        } else if (touchEndX > touchStartX + threshold) {
          prevSlide();
        }
        startAutoSlide();
      }, { passive: true });

      // Start seamless infinite loop
      startAutoSlide();
    }
  }

  // ====================================================
  // 5. CartFlows Order Calculator & Interaction
  // ====================================================
  // Detect if WordPress / CartFlows rendered real WooCommerce checkout form
  const cfShortcodeContainer = document.getElementById('cartflows-shortcode-container');
  const staticOrderForm = document.getElementById('cartflows-order-form');

  if (cfShortcodeContainer && staticOrderForm) {
    const isWpRendered = cfShortcodeContainer.querySelector('form.woocommerce-checkout, .wcf-embed-checkout-form, .woocommerce');
    if (isWpRendered) {
      staticOrderForm.style.display = 'none';
      cfShortcodeContainer.style.display = 'block';
    } else {
      // In static browser preview: hide raw string [cartflows_checkout] so visitor sees interactive preview form
      cfShortcodeContainer.style.display = 'none';
      staticOrderForm.style.display = 'block';
    }
  }

  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');
  const qtyInput = document.getElementById('order-quantity');
  const productPriceEl = document.getElementById('product-price');
  const summarySubtotalEl = document.getElementById('summary-subtotal');
  const deliveryChargeEl = document.getElementById('delivery-charge');
  const orderTotalEl = document.getElementById('order-total');
  const btnTotalValEl = document.getElementById('btn-total-val');
  const summaryQtyEl = document.getElementById('summary-qty');
  const errorBanner = document.getElementById('cartflows-error-msg');
  const packageRadios = document.querySelectorAll('input[name="product_package"]');
  const shippingRadios = document.querySelectorAll('input[name="shipping_location"]');

  let activePackagePrice = 499;

  function calculateSubtotal() {
    // If quantity matches standard packages, apply package bundle pricing
    if (currentQuantity === 1) return 499;
    if (currentQuantity === 2) return 899;
    if (currentQuantity === 3) return 1250;
    return currentQuantity * 450; // Custom volume discount
  }

  function updateOrderTotals() {
    const subtotal = calculateSubtotal();
    const total = subtotal + deliveryFee;

    if (productPriceEl) productPriceEl.textContent = `৳${subtotal}`;
    if (summarySubtotalEl) summarySubtotalEl.textContent = `৳${subtotal}`;
    if (deliveryChargeEl) deliveryChargeEl.textContent = `৳${deliveryFee}`;
    if (orderTotalEl) orderTotalEl.textContent = `৳${total}`;
    if (btnTotalValEl) btnTotalValEl.textContent = `৳${total}`;
    if (summaryQtyEl) summaryQtyEl.textContent = currentQuantity;

    // Sync package radio card active classes
    packageRadios.forEach(radio => {
      const card = radio.closest('.cartflows-package-card');
      if (card) {
        const isMatch = parseInt(radio.dataset.qty, 10) === currentQuantity;
        card.classList.toggle('active', isMatch);
        if (isMatch) radio.checked = true;
      }
    });
  }

  // Package Radio Change Listeners
  packageRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const qty = parseInt(radio.dataset.qty, 10);
      if (!isNaN(qty)) {
        currentQuantity = qty;
        if (qtyInput) qtyInput.value = currentQuantity;
        updateOrderTotals();
      }
    });
  });

  // Shipping Radios Change Listeners
  shippingRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const fee = parseInt(radio.dataset.fee, 10);
      if (!isNaN(fee)) {
        deliveryFee = fee;
        shippingRadios.forEach(r => {
          const item = r.closest('.shipping-radio-item');
          if (item) item.classList.toggle('active', r.checked);
        });
        updateOrderTotals();
      }
    });
  });

  // Quantity Stepper Handlers
  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        qtyInput.value = currentQuantity;
        updateOrderTotals();
      }
    });

    qtyPlus.addEventListener('click', () => {
      if (currentQuantity < 10) {
        currentQuantity++;
        qtyInput.value = currentQuantity;
        updateOrderTotals();
      }
    });

    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 10) val = 10;
      currentQuantity = val;
      qtyInput.value = currentQuantity;
      updateOrderTotals();
    });
  }

  // Order Form Submission Simulation & Confirmation Modal
  const orderForm = document.getElementById('cartflows-order-form');
  const orderModal = document.getElementById('order-modal');
  const orderModalClose = document.getElementById('order-modal-close');
  const modalReceiptDetails = document.getElementById('modal-receipt-details');

  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (errorBanner) {
        errorBanner.style.display = 'none';
        errorBanner.textContent = '';
      }

      const name = document.getElementById('billing_first_name')?.value.trim();
      const phone = document.getElementById('billing_phone')?.value.trim();
      const address = document.getElementById('billing_address_1')?.value.trim();
      const selectedShipping = document.querySelector('input[name="shipping_location"]:checked');
      const locationText = selectedShipping && selectedShipping.value === 'Dhaka' ? 'ঢাকার ভেতরে (হোম ডেলিভারি)' : 'ঢাকার বাইরে (সারা বাংলাদেশ)';

      // Validation
      if (!name || !phone || !address) {
        if (errorBanner) {
          errorBanner.textContent = '⚠️ অনুগ্রহ করে আপনার পূর্ণ নাম, সচল মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা প্রদান করুন।';
          errorBanner.style.display = 'block';
          errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Check phone number format (Bangladeshi 11 digits, begins with 01)
      const phoneRegex = /^01[3-9]\d{8}$/;
      const cleanedPhone = phone.replace(/[^0-9]/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        if (errorBanner) {
          errorBanner.textContent = '⚠️ অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমনঃ 017XXXXXXXX বা 018XXXXXXXX)।';
          errorBanner.style.display = 'block';
          errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const subtotal = calculateSubtotal();
      const total = subtotal + deliveryFee;

      // Log initiate_checkout tracking event
      logTrackingEvent('InitiateCheckout', {
        content_name: 'Roshona Rosemary Coconut Hair Oil',
        quantity: currentQuantity,
        value: total,
        currency: 'BDT',
        customer_phone: cleanedPhone,
        customer_location: locationText
      });

      // Display receipt in modal
      if (modalReceiptDetails) {
        modalReceiptDetails.innerHTML = `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 0.95rem; line-height: 1.6;">
            <p style="margin: 0 0 6px 0;"><strong>গ্রাহকের নাম:</strong> ${escapeHtml(name)}</p>
            <p style="margin: 0 0 6px 0;"><strong>মোবাইল নম্বর:</strong> ${escapeHtml(cleanedPhone)}</p>
            <p style="margin: 0 0 6px 0;"><strong>ডেলিভারি ঠিকানা:</strong> ${escapeHtml(address)} (${escapeHtml(locationText)})</p>
            <p style="margin: 0 0 6px 0;"><strong>অর্ডারকৃত প্যাকেজ:</strong> Roshona Hair Oil × ${currentQuantity} বোতল</p>
            <p style="margin: 0; font-size: 1.1rem; color: #183A2A;"><strong>সর্বমোট প্রদেয় বিল (COD): ৳${total}</strong></p>
          </div>
        `;
      }

      if (orderModal) {
        orderModal.classList.add('active');
      }
    });
  }

  if (orderModalClose && orderModal) {
    orderModalClose.addEventListener('click', () => {
      orderModal.classList.remove('active');
    });

    orderModal.addEventListener('click', (e) => {
      if (e.target === orderModal) {
        orderModal.classList.remove('active');
      }
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ====================================================
  // 6. Policy Modal Handler
  // ====================================================
  const policyModal = document.getElementById('policy-modal');
  const policyModalTitle = document.getElementById('policy-modal-title');
  const policyModalBody = document.getElementById('policy-modal-body');
  const policyModalClose = document.getElementById('policy-modal-close');

  const policiesData = {
    privacy: {
      title: 'Privacy Policy (গোপনীয়তা নীতি)',
      content: `
        <p>ROSHONA আপনার ব্যক্তিগত তথ্যের সুরক্ষাকে সর্বোচ্চ গুরুত্ব দিয়ে থাকে।</p>
        <p>১. আমরা শুধুমাত্র আপনার অর্ডার প্রসেসিং, ডেলিভারি এবং কাস্টমার সাপোর্টের প্রয়োজনে আপনার নাম, ঠিকানা ও ফোন নম্বর সংগ্রহ করি।</p>
        <p>২. আপনার কোনো তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি বা অপব্যবহার করা হয় না।</p>
        <p>৩. আমাদের ওয়েবসাইট সম্পূর্ণ নিরাপদ এবং আপনার তথ্যের গোপনীয়তা কঠোরভাবে রক্ষা করা হয়।</p>
      `
    },
    terms: {
      title: 'Terms & Conditions (শর্তাবলী)',
      content: `
        <p>ROSHONA-এর ওয়েবসাইটে স্বাগতম। এই সাইটটি ব্যবহারের মাধ্যমে আপনি আমাদের শর্তাবলীর সাথে সম্মতি প্রকাশ করছেন।</p>
        <p>১. সকল পণ্যের বিবরণ ও মূল্য সাইটে যথাযথভাবে উল্লেখ করা রয়েছে।</p>
        <p>২. অর্ডার নিশ্চিত করার পর আমাদের কাস্টমার কেয়ার থেকে আপনার সাথে ফোনে যোগাযোগ করা হবে।</p>
        <p>৩. Cash on Delivery-এর ক্ষেত্রে পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।</p>
      `
    },
    delivery: {
      title: 'Delivery Policy (ডেলিভারি নীতি)',
      content: `
        <p>আমরা সারাদেশে দ্রুততম সময়ে ক্যাশ অন ডেলিভারি সুবিধা প্রদান করি।</p>
        <p>১. ঢাকা সিটির ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।</p>
        <p>২. ঢাকা সিটির বাইরে দেশের যেকোনো জেলায় সাধারণত ২ থেকে ৪ কার্যদিবসের মধ্যে ডেলিভারি পৌঁছায়।</p>
        <p>৩. প্রতিটি পার্সেল সম্পূর্ণ নিরাপদ প্যাকেজিং নিশ্চিত করে কুরিয়ারে প্রেরণ করা হয়।</p>
      `
    },
    refund: {
      title: 'Return & Refund Policy (ফেরত নীতি)',
      content: `
        <p>ROSHONA আপনার সন্তুষ্টিতে প্রতিশ্রুতিবদ্ধ।</p>
        <p>১. ডেলিভারি গ্রহণের সময় পার্সেল ক্ষতিগ্রস্ত বা ভুল পণ্য পাওয়া গেলে সাথে সাথে কুরিয়ার কর্মীর সামনে আমাদের সাথে যোগাযোগ করুন।</p>
        <p>২. যৌক্তিক কারণে পণ্য প্রাপ্তির ৩ দিনের মধ্যে রিটার্ন রিকোয়েস্ট গ্রহণ করা হয়।</p>
        <p>৩. পণ্যটি অব্যবহৃত এবং মূল প্যাকেজিং সহ থাকতে হবে।</p>
      `
    }
  };

  document.querySelectorAll('[data-policy]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const policyKey = trigger.getAttribute('data-policy');
      const data = policiesData[policyKey];
      if (data && policyModal && policyModalTitle && policyModalBody) {
        policyModalTitle.textContent = data.title;
        policyModalBody.innerHTML = data.content;
        policyModal.classList.add('active');
      }
    });
  });

  if (policyModalClose && policyModal) {
    policyModalClose.addEventListener('click', () => {
      policyModal.classList.remove('active');
    });

    policyModal.addEventListener('click', (e) => {
      if (e.target === policyModal) {
        policyModal.classList.remove('active');
      }
    });
  }

  // ====================================================
  // 7. Scroll Animation (IntersectionObserver)
  // ====================================================
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in-view'));
  }

  // ====================================================
  // 8. Zero-Broken-Image Fallback Handler
  // ====================================================
  window.handleImgError = function (img, fallbackTitle) {
    if (!img) return;
    const parent = img.parentElement;
    if (parent) {
      img.style.display = 'none';
      const fallbackDiv = document.createElement('div');
      fallbackDiv.className = 'img-fallback-container';
      fallbackDiv.style.aspectRatio = img.getAttribute('width') && img.getAttribute('height') 
        ? `${img.getAttribute('width')}/${img.getAttribute('height')}` 
        : '4/3';
      fallbackDiv.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 0.5rem; opacity: 0.7;">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7.003 7.003 0 0 1 5.07 11H5a1 1 0 0 1 0-2h.07A7.003 7.003 0 0 1 11 3.07V3a1 1 0 0 1 2 0v.07A7.003 7.003 0 0 1 18.93 9H19a1 1 0 0 1 0 2h-.07A7.003 7.003 0 0 1 13 16.93z"/>
        </svg>
        <span style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 600;">${fallbackTitle || 'ROSHONA Organic Care'}</span>
      `;
      parent.appendChild(fallbackDiv);
    }
  };

})();
