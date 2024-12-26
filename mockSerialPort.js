const { SerialPort } = require('serialport')

const port = new SerialPort({
  path: '/dev/cu.PL2303G-USBtoUART1310',
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

    if (buffer.length !== Buffer.byteLength(message, 'utf8')) {
      console.error('数据编码异常')
      return
    }

    port.write(buffer, (err) => {
      if (err) {
        console.error('发送错误:', err.message)
        clearInterval(sendInterval)
      } else {
        console.log('已发送:', message.trim(), '字节长度:', buffer.length)
      }
    })
  }, 1000)
})

// 监听数据接收
port.on('data', (data) => {
  const received = data.toString('utf8')
  console.log('接收到数据:', received, '字节长度:', data.length)
})

// 监听端口关闭
port.on('close', () => {
  console.log('串口已关闭')
  if (sendInterval) {
    clearInterval(sendInterval)
    sendInterval = null
  }

  // 增加延迟时间，确保资源完全释放
  setTimeout(() => {
    if (!port.isOpen) {
      console.log('尝试重新打开串口...')
      port.open(err => {
        if (err) {
          console.error('重新打开串口失败:', err.message)
        } else {
          console.log('串口已重新打开')
        }
      })
    }
  }, 2000) // 增加延迟到 2 秒
})

// 监听错误
port.on('error', (err) => {
  console.error('串口错误:', err.message)
  if (sendInterval) {
    clearInterval(sendInterval)
  }

  // 错误发生后等待一段时间再尝试重新打开
  setTimeout(() => {
    if (!port.isOpen) {
      port.open(err => {
        if (err) {
          console.error('重新打开串口失败:', err.message)
        }
      })
    }
  }, 2000)
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

process.on('exit', () => {
  if (port.isOpen) {
    port.close()
  }
})

process.on('SIGTERM', () => {
  if (port.isOpen) {
    port.close(() => {
      process.exit(0)
    })
  }
})

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err)
  if (port.isOpen) {
    port.close(() => {
      process.exit(1)
    })
  }
})