# MooDay

> ⚠️ **本项目完全由 AI 生成**——包括所有源代码、UI 设计、构建配置，甚至你正在阅读的这份 README 大部分也由 AI 生成。

## 简介

MooDay 是一款 Windows 桌面便签与日历心情记录工具，基于 Electron + React + TypeScript 构建。

- **日历视图**：支持农历、二十四节气（Jean Meeus 天文算法）、天干地支纪年
- **便签系统**：可拖拽至独立窗口或吸附回主界面，支持文字内容和图片
- **心情追踪**：六种心情模式（中性/开心/伤心/焦虑/生气/平静），随日期切换
- **待办事项**：标星优先级、行内编辑、侧边栏快速创建

## 项目结构

```
src/
├── main/            # Electron 主进程 + preload
│   ├── main.ts
│   └── preload.ts
└── renderer/        # React 渲染进程
    ├── components/  # UI 组件
    ├── styles/      # CSS 样式
    └── lunar.ts     # 农历与节气计算
```

## 技术栈

| 层         | 技术                           |
| ---------- | ------------------------------ |
| 桌面框架   | Electron 28                    |
| UI         | React 18 + TypeScript          |
| 构建       | Webpack 5 + ts-loader          |
| 打包       | electron-builder（便携版 .exe） |

## 安装与运行

### 为开发构建并运行

```bash
npm install
npm run start        # 开发运行
npm run build:pack   # 打包为 MooDay.exe
```

### 最终 .exe 位置

打包后的可执行文件位于：

```
release/MooDay.exe
```

> 该文件为便携版，**仅需一个 .exe 即可运行**。双击启动，无需安装任何依赖（如 Node.js、VC++ 运行时等），解压后自动运行。

### 用户数据目录

便签、待办事项、设置等数据存储于：

```
%APPDATA%/mooday/
```

## License

MIT

## 唯一由人类编写的部分

这个项目是我脑子一热想到的，因为找不到完美符合我预期的应用，干脆自己让AI写了一个。当然，本项目存在各种不知名小BUG，以及许多我无论怎样修改提示词，AI都get不到的想法没有实现，希望有大佬能帮忙做出来。
