// components.js
(function() {
    // Add analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://analytics.umami.is/script.js";
    script.setAttribute('data-website-id', '25a7a9a8-359f-4f5f-a8a4-0ca1add617d9');
    document.head.appendChild(script);
  
    // Add stylesheet
    const stylesheet = document.createElement('link');
    stylesheet.rel = "stylesheet";
    stylesheet.href = "style.css";
    document.head.appendChild(stylesheet);
  
    // Add footer
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <p>
        <a href="https://lab.simonwisdom.com/favicon.ico">
          <img src="https://lab.simonwisdom.com/favicon.ico" alt="Favicon" style="width:16px; height:16px; vertical-align:middle;">
        </a>
        <a href="https://lab.simonwisdom.com">lab.simonwisdom.com</a>
      </p>
    `;
    // Wait for DOM to be ready before adding footer
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(footer));
    } else {
      document.body.appendChild(footer);
    }
  })();