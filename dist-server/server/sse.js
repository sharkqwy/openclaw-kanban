const clients = new Set();
export function addClient(send) {
    clients.add(send);
    return () => clients.delete(send);
}
export function broadcast(event) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const send of clients) {
        try {
            send(data);
        }
        catch {
            clients.delete(send);
        }
    }
}
export function getClientCount() {
    return clients.size;
}
