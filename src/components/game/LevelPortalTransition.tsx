import { motion, AnimatePresence } from "framer-motion";

type LevelPortalTransitionProps = {
  open: boolean;
  level?: number;
  nextLevel?: number;
};

const particles = Array.from({ length: 28 }, (_, i) => i);

export function LevelPortalTransition({
  open,
  level,
  nextLevel,
}: LevelPortalTransitionProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {/* base dark layer */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.78 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          />

          {/* center expanding world pulse */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "12vmax",
              height: "12vmax",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,150,200,0.85) 16%, rgba(255,60,120,0.65) 30%, rgba(168,85,247,0.42) 52%, rgba(127,29,29,0.18) 72%, rgba(0,0,0,0) 100%)",
              filter: "blur(3px)",
              boxShadow:
                "0 0 40px rgba(255,255,255,0.35), 0 0 120px rgba(255,80,120,0.35), 0 0 220px rgba(168,85,247,0.22)",
            }}
            initial={{ scale: 0.08, opacity: 0 }}
            animate={{
              scale: [0.08, 1, 4, 10, 18],
              opacity: [0, 1, 1, 0.92, 0.85],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 8, ease: "easeInOut" }}
          />

          {/* giant screen-filling red wave */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "20vmax",
              height: "20vmax",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(255,60,120,0.20) 0%, rgba(168,85,247,0.18) 30%, rgba(80,0,20,0.35) 60%, rgba(0,0,0,0) 100%)",
              filter: "blur(18px)",
            }}
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{
              scale: [0.1, 2, 6, 12, 24],
              opacity: [0, 0.95, 0.85, 0.6, 0.35],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 12, ease: "easeOut" }}
          />

          {/* vortex ring 1 */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "26vmax",
              height: "26vmax",
              transform: "translate(-50%, -50%)",
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0), rgba(255,80,120,0.9), rgba(168,85,247,0.9), rgba(255,255,255,0))",
              filter: "blur(6px)",
              boxShadow:
                "0 0 45px rgba(255,80,120,0.28), 0 0 120px rgba(168,85,247,0.20)",
            }}
            initial={{ scale: 0.2, rotate: -35, opacity: 0 }}
            animate={{
              scale: [0.2, 1.4, 4.5, 9, 16],
              rotate: [0, 180, 420, 650, 900],
              opacity: [0, 1, 1, 0.65, 0.22],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 14, ease: "easeInOut" }}
          />

          {/* vortex ring 2 */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full border"
            style={{
              width: "18vmax",
              height: "18vmax",
              transform: "translate(-50%, -50%)",
              borderColor: "rgba(255,220,235,0.24)",
              boxShadow:
                "0 0 40px rgba(255,120,160,0.22), inset 0 0 30px rgba(255,80,120,0.18)",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,80,120,0.10) 35%, rgba(0,0,0,0) 100%)",
            }}
            initial={{ scale: 0.15, rotate: 10, opacity: 0 }}
            animate={{
              scale: [0.15, 1.2, 3.5, 7.5, 13],
              rotate: [0, -120, -260, -420, -620],
              opacity: [0, 0.85, 0.72, 0.45, 0.18],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 16, ease: "easeOut" }}
          />

          {/* bright core pulse */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "8vmax",
              height: "8vmax",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,240,245,0.98) 15%, rgba(255,120,170,0.9) 40%, rgba(168,85,247,0.45) 68%, rgba(0,0,0,0) 100%)",
              filter: "blur(2px)",
              boxShadow:
                "0 0 30px rgba(255,255,255,0.55), 0 0 100px rgba(255,80,120,0.55)",
            }}
            initial={{ scale: 0.08, opacity: 0 }}
            animate={{
              scale: [0.08, 0.9, 1.6, 2.3, 3.2],
              opacity: [0, 1, 1, 0.95, 0.82],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 7.5, ease: "easeOut" }}
          />

          {/* huge white flash */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.38) 0%, rgba(255,220,235,0.20) 18%, rgba(255,120,170,0.10) 34%, rgba(0,0,0,0) 58%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.35, 0.72, 0.2, 0.5, 0.08] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 8 }}
          />

          {/* inward particles */}
          {particles.map((i) => {
            const angle = (i / particles.length) * Math.PI * 2;
            const radius = 240 + (i % 5) * 38;
            const startX = Math.cos(angle) * radius;
            const startY = Math.sin(angle) * radius;

            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: i % 4 === 0 ? 12 : i % 3 === 0 ? 8 : 6,
                  height: i % 4 === 0 ? 12 : i % 3 === 0 ? 8 : 6,
                  background:
                    i % 2 === 0
                      ? "rgba(255,120,170,0.95)"
                      : "rgba(220,180,255,0.95)",
                  boxShadow:
                    i % 2 === 0
                      ? "0 0 18px rgba(255,80,120,0.82)"
                      : "0 0 18px rgba(168,85,247,0.82)",
                }}
                initial={{
                  x: startX,
                  y: startY,
                  scale: 0.4,
                  opacity: 0,
                }}
                animate={{
                  x: [startX, startX * 0.6, startX * 0.2, 0],
                  y: [startY, startY * 0.6, startY * 0.2, 0],
                  scale: [0.3, 1, 1.2, 0.15],
                  opacity: [0, 1, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3.4 + (i % 6) * 0.35,
                  ease: "easeInOut",
                  delay: (i % 7) * 0.12,
                }}
              />
            );
          })}

          {/* screen takeover fog */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, rgba(80,0,20,0) 0%, rgba(80,0,20,0.12) 30%, rgba(40,0,10,0.45) 60%, rgba(0,0,0,0.88) 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0.45, 0.72, 0.88] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 18, ease: "easeInOut" }}
          />

          {/* text */}
          <motion.div
            className="absolute left-1/2 top-[68%] -translate-x-1/2 text-center px-6"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.9, duration: 1.1 }}
          >
            <div
              className="text-white text-3xl sm:text-5xl font-semibold tracking-wide"
              style={{
                textShadow:
                  "0 0 18px rgba(255,255,255,0.35), 0 0 42px rgba(255,80,120,0.35)",
              }}
            >
              Entering next realm...
            </div>

            <div className="mt-3 text-rose-100/90 text-sm sm:text-lg">
              {typeof level === "number" && typeof nextLevel === "number"
                ? `Level ${level} → Level ${nextLevel}`
                : "The portal is opening"}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}