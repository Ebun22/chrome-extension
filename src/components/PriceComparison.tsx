// import { BottleProps } from "../utils/types";
import { useState } from "react";
import { Button } from "./ui/button";
import { WiStars } from "react-icons/wi";
// import { Button } from "./ui/button";

const formatPrice = (value: number, currency: string = "$") => {
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const PriceComparison = ({ bottle }: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const savings = bottle.isSoldOut
    ? bottle._source.price
    : bottle.convertedScrapedPrice - bottle._source.price;
  const savingsPercentage = (
    (savings /
      (bottle.isSoldOut
        ? bottle._source.price
        : bottle.convertedScrapedPrice)) *
    100
  ).toFixed(1);
  const isNegative = !bottle.isSoldOut && savings < 0;
  return (
    <div className="comparison-cont flex flex-col bg-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 mb-4 mx-4 px-5 py-4 border border-[#be6d0f]/20">
      
      <div className="flex items-center justify-end">
          <div
            className={`px-4 py-1 rounded-full flex justify-end items-center indicator ${
              isNegative ? "bg-red-50" : "bg-[#be6d0f]/10"
            }`}
          >
            <span
              className={`whiskey-text text-xs font-medium ${
                isNegative ? "text-red-700" : "text-[#be6d0f] px-4"
              }`}
            >
              {isNegative ? "No Savings" : `Save ${savingsPercentage}%`}
            </span>
          </div>
        </div>
        
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="relative w-20 h-24 overflow-hidden rounded-xl flex-shrink-0 bg-[#be6d0f]/5">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#be6d0f] border-t-transparent rounded-full animate-spin" />
              </div>
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
            <h2 className="whiskey-title text-2xl font-semibold mb-2 line-clamp-2">
              {bottle._source.name}
            </h2>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="whiskey-text text-sm text-[#8e510b]">Current site price:</span>
                {bottle.isSoldOut ? (
                  <span className="whiskey-text text-base font-medium text-[#be6d0f]/70 tracking-wider uppercase">
                    Sold Out
                  </span>
                ) : (
                  <span className="whiskey-text text-base font-bold text-[#be6d0f]">
                    {formatPrice(bottle.scrappedPrice, bottle.scrappedCurrency)}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="whiskey-text text-sm text-[#8e510b]">BAXUS Price:</span>
                <span className="whiskey-text text-base font-bold text-[#be6d0f]">
                  {formatPrice(bottle._source.price)}
                </span>
              </div>

              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="whiskey-text text-sm text-[#8e510b]">You Save:</span>
                <span
                  className={`whiskey-text text-base font-bold ${
                    isNegative ? "text-red-600" : "text-[#be6d0f]"
                  }`}
                >
                  {isNegative
                    ? `-${formatPrice(Math.abs(savings))}`
                    : `${formatPrice(savings)}`}
                </span>
              </div>
            </div>
          </div>
        </div>

  
      </div>

      <div className="mt-4 flex justify-end">
        <a
          href={`https://baxus.co/asset/${bottle._source.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center px-4 py-1.5 bg-[#be6d0f] text-white rounded-full shadow hover:bg-[#8e510b] transition-all duration-200 text-sm font-medium gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#be6d0f]/50"
        >
          <Button className="inline-flex items-center px-4 bg-transparent text-white font-bold rounded-full hover:bg-transparent transition-all duration-200">
            View on BAXUS
            <WiStars className="w-4 h-4 ml-1" />
          </Button>
        </a>
      </div>
    </div>
  );
};

export default PriceComparison;
