/**
 * DisasterGuard Alert Broadcast Service (socket.io mini service)
 *
 * Real-time fan-out of alerts to connected dashboards/maps.
 * The Next.js API pushes events here via POST /broadcast; browsers
 * connect through the Caddy gateway: io('/?XTransformPort=3003', { path: '/' })
 */
import { Server } from "socket.io";
import { createServer } from "http";

const PORT = Number(process.env.PORT || 3003);

const httpServer = createServer((req, res) => {
  // simple internal broadcast endpoint (server-to-server only)
  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { event, data } = JSON.parse(body || "{}");
        io.emit(event || "alert", data);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, clients: io.engine.clientsCount }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, clients: io.engine.clientsCount }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("[alert-service] client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("[alert-service] client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[alert-service] listening on :${PORT}`);
});
