// Block Weight Calculator JavaScript

// Configuration constants
const CONFIG = {
  BLOCK_WEIGHTS: {
    // Hollow block weights in lbs
    hollow: {
      4: { standard: 21, lightweight: 17, heavyweight: 26 },
      6: { standard: 28, lightweight: 23, heavyweight: 35 },
      8: { standard: 35, lightweight: 27, heavyweight: 45 },
      12: { standard: 53, lightweight: 42, heavyweight: 65 }
    },
    // Solid/filled block weights in lbs
    solid: {
      4: { standard: 32, lightweight: 28, heavyweight: 38 },
      6: { standard: 43, lightweight: 36, heavyweight: 52 },
      8: { standard: 53, lightweight: 44, heavyweight: 64 },
      12: { standard: 78, lightweight: 65, heavyweight: 92 }
    }
  },
  BLOCKS_PER_PALLET: {
    4: 144,
    6: 120,
    8: 90,
    12: 72
  },
  PALLET_WEIGHT: 45 // lbs
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
    blockSize: document.getElementById('blockSize'),
    blockType: document.getElementById('blockType'),
    quantity: document.getElementById('quantity'),
    configuration: document.getElementById('configuration')
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
  
  const blockSize = parseInt(formElements.blockSize.value);
  const blockType = formElements.blockType.value;
  const quantity = parseInt(formElements.quantity.value);
  const configuration = formElements.configuration.value;

  if (!quantity || quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }

  const results = calculateBlockWeight(blockSize, blockType, quantity, configuration);
  displayResults(results);
}

function calculateBlockWeight(blockSize, blockType, quantity, configuration) {
  const weightPerBlock = CONFIG.BLOCK_WEIGHTS[configuration][blockSize][blockType];
  const totalWeight = weightPerBlock * quantity;
  
  // Calculate pallet information
  const blocksPerPallet = CONFIG.BLOCKS_PER_PALLET[blockSize];
  const fullPallets = Math.floor(quantity / blocksPerPallet);
  const partialPalletBlocks = quantity % blocksPerPallet;
  const totalPalletWeight = (fullPallets * blocksPerPallet * weightPerBlock) + 
                            (fullPallets * CONFIG.PALLET_WEIGHT);
  const partialPalletWeight = (partialPalletBlocks * weightPerBlock) + 
                              (partialPalletBlocks > 0 ? CONFIG.PALLET_WEIGHT : 0);
  
  // Transportation estimates
  const pickupTruckCapacity = 1500; // lbs
  const fullSizeTruckCapacity = 2500; // lbs
  const blocksPickupTruck = Math.floor(pickupTruckCapacity / weightPerBlock);
  const blocksFullSizeTruck = Math.floor(fullSizeTruckCapacity / weightPerBlock);
  
  return {
    blockSize: blockSize,
    blockType: blockType,
    configuration: configuration,
    quantity: quantity,
    weightPerBlock: weightPerBlock,
    totalWeight: totalWeight,
    totalWeightTons: (totalWeight / 2000).toFixed(2),
    blocksPerPallet: blocksPerPallet,
    fullPallets: fullPallets,
    partialPalletBlocks: partialPalletBlocks,
    totalPalletWeight: totalPalletWeight,
    partialPalletWeight: partialPalletWeight,
    blocksPickupTruck: blocksPickupTruck,
    blocksFullSizeTruck: blocksFullSizeTruck
  };
}

function displayResults(results) {
  const blockTypeNames = {
    standard: 'Standard Weight',
    lightweight: 'Lightweight',
    heavyweight: 'Heavyweight/Dense'
  };
  
  const configNames = {
    hollow: 'Hollow',
    solid: 'Solid/Filled'
  };

  let html = '<div class="results-grid">';
  
  html += `
    <div class="result-item">
      <div class="result-label">Block Specifications</div>
      <div class="result-value">${results.blockSize}″ CMU</div>
      <p class="result-note">${blockTypeNames[results.blockType]}</p>
      <p class="result-note">${configNames[results.configuration]}</p>
    </div>
  `;
  
  html += `
    <div class="result-item">
      <div class="result-label">Weight Per Block</div>
      <div class="result-value">${results.weightPerBlock} lbs</div>
    </div>
  `;
  
  html += `
    <div class="result-item">
      <div class="result-label">Total Weight</div>
      <div class="result-value">${results.totalWeight.toLocaleString()} lbs</div>
      <p class="result-note">${results.totalWeightTons} tons</p>
    </div>
  `;
  
  html += `
    <div class="result-item">
      <div class="result-label">Quantity</div>
      <div class="result-value">${results.quantity} blocks</div>
    </div>
  `;
  
  html += `
    <div class="result-item" style="grid-column: 1/-1;">
      <div class="result-label">📦 Pallet Information</div>
      <p class="result-note" style="margin: 0.5rem 0;">
        <strong>Blocks per pallet:</strong> ${results.blocksPerPallet}<br>
        <strong>Full pallets:</strong> ${results.fullPallets}
        ${results.partialPalletBlocks > 0 ? ` + ${results.partialPalletBlocks} blocks (partial pallet)` : ''}
      </p>
    </div>
  `;
  
  html += `
    <div class="result-item" style="grid-column: 1/-1; background: #E6F0FF;">
      <div class="result-label">🚗 Transportation Capacity</div>
      <p class="result-note" style="margin: 0.5rem 0;">
        <strong>Half-ton pickup (1,500 lbs):</strong> ~${results.blocksPickupTruck} blocks max<br>
        <strong>3/4-ton truck (2,500 lbs):</strong> ~${results.blocksFullSizeTruck} blocks max
      </p>
    </div>
  `;
  
  if (results.totalWeight > 2500) {
    html += `
      <div class="result-item" style="grid-column: 1/-1; background: #FFF3CD; border-color: #FFC107;">
        <div class="result-label">⚠️ Transportation Notice</div>
        <p class="result-note" style="margin: 0; color: #856404;">
          Total weight exceeds typical pickup truck capacity. Consider delivery service or multiple trips. 
          Always check your vehicle's payload rating and distribute weight evenly.
        </p>
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
