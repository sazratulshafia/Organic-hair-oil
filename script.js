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
  // 2. Smooth Scroll & CTA Event Triggers (Linked to CartFlows Checkout Form)
  // ====================================================
  const allOrderButtons = document.querySelectorAll(
    '[data-cta-scroll], a[href*="cartflows-order"], .header-order-btn, .sticky-cta-btn, a[href="#cartflows-order"]'
  );

  allOrderButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Close mobile navigation drawer if open
      if (navDrawer && navDrawer.classList.contains('open')) {
        navDrawer.classList.remove('open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }

      // Find CartFlows Checkout target element
      const target = 
        document.getElementById('cartflows-order') || 
        document.getElementById('cartflows-checkout-wrapper') ||
        document.getElementById('wcf-embed-checkout-form') ||
        document.querySelector('.wcf-embed-checkout-form') ||
        document.querySelector('.cartflows-section');

      if (target) {
        const headerOffset = 80;
        const targetRect = target.getBoundingClientRect();
        const targetTop = targetRect.top + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });

        // Update URL hash cleanly without causing page jump
        if (window.history && window.history.pushState) {
          window.history.pushState(null, null, '#cartflows-order');
        }

        // Focus first input field in CartFlows form after scroll completes
        setTimeout(() => {
          const firstField = target.querySelector(
            'input#billing_first_name, input[name="billing_first_name"], input#billing_phone, input[type="text"], input[type="tel"]'
          );
          if (firstField) {
            firstField.focus();
            target.style.transition = 'box-shadow 0.4s ease';
            target.style.boxShadow = '0 0 0 4px rgba(184, 148, 85, 0.45)';
            setTimeout(() => {
              target.style.boxShadow = '';
            }, 1200);
          }
        }, 650);

        logTrackingEvent('cta_click', {
          cta_label: btn.textContent.trim(),
          target_section: 'cartflows-order'
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
  // 5. CartFlows Checkout Preview & Integration
  // ====================================================
  const cfWrapper = document.getElementById('cartflows-checkout-wrapper');

  // In static preview sandbox (where WordPress PHP does not run),
  // render an interactive visual preview matching CartFlows step 149
  const cfShortcodeToken = '[' + 'cartflows_checkout' + ']';
  if (cfWrapper && cfWrapper.innerHTML.includes(cfShortcodeToken)) {
    cfWrapper.innerHTML = `
      <div id="wcf-embed-checkout-form" class="wcf-embed-checkout-form wcf-embed-checkout-form-modern-checkout wcf-field-default">
        <div class="woocommerce">
          <form name="checkout" method="post" class="checkout woocommerce-checkout" action="#">
            
            <!-- 1. Customer Information & Billing Details Card -->
            <div class="wcf-customer-info-main-wrapper">
              <div class="wcf-customer-info" id="customer_info">
                <h3 id="customer_information_heading">🌿 Customer information</h3>
                <div class="woocommerce-billing-fields__customer-info-wrapper">
                  <p class="form-row form-row-fill">
                    <label for="billing_email">Email Address (ঐচ্ছিক)</label>
                    <span class="woocommerce-input-wrapper">
                      <input type="email" class="input-text" name="billing_email" id="billing_email" placeholder="Email Address" />
                    </span>
                  </p>
                </div>
              </div>

              <div class="woocommerce-billing-fields">
                <h3 id="billing_fields_heading">📋 Billing details</h3>
                <div class="woocommerce-billing-fields__field-wrapper">
                  <p class="form-row form-row-wide validate-required" id="billing_first_name_field">
                    <label for="billing_first_name" class="required_field">সম্পূর্ণ নাম <span class="required">*</span></label>
                    <span class="woocommerce-input-wrapper">
                      <input type="text" class="input-text" name="billing_first_name" id="billing_first_name" placeholder="আপনার সম্পূর্ণ নাম লিখুন" required />
                    </span>
                  </p>
                  <p class="form-row form-row-wide address-field validate-required" id="billing_address_1_field">
                    <label for="billing_address_1" class="required_field">সম্পূর্ণ ঠিকানা <span class="required">*</span></label>
                    <span class="woocommerce-input-wrapper">
                      <input type="text" class="input-text" name="billing_address_1" id="billing_address_1" placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা, থানা ও জেলা" required />
                    </span>
                  </p>
                  <p class="form-row form-row-wide validate-required" id="billing_phone_field">
                    <label for="billing_phone" class="required_field">ফোন নম্বর <span class="required">*</span></label>
                    <span class="woocommerce-input-wrapper">
                      <input type="tel" class="input-text" name="billing_phone" id="billing_phone" placeholder="১১ ডিজিটের মোবাইল নম্বর লিখুন" required />
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <!-- 2. Shipping Methods Card -->
            <div class="wcf-customer-shipping">
              <div class="wcf-shipping-methods-wrapper">
                <h3 class="wcf-shipping-methods-title">🚚 Shipping</h3>
                <ul id="shipping_method" class="woocommerce-shipping-methods">
                  <li>
                    <input type="radio" name="shipping_method[0]" data-index="0" id="shipping_method_0_dhaka" value="flat_rate:1" class="shipping_method" checked />
                    <label for="shipping_method_0_dhaka">In Side Dhaka: <strong>৳৮০</strong></label>
                  </li>
                  <li>
                    <input type="radio" name="shipping_method[0]" data-index="0" id="shipping_method_0_outside" value="flat_rate:2" class="shipping_method" />
                    <label for="shipping_method_0_outside">Out Side Dhaka: <strong>৳১২০</strong></label>
                  </li>
                </ul>
              </div>
            </div>

            <!-- 3. Your Order Review Card -->
            <div class="wcf-order-wrap">
              <h3 id="order_review_heading">📦 Your order</h3>
              <div id="order_review" class="woocommerce-checkout-review-order">
                <table class="shop_table woocommerce-checkout-review-order-table cartflows_table">
                  <thead>
                    <tr>
                      <th class="product-name">Product</th>
                      <th class="product-total" style="text-align: right;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="cart_item">
                      <td class="product-name">
                        <strong>Roshona Rosemary Coconut Hair Oil</strong> &times;&nbsp;1
                      </td>
                      <td class="product-total" style="text-align: right;">
                        <span class="woocommerce-Price-amount amount">৳499</span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="cart-subtotal">
                      <th>Subtotal</th>
                      <td style="text-align: right;"><span class="woocommerce-Price-amount amount">৳499</span></td>
                    </tr>
                    <tr class="woocommerce-shipping-totals shipping">
                      <th>Shipping</th>
                      <td style="text-align: right;" id="wcf-preview-shipping">৳80</td>
                    </tr>
                    <tr class="order-total">
                      <th>Total</th>
                      <td style="text-align: right;"><strong><span class="woocommerce-Price-amount amount" id="wcf-preview-total">৳579</span></strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- 4. Payment & Place Order Card -->
            <div id="payment" class="woocommerce-checkout-payment">
              <h3 style="font-size: 1.3rem; font-weight: 700; color: #143525; margin-bottom: 1rem; border-bottom: 2px solid rgba(184, 148, 85, 0.25); padding-bottom: 0.5rem;">💵 Payment</h3>
              <ul class="wc_payment_methods payment_methods methods">
                <li class="wc_payment_method payment_method_cod">
                  <input id="payment_method_cod" type="radio" class="input-radio" name="payment_method" value="cod" checked="checked" />
                  <label for="payment_method_cod">Cash on delivery</label>
                  <div class="payment_box payment_method_cod">
                    <p>পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের ঝুঁকি নেই।</p>
                  </div>
                </li>
              </ul>
              <button type="submit" class="button alt" name="woocommerce_checkout_place_order" id="place_order" value="অর্ডার কনফার্ম করুন">
                <span>🛒</span> <span>অর্ডার কনফার্ম করুন (Place Order)</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    `;

    // Interactive Shipping calculation in preview
    const shipDhaka = document.getElementById('shipping_method_0_dhaka');
    const shipOutside = document.getElementById('shipping_method_0_outside');
    const previewShipping = document.getElementById('wcf-preview-shipping');
    const previewTotal = document.getElementById('wcf-preview-total');

    function updatePreviewTotal() {
      const isOutside = shipOutside && shipOutside.checked;
      const fee = isOutside ? 120 : 80;
      if (previewShipping) previewShipping.textContent = `৳${fee}`;
      if (previewTotal) previewTotal.textContent = `৳${499 + fee}`;
    }

    if (shipDhaka) shipDhaka.addEventListener('change', updatePreviewTotal);
    if (shipOutside) shipOutside.addEventListener('change', updatePreviewTotal);

    // Form submit preview handler (for static testing)
    const previewForm = cfWrapper.querySelector('form.checkout');
    if (previewForm) {
      previewForm.addEventListener('submit', (e) => {
        // If this is a real WooCommerce form on a live site, let WooCommerce handle it
        if (previewForm.getAttribute('action') && previewForm.getAttribute('action') !== '#') {
          return; // Let live WooCommerce process the order and redirect
        }

        e.preventDefault();
        const nameInput = document.getElementById('billing_first_name');
        const phoneInput = document.getElementById('billing_phone');
        const addrInput = document.getElementById('billing_address_1');

        if (!nameInput?.value.trim() || !phoneInput?.value.trim() || !addrInput?.value.trim()) {
          alert('⚠️ অনুগ্রহ করে আপনার নাম, সচল মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা পূরণ করুন।');
          return;
        }

        const modal = document.getElementById('order-modal');
        const details = document.getElementById('modal-receipt-details');
        if (details) {
          details.innerHTML = `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 0.95rem; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;"><strong>গ্রাহকের নাম:</strong> ${escapeHtml(nameInput.value)}</p>
              <p style="margin: 0 0 6px 0;"><strong>মোবাইল নম্বর:</strong> ${escapeHtml(phoneInput.value)}</p>
              <p style="margin: 0 0 6px 0;"><strong>ডেলিভারি ঠিকানা:</strong> ${escapeHtml(addrInput.value)}</p>
              <p style="margin: 0 0 6px 0;"><strong>প্রডাক্ট:</strong> Roshona Rosemary Coconut Hair Oil × 1</p>
              <p style="margin: 0; font-size: 1.1rem; color: #183A2A;"><strong>সর্বমোট প্রদেয় বিল (COD): ${previewTotal?.textContent || '৳579'}</strong></p>
            </div>
          `;
        }
        if (modal) modal.classList.add('active');
      });
    }
  }

  // ====================================================
  // 6. Universal CartFlows & WooCommerce Mobile Checkout Fix
  // Fixes "No shipping method has been selected" & ensures auto-redirect to Thank You page
  // ====================================================
  function fixWooCommerceCheckoutPayload() {
    const allCheckoutForms = document.querySelectorAll('form.checkout, form.woocommerce-checkout');
    allCheckoutForms.forEach(form => {
      // 1. Ensure Country is always passed as BD (Bangladesh)
      let bCountry = form.querySelector('input[name="billing_country"]');
      if (!bCountry) {
        bCountry = document.createElement('input');
        bCountry.type = 'hidden';
        bCountry.name = 'billing_country';
        bCountry.id = 'billing_country';
        form.appendChild(bCountry);
      }
      bCountry.value = 'BD';

      let sCountry = form.querySelector('input[name="shipping_country"]');
      if (!sCountry) {
        sCountry = document.createElement('input');
        sCountry.type = 'hidden';
        sCountry.name = 'shipping_country';
        sCountry.id = 'shipping_country';
        form.appendChild(sCountry);
      }
      sCountry.value = 'BD';

      // 2. Ensure default City is passed
      let bCity = form.querySelector('input[name="billing_city"]');
      if (!bCity) {
        bCity = document.createElement('input');
        bCity.type = 'hidden';
        bCity.name = 'billing_city';
        bCity.id = 'billing_city';
        bCity.value = 'Dhaka';
        form.appendChild(bCity);
      } else if (!bCity.value) {
        bCity.value = 'Dhaka';
      }

      // 3. Ensure Cash on Delivery (COD) is selected
      let codRadio = form.querySelector('input[name="payment_method"][value="cod"]');
      if (codRadio && !codRadio.checked) {
        codRadio.checked = true;
      }

      // 4. Ensure Shipping Method is ALWAYS present and selected
      const shippingRadios = form.querySelectorAll('input[name^="shipping_method"]');
      let isShippingChecked = false;
      shippingRadios.forEach(radio => {
        if (radio.checked) isShippingChecked = true;
      });

      if (!isShippingChecked && shippingRadios.length > 0) {
        shippingRadios[0].checked = true;
        shippingRadios[0].dispatchEvent(new Event('change', { bubbles: true }));
      } else if (shippingRadios.length === 0) {
        // If WooCommerce shipping options failed to render, inject default shipping method
        let fallbackShip = form.querySelector('input[name="shipping_method[0]"]');
        if (!fallbackShip) {
          fallbackShip = document.createElement('input');
          fallbackShip.type = 'hidden';
          fallbackShip.name = 'shipping_method[0]';
          fallbackShip.value = 'flat_rate:1';
          form.appendChild(fallbackShip);
        }
      }
    });
  }

  // Run on page load, intervals, and checkout submit
  document.addEventListener('DOMContentLoaded', fixWooCommerceCheckoutPayload);
  window.addEventListener('load', fixWooCommerceCheckoutPayload);
  setInterval(fixWooCommerceCheckoutPayload, 1200);

  // Capture checkout submit before WooCommerce validates
  document.addEventListener('submit', function (e) {
    const form = e.target.closest('form.checkout');
    if (form) {
      fixWooCommerceCheckoutPayload();
    }
  }, true);

  // Hook into WooCommerce jQuery events if present on live WordPress
  if (typeof window !== 'undefined' && window.jQuery) {
    window.jQuery(document.body).on('updated_checkout init_checkout checkout_error', function () {
      fixWooCommerceCheckoutPayload();
    });
  }

  const orderModal = document.getElementById('order-modal');
  const orderModalClose = document.getElementById('order-modal-close');
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
