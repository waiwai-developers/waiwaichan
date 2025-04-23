interface ILogger {
    trace(msg: string): void;
    debug(msg: string): void;
    info(msg: string): void;
    error(msg: string): void;
    fatal(msg: string): void;
}

export class MockLogger implements ILogger {
    trace(msg: string): void {
        console.log(`[TRACE] ${msg}`);
    }

    debug(msg: string): void {
        console.log(`[DEBUG] ${msg}`);
    }

    info(msg: string): void {
        console.log(`[INFO] ${msg}`);
    }

    error(msg: string): void {
        console.error(`[ERROR] ${msg}`);
    }

    fatal(msg: string): void {
        console.error(`[FATAL] ${msg}`);
    }
}
