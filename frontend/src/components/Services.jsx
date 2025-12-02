import { useState, useEffect } from 'react';
import axios from 'axios';
import SkeletonLoader from './SkeletonLoader'; // We'll use our skeleton loader here

const softRed = {
  main: 'bg-[#E65A5A]',
  hover: 'hover:bg-[#D94E4E]',
  text: 'text-[#E65A5A]',
};

// NEW: A helper function to get an icon based on the service name
const getServiceIcon = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('plumb')) {
        // Wrench Icon
      return <svg className="w-8 h-8 text-[#E65A5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
    }
    if (name.includes('electric')) {
        // Lightbulb Icon
        return <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M12 21V11a4 4 0 00-4-4H8a4 4 0 00-4 4v10h12z"></path></svg>;
    }
    if (name.includes('paint')) {
        // Paintbrush Icon
        return <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>;
    }
    // Default Icon (Tools)
    return <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
};

function Services() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:8000/api/services')
      .then(response => {
        setServices(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the services!', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800">Our Services</h2>
        <p className="mt-2 text-gray-600">Explore the wide range of tasks our skilled professionals can handle for you.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
            // Show skeleton loaders while data is fetching
            [...Array(3)].map((_, i) => <SkeletonLoader key={i} />)
        ) : (
            services.map(service => (
            // This is the new, upgraded card for each service
            <div key={service._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center space-x-4">
                    {getServiceIcon(service.name)}
                    <h3 className="text-xl font-semibold text-gray-800">{service.name}</h3>
                </div>
                <p className="mt-4 text-gray-600">{service.description}</p>
            </div>
            ))
        )}
      </div>
    </div>
  );
}

export default Services;