const testCases = [
  {
    name: "Chinese - Complex meal",
    description: "今天吃了雞胸肉配飯和西蘭花",
    expectedItems: ["chicken breast", "rice", "broccoli"]
  },
  {
    name: "English - Casual",
    description: "Had a burger with fries and a diet coke",
    expectedItems: ["burger", "fries", "diet coke"]
  },
  {
    name: "Mixed language",
    description: "午餐食咗 chicken breast 200g 配 rice",
    expectedItems: ["chicken breast", "rice"]
  }
];

async function test() {
  const url = 'http://localhost:3000/api/debug/llm-test';
  
  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.name}`);
    console.log(`Input: "${tc.description}"`);
    
    try {
      const start = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: tc.description })
      });
      
      const time = Date.now() - start;
      const data = await response.json();
      
      if (data.success && data.result?.success) {
        const items = data.result.items.map(i => i.name);
        console.log(`✅ Success in ${time}ms`);
        console.log(`   Extracted: ${items.join(', ')}`);
        console.log(`   Expected: ${tc.expectedItems.join(', ')}`);
        
        // Show nutrition totals
        const totals = data.result.totalNutrition;
        console.log(`   Nutrition: ${totals.totalCalories}cal, ${totals.totalProtein}g protein`);
      } else {
        console.log(`❌ Failed in ${time}ms`);
        console.log(`   Error: ${data.error || data.result?.warnings?.[0]}`);
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}

test().catch(console.error);
