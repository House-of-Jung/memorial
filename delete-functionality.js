
// 삭제 기능 관리 클래스
class DeleteManager {
    constructor(apiBaseUrl) {
        this.API_BASE_URL = apiBaseUrl;
        this.init();
    }
    
    init() {
        this.addDeleteStyles();
        this.setupDeleteEventListeners();
    }
    
    // 사용자가 로그인했는지 확인
    isLoggedIn() {
        return !!localStorage.getItem('access_token');
    }
    
    // 현재 로그인한 사용자 정보 가져오기

// 수정된 getCurrentUserEmail 메서드
getCurrentUserEmail() {
    // HTML과 일치하도록 수정
    return localStorage.getItem('user_email');
}



    // 추억 항목에 삭제 버튼 추가
    addDeleteButtonToMemory(memoryElement, memoryData) {
        if (!this.isLoggedIn()) return;
        
        const currentUserEmail = this.getCurrentUserEmail();
        const memoryUserEmail = memoryData.email || memoryData.user_email;
        
        // 본인이 작성한 글만 삭제 버튼 표시
        if (currentUserEmail && memoryUserEmail && currentUserEmail === memoryUserEmail) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn memory-delete-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = '삭제';
            deleteBtn.setAttribute('data-memory-id', memoryData.id);
            deleteBtn.setAttribute('data-type', 'memory');
            
            // 메모리 요소의 상단 우측에 추가
            memoryElement.style.position = 'relative';
            memoryElement.appendChild(deleteBtn);
        }
    }
    
// 수정된 addDeleteButtonToPhoto 메서드
addDeleteButtonToPhoto(photoElement, photoData) {
    if (!this.isLoggedIn()) return;
    
    const currentUserEmail = this.getCurrentUserEmail();
    // 사진의 경우 uploader_email이나 email 필드를 사용해야 함
    const photoUserEmail = photoData.email || photoData.uploader_email;
    
    // 본인이 업로드한 사진만 삭제 버튼 표시
    if (currentUserEmail && photoUserEmail && currentUserEmail === photoUserEmail) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn photo-delete-btn';
        deleteBtn.innerHTML = '🗑️XXXXX';
        deleteBtn.title = '삭제';
        deleteBtn.setAttribute('data-photo-id', photoData.id);
        deleteBtn.setAttribute('data-type', 'photo');
        
        // 사진 요소의 상단 우측에 추가
        photoElement.style.position = 'relative';
        photoElement.appendChild(deleteBtn);
    }
}    
    // 삭제 이벤트 리스너 설정
    setupDeleteEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const type = e.target.getAttribute('data-type');
                const id = e.target.getAttribute(`data-${type}-id`);
                
                if (type === 'memory') {
                    this.showDeleteConfirmation('추억', () => this.deleteMemory(id));
                } else if (type === 'photo') {
                    this.showDeleteConfirmation('사진', () => this.deletePhoto(id));
                }
            }
        });
    }
    
    // 삭제 확인 모달 표시
    showDeleteConfirmation(itemType, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'delete-confirmation-overlay';
        modal.innerHTML = `
            <div class="delete-confirmation-modal">
                <div class="delete-icon">⚠️</div>
                <h3>삭제 확인</h3>
                <p>이 ${itemType}을(를) 정말 삭제하시겠습니까?</p>
                <p class="delete-warning">삭제된 ${itemType}은 복구할 수 없습니다.</p>
                <div class="delete-buttons">
                    <button class="cancel-btn">취소</button>
                    <button class="confirm-delete-btn">삭제</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // 이벤트 리스너
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.hideDeleteConfirmation();
        });
        
        modal.querySelector('.confirm-delete-btn').addEventListener('click', () => {
            this.hideDeleteConfirmation();
            onConfirm();
        });
        
        // 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideDeleteConfirmation();
            }
        });
    }
    
    // 삭제 확인 모달 숨기기
    hideDeleteConfirmation() {
        const modal = document.querySelector('.delete-confirmation-overlay');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }
    
    // 추억 삭제
    async deleteMemory(memoryId) {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            this.showErrorMessage('로그인이 필요합니다');
            return;
        }
        
        try {
            this.showLoadingMessage('추억 삭제 중...');
            
            const response = await fetch(`${this.API_BASE_URL}/memories/${memoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            this.hideLoadingMessage();
            
            if (response.ok) {
                this.showSuccessMessage('추억이 삭제되었습니다');
                this.removeMemoryFromUI(memoryId);
            } else {
                this.showErrorMessage(result.error || '삭제 실패');
            }
            
        } catch (error) {
            this.hideLoadingMessage();
            console.error('추억 삭제 오류:', error);
            this.showErrorMessage('삭제 중 오류가 발생했습니다');
        }
    }
    
    // 사진 삭제
    async deletePhoto(photoId) {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            this.showErrorMessage('로그인이 필요합니다');
            return;
        }
        
        try {
            this.showLoadingMessage('사진 삭제 중...');
            
            const response = await fetch(`${this.API_BASE_URL}/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            this.hideLoadingMessage();
            
            if (response.ok) {
                this.showSuccessMessage('사진이 삭제되었습니다');
                this.removePhotoFromUI(photoId);
            } else {
                this.showErrorMessage(result.error || '삭제 실패');
            }
            
        } catch (error) {
            this.hideLoadingMessage();
            console.error('사진 삭제 오류:', error);
            this.showErrorMessage('삭제 중 오류가 발생했습니다');
        }
    }
    
    // UI에서 추억 제거
    removeMemoryFromUI(memoryId) {
        const memoryElement = document.querySelector(`[data-memory-id="${memoryId}"]`)?.closest('.memory-item, .photo-item');
        if (memoryElement) {
            memoryElement.style.opacity = '0';
            memoryElement.style.transform = 'scale(0.9)';
            setTimeout(() => {
                memoryElement.remove();
            }, 300);
        }
    }
    
    // UI에서 사진 제거
    removePhotoFromUI(photoId) {
        const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`)?.closest('.photo-item');
        if (photoElement) {
            photoElement.style.opacity = '0';
            photoElement.style.transform = 'scale(0.9)';
            setTimeout(() => {
                photoElement.remove();
            }, 300);
        }
    }
    
    // 로딩 메시지 표시
    showLoadingMessage(message) {
        const loading = document.createElement('div');
        loading.id = 'delete-loading';
        loading.className = 'delete-loading-overlay';
        loading.innerHTML = `
            <div class="delete-loading-modal">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(loading);
    }
    
    // 로딩 메시지 숨기기
    hideLoadingMessage() {
        const loading = document.getElementById('delete-loading');
        if (loading) {
            loading.remove();
        }
    }
    
    // 성공 메시지 표시
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }
    
    // 에러 메시지 표시
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }
    
    // 토스트 메시지 표시
    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 애니메이션
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // 삭제 기능 관련 스타일 추가
    addDeleteStyles() {
        if (document.getElementById('delete-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'delete-styles';
        style.textContent = `
            .delete-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(244, 67, 54, 0.9);
                color: white;
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10;
                opacity: 0;
                transform: scale(0.8);
            }
            
            .photo-item:hover .delete-btn,
            .memory-item:hover .delete-btn {
                opacity: 1;
                transform: scale(1);
            }
            
            .delete-btn:hover {
                background: rgba(244, 67, 54, 1);
                transform: scale(1.1);
                box-shadow: 0 2px 8px rgba(244, 67, 54, 0.4);
            }
            
            .delete-confirmation-overlay {
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
            
            .delete-confirmation-modal {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                text-align: center;
                animation: scaleIn 0.3s ease;
            }
            
            .delete-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .delete-confirmation-modal h3 {
                margin: 0 0 15px 0;
                color: #f44336;
                font-size: 24px;
            }
            
            .delete-confirmation-modal p {
                margin: 10px 0;
                color: #333;
                line-height: 1.6;
            }
            
            .delete-warning {
                color: #ff9800;
                font-weight: bold;
                font-size: 14px;
            }
            
            .delete-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 25px;
            }
            
            .cancel-btn, .confirm-delete-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .cancel-btn {
                background: #9e9e9e;
                color: white;
            }
            
            .cancel-btn:hover {
                background: #757575;
                transform: translateY(-1px);
            }
            
            .confirm-delete-btn {
                background: #f44336;
                color: white;
            }
            
            .confirm-delete-btn:hover {
                background: #d32f2f;
                transform: translateY(-1px);
            }
            
            .delete-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .delete-loading-modal {
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #f44336;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 10002;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }
            
            .toast-show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .toast-success {
                background: #4caf50;
            }
            
            .toast-error {
                background: #f44336;
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
            
            /* 모바일 반응형 */
            @media (max-width: 768px) {
                .delete-confirmation-modal {
                    margin: 20px;
                    padding: 20px;
                }
                
                .delete-buttons {
                    flex-direction: column;
                }
                
                .toast {
                    right: 10px;
                    left: 10px;
                    text-align: center;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}


// 전역으로 노출

window.DeleteManager = DeleteManager;