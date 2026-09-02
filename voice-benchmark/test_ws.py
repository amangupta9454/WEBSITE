import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('ws://localhost:8000/ws') as websocket:
            print("Connected successfully!")
            await websocket.send('{"type": "stop"}')
    except Exception as e:
        print(f"Failed to connect: {e}")

asyncio.run(test())
