import { handleConnection } from "@/lib/socket/handleConnection";
import { NextApiResponseServerIO } from "@/types/next";
import { NextApiRequest } from "next";
import { Server as IOServer } from "socket.io";

export const config = {
    api: {
        bodyParser: false
    }
}


export default function handler(req:NextApiRequest, res:NextApiResponseServerIO) {
    if ( ! res.socket.server.io ) {
        const io = new IOServer(res.socket.server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: { origin: '*' }
        });

        res.socket.server.io = io;

        io.on('connection', ( socket ) => {
            handleConnection(socket, io);
        })
    }

    return;
}