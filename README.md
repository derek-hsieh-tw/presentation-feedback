# 簡報評分與評語生成系統（靜態範例）

這是一個純前端的靜態 HTML/CSS/JS 範例，適合直接部署到 GitHub Pages。它包含：

- 1–10 分評分項目（條理與架構 / 邏輯與說服力 / 內容深度與價值 / 視覺與表達呈現）
- 可調整權重
- 可設定目標總分（Starget）
- 關鍵字勾選或自訂標籤
- 依分數與關鍵字生成委婉、建設性的評語
- 簡潔版 / 用心版評語切換

## 部署方式

1. 將本專案的 `index.html`、`styles.css`、`script.js` 上傳到 GitHub repo。
2. 前往 GitHub repo → Settings → Pages。
3. Source 選擇 `Deploy from a branch`。
4. Branch 選擇 `main`，folder 選擇 `/(root)`。
5. 儲存後即可使用 GitHub Pages 連結。

## 預設網址

通常會是：

`https://<your-username>.github.io/<repo-name>/`

例如：

`https://derek-hsieh-tw.github.io/presentation-feedback/`

## 備註

這個範例是純前端的模板化評語生成；若未來要接入真正的 AI / LLM，建議把生成邏輯移到後端，避免 API key 暴露並方便做審核、紀錄與版本控制。
