import { test, expect } from '@playwright/test';

test.describe('HTML Structure and CSS Verification', () => {
  const baseURL = 'https://health-tracker-neon.vercel.app';
  
  test('inspect actual HTML structure and CSS', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Get the entire HTML structure
    const htmlContent = await page.content();
    console.log('\n=== HTML Structure (first 1000 chars) ===');
    console.log(htmlContent.substring(0, 1000));
    
    // Check for expected elements
    const bodyClasses = await page.locator('body').getAttribute('class');
    console.log('\n=== Body Classes ===');
    console.log(bodyClasses);
    
    // Check computed styles
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
      };
    });
    console.log('\n=== Body Computed Styles ===');
    console.log(bodyStyles);
    
    // Check for Tailwind CSS
    const hasTailwind = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      return styles.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return rules.some(rule => rule.cssText?.includes('tailwind') || rule.cssText?.includes('--tw-'));
        } catch (e) {
          return false;
        }
      });
    });
    console.log('\n=== Tailwind CSS Detected ===');
    console.log(hasTailwind);
    
    // Check for our custom CSS variables
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        '--background': styles.getPropertyValue('--background'),
        '--foreground': styles.getPropertyValue('--foreground'),
        '--primary': styles.getPropertyValue('--primary'),
        '--secondary': styles.getPropertyValue('--secondary'),
      };
    });
    console.log('\n=== CSS Variables ===');
    console.log(cssVariables);
    
    // Check main content structure
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main');
      const h1 = document.querySelector('h1');
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent);
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent,
        href: a.href
      }));
      
      return {
        hasMain: !!main,
        h1Text: h1?.textContent,
        buttons,
        links: links.slice(0, 5), // First 5 links
      };
    });
    console.log('\n=== Main Content Structure ===');
    console.log(JSON.stringify(mainContent, null, 2));
  });
  
  test('check login page structure', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Get page title and main heading
    const pageTitle = await page.title();
    console.log('\n=== Login Page Title ===');
    console.log(pageTitle);
    
    // Check for our app elements vs Google OAuth
    const pageContent = await page.evaluate(() => {
      const allText = document.body.innerText;
      const hasGoogleLogo = !!document.querySelector('img[alt*="Google"]');
      const hasHealthTracker = allText.includes('Health Tracker');
      const hasSignInButton = !!document.querySelector('button');
      
      return {
        bodyText: allText.substring(0, 500),
        hasGoogleLogo,
        hasHealthTracker,
        hasSignInButton,
        url: window.location.href,
      };
    });
    console.log('\n=== Login Page Analysis ===');
    console.log(JSON.stringify(pageContent, null, 2));
    
    // Check if CSS is properly loaded
    const cssLoaded = await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.className = 'bg-blue-500 text-white p-4';
      document.body.appendChild(testDiv);
      const styles = window.getComputedStyle(testDiv);
      document.body.removeChild(testDiv);
      
      return {
        hasPadding: styles.padding !== '0px',
        hasBackgroundColor: styles.backgroundColor !== 'rgba(0, 0, 0, 0)',
        hasTextColor: styles.color !== 'rgb(0, 0, 0)',
      };
    });
    console.log('\n=== CSS Loading Test ===');
    console.log(cssLoaded);
  });
});