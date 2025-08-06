#!/usr/bin/env node

const testCases = [
  {
    name: "Simple single item",
    description: "apple"
  },
  {
    name: "Single item with weight",
    description: "chicken breast 200g"
  },
  {
    name: "Two items with weights",
    description: "chicken breast 200g and rice 100g"
  },
  {
    name: "Two items, one without weight",
    description: "chicken breast 200g and broccoli"
  },
  {
    name: "Three items, mixed weights",
    description: "chicken breast 200g with rice 100g and broccoli"
  },
  {
    name: "Complex sentence structure",
    description: "I had chicken breast 200g with steamed rice 100g and some broccoli"
  },
  {
    name: "Chinese characters",
    description: "雞胸肉200克配白飯"
  },
  {
    name: "Mixed language",
    description: "chicken breast 200g 配白飯 100g"
  },
  {
    name: "No weights at all",
    description: "chicken with rice and broccoli"
  },
  {
    name: "Very long description",
    description: "grilled chicken breast with brown rice, steamed broccoli, carrots, and a side of mixed salad with olive oil dressing"
  },
  {
    name: "Numbers without units",
    description: "2 eggs with toast"
  },
  {
    name: "Unusual units",
    description: "1 cup of rice with 2 pieces of chicken"
  }
];

async function testCase(testCase) {
  const url = process.argv[2] === 'prod' 
    ? 'https://health-tracker-neon.vercel.app/api/debug/llm-test'
    : 'http://localhost:3000/api/debug/llm-test';
    
  console.log(`\n📝 Testing: ${testCase.name}`);
  console.log(`   Input: "${testCase.description}"`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: testCase.description })
    });
    
    const data = await response.json();
    
    if (data.success && data.result?.success) {
      console.log(`   ✅ SUCCESS - ${data.result.items.length} items extracted`);
      data.result.items.forEach(item => {
        console.log(`      - ${item.name}: ${item.quantity}${item.unit} (${item.nutrition.calories} cal)`);
      });
    } else {
      console.log(`   ❌ FAILED - ${data.result?.warnings?.[0] || 'Unknown error'}`);
    }
    
    console.log(`   ⏱️  Time: ${data.processingTime}ms`);
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  // Wait a bit between requests to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function runTests() {
  const env = process.argv[2] === 'prod' ? 'PRODUCTION' : 'LOCAL';
  console.log(`🚀 Running LLM tests on ${env}...`);
  console.log('=' .repeat(50));
  
  for (const tc of testCases) {
    await testCase(tc);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All tests completed');
}

runTests().catch(console.error);