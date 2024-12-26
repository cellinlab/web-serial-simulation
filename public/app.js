const connectButton = document.getElementById('connectButton');
const output = document.getElementById('output');

connectButton.addEventListener('click', async () => {
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    const reader = port.readable.getReader();
    const decoder = new TextDecoder();

    let outputData = '';

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        reader.releaseLock();
        break;
      }

      outputData += decoder.decode(value);
      output.textContent = outputData;
    }
  } catch (error) {
    console.error('Error connecting to serial port:', error);
    output.textContent = 'Failed to connect to serial port';
  }
});