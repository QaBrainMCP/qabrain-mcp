export function enableMcpMode(): void {
    try {
        if ((process.env.MCP_MODE ?? "false").toLowerCase() === "true") {
            // Redirect console output to stderr to avoid contaminating MCP JSON-RPC on stdout
            // Keep behavior minimal: redirect common console methods to console.error
            // and route stdout writes to stderr.
            // eslint-disable-next-line no-console
            console.log = (...args: unknown[]) => {
                // eslint-disable-next-line no-console
                console.error(...args);
            };
            // eslint-disable-next-line no-console
            console.info = (...args: unknown[]) => {
                // eslint-disable-next-line no-console
                console.error(...args);
            };

            // Redirect low-level stdout writes to stderr.
            const stderrWrite = process.stderr.write.bind(process.stderr);
            // replace stdout.write to write to stderr when in MCP mode
            try {
                // @ts-ignore - intentionally override stdout write to route to stderr in MCP mode
                process.stdout.write = (chunk: any, encoding?: any, cb?: any) => {
                    return stderrWrite(chunk, encoding, cb);
                };
            } catch {
                // ignore if cannot override
            }
        }
    } catch {
        // do not throw on mode enabling
    }
}
