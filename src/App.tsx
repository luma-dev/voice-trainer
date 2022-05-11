import { useState } from 'react';
import './App.css';

const tryCreateMediaStream = async () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    } catch {
      return null;
    }
  } else {
    return null;
  }
};

function App() {
  const [count, setCount] = useState(0);

  const record = async () => {
    const stream = await tryCreateMediaStream();
    const mediaRecorder = new MediaRecorder(stream);
  };

  const stop = () => {};

  const soundClips = () => {};

  return (
    <div className="App">
      <header className="App-header">
        <p>Vioce Trainer</p>
        <button onClick={record}>record</button>
        <button onClick={stop}>stop</button>
        <button onClick={soundClips}>soundClips</button>
      </header>
    </div>
  );
}

export default App;
