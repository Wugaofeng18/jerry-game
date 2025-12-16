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
        }, 500);
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

            // 随机安排下一个Tom
            const delay = Math.random() * 1500 + 1000; // 1-2.5秒
            this.tomSpawnInterval = setTimeout(spawnTom, delay);
        };

        // 延迟1秒后开始第一个Tom
        setTimeout(spawnTom, 1000);
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
            <div class="tom-face">
                <div class="eyes-container">
                    <div class="eye"></div>
                    <div class="eye"></div>
                </div>
                <div class="nose"></div>
                <div class="mouth"></div>
            </div>
            <div class="stars-container"></div>
        `;

        // 添加点击事件
        tomElement.addEventListener('click', () => this.hitTom(tom.id));

        return tomElement;
    }

    // 设置Tom生命周期
    setupTomLifecycle(tom) {
        // 出现动画
        setTimeout(() => {
            if (tom.state === 'appearing') {
                tom.state = 'idle';
                tom.element.className = 'tom idle';
            }
        }, 1500);

        // 待机时间后自动消失
        if (tom.state === 'appearing') {
            const idleDuration = Math.random() * 3000 + 2000; // 2-5秒
            setTimeout(() => {
                if (tom.state === 'idle') {
                    this.hideTom(tom.id);
                }
            }, 1500 + idleDuration);
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

        // 延迟后隐藏Tom
        setTimeout(() => {
            this.hideTom(tomId);
        }, 2000);
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

    // 添加反馈文字
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
        feedbackElement.className = `feedback-text ${type}`;
        feedbackElement.textContent = text;

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
        }, 2000);
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

    // 清理过期的反馈
    cleanupFeedbacks() {
        const now = Date.now();
        this.activeFeedbacks = this.activeFeedbacks.filter(feedback => {
            const age = now - feedback.timestamp;
            if (age > 3000) { // 3秒后自动清理
                this.removeFeedback(feedback.id);
                return false;
            }
            return true;
        });
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

    // 开始温柔支持
    startGentleSupport() {
        const gentleSupportInterval = setInterval(() => {
            if (!this.isPlaying || this.isPaused) {
                clearInterval(gentleSupportInterval);
                return;
            }

            if (Math.random() < 0.1) { // 10%概率
                this.addFeedback(this.getGentleSupportText(), 'gentle-support', null);
            }
        }, 15000); // 每15秒检查一次
    }

    // 获取即时击中反馈
    getInstantHitFeedback() {
        const feedbacks = [
            "这一锤太解压了！",
            "Jerry今天状态很好",
            "完美的节奏！",
            "打得真准！",
            "Tom有点晕了",
            "就是这样！",
            "非常棒的击中！",
            "Tom：诶？",
            "手感正好",
            "干净利落！",
            "不错嘛",
            "Tom开始害怕了（开玩笑）",
            "力道刚刚好",
            "Tom：我尽力了……"
        ];

        return feedbacks[Math.floor(Math.random() * feedbacks.length)];
    }

    // 获取温柔支持文字
    getGentleSupportText() {
        const feedbacks = [
            "不管今天怎么样，你已经很棒了",
            "累了也没关系，你值得被温柔对待",
            "今天的你，很可爱",
            "慢慢来，不用着急",
            "你的存在本身就是美好的",
            "给自己一个拥抱吧",
            "你已经做得很好了",
            "休息一下也没关系",
            "你比想象中更坚强",
            "允许自己不完美",
            "今天的辛苦都结束了",
            "你是值得被爱的",
            "深呼吸，一切都好的",
            "你真的很努力了",
            "偶尔放空也很棒"
        ];

        return feedbacks[Math.floor(Math.random() * feedbacks.length)];
    }

    // 获取连击反馈
    getComboFeedback() {
        if (this.combo === 1) {
            return "第一下！不错的开始";
        } else if (this.combo === 3) {
            return "三连击！节奏不错";
        } else if (this.combo === 5) {
            return "五连击！Tom快撑不住了";
        } else if (this.combo === 10) {
            return "十连击！你是Jerry本瑞！";
        } else if (this.combo === 20) {
            return "二十连击！Tom要报警了";
        } else if (this.combo >= 50) {
            return "传奇连击！Tom的世界观崩塌了";
        }

        return "连续命中！";
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