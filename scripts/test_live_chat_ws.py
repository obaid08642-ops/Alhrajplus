import asyncio
import sys

import websockets

async def main():
    base = (sys.argv[1] if len(sys.argv) > 1 else 'wss://alhrajplus.onrender.com').rstrip('/')
    uri = base + '/api/ws/chat'
    try:
        async with websockets.connect(uri, open_timeout=20, close_timeout=5) as ws:
            print('UNAUTHENTICATED_SOCKET_OPENED_UNEXPECTEDLY')
            try:
                await asyncio.wait_for(ws.recv(), timeout=3)
            except Exception:
                pass
    except websockets.exceptions.ConnectionClosedError as exc:
        print('UNAUTH_CLOSE_CODE=', exc.code)
    except Exception as exc:
        print('CONNECT_ERROR=', type(exc).__name__, str(exc))

asyncio.run(main())
