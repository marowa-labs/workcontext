import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import axios from "axios";

export interface ScriptLine {
  speaker: string;
  text: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private client: ElevenLabsClient | null = null;

  // High quality voices
  private voiceA: string = "21m00Tcm4TlvDq8ikWAM"; // Rachel (Female)
  private voiceB: string = "TxGEqnHWrfWFTfGW9XjX"; // Josh (Male) or similar
  private modelId: string = "eleven_monolingual_v1";

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || "";
    if (this.apiKey) {
      this.client = new ElevenLabsClient({ apiKey: this.apiKey });
    }
  }

  /**
   * Generates a full podcast audio by stitching voice clips.
   * Returns a single MP3 Buffer.
   */
  async generatePodcastAudio(script: ScriptLine[]): Promise<Buffer | null> {
    if (!this.apiKey) {
      console.warn("ElevenLabs API Key missing. Skipping generation.");
      return null;
    }

    try {
      console.log(`Generating podcast for ${script.length} lines...`);
      const audioBuffers: Buffer[] = [];

      // Generate audio for each line sequentially to respect rate limits and order
      // (Parallel could be faster but risky on tier limits)
      for (const line of script) {
        const voiceId = line.speaker?.includes("Host B")
          ? this.voiceB
          : this.voiceA;

        // Using raw axios for buffer control or SDK stream
        // The SDK returns a stream usually. Let's use axios for simplicity in buffer handling
        // OR use the SDK "generate" and convert to buffer.

        const response = await axios.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            text: line.text,
            model_id: this.modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          },
          {
            headers: {
              "xi-api-key": this.apiKey,
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
          },
        );

        audioBuffers.push(Buffer.from(response.data));

        // Small pause between lines?
        // We could append a small silence buffer here if needed.
      }

      // Concatenate all buffers
      return Buffer.concat(audioBuffers);
    } catch (error) {
      console.error("ElevenLabs Generation Failed:", error);
      // If payment required or quota exceeded, fall back
      return null;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
