// import { BottleProps } from "../utils/types";
import { useState } from "react";

const PriceComparison = ({bottle}: any) => {
    const [isLoading, setIsLoading] = useState(true);
    const savings = bottle.convertedScrapedPrice - bottle._source.price;
    const savingsPercentage = ((savings / bottle.convertedScrapedPrice) * 100).toFixed(1);

    return ( 
        <div className="flex flex-col p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 mb-4 border border-gray-100">
            <div className="flex items-start gap-4">
                <div className="relative w-20 h-24 overflow-hidden rounded-lg flex-shrink-0">
                    {isLoading && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                    )}
                    {bottle._source.animationUrl ? (
                        <video 
                            src={bottle._source.animationUrl}
                            className={`absolute inset-0 w-full h-full object-cover ${isLoading ? 'hidden' : 'block'}`}
                            autoPlay
                            loop
                            muted
                            playsInline
                            onLoadedData={() => setIsLoading(false)}
                        />
                    ) : (
                        <img 
                            src={bottle._source.imageUrl || '/vite.svg'} 
                            alt={bottle._source.name} 
                            className={`absolute inset-0 w-full h-full object-cover ${isLoading ? 'hidden' : 'block'}`}
                            onLoad={() => setIsLoading(false)}
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{bottle._source.name}</h2>
                    
                    <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-500">Current Price:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {bottle.scrappedCurrency} {bottle.scrappedPrice}
                            </span>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-500">BAXUS Price:</span>
                            <span className="text-lg font-bold text-green-600">
                                ${bottle._source.price}
                            </span>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-500">You Save:</span>
                            <span className="text-lg font-bold text-green-600">
                                ${savings} ({savingsPercentage}%)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-green-50 rounded-full">
                        <span className="text-sm font-medium text-green-700">
                            Save {savingsPercentage}%
                        </span>
                    </div>
                </div>
                
                <a
                    href={`https://baxus.co/asset/${bottle._source.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                    View on BAXUS
                    <svg 
                        className="w-4 h-4 ml-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                        />
                    </svg>
                </a>
            </div>
        </div>
    );
}
 
export default PriceComparison;