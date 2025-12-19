import type { QuizQuestion } from './quizService';

const BACKEND_API_URL = import.meta.env.VITE_API_URL || '/api/generate-quiz';

export interface QuestionGenerationRequest {
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questionType: 'multiple-choice' | 'multiple-answer' | 'true-false' | 'fill-in-blank';
  numberOfQuestions: number;
}

export const generateQuestions = async (
  request: QuestionGenerationRequest
): Promise<QuizQuestion[]> => {
  try {
    let promptDetails = '';
    let formatExample = '';
    
    if (request.questionType === 'multiple-choice') {
      promptDetails = '4 answer options with one correct answer';
      formatExample = `{
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation text here"
  }`;
    } else if (request.questionType === 'multiple-answer') {
      promptDetails = '4 answer options with multiple correct answers';
      formatExample = `{
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": [0, 2],
    "explanation": "Explanation text here"
  }`;
    } else if (request.questionType === 'true-false') {
      promptDetails = 'a true or false answer';
      formatExample = `{
    "question": "Question text here",
    "correctAnswer": true,
    "explanation": "Explanation text here"
  }`;
    } else {
      promptDetails = 'a fill-in-the-blank answer';
      formatExample = `{
    "question": "Question text with _____ blank",
    "correctAnswer": "answer text",
    "explanation": "Explanation text here"
  }`;
    }

    const prompt = `Generate ${request.numberOfQuestions} ${request.difficulty} level ${request.questionType} quiz questions about "${request.topic}".

For each question, provide:
1. The question text
2. ${promptDetails}
3. The correct answer
4. A brief explanation of why the answer is correct

Format the response as a JSON array with this structure:
[
  ${formatExample}
]

Return ONLY the JSON array, no additional text.`;

    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const text = data.text || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const generatedQuestions = JSON.parse(jsonText);

    // Convert to QuizQuestion format
    const questions: QuizQuestion[] = generatedQuestions.map((q: any, index: number) => {
      const baseQuestion: QuizQuestion = {
        id: `ai-${Date.now()}-${index}`,
        question: q.question,
        type: request.questionType,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        points: 1,
      };

      if (request.questionType === 'multiple-choice' && q.options) {
        baseQuestion.options = q.options;
      }

      return baseQuestion;
    });

    return questions;
  } catch (error) {
    console.error('Error generating questions with Gemini AI:', error);
    throw new Error('Failed to generate questions. Please try again.');
  }
};

export const generateQuestionSuggestions = async (topic: string): Promise<string[]> => {
  try {
    const prompt = `Suggest 5 specific subtopics or question areas for a quiz about "${topic}". 
Return only a JSON array of strings, no additional text.
Example: ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"]`;

    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const text = data.text || '';

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
};
