#!/usr/bin/env python3
"""
简单的HTTP服务器启动脚本
用于在本地运行Jerry的减压小锤游戏
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# 设置端口
PORT = 8000

# 切换到脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class GameHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义请求处理器，添加CORS支持"""

    def end_headers(self):
        # 添加CORS头部，支持跨域请求
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        # 处理根路径请求
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

def main():
    """启动服务器"""

    # 尝试创建服务器
    try:
        with socketserver.TCPServer(("", PORT), GameHTTPRequestHandler) as httpd:
            print(f"🎮 Jerry的减压小锤游戏服务器启动成功！")
            print(f"📍 服务器地址: http://localhost:{PORT}")
            print(f"🌐 请在浏览器中打开: http://localhost:{PORT}")
            print(f"⏹️  按 Ctrl+C 停止服务器")
            print("-" * 50)

            # 自动打开浏览器
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("🚀 已自动打开浏览器...")
            except:
                print("💡 请手动在浏览器中打开上述地址")

            # 启动服务器
            httpd.serve_forever()

    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {PORT} 已被占用，请尝试其他端口")
            print(f"💡 使用方法: python3 start-server.py [端口号]")
            sys.exit(1)
        else:
            print(f"❌ 启动服务器时出错: {e}")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 游戏服务器已停止")
        sys.exit(0)

if __name__ == "__main__":
    # 如果提供了命令行参数，使用指定的端口
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except ValueError:
            print("❌ 端口号必须是整数")
            sys.exit(1)

    main()