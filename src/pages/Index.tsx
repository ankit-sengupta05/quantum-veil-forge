import { useState, useCallback, useEffect } from "react";
import { Zap, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { MessageInput } from "@/components/MessageInput";
import { EncryptionPipeline, type EncryptionStep } from "@/components/EncryptionPipeline";
import { OutputGallery } from "@/components/OutputGallery";
import { motion } from "framer-motion";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [currentStep, setCurrentStep] = useState<EncryptionStep>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFileSelect = useCallback((f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    setCurrentStep(0);
    setIsComplete(false);
  }, []);

  const handleExecute = useCallback(() => {
    if (!file || !message) return;
    setIsProcessing(true);
    setCurrentStep(1);

    // Simulate 3-step encryption
    setTimeout(() => setCurrentStep(2), 1500);
    setTimeout(() => setCurrentStep(3), 3000);
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 4500);
  }, [file, message]);

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setMessage("");
    setCurrentStep(0);
    setIsProcessing(false);
    setIsComplete(false);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canExecute = file && message.length > 0 && !isProcessing;

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Encode</h2>
            <p className="text-xs text-muted-foreground font-mono">
              Hide messages within images using 3-level encryption
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Button variant="glass-accent" size="sm" className="gap-1.5 font-mono text-xs">
                  <Download className="w-3 h-3" />
                  Export
                </Button>
              </motion.div>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Left: Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="glass rounded-xl p-5 space-y-6">
              <FileUploader
                onFileSelect={handleFileSelect}
                file={file}
                previewUrl={previewUrl}
              />
              <MessageInput value={message} onChange={setMessage} />

              {/* Execute Button */}
              <Button
                variant="execute"
                size="lg"
                className="w-full gap-2 font-mono text-sm h-12"
                disabled={!canExecute}
                onClick={handleExecute}
              >
                <Zap className="w-4 h-4" />
                {isProcessing
                  ? "EXECUTING PIPELINE..."
                  : isComplete
                  ? "PIPELINE COMPLETE"
                  : "EXECUTE STEGANOGRAPHY"}
              </Button>
            </div>
          </motion.div>

          {/* Right: Pipeline + Output */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass rounded-xl p-5">
              <EncryptionPipeline
                currentStep={currentStep}
                isProcessing={isProcessing}
              />
            </div>

            <div className="glass rounded-xl p-5">
              <OutputGallery
                originalUrl={previewUrl}
                resultUrl={previewUrl}
                isComplete={isComplete}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
