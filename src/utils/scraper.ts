
export interface ScrapedWine {
  title: string;
  price: number;
  currency: string;
  isSoldOut: boolean;
}

export function scrapeWineData(): ScrapedWine[] {
  const scrapedWines: ScrapedWine[] = [];

    document
      .querySelectorAll(
        "h1, h2, h3, h4, h5, h6, div > h1, div > h2, div > h3, div > h4, div > h5, [class*='price'], [id*='price'], div > span, div > div > span"
      )
      .forEach((heading) => {
        const title = heading.textContent?.trim();
        console.log(
          "This is the title: ",
          heading,
          heading.textContent
        );
        if (title) {
          let priceText = "";
          let currency = "";
          let isSoldOut = false;
          const parent = heading.parentElement;
          let priceElement: Element | null = null;

          // const resultContainer = findNearbyElement(heading, (el) => {
          //   return hasResultText;
          // },
          // 5 // Increase depth to find the result container
          // );

          if (parent) {
            const priceSelectors = [
              '[class*="price"]',
              '[id*="price"]',
              ".price",
              "#price",
              '[class*="Price"]',
              '[id*="Price"]',
            ];

            // Join all selectors with commas
            const combinedPriceSelector = priceSelectors.join(", ");

            // Look in the parent and its children for price elements
            priceElement = parent.querySelector(combinedPriceSelector);

            // If not found in parent, look in siblings of the heading
            if (!priceElement) {
              const grandParent = parent.parentElement;
              if (grandParent) {
                priceElement = grandParent.querySelector(
                  combinedPriceSelector
                );
              }
            }

            // If not found in parent, look in siblings of the heading
            if (!priceElement) {
              const grandParent = parent.parentElement;
              if (grandParent) {
                priceElement = grandParent.querySelector(
                  combinedPriceSelector
                );
              }
            }

            // If still not found, look in siblings of the parent container
            if (!priceElement && parent.parentElement) {
              const siblings = Array.from(
                parent.parentElement.children
              );
              for (const sibling of siblings) {
                if (sibling !== parent) {
                  const found = sibling.querySelector(
                    combinedPriceSelector
                  );
                  if (found) {
                    priceElement = found;
                    break;
                  }
                }
              }
            }

            // If still not found, fall back to the original approach
            if (!priceElement) {
              priceElement = parent.querySelector("span, p");
            }

            if (priceElement) {
              priceText = priceElement.textContent || "";
            }

            // --- SOLD OUT DETECTION ---
            // Check for 'sold out' in parent, siblings, or children
            const soldOutText = (el: Element) =>
              (el &&
                el.textContent &&
                el.textContent.toLowerCase().includes("sold out")) ||
              el.textContent?.toLowerCase().includes("out of stock");
            // Check parent
            if (soldOutText(parent)) {
              isSoldOut = true;
            }
            // Check siblings
            if (!isSoldOut && parent.parentElement) {
              const siblings = Array.from(
                parent.parentElement.children
              );
              for (const sibling of siblings) {
                if (sibling !== parent && soldOutText(sibling)) {
                  isSoldOut = true;
                  break;
                }
              }
            }
            // Check children
            if (!isSoldOut) {
              const children = Array.from(parent.children);
              for (const child of children) {
                if (soldOutText(child)) {
                  isSoldOut = true;
                  break;
                }
              }
            }
          }

          // Look for currency symbols and numbers
          const currencyRegex =
            /([£$€₦])\s*([0-9,.]+)|([0-9,.]+)\s*([£$€₦])/;
          const currencyMatch = priceText.match(currencyRegex);

          let price = 0;
          let isValidPrice = false;

          if (currencyMatch) {
            // If currency symbol is before the number
            if (currencyMatch[1] && currencyMatch[2]) {
              currency = currencyMatch[1];
              price = parseFloat(currencyMatch[2].replace(/,/g, ""));
              isValidPrice = true;
            }
            // If currency symbol is after the number
            else if (currencyMatch[3] && currencyMatch[4]) {
              currency = currencyMatch[4];
              price = parseFloat(currencyMatch[3].replace(/,/g, ""));
              isValidPrice = true;
            }
          } else {
            // Only consider numbers as prices if they appear in price-related contexts
            // and don't have non-price units

            // Check if the element or its parent has price-related text
            const elementText = (
              priceElement?.textContent || ""
            ).toLowerCase();
            const parentText = (
              parent?.textContent || ""
            ).toLowerCase();
            const hasPriceContext =
              elementText.includes("price") ||
              elementText.includes("cost") ||
              elementText.includes("$") ||
              elementText.includes("£") ||
              elementText.includes("€") ||
              elementText.includes("usd") ||
              elementText.includes("eur") ||
              elementText.includes("gbp") ||
              parentText.includes("price") ||
              parentText.includes("Result") ||
              parentText.includes("sold") ||
              parentText.includes("bid") ||
              parentText.includes("cost");

            // Check for common non-price units
            const hasNonPriceUnits =
              elementText.includes("ml") ||
              elementText.includes("cl") ||
              elementText.includes("l") ||
              elementText.includes("oz") ||
              elementText.includes("mg") ||
              elementText.includes("g") ||
              elementText.includes("kg") ||
              elementText.includes("abv") ||
              elementText.includes("%") ||
              elementText.includes("proof") ||
              elementText.includes("year") ||
              elementText.includes("aged");

            // Only proceed if we have price context and no non-price units
            if (hasPriceContext && !hasNonPriceUnits) {
              const priceMatch = priceText.match(/([0-9,.]+)/);
              if (priceMatch) {
                const potentialPrice = parseFloat(
                  priceMatch[0].replace(/,/g, "")
                );

                // Additional validation: prices are typically within certain ranges
                // Wine prices are rarely below $5 or above $100,000
                if (potentialPrice >= 5 && potentialPrice <= 100000) {
                  price = potentialPrice;
                  isValidPrice = true;
                  currency = "$"; // Default currency if none specified
                }
              }
            }
          }

          // Look through all child divs of the parent
          const childDivs = Array.from(parent?.children ?? []).filter(
            (el) => el.tagName.toLowerCase() === "div"
          );
          for (const div of childDivs) {
            // Look for any tag inside the div that contains a currency symbol
            const currencyTags = div.querySelectorAll("*");
            for (const tag of Array.from(currencyTags)) {
              const text = tag.textContent?.trim() || "";
              const match = text.match(
                /([$£€₦])\s*([0-9,]+(?:\.[0-9]+)?)/
              );
              if (match) {
                currency = match[1];
                price = parseFloat(match[2].replace(/,/g, ""));
                isValidPrice = true;
                break;
              }
            }
            if (isValidPrice) break;
          }

          // Only add to scrapedWines if we have a valid price or it's sold out
          if (isValidPrice || isSoldOut) {
            scrapedWines.push({ title, price, currency, isSoldOut });
            console.log("THis is scaped wines: ", scrapedWines);
          }
        }
      });
    return scrapedWines;

} 