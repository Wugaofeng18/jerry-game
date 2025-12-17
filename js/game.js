// 游戏核心逻辑
class JerryGame {
    constructor() {
        // 游戏状态
        this.isPlaying = false;
        this.isPaused = false;

        // Tom相关
        this.activeToms = [];
        this.tomSpawnInterval = null;
        this.maxToms = 4;

        // 连击系统
        this.combo = 0;
        this.lastHitTime = null;
        this.comboTimeout = null;

        // 反馈文字
        this.activeFeedbacks = [];
        this.maxFeedbacks = 5;

        // 网格配置
        this.gridSize = 3;
        this.tomPositions = [];

        // 初始化
        this.init();
    }

    // 初始化游戏
    init() {
        this.createTomGrid();
        this.setupEventListeners();
    }

    // 创建Tom网格
    createTomGrid() {
        const grid = document.getElementById('tom-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // 生成所有可能的位置
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.tomPositions.push({ row, col });

                const cell = document.createElement('div');
                cell.className = 'tom-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                grid.appendChild(cell);
            }
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 开始游戏按钮
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }
    }

    // 开始游戏
    startGame() {
        console.log('游戏开始！');
        this.isPlaying = true;
        this.isPaused = false;

        // 隐藏开始界面
        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.classList.add('hide');
            console.log('开始界面已隐藏');
        } else {
            console.error('找不到开始界面元素');
        }

        // 开始生成Tom
        this.startSpawning();

        // 偶尔添加温柔支持反馈
        this.startGentleSupport();

        // 立即生成第一个Tom
        setTimeout(() => {
            const firstPosition = this.getRandomAvailablePosition();
            if (firstPosition) {
                this.spawnTom(firstPosition);
            }
        }, 200);
    }

    // 暂停游戏
    pauseGame() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.stopSpawning();
        } else {
            this.startSpawning();
        }
    }

    // 开始生成Tom
    startSpawning() {
        if (this.tomSpawnInterval) return;

        const spawnTom = () => {
            if (!this.isPlaying || this.isPaused) return;

            const position = this.getRandomAvailablePosition();
            if (position) {
                this.spawnTom(position);
            }

            // 随机安排下一个Tom - 减少频率避免卡顿
            const delay = Math.random() * 1000 + 800; // 0.8-1.8秒
            this.tomSpawnInterval = setTimeout(spawnTom, delay);
        };

        // 立即开始第一个Tom
        setTimeout(spawnTom, 300);
    }

    // 停止生成Tom
    stopSpawning() {
        if (this.tomSpawnInterval) {
            clearTimeout(this.tomSpawnInterval);
            this.tomSpawnInterval = null;
        }
    }

    // 获取随机可用位置
    getRandomAvailablePosition() {
        // 过滤掉已被占用的位置
        const occupiedPositions = this.activeToms
            .filter(tom => tom.state !== 'hit' && tom.state !== 'hiding')
            .map(tom => tom.position);

        const availablePositions = this.tomPositions.filter(pos =>
            !occupiedPositions.some(occupied =>
                occupied.row === pos.row && occupied.col === pos.col
            )
        );

        if (availablePositions.length === 0 || this.activeToms.length >= this.maxToms) {
            return null;
        }

        return availablePositions[Math.floor(Math.random() * availablePositions.length)];
    }

    // 生成Tom
    spawnTom(position) {
        console.log('生成Tom在位置:', position);

        const tom = {
            id: Date.now() + Math.random(),
            position: position,
            state: 'appearing',
            element: null
        };

        // 创建Tom DOM元素
        const tomElement = this.createTomElement(tom);
        tom.element = tomElement;

        // 添加到对应的格子中
        const cell = document.querySelector(`.tom-cell[data-row="${position.row}"][data-col="${position.col}"]`);
        if (cell) {
            cell.appendChild(tomElement);
            console.log('Tom已添加到格子');
        } else {
            console.error('找不到格子:', position);
            return;
        }

        // 添加到活跃列表
        this.activeToms.push(tom);
        console.log('当前活跃Tom数量:', this.activeToms.length);

        // 设置生命周期
        this.setupTomLifecycle(tom);
    }

    // 创建Tom DOM元素
    createTomElement(tom) {
        const tomElement = document.createElement('div');
        tomElement.className = 'tom appearing';
        tomElement.dataset.tomId = tom.id;

        tomElement.innerHTML = `
            <div class="tom-ears">
                <div class="ear left"></div>
                <div class="ear right"></div>
            </div>
            <div class="tom-face">
                <div class="whiskers">
                    <div class="whisker left-1"></div>
                    <div class="whisker left-2"></div>
                    <div class="whisker left-3"></div>
                    <div class="whisker left-4"></div>
                    <div class="whisker right-1"></div>
                    <div class="whisker right-2"></div>
                    <div class="whisker right-3"></div>
                    <div class="whisker right-4"></div>
                </div>
                <div class="eyes-container">
                    <div class="eye"></div>
                    <div class="eye"></div>
                </div>
                <div class="nose"></div>
                <div class="mouth-container">
                    <div class="mouth-line"></div>
                </div>
            </div>
            <div class="stars-container"></div>
        `;

        // 添加点击事件
        tomElement.addEventListener('click', () => this.hitTom(tom.id));

        return tomElement;
    }

    // 设置Tom生命周期
    setupTomLifecycle(tom) {
        // 立即变为待机状态，减少动画延迟
        setTimeout(() => {
            if (tom.state === 'appearing') {
                tom.state = 'idle';
                if (tom.element) {
                    tom.element.className = 'tom idle';
                }
            }
        }, 800);

        // 待机时间后自动消失 - 缩短时间
        if (tom.state === 'appearing') {
            const idleDuration = Math.random() * 2000 + 1500; // 1.5-3.5秒
            setTimeout(() => {
                if (tom.state === 'idle') {
                    this.hideTom(tom.id);
                }
            }, 800 + idleDuration);
        }
    }

    // 击中Tom
    hitTom(tomId) {
        const tom = this.activeToms.find(t => t.id === tomId);
        if (!tom || tom.state !== 'idle') return;

        // 更新状态
        tom.state = 'hit';
        tom.element.className = 'tom hit';

        // 更新连击
        this.updateCombo();

        // 添加反馈文字
        this.addFeedback(this.getInstantHitFeedback(), 'instantHit', tom.position);

        // 播放音效
        window.audioManager.playHitSound();
        window.audioManager.playConfusedSound();

        // 添加星星特效
        this.addStarEffect(tom.element);

        // 处理连击奖励
        this.handleComboRewards(tom.position);

        // 延迟后隐藏Tom - 缩短时间
        setTimeout(() => {
            this.hideTom(tomId);
        }, 1200);
    }

    // 隐藏Tom
    hideTom(tomId) {
        const tom = this.activeToms.find(t => t.id === tomId);
        if (!tom) return;

        tom.state = 'hiding';
        tom.element.className = 'tom hiding';

        setTimeout(() => {
            // 从DOM中移除
            if (tom.element && tom.element.parentNode) {
                tom.element.parentNode.removeChild(tom.element);
            }

            // 从活跃列表中移除
            const index = this.activeToms.findIndex(t => t.id === tomId);
            if (index > -1) {
                this.activeToms.splice(index, 1);
            }
        }, 1000);
    }

    // 更新连击
    updateCombo() {
        const now = Date.now();
        this.lastHitTime = now;
        this.combo++;

        // 更新连击显示
        this.updateComboDisplay();

        // 设置连击重置定时器
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }

        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, 3000); // 3秒内没有击中就重置
    }

    // 重置连击
    resetCombo() {
        this.combo = 0;
        this.updateComboDisplay();
    }

    // 更新连击显示
    updateComboDisplay() {
        const comboDisplay = document.getElementById('combo-display');
        const comboNumber = document.getElementById('combo-number');

        if (this.combo > 0) {
            comboDisplay.style.display = 'block';
            comboNumber.textContent = this.combo;
        } else {
            comboDisplay.style.display = 'none';
        }
    }

    // 处理连击奖励
    handleComboRewards(position) {
        if (this.combo === 3) {
            setTimeout(() => {
                this.addFeedback('连续命中！压力正在消失', 'combo', position);
                window.audioManager.playPositiveSound();
            }, 300);
        } else if (this.combo === 5) {
            setTimeout(() => {
                this.addFeedback('五连击！Tom快撑不住了', 'combo', position);
                window.audioManager.playComboSound();
            }, 300);
        } else if (this.combo === 10) {
            setTimeout(() => {
                this.addFeedback('十连击！你是Jerry本瑞！', 'combo', position);
                window.audioManager.playComboSound();
            }, 600);
        }
    }

    // 添加反馈文字 - 男朋友版本
    addFeedback(text, type = 'instantHit', position = null) {
        // 清理过期的反馈
        this.cleanupFeedbacks();

        const feedback = {
            id: Date.now() + Math.random(),
            text: text,
            type: type,
            position: position,
            timestamp: Date.now()
        };

        // 创建反馈元素
        const feedbackElement = document.createElement('div');

        // 根据类型设置不同样式和动画
        if (text.includes('老公') || text.includes('宝贝') || text.includes('老婆')) {
            feedbackElement.className = 'feedback-text instant-hit boyfriend-feedback';
            feedbackElement.style.animation = 'boyfriendFeedback 2.5s ease-out forwards';
        } else if (type === 'combo') {
            feedbackElement.className = 'feedback-text combo';
        } else if (type === 'gentle-support') {
            feedbackElement.className = 'feedback-text gentle-support';
        } else {
            feedbackElement.className = `feedback-text ${type}`;
        }

        feedbackElement.textContent = text;

        // 如果是男朋友夸奖，添加爱心特效
        if (text.includes('老公') || text.includes('宝贝') || text.includes('老婆')) {
            this.addHeartEffect();
        }

        // 设置位置
        const containerRect = document.getElementById('tom-grid').getBoundingClientRect();
        if (position) {
            // 在指定位置附近显示
            const cellSize = containerRect.width / 3;
            const x = containerRect.left + (position.col + 0.5) * cellSize - 100;
            const y = containerRect.top + (position.row + 0.5) * cellSize - 50;

            feedbackElement.style.left = `${Math.max(20, Math.min(x, window.innerWidth - 220))}px`;
            feedbackElement.style.top = `${Math.max(60, Math.min(y, window.innerHeight - 100))}px`;
        } else {
            // 随机位置
            const x = 40 + Math.random() * (window.innerWidth - 280);
            const y = 100 + Math.random() * (window.innerHeight - 200);

            feedbackElement.style.left = `${x}px`;
            feedbackElement.style.top = `${y}px`;
        }

        // 添加到页面
        document.getElementById('feedback-container').appendChild(feedbackElement);
        feedback.element = feedbackElement;

        // 添加到活跃列表
        this.activeFeedbacks.push(feedback);

        // 自动移除
        setTimeout(() => {
            this.removeFeedback(feedback.id);
        }, 2500); // 延长显示时间，让用户能看完整
    }

    // 添加爱心特效
    addHeartEffect() {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.cssText = `
            position: fixed;
            font-size: 30px;
            z-index: 100;
            pointer-events: none;
            animation: heartFloat 3s ease-out forwards;
            left: ${Math.random() * (window.innerWidth - 50)}px;
            top: ${window.innerHeight - 100}px;
        `;

        document.body.appendChild(heart);

        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 3000);
    }

    // 移除反馈文字
    removeFeedback(feedbackId) {
        const index = this.activeFeedbacks.findIndex(f => f.id === feedbackId);
        if (index > -1) {
            const feedback = this.activeFeedbacks[index];
            if (feedback.element && feedback.element.parentNode) {
                feedback.element.parentNode.removeChild(feedback.element);
            }
            this.activeFeedbacks.splice(index, 1);
        }
    }

    // 清理过期的反馈 - 减少内存占用
    cleanupFeedbacks() {
        const now = Date.now();
        this.activeFeedbacks = this.activeFeedbacks.filter(feedback => {
            const age = now - feedback.timestamp;
            if (age > 2000) { // 2秒后自动清理
                this.removeFeedback(feedback.id);
                return false;
            }
            return true;
        });

        // 限制同时显示的反馈数量，避免卡顿
        if (this.activeFeedbacks.length > 3) {
            const excess = this.activeFeedbacks.slice(0, this.activeFeedbacks.length - 3);
            excess.forEach(feedback => {
                this.removeFeedback(feedback.id);
            });
            this.activeFeedbacks = this.activeFeedbacks.slice(-3);
        }
    }

    // 添加星星特效
    addStarEffect(tomElement) {
        const starsContainer = tomElement.querySelector('.stars-container');
        if (!starsContainer) return;

        const starPositions = [
            { top: '-10px', left: '-10px' },
            { top: '-15px', right: '-5px' },
            { top: '0px', right: '-15px' }
        ];

        starPositions.forEach((pos, index) => {
            setTimeout(() => {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.top = pos.top;
                star.style.left = pos.left || 'auto';
                star.style.right = pos.right || 'auto';

                starsContainer.appendChild(star);

                // 自动移除星星
                setTimeout(() => {
                    if (star.parentNode) {
                        star.parentNode.removeChild(star);
                    }
                }, 1500);
            }, index * 100);
        });
    }

    // 开始温柔支持 - 降低频率避免干扰
    startGentleSupport() {
        const gentleSupportInterval = setInterval(() => {
            if (!this.isPlaying || this.isPaused) {
                clearInterval(gentleSupportInterval);
                return;
            }

            if (Math.random() < 0.05) { // 降低到5%概率
                this.addFeedback(this.getGentleSupportText(), 'gentle-support', null);
            }
        }, 20000); // 每20秒检查一次
    }

    // 获取即时击中反馈 - 男朋友视角
    getInstantHitFeedback() {
        const feedbacks = [
            "宝贝打得真准！❤️",
            "老公在为你加油哦～",
            "我的宝贝真厉害！",
            "就是这样，别客气～",
            "Tom：老婆饶命🥺",
            "我最喜欢你这样认真的样子",
            "哇，力道刚刚好，很舒服呢",
            "宝贝今天状态爆棚！",
            "这个反应速度，太棒了吧",
            "老公为你骄傲！",
            "看你打Tom的样子好可爱",
            "没错，就是这样不手软",
            "宝贝一定累了吧？老公帮你捏捏肩～",
            "每次出手都这么精准，佩服佩服",
            "老公看得出你很开心呢",
            "打得好！给你一个大大的拥抱",
            "Tom：老婆好凶哦～但我喜欢🥰",
            "宝贝的节奏感越来越好啦",
            "就是这个力度，完美！",
            "老公好喜欢你专注的样子",
            "打得好！奖励你一个亲亲～😘"
        ];

        return feedbacks[Math.floor(Math.random() * feedbacks.length)];
    }

    // 获取温柔支持文字 - 男朋友视角
    getGentleSupportText() {
        const feedbacks = [
            "宝贝，不管今天怎么样，老公都在你身边",
            "累了吧？来，让老公抱抱你～",
            "我最喜欢看你开心的样子了",
            "你知道吗？你在我心里是最可爱的",
            "宝贝慢慢来，老公一直陪着你",
            "今天辛苦了，让老公给你按摩按摩～",
            "你做得已经很好了，老公为你骄傲",
            "想不想吃点什么？老公给你做",
            "宝贝的微笑是老公最美的风景",
            "老公好想抱抱你，感受你的温暖",
            "你是老公最珍贵的宝贝",
            "别担心，有老公在呢",
            "老公永远是你最坚强的后盾",
            "宝贝，你真的已经很努力了",
            "老公会一直爱你，不管发生什么",
            "想老公了吗？老公超想你的",
            "你在我心里永远都是第一位的",
            "宝贝，老公给你准备了小惊喜",
            "老公愿意做你的倾听者，随时都在",
            "能陪在你身边，是老公最大的幸福",
            "老公永远不会让你一个人承受"
        ];

        return feedbacks[Math.floor(Math.random() * feedbacks.length)];
    }

    // 获取连击反馈 - 男朋友视角
    getComboFeedback() {
        if (this.combo === 1) {
            return "第一下就中！宝贝太厉害了！";
        } else if (this.combo === 3) {
            return "三连击！老公被你迷住了～";
        } else if (this.combo === 5) {
            return "五连击！Tom：老婆手下留情🥺";
        } else if (this.combo === 8) {
            return "八连击！老公要给你买小零食！";
        } else if (this.combo === 10) {
            return "十连击！嫁给我吧宝贝！🥰";
        } else if (this.combo === 15) {
            return "十五连击！老公要给你买包包！";
        } else if (this.combo === 20) {
            return "二十连击！今晚老公给你做大餐！";
        } else if (this.combo === 25) {
            return "二十五连击！老婆我爱你！❤️";
        } else if (this.combo === 30) {
            return "三十连击！老公要感动哭了！😭";
        } else if (this.combo === 50) {
            return "五十连击！老婆是女神降临！👑";
        } else if (this.combo === 100) {
            return "百连击！此生非你不娶！💍";
        }

        return "老公为你疯狂打call！💕";
    }
}

// 创建游戏实例
window.jerryGame = new JerryGame();

// 确保DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 重新设置事件监听器，确保DOM已经加载
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('开始游戏按钮被点击');
            window.jerryGame.startGame();
        });
    }

    console.log('游戏已初始化，准备开始');
});