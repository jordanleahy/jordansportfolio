export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  timestamp: number;
  error?: string;
}

export interface IRealtimeConnection {
  connect(userId: string): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): ConnectionStatus;
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;
}