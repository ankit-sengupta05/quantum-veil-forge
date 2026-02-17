import { MessageSquare } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function MessageInput({ value, onChange }: MessageInputProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Secret Message
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter the message to hide within the image..."
          rows={5}
          className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:glow-violet transition-all duration-300 resize-none font-mono"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <MessageSquare className="w-3 h-3 text-muted-foreground/40" />
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {value.length} chars
          </span>
        </div>
      </div>
    </div>
  );
}
