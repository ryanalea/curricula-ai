import asyncio
from typing import Dict, List


class ProgressPublisher:
    """Publish-subscribe manager for Server-Sent Events (SSE) progress streaming."""

    def __init__(self):
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def subscribe(self, session_id: str) -> asyncio.Queue:
        if session_id not in self._subscribers:
            self._subscribers[session_id] = []
        q = asyncio.Queue()
        self._subscribers[session_id].append(q)
        return q

    def unsubscribe(self, session_id: str, q: asyncio.Queue):
        if session_id in self._subscribers and q in self._subscribers[session_id]:
            self._subscribers[session_id].remove(q)
            if not self._subscribers[session_id]:
                del self._subscribers[session_id]

    async def publish(self, session_id: str, data: dict):
        if session_id in self._subscribers:
            for q in list(self._subscribers[session_id]):
                await q.put(data)


progress_publisher = ProgressPublisher()
