import { Server as HTTPServer } from "http";
import { Socket as NetSocket } from "net";
import { Server as IOServer } from "socket.io";

export type NextApiResponseServerIO = {
    socket: NetSocket & {
        server: HTTPServer & {
            io: IOServer
        }
    }
}