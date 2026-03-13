(function() {
  const SERVER_URL = window.location.protocol + '//' + 
    (window._braproServer || document.currentScript.src.split('/embed.js')[0]);

  const style = document.createElement('style');
  style.textContent = `
    .brapro-chat-icon {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      z-index: 999999;
      transition: transform 0.2s;
    }
    .brapro-chat-icon:hover { transform: scale(1.1); }
    .brapro-chat-icon .brapro-tooltip {
      position: absolute;
      right: 70px;
      background: #333;
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      font-family: sans-serif;
    }
    .brapro-chat-icon:hover .brapro-tooltip { opacity: 1; }
    .brapro-chat-window {
      position: fixed;
      bottom: 100px;
      right: 30px;
      width: 380px;
      height: 550px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      z-index: 999998;
      overflow: hidden;
      font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
    }
    .brapro-chat-window.open { display: flex; }
    .brapro-chat-header {
      background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brapro-chat-header-title { font-size: 15px; font-weight: bold; }
    .brapro-chat-header-sub { font-size: 11px; opacity: 0.85; margin-top: 2px; }
    .brapro-chat-close {
      background: none;
      border: none;
      color: white;
      font-size: 22px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .brapro-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f5f5f5;
    }
    .brapro-message { margin-bottom: 12px; display: flex; flex-direction: column; }
    .brapro-message.user { align-items: flex-end; }
    .brapro-message.bot { align-items: flex-start; }
    .brapro-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .brapro-message.user .brapro-bubble {
      background: linear-gradient(135deg, #2d5a27, #4a7c43);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .brapro-message.bot .brapro-bubble {
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    .brapro-typing {
      display: flex;
      gap: 4px;
      padding: 12px 14px;
      background: white;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    .brapro-typing span {
      width: 8px; height: 8px;
      background: #aaa;
      border-radius: 50%;
      animation: braPulse 1.2s infinite;
    }
    .brapro-typing span:nth-child(2) { animation-delay: 0.2s; }
    .brapro-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes braPulse {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }
    .brapro-chat-input-area {
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
    }
    .brapro-chat-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      resize: none;
      font-family: inherit;
      max-height: 80px;
    }
    .brapro-chat-input:focus { border-color: #4a7c43; }
    .brapro-chat-send {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #2d5a27, #4a7c43);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .brapro-chat-send:hover { opacity: 0.85; }
    @media (max-width: 480px) {
      .brapro-chat-window {
        width: calc(100% - 20px);
        height: calc(100% - 90px);
        bottom: 80px;
        right: 10px;
        left: 10px;
      }
    }
  `;
  document.head.appendChild(style);

  const icon = document.createElement('div');
  icon.className = 'brapro-chat-icon';
  icon.innerHTML = '🐝<span class="brapro-tooltip">お客様相談室</span>';
  document.body.appendChild(icon);

  const win = document.createElement('div');
  win.className = 'brapro-chat-window';
  win.innerHTML = `
    <div class="brapro-chat-header">
      <div>
        <div class="brapro-chat-header-title">🐝 ブラプロ お客様相談室</div>
        <div class="brapro-chat-header-sub">プロポリスのことなら何でもどうぞ</div>
      </div>
      <button class="brapro-chat-clos
