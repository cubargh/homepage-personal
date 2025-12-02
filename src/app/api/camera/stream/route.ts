import { NextResponse } from "next/server";

/**
 * API endpoint to proxy/transcode RTSP streams
 * For now, this is a placeholder. RTSP streams require server-side transcoding
 * (e.g., using ffmpeg) to convert to a web-compatible format like HLS or WebRTC.
 * 
 * For HTTP/HTTPS cameras, the widget uses the URL directly.
 * For RTSP cameras, you would need to:
 * 1. Install ffmpeg on the server
 * 2. Use a library like node-rtsp-stream or fluent-ffmpeg
 * 3. Convert RTSP to HLS or WebRTC
 * 4. Return the stream URL
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Check if it's an RTSP URL
  if (!url.toLowerCase().startsWith("rtsp://")) {
    // For HTTP/HTTPS, redirect to the URL directly
    return NextResponse.redirect(url);
  }

  // RTSP transcoding would go here
  // For now, return an error indicating RTSP support needs to be implemented
  return NextResponse.json(
    {
      error:
        "RTSP streaming requires server-side transcoding. Please use HTTP/HTTPS camera URLs for now, or implement RTSP transcoding using ffmpeg.",
    },
    { status: 501 }
  );
}

