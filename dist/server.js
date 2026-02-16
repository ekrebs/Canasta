import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { handleConnection } from "./src/lib/socket/handleConnection.js";
const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3050", 10);
async function main() {
    const nextModule = await import("next");
    const next = nextModule.default;
    const app = next({ dev, hostname, port });
    await app.prepare();
    const handler = app.getRequestHandler();
    const httpServer = createServer(handler);
    const io = new SocketIOServer(httpServer, {
        path: "/api/socket",
        cors: {
            origin: "*",
        },
    });
    io.on("connection", (socket) => {
        console.log(`New socket connection: ${socket.id}`);
        // Log all received events using onAny middleware
        socket.onAny((event, ...args) => {
            console.log(`[EVENT] ${socket.id} → ${event}`, args.length > 0 ? JSON.stringify(args[0]).slice(0, 100) : '');
        });
        handleConnection(socket, io);
    });
    httpServer.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
}
;
main().catch((err) => {
    console.error('Failed to start server: ', err);
    process.exit(1);
});
