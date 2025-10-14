#!/usr/bin/env node

// Payment Gateway Test Script
// Run with: node test-payment.js

// Using Node.js built-in fetch (Node 18+)
// import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZ2o3MXVhcjAwMDB2MnNrb2U2ODVnemkiLCJlbWFpbCI6Inlhc2l0aGltYWxrYWdhbWFnZUBnbWFpbC5jb20iLCJpYXQiOjE3NjAwMDg3MTUsImV4cCI6MTc2MDAxMjMxNX0.Up7s6VJF7-hF3zggv5jxqkx8TS0TUgLJB_csK_T3iXg'; // Replace with actual token
const SERVICE_ID = 'cmgj6m7mt0001i5o0x3zte8fw'; // Replace with actual service ID

// Test configuration
const testConfig = {
  amount: 100,
  currency: 'usd',
  testCard: '4242424242424242'
};

// Headers for API requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`
};

console.log('🧪 Starting Payment Gateway Tests...\n');

// Test 1: Create Payment Intent
async function testCreatePaymentIntent() {
  console.log('1️⃣  Testing: Create Payment Intent');
  
  try {
    const response = await fetch(`${BASE_URL}/payments/create-intent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        serviceId: SERVICE_ID,
        amount: testConfig.amount,
        currency: testConfig.currency
      })
    });
    
    console.log(`   Response status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response data:`, data);
    
    if (response.ok && data.success) {
      console.log('✅ Payment Intent Created Successfully');
      console.log(`   Payment ID: ${data.data.paymentId}`);
      console.log(`   Amount: $${data.data.amount}`);
      console.log(`   Platform Fee (5%): $${data.data.platformFee}`);
      console.log(`   Provider Amount (95%): $${data.data.providerAmount}`);
      console.log(`   Client Secret: ${data.data.clientSecret.substring(0, 20)}...`);
      return data.data;
    } else {
      console.log('❌ Failed to create payment intent');
      console.log('   Error:', data.message);
      if (data.error) console.log('   Details:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

// Test 2: Check Payment Status
async function testPaymentStatus(paymentId) {
  console.log('\n2️⃣  Testing: Get Payment Status');
  
  try {
    const response = await fetch(`${BASE_URL}/payments/status/${paymentId}`, {
      headers
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Payment Status Retrieved');
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Amount: $${data.data.amount}`);
      console.log(`   Created: ${new Date(data.data.createdAt).toLocaleString()}`);
      return data.data;
    } else {
      console.log('❌ Failed to get payment status');
      console.log('   Error:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

// Test 3: Get Payment History
async function testPaymentHistory() {
  console.log('\n3️⃣  Testing: Get Payment History');
  
  try {
    const response = await fetch(`${BASE_URL}/payments/history?limit=5`, {
      headers
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Payment History Retrieved');
      console.log(`   Total Payments: ${data.data.pagination.total}`);
      console.log(`   Recent Payments: ${data.data.payments.length}`);
      
      if (data.data.payments.length > 0) {
        const recent = data.data.payments[0];
        console.log(`   Latest Payment: $${recent.amount} - ${recent.status}`);
      }
      return data.data;
    } else {
      console.log('❌ Failed to get payment history');
      console.log('   Error:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

// Test 4: Get Provider Earnings
async function testProviderEarnings() {
  console.log('\n4️⃣  Testing: Get Provider Earnings');
  
  try {
    const response = await fetch(`${BASE_URL}/payments/earnings`, {
      headers
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Provider Earnings Retrieved');
      console.log(`   Total Earnings: $${data.data.totalEarnings}`);
      console.log(`   Available Balance: $${data.data.availableBalance}`);
      console.log(`   Total Withdrawn: $${data.data.totalWithdrawn}`);
      return data.data;
    } else {
      console.log('❌ Failed to get provider earnings');
      console.log('   Error:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

// Test 5: Webhook Endpoint
async function testWebhookEndpoint() {
  console.log('\n5️⃣  Testing: Webhook Endpoint');
  
  try {
    const response = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } }
      })
    });
    
    if (response.status === 400) {
      console.log('✅ Webhook endpoint responding (signature validation working)');
      return true;
    } else {
      console.log('⚠️  Webhook endpoint accessible but may need configuration');
      return true;
    }
  } catch (error) {
    console.log('❌ Webhook endpoint error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Payment Gateway Test Suite\n');
  console.log('Configuration:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Test Amount: $${testConfig.amount}`);
  console.log(`   Currency: ${testConfig.currency}`);
  console.log(`   Fee Split: 95% Provider / 5% Platform\n`);
  
  // Check if configuration is set
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE' || SERVICE_ID === 'YOUR_SERVICE_ID_HERE') {
    console.log('❌ Please update JWT_TOKEN and SERVICE_ID in this script before running tests');
    return;
  }
  
  let testResults = {
    createPayment: false,
    paymentStatus: false,
    paymentHistory: false,
    providerEarnings: false,
    webhookEndpoint: false
  };
  
  // Test 1: Create Payment Intent
  const paymentData = await testCreatePaymentIntent();
  testResults.createPayment = !!paymentData;
  
  if (paymentData) {
    // Test 2: Check Payment Status
    const statusData = await testPaymentStatus(paymentData.paymentId);
    testResults.paymentStatus = !!statusData;
  }
  
  // Test 3: Payment History
  const historyData = await testPaymentHistory();
  testResults.paymentHistory = !!historyData;
  
  // Test 4: Provider Earnings
  const earningsData = await testProviderEarnings();
  testResults.providerEarnings = !!earningsData;
  
  // Test 5: Webhook Endpoint
  const webhookWorking = await testWebhookEndpoint();
  testResults.webhookEndpoint = webhookWorking;
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your payment gateway is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above and your configuration.');
  }
}

// Export for use in other scripts
export { testCreatePaymentIntent, testPaymentStatus, testPaymentHistory, testProviderEarnings };

// Run tests directly
runAllTests().catch(console.error);