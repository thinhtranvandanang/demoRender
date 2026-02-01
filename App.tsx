
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { ViewState, Exam, User, GradingResult } from './types';
import { generateExamFromText, gradePaperWithAI } from './services/geminiService';
import { jwtDecode } from 'jwt-decode';

/**
 * Extend the Window interface to include the 'google' property
 * which is provided by the Google Identity Services (GSI) library.
 */
declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_CLIENT_ID = "1041926678224-vsk5gsh7i83m3r97fub26c9f69b18342.apps.googleusercontent.com"; // Placeholder - in production use real ID

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  
  // Auth & Storage logic
  useEffect(() => {
    const savedUser = localStorage.getItem('eduai_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedExams = localStorage.getItem('eduai_exams');
    if (savedExams) setExams(JSON.parse(savedExams));

    // Initialize Google Sign-In
    // Use the global type extension to avoid Property 'google' does not exist error
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      
      if (!savedUser) {
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: 280 }
        );
      }
    }
  }, []);

  const handleGoogleResponse = (response: any) => {
    const decoded: any = jwtDecode(response.credential);
    const newUser: User = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    };
    setUser(newUser);
    localStorage.setItem('eduai_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('eduai_user');
    window.location.reload(); // Reset state
  };

  const saveExams = (newExams: Exam[]) => {
    setExams(newExams);
    localStorage.setItem('eduai_exams', JSON.stringify(newExams));
  };

  const handleCreateExam = async (topic: string, count: number) => {
    setLoading(true);
    try {
      const questions = await generateExamFromText(topic, count);
      const newExam: Exam = {
        id: Date.now().toString(),
        title: `Đề thi: ${topic}`,
        subject: topic,
        questions,
        createdAt: Date.now(),
        authorId: user?.id
      };
      saveExams([newExam, ...exams]);
      setCurrentView(ViewState.DASHBOARD);
    } catch (error) {
      alert("Lỗi khi tạo đề: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="bg-indigo-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">EduAI Studio</h1>
            <p className="text-slate-500">Hệ thống giáo dục thông minh tích hợp AI dành cho giáo viên và học sinh.</p>
          </div>
          <div className="pt-4 flex flex-col items-center space-y-4">
             <div id="googleBtn" className="google-btn-container"></div>
             <p className="text-xs text-slate-400">Đăng nhập để bắt đầu tạo đề và chấm điểm tự động.</p>
          </div>
          <div className="pt-6 grid grid-cols-2 gap-4 text-left text-xs text-indigo-600 font-medium">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
              <span>Tạo đề AI</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
              <span>Chấm điểm OCR</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={currentView} onNavigate={setCurrentView} user={user} onLogout={handleLogout}>
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-700 font-semibold text-lg">AI đang xử lý, vui lòng đợi giây lát...</p>
        </div>
      )}

      {currentView === ViewState.DASHBOARD && (
        <DashboardView 
          exams={exams} 
          onStartExam={(exam) => { setActiveExam(exam); setCurrentView(ViewState.TAKE_EXAM); }}
          onNavigate={setCurrentView}
        />
      )}

      {currentView === ViewState.CREATE_EXAM && (
        <CreateExamView onCreate={handleCreateExam} isLoading={loading} />
      )}

      {currentView === ViewState.TAKE_EXAM && activeExam && (
        <ExamPlayerView exam={activeExam} onFinish={() => setCurrentView(ViewState.DASHBOARD)} />
      )}

      {currentView === ViewState.GRADING && (
        <GradingView exams={exams} />
      )}
    </Layout>
  );
};

// --- View Components ---

const DashboardView: React.FC<{ exams: Exam[], onStartExam: (e: Exam) => void, onNavigate: (v: ViewState) => void }> = ({ exams, onStartExam, onNavigate }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Thư viện đề thi</h1>
          <p className="text-slate-500">Quản lý các bộ đề thi thông minh của bạn.</p>
        </div>
        <button 
          onClick={() => onNavigate(ViewState.CREATE_EXAM)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Tạo đề mới</span>
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
          <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có dữ liệu đề thi</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Hãy sử dụng trí tuệ nhân tạo Gemini để sinh bộ câu hỏi trắc nghiệm tự động chỉ trong vài giây.</p>
          <button 
            onClick={() => onNavigate(ViewState.CREATE_EXAM)}
            className="text-indigo-600 font-bold hover:underline"
          >
            Bắt đầu tạo đề ngay &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">
                  {exam.subject}
                </span>
                <span className="text-slate-400 text-[10px]">{new Date(exam.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors">{exam.title}</h3>
              <p className="text-slate-500 text-sm mb-6 flex items-center">
                <svg className="w-4 h-4 mr-1.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {exam.questions.length} câu hỏi trắc nghiệm
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => onStartExam(exam)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm"
                >
                  Làm bài
                </button>
                <button 
                  onClick={() => onNavigate(ViewState.GRADING)}
                  className="px-3 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-xl border border-slate-100 transition-all"
                  title="Chấm điểm AI"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateExamView: React.FC<{ onCreate: (t: string, c: number) => void, isLoading: boolean }> = ({ onCreate, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900">Tạo đề bằng AI</h2>
        <p className="text-slate-500">Nhập chủ đề để Gemini thiết kế bộ câu hỏi cho bạn.</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Chủ đề bài thi</label>
          <textarea 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border-2 border-slate-100 rounded-2xl p-4 h-32 focus:border-indigo-500 focus:ring-0 outline-none transition-all resize-none text-slate-800"
            placeholder="Ví dụ: Lịch sử Việt Nam thế kỷ 18, Giải phương trình bậc 2, Tiếng Anh lớp 12 Unit 1..."
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng câu hỏi ({count})</label>
          <input 
            type="range"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            min="1" max="15"
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mt-2">
            <span>1 CÂU</span>
            <span>15 CÂU</span>
          </div>
        </div>
        <button 
          onClick={() => onCreate(topic, count)}
          disabled={!topic || isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>SINH ĐỀ THI TỰ ĐỘNG</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ExamPlayerView: React.FC<{ exam: Exam, onFinish: () => void }> = ({ exam, onFinish }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const calculateScore = () => {
    let score = 0;
    exam.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  if (submitted) {
    const score = calculateScore();
    const percent = Math.round((score / exam.questions.length) * 100);
    
    return (
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] text-center shadow-2xl border border-slate-100 animate-fade-in">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ${percent >= 50 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
           <span className="text-3xl font-black">{percent}%</span>
        </div>
        <h2 className="text-4xl font-black mb-2 text-slate-900">Kết quả làm bài</h2>
        <p className="text-slate-500 mb-10">Bạn đã trả lời đúng <span className="font-bold text-slate-900">{score}</span> trên tổng số <span className="font-bold text-slate-900">{exam.questions.length}</span> câu.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-12 max-w-sm mx-auto">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase mb-1">Đúng</div>
            <div className="text-2xl font-black text-green-600">{score}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase mb-1">Sai</div>
            <div className="text-2xl font-black text-red-500">{exam.questions.length - score}</div>
          </div>
        </div>

        <button 
          onClick={onFinish} 
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
        >
          QUAY LẠI THƯ VIỆN
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-slate-100 sticky top-20 z-40">
        <div>
           <h2 className="font-black text-xl text-slate-900 truncate max-w-[200px] md:max-w-md">{exam.title}</h2>
           <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{exam.subject}</p>
        </div>
        <button 
          onClick={() => {
            if(confirm("Bạn có chắc chắn muốn nộp bài?")) setSubmitted(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-green-100 transition-all active:scale-95"
        >
          NỘP BÀI
        </button>
      </div>
      
      {exam.questions.map((q, idx) => (
        <div key={q.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0 mt-1 shadow-md shadow-indigo-100">
              {idx + 1}
            </div>
            <h4 className="font-bold text-xl text-slate-800 leading-tight">{q.question}</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt, oIdx) => (
              <label 
                key={oIdx} 
                className={`flex items-center p-5 rounded-2xl border-2 transition-all cursor-pointer group ${answers[q.id] === oIdx ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-50 hover:border-slate-200 bg-slate-50'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${answers[q.id] === oIdx ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                  {answers[q.id] === oIdx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <input 
                  type="radio" 
                  name={q.id} 
                  className="hidden"
                  checked={answers[q.id] === oIdx}
                  onChange={() => setAnswers({...answers, [q.id]: oIdx})}
                />
                <span className={`font-medium ${answers[q.id] === oIdx ? 'text-indigo-900' : 'text-slate-600'}`}>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const GradingView: React.FC<{ exams: Exam[] }> = ({ exams }) => {
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGrade = async () => {
    if (!selectedExam || !preview) return;
    setLoading(true);
    try {
      const exam = exams.find(e => e.id === selectedExam);
      const base64Data = preview.split(',')[1];
      const result = await gradePaperWithAI(JSON.stringify(exam), base64Data);
      setGradingResult(result);
    } catch (e) {
      alert("Lỗi chấm điểm: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-4xl font-black text-slate-900 mb-2">Chấm điểm AI</h2>
        <p className="text-slate-500">Sử dụng sức mạnh Gemini 3 Pro để nhận diện bài làm viết tay qua hình ảnh.</p>
      </div>
      
      {!gradingResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Bước 1: Chọn đề thi tham chiếu</label>
              <select 
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium"
              >
                <option value="">-- Chọn đề thi có sẵn --</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Bước 2: Tải ảnh bài làm (Chụp hoặc Scan)</label>
              <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-4 min-h-[300px] flex items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors group relative overflow-hidden">
                {preview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img src={preview} alt="Preview" className="max-h-[400px] object-contain rounded-2xl shadow-lg border border-white" />
                    <button 
                      onClick={() => setPreview(null)} 
                      className="mt-4 bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors"
                    >
                      Xóa ảnh và chọn lại
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer w-full h-full flex items-center justify-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-slate-500 font-bold">Nhấp để chọn ảnh bài làm</span>
                      <span className="text-slate-300 text-xs mt-1">Hỗ trợ định dạng JPG, PNG</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            <button 
              onClick={handleGrade}
              disabled={!selectedExam || !preview || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>BẮT ĐẦU CHẤM ĐIỂM BẰNG AI</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl shadow-indigo-100">
               <h3 className="text-xl font-black mb-6 flex items-center">
                 <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 Tại sao chọn AI?
               </h3>
               <ul className="space-y-6">
                 <li className="flex items-start space-x-3">
                   <div className="bg-white/20 p-1.5 rounded-lg mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></div>
                   <p className="text-sm opacity-90"><span className="font-bold">Chính xác:</span> Công nghệ Vision của Gemini nhận diện chữ viết cực tốt.</p>
                 </li>
                 <li className="flex items-start space-x-3">
                   <div className="bg-white/20 p-1.5 rounded-lg mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></div>
                   <p className="text-sm opacity-90"><span className="font-bold">Khách quan:</span> Đánh giá dựa trên đáp án mẫu mà không có sai sót chủ quan.</p>
                 </li>
                 <li className="flex items-start space-x-3">
                   <div className="bg-white/20 p-1.5 rounded-lg mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></div>
                   <p className="text-sm opacity-90"><span className="font-bold">Tiết kiệm:</span> Giảm 90% thời gian chấm bài thủ công cho giáo viên.</p>
                 </li>
               </ul>
            </div>
            
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100">
               <p className="text-xs text-slate-400 leading-relaxed italic">
                 "Lưu ý: Để kết quả chính xác nhất, vui lòng chụp ảnh trực diện, rõ nét các câu trả lời và tránh bị bóng đè hoặc mờ chữ."
               </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 animate-fade-in max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-50 pb-8 gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black text-slate-900">Báo cáo chi tiết</h3>
              <p className="text-slate-500 font-medium">Đối soát kết quả dựa trên đề thi tham chiếu.</p>
            </div>
            <div className="bg-indigo-50 px-8 py-4 rounded-[2rem] flex items-center space-x-4 border border-indigo-100">
               <div className="text-right">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tổng điểm</div>
                  <div className="text-4xl font-black text-indigo-600">{gradingResult.score} / {gradingResult.totalQuestions}</div>
               </div>
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                 {Math.round((gradingResult.score / gradingResult.totalQuestions) * 10)}
               </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
            </div>
            <h4 className="font-bold text-amber-800 mb-2 flex items-center">
              Nhận xét tổng quát:
            </h4>
            <p className="text-amber-900 text-sm leading-relaxed italic">"{gradingResult.feedback}"</p>
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-xl text-slate-800">Phân tích từng câu:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gradingResult.corrections.map((c, i) => (
                <div key={i} className={`p-6 rounded-3xl border-2 transition-all ${c.isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${c.isCorrect ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                      {c.questionIndex + 1}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isCorrect ? 'CHÍNH XÁC' : 'CHƯA ĐÚNG'}
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Học sinh chọn:</span>
                      <span className="font-black text-slate-800">{c.studentAnswer}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Đáp án chuẩn:</span>
                      <span className="font-black text-indigo-600">{c.correctAnswer}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-700">AI giải thích:</span> {c.comment}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button 
              onClick={() => {
                setGradingResult(null);
                setPreview(null);
              }} 
              className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              TIẾP TỤC CHẤM BÀI MỚI
            </button>
            <button 
              onClick={() => window.print()} 
              className="px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
            >
              IN BÁO CÁO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
