const PYTHON_SERVER_URL = process.env.AI_SERVER_URL || "http://127.0.0.1:5000";

export interface ClassificationResult {
  success: boolean;
  classification?: {
    wasteType: string;
    confidence: number;
    detectedObjects: Array<{
      class: string;
      waste_type: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
    recyclable: boolean;
    points: number;
    objectCount: number;
  };
  error?: string;
}

export async function classifyImage(imageBase64: string): Promise<ClassificationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${PYTHON_SERVER_URL}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `AI server returned status ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "AI server request timed out. Is the Python server running?",
      };
    }

    return {
      success: false,
      error: `Cannot reach AI server at ${PYTHON_SERVER_URL}. Start it with: cd RECO_APP && python api_server.py`,
    };
  }
}
