declare module 'react-qr-scanner' {
    import { Component } from 'react';

    interface QrReaderProps {
        delay?: number | false;
        onError?: (error: any) => void;
        onScan?: (data: { text: string } | null) => void;
        style?: React.CSSProperties;
        className?: string;
        constraints?: MediaTrackConstraints | { video: { facingMode: string } };
    }

    export default class QrReader extends Component<QrReaderProps> { }
}
