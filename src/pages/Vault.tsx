import { Archive, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";

const vaultEntries = [
  { id: 1, name: "mission_brief.png", date: "2026-02-15", method: "AES+RSA+LSB", size: "2.4 MB" },
  { id: 2, name: "coordinates.jpg", date: "2026-02-14", method: "AES+RSA+LSB", size: "1.8 MB" },
  { id: 3, name: "payload_alpha.png", date: "2026-02-12", method: "AES+RSA+LSB", size: "3.1 MB" },
];

const Vault = () => {
  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">
      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vault</h2>
          <p className="text-xs text-muted-foreground font-mono">
            Encrypted history of all steganographic operations
          </p>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-3">
          {vaultEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-lg p-4 flex items-center gap-4 hover:border-glow-violet transition-all duration-300 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-foreground truncate">{entry.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.date}
                  </span>
                  <span className="text-[10px] font-mono text-accent">{entry.method}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{entry.size}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vault;
