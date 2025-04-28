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
  const [cheaperMatches, _setCheaperMatches] = useState<Match[]>([]);
  const [scrappedInfo, setScrappedInfo] = useState<any[]>([]);

  useEffect(() => {
    // Get current page wine info
    chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
      if (tab[0]?.id) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab[0].id! },
            func: () => {
              const scrapedWines: { title: string; price: number }[] = [];
  
              // Function to process a heading element
              const processHeading = (heading: Element) => {
                // Check if heading has span tags and use their text if available
                const spanInsideHeading = heading.querySelector('span');
                let title = spanInsideHeading ? spanInsideHeading.textContent?.trim() : heading.textContent?.trim();
                
                if (title) {
                  let priceText = "";
                  const parent = heading.parentElement;
                  if (parent) {
                    const priceElement = parent.querySelector("span, p");
                    if (priceElement) {
                      priceText = priceElement.textContent || "";
                    }
                  }
                  const priceMatch = priceText.match(/[\d,.]+/);
                  const price = priceMatch
                    ? parseFloat(priceMatch[0].replace(",", ""))
                    : 0;
                  scrapedWines.push({ title, price });
                }
              };
              
              // Process all direct h1-h6 tags
              document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(processHeading);
              
              // Process h tags inside divs (first level)
              document.querySelectorAll("div > h1, div > h2, div > h3, div > h4, div > h5, div > h6").forEach(processHeading);
              
              // Process h tags inside divs inside divs (second level)
              document.querySelectorAll("div > div > h1, div > div > h2, div > div > h3, div > div > h4, div > div > h5, div > div > h6").forEach(processHeading);
              
              // Process span tags that might contain wine information but aren't in headings
              document.querySelectorAll("div > span, div > div > span").forEach((span) => {
                const title = span.textContent?.trim();
                if (title && title.length > 10) { // Assuming wine titles are reasonably long
                  let priceText = "";
                  const parent = span.parentElement;
                  if (parent) {
                    const priceElement = parent.querySelector("span:not(:contains('" + title + "')), p");
                    if (priceElement) {
                      priceText = priceElement.textContent || "";
                    }
                  }
                  const priceMatch = priceText.match(/[\d,.]+/);
                  const price = priceMatch
                    ? parseFloat(priceMatch[0].replace(",", ""))
                    : 0;
                  scrapedWines.push({ title, price });
                }
              });
              
              // Remove duplicates based on title
              const uniqueWines = Array.from(
                new Map(scrapedWines.map(wine => [wine.title, wine])).values()
              );
              
              return uniqueWines;
            },
          })
          .then((injectionResults) => {
            const result = injectionResults[0].result;
            console.log("Scraped wines: ", result);
            setScrappedInfo(result ?? []);
          });
      }
    });

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
      console.log("This is filtered scrapped Info: ", filteredScrappedTitle);
      
      let matchCount = 0;
      
      for (const word of filteredWineName) {
        if (filteredScrappedTitle.includes(word)) {
          matchCount++;
        }
      }
      
      console.log("This is word count ", matchCount);
      return matchCount;
    };
    console.log("This is scrapped Info state: ", scrappedInfo);

    if (scrappedInfo.length > 0) {
      const uniqueMatches = new Map<string, Match>()

      scrappedInfo.forEach((scrapped) => {
        wineListing.forEach((listing) => {
           const matchFound = isMatch(listing._source.name, scrapped.title);
           if (matchFound  >= 5) {
            uniqueMatches.set(listing._id, listing)
          }
          // console.log("Checking match:", listing._source.name, "<->", scrapped.title);
        });
      });
      
      setMatches(Array.from(uniqueMatches.values()));
    }

  }, [scrappedInfo, wineListing]);

  useEffect(() => {
    console.log("Is match: ", matches);
  }, [matches]);

  return (
    <div className="w-[300px] font-sans">
      <h1 className="p-4 text-lg font-bold mb-4">BAXUS Price Checker</h1>

      {loading && <div className="p-4 text-sm text-gray-500">Loading...</div>}

      {error && <div className="p-4 text-sm text-red-500">{error}</div>}

      {/* {matches && (
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900 mb-2">
            Current Wine
          </h2>
          <p className="text-sm text-gray-700">{matches._source.name}</p>
          <p className="text-sm font-semibold text-gray-900">
            ${matches.price}
          </p>
        </div>
      )}

      {!loading && !error && cheaperMatches.length === 0 && currentWine && (
        <p className="p-4 text-sm text-gray-500">
          No cheaper matches found on BAXUS.
        </p>
      )} */}

      {!loading && !error && cheaperMatches.length > 0 && (
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-900 mb-2">
            Cheaper on BAXUS
          </h2>
          {cheaperMatches.map((match, index) => (
            <PriceComparison key={index} bottle={match._source} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
