// Test script to verify API connectivity
import axios from 'axios';

export async function testApiConnection() {
  try {
    const API_BASE_URL = 'https://cqyyqvabi8.execute-api.us-east-2.amazonaws.com/prod';
    
    console.log('Testing API connection to:', API_BASE_URL);
    
    const response = await axios.get(`${API_BASE_URL}/events`, {
      params: { limit: 5 }
    });
    
    console.log('API connection successful!');
    console.log('Response status:', response.status);
    console.log('Response data structure:', Object.keys(response.data));
    
    if (response.data.data) {
      console.log('Data is nested in a "data" property');
      console.log('Events count:', response.data.data.events?.length || 'No events array found');
    } else {
      console.log('Direct data structure:', typeof response.data === 'object' ? 
        `object ${Array.isArray(response.data) ? 'array with ' + response.data.length + ' items' : ''}` : 
        typeof response.data);
      console.log('Events count:', response.data.events?.length || 'No events array found');
    }
    
    return true;
  } catch (error) {
    console.error('API connection failed!', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error instanceof Error ? error.message : String(error));
    }
    return false;
  }
}

// Auto-execute when imported
testApiConnection().then(success => {
  console.log('API test complete. Success:', success);
}); 