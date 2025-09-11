// 자동 로그아웃 시스템 (개선된 버전)
class AutoLogoutManager {
    constructor() {
        this.timeoutId = null;
        this.warningTimeoutId = null;
        this.LOGOUT_TIME = 30 * 60 * 1000; // 30분 (밀리초)
        this.WARNING_TIME = 5 * 60 * 1000; // 5분 전 경고 (밀리초)
        this.isLoggedIn = false;
        this.countdownInterval = null; // 카운트다운 인터벌 추가
        
        this.init();
    }
    
    init() {
        // 페이지 로드 시 로그인 상태 확인
        this.checkLoginStatus();
        
        // 사용자 활동 감지 이벤트들
        this.setupActivityListeners();
        
        // 페이지 포커스/블러 이벤트
        this.setupVisibilityListeners();
    }
    
    checkLoginStatus() {
        const token = localStorage.getItem('access_token');
        if (token) {
            this.isLoggedIn = true;
            this.startLogoutTimer();
        }
    }
    
    // 사용자 활동 감지 설정
    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (this.isLoggedIn) {
                    this.resetLogoutTimer();
                }
            }, { passive: true });
        });
    }
    
    // 페이지 가시성 변경 감지
    setupVisibilityListeners() {
        document.addEventListener('visibilitychange', () => {
            if (this.isLoggedIn) {
                if (document.hidden) {
                    console.log('페이지가 숨겨졌습니다');
                } else {
                    console.log('페이지가 다시 보입니다');
                    this.resetLogoutTimer();
                }
            }
        });
        
        window.addEventListener('focus', () => {
            if (this.isLoggedIn) {
                this.resetLogoutTimer();
            }
        });
    }
    
    // 로그인 성공 시 호출
    onLoginSuccess() {
        this.isLoggedIn = true;
        this.startLogoutTimer();
        console.log('자동 로그아웃 타이머 시작 (30분)');
    }
    
    // 로그아웃 타이머 시작
    startLogoutTimer() {
        this.clearTimers();
        
        // 25분 후 경고 표시 (30분 - 5분)
        this.warningTimeoutId = setTimeout(() => {
            this.showLogoutWarning();
        }, this.LOGOUT_TIME - this.WARNING_TIME);
        
        // 30분 후 자동 로그아웃
        this.timeoutId = setTimeout(() => {
            this.performAutoLogout();
        }, this.LOGOUT_TIME);
    }
    
    // 타이머 리셋 (사용자 활동 감지 시)
    resetLogoutTimer() {
        if (this.isLoggedIn) {
            this.clearTimers();
            this.startLogoutTimer();
            this.hideLogoutWarning(); // 경고창이 있다면 숨기기
        }
    }
    
    // 기존 타이머들 클리어
    clearTimers() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.warningTimeoutId) {
            clearTimeout(this.warningTimeoutId);
            this.warningTimeoutId = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    
    // 로그아웃 경고 표시
    showLogoutWarning() {
        // 기존 경고창이 있다면 제거
        this.hideLogoutWarning();
        
        const warningModal = document.createElement('div');
        warningModal.id = 'logout-warning-modal';
        warningModal.className = 'logout-warning-overlay';
        
        let remainingTime = 5 * 60; // 5분 (초)
        
        warningModal.innerHTML = `
            <div class="logout-warning-modal">
                <div class="warning-header">
                    <h3>⚠️ 세션 만료 경고</h3>
                </div>
                <div class="warning-content">
                    <p>비활성 상태가 지속되어 <span id="remaining-time">${Math.floor(remainingTime / 60)}:${String(remainingTime % 60).padStart(2, '0')}</span> 후 자동으로 로그아웃됩니다.</p>
                    <p>계속 사용하시려면 "세션 연장" 버튼을 클릭해주세요.</p>
                </div>
                <div class="warning-buttons">
                    <button id="extend-session-btn" class="extend-btn">세션 연장</button>
                    <button id="logout-now-btn" class="logout-btn">지금 로그아웃</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warningModal);
        document.body.style.overflow = 'hidden';
        
        // 카운트다운 업데이트
        this.countdownInterval = setInterval(() => {
            remainingTime--;
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            
            const remainingTimeEl = document.getElementById('remaining-time');
            if (remainingTimeEl) {
                remainingTimeEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
            }
            
            if (remainingTime <= 0) {
                this.performAutoLogout();
            }
        }, 1000);
        
        // 이벤트 리스너
        document.getElementById('extend-session-btn').addEventListener('click', () => {
            this.resetLogoutTimer();
            this.hideLogoutWarning();
        });
        
        document.getElementById('logout-now-btn').addEventListener('click', () => {
            this.performAutoLogout();
        });
        
        // 경고창 스타일 추가
        this.addWarningStyles();
    }
    
    // 경고창 숨기기
    hideLogoutWarning() {
        const warningModal = document.getElementById('logout-warning-modal');
        if (warningModal) {
            warningModal.remove();
            document.body.style.overflow = '';
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    
    // 자동 로그아웃 실행 (개선된 버전)
    performAutoLogout() {
        console.log('자동 로그아웃 실행');
        
        this.clearTimers();
        this.hideLogoutWarning();
        this.isLoggedIn = false;
        
        // 토큰 및 사용자 데이터 삭제
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_email');
        localStorage.removeItem('login_time');
        
        // 전역 currentUser 변수 초기화
        if (typeof currentUser !== 'undefined') {
            currentUser = null;
        }
        
        // UI 업데이트 (기존 함수가 있다면 호출)
        if (typeof updateAuthUI === 'function') {
            updateAuthUI(false);
        }
        
        // 로그아웃 알림 표시
        this.showLogoutMessage();
        
        // 로그아웃 처리 후 페이지 새로고침
        setTimeout(() => {
            this.performLogoutCleanup();
        }, 3000);
    }
    
    // 로그아웃 정리 작업
    performLogoutCleanup() {
        // 현재 페이지가 로그인이 필요한 페이지인지 확인
        const isLoginRequiredPage = this.checkIfLoginRequired();
        
        if (isLoginRequiredPage) {
            // 로그인 페이지로 리다이렉트하거나 현재 페이지 새로고침
            if (typeof redirectToLogin === 'function') {
                redirectToLogin();
            } else {
                location.reload();
            }
        } else {
            // 일반 페이지는 새로고침만
            location.reload();
        }
    }
    
    // 로그인이 필요한 페이지인지 확인
    checkIfLoginRequired() {
        // 로그인이 필요한 요소들이 있는지 확인
        const loginRequiredElements = [
            '.user-profile',
            '.dashboard',
            '.my-page',
            '[data-auth-required]'
        ];
        
        return loginRequiredElements.some(selector => 
            document.querySelector(selector)
        );
    }
    
    // 로그아웃 메시지 표시
    showLogoutMessage() {
        const logoutMessage = document.createElement('div');
        logoutMessage.className = 'logout-message-overlay';
        
        logoutMessage.innerHTML = `
            <div class="logout-message-modal">
                <div class="logout-icon">🔒</div>
                <h3>자동 로그아웃되었습니다</h3>
                <p>보안을 위해 30분 비활성 후 자동으로 로그아웃되었습니다.</p>
                <p>페이지가 곧 새로고침됩니다...</p>
                <div class="logout-spinner"></div>
            </div>
        `;
        
        document.body.appendChild(logoutMessage);
    }
    
    // 수동 로그아웃 시 호출
    onManualLogout() {
        console.log('수동 로그아웃 처리');
        this.clearTimers();
        this.hideLogoutWarning();
        this.isLoggedIn = false;
    }
    
    // 경고창 스타일 추가
    addWarningStyles() {
        if (document.getElementById('logout-warning-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'logout-warning-styles';
        style.textContent = `
            .logout-warning-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            .logout-warning-modal {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                text-align: center;
                animation: scaleIn 0.3s ease;
            }
            
            .warning-header h3 {
                margin: 0 0 20px 0;
                color: #ff9800;
                font-size: 20px;
            }
            
            .warning-content {
                margin-bottom: 25px;
                line-height: 1.6;
                color: #333;
            }
            
            #remaining-time {
                font-weight: bold;
                color: #f44336;
                font-size: 18px;
            }
            
            .warning-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .extend-btn, .logout-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .extend-btn {
                background: #4caf50;
                color: white;
            }
            
            .extend-btn:hover {
                background: #45a049;
                transform: translateY(-1px);
            }
            
            .logout-btn {
                background: #f44336;
                color: white;
            }
            
            .logout-btn:hover {
                background: #d32f2f;
                transform: translateY(-1px);
            }
            
            .logout-message-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            .logout-message-modal {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                text-align: center;
                animation: scaleIn 0.3s ease;
            }
            
            .logout-icon {
                font-size: 48px;
                margin-bottom: 20px;
            }
            
            .logout-message-modal h3 {
                margin: 0 0 20px 0;
                color: #333;
                font-size: 24px;
            }
            
            .logout-message-modal p {
                margin: 10px 0;
                color: #666;
                line-height: 1.6;
            }
            
            .logout-spinner {
                width: 24px;
                height: 24px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 20px auto 0;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes scaleIn {
                from { 
                    opacity: 0;
                    transform: scale(0.9);
                }
                to { 
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // 세션 시간 확인 (디버깅용)
    getSessionInfo() {
        if (!this.isLoggedIn) {
            return { status: 'logged_out' };
        }
        
        const now = Date.now();
        const loginTime = localStorage.getItem('login_time');
        const elapsed = loginTime ? now - parseInt(loginTime) : 0;
        const remaining = this.LOGOUT_TIME - elapsed;
        
        return {
            status: 'logged_in',
            elapsed: Math.floor(elapsed / 1000),
            remaining: Math.floor(remaining / 1000),
            elapsedMinutes: Math.floor(elapsed / 60000),
            remainingMinutes: Math.floor(remaining / 60000)
        };
    }
}

// 전역 인스턴스 생성
const autoLogoutManager = new AutoLogoutManager();

// 기존 로그인 함수와 연동
function enhanceLoginFunction() {
    // 기존 로그인 성공 처리에 추가
    const originalLoginSuccess = window.onLoginSuccess || function() {};
    
    window.onLoginSuccess = function(response) {
        // 로그인 시간 저장
        localStorage.setItem('login_time', Date.now().toString());
        
        // 자동 로그아웃 시작
        autoLogoutManager.onLoginSuccess();
        
        // 기존 로그인 성공 처리 실행
        originalLoginSuccess(response);
    };
    
    // 기존 로그아웃 함수와 연동 (개선된 버전)
    const originalLogout = window.logout || function() {};
    
    window.logout = function() {
        // 자동 로그아웃 정리
        autoLogoutManager.onManualLogout();
        
        // 토큰 및 데이터 삭제
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('login_time');
        
        // 전역 변수 초기화
        if (typeof currentUser !== 'undefined') {
            currentUser = null;
        }
        
        // UI 업데이트
        if (typeof updateAuthUI === 'function') {
            updateAuthUI(false);
        }
        
        // 기존 로그아웃 처리 실행
        originalLogout();
        
        // 페이지 새로고침
        location.reload();
        
        alert('로그아웃되었습니다.');
    };
}

// 페이지 로드 시 로그인 함수 강화
document.addEventListener('DOMContentLoaded', function() {
    enhanceLoginFunction();
});

// 전역 함수로 노출
window.autoLogoutManager = autoLogoutManager;

// 디버깅용 함수 추가
window.checkSessionInfo = function() {
    console.log('현재 세션 정보:', autoLogoutManager.getSessionInfo());
};

// 테스트용 함수 (개발 환경에서만 사용)
window.testAutoLogout = function(seconds = 10) {
    console.log(`${seconds}초 후 자동 로그아웃 테스트`);
    autoLogoutManager.LOGOUT_TIME = seconds * 1000;
    autoLogoutManager.WARNING_TIME = Math.max(5000, (seconds - 5) * 1000);
    autoLogoutManager.resetLogoutTimer();
};