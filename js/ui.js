// UI管理器
class UIManager {
    constructor() {
        this.init();
    }

    // 初始化
    init() {
        this.setupSettingsPanel();
        this.setupSettingsToggle();
        this.loadInitialSettings();
    }

    // 设置设置面板
    setupSettingsPanel() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const closeSettingsBtn = document.getElementById('close-settings');

        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        if (closeSettingsBtn && settingsPanel) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettings();
            });
        }

        // 点击面板外部关闭
        if (settingsPanel) {
            settingsPanel.addEventListener('click', (e) => {
                if (e.target === settingsPanel) {
                    this.hideSettings();
                }
            });
        }
    }

    // 设置设置开关
    setupSettingsToggle() {
        const soundToggle = document.getElementById('sound-toggle');
        const bgmToggle = document.getElementById('bgm-toggle');
        const vibrationToggle = document.getElementById('vibration-toggle');

        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                window.audioManager.toggleSound();
                this.playUISound();
            });
        }

        if (bgmToggle) {
            bgmToggle.addEventListener('change', (e) => {
                window.audioManager.toggleBGM();
                this.playUISound();
            });
        }

        if (vibrationToggle) {
            vibrationToggle.addEventListener('change', (e) => {
                window.audioManager.toggleVibration();
                this.playUISound();
            });
        }
    }

    // 加载初始设置
    loadInitialSettings() {
        // 同步设置到UI
        const soundToggle = document.getElementById('sound-toggle');
        const bgmToggle = document.getElementById('bgm-toggle');
        const vibrationToggle = document.getElementById('vibration-toggle');

        if (soundToggle) {
            soundToggle.checked = window.audioManager.soundEnabled;
        }

        if (bgmToggle) {
            bgmToggle.checked = window.audioManager.bgmEnabled;
        }

        if (vibrationToggle) {
            vibrationToggle.checked = window.audioManager.vibrationEnabled;
        }
    }

    // 显示设置面板
    showSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.add('show');
            this.playUISound();
        }
    }

    // 隐藏设置面板
    hideSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.remove('show');
            this.playUISound();
        }
    }

    // 播放UI音效
    playUISound() {
        window.audioManager.playUISound();
    }

    // 添加按钮点击效果
    addButtonEffect(button) {
        if (!button) return;

        button.addEventListener('click', function() {
            this.classList.add('apply-button-press');
            setTimeout(() => {
                this.classList.remove('apply-button-press');
            }, 200);
        });
    }

    // 添加脉冲效果
    addPulseEffect(element) {
        if (!element) return;

        element.classList.add('apply-pulse');
        setTimeout(() => {
            element.classList.remove('apply-pulse');
        }, 600);
    }

    // 添加震动效果
    addShakeEffect(element) {
        if (!element) return;

        element.classList.add('apply-shake');
        setTimeout(() => {
            element.classList.remove('apply-shake');
        }, 500);
    }

    // 显示提示消息
    showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        // 添加样式
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            animation: slideUp 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    }

    // 创建加载动画
    createLoadingAnimation() {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.innerHTML = `
            <div class="loader-circle"></div>
            <div class="loader-circle"></div>
            <div class="loader-circle"></div>
        `;

        // 添加样式
        loader.style.cssText = `
            display: flex;
            gap: 8px;
            padding: 20px;
        `;

        const style = document.createElement('style');
        style.textContent = `
            .loader-circle {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: var(--primary);
                animation: bounce 1.4s ease-in-out infinite both;
            }
            .loader-circle:nth-child(1) { animation-delay: -0.32s; }
            .loader-circle:nth-child(2) { animation-delay: -0.16s; }
            @keyframes bounce {
                0%, 80%, 100% {
                    transform: scale(0);
                }
                40% {
                    transform: scale(1);
                }
            }
        `;

        if (!document.querySelector('style[data-loader]')) {
            style.setAttribute('data-loader', 'true');
            document.head.appendChild(style);
        }

        return loader;
    }

    // 创建确认对话框
    createConfirmDialog(message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-message">${message}</div>
                <div class="confirm-buttons">
                    <button class="confirm-btn confirm-cancel">取消</button>
                    <button class="confirm-btn confirm-ok">确认</button>
                </div>
            </div>
        `;

        // 添加样式
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const content = dialog.querySelector('.confirm-content');
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 300px;
            width: 90%;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        `;

        const messageEl = dialog.querySelector('.confirm-message');
        messageEl.style.cssText = `
            text-align: center;
            margin-bottom: 20px;
            color: var(--text);
            line-height: 1.5;
        `;

        const buttonsEl = dialog.querySelector('.confirm-buttons');
        buttonsEl.style.cssText = `
            display: flex;
            gap: 12px;
        `;

        const buttons = dialog.querySelectorAll('.confirm-btn');
        buttons.forEach(btn => {
            btn.style.cssText = `
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
        });

        const cancelBtn = dialog.querySelector('.confirm-cancel');
        cancelBtn.style.cssText += `
            background: var(--divider);
            color: var(--text);
        `;

        const okBtn = dialog.querySelector('.confirm-ok');
        okBtn.style.cssText += `
            background: var(--primary);
            color: white;
        `;

        // 事件处理
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            if (onCancel) onCancel();
        });

        okBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            if (onConfirm) onConfirm();
        });

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
                if (onCancel) onCancel();
            }
        });

        document.body.appendChild(dialog);
    }

    // 防止页面滚动（移动端）
    preventPageScroll() {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
    }

    // 恢复页面滚动
    restorePageScroll() {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
    }
}

// 创建UI管理器实例
window.uiManager = new UIManager();

// 添加额外的按钮效果
document.addEventListener('DOMContentLoaded', () => {
    // 为所有按钮添加点击效果
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        window.uiManager.addButtonEffect(button);
    });

    // 防止移动端双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // 防止长按选择
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
});