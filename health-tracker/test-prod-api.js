const fetch = require('node-fetch');

async function testProdAPI() {
  const response = await fetch('https://health-tracker-neon.vercel.app/api/debug/llm-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: '我今日食咗一塊牛扒再加少少蘑菇再加少少西班牙辣椒再加三杯紅酒再加一兜焗薯',
      mealType: 'dinner'
    })
  });

  const data = await response.json();
  console.log('Production API Response:');
  console.log(JSON.stringify(data, null, 2));
}

testProdAPI().catch(console.error);
