# Google OAuth Login Fix Guide

## 🚨 錯誤訊息
```
invalid_client
The OAuth client was not found.
client_id=805096516241-b0nkeulg0de279clilrn2njpb51j47oa.apps.googleusercontent.com
```

## 🔧 修復步驟

### 1. 檢查 Google Cloud Console 設置

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案（或創建新專案）
3. 前往 **APIs & Services** > **Credentials**

### 2. 驗證 OAuth 2.0 Client ID

確認你的 Client ID 是否正確：
- 檢查 Client ID 是否與錯誤訊息中的相符
- 確認該 Client 沒有被刪除或禁用

### 3. 檢查授權的重定向 URI

在 OAuth 2.0 Client 設置中，確保已添加以下 URI：

**生產環境：**
```
https://health-tracker-neon.vercel.app/api/auth/callback/google
```

**開發環境：**
```
http://localhost:3000/api/auth/callback/google
```

### 4. 更新環境變數

在 Vercel 專案設置中，確認這些環境變數：

```bash
GOOGLE_CLIENT_ID=你的實際client_id
GOOGLE_CLIENT_SECRET=你的實際client_secret
NEXTAUTH_URL=https://health-tracker-neon.vercel.app
NEXTAUTH_SECRET=你的secret_key
```

### 5. 檢查 NextAuth 配置

確認 `src/lib/auth.ts` 中的 Google Provider 配置：

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})
```

### 6. 可能的問題和解決方案

#### A. Client ID 不匹配
- 確認環境變數中的 Client ID 與 Google Console 中的完全一致
- 檢查是否有多餘的空格或換行符

#### B. OAuth 同意畫面未配置
1. 在 Google Console 中前往 **OAuth consent screen**
2. 確保已完成配置並選擇了正確的用戶類型
3. 添加必要的範圍（email, profile）

#### C. 專案未啟用 Google+ API
1. 前往 **APIs & Services** > **Library**
2. 搜尋並啟用 "Google+ API" 或 "Google Identity Toolkit API"

### 7. 重新部署

完成上述修復後：

```bash
# 在 Vercel 中重新部署
vercel --prod

# 或通過 Git push 觸發自動部署
git add .
git commit -m "Fix Google OAuth configuration"
git push
```

### 8. 測試檢查清單

- [ ] Google Cloud Console 中 OAuth Client 存在且啟用
- [ ] Redirect URIs 包含生產環境 URL
- [ ] Vercel 環境變數正確設置
- [ ] OAuth 同意畫面已配置
- [ ] 必要的 APIs 已啟用
- [ ] Client ID 和 Secret 沒有額外空格

### 9. 調試提示

如果仍有問題，可以：

1. 在瀏覽器開發者工具中檢查網絡請求
2. 查看 Vercel 函數日誌
3. 暫時在 auth.ts 中添加調試日誌：

```typescript
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('NextAuth URL:', process.env.NEXTAUTH_URL);
```

## 📝 快速檢查命令

```bash
# 檢查本地環境變數
cat .env.local | grep GOOGLE

# 檢查 Vercel 環境變數
vercel env ls

# 查看 Vercel 函數日誌
vercel logs --follow
```