<div align="center">

<h1 align="center">📝 小米笔记备份助手</h1>
<p align="center">小米笔记秒变<a href="https://mi-note-export.vercel.app" target="_blank">个人博客网站</a>，一键备份小米笔记</p>

[![Banner](screenshots/banner.png)](https://mi-note-export.vercel.app)

</div>

## 功能列表

- **⚡️ 一键备份**：完整备份笔记和图片等文件，避免数据丢失。
- **✨ 秒变博客**：将小米笔记转成网页，您的个人博客即刻上线！
- **🔒 隐私安全**：纯本地处理，无需第三方服务器，数据 100% 掌控
- **🚗 迁移到其他平台**：支持保存为 Markdown 格式，方便导入其他应用

## 快速开始

首先，克隆项目到本地

```bash
git clone https://github.com/idootop/mi-note-export.git && cd mi-note-export
```

### 1. 配置参数

然后，把[ env 配置文件](./env)中的 Cookie 换成你自己的 [👉 设置教程](https://github.com/idootop/mi-note-export/issues/4)

```bash
MI_COOKIE='xxxxxx'
```

### 2. 备份笔记

下载小米笔记 + 文件（图片/录音等）到本地

```bash
docker run -it --rm --env-file $(pwd)/env -v $(pwd)/public/data:/app/public/data idootop/mi-note-sync:latest
```

> [!NOTE]
> 暂不支持备份私密笔记、待办和思维导图

### 3. 生成博客

备份完成后，运行以下命令启动网页端，访问 http://localhost:3000 即可查看笔记。

```bash
docker run -it --rm --init -p 3000:3000 -v $(pwd)/public/data:/home/static/data idootop/mi-note-web:latest
```

### 4. 部署上线

> 👉 查看演示网站：https://mi-note-export.vercel.app

复制 `apps/web/dist` 下的静态文件到 `public`，然后将 `public` 文件夹打包上传到任意静态站点即可。

```bash
public
├── assets
│   ├── index-Bu60GB9I.css
│   └── index-CprafGi1.js
├── data
│   ├── assets      # 下载的文件
│   ├── notes.json  # 小米笔记数据
├── index.html      # 静态网站首页
└── logo.png
```

> [!IMPORTANT]
> 网页端默认可以访问全部笔记，公网部署需谨慎，防止泄露隐私信息！🚨

## 项目背景

犹记得我用过的最后一部小米手机是 [红米 Note 4X](https://www.mi.com/redminote4x) —— 当年的千元机性价比之王，陪我走过了大学的青春岁月，记录了许多美好回忆。

不过毕业之后，我就再没用过小米手机。

直到有一天，我收到了「小米云服务存储数据即将清空」的通知邮件。

![](screenshots/email.webp)

原以为小米云服务里的数据是永久保存的，原来长时间不用也会被清空。

幸好我有经常看邮件的习惯，不然一个月之后就灰飞烟灭了。

但遗憾的是，小米笔记并没有提供「批量导出」的功能。

于是，便有了本项目 ;)

## 其他信息

- 本项目图标由「[豆包](https://www.doubao.com)」生成，宣传图使用 [Figma](https://www.figma.com) 制作
- 本项目代码由 [Cursor](https://cursor.com/cn) + [Claude Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5) 辅助生成
- 前端由 [Vite](https://vite.dev/) + [Svelte](https://svelte.dev/) 强力驱动（轻量高效，适合小型单页应用）
- 后端由 [Bun](https://bun.com/) 强力驱动（更小、更高效的 [Node.js](https://nodejs.org) 运行时替代品）
- 网站 Docker 镜像由 [lipanski/docker-static-website](https://lipanski.com/posts/smallest-docker-image-static-website) 强力驱动（不到 **100KB**）

## License

MIT License © 2022-PRESENT [Del Wang](https://del.wang)
