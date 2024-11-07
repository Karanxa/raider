export type TurboIntruderFormValues = {
  engineMode: string;
  requestsPerConnection: number;
  requestsPerSecond: number;
  variable1: string;
  variable2: string;
  payloadType: string;
  customPayload: string;
  maxRetries: number;
  raceCondition: boolean;
  raceTiming: number;
  raceThreads: number;
  raceMode: string;
  preRaceDelay: number;
};