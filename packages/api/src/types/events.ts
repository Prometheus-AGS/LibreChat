export type ServerSentEvent = {
  data: string | Record<string, unknown>;
  event?: string;
};

export type ArtifactValidationProgressEvent = {
  type: 'artifact_validation_progress';
  subType:
    | 'validation_start'
    | 'artifact_start'
    | 'compilation_start'
    | 'compilation_success'
    | 'compilation_failure'
    | 'retry_attempt'
    | 'fix_success'
    | 'fix_failure'
    | 'artifact_complete'
    | 'validation_complete'
    | 'error';
  messageId?: string;
  timestamp: string;
  message: string;
  totalArtifacts?: number;
  currentArtifact?: number;
  artifactType?: string;
  attempt?: number;
  maxAttempts?: number;
  errorCount?: number;
  errors?: Array<Record<string, unknown>>;
  success?: boolean;
  successCount?: number;
  failureCount?: number;
  allSuccessful?: boolean;
  isFinalAttempt?: boolean;
  error?: string;
  context?: string;
};
