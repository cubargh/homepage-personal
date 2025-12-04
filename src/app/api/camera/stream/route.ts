import { NextRequest } from "next/server";
import { spawn } from "child_process";

/**
 * API endpoint to proxy/transcode RTSP streams
 * Converts RTSP streams to MJPEG using ffmpeg for browser compatibility
 *
 * For HTTP/HTTPS cameras, redirects to the URL directly.
 * For RTSP cameras, transcodes to MJPEG stream using ffmpeg.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Check if it's an RTSP URL
  if (!url.toLowerCase().startsWith("rtsp://")) {
    // For HTTP/HTTPS, redirect to the URL directly
    return Response.redirect(url);
  }

  // Check if ffmpeg is available
  try {
    await new Promise<void>((resolve, reject) => {
      const checkFfmpeg = spawn("ffmpeg", ["-version"]);
      checkFfmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error("ffmpeg not found"));
        }
      });
      checkFfmpeg.on("error", reject);
      // Timeout after 2 seconds
      setTimeout(() => reject(new Error("ffmpeg check timeout")), 2000);
    });
  } catch (error) {
    return Response.json(
      {
        error:
          "RTSP streaming requires ffmpeg to be installed on the server. Please install ffmpeg or use HTTP/HTTPS camera URLs.",
      },
      { status: 503 }
    );
  }

  // Create a ReadableStream for the MJPEG output
  const stream = new ReadableStream({
    start(controller) {
      // Spawn ffmpeg to transcode RTSP to MJPEG
      // -rtsp_transport tcp: Use TCP for RTSP (more reliable)
      // -i: Input URL
      // -f mjpeg: Output format MJPEG
      // -q:v 5: Video quality (2-31, lower is better, 5 is good balance)
      // -r 10: Frame rate (10 fps is reasonable for web streaming)
      // -update 1: Update the output stream immediately
      const ffmpeg = spawn(
        "ffmpeg",
        [
          "-rtsp_transport",
          "tcp",
          "-i",
          url,
          "-f",
          "mjpeg",
          "-q:v",
          "5",
          "-r",
          "10",
          "-update",
          "1",
          "-",
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      // Handle ffmpeg stdout (MJPEG stream)
      // ffmpeg outputs raw JPEG frames, we need to wrap them in multipart format
      let buffer = Buffer.alloc(0);
      const boundary = "ffmpeg";
      let isFirstFrame = true;

      ffmpeg.stdout.on("data", (chunk: Buffer) => {
        try {
          buffer = Buffer.concat([buffer, chunk]);

          // Look for JPEG frame markers (0xFF 0xD8 = JPEG start, 0xFF 0xD9 = JPEG end)
          let startIndex = buffer.indexOf(Buffer.from([0xff, 0xd8]));

          while (startIndex !== -1) {
            // Find the end of the JPEG frame
            const endIndex = buffer.indexOf(
              Buffer.from([0xff, 0xd9]),
              startIndex + 2
            );

            if (endIndex !== -1) {
              // Extract the complete JPEG frame
              const jpegFrame = buffer.subarray(startIndex, endIndex + 2);

              // Send multipart boundary and frame
              if (isFirstFrame) {
                controller.enqueue(
                  Buffer.from(
                    `--${boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: ${jpegFrame.length}\r\n\r\n`
                  )
                );
                isFirstFrame = false;
              } else {
                controller.enqueue(
                  Buffer.from(
                    `\r\n--${boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: ${jpegFrame.length}\r\n\r\n`
                  )
                );
              }
              controller.enqueue(jpegFrame);

              // Remove processed frame from buffer
              buffer = buffer.subarray(endIndex + 2);
              startIndex = buffer.indexOf(Buffer.from([0xff, 0xd8]));
            } else {
              // Incomplete frame, wait for more data
              break;
            }
          }
        } catch (error) {
          // Client may have disconnected
          console.error("Error processing chunk:", error);
        }
      });

      // Handle errors
      ffmpeg.stderr.on("data", (data: Buffer) => {
        // Log ffmpeg errors but don't stop the stream
        // ffmpeg outputs info to stderr even on success
        const message = data.toString();
        // Only log actual errors, not info messages
        if (
          message.includes("error") ||
          message.includes("Error") ||
          message.includes("Connection refused") ||
          message.includes("Connection timed out")
        ) {
          console.error("ffmpeg error:", message);
        }
      });

      ffmpeg.on("error", (error) => {
        console.error("ffmpeg process error:", error);
        try {
          controller.error(error);
        } catch (e) {
          // Controller may already be closed
        }
      });

      ffmpeg.on("close", (code) => {
        if (code !== 0 && code !== null) {
          console.error(`ffmpeg process exited with code ${code}`);
        }
        try {
          controller.close();
        } catch (e) {
          // Controller may already be closed
        }
      });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        try {
          ffmpeg.kill("SIGTERM");
          controller.close();
        } catch (e) {
          // Process may already be terminated
        }
      });
    },
  });

  // Return the MJPEG stream
  // Note: Browsers can display raw MJPEG streams directly
  return new Response(stream, {
    headers: {
      "Content-Type": "multipart/x-mixed-replace; boundary=ffmpeg",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      Connection: "keep-alive",
    },
  });
}
