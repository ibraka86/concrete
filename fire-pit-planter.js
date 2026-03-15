// Fire Pit & Planter Calculator JavaScript

// Configuration constants
const CONFIG = {
  BLOCK_DIMENSIONS: {
    4: { length: 16, height: 8 },
    6: { length: 16, height: 8 },
    8: { length: 16, height: 8 },
    wall: { length: 12, height: 6 }
  },
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
    projectType: document.getElementById('projectType'),
    shape: document.getElementById('shape'),
    diameter: document.getElementById('diameter'),
    length: document.getElementById('length'),
    width: document.getElementById('width'),
    rows: document.getElementById('rows'),
    blockSize: document.getElementById('blockSize'),
    waste: document.getElementById('waste'),
    includeFireRing: document.getElementById('includeFireRing'),
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
  formElements.shape.addEventListener('change', handleShapeChange);
  formElements.projectType.addEventListener('change', handleProjectTypeChange);
  
  if (resultElements.printBtn) {
    resultElements.printBtn.addEventListener('click', handlePrint);
  }
  if (resultElements.copyBtn) {
    resultElements.copyBtn.addEventListener('click', handleCopyResults);
  }
  
  // Initial setup
  handleShapeChange();
  handleProjectTypeChange();
}

function handleShapeChange() {
  const shape = formElements.shape.value;
  const diameterGroup = document.getElementById('diameter-group');
  const lengthGroup = document.getElementById('length-group');
  const widthGroup = document.getElementById('width-group');
  
  if (shape === 'circular') {
    diameterGroup.style.display = 'flex';
    lengthGroup.style.display = 'none';
    widthGroup.style.display = 'none';
  } else if (shape === 'square') {
    diameterGroup.style.display = 'none';
    lengthGroup.style.display = 'flex';
    widthGroup.style.display = 'none';
  } else {
    diameterGroup.style.display = 'none';
    lengthGroup.style.display = 'flex';
    widthGroup.style.display = 'flex';
  }
}

function handleProjectTypeChange() {
  const projectType = formElements.projectType.value;
  const firepitOptions = document.getElementById('firepit-options');
  
  if (projectType === 'firepit') {
    firepitOptions.style.display = 'block';
  } else {
    firepitOptions.style.display = 'none';
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const projectType = formElements.projectType.value;
  const shape = formElements.shape.value;
  const diameter = parseFloat(formElements.diameter.value);
  const length = parseFloat(formElements.length.value);
  const width = parseFloat(formElements.width.value);
  const rows = parseInt(formElements.rows.value);
  const blockSize = formElements.blockSize.value;
  const waste = parseFloat(formElements.waste.value) / 100;
  const includeFireRing = formElements.includeFireRing.checked;
  const includeCap = formElements.includeCap.checked;

  let dimensions = {};
  if (shape === 'circular') {
    if (!diameter || diameter <= 0) {
      alert('Please enter a valid diameter');
      return;
    }
    dimensions = { diameter };
  } else if (shape === 'square') {
    if (!length || length <= 0) {
      alert('Please enter a valid length');
      return;
    }
    dimensions = { length };
  } else {
    if (!length || !width || length <= 0 || width <= 0) {
      alert('Please enter valid dimensions');
      return;
    }
    dimensions = { length, width };
  }

  const results = calculateFirePitPlanter(projectType, shape, dimensions, rows, blockSize, waste, includeFireRing, includeCap);
  displayResults(results);
}

function calculateFirePitPlanter(projectType, shape, dimensions, rows, blockSize, waste, includeFireRing, includeCap) {
  const blockDim = CONFIG.BLOCK_DIMENSIONS[blockSize];
  const blockLengthFt = blockDim.length / 12;
  
  let blocksPerRow = 0;
  let perimeter = 0;
  let layoutNotes = '';
  
  if (shape === 'circular') {
    const diameter = dimensions.diameter;
    perimeter = Math.PI * diameter;
    blocksPerRow = Math.ceil(perimeter / blockLengthFt);
    layoutNotes = `Approximately ${blocksPerRow} blocks per row for ${diameter}' diameter. Small gaps between blocks create the circular shape.`;
  } else if (shape === 'square') {
    const length = dimensions.length;
    perimeter = length * 4;
    const blocksPerSide = Math.ceil(length / blockLengthFt);
    blocksPerRow = Math.max(4, (blocksPerSide * 4) - 4); // Minimum 4 blocks, subtract corner overlaps
    layoutNotes = `${blocksPerSide} blocks per side, ${blocksPerRow} total per row.`;
  } else {
    const { length, width } = dimensions;
    perimeter = 2 * (length + width);
    const blocksLength = Math.ceil(length / blockLengthFt);
    const blocksWidth = Math.ceil(width / blockLengthFt);
    blocksPerRow = Math.max(4, (2 * blocksLength) + (2 * blocksWidth) - 4); // Minimum 4 blocks, subtract corner overlaps
    layoutNotes = `${blocksLength} blocks on long sides, ${blocksWidth} blocks on short sides.`;
  }
  
  const totalBlocks = blocksPerRow * rows;
  const blocksWithWaste = Math.ceil(totalBlocks * (1 + waste));
  
  // Calculate cap blocks if needed
  const capBlocks = includeCap ? blocksPerRow : 0;
  
  // Calculate height
  const heightInches = rows * blockDim.height;
  const heightFeet = (heightInches / 12).toFixed(1);
  
  return {
    projectType,
    shape,
    dimensions,
    rows,
    blockSize,
    blocksPerRow,
    totalBlocks: blocksWithWaste,
    rawBlocks: totalBlocks,
    capBlocks,
    heightInches,
    heightFeet,
    layoutNotes,
    includeFireRing,
    perimeter: perimeter.toFixed(1)
  };
}

function displayResults(results) {
  const shapeNames = {
    circular: 'Circular',
    square: 'Square',
    rectangular: 'Rectangular'
  };
  
  const projectTypeNames = {
    firepit: 'Fire Pit',
    planter: 'Garden Planter / Raised Bed'
  };
  
  const blockSizeNames = {
    4: '4″ CMU',
    6: '6″ CMU',
    8: '8″ CMU',
    wall: 'Retaining Wall Block'
  };

  let html = '<div class="results-grid">';
  
  html += `
    <div class="result-item">
      <div class="result-label">Total Blocks Needed</div>
      <div class="result-value">${results.totalBlocks} blocks</div>
      <p class="result-raw">(${results.rawBlocks} blocks + waste)</p>
    </div>
  `;
  
  html += `
    <div class="result-item">
      <div class="result-label">Blocks Per Row</div>
      <div class="result-value">${results.blocksPerRow} blocks</div>
      <p class="result-note">${results.rows} rows total</p>
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
  
  html += `
    <div class="result-item">
      <div class="result-label">Structure Height</div>
      <div class="result-value">${results.heightFeet}′</div>
      <p class="result-note">${results.heightInches}″</p>
    </div>
  `;
  
  html += `
    <div class="result-item" style="grid-column: 1/-1;">
      <div class="result-label">Project Specifications</div>
      <p class="result-note" style="margin: 0.5rem 0;">
        <strong>Project Type:</strong> ${projectTypeNames[results.projectType]}<br>
        <strong>Shape:</strong> ${shapeNames[results.shape]}<br>
        <strong>Block Type:</strong> ${blockSizeNames[results.blockSize]}<br>
        ${results.shape === 'circular' ? `<strong>Diameter:</strong> ${results.dimensions.diameter}′` : ''}
        ${results.shape === 'square' ? `<strong>Size:</strong> ${results.dimensions.length}′ × ${results.dimensions.length}′` : ''}
        ${results.shape === 'rectangular' ? `<strong>Size:</strong> ${results.dimensions.length}′ × ${results.dimensions.width}′` : ''}
      </p>
    </div>
  `;
  
  html += `
    <div class="result-item" style="grid-column: 1/-1; background: #E6F0FF;">
      <div class="result-label">📐 Layout Guide</div>
      <p class="result-note" style="margin: 0;">${results.layoutNotes}</p>
    </div>
  `;
  
  if (results.projectType === 'firepit') {
    html += `
      <div class="result-item" style="grid-column: 1/-1; background: #FFF3CD; border-color: #FFC107;">
        <div class="result-label">🔥 Fire Pit Safety Notes</div>
        <p class="result-note" style="margin: 0; color: #856404;">
          • Use heat-resistant blocks rated for fire pit use<br>
          • Place on 4-6″ gravel base for drainage<br>
          • Leave gaps between blocks for air flow<br>
          • Keep 10-25 feet from structures (check local codes)<br>
          ${results.includeFireRing ? '• Consider a metal fire ring insert for added protection' : ''}
        </p>
      </div>
    `;
  } else {
    html += `
      <div class="result-item" style="grid-column: 1/-1; background: #D4EDDA; border-color: #28A745;">
        <div class="result-label">🌱 Garden Bed Tips</div>
        <p class="result-note" style="margin: 0; color: #155724;">
          • Line interior with landscape fabric for soil retention<br>
          • Ensure proper drainage with holes or gravel layer<br>
          • ${results.heightInches < 12 ? 'Consider adding more rows for better root depth' : 'Good depth for most vegetables'}<br>
          • Standard concrete blocks are safe for growing food
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
