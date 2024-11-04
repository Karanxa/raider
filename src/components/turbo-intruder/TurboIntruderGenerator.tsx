import { useState } from "react";
import { Terminal } from "lucide-react";
import TurboIntruderForm, { TurboIntruderFormValues } from "./TurboIntruderForm";
import ScriptDisplay from "./ScriptDisplay";

const TurboIntruderGenerator = () => {
  const [generatedScript, setGeneratedScript] = useState<string>("");

  const generateScript = (values: TurboIntruderFormValues) => {
    let script = `def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        requestsPerConnection=${values.requestsPerConnection},
        maxRetriesPerRequest=${values.maxRetries},
        pipeline=False,
        maxQueueSize=${values.raceCondition ? values.raceThreads : 1},
        timeout=10
    )
    
    ${values.payloadType === "wordlist" 
      ? `wordlist = wordlists.clipboard if wordlists.clipboard else wordlists.default`
      : values.payloadType === "numbers"
      ? `wordlist = range(1, 1000)`
      : `custom_payloads = """${values.customPayload}""".splitlines()`
    }
    
    ${values.raceCondition ? `
    # Race condition setup
    ${values.raceMode === "sync" ? `
    def race_attack(payload):
        if ${values.preRaceDelay} > 0:
            time.sleep(${values.preRaceDelay}/1000)
        reqs = []
        for i in range(${values.raceThreads}):
            reqs.append(target.req)
        engine.queue_all(reqs, payload)
        time.sleep(${values.raceTiming}/1000)
    ` : values.raceMode === "burst" ? `
    def race_attack(payload):
        if ${values.preRaceDelay} > 0:
            time.sleep(${values.preRaceDelay}/1000)
        reqs = []
        for i in range(${values.raceThreads}):
            reqs.append(target.req)
        engine.queue_all_at_once(reqs, payload)
    ` : `
    def race_attack(payload):
        if ${values.preRaceDelay} > 0:
            time.sleep(${values.preRaceDelay}/1000)
        for i in range(${values.raceThreads}):
            engine.queue(target.req, payload)
            time.sleep(${values.raceTiming}/1000)
    `}
    
    for word in ${values.payloadType === "custom" ? "custom_payloads" : "wordlist"}:
        race_attack(word.rstrip())
    ` : 
    values.engineMode === "clusterbomb" && values.variable2 
      ? `for word1 in ${values.payloadType === "custom" ? "custom_payloads" : "wordlist"}:
        for word2 in ${values.payloadType === "custom" ? "custom_payloads" : "wordlist"}:
            engine.queue(target.req, [word1.rstrip(), word2.rstrip()], learn=1)`
      : `for word in ${values.payloadType === "custom" ? "custom_payloads" : "wordlist"}:
            engine.queue(target.req, word.rstrip(), learn=1)`
    }
    
    engine.start(${values.requestsPerSecond})

def handleResponse(req, interesting):
    if interesting:
        table.add(req)`;

    setGeneratedScript(script);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Terminal className="h-5 w-5" />
      </div>
      
      <TurboIntruderForm onSubmit={generateScript} />
      <ScriptDisplay script={generatedScript} />
    </div>
  );
};

export default TurboIntruderGenerator;