import { Lock, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Decode = () => {
  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">
      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Decode</h2>
          <p className="text-xs text-muted-foreground font-mono">
            Extract hidden messages from steganographic images
          </p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-12 text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl glass border-glow-cyan flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Decode Mode</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload an encoded image to extract the hidden message using the decryption pipeline.
          </p>
          <Button variant="glass-accent" className="gap-2 font-mono text-xs">
            <Upload className="w-4 h-4" />
            Upload Encoded Image
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Decode;
