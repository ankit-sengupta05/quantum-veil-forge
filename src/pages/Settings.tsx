import { Settings as SettingsIcon, Monitor, Palette, Shield } from "lucide-react";
import { motion } from "framer-motion";

const SettingsPage = () => {
  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">
      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <p className="text-xs text-muted-foreground font-mono">
            Configure encryption parameters and preferences
          </p>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">
        {[
          { icon: Shield, label: "Encryption", desc: "Default cipher suite and key length" },
          { icon: Monitor, label: "Interface", desc: "Display preferences and layout" },
          { icon: Palette, label: "Appearance", desc: "Theme and visual customization" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-lg p-5 flex items-center gap-4 hover:border-glow-violet transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
