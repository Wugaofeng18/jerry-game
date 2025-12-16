// 音效管理器
class AudioManager {
    constructor() {
        // 音效状态
        this.soundEnabled = true;
        this.bgmEnabled = true;
        this.vibrationEnabled = true;

        // 音频对象
        this.sounds = {};
        this.bgmAudio = null;

        // 音效文件（占位符，实际项目中需要替换为真实音频）
        this.audioFiles = {
            hit: 'assets/audio/hit.mp3',
            confused: 'assets/audio/confused.mp3',
            chime: 'assets/audio/chime.mp3',
            bgm: 'assets/audio/bgm.mp3'
        };

        // 从本地存储加载设置
        this.loadSettings();
    }

    // 加载设置
    loadSettings() {
        const settings = localStorage.getItem('gameSettings');
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            this.soundEnabled = parsedSettings.soundEnabled !== false;
            this.bgmEnabled = parsedSettings.bgmEnabled !== false;
            this.vibrationEnabled = parsedSettings.vibrationEnabled !== false;
        }
    }

    // 保存设置
    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            bgmEnabled: this.bgmEnabled,
            vibrationEnabled: this.vibrationEnabled
        };
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }

    // 切换音效
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.saveSettings();
    }

    // 切换背景音乐
    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            this.playBGM();
        } else {
            this.stopBGM();
        }
        this.saveSettings();
    }

    // 切换震动
    toggleVibration() {
        this.vibrationEnabled = !this.vibrationEnabled;
        this.saveSettings();
    }

    // 触发震动
    triggerVibration(type = 'light') {
        if (!this.vibrationEnabled || !navigator.vibrate) {
            return;
        }

        const patterns = {
            light: [10],
            medium: [50],
            heavy: [100],
            double: [50, 50, 50],
            long: [200]
        };

        if (patterns[type]) {
            navigator.vibrate(patterns[type]);
        }
    }

    // 创建音频（使用Web Audio API创建简单的音效）
    createBeepSound(frequency = 440, duration = 200) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);

        return oscillator;
    }

    // 播放击中音效
    playHitSound() {
        if (!this.soundEnabled) return;

        // 创建一个"boing"音效
        this.createBeepSound(600, 150);
        setTimeout(() => {
            this.createBeepSound(400, 100);
        }, 100);

        // 触发震动
        this.triggerVibration('medium');
    }

    // 播放Tom困惑音效
    playConfusedSound() {
        if (!this.soundEnabled) return;

        // 创建一个困惑的音效
        this.createBeepSound(300, 200);

        // 触发轻震动
        this.triggerVibration('light');
    }

    // 播放正向反馈音效
    playPositiveSound() {
        if (!this.soundEnabled) return;

        // 创建一个愉快的音效
        this.createBeepSound(800, 100);
        setTimeout(() => {
            this.createBeepSound(1000, 100);
        }, 100);

        // 触发震动
        this.triggerVibration('double');
    }

    // 播放连击音效
    playComboSound() {
        if (!this.soundEnabled) return;

        // 创建一个连击音效
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createBeepSound(600 + i * 200, 80);
            }, i * 100);
        }

        // 触发震动
        this.triggerVibration('heavy');
    }

    // 播放背景音乐（简单的循环音）
    playBGM() {
        if (!this.bgmEnabled || this.bgmAudio) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // 创建一个简单的背景音乐循环
        const playBGMNote = () => {
            if (!this.bgmEnabled) return;

            const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66]; // C大调音阶
            let noteIndex = 0;

            const playNextNote = () => {
                if (!this.bgmEnabled) return;

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = notes[noteIndex];
                oscillator.type = 'triangle';

                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // 很低的音量
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);

                noteIndex = (noteIndex + 1) % notes.length;

                if (this.bgmEnabled) {
                    setTimeout(playNextNote, 500);
                }
            };

            playNextNote();
        };

        playBGMNote();
    }

    // 停止背景音乐
    stopBGM() {
        this.bgmEnabled = false;
        // 简单的标记停止，实际的音频会自然结束
    }

    // 播放UI音效
    playUISound() {
        if (!this.soundEnabled) return;

        this.createBeepSound(1000, 50);
        this.triggerVibration('light');
    }
}

// 创建全局音效管理器实例
window.audioManager = new AudioManager();