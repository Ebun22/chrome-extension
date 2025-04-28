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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === 'getWineInfo') {
    const wineInfo = extractWineInfo();
    sendResponse(wineInfo);
  }
  return true; // Required for async response
}); 