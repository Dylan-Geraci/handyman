// frontend/src/components/Contact.jsx
import { useState } from 'react';
import axios from 'axios';

function Contact() {
  // Use 'useState' to store the data from the form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // A state to hold the status message (e.g., "Message sent!")
  const [statusMessage, setStatusMessage] = useState('');

  // This function runs every time the user types in an input field
  const handleChange = (e) => {
    setFormData({
      ...formData, // Keep the existing form data
      [e.target.name]: e.target.value // Update the field that is being changed
    });
  };

  // This function runs when the user clicks the submit button
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the browser from reloading the page
    setStatusMessage('Sending...');

    // Use axios.post to send the formData to our backend
    axios.post('http://localhost:8000/api/contact', formData)
      .then(response => {
        setStatusMessage('Your message has been sent successfully!');
        // Clear the form after successful submission
        setFormData({ name: '', email: '', message: '' });
      })
      .catch(error => {
        setStatusMessage('There was an error sending your message. Please try again.');
        console.error('There was an error submitting the form!', error);
      });
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 my-4 text-center">Contact Us</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div className="text-center">
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">
            Send Message
          </button>
        </div>
      </form>
      {/* Display the status message if it exists */}
      {statusMessage && <p className="text-center mt-4 text-gray-600">{statusMessage}</p>}
    </div>
  );
}

export default Contact;