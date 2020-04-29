
const EventEmitter = require('events');


class SSE {
    _Stream = new EventEmitter();
    _Url;
    constructor(url) {
        this._Url = url;
    }
    handleRequest(request, response) {
        if ((request.url || request.path) === this._Url) {
            response.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            });

            this._Stream.on('push', function (event, data) {
                response.write(`event: ${String(event)}\ndata: ${JSON.stringify(data)}\n\n`);
            });
        }
    }
    emit(data) {
        this._Stream.emit('push', 'message', data)
    }
}

module.exports = SSE;
