process.stdin.resume();
export const registerShutdownHook = (callback: () => Promise<void> | void) => {
	const handleExit = async (signal: string) => {
		console.log(`Received signal: ${signal}`);
		try {
			await callback();
			console.log("Cleanup completed.");
		} catch (err) {
			console.error("Error during cleanup:", err);
		} finally {
			process.exit(0); // Exit gracefully
		}
	};

	process.on("SIGINT", () => handleExit("SIGINT")); // Ctrl+C
	process.on("SIGTERM", () => handleExit("SIGTERM")); // Docker stop
};
