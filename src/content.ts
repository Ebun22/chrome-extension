interface WineInfo {
  name: string;
  price: number;
}

function extractWineInfo(): WineInfo | null {
  // This is a placeholder - you'll need to adjust the selectors based on the actual website
  const nameElement = document.querySelector('.wine-name, .product-title, h1');
  const priceElement = document.querySelector('.price, .product-price, [data-price]');

  if (!nameElement || !priceElement) return null;

  const name = nameElement.textContent?.trim() || '';
  const priceText = priceElement.textContent?.trim() || '';
  const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

  if (!name || isNaN(price)) return null;

  return { name, price };
}


export const filterTitle = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, "")
    .split(/\s+/)
    .filter((word) => word.length > 1);
};

// Helper function to find nearby elements that match a condition
export function findNearbyElement(startElement: Element, condition: (el: Element) => boolean, maxDepth = 3) {
  // Check the element itself
  if (condition(startElement)) return startElement;
  
  // Check parent chain
  let current = startElement;
  let depth = 0;
  while (current.parentElement && depth < maxDepth) {
    current = current.parentElement;
    if (condition(current)) return current;
    depth++;
  }
  
  // Check siblings of parents
  current = startElement;
  depth = 0;
  while (current.parentElement && depth < maxDepth) {
    const siblings = Array.from(current.parentElement.children);
    for (const sibling of siblings) {
      if (sibling !== current && condition(sibling)) return sibling;
    }
    current = current.parentElement;
    depth++;
  }
  
  return null;
}

 // Helper function to estimate distance between elements in the DOM
export function getElementDistance(el1: Element, el2: Element): number {
  // Simple implementation - count steps up to common ancestor
  let count1 = 0;
  let count2 = 0;
  let current1 = el1;
  let current2 = el2;
  
  // Count steps from el1 to root
  while (current1.parentElement) {
    count1++;
    current1 = current1.parentElement;
  }
  
  // Count steps from el2 to root
  while (current2.parentElement) {
    count2++;
    current2 = current2.parentElement;
  }
  
  return count1 + count2;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === 'getWineInfo') {
    const wineInfo = extractWineInfo();
    sendResponse(wineInfo);
  }
  return true; // Required for async response
}); 