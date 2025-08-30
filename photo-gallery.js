// API 기본 URL 설정 (Cloudflare Worker URL로 변경)
const API_BASE_URL = 'https://memorial-api.seliscos.workers.dev';


        // 실제 이미지 데이터를 비동기로// 사진을 화면에 추가하는 함수 (수정된 버전)
function addPhotoToUI(photo) {
    // 실제 사이트 구조에 맞게 수정
    const photoList = document.querySelector('.photo-gallery');
    
    if (!photoList) {
        console.error('사진 갤러리 컨테이너(.photo-gallery)를 찾을 수 없습니다');
        return;
    }
    
    const photoCard = document.createElement('div');
    photoCard.className = 'photo-item';
    photoCard.setAttribute('data-photo-id', photo.id);
    
    const formattedDate = new Date(photo.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    photoCard.innerHTML = `
        <div class="photo-placeholder">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjY2NjIi8+Cjwvc3ZnPgo=" 
                  alt="${photo.caption || '추억 사진'}" 
                  style="opacity: 0.3;"
                  data-photo-id="${photo.id}">
        </div>
        <div class="photo-header">
            <div class="photo-author">${photo.uploader_name || '익명'}</div>
            <div class="photo-date">${formattedDate}</div>
        </div>
        ${photo.caption ? `<div class="photo-content">${photo.caption}</div>` : ''}
    `;
    
    // 사진 목록 맨 위에 추가
    photoList.insertBefore(photoCard, photoList.firstChild);
    
    // 실제 이미지 데이터를 비동기로 로드
    loadImageForPhoto(photo.id);
}

// 특정 사진의 실제 이미지 데이터를 로드하는 함수
async function loadImageForPhoto(photoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/photos/${photoId}`);
        
        if (!response.ok) {
            throw new Error('이미지를 불러올 수 없습니다');
        }
        
        const result = await response.json();
        const imageData = result.photo.image_data;
        
        // 해당 사진 요소 찾기
        const img = document.querySelector(`img[data-photo-id="${photoId}"]`);
        
        if (img && imageData) {
            // 실제 이미지로 교체
            img.src = imageData;
            img.style.opacity = '1';
            img.style.cursor = 'pointer';
            
            // 클릭 이벤트 추가 (확대보기)
            img.onclick = function() {
                openPhotoModal(result.photo, imageData);
            };
            
            // 에러 처리
            img.onerror = function() {
                this.style.display = 'none';
                this.parentElement.innerHTML = '<div class="photo-error">사진을 불러올 수 없습니다</div>';
            };
        }
        
    } catch (error) {
        console.error(`사진 ${photoId} 로딩 오류:`, error);
        
        const img = document.querySelector(`img[data-photo-id="${photoId}"]`);
        if (img) {
            img.style.display = 'none';
            img.parentElement.innerHTML = '<div class="photo-error">사진을 불러올 수 없습니다</div>';
        }
    }
}

// 모든 사진을 불러와서 UI에 추가하는 함수
async function loadAllPhotos() {
    try {
        const response = await fetch(`${API_BASE_URL}/photos`);
        
        if (!response.ok) {
            throw new Error('사진 목록을 가져올 수 없습니다');
        }
        
        const result = await response.json();
        const photos = result.photos;
        
        // 실제 사이트 구조에 맞게 수정
        const photoList = document.querySelector('.photo-gallery');
        
        if (!photoList) {
            console.error('사진 갤러리 컨테이너(.photo-gallery)를 찾을 수 없습니다');
            return;
        }
        
        // Supabase에서 가져온 사진들을 UI에 추가
        photos.forEach(photo => {
            addPhotoToUI(photo);
        });
        
    } catch (error) {
        console.error('사진 목록 로딩 오류:', error);
    }
}

// 사진 업로드 후 새로 추가된 사진을 UI에 즉시 반영
function addNewPhotoToUI(newPhoto) {
    addPhotoToUI(newPhoto);
}


// 페이지 로드 시 모든 사진 불러오기 (안전한 방식)
document.addEventListener('DOMContentLoaded', function() {
    // 페이지가 완전히 로드된 후 약간의 지연을 두고 실행
    setTimeout(() => {
        console.log('사진 로딩 시작...');
        
        // 요소 존재 여부 다시 확인
        const photoGallery = document.querySelector('.photo-gallery');
        console.log('photo-gallery 요소:', photoGallery);
        
        if (photoGallery) {
            loadAllPhotos();
        } else {
            console.error('.photo-gallery 요소를 찾을 수 없습니다. HTML 구조를 확인해주세요.');
            
            // 대안으로 photos ID 컨테이너에 직접 추가
            const photosSection = document.getElementById('photos');
            if (photosSection) {
                console.log('photos 섹션을 찾았습니다. 여기에 추가합니다.');
                loadAllPhotos();
            }
        }
    }, 1000);
});