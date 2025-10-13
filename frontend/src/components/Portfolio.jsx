// frontend/src/components/Portfolio.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function Portfolio() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Fetch data from the portfolio endpoint
    axios.get('http://localhost:8000/api/portfolio')
      .then(response => {
        setItems(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the portfolio items!', error);
      });
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 my-4 text-center">Our Work Portfolio</h2>
      {/* Responsive grid for portfolio cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          // Card for each portfolio item
          <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            {/* Image for the card */}
            <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
            
            {/* Text content for the card */}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-700">{item.title}</h3>
              <p className="mt-2 text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Portfolio;