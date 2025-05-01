import { useEffect, useState } from "react";
import "./App.css";
import PriceComparison from "./components/PriceComparison";
import apiService from "./services/api";
import { filterTitle } from "./content";
import { scrapeWineData } from "./utils/scraper";

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
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch BAXUS listings with authentication and rate limiting
        const data = await apiService.fetchListings({ from: 0, size: 20 });

        if (isMounted) {
          if (data) {
            setWineListing(data);
          } else {
            setWineListing([]);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load data. Please try again later.");
          }
          setWineListing([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Get current page wine info with rate limiting
    const scrapePageData = async () => {
      try {
        if (!chrome?.tabs) {
          throw new Error("Chrome API not available");
        }

        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tabs[0]?.id) {
          throw new Error("No active tab found");
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: scrapeWineData,
        });

        if (isMounted && results?.[0]?.result) {
          setScrappedInfo(results[0].result);
        }
      } catch (err) {
        console.error("Error scraping page:", err);
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to analyze the current page. Please try again.");
          }
        }
      }
    };

    scrapePageData();
    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Find cheaper matches when both current wine and matches are available
  useEffect(() => {

    console.log("This is scrapepd info ", scrappedInfo);

    const isMatch = (wineName: string, scrappedTitle: string) => {
      const filteredWineName = filterTitle(wineName);
      const filteredScrappedTitle = filterTitle(scrappedTitle);

      let matchCount = 0;
      
      for (const word of filteredWineName) {
        if (filteredScrappedTitle.includes(word)) {
          console.log("This is match count: ", word, filteredWineName, filteredScrappedTitle);
          matchCount++;
        }
      }
      console.log("This is match count: ", matchCount);
      return matchCount;
    };

    if (scrappedInfo.length > 0) {
      const uniqueMatches = new Map<string, Match>();

      // Create a Set to track which scraped titles we've already matched
      const matchedTitles = new Set<string>();

      scrappedInfo.forEach((scrapped) => {
        // Skip if we've already found a match for this scraped title
        if (matchedTitles.has(scrapped.title)) {
          return;
        }

        // If the bottle is sold out, handle it specially
        if (scrapped.isSoldOut) {
          // Find the best match in your wineListing for this title
          const bestMatch = wineListing.find(
            (listing) => {
              const filteredWineName = filterTitle(listing._source.name);
              const threshold = (filteredWineName.length <= 5) ? 3 : 5;
              return isMatch(listing._source.name, scrapped.title) >= threshold
            }
          );
       

          if (bestMatch) {
            // For sold out items, we'll set values that work with the existing PriceComparison component
            const enhancedListing: ExtendedListingType = {
              ...bestMatch,
              scrappedPrice: 0,
              scrappedCurrency: scrapped.currency || "$",
              convertedScrapedPrice: bestMatch._source.price * 2, // This will result in 100% savings
              isSoldOut: true,
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

          // Determine threshold based on filteredWineName length
          const filteredWineName = filterTitle(listing._source.name);
          const threshold = (filteredWineName.length <= 5) ? 3 : 5;

          if (matchScore >= threshold && !foundMatchForTitle) {
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
              isSoldOut: scrapped.isSoldOut,
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
    <div className="w-[400px] min-h-[500px] bg-[#f8f6f1]">
      <div className="bg-[#f8f6f1] backdrop-blur-md border-b border-[#be6d0f]/20">
        <div className="flex flex-col items-center justify-center gap-3 px-4">
          <img src="/icon.png" alt="BAXUS Icon" className="w-16 h-16 spin-slow mt-3" />
          <div className="text-container w-full flex flex-col items-center">
            <p className="whiskey-title text-3xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
              BAXUS Price Checker
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-[#be6d0f] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="whiskey-text text-sm text-[#be6d0f]">
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
                <h3 className="whiskey-title text-sm font-medium text-red-800">Error</h3>
                <p className="whiskey-text text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-[#be6d0f]/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#be6d0f]"
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
            <h3 className="whiskey-title text-lg font-medium text-[#be6d0f] mb-1">
              No Better Deals Found
            </h3>
            <p className="whiskey-text text-sm text-[#8e510b] text-center">
              We couldn't find any better prices on BAXUS for this item.
            </p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="container space-y-4">
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
