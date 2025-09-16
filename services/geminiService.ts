import { GoogleGenAI } from "@google/genai";
import type { Character } from '../types';

// The API key must be set in the environment variables as API_KEY
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY 환경 변수가 설정되지 않았습니다. Gemini API 호출이 실패할 수 있습니다.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const analyzeImageStyle = async (base64Image: string, mimeType: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: "이 이미지의 **아트 스타일**을 분석해주세요. **이미지에 그려진 대상(예: 사람, 동물, 사물, 배경)은 반드시 무시하고**, 오직 그림의 **스타일 자체**에만 집중해주세요. 다음과 같은 예술적 특징을 설명해주세요: 사용된 색상 팔레트(예: 파스텔톤, 선명한 원색), 선의 종류(예: 부드러운 윤곽선, 굵고 뚜렷한 선), 텍스처(예: 수채화 느낌, 유화 질감, 디지털 느낌), 전체적인 분위기(예: 꿈꾸는 듯한, 아늑한, 활기찬). 이 설명은 동일한 스타일로 다른 그림을 생성하기 위한 가이드로 사용될 것입니다. **내용이 아닌 스타일에 대한 설명만 포함해주세요.**",
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error (Style Analysis):", error);
    throw new Error("이미지 스타일 분석에 실패했습니다. 콘솔에서 자세한 내용을 확인해주세요.");
  }
};


export const generateIllustration = async (
  artStyle: string,
  characters: Character[],
  sceneText: string
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  const characterDescriptions = characters
    .map(c => `- **${c.name}**: ${c.description}`)
    .join('\n');

  const fullPrompt = `
  **절대 규칙: 당신은 어린이 동화책 일러스트레이터입니다.**

  **1. 아트 스타일 가이드 (가장 중요):**
  아래 스타일 설명을 *반드시*, *엄격하게* 따라야 합니다. 이것은 이 책의 모든 삽화를 위한 절대적인 규칙입니다. 다른 스타일과 절대 섞지 마세요.
  ---
  ${artStyle}
  ---

  **2. 일관성 있는 캐릭터 참조 시트:**
  ${characterDescriptions || "이 장면에 특정 캐릭터가 정의되지 않았습니다."}

  **3. 삽화로 표현할 장면:**
  "${sceneText}"

  **최종 지시사항:**
  - **1번 아트 스타일 가이드**를 100% 준수하여 **3번 장면**을 삽화로 만드세요.
  - 장면에 캐릭터가 언급되면 **2번 캐릭터 참조 시트**의 설명을 완벽하게 일치시키세요.
  - 삽화는 어린 아이들에게 적합해야 하며, 텍스트, 글자, 워터마크를 절대 포함하지 마세요.
`;

  try {
    const response = await ai.models.generateImages({
      model: 'gemini-2.5-flash',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    } else {
      throw new Error('이미지 생성에 실패했습니다. API가 이미지를 반환하지 않았습니다.');
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("삽화 생성에 실패했습니다. 콘솔에서 자세한 내용을 확인해주세요.");
  }
};