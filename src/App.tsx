import { useEffect, useState } from "react";
import "./App.css";
import PriceComparison from "./components/PriceComparison";

// interface _WineInfo {
//   name: string;
//   price: number;
// }

interface Match {
  _id: string;
  _source: {
    name: string;
    price: number;
    imageUrl?: string;
    animationUrl?: string;
    id: string;
  };
}

interface ExtendedListingType extends Match {
  scrappedPrice: number;
  scrappedCurrency: string;
  convertedScrapedPrice: number;
  isSoldOut: boolean;
  cheaper: boolean;
}

// Add Chrome extension types
declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [wineListing, setWineListing] = useState<Match[]>([]);
  const [scrappedInfo, setScrappedInfo] = useState<any[]>([]);

  useEffect(() => {
    // Get current page wine info
    chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
      if (tab[0]?.id) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab[0].id! },
            func: () => {
              const scrapedWines: {
                title: string;
                price: number;
                currency: string;
                isSoldOut: boolean;
              }[] = [];
              // const tags = [
              //   "h1, h2, h3, h4, h5, h6",
              //   "div > h1, div > h2, div > h3, div > h4, div > h5, div > h6",
              //   "div > div > h1, div > div > h2, div > div > h3, div > div > h4, div > div > h5, div > div > h6",
              //   "div > span, div > div > span"
              // ]
              // tags.forEach((tag) => {

              // })
              document
                .querySelectorAll(
                  "h1, h2, h3, h4, h5, h6, div > h1, div > h2, div > h3, div > h4, div > h5, [class*='price'], [id*='price'], div > span, div > div > span"
                )
                .forEach((heading) => {
                  const title = heading.textContent?.trim();
                  if (title) {
                    let priceText = "";
                    let currency = "";
                    let isSoldOut = false;
                    const parent = heading.parentElement;
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
                      let priceElement = parent.querySelector(
                        combinedPriceSelector
                      );

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

                      // NEW: If still not found, look in siblings of the parent container
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

                    if (currencyMatch) {
                      // If currency symbol is before the number
                      if (currencyMatch[1] && currencyMatch[2]) {
                        currency = currencyMatch[1];
                        price = parseFloat(currencyMatch[2].replace(/,/g, ""));
                      }
                      // If currency symbol is after the number
                      else if (currencyMatch[3] && currencyMatch[4]) {
                        currency = currencyMatch[4];
                        price = parseFloat(currencyMatch[3].replace(/,/g, ""));
                      }
                    } else {
                      // Fallback to just looking for numbers if no currency symbol is found
                      const priceMatch = priceText.match(/([0-9,.]+)/);
                      if (priceMatch) {
                        price = parseFloat(priceMatch[0].replace(/,/g, ""));
                      }
                    }
                    if (price !== 0 || isSoldOut)
                      scrapedWines.push({ title, price, currency, isSoldOut });
                  }
                });
              return scrapedWines;
            },
          })
          .then((injectionResults) => {
            const result = injectionResults[0].result;
            console.log("Scraped wines: ", result);
            setScrappedInfo(result ?? []);
          });
      }
    });

    console.log("This is scrapped Info state: ", scrappedInfo);

    // Fetch BAXUS listings
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://services.baxus.co/api/search/listings?from=0&size=20&listed=true"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        if (data) {
          setWineListing(data);
        } else {
          setWineListing([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
        setWineListing([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // useEffect(() => {
  //   console.log("This is scrapped Info state: ", scrappedInfo);
  // }, [])

  // Find cheaper matches when both current wine and matches are available
  useEffect(() => {
    const filterTitle = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, "")
        .split(/\s+/)
        .filter((word) => word.length > 1);
    };

    const isMatch = (wineName: string, scrappedTitle: string) => {
      const filteredWineName = filterTitle(wineName);
      const filteredScrappedTitle = filterTitle(scrappedTitle);

      let matchCount = 0;

      for (const word of filteredWineName) {
        if (filteredScrappedTitle.includes(word)) {
          matchCount++;
        }
      }

      return matchCount;
    };

    if (scrappedInfo.length > 0) {
      const uniqueMatches = new Map<string, Match>();

      // Track matches per scraped title to identify multiple matches
      // const matchesPerTitle = new Map<string, number>();

      // // First pass: count matches per title
      // scrappedInfo.forEach((scrapped) => {
      //   let matchCount = 0;

      //   wineListing.forEach((listing) => {
      //     const matchScore = isMatch(listing._source.name, scrapped.title);
      //     if (matchScore >= 5) {
      //       matchCount++;
      //     }
      //   });

      //   matchesPerTitle.set(scrapped.title, matchCount);
      // });

      // Second pass: apply price comparison logic for titles with multiple matches
      // Create a Set to track which scraped titles we've already matched
      const matchedTitles = new Set<string>();

      scrappedInfo.forEach((scrapped) => {
        // If the bottle is sold out, always recommend our listing
        if (scrapped.isSoldOut) {
          // Find the best match in your wineListing for this title
          const bestMatch = wineListing.find(
            (listing) => isMatch(listing._source.name, scrapped.title) >= 5
          );
          if (bestMatch) {
            const enhancedListing: ExtendedListingType = {
              ...bestMatch,
              scrappedPrice: scrapped.price || 0,
              scrappedCurrency: scrapped.currency || "",
              convertedScrapedPrice: 0,
              isSoldOut: scrapped.isSoldOut,
              cheaper: true,
            };
            uniqueMatches.set(bestMatch._id, enhancedListing);
          }
          return; // Skip normal price comparison for sold out
        }
        // Skip if we've already found a match for this scraped title
        if (matchedTitles.has(scrapped.title)) {
          return;
        }
        // If the bottle is sold out, handle it specially
        if (scrapped.isSoldOut) {
          // Find the best match in your wineListing for this title
          const bestMatch = wineListing.find(
            (listing) => isMatch(listing._source.name, scrapped.title) >= 5
          );

          if (bestMatch) {
            // For sold out items, we'll set values that work with the existing PriceComparison component
            const enhancedListing: ExtendedListingType = {
              ...bestMatch,
              scrappedPrice: 0,
              scrappedCurrency: scrapped.currency || "$",
              convertedScrapedPrice: bestMatch._source.price * 2,
              isSoldOut: scrapped.isSoldOut,
              cheaper: true,
            };

            uniqueMatches.set(bestMatch._id, enhancedListing);
            matchedTitles.add(scrapped.title);

            console.log(
              `Found sold out item: ${scrapped.title}, recommending our listing`
            );
            return; // Skip normal price comparison for sold out items
          }
        }

        // Flag to track if we've found a match for this scraped title
        let foundMatchForTitle = false;

        // Sort wineListing to ensure consistent order (optional)
        // This ensures the "first" match is always the same if run multiple times
        // const sortedWineListing = [...wineListing].sort((a, b) => a._id.localeCompare(b._id));

        for (const listing of wineListing) {
          let matchScore = 0;
          if (
            scrapped.title !== " " &&
            scrapped.title !== "" &&
            scrapped.price !== 0 &&
            scrapped.currency !== ""
          ) {
            matchScore = isMatch(listing._source.name, scrapped.title);
          }

          if (matchScore >= 5 && !foundMatchForTitle) {
            // We found the first match for this scraped title
            foundMatchForTitle = true;
            matchedTitles.add(scrapped.title);
            // Convert price based on currency if needed
            let convertedPrice =
              scrapped.currency && scrapped.price ? scrapped.price : 0;

            // Only convert if we have a currency and price
            if (scrapped.currency && scrapped.price) {
              // Convert Naira to USD
              if (scrapped.currency === "₦" || scrapped.currency === "NGN") {
                convertedPrice = scrapped.price / 1602;
              } else if (
                scrapped.currency === "€" ||
                scrapped.currency === "EUR"
              ) {
                convertedPrice = scrapped.price * 1.14;
              } else if (
                scrapped.currency === "£" ||
                scrapped.currency === "GBP"
              ) {
                convertedPrice = scrapped.price * 1.31;
              }
            }

            // Get the listing price (assuming it's in USD)
            const listingPrice = listing._source.price || 0;
            console.log(
              "This is the listing price: ",
              listingPrice,
              " this convertedPrice: ",
              convertedPrice
            );
            const isCheaper = listingPrice < convertedPrice;

            const enhancedListing: ExtendedListingType = {
              ...listing,
              scrappedPrice: scrapped.price || 0,
              scrappedCurrency: scrapped.currency || "",
              convertedScrapedPrice: convertedPrice,
              cheaper: isCheaper,
            };

            uniqueMatches.set(listing._id, enhancedListing);
            break;
          }
        }
      });

      const matchesArray = Array.from(uniqueMatches.values());
      console.log("This is the array that matches: ", matchesArray);
      // Only update with matches if we found any
      if (matchesArray.length > 0) {
        setMatches(matchesArray);
        console.log(
          `Found ${matchesArray.length} matches with price comparison`
        );
      } else {
        setMatches([]);
        console.log("No matches found after price comparison");
      }
    }
  }, [scrappedInfo, wineListing]);

  useEffect(() => {
    console.log("Is match: ", matches);
  }, [matches]);

  return (
    <div className="w-[400px] min-h-[500px] bg-gradient-to-b from-gray-50 to-white">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src="/icon.png"
            alt="BAXUS Icon"
            className="w-10 h-10 rounded-lg shadow-md border border-blue-100 bg-white"
          />
          <div>
            <h1 className="text-xl font-extrabold text-blue-700 tracking-tight leading-tight drop-shadow-sm">
              BAXUS Price Checker
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Find better deals on BAXUS
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-500">
              Searching for better deals...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Better Deals Found
            </h3>
            <p className="text-sm text-gray-500 text-center">
              We couldn't find any better prices on BAXUS for this item.
            </p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">
                Found {matches.length} Better Deals
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>Sorted by best savings</span>
              </div>
            </div>
            {matches.map((match, index) => (
              <PriceComparison key={index} bottle={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
