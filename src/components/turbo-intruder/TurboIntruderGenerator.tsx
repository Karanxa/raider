import { useState } from "react";
import { Terminal } from "lucide-react";
import TurboIntruderForm, { TurboIntruderFormValues } from "./TurboIntruderForm";
import ScriptDisplay from "./ScriptDisplay";

const TurboIntruderGenerator = () => {
  const [generatedScript, setGeneratedScript] = useState<string>("");

  const generateScript = (values: TurboIntruderFormValues) => {
    const script = `def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        requestsPerConnection=${values.requestsPerConnection},
        maxRetriesPerRequest=${values.maxRetries},
        pipeline=False,
        maxQueueSize=1,
        timeout=10
    )
    
    ${values.payloadType === "wordlist" 
      ? `wordlist = wordlists.clipboard if wordlists.clipboard else wordlists.default`
      : values.payloadType === "numbers"
      ? `wordlist = range(1, 1000)`
      : `custom_payloads = """${values.customPayload}""".splitlines()`
    }
    
    ${values.engineMode === "clusterbomb" && values.variable2 
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
        {/* Removed the "Generate Turbo Intruder Script" text */}
      </div>
      
      <TurboIntruderForm onSubmit={generateScript} />
      <ScriptDisplay script={generatedScript} />
    </div>
  );
};

export default TurboIntruderGenerator;