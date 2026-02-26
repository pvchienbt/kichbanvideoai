import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Character {
  name: string;
  description: string;
}

export interface Scene {
  sceneNumber: number;
  duration: number;
  action: string;
  dialogue: string;
  prompt: string;
}

export interface ScriptResult {
  hook: string;
  script: string;
  setting: string;
  characters: Character[];
  scenes: Scene[];
}

export async function generateScriptAndPrompts(
  idea: string,
  documents: string,
  fileParts: any[],
  duration: number,
  userSetting: string,
  userCharacters: string,
  videoStyle: string
): Promise<ScriptResult> {
  const promptText = `
Bạn là một chuyên gia viết kịch bản video và kỹ sư prompt AI.
Nhiệm vụ của bạn là:
1. Biến ý tưởng và tài liệu thành kịch bản chi tiết (có hook) với thời lượng khoảng ${duration} giây.
2. Xây dựng bối cảnh, các nhân vật, lời thoại của từng nhân vật phù hợp nhất với ý tưởng.
3. Chia kịch bản thành các phân cảnh (scene) có độ dài tối đa 8 giây mỗi phân cảnh.
4. Viết câu lệnh (prompt) tạo video/ảnh bằng tiếng Anh cho từng phân cảnh.

YÊU CẦU QUAN TRỌNG VỀ PHONG CÁCH, BỐI CẢNH VÀ NHÂN VẬT:
- Phong cách video (Video Style): ${videoStyle}
- Bối cảnh mong muốn từ người dùng: ${userSetting || 'Tự do sáng tạo phù hợp với ý tưởng'}
- Nhân vật mong muốn từ người dùng: ${userCharacters || 'Tự do sáng tạo phù hợp với ý tưởng'}
Nếu người dùng có cung cấp mô tả bối cảnh hoặc nhân vật, BẮT BUỘC phải sử dụng và phát triển dựa trên đó. Nếu không, hãy tự do sáng tạo.

YÊU CẦU QUAN TRỌNG CHO PROMPT (BẮT BUỘC TUÂN THỦ):
- Đưa TẤT CẢ mô tả phong cách (style), bối cảnh (setting), nhân vật (characters), hành động (action), và lời thoại (dialogue) vào CÙNG MỘT prompt tiếng Anh duy nhất cho mỗi phân cảnh.
- Lặp lại NGUYÊN VĂN toàn bộ mô tả phong cách, bối cảnh và mô tả ngoại hình nhân vật (khuôn mặt, kiểu tóc, trang phục) trong MỌI phân cảnh (prompt) để đảm bảo tính đồng bộ tuyệt đối xuyên suốt video.
- Cấu trúc 1 prompt chuẩn nên bao gồm: [Phong cách video: ${videoStyle}] + [Mô tả bối cảnh chi tiết] + [Mô tả nhân vật chi tiết: khuôn mặt, kiểu tóc, trang phục] + [Hành động cụ thể trong phân cảnh] + [Trạng thái/Biểu cảm khi nói lời thoại nếu có].

Ý tưởng:
${idea}

Tài liệu tham khảo:
${documents || 'Không có'}
  `;

  const contents = {
    parts: [
      ...fileParts,
      { text: promptText }
    ]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING, description: "Câu hook mở đầu kịch bản để thu hút người xem (tiếng Việt)." },
          script: { type: Type.STRING, description: "Tóm tắt nội dung kịch bản chi tiết (tiếng Việt)." },
          setting: { type: Type.STRING, description: "Mô tả chi tiết bối cảnh chung (tiếng Việt)." },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Tên nhân vật" },
                description: { type: Type.STRING, description: "Mô tả cực kỳ chi tiết về khuôn mặt, kiểu tóc, trang phục (bằng tiếng Anh để dùng làm prompt)." }
              }
            }
          },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                duration: { type: Type.INTEGER, description: "Thời lượng phân cảnh (tối đa 8 giây)." },
                action: { type: Type.STRING, description: "Hành động trong phân cảnh (tiếng Việt)." },
                dialogue: { type: Type.STRING, description: "Lời thoại trong phân cảnh (tiếng Việt)." },
                prompt: { type: Type.STRING, description: "Prompt tiếng Anh để tạo video. BẮT BUỘC phải gộp toàn bộ mô tả bối cảnh, mô tả nhân vật, hành động và lời thoại vào prompt này. Phải lặp lại bối cảnh và nhân vật trong mọi prompt." }
              }
            }
          }
        },
        required: ["hook", "script", "setting", "characters", "scenes"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Không nhận được phản hồi từ AI.");
  return JSON.parse(text) as ScriptResult;
}
