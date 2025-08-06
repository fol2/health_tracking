// Direct test of LLM extraction with complex Chinese input
import 'dotenv/config';
import { LLMService } from './src/lib/services/llm.service.ts';

async function testExtraction() {
  try {
    console.log('Testing LLM extraction with complex Chinese input...\n');
    
    const llmService = new LLMService();
    
    const testInput = "我今日食咗一塊牛扒再加少少蘑菇再加少少西班牙辣椒再加三杯紅酒再加一兜焗薯";
    console.log('Input:', testInput);
    console.log('\nExtracting...\n');
    
    const result = await llmService.extractFoodData(testInput);
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.items && result.items.length > 0) {
      console.log('\n✅ Successfully extracted', result.items.length, 'items:');
      result.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (${item.nameLocal || 'N/A'}) - ${item.quantity}${item.unit}`);
      });
    } else {
      console.log('\n❌ No items extracted');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testExtraction();