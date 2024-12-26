const { SerialPort } = require('serialport')

const port = new SerialPort({
  path: '/dev/cu.PL2303G-USBtoUART1320',
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  rtscts: false,
  xon: false,
  xoff: false
})

let sendInterval;

port.on('open', () => {
  console.log('串口已打开')

  sendInterval = setInterval(() => {
    const message = `当前时间: ${new Date().toLocaleTimeString()}\n`
    const buffer = Buffer.from(message, 'utf8')
    port.write(buffer, (err) => {
      if (err) {
        console.error('发送错误:', err.message)
        clearInterval(sendInterval)
      } else {
        console.log('已发送:', message.trim())
      }
    })
  }, 1000)
})

// 监听数据接收
port.on('data', (data) => {
  console.log('接收到数据:', data.toString())
})

// 监听端口关闭
port.on('close', () => {
  console.log('串口已关闭')
  if (sendInterval) {
    clearInterval(sendInterval)
  }
})

// 监听错误
port.on('error', (err) => {
  console.error('串口错误:', err.message)
  if (sendInterval) {
    clearInterval(sendInterval)
  }
})

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n正在关闭串口...')
  if (sendInterval) {
    clearInterval(sendInterval)
  }
  port.close(() => {
    console.log('串口已关闭')
    process.exit()
  })
})