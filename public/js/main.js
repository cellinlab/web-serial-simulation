import { serialManager } from './SerialManager.js';

// 状态元素
const status = document.getElementById('status');
const output = document.getElementById('output');
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');

// 事件监听
serialManager.on('connected', () => {
  status.textContent = '已连接';
  status.className = 'status connected';
  connectButton.disabled = true;
  disconnectButton.disabled = false;
});

serialManager.on('disconnected', () => {
  status.textContent = '未连接';
  status.className = 'status disconnected';
  connectButton.disabled = false;
  disconnectButton.disabled = true;
});

serialManager.on('data', (data) => {
  output.textContent += data + '\n';
  output.scrollTop = output.scrollHeight;
});

serialManager.on('error', (error) => {
  console.error('串口错误:', error);
  output.textContent += `错误: ${error.message}\n`;
});

// 连接按钮
connectButton.addEventListener('click', async () => {
  try {
    await serialManager.connect({
      baudRate: 9600
    });
  } catch (error) {
    console.error('连接失败:', error);
  }
});

// 断开按钮
disconnectButton.addEventListener('click', async () => {
  try {
    await serialManager.disconnect();
  } catch (error) {
    console.error('断开失败:', error);
  }
});

// 页面关闭时清理
window.addEventListener('beforeunload', () => {
  if (serialManager.isConnected) {
    serialManager.disconnect();
  }
}); 