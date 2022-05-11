import type { FC } from 'react';

interface Props {
  onUpdate?: () => void;

  waitBeforeRecordStr: string;
  recordLengthStr: string;
  waitBeforePlayStr: string;
  historySizeStr: string;

  setWaitBeforeRecord: React.Dispatch<React.SetStateAction<string>>;
  setRecordLength: React.Dispatch<React.SetStateAction<string>>;
  setWaitBeforePlay: React.Dispatch<React.SetStateAction<string>>;
  setHistorySize: React.Dispatch<React.SetStateAction<string>>;
}
const RecordSettings: FC<Props> = ({
  onUpdate,
  waitBeforeRecordStr,
  recordLengthStr,
  waitBeforePlayStr,
  historySizeStr,
  setWaitBeforeRecord,
  setRecordLength,
  setWaitBeforePlay,
  setHistorySize,
}) => {
  return (
    <div>
      <ul>
        <li>
          wait before record(ms):
          <input
            type="number"
            value={waitBeforeRecordStr}
            onChange={(ev) => {
              setWaitBeforeRecord(ev.target.value);
              onUpdate?.();
            }}
          />
        </li>
        <li>
          record length(ms):
          <input
            type="number"
            value={recordLengthStr}
            onChange={(ev) => {
              setRecordLength(ev.target.value);
              onUpdate?.();
            }}
          />
        </li>
        <li>
          wait before play(ms):
          <input
            type="number"
            value={waitBeforePlayStr}
            onChange={(ev) => {
              setWaitBeforePlay(ev.target.value);
              onUpdate?.();
            }}
          />
        </li>
        <li>
          History size:
          <input
            type="number"
            value={historySizeStr}
            onChange={(ev) => {
              setHistorySize(ev.target.value);
              onUpdate?.();
            }}
          />
        </li>
        <li>play length(ms): {recordLengthStr}</li>
      </ul>
    </div>
  );
};

export default RecordSettings;
