#!/usr/bin/env node

const testCases = [
  {
    name: "Simple English - single item",
    description: "apple",
    language: "en"
  },
  {
    name: "Simple English - with weight",
    description: "chicken breast 200g",
    language: "en"
  },
  {
    name: "Complex English - multiple items",
    description: "chicken breast 200g with steamed rice 100g and broccoli",
    language: "en"
  },
  {
    name: "Traditional Chinese",
    description: "雞胸肉200克，白飯一碗，西蘭花",
    language: "zh"
  },
  {
    name: "Simplified Chinese",
    description: "鸡胸肉200克，米饭150克，西兰花100克",
    language: "zh"
  },
  {
    name: "Mixed language",
    description: "chicken breast 200g 配白飯一碗同西蘭花",
    language: "mixed"
  },
  {
    name: "No weights specified",
    description: "grilled salmon with quinoa and asparagus",
    language: "en"
  },
  {
    name: "Colloquial description",
    description: "I had 2 eggs with toast and butter for breakfast",
    language: "en"
  },
  {
    name: "Restaurant style",
    description: "Caesar salad with grilled chicken and parmesan cheese",
    language: "en"
  },
  {
    name: "Fast food",
    description: "Big Mac with medium fries and a diet coke",
    language: "en"
  }
];

function validateStructure(data) {
  const issues = [];
  
  // Check top-level structure
  if (typeof data.success !== 'boolean') issues.push('Missing or invalid "success" field');
  if (typeof data.confidence !== 'number') issues.push('Missing or invalid "confidence" field');
  if (!Array.isArray(data.items)) issues.push('Missing or invalid "items" array');
  if (!data.totalNutrition) issues.push('Missing "totalNutrition" object');
  
  // Check each item structure
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, idx) => {
      if (!item.name) issues.push(`Item ${idx}: missing name`);
      if (typeof item.quantity !== 'number') issues.push(`Item ${idx}: invalid quantity`);
      if (!item.unit) issues.push(`Item ${idx}: missing unit`);
      if (!item.category) issues.push(`Item ${idx}: missing category`);
      if (!item.nutrition) issues.push(`Item ${idx}: missing nutrition`);
      
      // Check nutrition structure
      if (item.nutrition) {
        const requiredNutrients = ['calories', 'protein', 'carbs', 'fat'];
        requiredNutrients.forEach(nutrient => {
          if (typeof item.nutrition[nutrient] !== 'number') {
            issues.push(`Item ${idx}: missing or invalid ${nutrient}`);
          }
        });
      }
    });
  }
  
  // Check totalNutrition structure
  if (data.totalNutrition) {
    const requiredTotals = ['totalCalories', 'totalProtein', 'totalCarbs', 'totalFat'];
    requiredTotals.forEach(field => {
      if (typeof data.totalNutrition[field] !== 'number') {
        issues.push(`TotalNutrition: missing or invalid ${field}`);
      }
    });
    
    if (!data.totalNutrition.macroBreakdown) {
      issues.push('Missing macroBreakdown');
    } else {
      const macro = data.totalNutrition.macroBreakdown;
      if (typeof macro.proteinPercentage !== 'number') issues.push('Invalid proteinPercentage');
      if (typeof macro.carbsPercentage !== 'number') issues.push('Invalid carbsPercentage');
      if (typeof macro.fatPercentage !== 'number') issues.push('Invalid fatPercentage');
      
      const total = macro.proteinPercentage + macro.carbsPercentage + macro.fatPercentage;
      if (Math.abs(total - 100) > 1) {
        issues.push(`Macro percentages don't add up to 100% (got ${total}%)`);
      }
    }
  }
  
  return issues;
}

async function testCase(testCase, env) {
  const url = env === 'prod' 
    ? 'https://health-tracker-neon.vercel.app/api/debug/llm-test'
    : 'http://localhost:3000/api/debug/llm-test';
    
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Test: ${testCase.name}`);
  console.log(`   Language: ${testCase.language}`);
  console.log(`   Input: "${testCase.description}"`);
  console.log(`   Environment: ${env.toUpperCase()}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: testCase.description,
        language: testCase.language === 'mixed' ? 'auto' : testCase.language
      })
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`\n   Response Status: ${response.status}`);
    console.log(`   Response Time: ${responseTime}ms`);
    
    if (data.success && data.result?.success) {
      console.log(`   ✅ Extraction SUCCESS`);
      console.log(`   Confidence: ${(data.result.confidence * 100).toFixed(0)}%`);
      console.log(`   Items extracted: ${data.result.items.length}`);
      
      // Display extracted items with full nutrition
      console.log('\n   📊 Extracted Items:');
      data.result.items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.name}${item.nameLocal ? ` (${item.nameLocal})` : ''}`);
        console.log(`      Quantity: ${item.quantity}${item.unit}`);
        console.log(`      Category: ${item.category}`);
        console.log(`      Nutrition:`);
        console.log(`        - Calories: ${item.nutrition.calories} kcal`);
        console.log(`        - Protein: ${item.nutrition.protein}g`);
        console.log(`        - Carbs: ${item.nutrition.carbs}g`);
        console.log(`        - Fat: ${item.nutrition.fat}g`);
        if (item.nutrition.fiber !== undefined) {
          console.log(`        - Fiber: ${item.nutrition.fiber}g`);
        }
      });
      
      // Display totals
      console.log('\n   📈 Total Nutrition:');
      const totals = data.result.totalNutrition;
      console.log(`      - Total Calories: ${totals.totalCalories} kcal`);
      console.log(`      - Total Protein: ${totals.totalProtein}g`);
      console.log(`      - Total Carbs: ${totals.totalCarbs}g`);
      console.log(`      - Total Fat: ${totals.totalFat}g`);
      
      if (totals.macroBreakdown) {
        console.log(`      - Macro Split: ${totals.macroBreakdown.proteinPercentage}% P / ${totals.macroBreakdown.carbsPercentage}% C / ${totals.macroBreakdown.fatPercentage}% F`);
      }
      
      // Validate structure
      const issues = validateStructure(data.result);
      if (issues.length > 0) {
        console.log('\n   ⚠️  Structure Issues:');
        issues.forEach(issue => console.log(`      - ${issue}`));
      } else {
        console.log('\n   ✅ Structure validation passed');
      }
      
      // Warnings
      if (data.result.warnings && data.result.warnings.length > 0) {
        console.log('\n   ⚠️  Warnings:');
        data.result.warnings.forEach(w => console.log(`      - ${w}`));
      }
      
    } else {
      console.log(`   ❌ Extraction FAILED`);
      console.log(`   Error: ${data.result?.warnings?.[0] || data.error || 'Unknown error'}`);
      
      // Try to understand why it failed
      if (data.debug) {
        console.log('\n   🔍 Debug Info:');
        console.log(`      Model: ${data.debug.model}`);
        console.log(`      Provider: ${data.debug.provider}`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Request ERROR: ${error.message}`);
  }
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 1500));
}

async function runTests() {
  const env = process.argv[2] || 'local';
  console.log(`🚀 Running Comprehensive LLM Tests`);
  console.log(`📍 Environment: ${env.toUpperCase()}`);
  console.log(`📅 Time: ${new Date().toISOString()}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tc of testCases) {
    const result = await testCase(tc, env);
    // Count based on console output (simplified for this example)
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log(`   Total tests: ${testCases.length}`);
  console.log('✅ Tests completed');
}

// Also test raw API to check JSON mode
async function testRawAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('🔬 Testing Raw Gemini API with JSON mode...');
  
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCMm_p8sxg8EtNdG55CjSMuf7ig74x7XjU';
  
  const testPayload = {
    model: 'gemini-2.5-flash',
    messages: [
      { 
        role: 'system', 
        content: 'Extract nutrition from: "chicken 200g". Return JSON with structure: {"item": "name", "calories": number, "protein": number}'
      },
      { 
        role: 'user', 
        content: 'chicken breast 200g' 
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  };
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    console.log('   Response status:', response.status);
    
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      console.log('   Content type:', typeof content);
      console.log('   Content:', content);
      
      try {
        const parsed = JSON.parse(content);
        console.log('   ✅ Valid JSON response');
        console.log('   Parsed:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('   ❌ Invalid JSON in response');
      }
    } else {
      console.log('   ❌ No choices in response');
      console.log('   Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('   ❌ API Error:', error.message);
  }
}

// Run everything
(async () => {
  await testRawAPI();
  await runTests();
})().catch(console.error);