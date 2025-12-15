import os
import json
import re
import subprocess
import sys
from datetime import datetime

# 强制设置标准输出为 utf-8，解决 Windows 控制台乱码问题
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ================= 配置区域 =================

# 1. 你的题目文件夹在哪里？
# 如果在别的地方，请写绝对路径，例如: r'D:\MyCode\Algorithm'
PROBLEMS_DIR = r'.' 

# 2. 前端项目的 public 目录在哪里？
OUTPUT_DIR = r'./public'
OUTPUT_FILENAME = 'data.json'

# ===========================================

def parse_date_folder(folder_name):
    """ 解析 '2025年11月13日' 为 '2025-11-13' """
    match = re.match(r'(\d{4})年(\d{1,2})月(\d{1,2})日', folder_name)
    if match:
        year, month, day = match.groups()
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return None

def clean_filename(filename):
    """ 清理文件名 """
    name = os.path.splitext(filename)[0]
    name = re.sub(r'^\d+[\._\s]*', '', name)
    return name.replace('_', ' ').title()

def scan_directory(root_path):
    result_data = []
    
    if not os.path.exists(root_path):
        print(f"❌ 错误: 找不到题目目录: {root_path}")
        return []

    print(f"🔍 正在扫描: {os.path.abspath(root_path)} ...")

    for entry in os.listdir(root_path):
        full_path = os.path.join(root_path, entry)
        
        if os.path.isdir(full_path):
            date_str = parse_date_folder(entry)
            
            if date_str:
                daily_record = {
                    "date": date_str,
                    "count": 0,
                    "problems": []
                }
                
                for file in os.listdir(full_path):
                    if file.endswith('.py'):
                        title = clean_filename(file)
                        daily_record["problems"].append({
                            "title": title,
                            "tag": "Uncategorized"
                        })
                
                daily_record["count"] = len(daily_record["problems"])
                if daily_record["count"] > 0:
                    result_data.append(daily_record)

    result_data.sort(key=lambda x: x["date"])
    return result_data

def run_command(command):
    """ 运行 shell 命令并打印输出 """
    print(f"👉 正在执行: {command} ...")
    try:
        subprocess.check_call(command, shell=True)
        return True
    except subprocess.CalledProcessError:
        print(f"❌ 命令执行失败: {command}")
        return False

def auto_deploy():
    """ 自动提交并部署 """
    print("\n🚀 开始自动部署流程...")
    
    data_path = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)
    # git add
    if not run_command(f'git add "{data_path}"'): return

    # git commit
    today = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("📦 提交数据更新到本地 Git...")
    # 允许 commit 失败（比如没有变化时）
    subprocess.call(f'git commit -m "Auto update data: {today}"', shell=True)

    # git push
    print("☁️ 同步源码到 GitHub (origin/main)...")
    subprocess.call('git push origin main', shell=True)

    # npm run deploy
    print("🚀 构建并发布网站到 GitHub Pages...")
    if run_command('npm run deploy'):
        print("\n✅✅✅ 部署成功！过几分钟刷新你的网站即可看到新数据。")
    else:
        print("\n❌ 部署失败，请检查上方错误信息。")

if __name__ == "__main__":
    # 1. 扫描数据
    data = scan_directory(PROBLEMS_DIR)
    
    # 2. 确保输出目录存在
    if not os.path.exists(OUTPUT_DIR):
        try:
            os.makedirs(OUTPUT_DIR)
        except Exception as e:
            print(f"❌ 无法创建输出目录 {OUTPUT_DIR}: {e}")
            exit(1)

    # 3. 写入文件
    output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 数据文件已更新: {output_path}")
        print(f"📅 扫描了 {len(data)} 天的记录。")
    except Exception as e:
        print(f"❌ 写入文件失败: {e}")
        exit(1)

    # 4. 询问是否部署
    print("\n--------------------------------")
    try:
        choice = input("❓ 数据已更新。是否立即推送到 GitHub Pages? (y/n): ").strip().lower()
    except UnicodeDecodeError:
        # 兼容某些极端编码环境
        choice = 'y' 
    
    if choice == 'y':
        auto_deploy()
    else:
        print("👌 已保存数据到本地，未进行部署。")