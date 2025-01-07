import { addFeedbackSystem } from './feedback.js';

function addAnalytics() {
  const script = document.createElement('script');
  script.async = true;
  script.src = "https://analytics.umami.is/script.js";
  script.setAttribute('data-website-id', '25a7a9a8-359f-4f5f-a8a4-0ca1add617d9');
  document.head.appendChild(script);
}

function initializeGlobalWaitForUmami() {
  window.waitForUmami = function(callback, retries = 20) {
    if (window.umami) {
      callback();
    } else if (retries > 0) {
      setTimeout(() => window.waitForUmami(callback, retries - 1), 100);
    }
  };
}

function addTracking() {
  const track = (eventName, properties = {}) => {
    window.waitForUmami(() => {
      const formattedEvent = eventName.toLowerCase().replace(/\s+/g, '_');
      const data = {
        timestamp: Date.now(),
        page: window.location.pathname,
        ...properties
      };
      umami.track(formattedEvent, data);
    });
  };
  window.t = track;
}

function addFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p>
      <a href="https://lab.simonwisdom.com/favicon.ico">
        <img src="https://lab.simonwisdom.com/favicon.ico" alt="Favicon">
      </a>
      <a href="https://lab.simonwisdom.com">lab.simonwisdom.com</a>
    </p>
  `;

  function appendFooterAndFeedback() {
    document.body.appendChild(footer);
    addFeedbackSystem();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendFooterAndFeedback);
  } else {
    appendFooterAndFeedback();
  }
}

function addMetadata() {
  const defaultDescription = "lab.simonwisdom.com, a collection of single-page experiments.";
  
  if (!document.querySelector('meta[name="description"]')) {
    const metaDescription = document.createElement('meta');
    metaDescription.name = "description";
    metaDescription.content = defaultDescription;
    document.head.appendChild(metaDescription);
  }

  const metaRobots = document.createElement('meta');
  metaRobots.name = "robots";
  metaRobots.content = "index, follow";
  document.head.appendChild(metaRobots);
}

function addOpenGraphTags() {
  const defaultTitle = document.title || "Simon Wisdom";
  const defaultURL = window.location.href;
  const defaultImage = "https://lab.simonwisdom.com/favicon.ico";
  const defaultDescription = "Unique single-page experiments created with LLMs.";
  
  const ogTags = [
    { property: "og:title", content: defaultTitle },
    { property: "og:description", content: defaultDescription },
    { property: "og:url", content: defaultURL },
    { property: "og:type", content: "website" },
    { property: "og:image", content: defaultImage }
  ];

  ogTags.forEach(({ property, content }) => {
    if (!document.querySelector(`meta[property="${property}"]`)) {
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      metaTag.content = content;
      document.head.appendChild(metaTag);
    }
  });
}

function addTwitterCardTags() {
  const defaultCard = "summary";
  const defaultSite = "@simonwisdom";
  const defaultTitle = document.title || "Lab by Simon Wisdom";
  const defaultDescription = "Unique single-page experiments created with LLMs.";
  const defaultImage = "https://lab.simonwisdom.com/favicon.ico";
  
  const twitterTags = [
    { name: "twitter:card", content: defaultCard },
    { name: "twitter:site", content: defaultSite },
    { name: "twitter:title", content: defaultTitle },
    { name: "twitter:description", content: defaultDescription },
    { name: "twitter:image", content: defaultImage }
  ];

  twitterTags.forEach(({ name, content }) => {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('name', name);
      metaTag.content = content;
      document.head.appendChild(metaTag);
    }
  });
}

(function init() {
  addAnalytics();
  initializeGlobalWaitForUmami();
  addTracking();
  addStylesheet();
  addFooter();
  addMetadata();
  addOpenGraphTags();
  addTwitterCardTags();
})();