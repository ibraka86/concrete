// Retaining Wall Block Calculator JavaScript

// Configuration constants
const CONFIG = {
  BLOCK_DIMENSIONS: {
    standard: { length: 12, height: 8, face_area: 0.667 }, // in inches and ft²
    large: { length: 18, height: 8, face_area: 1.0 },
    small: { length: 12, height: 6, face_area: 0.5 }
  },
  BASE_GRAVEL_DEPTH_MIN: 6, // inches
  WASTE_PCT: 0.05
};

// DOM elements
let formElements = {};
let resultElements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeDOM();
  initializeEventListeners();
  setupFAQAccordion();
  injectFAQJsonLD();
  updateFooterYear();
});

function initializeDOM() {
  formElements = {
    form: document.getElementById('calc-form'),
    length: document.getElementById('length'),
    height: document.getElementById('height'),
    blockType: document.getElementById('blockType'),
    wallType: document.getElementById('wallType'),
    batter: document.getElementById('batter'),
    waste: document.getElementById('waste'),
    includeBase: document.getElementById('includeBase'),
    includeCap: document.getElementById('includeCap')
  };

  resultElements = {
    container: document.getElementById('results'),
    content: document.getElementById('results-content'),
    actions: document.querySelector('.result-actions'),
    printBtn: document.getElementById('printBtn'),
    copyBtn: document.getElementById('copyBtn')
  };
}

function initializeEventListeners() {
  formElements.form.addEventListener('submit', handleFormSubmit);
  
  if (resultElements.printBtn) {
    resultElements.printBtn.addEventListener('click', handlePrint);
  }
  if (resultElements.copyBtn) {
    resultElements.copyBtn.addEventListener('click', handleCopyResults);
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const length = parseFloat(formElements.length.value);
  const height = parseFloat(formElements.height.value);
  const blockType = formElements.blockType.value;
  const wallType = formElements.wallType.value;
  const batter = parseFloat(formElements.batter.value);
  const waste = parseFloat(formElements.waste.value) / 100;
  const includeBase = formElements.includeBase.checked;
  const includeCap = formElements.includeCap.checked;

  if (!length || !height || length <= 0 || height <= 0) {
    alert('Please enter valid dimensions');
    return;
  }

  const results = calculateRetainingWall(length, height, blockType, wallType, batter, waste, includeBase, includeCap);
  displayResults(results);
}

function calculateRetainingWall(length, height, blockType, wallType, batter, waste, includeBase, includeCap) {
  const blockDim = CONFIG.BLOCK_DIMENSIONS[blockType];
  const wallArea = length * height;
  
  // Adjust for batter/setback (reduces block count slightly)
  const batterAdjustment = 1 - (batter * 0.008); // ~0.8% per degree
  
  // Calculate blocks
  const rawBlocks = (wallArea / blockDim.face_area) * batterAdjustment;
  const blocksWithWaste = Math.ceil(rawBlocks * (1 + waste));
  
  // Calculate cap blocks if needed
  const capBlocks = includeCap ? Math.ceil(length / (blockDim.length / 12)) : 0;
  
  // Calculate base gravel
  let baseGravel = 0;
  let baseDepth = 0;
  if (includeBase) {
    baseDepth = Math.max(CONFIG.BASE_GRAVEL_DEPTH_MIN, height * 12 * 0.15);
    const baseWidth = 2; // assume 2 ft wide base
    const baseVolume = (length * baseWidth * (baseDepth / 12)); // cubic feet
    baseGravel = baseVolume / 27; // convert to cubic yards
  }
  
  return {
    blocks: blocksWithWaste,
    rawBlocks: Math.ceil(rawBlocks),
    capBlocks: capBlocks,
    baseGravel: baseGravel.toFixed(2),
    baseDepth: baseDepth.toFixed(1),
    wallType: wallType,
    length: length,
    height: height,
    blockType: blockType
  };
}

function displayResults(results) {
  const blockTypeNames = {
    standard: 'Standard Retaining Block (8″ × 12″)',
    large: 'Large Retaining Block (8″ × 18″)',
    small: 'Small Garden Block (6″ × 12″)'
  };
  
  const wallTypeNames = {
    gravity: 'Gravity Wall',
    reinforced: 'Reinforced Wall'
  };

  let html = '<div class="results-grid">';
  
  html += `
    <div class="result-item">
      <div class="result-label">Retaining Wall Blocks Needed</div>
      <div class="result-value">${results.blocks} blocks</div>
      <p class="result-raw">(${results.rawBlocks} blocks + waste)</p>
    </div>
  `;
  
  if (results.capBlocks > 0) {
    html += `
      <div class="result-item">
        <div class="result-label">Cap Blocks</div>
        <div class="result-value">${results.capBlocks} blocks</div>
      </div>
    `;
  }
  
  if (parseFloat(results.baseGravel) > 0) {
    html += `
      <div class="result-item">
        <div class="result-label">Base Gravel</div>
        <div class="result-value">${results.baseGravel} yd³</div>
        <p class="result-note">Base depth: ${results.baseDepth}″ compacted</p>
      </div>
    `;
  }
  
  html += `
    <div class="result-item">
      <div class="result-label">Wall Specifications</div>
      <div class="result-value">${results.length}′ × ${results.height}′</div>
      <p class="result-note">${wallTypeNames[results.wallType]}</p>
      <p class="result-note">${blockTypeNames[results.blockType]}</p>
    </div>
  `;
  
  if (results.wallType === 'reinforced') {
    html += `
      <div class="result-item" style="grid-column: 1/-1; background: #FFF3CD; border-color: #FFC107;">
        <div class="result-label">⚠️ Engineering Note</div>
        <p class="result-note" style="margin: 0; color: #856404;">Reinforced retaining walls require geogrid fabric and often need engineering approval. Consult a licensed engineer for walls over 4 feet or with surcharge loads.</p>
      </div>
    `;
  }
  
  html += '</div>';
  
  resultElements.content.innerHTML = html;
  resultElements.actions.style.display = 'flex';
  resultElements.container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handlePrint() {
  window.print();
}

function handleCopyResults() {
  const resultsText = resultElements.content.innerText;
  navigator.clipboard.writeText(resultsText).then(() => {
    const btn = resultElements.copyBtn;
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
}

function setupFAQAccordion() {
  const faqButtons = document.querySelectorAll('.faq-question');
  faqButtons.forEach(button => {
    button.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      const answerId = this.getAttribute('aria-controls');
      const answer = document.getElementById(answerId);
      answer.classList.toggle('show');
    });
  });
}

function injectFAQJsonLD() {
  const faqItems = document.querySelectorAll('.faq-item');
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": []
  };
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question').textContent.trim();
    const answer = item.querySelector('.faq-answer').textContent.trim();
    faqData.mainEntity.push({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answer
      }
    });
  });
  
  const script = document.getElementById('faq-jsonld');
  if (script) {
    script.textContent = JSON.stringify(faqData);
  }
}

function updateFooterYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}
