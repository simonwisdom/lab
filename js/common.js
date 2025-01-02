(function() {
  // Add analytics
  (function addAnalytics() {
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://analytics.umami.is/script.js";
    script.setAttribute('data-website-id', '25a7a9a8-359f-4f5f-a8a4-0ca1add617d9');
    document.head.appendChild(script);
  })();

  // Add stylesheet
  (function addStylesheet() {
    const stylesheet = document.createElement('link');
    stylesheet.rel = "stylesheet";
    stylesheet.href = "style.css";
    document.head.appendChild(stylesheet);
  })();

  // Add footer
  (function addFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <p>
        <a href="https://lab.simonwisdom.com/favicon.ico">
          <img src="https://lab.simonwisdom.com/favicon.ico" alt="Favicon">
        </a>
        <a href="https://lab.simonwisdom.com">lab.simonwisdom.com</a>
      </p>
    `;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(footer));
    } else {
      document.body.appendChild(footer);
    }
  })();

  // Add metadata
  (function addMetadata() {
    const defaultDescription = "lab.simonwisdom.com, a collection of single-page experiments.";
    
    // Add description meta tag if not already present
    if (!document.querySelector('meta[name="description"]')) {
      const metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      metaDescription.content = defaultDescription;
      document.head.appendChild(metaDescription);
    }

    // Add robots meta tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = "robots";
    metaRobots.content = "index, follow";
    document.head.appendChild(metaRobots);
  })();

  // Add Open Graph tags for social sharing
  (function addOpenGraphTags() {
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
  })();

  // Add Twitter Card tags
  (function addTwitterCardTags() {
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
  })();
})();