export const defaultHyperparameters = {
  // Basic parameters
  learningRate: "0.0001",
  batchSize: "32",
  epochs: "10",
  warmupSteps: "500",
  weightDecay: "0.01",
  optimizerType: "adamw",
  schedulerType: "linear",
  gradientClipping: "1.0",
  useEarlyStopping: true,
  validationSplit: "0.2",
  dropoutRate: "0.1",
  seed: "42",
  maxSteps: "1000",
  evaluationStrategy: "steps",
  evaluationSteps: "500",
  loggingSteps: "100",
  saveStrategy: "steps",
  saveSteps: "500",
  
  // Advanced parameters
  finetuningType: "sft",
  
  loraConfig: {
    rank: "8",
    alpha: "16",
    dropout: "0.1",
    targetModules: [],
    bias: "none",
    scalingRank: "4",
    moduleMapping: "",
    fanoutScaling: false,
    useReparameterization: false,
    rankPattern: "8,16,32",
    alphaPattern: "16,32,64",
    taskType: "causal_lm"
  },
  
  qloraConfig: {
    bitsQuant: "4",
    groupSize: "128",
    doubleQuant: true,
    quantizationMethod: "symmetric",
    useNesterov: false,
    usePagedOptim: true,
    useFastTokenizer: true,
    blockSize: "64",
    targetModules: [],
    quantizedDataType: "nf4"
  },
  
  sftConfig: {
    useDeepSpeed: false,
    gradientCheckpointing: true,
    mixedPrecision: "fp16",
    useFlashAttention: true,
    useXformers: false,
    useTritonKernels: false,
    gradientAccumulationSteps: "4",
    maxGradNorm: "1.0",
    optimMemory: true,
    useActivationCheckpointing: false,
    useFsdp: false,
    useParallelTraining: false
  }
};