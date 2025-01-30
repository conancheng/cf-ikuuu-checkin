const DEFAULT_CONFIG = {
  DOMAIN: 'https://ikuuu.one',
  EMAIL: 'your_email@example.com',
  PASSWORD: 'your_password',
  TRIGGER_PATH: '/auto-checkin',
  TG_BOT_TOKEN: '',
  TG_CHAT_ID: '',
  MAX_RETRY: 3
};

let config = { ...DEFAULT_CONFIG };

export default {
  async fetch(request, env, ctx) {
    await initializeConfig(env);
    const url = new URL(request.url);
    
    if (url.pathname === config.TRIGGER_PATH) {
      try {
        const result = await checkin();
        await sendTelegramNotification(`✅ 自动签到成功\n${result}`);
        return successResponse(result);
      } catch (error) {
        await sendTelegramNotification(`❌ 自动签到失败\n${error.message}`);
        return errorResponse(error);
      }
    }
    else if (url.pathname === '/') {
      return new Response(
        `请访问 ${config.TRIGGER_PATH} 触发签到`,
        { 
          status: 200,
          headers: { 
            'Content-Type': 'text/plain; charset=UTF-8',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    }    
    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    await initializeConfig(env);
    console.log('Cron job started at:', new Date().toISOString());
    
    try {
      const result = await withRetry(checkin, config.MAX_RETRY);
      console.log('Cron job succeeded:', result);
      await sendTelegramNotification(`✅ 自动签到成功\n${result}`);
    } catch (error) {
      console.error('Cron job failed:', error);
      await sendTelegramNotification(`❌ 自动签到失败\n${error.message}`);
    }
  }
};

async function initializeConfig(env) {
  config = {
    DOMAIN: env.DOMAIN || config.DOMAIN,
    EMAIL: env.EMAIL || config.EMAIL,
    PASSWORD: env.PASSWORD || config.PASSWORD,
    TRIGGER_PATH: env.TRIGGER_PATH || config.TRIGGER_PATH,
    TG_BOT_TOKEN: env.TG_BOT_TOKEN || config.TG_BOT_TOKEN,
    TG_CHAT_ID: env.TG_CHAT_ID || config.TG_CHAT_ID,
    MAX_RETRY: env.MAX_RETRY ? parseInt(env.MAX_RETRY) : config.MAX_RETRY
  };
}

async function checkin() {
  try {
    console.log(`[${config.EMAIL}] 进行登录...`);
    
    const loginResponse = await fetch(`${config.DOMAIN}/auth/login`, {
      method: 'POST',
      headers: createHeaders('login'),
      body: JSON.stringify({ email: config.EMAIL, passwd: config.PASSWORD })
    });
    
    const loginResult = await loginResponse.json();
    console.log(loginResult.msg);
    
    const cookies = parseCookies(loginResponse.headers.get('set-cookie'));
    await delay(1000);
    
    const checkinResponse = await fetch(`${config.DOMAIN}/user/checkin`, {
      method: 'POST',
      headers: { ...createHeaders('checkin'), Cookie: cookies }
    });
    
    const checkinResult = await checkinResponse.json();
    console.log(checkinResult.msg);
    return `🎉 签到成功！\n${checkinResult.msg}`;
  } catch (error) {
    console.error('签到失败:', error);
    throw new Error('签到失败');
  }
}

async function sendTelegramNotification(message) {
  if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) return;
  
  const payload = {
    chat_id: config.TG_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('Telegram通知失败:', await response.text());
    }
  } catch (error) {
    console.error('Telegram通知异常:', error);
  }
}

function createHeaders(type = 'default') {
  const common = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': config.DOMAIN
  };

  return {
    login: { ...common, 'Content-Type': 'application/json', 'Referer': `${config.DOMAIN}/auth/login` },
    checkin: { ...common, 'Referer': `${config.DOMAIN}/user/panel`, 'X-Requested-With': 'XMLHttpRequest' }
  }[type] || common;
}

function parseCookies(cookieHeader) {
  return (cookieHeader || '').split(',').map(c => c.split(';')[0].trim()).join('; ');
}

async function withRetry(fn, retries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(2000 * (i + 1));
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function successResponse(data) {
  return new Response(data, { status: 200, headers: { 'Content-Type': 'text/plain; charset=UTF-8' } });
}

function errorResponse(error) {
  return new Response(error.message, { status: 500, headers: { 'Content-Type': 'text/plain; charset=UTF-8' } });
}
