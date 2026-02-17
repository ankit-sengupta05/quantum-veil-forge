import { useCallback, useState } from "react";
import { Upload, ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  previewUrl: string | null;
}

export function FileUploader({ onFileSelect, file, previewUrl }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0 && files[0].type.startsWith("image/")) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Cover Image
      </label>

      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-all duration-300 overflow-hidden ${
          isDragging
            ? "border-primary bg-primary/5 glow-violet"
            : file
            ? "border-accent/30"
            : "border-border/50 hover:border-muted-foreground/30"
        }`}
      >
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <img
                src={previewUrl}
                alt="Cover"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-accent" />
                  <span className="text-xs font-mono text-accent truncate max-w-[180px]">
                    {file?.name}
                  </span>
                </div>
                <button
                  onClick={() => onFileSelect(null)}
                  className="p-1 rounded-full bg-destructive/20 hover:bg-destructive/40 transition-colors"
                >
                  <X className="w-3 h-3 text-destructive" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.label
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-4 cursor-pointer"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />
              <div className="w-12 h-12 rounded-xl glass border-glow-violet flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-foreground mb-1">
                Drop image here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, BMP up to 10MB
              </p>
            </motion.label>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
