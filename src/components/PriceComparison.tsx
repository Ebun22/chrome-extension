// import { BottleProps } from "../utils/types";
import { useState } from "react";

const PriceComparison = ({ bottle }: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const savings = bottle.convertedScrapedPrice - bottle._source.price;
  const savingsPercentage = (
    (savings / bottle.convertedScrapedPrice) *
    100
  ).toFixed(1);
  const isNegative = savings < 0;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 mb-4 border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-24 overflow-hidden rounded-lg flex-shrink-0">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
          )}
          {bottle._source.animationUrl ? (
            <video
              src={bottle._source.animationUrl}
              className={`absolute inset-0 w-full h-full object-cover ${
                isLoading ? "hidden" : "block"
              }`}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setIsLoading(false)}
            />
          ) : (
            <img
              src={bottle._source.imageUrl || "/vite.svg"}
              alt={bottle._source.name}
              className={`absolute inset-0 w-full h-full object-cover ${
                isLoading ? "hidden" : "block"
              }`}
              onLoad={() => setIsLoading(false)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
            {bottle._source.name}
          </h2>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500">Current Price:</span>
              {bottle.isSoldOut ? (
                <span className="text-lg font-bold text-red-600">Sold Out</span>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  {bottle.scrappedCurrency} {bottle.scrappedPrice}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500">BAXUS Price:</span>
              <span className="text-lg font-bold text-green-600">
                ${bottle._source.price}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500">You Save:</span>
              <span
                className={`text-lg font-bold ${
                  isNegative ? "text-red-600" : "text-green-600"
                }`}
              >
                {isNegative ? `-$${Math.abs(savings)}` : `$${savings}`} (
                {isNegative ? "-" : ""}
                {Math.abs(Number(savingsPercentage))}%)
              </span>
              {isNegative && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                  External price is lower
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full ${
              isNegative ? "bg-red-50" : "bg-green-50"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                isNegative ? "text-red-700" : "text-green-700"
              }`}
            >
              {isNegative ? "No Savings" : `Save ${savingsPercentage}%`}
            </span>
          </div>
        </div>

        <a
          href={`https://baxus.co/asset/${bottle._source.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-full shadow-md hover:from-blue-700 hover:to-blue-500 transition-all duration-200 text-base font-semibold gap-2 mt-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-8.5 8.5a1 1 0 01-.325.217l-4.5 2a1 1 0 01-1.316-1.316l2-4.5a1 1 0 01.217-.325l8.5-8.5zM15 7l-2-2" />
          </svg>
          View on BAXUS
        </a>
      </div>
    </div>
  );
};

export default PriceComparison;
