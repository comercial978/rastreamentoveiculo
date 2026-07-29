(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-2Z3FZN92YD';
  var ALLOWED_HOSTNAMES = [
    'rastreamentoveiculo.com.br',
    'www.rastreamentoveiculo.com.br'
  ];
  var hostname = window.location.hostname.toLowerCase();

  // Keep local development and preview traffic out of the production property.
  if (ALLOWED_HOSTNAMES.indexOf(hostname) === -1) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);

  var googleTag = document.createElement('script');
  googleTag.async = true;
  googleTag.src = 'https://www.googletagmanager.com/gtag/js?id=' +
    encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(googleTag);

  function cleanText(value, maxLength) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength || 100);
  }

  function getPageType() {
    var path = window.location.pathname.toLowerCase();

    if (path === '/' || path.endsWith('/index.html')) return 'home';
    if (path.endsWith('/404.html')) return 'not_found';
    if (path.endsWith('/planos.html')) return 'plans';
    if (path.endsWith('/faq.html')) return 'faq';
    if (path.endsWith('/blog.html')) return 'blog_index';
    if (path.indexOf('/blog/') !== -1) return 'blog_article';
    if (path.indexOf('uberaba') !== -1) return 'local_service';
    if (path.indexOf('quem-somos') !== -1) return 'institutional';
    return 'service';
  }

  function getCtaLocation(element) {
    if (element.closest('.whatsapp-float')) return 'floating_button';
    if (element.closest('.mobile-menu')) return 'mobile_menu';
    if (element.closest('nav, .navbar')) return 'navigation';
    if (element.closest('.hero')) return 'hero';
    if (element.closest('.plan-card')) return 'plan_card';
    if (element.closest('article')) return 'article';
    if (element.closest('footer')) return 'footer';

    var section = element.closest('section[id]');
    if (section) return cleanText(section.id, 40);

    return element.closest('main') ? 'main_content' : 'other';
  }

  function getPlanName(element) {
    var planCard = element.closest('.plan-card');
    if (!planCard) return '';

    var title = planCard.querySelector('h2, h3, .plan-name');
    return cleanText(title ? title.textContent : '', 100);
  }

  function getCtaText(element) {
    return cleanText(
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.textContent,
      100
    );
  }

  function sendEvent(eventName, parameters) {
    window.gtag('event', eventName, Object.assign({
      page_type: getPageType()
    }, parameters || {}));
  }

  function trackLead(contactMethod, element) {
    var parameters = {
      contact_method: contactMethod,
      cta_location: getCtaLocation(element),
      cta_text: getCtaText(element)
    };
    var planName = getPlanName(element);

    if (planName) parameters.plan_name = planName;

    sendEvent(contactMethod + '_click', parameters);
    sendEvent('generate_lead', Object.assign({
      lead_source: contactMethod
    }, parameters));
  }

  function trackLinkClick(event) {
    var link = event.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var normalizedHref = href.toLowerCase();
    var planName = getPlanName(link);

    if (planName) {
      sendEvent('select_plan', {
        plan_name: planName,
        cta_location: getCtaLocation(link),
        cta_text: getCtaText(link)
      });
    }

    if (
      normalizedHref.indexOf('wa.me/') !== -1 ||
      normalizedHref.indexOf('api.whatsapp.com/') !== -1
    ) {
      trackLead('whatsapp', link);
      return;
    }

    if (normalizedHref.indexOf('tel:') === 0) {
      trackLead('phone', link);
      return;
    }

    if (normalizedHref.indexOf('instagram.com/') !== -1) {
      sendEvent('instagram_click', {
        cta_location: getCtaLocation(link),
        cta_text: getCtaText(link)
      });
    }
  }

  function trackPlanViews() {
    var planCards = Array.prototype.slice.call(
      document.querySelectorAll('.plan-card')
    );
    if (!planCards.length) return;

    function sendPlanView(planCard) {
      var title = planCard.querySelector('h2, h3, .plan-name');
      var planName = cleanText(title ? title.textContent : '', 100);
      if (!planName || planCard.dataset.analyticsPlanViewed === 'true') return;

      planCard.dataset.analyticsPlanViewed = 'true';
      sendEvent('view_plan', {
        plan_name: planName,
        cta_location: 'plan_card'
      });
    }

    if (!('IntersectionObserver' in window)) {
      planCards.forEach(sendPlanView);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sendPlanView(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    planCards.forEach(function (planCard) {
      observer.observe(planCard);
    });
  }

  document.addEventListener('click', trackLinkClick);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPlanViews);
  } else {
    trackPlanViews();
  }
})();
