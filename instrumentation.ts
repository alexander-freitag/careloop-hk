// Next.js instrumentation — runs once on server startup. Starts the in-process
// daily check-in scheduler (only in the Node.js runtime, not edge).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
