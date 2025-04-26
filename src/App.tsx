import { useEffect, useState } from "react";
import "./App.css";
import PriceComparison from "./components/PriceComparison";

function App() {
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://services.baxus.co/api/search/listings?from=0&size=20&listed=true"
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        console.log("This is the data:", data);
        
        // Check if data exists and has hits
        if (data) {
          setMatches(data);
        } else {
          setMatches([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-[300px] font-sans bg-[#f8f6f1]">
      <h1 className="p-4 text-lg font-bold mb-4">BAXUS Price Checker</h1>
      
      {loading && (
        <div className="p-4 text-sm text-gray-500">Loading...</div>
      )}
      
      {error && (
        <div className="p-4 text-sm text-red-500">{error}</div>
      )}
      
      {!loading && !error && matches.length === 0 && (
        <p className="p-4 text-sm text-gray-500">No matches found.</p>
      )}
      
      {!loading && !error && matches.map((match, index) => (
        <PriceComparison key={index} bottle={match._source} />
      ))}
    </div>
  );
}

export default App;
