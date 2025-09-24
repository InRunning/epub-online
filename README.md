# EPUB在线阅读器

一个基于Next.js开发的本地EPUB文件阅读器，提供现代化的阅读体验和丰富的定制功能。

![EPUB Reader](https://img.shields.io/badge/EPUB-Reader-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8.svg)

## ✨ 特性

- **📚 EPUB文件支持** - 完整的EPUB格式解析和渲染
- **📱 响应式设计** - 适配桌面、平板和移动设备
- **🎨 多主题支持** - 明亮、暗黑、护眼三种阅读主题
- **📖 阅读进度管理** - 自动保存阅读位置和进度
- **🔍 目录导航** - 快速跳转到指定章节
- **⚙️ 个性化设置** - 字体大小、字体类型、行间距、页面宽度自定义
- **🔄 拖拽上传** - 支持拖拽上传EPUB文件
- **💾 本地存储** - 书籍和设置本地保存，无需网络

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装和运行

1. **克隆项目**
```bash
git clone <repository-url>
cd epub-online
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 📖 使用指南

### 上传EPUB文件
1. 在主页面点击上传区域或拖拽EPUB文件
2. 系统自动解析文件并提取书籍信息
3. 上传完成后，书籍会出现在图书馆中

### 开始阅读
1. 在图书馆中点击书籍封面或标题
2. 进入阅读界面，支持以下操作：
   - 点击页面左右区域翻页
   - 使用键盘左右箭头翻页
   - 点击菜单按钮查看目录
   - 点击设置按钮自定义阅读体验

### 阅读设置
- **字体大小**: 12px - 32px 可调
- **字体类型**: Georgia, Times, Arial, Helvetica, Verdana, System
- **阅读主题**: 明亮、暗黑、护眼
- **行间距**: 1.2 - 2.5 可调
- **页面宽度**: 600px - 1200px 可调

## 🏗️ 项目架构

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React组件
│   ├── BooksList.tsx      # 书籍列表
│   ├── EpubReader.tsx     # EPUB阅读器
│   ├── FileUpload.tsx     # 文件上传
│   ├── ReaderSettings.tsx # 阅读设置
│   ├── ErrorBoundary.tsx  # 错误边界
│   └── Loading.tsx        # 加载组件
├── lib/                   # 工具库
│   └── epubParser.ts      # EPUB解析器
├── store/                 # 状态管理
│   └── useBookStore.ts    # 书籍状态管理
└── types/                 # 类型定义
    └── epub.ts            # EPUB相关类型
```

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) - React全栈框架
- **UI库**: [React 18](https://reactjs.org/) - 用户界面库
- **语言**: [TypeScript](https://www.typescriptlang.org/) - 类型安全
- **样式**: [Tailwind CSS](https://tailwindcss.com/) - 实用程序优先的CSS框架
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand) - 轻量级状态管理
- **EPUB解析**: [epub.js](https://github.com/futurepress/epub.js) - EPUB文件解析和渲染
- **文件处理**: [JSZip](https://stuk.github.io/jszip/) - ZIP文件处理
- **文件上传**: [react-dropzone](https://github.com/react-dropzone/react-dropzone) - 拖拽上传
- **图标**: [Lucide React](https://lucide.dev/) - 美观的图标库

## 📱 功能特性详解

### EPUB文件解析
- 支持EPUB 2.0和3.0格式
- 自动提取书籍元数据（标题、作者、描述等）
- 解析目录结构和章节信息
- 提取封面图片

### 阅读器功能
- 分页式阅读体验
- 章节导航和快速跳转
- 阅读进度自动保存
- 全屏阅读模式
- 响应式布局适配

### 用户体验
- 直观的拖拽上传界面
- 实时的设置预览
- 流畅的页面切换动画
- 错误处理和用户反馈

## 🔄 待开发功能

- [ ] 书签功能
- [ ] 文本搜索
- [ ] 高亮和笔记
- [ ] 数据导出
- [ ] PWA支持
- [ ] 多语言支持
- [ ] 夜间模式自动切换
- [ ] 阅读统计

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📞 联系

如果您有任何问题或建议，请通过以下方式联系：

- 创建 [Issue](https://github.com/your-username/epub-online/issues)
- 发送邮件到 your-email@example.com

---

**享受阅读！** 📖