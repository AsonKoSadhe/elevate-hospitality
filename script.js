const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    nav.classList.toggle('is-open');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const form = document.getElementById('diagnostic-form');
const stepFields = Array.from(document.querySelectorAll('.form-step'));
const stepLabel = document.getElementById('step-label');
const progressFill = document.getElementById('progress-fill');
const resultBox = document.getElementById('form-result');

let currentStep = 0;

function updateFormStep() {
  stepFields.forEach((field, index) => {
    field.classList.toggle('active', index === currentStep);
  });

  const stepNumber = currentStep + 1;
  stepLabel.textContent = `STEP ${String(stepNumber).padStart(2, '0')} / ${String(stepFields.length).padStart(2, '0')}`;
  progressFill.style.width = `${((stepNumber) / stepFields.length) * 100}%`;
}

function validateStep(stepIndex) {
  const activeStep = stepFields[stepIndex];
  const inputs = Array.from(activeStep.querySelectorAll('input, select, textarea'));

  for (const input of inputs) {
    if (input.required && input.type !== 'checkbox' && !input.value.trim()) {
      input.focus();
      input.reportValidity();
      return false;
    }

    if (input.type === 'checkbox' && input.required && !input.checked) {
      input.focus();
      input.reportValidity();
      return false;
    }
  }

  if (stepIndex === 0) {
    const emailInput = activeStep.querySelector('input[type="email"]');
    if (emailInput && !emailInput.checkValidity()) {
      emailInput.focus();
      emailInput.reportValidity();
      return false;
    }
  }

  return true;
}

function gatherFormValues() {
  const formData = new FormData(form);
  const business = formData.get('business') || 'N/A';
  const type = formData.get('type') || 'N/A';
  const location = formData.get('location') || 'N/A';
  const name = formData.get('name') || 'N/A';
  const email = formData.get('email') || 'N/A';
  const issues = formData.getAll('issues');
  const problem = formData.get('problem') || 'N/A';
  const timing = formData.get('timing') || 'N/A';
  const notes = formData.get('notes') || 'No additional notes.';

  return {
    business,
    type,
    location,
    name,
    email,
    issues,
    problem,
    timing,
    notes,
  };
}

function buildResponseMessage() {
  const values = gatherFormValues();
  const issueList = values.issues.length ? values.issues.join(', ') : 'No specific area selected';

  return `Business inquiry from ELEVATE website\n\nBusiness Name: ${values.business}\nBusiness Type: ${values.type}\nLocation: ${values.location}\nContact Name: ${values.name}\nEmail: ${values.email}\nAreas under pressure: ${issueList}\nMain issue: ${values.problem}\nPreferred timing: ${values.timing}\nAdditional notes: ${values.notes}`;
}

form.addEventListener('click', (event) => {
  const nextButton = event.target.closest('.form-next');
  const backButton = event.target.closest('.back-button');

  if (nextButton) {
    if (!validateStep(currentStep)) return;
    currentStep = Math.min(currentStep + 1, stepFields.length - 1);
    updateFormStep();
  }

  if (backButton) {
    currentStep = Math.max(currentStep - 1, 0);
    updateFormStep();
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateStep(currentStep)) return;

  const message = buildResponseMessage();
  const resultHtml = `
    <h3>Inquiry ready to send</h3>
    <textarea readonly>${message}</textarea>
    <div class="result-actions">
      <button type="button" class="button button-primary" id="copy-message-btn">Copy message</button>
    </div>
  `;

  resultBox.innerHTML = resultHtml;
  resultBox.hidden = false;

  const copyButton = document.getElementById('copy-message-btn');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const textarea = resultBox.querySelector('textarea');
      if (!textarea) return;

      try {
        await navigator.clipboard.writeText(textarea.value);
        copyButton.textContent = 'Copied';
        setTimeout(() => {
          copyButton.textContent = 'Copy message';
        }, 1500);
      } catch (error) {
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied';
      }
    });
  }
});

updateFormStep();
