import { NextResponse } from 'next/server';
import { runResearch } from '@/lib/research';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const name = body?.candidateName;
  if (typeof name !== 'string' || !/^[\p{L} .’\u0027-]{2,100}$/u.test(name.trim()))
    return NextResponse.json({ error: 'Enter a politician’s name (2–100 characters).' }, { status: 400 });
  const errorMessage = (e: unknown) => e instanceof Error && /Please enter|Another search|Sources are temporarily/.test(e.message)
    ? e.message : 'Research could not be completed or saved. Please try again later.';
  if (!body.stream) {
    try { return NextResponse.json({ success: true, data: await runResearch(name.trim(), () => {}) }); }
    catch (e) { return NextResponse.json({ success: false, error: errorMessage(e) }, { status: 503 }); }
  }
  let disconnected = false;
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => { if (!disconnected) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)); };
      const heartbeat = setInterval(() => send({ type: 'heartbeat' }), 10000);
      runResearch(name.trim(), message => send({ type: 'status', message }))
        .then(data => send({ type: 'complete', data }))
        .catch(e => send({ type: 'error', message: errorMessage(e) }))
        .finally(() => { clearInterval(heartbeat); if (!disconnected) controller.close(); });
    },
    cancel() { disconnected = true; }
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' } });
}
