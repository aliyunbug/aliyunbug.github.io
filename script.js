// ==================== BUG博物馆管理系统 ====================
class MuseumManager {
    constructor() {
        this.specimens = [];
        this.filteredSpecimens = [];
        this.init();
    }

    init() {
        this.loadCollection();
        this.bindEvents();
        this.renderSpecimens();
        this.updateStats();
        this.updateCatalogCounts();
    }

    // ==================== 数据管理 ====================
    loadCollection() {
        const stored = localStorage.getItem('bug_museum_collection');
        if (stored) {
            try {
                this.specimens = JSON.parse(stored);
                this.filteredSpecimens = [...this.specimens];
            } catch (e) {
                console.error('加载收藏失败:', e);
                this.specimens = [];
                this.filteredSpecimens = [];
            }
        }
    }

    saveCollection() {
        try {
            localStorage.setItem('bug_museum_collection', JSON.stringify(this.specimens));
        } catch (e) {
            console.error('保存收藏失败:', e);
            this.showNotification('保存失败，可能是存储空间不足', 'error');
        }
    }

    // ==================== 事件绑定 ====================
    bindEvents() {
        // 导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('href');
                this.scrollToSection(target);
                
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // 标本管理
        document.getElementById('addSpecimenBtn').addEventListener('click', () => this.openSpecimenModal());
        document.getElementById('specimenForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSpecimen();
        });

        // 筛选器
        document.getElementById('toggleFilter').addEventListener('click', () => this.toggleFilter());
        document.getElementById('filterCategory').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterRarity').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());

        // 收藏管理
        document.getElementById('exportCollection').addEventListener('click', () => this.exportCollection());
        document.getElementById('importCollection').addEventListener('click', () => this.importCollection());
        document.getElementById('clearCollection').addEventListener('click', () => this.clearCollection());

        // 目录卡片点击
        document.querySelectorAll('.catalog-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                document.getElementById('filterCategory').value = category;
                this.applyFilters();
                this.scrollToSection('#exhibition');
            });
        });
    }

    // ==================== 模态框控制 ====================
    openSpecimenModal() {
        document.getElementById('specimenModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeSpecimenModal() {
        document.getElementById('specimenModal').classList.remove('show');
        document.getElementById('specimenForm').reset();
        document.body.style.overflow = '';
    }

    // ==================== 标本管理 ====================
    addSpecimen() {
        const specimen = {
            id: Date.now().toString(),
            category: document.getElementById('category').value,
            rarity: document.getElementById('rarity').value,
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            solution: document.getElementById('solution').value,
            tags: document.getElementById('tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag),
            collectedAt: new Date().toISOString()
        };

        this.specimens.unshift(specimen);
        this.saveCollection();
        this.applyFilters();
        this.updateStats();
        this.updateCatalogCounts();
        this.closeSpecimenModal();
        
        this.showNotification('🎉 新标本已收藏！', 'success');
        
        setTimeout(() => {
            this.scrollToSection('#exhibition');
        }, 300);
    }

    deleteSpecimen(id) {
        if (confirm('确定要从收藏中移除这个标本吗？')) {
            this.specimens = this.specimens.filter(s => s.id !== id);
            this.saveCollection();
            this.applyFilters();
            this.updateStats();
            this.updateCatalogCounts();
            this.showNotification('标本已移除', 'info');
        }
    }

    // ==================== 筛选功能 ====================
    toggleFilter() {
        const content = document.getElementById('filterContent');
        const icon = document.getElementById('filterToggleIcon');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.textContent = '▼';
        } else {
            content.classList.add('collapsed');
            icon.textContent = '▶';
        }
    }

    applyFilters() {
        const categoryFilter = document.getElementById('filterCategory').value;
        const rarityFilter = document.getElementById('filterRarity').value;
        const searchText = document.getElementById('searchInput').value.toLowerCase();

        this.filteredSpecimens = this.specimens.filter(specimen => {
            const matchCategory = !categoryFilter || specimen.category === categoryFilter;
            const matchRarity = !rarityFilter || specimen.rarity === rarityFilter;
            const matchSearch = !searchText || 
                specimen.name.toLowerCase().includes(searchText) ||
                specimen.description.toLowerCase().includes(searchText) ||
                specimen.tags.some(tag => tag.toLowerCase().includes(searchText));

            return matchCategory && matchRarity && matchSearch;
        });

        this.renderSpecimens();
    }

    resetFilters() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterRarity').value = '';
        document.getElementById('searchInput').value = '';
        this.applyFilters();
    }

    // ==================== 渲染 ====================
    renderSpecimens() {
        const grid = document.getElementById('specimenGrid');
        const emptyGallery = document.getElementById('emptyGallery');

        if (this.filteredSpecimens.length === 0) {
            grid.innerHTML = '';
            emptyGallery.classList.add('show');
            
            if (this.specimens.length > 0) {
                emptyGallery.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <h3>未找到匹配的标本</h3>
                    <p>请调整筛选条件</p>
                `;
            } else {
                emptyGallery.innerHTML = `
                    <div class="empty-icon">🦋</div>
                    <h3>展厅空空如也</h3>
                    <p>还没有收藏任何BUG标本</p>
                    <p>点击上方"添加新标本"按钮开始您的收藏之旅</p>
                `;
            }
            return;
        }

        emptyGallery.classList.remove('show');
        grid.innerHTML = this.filteredSpecimens.map(s => this.createSpecimenCard(s)).join('');

        // 绑定删除按钮
        grid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteSpecimen(id);
            });
        });
    }

    createSpecimenCard(specimen) {
        const rarityLabels = {
            critical: '传说级',
            high: '史诗级',
            medium: '稀有级',
            low: '普通级'
        };

        const rarityIcons = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };

        const categoryIcons = {
            // 计算服务
            ECS: '🖥️',
            ACK: '🐳',
            ACR: '📦',
            FC: '⚡',
            // 存储服务
            OSS: '💾',
            NAS: '📁',
            // 数据库
            RDS: '🗄️',
            Redis: '🔴',
            MongoDB: '🍃',
            // 网络服务
            SLB: '⚖️',
            CDN: '🌐',
            VPC: '🔗',
            // 中间件
            MSE: '🔧',
            MQ: '📨',
            EDAS: '🏢',
            // 安全与管理
            RAM: '🔐',
            WAF: '🛡️',
            // 其他
            Console: '🎛️',
            API: '⚙️',
            Other: '📦'
        };

        const date = new Date(specimen.collectedAt);
        const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

        return `
            <div class="specimen-card rarity-${specimen.rarity}">
                <div class="specimen-header">
                    <div class="specimen-icon">${categoryIcons[specimen.category] || '🐛'}</div>
                    <span class="rarity-badge rarity-${specimen.rarity}">
                        ${rarityIcons[specimen.rarity]} ${rarityLabels[specimen.rarity]}
                    </span>
                </div>
                
                <h3 class="specimen-name">${this.escapeHtml(specimen.name)}</h3>
                <span class="specimen-category">📂 ${this.escapeHtml(specimen.category)}</span>
                
                <p class="specimen-description">${this.escapeHtml(specimen.description)}</p>
                
                ${specimen.solution ? `
                    <div class="specimen-solution">
                        <strong>💡 研究笔记</strong>
                        ${this.escapeHtml(specimen.solution)}
                    </div>
                ` : ''}
                
                ${specimen.tags.length > 0 ? `
                    <div class="specimen-tags">
                        ${specimen.tags.map(tag => `<span class="tag">#${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="specimen-footer">
                    <span class="specimen-date">📅 收藏于 ${formattedDate}</span>
                    <button class="btn-delete" data-id="${specimen.id}">移除</button>
                </div>
            </div>
        `;
    }

    // ==================== 统计更新 ====================
    updateStats() {
        const stats = {
            total: this.specimens.length,
            rare: this.specimens.filter(s => s.rarity === 'critical').length,
            solved: this.specimens.filter(s => s.solution).length
        };

        document.getElementById('totalSpecimens').textContent = stats.total;
        document.getElementById('rareSpecimens').textContent = stats.rare;
        document.getElementById('solvedSpecimens').textContent = stats.solved;
    }

    updateCatalogCounts() {
        const categories = [
            'ECS', 'ACK', 'ACR', 'FC',           // 计算服务
            'OSS', 'NAS',                         // 存储服务
            'RDS', 'Redis', 'MongoDB',            // 数据库
            'SLB', 'CDN', 'VPC',                  // 网络服务
            'MSE', 'MQ', 'EDAS',                  // 中间件
            'RAM', 'WAF'                          // 安全与管理
        ];
        
        categories.forEach(category => {
            const count = this.specimens.filter(s => s.category === category).length;
            const element = document.querySelector(`.catalog-card[data-category="${category}"] .catalog-count`);
            if (element) {
                element.textContent = `${count} 个标本`;
            }
        });
    }

    // ==================== 收藏管理 ====================
    exportCollection() {
        if (this.specimens.length === 0) {
            this.showNotification('收藏馆中还没有标本', 'info');
            return;
        }

        const dataStr = JSON.stringify(this.specimens, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bug-museum-collection-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('📦 收藏已导出', 'success');
    }

    importCollection() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedSpecimens = JSON.parse(event.target.result);
                    
                    if (!Array.isArray(importedSpecimens)) {
                        throw new Error('数据格式不正确');
                    }

                    const confirm = window.confirm(
                        `将导入 ${importedSpecimens.length} 个标本。\n\n` +
                        '选择"确定"将替换现有收藏\n' +
                        '选择"取消"将合并到现有收藏'
                    );

                    if (confirm) {
                        this.specimens = importedSpecimens;
                    } else {
                        const existingIds = new Set(this.specimens.map(s => s.id));
                        const newSpecimens = importedSpecimens.filter(s => !existingIds.has(s.id));
                        this.specimens = [...this.specimens, ...newSpecimens];
                    }

                    this.saveCollection();
                    this.applyFilters();
                    this.updateStats();
                    this.updateCatalogCounts();
                    this.showNotification('📥 收藏导入成功', 'success');
                } catch (error) {
                    this.showNotification('导入失败: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    clearCollection() {
        if (this.specimens.length === 0) {
            this.showNotification('收藏馆已经是空的了', 'info');
            return;
        }

        if (confirm(`确定要清空所有 ${this.specimens.length} 个标本吗？\n\n此操作不可恢复！建议先导出备份。`)) {
            this.specimens = [];
            this.filteredSpecimens = [];
            this.saveCollection();
            this.renderSpecimens();
            this.updateStats();
            this.updateCatalogCounts();
            this.showNotification('🗑️ 收藏已清空', 'info');
        }
    }

    // ==================== UI效果 ====================
    scrollToSection(target) {
        const section = document.querySelector(target);
        if (section) {
            const offset = 80;
            const targetPosition = section.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: '#32CD32',
            error: '#DC143C',
            info: '#DAA520'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            font-family: Georgia, serif;
            animation: slideIn 0.3s ease-out;
            border: 2px solid rgba(255,255,255,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==================== 全局函数 ====================
function closeSpecimenModal() {
    if (window.museumManager) {
        window.museumManager.closeSpecimenModal();
    }
}

// ==================== 动画样式 ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    window.museumManager = new MuseumManager();
    
    // 页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // 添加滚动视差效果
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const decoration = document.querySelector('.banner-decoration');
        if (decoration) {
            decoration.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
});