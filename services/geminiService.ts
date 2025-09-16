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
    **어린이 동화책을 위한 아트 스타일 가이드:**
    ${artStyle}

    **일관성 있는 캐릭터 참조 시트:**
    ${characterDescriptions || "이 장면에 특정 캐릭터가 정의되지 않았습니다."}

    **삽화로 표현할 장면:**
    이 장면을 바탕으로 어린이 책 페이지를 위한 아름답고 환상적인 삽화를 만들어주세요: "${sceneText}"

    **중요 지침:**
    1. 전체적인 모습, 느낌, 색상 팔레트에 대해 "아트 스타일 가이드"를 엄격히 준수해야 합니다.
    2. 장면에 "캐릭터 참조 시트"의 캐릭터가 언급된 경우, 책 전체의 일관성을 위해 그들의 외모가 설명과 완벽하게 일치하도록 해야 합니다.
    3. 삽화는 생동감 있고 매력적이며 어린 아이들에게 적합해야 합니다.
  `;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
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