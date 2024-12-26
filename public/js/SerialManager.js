class SerialManager {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners = new Map();
    this.decoder = new TextDecoder();
    this.encoder = new TextEncoder();
  }

  async connect(options = {}) {
    if (this.isConnecting) {
      throw new Error('正在连接中...');
    }

    if (this.isConnected) {
      throw new Error('已经连接');
    }

    this.isConnecting = true;

    try {
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate: options.baudRate || 9600,
        dataBits: options.dataBits || 8,
        stopBits: options.stopBits || 1,
        parity: options.parity || 'none',
        bufferSize: options.bufferSize || 255,
      });

      this.port = port;
      this.isConnected = true;
      this.emit('connected');
      this.startReading();

      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async startReading() {
    while (this.port?.readable && this.isConnected) {
      try {
        this.reader = this.port.readable.getReader();
        let buffer = '';

        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;

          const text = this.decoder.decode(value, { stream: true });
          buffer += text;

          // 按行处理数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            this.emit('data', line);
          }
        }
      } catch (error) {
        if (this.isConnected) {
          this.emit('error', error);
        }
      } finally {
        if (this.reader) {
          const currentReader = this.reader;
          this.reader = null;
          try {
            await currentReader.cancel();
            await currentReader.releaseLock();
          } catch (e) {
            console.warn('释放 reader 失败:', e);
          }
        }
      }
    }
  }

  async write(data) {
    if (!this.isConnected) {
      throw new Error('串口未连接');
    }

    if (!this.port?.writable) {
      throw new Error('串口不可写');
    }

    try {
      this.writer = this.port.writable.getWriter();
      await this.writer.write(this.encoder.encode(data));
    } finally {
      if (this.writer) {
        try {
          await this.writer.releaseLock();
        } catch (e) {
          console.warn('释放 writer 失败:', e);
        }
        this.writer = null;
      }
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件处理错误 (${event}):`, error);
        }
      });
    }
  }

  async disconnect() {
    if (!this.isConnected) return;

    this.isConnected = false;

    try {
      const currentReader = this.reader;
      const currentWriter = this.writer;

      this.reader = null;
      this.writer = null;

      if (currentReader) {
        try {
          await currentReader.cancel();
          await currentReader.releaseLock();
        } catch (e) {
          console.warn('释放 reader 失败:', e);
        }
      }

      if (currentWriter) {
        try {
          await currentWriter.releaseLock();
        } catch (e) {
          console.warn('释放 writer 失败:', e);
        }
      }

      if (this.port) {
        try {
          await this.port.close();
        } catch (e) {
          console.warn('关闭端口失败:', e);
        }
        this.port = null;
      }

      this.emit('disconnected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

// 导出单例
export const serialManager = new SerialManager(); 