export function addFeedbackSystem() {
    const styles = document.createElement('style');
    styles.textContent = `
      .feedback-modal {
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 8px;
        border: var(--border-organic);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        width: 90%;
        max-width: 500px;
        z-index: 1000;
      }
  
      .feedback-modal.active {
        display: block;
        animation: modalIn 0.3s ease-out;
      }
  
      .modal-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
      }
  
      .modal-overlay.active {
        display: block;
      }
  
      @keyframes modalIn {
        from { opacity: 0; transform: translate(-50%, -48%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
      }
  
      .feedback-modal .close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        cursor: pointer;
        font-size: 1.5rem;
        line-height: 1;
      }
    `;
    document.head.appendChild(styles);

    // Add modal HTML
    const modalHtml = `
      <div class="modal-overlay"></div>
      <div class="feedback-modal">
        <span class="close">&times;</span>
        <h2>Send Feedback</h2>
        <textarea class="form-control mb-2" placeholder="What's on your mind?" rows="4"></textarea>
        <input type="email" class="form-control mb-2" placeholder="Email (optional)">
        <button class="btn">Send Feedback</button>
        <div class="status"></div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add button to footer
    const footerLink = document.querySelector('footer p');
    const feedbackBtn = document.createElement('button');
    feedbackBtn.className = 'text-gray-400 hover:text-gray-600 transition-colors';
    feedbackBtn.style.cssText = `
  background: none;
  padding: 0;
  width: 16px;
  height: 16px;
  border: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
`;
    feedbackBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2 .5 3M9 18h6M10 22h4"/></svg>';

    footerLink.appendChild(feedbackBtn);

    // Setup handlers
    const modal = document.querySelector('.feedback-modal');
    const overlay = document.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.close');
    const textarea = modal.querySelector('textarea');
    const emailInput = modal.querySelector('input[type="email"]');
    const submitBtn = modal.querySelector('.btn');
    const status = modal.querySelector('.status');

    function showModal() {
        modal.classList.add('active');
        overlay.classList.add('active');
        textarea.focus();
        t('feedback_modal_opened', { page: window.location.pathname });
    }

    function hideModal() {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        textarea.value = '';
        emailInput.value = '';
        status.textContent = '';
    }

    async function submitFeedback() {
        const text = textarea.value.trim();
        if (!text) return;

        submitBtn.disabled = true;
        status.textContent = 'Sending...';

        try {
            const response = await fetch('https://lab-proxy.vercel.app/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Feedback: ${document.title}`,
                    body: [
                        `Feedback: ${text}`,
                        `Email: ${emailInput.value || 'Not provided'}`,
                        `Page: ${window.location.href}`,
                        `User Agent: ${navigator.userAgent}`,
                        `Time: ${new Date().toISOString()}`
                    ].join('\n'),
                    labels: ['feedback']
                })
            });

            if (!response.ok) throw new Error('Failed to send feedback');

            t('feedback_submitted', {
                has_email: Boolean(emailInput.value),
                feedback_length: text.length
            });

            status.textContent = 'Thanks for your feedback!';
            setTimeout(hideModal, 2000);
        } catch (error) {
            status.textContent = 'Error sending feedback. Please try again.';
            submitBtn.disabled = false;
        }
    }

    feedbackBtn.addEventListener('click', showModal);
    closeBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', hideModal);
    submitBtn.addEventListener('click', submitFeedback);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            hideModal();
        }
    });
}