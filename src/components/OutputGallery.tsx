import { useState } from "react";
import { Eye, EyeOff, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface OutputGalleryProps {
  originalUrl: string | null;
  resultUrl: string | null;
  isComplete: boolean;
}

export function OutputGallery({ originalUrl, resultUrl, isComplete }: OutputGalleryProps) {
  const [showDiffMap, setShowDiffMap] = useState(false);

  if (!isComplete || !originalUrl || !resultUrl) {
    return (
      <div className="glass rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Layers className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Output will appear here</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Execute the pipeline to generate results
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Output Comparison
        </label>
        <Button
          variant="glass"
          size="sm"
          onClick={() => setShowDiffMap(!showDiffMap)}
          className="h-7 text-xs font-mono gap-1.5"
        >
          {showDiffMap ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showDiffMap ? "Hide Diff" : "Diff Map"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border/30">
            <span className="text-[10px] font-mono text-muted-foreground">ORIGINAL</span>
          </div>
          <img src={originalUrl} alt="Original" className="w-full h-40 object-cover" />
        </div>
        <div className="glass rounded-lg overflow-hidden border-glow-cyan">
          <div className="px-3 py-2 border-b border-border/30">
            <span className="text-[10px] font-mono text-accent">ENCODED</span>
          </div>
          <img
            src={resultUrl}
            alt="Encoded"
            className={`w-full h-40 object-cover ${showDiffMap ? "mix-blend-difference" : ""}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {showDiffMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-lg overflow-hidden border-glow-violet"
          >
            <div className="px-3 py-2 border-b border-border/30">
              <span className="text-[10px] font-mono text-primary">DIFFERENCE MAP</span>
            </div>
            <div className="relative h-40 bg-background">
              <img
                src={originalUrl}
                alt="Diff base"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <img
                src={resultUrl}
                alt="Diff overlay"
                className="absolute inset-0 w-full h-full object-cover mix-blend-difference"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono text-primary bg-background/80 px-3 py-1 rounded-full">
                  Pixel difference amplified
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
