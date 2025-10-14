import fetch from 'node-fetch';

async function testPaymentHistoryAPI() {
  try {
    console.log('Testing payment history API...');
    
    // Test without authentication first to see the response structure
    const response = await fetch('http://localhost:5000/api/payments/history?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add a valid JWT token here for a customer user
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });
    
    if (!response.ok) {
      console.log(`HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPaymentHistoryAPI();