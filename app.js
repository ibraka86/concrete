// Configuration constants
const CONFIG = {
  BLOCK_FACE_LENGTH_IN: 16,                   // nominal including joint
  BLOCK_FACE_HEIGHT_IN: 8,                    // nominal including joint
  MORTAR_JOINT_IN: 0.375,                     // default 3/8"
  BLOCK_FACE_AREA_FT2: (16*8)/144,            // 0.888888...
  WASTE_PCT: 0.05,
  MORTAR_BAGS_PER_100_BLOCKS: 7,              // tunable 5–10
  SAND_TONS_PER_MORTAR_BAG: 0.003,            // tune to match field rules
  REBAR_STICK_LEN_FT: 10,                     // round purchases to 10' multiples
  GROUT_FACTOR_YD3_PER_100FT2: {6:0.93, 8:1.12, 12:1.65},
  VERMICULITE_BAG_YIELD_FT3: 4,
  ADD_HALF_YARD_TO_GROUT: true,
  ADD_HALF_YARD_TO_SAND: false
};

// DOM elements
let formElements = {};
let resultElements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeDOM();
  initializeEventListeners();
  loadSavedInputs();
  setupFAQAccordion();
  injectFAQJsonLD();
  updateFooterYear();
});

function initializeDOM() {
  // Cache form elements
  formElements = {
    form: document.getElementById('calc-form'),
    length: document.getElementById('length'),
    height: document.getElementById('height'),
    thickness: document.getElementById('thickness'),
    mortarJoint: document.getElementById('mortarJoint'),
    spacing: document.querySelectorAll('input[name="spacing"]'),
    waste: document.getElementById('waste'),
    fillCells: document.getElementById('fillCells'),
    useVermiculite: document.getElementById('useVermiculite')
  };

  // Cache result elements
  resultElements = {
    container: document.getElementById('results'),
    content: document.getElementById('results-content'),
    actions: document.querySelector('.result-actions'),
    printBtn: document.getElementById('printBtn'),
    copyBtn: document.getElementById('copyBtn'),
    shareBtn: document.getElementById('shareBtn')
  };
}

function initializeEventListeners() {
  // Form submission
  if (formElements.form) {
    formElements.form.addEventListener('submit', handleFormSubmit);
  }
  
  // Input changes with debouncing
  const inputs = [
    formElements.length,
    formElements.height,
    formElements.thickness,
    formElements.mortarJoint,
    formElements.waste,
    formElements.fillCells,
    formElements.useVermiculite
  ];
  
  inputs.forEach(input => {
    if (input) {
      input.addEventListener('input', debounce(handleInputChange, 300));
      input.addEventListener('change', handleInputChange);
    }
  });
  
  // Radio buttons
  if (formElements.spacing) {
    formElements.spacing.forEach(radio => {
      radio.addEventListener('change', handleInputChange);
    });
  }
  
  // Result actions
  if (resultElements.printBtn) {
    resultElements.printBtn.addEventListener('click', handlePrint);
  }
  if (resultElements.copyBtn) {
    resultElements.copyBtn.addEventListener('click', handleCopyResults);
  }
  if (resultElements.shareBtn) {
    resultElements.shareBtn.addEventListener('click', handleShareLink);
  }
  
  // Mutual exclusion for fill options
  if (formElements.fillCells && formElements.useVermiculite) {
    formElements.fillCells.addEventListener('change', function() {
      if (this.checked) {
        formElements.useVermiculite.checked = false;
      }
    });
    
    formElements.useVermiculite.addEventListener('change', function() {
      if (this.checked) {
        formElements.fillCells.checked = false;
      }
    });
  }
  
  // Load inputs from URL parameters
  loadFromURLParams();

  // Setup navigation dropdowns
  setupDropdowns();

  // Setup mobile burger menu
  setupMobileMenu();
}

function setupMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  
  if (!toggle || !nav) return;
  
  toggle.addEventListener('click', function() {
    const isActive = nav.classList.toggle('active');
    toggle.classList.toggle('active');
    toggle.setAttribute('aria-expanded', isActive);
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !nav.contains(e.target) && nav.classList.contains('active')) {
      nav.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function setupDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    
    toggle.addEventListener('click', function(e) {
      if (window.innerWidth <= 991) {
        e.preventDefault();
        dropdown.classList.toggle('active');
        const expanded = dropdown.classList.contains('active');
        this.setAttribute('aria-expanded', expanded);
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      dropdowns.forEach(d => {
        d.classList.remove('active');
        const toggle = d.querySelector('.dropdown-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

function handleFormSubmit(e) {
  e.preventDefault();
  calculateMaterials();
}

function handleInputChange() {
  clearValidationErrors();
  if (validateInputs()) {
    calculateMaterials();
    saveInputs();
  }
}

function validateInputs() {
  let isValid = true;
  
  // Length validation
  const length = parseFloat(formElements.length.value);
  if (!length || length <= 0) {
    showError('length-error', 'Please enter a valid wall length');
    isValid = false;
  }
  
  // Height validation
  const height = parseFloat(formElements.height.value);
  if (!height || height <= 0) {
    showError('height-error', 'Please enter a valid wall height');
    isValid = false;
  }
  
  return isValid;
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function clearValidationErrors() {
  const errors = document.querySelectorAll('.error-message');
  errors.forEach(error => {
    error.textContent = '';
    error.style.display = 'none';
  });
}

function calculateMaterials() {
  try {
    const inputs = getInputValues();
    if (!inputs) return;
    
    const results = performCalculations(inputs);
    displayResults(results, inputs);
    resultElements.actions.style.display = 'flex';
  } catch (error) {
    console.error('Calculation error:', error);
    showCalculationError();
  }
}

function getInputValues() {
  const length = parseFloat(formElements.length.value);
  const height = parseFloat(formElements.height.value);
  const thickness = parseInt(formElements.thickness.value);
  const mortarJoint = parseFloat(formElements.mortarJoint.value) || CONFIG.MORTAR_JOINT_IN;
  const waste = parseFloat(formElements.waste.value) / 100 || CONFIG.WASTE_PCT;
  
  let spacing = 24; // default
  formElements.spacing.forEach(radio => {
    if (radio.checked) spacing = parseInt(radio.value);
  });
  
  const fillCells = formElements.fillCells.checked;
  const useVermiculite = formElements.useVermiculite.checked;
  
  if (!length || !height || length <= 0 || height <= 0) {
    return null;
  }
  
  return {
    length,
    height,
    thickness,
    mortarJoint,
    spacing,
    waste,
    fillCells,
    useVermiculite
  };
}

function performCalculations(inputs) {
  const area = inputs.length * inputs.height;
  
  // Blocks calculation
  const blocksRaw = area / CONFIG.BLOCK_FACE_AREA_FT2;
  const blocksBuy = Math.ceil(blocksRaw * (1 + inputs.waste));
  
  // Mortar bags calculation
  const mortarBagsRaw = (CONFIG.MORTAR_BAGS_PER_100_BLOCKS / 100) * blocksRaw;
  const mortarBagsBuy = Math.max(1, Math.ceil(mortarBagsRaw * (1 + inputs.waste)));
  
  // Sand calculation
  const sandRawTons = CONFIG.SAND_TONS_PER_MORTAR_BAG * mortarBagsRaw;
  const sandBuyTons = round2(sandRawTons * (1 + inputs.waste));
  
  // Horizontal reinforcing calculation
  const runs = Math.ceil((inputs.height * 12) / inputs.spacing);
  const lfRaw = runs * inputs.length;
  const lfBuy = round2(lfRaw * (1 + inputs.waste));
  const lfSticks10ft = Math.ceil(lfBuy / CONFIG.REBAR_STICK_LEN_FT);
  
  // Block fill calculations
  let groutResults = null;
  let vermiculiteResults = null;
  
  if (inputs.fillCells) {
    const factor = CONFIG.GROUT_FACTOR_YD3_PER_100FT2[inputs.thickness];
    const groutYd3Raw = area * (factor / 100);
    const groutYd3Show = round2(groutYd3Raw + (CONFIG.ADD_HALF_YARD_TO_GROUT ? 0.5 : 0));
    
    groutResults = {
      raw: groutYd3Raw,
      buy: groutYd3Show
    };
    
    if (inputs.useVermiculite) {
      const volFt3 = groutYd3Raw * 27;
      const vermBags = Math.max(1, Math.ceil(volFt3 / CONFIG.VERMICULITE_BAG_YIELD_FT3 * (1 + inputs.waste)));
      
      vermiculiteResults = {
        bags: vermBags,
        volFt3: volFt3
      };
    }
  }
  
  return {
    area,
    blocks: { raw: blocksRaw, buy: blocksBuy },
    mortar: { raw: mortarBagsRaw, buy: mortarBagsBuy },
    sand: { raw: sandRawTons, buy: sandBuyTons },
    reinforcing: { raw: lfRaw, buy: lfBuy, sticks: lfSticks10ft, runs },
    grout: groutResults,
    vermiculite: vermiculiteResults
  };
}

function displayResults(results, inputs) {
  const html = `
    <div class="results-grid">
      <div class="result-item">
        <div class="result-label">Concrete Blocks (8×8×16)</div>
        <div class="result-value">${results.blocks.buy} blocks</div>
        <div class="result-raw">Raw calculation: ${round2(results.blocks.raw)} blocks</div>
        <div class="result-note">Includes ${(inputs.waste * 100).toFixed(0)}% waste allowance</div>
      </div>
      
      <div class="result-item">
        <div class="result-label">Mortar Bags (Masonry Cement)</div>
        <div class="result-value">${results.mortar.buy} bags</div>
        <div class="result-raw">Raw calculation: ${round2(results.mortar.raw)} bags</div>
        <div class="result-note">Based on ~7 bags per 100 blocks</div>
      </div>
      
      <div class="result-item">
        <div class="result-label">Sand</div>
        <div class="result-value">${results.sand.buy} tons</div>
        <div class="result-raw">Raw calculation: ${round2(results.sand.raw)} tons</div>
        <div class="result-note">${CONFIG.ADD_HALF_YARD_TO_SAND ? 'Consider adding ½ yard for small pours' : ''}</div>
      </div>
      
      <div class="result-item">
        <div class="result-label">Horizontal Reinforcement (${inputs.spacing}" O.C.)</div>
        <div class="result-value">${results.reinforcing.buy} LF</div>
        <div class="result-raw">${results.reinforcing.sticks} sticks (10' each) • ${results.reinforcing.runs} runs</div>
        <div class="result-note">Ladder or truss reinforcement</div>
      </div>
      
      ${results.grout ? `
        <div class="result-item">
          <div class="result-label">${inputs.useVermiculite ? 'Grout Volume (for vermiculite calc)' : 'Grout Fill'}</div>
          <div class="result-value">${results.grout.buy} yd³</div>
          <div class="result-raw">Raw calculation: ${round2(results.grout.raw)} yd³</div>
          <div class="result-note">${CONFIG.ADD_HALF_YARD_TO_GROUT ? 'Includes ½ yard extra for small pours' : ''}</div>
        </div>
      ` : ''}
      
      ${results.vermiculite ? `
        <div class="result-item">
          <div class="result-label">Vermiculite/Zonolite Fill</div>
          <div class="result-value">${results.vermiculite.bags} bags</div>
          <div class="result-raw">Volume: ${round2(results.vermiculite.volFt3)} ft³</div>
          <div class="result-note">Based on 4 ft³ per bag coverage</div>
        </div>
      ` : ''}
    </div>
    
    <div class="calculation-summary">
      <h3>Project Summary</h3>
      <p><strong>Wall Dimensions:</strong> ${inputs.length}' × ${inputs.height}' = ${round2(results.area)} ft²</p>
      <p><strong>Block Type:</strong> ${inputs.thickness}" CMU with ${inputs.mortarJoint}" mortar joints</p>
      <p><strong>Reinforcement:</strong> ${inputs.spacing}" on center spacing</p>
      <p><strong>Fill:</strong> ${inputs.fillCells ? (inputs.useVermiculite ? 'Vermiculite/Zonolite' : 'Concrete grout') : 'None (hollow)'}</p>
      <p><strong>Waste Factor:</strong> ${(inputs.waste * 100).toFixed(0)}%</p>
    </div>
  `;
  
  resultElements.content.innerHTML = html;
  
  // Google Analytics 4 event tracking - fires after successful calculation
  if (typeof gtag === "function") {
    gtag('event', 'calculation_performed', {
      event_category: 'Calculator',
      event_label: 'Concrete Block',
      wall_area_ft2: inputs.length * inputs.height,
      block_thickness_in: inputs.thickness
    });
  }
}

function showCalculationError() {
  resultElements.content.innerHTML = `
    <div class="error-message" style="display: block; text-align: center; padding: 2rem;">
      <p>Unable to calculate materials. Please check your inputs and try again.</p>
    </div>
  `;
}

function handlePrint() {
  window.print();
}

function handleCopyResults() {
  const resultsText = extractResultsAsText();
  
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(resultsText).then(() => {
      showCopyFeedback('Results copied to clipboard!');
    }).catch(() => {
      fallbackCopyText(resultsText);
    });
  } else {
    fallbackCopyText(resultsText);
  }
}

function extractResultsAsText() {
  const results = resultElements.content;
  const items = results.querySelectorAll('.result-item');
  const summary = results.querySelector('.calculation-summary');
  
  let text = 'CONCRETE BLOCK CALCULATOR RESULTS\n';
  text += '=====================================\n\n';
  
  items.forEach(item => {
    const label = item.querySelector('.result-label')?.textContent || '';
    const value = item.querySelector('.result-value')?.textContent || '';
    const raw = item.querySelector('.result-raw')?.textContent || '';
    text += `${label}: ${value}\n`;
    if (raw) text += `  ${raw}\n`;
    text += '\n';
  });
  
  if (summary) {
    text += summary.textContent.replace(/\s+/g, ' ').trim();
  }
  
  text += '\n\nGenerated by concreteblockcalculator.com';
  return text;
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    document.execCommand('copy');
    showCopyFeedback('Results copied to clipboard!');
  } catch (err) {
    showCopyFeedback('Unable to copy. Please select and copy manually.');
    textArea.style.opacity = '1';
    textArea.style.position = 'static';
  }
  
  setTimeout(() => {
    document.body.removeChild(textArea);
  }, 2000);
}

function showCopyFeedback(message) {
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    z-index: 1000;
    font-weight: 500;
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 300);
  }, 2000);
}

function handleShareLink() {
  const params = new URLSearchParams();
  const inputs = getInputValues();
  
  if (inputs) {
    params.set('length', inputs.length);
    params.set('height', inputs.height);
    params.set('thickness', inputs.thickness);
    params.set('spacing', inputs.spacing);
    params.set('waste', inputs.waste * 100);
    if (inputs.fillCells) params.set('fill', '1');
    if (inputs.useVermiculite) params.set('vermiculite', '1');
  }
  
  const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Concrete Block Calculator Results',
      url: shareUrl
    }).catch(() => {
      copyToClipboard(shareUrl);
    });
  } else {
    copyToClipboard(shareUrl);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback('Share link copied to clipboard!');
    });
  }
}

function loadFromURLParams() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('length') && formElements.length) formElements.length.value = params.get('length');
  if (params.has('height') && formElements.height) formElements.height.value = params.get('height');
  if (params.has('thickness') && formElements.thickness) formElements.thickness.value = params.get('thickness');
  if (params.has('spacing') && formElements.spacing) {
    const spacing = params.get('spacing');
    formElements.spacing.forEach(radio => {
      radio.checked = radio.value === spacing;
    });
  }
  if (params.has('waste') && formElements.waste) formElements.waste.value = params.get('waste');
  if (params.has('fill') && formElements.fillCells) formElements.fillCells.checked = true;
  if (params.has('vermiculite') && formElements.useVermiculite) formElements.useVermiculite.checked = true;
  
  // Calculate if we have valid inputs
  if (params.has('length') && params.has('height') && formElements.length && formElements.height) {
    setTimeout(() => {
      if (validateInputs()) {
        calculateMaterials();
      }
    }, 100);
  }
}

function saveInputs() {
  const inputs = getInputValues();
  if (inputs) {
    localStorage.setItem('concretecalc_inputs', JSON.stringify(inputs));
  }
}

function loadSavedInputs() {
  // Don't load saved inputs if URL params are present
  if (window.location.search) return;
  
  try {
    const saved = localStorage.getItem('concretecalc_inputs');
    if (saved) {
      const inputs = JSON.parse(saved);
      
      if (inputs.length && formElements.length) formElements.length.value = inputs.length;
      if (inputs.height && formElements.height) formElements.height.value = inputs.height;
      if (inputs.thickness && formElements.thickness) formElements.thickness.value = inputs.thickness;
      if (inputs.spacing && formElements.spacing) {
        formElements.spacing.forEach(radio => {
          radio.checked = radio.value == inputs.spacing;
        });
      }
      if (inputs.waste !== undefined && formElements.waste) formElements.waste.value = inputs.waste * 100;
      if (inputs.fillCells !== undefined && formElements.fillCells) formElements.fillCells.checked = inputs.fillCells;
      if (inputs.useVermiculite !== undefined && formElements.useVermiculite) formElements.useVermiculite.checked = inputs.useVermiculite;
    }
  } catch (error) {
    console.warn('Could not load saved inputs:', error);
  }
}

function setupFAQAccordion() {
  const faqButtons = document.querySelectorAll('.faq-question');
  
  faqButtons.forEach(button => {
    button.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const answerId = this.getAttribute('aria-controls');
      const answer = document.getElementById(answerId);
      
      // Close all other FAQs
      faqButtons.forEach(otherButton => {
        if (otherButton !== this) {
          otherButton.setAttribute('aria-expanded', 'false');
          const otherAnswerId = otherButton.getAttribute('aria-controls');
          const otherAnswer = document.getElementById(otherAnswerId);
          if (otherAnswer) {
            otherAnswer.classList.remove('show');
          }
        }
      });
      
      // Toggle current FAQ
      this.setAttribute('aria-expanded', !expanded);
      if (answer) {
        answer.classList.toggle('show', !expanded);
      }
    });
  });
}

function injectFAQJsonLD() {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How many 8×8×16 blocks do I need per square foot?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "About 1.125 blocks/ft² (one block covers ~0.889 ft² including mortar joints)."
        }
      },
      {
        "@type": "Question",
        "name": "How do you calculate mortar for concrete block?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We estimate bags per 100 blocks (default 7) and round up; you can't buy partial bags."
        }
      },
      {
        "@type": "Question",
        "name": "What's the difference between 6″, 8″, and 12″ CMU in fill volume?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We use typical grout factors per 100 ft²: 0.93 yd³ (6″), 1.12 yd³ (8″), 1.65 yd³ (12″)."
        }
      },
      {
        "@type": "Question",
        "name": "How much sand do I need for block mortar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We derive sand from mortar bags using a tunable tons-per-bag rule of thumb."
        }
      },
      {
        "@type": "Question",
        "name": "How often should I place ladder/truss reinforcement?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Commonly every 16″ or 24″ vertically; we multiply runs by wall length and add waste."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to add extra for waste?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, default 5% for breakage and cuts. You can adjust this in the calculator."
        }
      },
      {
        "@type": "Question",
        "name": "Should I add a half yard to grout or sand?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Many contractors add ½ yard for small pours. Toggle this option to match your practice."
        }
      },
      {
        "@type": "Question",
        "name": "Are these results a professional specification?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No—this is an estimator. Verify with your supplier, engineer, or local code."
        }
      }
    ]
  };
  
  const script = document.getElementById('faq-jsonld');
  if (script) {
    script.textContent = JSON.stringify(faqData, null, 2);
  }
}

function updateFooterYear() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Utility functions
function round2(num) {
  return Math.round(num * 100) / 100;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}