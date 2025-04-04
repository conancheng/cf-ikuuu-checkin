# Cloudflare Worker 自动签到服务

📡 基于 Cloudflare Workers 的自动化签到工具 | 🚀 支持 Telegram 通知 | ⚡ 失败自动重试

## 功能特性

- ✅ 定时自动签到（支持 Cron 表达式配置）
- 🔄 失败自动重试机制（可配置最大重试次数）
- 📨 Telegram 通知（成功/失败即时推送）
- 🎯 手动触发签到功能
- 🔒 环境变量加密存储
- 🔒 多账号支持 - 同时管理多个账号
## 快速部署

### 前置要求

1. Cloudflare 账户
2. 可用的服务域名（用于签到）
3. Telegram Bot Token & Chat ID（可选）

### 部署步骤

1. **创建新 Worker**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 Workers & Pages → 创建应用程序 → 创建 Worker

2. **配置环境变量**
   - 在 Worker 设置 → 变量 中添加以下环境变量：

   | 变量名          | 必填 | 示例值                  | 说明                     |
   |-----------------|------|-------------------------|--------------------------|
   | DOMAIN          | ❌  | `https://ikuuu.one`     | 签到服务域名（默认已填写）|
   | EMAIL           | ✅  | `user@example.com`      | 登录邮箱（单账号必填）                 |
   | PASSWORD        | ✅  | `SecurePassword123!`    | 登录密码 （单账号必填）                |
   | ACCOUNTS        | ✅  | "user1@mail.com&pass1&user2@mail.com&pass2"    | 多账号必填                 |
   | TG_BOT_TOKEN    | ❌  | `123456:ABC-DEF1234`    | Telegram 机器人 Token    |
   | TG_CHAT_ID      | ❌  | `-100123456789`         | Telegram 会话 ID         |
   | MAX_RETRY       | ❌  | `3`                     | 最大重试次数（默认 3）   |
   | TRIGGER_PATH    | ❌  | `/auto-checkin`         | 手动触发路径（默认路径） |

4. **配置定时任务**
   - 在 Worker → 触发器 → 添加 Cron 触发器
   - Cron表达式：`0 0 * * *` (UTC时间每天0点/北京时间8点)

5. **部署代码**
1. 在「Quick Edit」编辑器界面
2. 清空默认代码，粘贴[完整代码](https://github.com/ly921002/cf-ikuuu-checkin/blob/main/worker.js)（多账号使用[多账号代码](https://github.com/ly921002/cf-ikuuu-checkin/blob/main/多账号.js）
3. 点击 "保存并部署"

## 使用指南

### 手动触发签到

访问你的 Worker 域名 + 触发路径：
https://your-worker.your-subdomain.workers.dev/auto-checkin

### 验证配置
访问 Worker 根目录查看配置状态：
https://your-worker.your-subdomain.workers.dev/

### 通知示例
成功通知：
`✅ 自动签到成功  
🎉 签到成功！  
获得流量：500MB`

失败通知：  
`❌ 自动签到失败  
登录失败：无效的凭据`

## Telegram 配置指南

1. 创建 Bot：
   - 私聊 @BotFather，发送 `/newbot` 创建新机器人
   - 获取并保存 API Token

2. 获取 Chat ID：
   - 向你的机器人发送任意消息
   - 访问 `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
   - 查找 `chat.id` 字段

## 高级配置

### 自定义触发路径
修改 `TRIGGER_PATH` 环境变量：
```bash
TRIGGER_PATH = /your-custom-path
```

### 调整重试策略
通过 `MAX_RETRY` 控制重试次数：
```bash
MAX_RETRY = 5  # 最大重试次数
```

## 安全建议

1. 使用强密码策略
2. 定期轮换 Telegram Bot Token
3. 限制 Worker 访问权限
4. 启用 Cloudflare 的 WAF 防护

## 故障排查

- 🔍 查看实时日志：
  Workers 控制台 → 日志 → 实时日志

- 常见错误代码：
  - 401: 认证失败 → 检查邮箱/密码
  - 404: 路径错误 → 验证 TRIGGER_PATH
  - 500: 服务端错误 → 检查网络连通性

---

> 📝 **许可证**  
> 本项目采用 MIT 许可证 - 自由使用和修改，请遵守目标网站的服务条款

