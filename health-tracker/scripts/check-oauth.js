// 檢查 OAuth 設置的腳本
console.log('=== OAuth Configuration Check ===\n');

// 檢查環境變數
console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');

console.log('\n=== Expected Values ===');
console.log('Production URL: https://health-tracker-neon.vercel.app');
console.log('Callback URL: https://health-tracker-neon.vercel.app/api/auth/callback/google');

console.log('\n=== Next Steps ===');
console.log('1. Verify these values in Google Cloud Console');
console.log('2. Update environment variables in Vercel Dashboard');
console.log('3. Redeploy the application');
console.log('4. Clear browser cookies and try again');