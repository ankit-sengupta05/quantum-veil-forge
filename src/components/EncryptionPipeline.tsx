import { Shield, Key, Shuffle, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type EncryptionStep = 0 | 1 | 2 | 3;

interface EncryptionPipelineProps {
  currentStep: EncryptionStep;
  isProcessing: boolean;
}

const steps = [
  {
    icon: Shield,
    label: "AES-256",
    sublabel: "Symmetric Encryption",
    description: "Military-grade block cipher",
  },
  {
    icon: Key,
    label: "RSA-4096",
    sublabel: "Asymmetric Layer",
    description: "Public-key cryptography",
  },
  {
    icon: Shuffle,
    label: "Bit-Shuffle",
    sublabel: "Steganographic Embed",
    description: "LSB pixel manipulation",
  },
];

export function EncryptionPipeline({ currentStep, isProcessing }: EncryptionPipelineProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        3-Level Security Pipeline
      </label>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = currentStep > stepNum;
          const isActive = currentStep === stepNum && isProcessing;
          const isPending = currentStep < stepNum;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={cn(
                  "glass rounded-lg p-4 transition-all duration-500 relative overflow-hidden",
                  isComplete && "border-glow-cyan",
                  isActive && "border-glow-violet glow-violet",
                  isPending && "opacity-50"
                )}
              >
                {/* Progress bar overlay */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary/5"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2, ease: "linear" }}
                    style={{ transformOrigin: "left" }}
                  />
                )}

                <div className="relative flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500",
                      isComplete && "bg-accent/15",
                      isActive && "bg-primary/15",
                      isPending && "bg-muted"
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <step.icon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold font-mono",
                          isComplete && "text-accent",
                          isActive && "text-primary",
                          isPending && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {step.sublabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-mono uppercase px-2 py-1 rounded-full",
                        isComplete && "bg-accent/10 text-accent",
                        isActive && "bg-primary/10 text-primary",
                        isPending && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? "DONE" : isActive ? "RUNNING" : "PENDING"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div
                    className={cn(
                      "w-px h-3 transition-colors duration-500",
                      currentStep > stepNum + 1
                        ? "bg-accent/40"
                        : "bg-border/40"
                    )}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
