import { BottleProps } from "../utils/types";
import { useState } from "react";

const PriceComparison = ({bottle}: BottleProps ) => {
    const [isLoading, setIsLoading] = useState(true);

    return ( 
        <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
            <div className="relative w-16 h-20 mr-4 overflow-hidden rounded-lg">
                {isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                )}
                {bottle.animationUrl ? (
                    <video 
                        src={bottle.animationUrl}
                        className={`absolute inset-0 w-full h-full object-cover ${isLoading ? 'hidden' : 'block'}`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onLoadedData={() => setIsLoading(false)}
                    />
                ) : (
                    <img 
                        src={bottle.imageUrl || '/vite.svg'} 
                        alt={bottle.name} 
                        className={`absolute inset-0 w-full h-full object-cover ${isLoading ? 'hidden' : 'block'}`}
                        onLoad={() => setIsLoading(false)}
                    />
                )}
            </div>
            <div className="flex-1">
                <h2 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{bottle.name}</h2>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-green-600">${bottle.price}</span>
                    <span className="text-xs text-gray-500">on BAXUS</span>
                </div>
                <a
                    href={`https://baxus.co/asset/${bottle.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                    View on BAXUS
                    <svg 
                        className="w-4 h-4 ml-1" 
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