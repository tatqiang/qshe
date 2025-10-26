// Simple API test
fetch('http://localhost:3001/api/projects')
  .then(response => response.json())
  .then(data => console.log('API Response:', data))
  .catch(error => console.error('API Error:', error));