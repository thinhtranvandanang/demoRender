
import { GoogleGenAI, Type } from "@google/genai";
import { Question, GradingResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExamFromText = async (topic: string, count: number = 5): Promise<Question[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Hãy tạo một bộ đề thi trắc nghiệm về chủ đề: ${topic}. Số lượng câu hỏi: ${count}. Ngôn ngữ: Tiếng Việt.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["id", "question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const gradePaperWithAI = async (examData: string, studentImageBase64: string): Promise<GradingResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview", // Use Pro for complex visual OCR + grading
    contents: {
      parts: [
        { text: `Đây là đề thi mẫu: ${examData}. Hãy phân tích hình ảnh bài làm của học sinh, nhận diện các câu trả lời và chấm điểm dựa trên đề thi mẫu này.` },
        { inlineData: { mimeType: "image/jpeg", data: studentImageBase64 } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          totalQuestions: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          corrections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionIndex: { type: Type.INTEGER },
                studentAnswer: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                comment: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
};
