// Renk geçmişi için context menu işlevselliği
class ColorContextMenu {
    constructor() {
        this.menu = null;
        this.selectedColor = null;
        this.init();
    }

    init() {
        // Context menu elementini oluştur
        this.createMenu();
        
        // Tıklama olayında menüyü gizle
        document.addEventListener('click', () => this.hideMenu());
        
        // Tüm renk kutularına doğrudan event listener ekle
        this.addEventListenersToColorBoxes();
        
        // Debug için konsola yazdır
        console.log('Context menu başlatıldı');
    }
    
    addEventListenersToColorBoxes() {
        // Mevcut renk kutularına event listener ekle
        document.querySelectorAll('.color-box').forEach(box => {
            box.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showMenu(e, box);
            });
        });
        
        // Yeni renk kutuları eklendiğinde event listener'ları ekle
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList && node.classList.contains('color-box')) {
                            node.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                this.showMenu(e, node);
                            });
                        }
                    });
                }
            });
        });
        
        const colorHistory = document.getElementById('colorHistory');
        if (colorHistory) {
            observer.observe(colorHistory, { childList: true, subtree: true });
        }
    }

    createMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        this.menu.innerHTML = `
            <div class="context-menu-item" data-action="copy">
                <i class="fas fa-copy"></i> Renk Değerini Kopyala
            </div>
            <div class="context-menu-item" data-action="rename">
                <i class="fas fa-edit"></i> Renk Adını Değiştir
            </div>
            <div class="context-menu-item" data-action="delete">
                <i class="fas fa-trash"></i> Renk Adını Sil
            </div>
        `;

        // Context menu stillerini ekle
        const style = document.createElement('style');
        style.textContent = `
            .context-menu {
                position: fixed;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                padding: 0.5rem;
                min-width: 200px;
                z-index: 1000;
                display: none;
            }

            .context-menu-item {
                padding: 0.5rem 1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #4a5568;
                transition: all 0.2s ease;
                border-radius: 0.25rem;
            }

            .context-menu-item:hover {
                background: #f7fafc;
                color: #2d3748;
            }

            .context-menu-item i {
                width: 1rem;
                text-align: center;
            }
        `;
        document.head.appendChild(style);

        // Menu item'larına click event listener'ları ekle
        this.menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        document.body.appendChild(this.menu);
    }

    showMenu(e, colorBox) {
        e.preventDefault();
        e.stopPropagation();
        this.selectedColor = colorBox;
        
        // Menu'yü göster
        this.menu.style.display = 'block';
        
        // Menu pozisyonunu ayarla
        const x = e.clientX;
        const y = e.clientY;
        
        // Ekran sınırlarını kontrol et
        const menuRect = this.menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let posX = x;
        let posY = y;
        
        if (x + menuRect.width > windowWidth) {
            posX = windowWidth - menuRect.width;
        }
        
        if (y + menuRect.height > windowHeight) {
            posY = windowHeight - menuRect.height;
        }
        
        this.menu.style.left = posX + 'px';
        this.menu.style.top = posY + 'px';
        
        // Debug için konsola yazdır
        console.log('Context menu gösteriliyor:', { x, y, posX, posY });
    }

    hideMenu() {
        if (this.menu) {
            this.menu.style.display = 'none';
            this.selectedColor = null;
        }
    }

    handleContextMenu(e) {
        // Context menu dışında bir yere tıklandığında menüyü gizle
        if (!this.menu.contains(e.target)) {
            this.hideMenu();
        }
    }

    async handleAction(action) {
        if (!this.selectedColor) return;

        const color = this.selectedColor.style.backgroundColor;
        const colorNames = JSON.parse(localStorage.getItem('colorNames') || '{}');

        switch (action) {
            case 'copy':
                try {
                    await navigator.clipboard.writeText(color);
                    this.showToast('Renk değeri kopyalandı!');
                } catch (err) {
                    console.error('Kopyalama başarısız:', err);
                }
                break;

            case 'rename':
                const currentName = colorNames[color] || '';
                const newName = prompt('Renk için yeni bir isim girin:', currentName);
                
                if (newName !== null) {
                    if (newName.trim() === '') {
                        delete colorNames[color];
                    } else {
                        colorNames[color] = newName.trim();
                    }
                    localStorage.setItem('colorNames', JSON.stringify(colorNames));
                    this.showToast('Renk adı güncellendi!');
                    updateColorHistory(); // Ana script'teki fonksiyonu çağır
                }
                break;

            case 'delete':
                if (confirm('Bu rengi geçmişten silmek istediğinizden emin misiniz?')) {
                    const savedColors = JSON.parse(localStorage.getItem('colorHistory') || '[]');
                    const index = savedColors.indexOf(color);
                    
                    if (index > -1) {
                        savedColors.splice(index, 1);
                        localStorage.setItem('colorHistory', JSON.stringify(savedColors));
                        delete colorNames[color];
                        localStorage.setItem('colorNames', JSON.stringify(colorNames));
                        this.showToast('Renk silindi!');
                        updateColorHistory(); // Ana script'teki fonksiyonu çağır
                    }
                }
                break;
        }

        this.hideMenu();
    }

    showToast(message) {
        // Toast elementi oluştur
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        // Toast stillerini ekle
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                z-index: 1001;
                animation: fadeInOut 2.5s ease-in-out;
            }

            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                15% { opacity: 1; transform: translate(-50%, 0); }
                85% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);
        
        // Toast'u göster ve kaldır
        document.body.appendChild(toast);
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 2500);
    }
}

// Context menu'yü başlat
document.addEventListener('DOMContentLoaded', () => {
    window.colorContextMenu = new ColorContextMenu();
    console.log('Context menu başlatıldı');
});

// Renk geçmişini güncelleme fonksiyonunu güncelle
function updateColorHistory() {
    const colorHistory = document.getElementById('colorHistory');
    if (!colorHistory) return;
    
    colorHistory.innerHTML = '';
    const savedColors = JSON.parse(localStorage.getItem('colorHistory')) || [];
    const colorNames = JSON.parse(localStorage.getItem('colorNames')) || {};
    
    savedColors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box animate-fade-in';
        colorBox.style.backgroundColor = color;
        colorBox.title = color;
        
        // Renk adı varsa ekle
        if (colorNames[color]) {
            colorBox.dataset.name = colorNames[color];
            colorBox.title = `${color} - ${colorNames[color]}`;
        }
        
        colorBox.onclick = () => {
            const colorPicker = document.getElementById('colorPicker');
            colorPicker.value = color;
            updateColor();
        };
        
        // Sağ tıklama olayını ekle
        colorBox.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.colorContextMenu) {
                window.colorContextMenu.showMenu(e, colorBox);
            }
        });
        
        colorHistory.appendChild(colorBox);
    });
} 