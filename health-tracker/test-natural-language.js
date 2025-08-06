#!/usr/bin/env node

const testCases = [
  // English - Casual descriptions
  {
    name: "Casual breakfast",
    description: "I had 2 eggs and toast for breakfast",
    expectedItems: ["eggs", "toast"]
  },
  {
    name: "Typical lunch",
    description: "Just had a burger with fries",
    expectedItems: ["burger", "fries"]
  },
  {
    name: "Dinner description",
    description: "For dinner I ate steak with mashed potatoes and salad",
    expectedItems: ["steak", "mashed potatoes", "salad"]
  },
  {
    name: "No quantities mentioned",
    description: "chicken and rice",
    expectedItems: ["chicken", "rice"]
  },
  {
    name: "Mixed quantities",
    description: "a sandwich and 2 apples",
    expectedItems: ["sandwich", "apple"]
  },
  
  // Chinese - Various styles
  {
    name: "Traditional Chinese simple",
    description: "雞胸肉配飯",
    expectedItems: ["chicken breast", "rice"]
  },
  {
    name: "Traditional Chinese with quantities",
    description: "吃了兩個蛋和一片吐司",
    expectedItems: ["egg", "toast"]
  },
  {
    name: "Simplified Chinese",
    description: "午餐吃了汉堡和薯条",
    expectedItems: ["hamburger", "fries"]
  },
  {
    name: "Cantonese style",
    description: "今日食咗叉燒飯同奶茶",
    expectedItems: ["char siu rice", "milk tea"]
  },
  
  // Mixed languages
  {
    name: "Code-switching",
    description: "今天lunch食咗chicken breast配rice",
    expectedItems: ["chicken breast", "rice"]
  },
  
  // Edge cases
  {
    name: "Just numbers",
    description: "3 eggs",
    expectedItems: ["egg"]
  },
  {
    name: "Size modifiers",
    description: "large pizza",
    expectedItems: ["pizza"]
  },
  {
    name: "Small portion",
    description: "a small salad",
    expectedItems: ["salad"]
  },
  {
    name: "Multiple items no conjunctions",
    description: "steak fries salad",
    expectedItems: ["steak", "fries", "salad"]
  }
];

async function testCase(tc, env) {
  const url = env === 'prod' 
    ? 'https://health-tracker-neon.vercel.app/api/debug/llm-test'
    : 'http://localhost:3000/api/debug/llm-test';
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📝 "${tc.description}"`);
  console.log(`   Expected: ${tc.expectedItems.join(', ')}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: tc.description })
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    if (data.success && data.result?.success) {
      const extractedNames = data.result.items.map(item => item.name.toLowerCase());
      console.log(`   ✅ Extracted: ${extractedNames.join(', ')}`);
      
      // Check if all expected items were found
      const allFound = tc.expectedItems.every(expected => 
        extractedNames.some(extracted => 
          extracted.includes(expected.toLowerCase()) || 
          expected.toLowerCase().includes(extracted)
        )
      );
      
      if (allFound) {
        console.log(`   ✓ All expected items found`);
      } else {
        console.log(`   ⚠️  Some items missing`);
      }
      
      // Show details
      data.result.items.forEach(item => {
        const localName = item.nameLocal ? ` (${item.nameLocal})` : '';
        console.log(`      - ${item.name}${localName}: ${item.quantity}${item.unit}, ${item.nutrition.calories}cal`);
      });
      
      // Show totals
      const totals = data.result.totalNutrition;
      console.log(`   📊 Total: ${totals.totalCalories}cal (P:${totals.totalProtein}g C:${totals.totalCarbs}g F:${totals.totalFat}g)`);
      
    } else {
      console.log(`   ❌ FAILED: ${data.result?.warnings?.[0] || data.error || 'Unknown'}`);
    }
    
    console.log(`   ⏱️  ${responseTime}ms`);
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function runTests() {
  const env = process.argv[2] || 'local';
  console.log(`🚀 Natural Language Food Extraction Tests`);
  console.log(`📍 Environment: ${env.toUpperCase()}`);
  console.log(`🕐 ${new Date().toLocaleString()}`);
  
  let passed = 0;
  let failed = 0;
  
  for (const tc of testCases) {
    try {
      await testCase(tc, env);
    } catch (e) {
      console.error(`Test error: ${e.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary: ${testCases.length} tests`);
}

runTests().catch(console.error);