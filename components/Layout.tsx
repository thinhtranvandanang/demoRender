
import React from 'react';
import { ViewState, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate(ViewState.DASHBOARD)}>
            <div className="bg-white p-1 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">EduAI Studio</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => onNavigate(ViewState.DASHBOARD)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === ViewState.DASHBOARD ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
            >
              Thư viện
            </button>
            <button 
              onClick={() => onNavigate(ViewState.CREATE_EXAM)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === ViewState.CREATE_EXAM ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
            >
              Tạo đề
            </button>
            <button 
              onClick={() => onNavigate(ViewState.GRADING)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === ViewState.GRADING ? 'bg-indigo-700' : 'hover:bg-indigo-500'}`}
            >
              Chấm điểm
            </button>
            
            {user && (
              <div className="flex items-center ml-4 pl-4 border-l border-indigo-400 space-x-3">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-medium opacity-80">Xin chào,</div>
                  <div className="text-sm font-bold truncate max-w-[120px]">{user.name}</div>
                </div>
                <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full border-2 border-white/50" />
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-indigo-700 rounded-full transition-colors"
                  title="Đăng xuất"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t py-6 text-center text-slate-500 text-sm">
        &copy; 2024 EduAI Studio - Hệ thống hỗ trợ giáo dục thông minh bằng AI
      </footer>
    </div>
  );
};

export default Layout;
