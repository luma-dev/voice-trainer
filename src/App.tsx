import { Howl } from 'howler';
import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import type { Status } from './const';
import { LS_HISTORY_SIZE, LS_RECORD_LENGTH, LS_WAIT_BEFORE_PLAY, LS_WAIT_BEFORE_RECORD } from './const';
import { useLocalStorageString } from './localstorage-hooks';
import RecordSettings from './RecordSettings';

const formatDate = (d: Date) => {
  const year = `${`000${d.getFullYear()}`.slice(-4)}`;
  const date = `${`0${d.getDate()}`.slice(-2)}`;
  const month = `${`0${d.getMonth()}`.slice(-2)}`;

  const hours = `${`0${d.getHours()}`.slice(-2)}`;
  const minutes = `${`0${d.getMinutes()}`.slice(-2)}`;
  const seconds = `${`0${d.getSeconds()}`.slice(-2)}`;

  return `${year}-${date}-${month}_${hours}-${minutes}-${seconds}`;
};

const playAudio = (src: string, format: string) => {
  const howl = new Howl({
    src,
    html5: true,
    format,
  });
  howl.play();
};

const playAudioAndWait = (src: string) => {
  return new Promise<void>((resolve) => {
    const howl = new Howl({
      src,
      html5: true,
    });
    howl.play();
    howl.once('end', () => {
      resolve();
    });
  });
};

const tryCreateMediaStream = async (deviceInfo: MediaDeviceInfo | null) => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio:
          deviceInfo == null
            ? true
            : {
                deviceId: deviceInfo.deviceId,
                groupId: deviceInfo.groupId,
              },
      });
    } catch {
      return null;
    }
  } else {
    return null;
  }
};

const tryEnumerateDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
  } catch {
    return null;
  }
};

/* eslint-disable react/no-array-index-key */
const App = () => {
  const [, refresher] = useState({});
  const refresh = () => {
    refresher({});
  };
  const c = useRef(0);
  const upCount = () => {
    c.current = (c.current + 1) % 100_000_000;
    refresh();
  };
  const status = useRef<Status>('waitForRecord');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [lastRecord, setLastRecord] = useState<Blob | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[] | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [cycling, setCycling] = useState(false);
  const deviceInfo = useMemo(() => {
    const searchId = deviceId || 'default';
    if (devices == null) return null;
    const found = devices.find((d) => d.deviceId === searchId);
    if (found == null) return null;
    return found;
  }, [deviceId, devices]);
  const audioUrl = useMemo(() => lastRecord && window.URL.createObjectURL(lastRecord), [lastRecord]);

  const [waitBeforeRecordStr, setWaitBeforeRecord] = useLocalStorageString(LS_WAIT_BEFORE_RECORD, '400');
  const [recordLengthStr, setRecordLength] = useLocalStorageString(LS_RECORD_LENGTH, '5000');
  const [waitBeforePlayStr, setWaitBeforePlay] = useLocalStorageString(LS_WAIT_BEFORE_PLAY, '400');
  const [historySizeStr, setHistorySize] = useLocalStorageString(LS_HISTORY_SIZE, '5');

  const waitBeforeRecord = useMemo(() => Number.parseInt(waitBeforeRecordStr, 10), [waitBeforeRecordStr]);
  const recordLength = useMemo(() => Number.parseInt(recordLengthStr, 10), [recordLengthStr]);
  const waitBeforePlay = useMemo(() => Number.parseInt(waitBeforePlayStr, 10), [waitBeforePlayStr]);
  const historySize = useMemo(() => Number.parseInt(historySizeStr, 10), [historySizeStr]);

  const history = useRef<{ url: string; mimeType: string; filename: string }[]>([]);
  const pushHistory = (record: Blob, mimeType: string) => {
    history.current = [
      {
        url: window.URL.createObjectURL(record),
        filename: `${formatDate(new Date())}__${c.current}.ogg`,
        mimeType,
      },
      ...history.current,
    ].slice(0, historySize);
    refresh();
  };

  useEffect(() => {
    void tryEnumerateDevices().then((ds) => {
      setDevices(ds);
    });
  }, []);

  const startRecording = async () => {
    const recC = c.current;
    const s = await tryCreateMediaStream(deviceInfo);
    if (s == null) {
      setUnsupported(true);
      return;
    }
    const mr = new MediaRecorder(s);
    setMediaRecorder(mr);
    void playAudioAndWait('/audio/beep-1.wav').then(() => {
      mr.start();
    });

    const startHandler = () => {
      mr.removeEventListener('start', startHandler);
      status.current = 'recording';
      refresh();
      setTimeout(() => {
        if (recC !== c.current || status.current !== 'recording') return;
        mr.stop();
        status.current = 'waitForPlaying';
        refresh();
      }, recordLength);
    };
    mr.addEventListener('start', startHandler);

    const chunks: Blob[] = [];
    const dataAvailableHandler = (ev: BlobEvent) => {
      chunks.push(ev.data);
    };
    mr.addEventListener('dataavailable', dataAvailableHandler);
    const stopHandler = () => {
      mr.removeEventListener('dataavailable', dataAvailableHandler);
      mr.removeEventListener('stop', stopHandler);
      void playAudioAndWait('/audio/beep-2.wav');
      const blob = new Blob(chunks, { type: mr.mimeType });
      setLastRecord(blob);
      pushHistory(blob, mr.mimeType);

      if (recC !== c.current) return;
      setTimeout(() => {
        if (recC !== c.current || status.current !== 'waitForPlaying') return;
        status.current = 'playing';
        refresh();
      }, waitBeforePlay);
    };
    mr.addEventListener('stop', stopHandler);
    setMediaRecorder(mr);
  };

  const reserveStartRecording = () => {
    setTimeout(() => {
      void startRecording();
    }, waitBeforeRecord);
  };

  const playEndHandler = () => {
    if (!cycling) return;
    if (status.current === 'playing') {
      status.current = 'waitForRecord';
      upCount();
      reserveStartRecording();
      refresh();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder == null || status.current !== 'recording') return;
    if (status.current === 'recording') {
      mediaRecorder.stop();
    }
    setMediaRecorder(null);
  };

  const startCycle = () => {
    refresh();
    setCycling(true);
    status.current = 'waitForRecord';
    reserveStartRecording();
  };
  const stopCycle = () => {
    refresh();
    setCycling(false);
    upCount();
    if (status.current === 'recording') {
      stopRecording();
    }
    status.current = 'waitForRecord';
  };

  if (unsupported) {
    return (
      <div className="App">
        <header className="App-header">
          <p>Unfortunately, your browser is unsupported, or micropohone access is denied.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>Vioce Trainer</p>
        {devices && (
          <select
            onChange={(ev) => {
              setDeviceId(ev.target.value);
            }}
          >
            <option value="">---</option>
            {devices
              .filter((d) => d.deviceId)
              .map((d, i) => (
                <option key={i} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
          </select>
        )}
        <button type="button" onClick={cycling ? stopCycle : startCycle}>
          {cycling ? 'stop' : 'start'}
        </button>
        {cycling && <div>status: {status.current}</div>}
        <RecordSettings
          waitBeforeRecordStr={waitBeforeRecordStr}
          recordLengthStr={recordLengthStr}
          waitBeforePlayStr={waitBeforePlayStr}
          historySizeStr={historySizeStr}
          setWaitBeforeRecord={setWaitBeforeRecord}
          setRecordLength={setRecordLength}
          setWaitBeforePlay={setWaitBeforePlay}
          setHistorySize={setHistorySize}
        />
        {audioUrl && status.current === 'playing' && (
          <audio key={audioUrl} src={audioUrl} autoPlay onEnded={playEndHandler} />
        )}
        {deviceInfo && (
          <div>
            <ul>
              <li>deviceId: {deviceInfo.deviceId}</li>
              <li>label: {deviceInfo.label}</li>
              <li>kind: {deviceInfo.kind}</li>
              <li>groupId: {deviceInfo.groupId}</li>
            </ul>
          </div>
        )}
        <div>
          <h2>history(click to download)</h2>
          <div>latest</div>
          {history.current.map((d) => {
            return (
              <div key={d.filename}>
                <a href={d.url} download={d.filename}>
                  {d.filename}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    playAudio(d.url, d.mimeType);
                  }}
                >
                  play
                </button>
              </div>
            );
          })}
          <div>oldest</div>
        </div>
      </header>
    </div>
  );
};
/* eslint-enable react/no-array-index-key */

export default App;
