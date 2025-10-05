# 🐰 小米笔记备份助手

一键批量备份小米笔记（包含图片、录音等文件），小米笔记秒变个人博客网站。

👉 查看演示网站：https://mi-note-export.vercel.app

![](screenshots/banner.png)

## 功能列表

1. 一键批量备份小米笔记 + 文件（图片/视频/录音）
2. 内置网页版，完美还原笔记排版，小米笔记秒变个人博客网站
3. 支持按需增量备份笔记，自动保存为 Markdown 格式，方便导入其他应用

## 快速开始

首先，克隆项目到本地，并按教程更新 [env](./env) 配置文件中的 [cookie](https://github.com/idootop/mi-note-export/issues/4)。

```bash
# 克隆项目源码
git clone https://github.com/idootop/mi-note-export.git

# 进入项目根目录
cd mi-note-export
```

然后，运行以下命令同步最新笔记数据到本地。

```bash
docker run -it --rm --env-file $(pwd)/env -v $(pwd)/public/data:/app/public/data idootop/mi-note-sync:latest
```

> [!NOTE]
> 暂不支持备份私密笔记、待办和思维导图

同步完成后，运行以下命令启动网页端，访问 http://localhost:3000 即可查看笔记。

```bash
docker run -it --rm --init -p 3000:3000 -v $(pwd)/public/data:/home/static/data idootop/mi-note-web:latest
```

> [!IMPORTANT]
> 网页端默认可以访问全部笔记，公网部署需谨慎，防止泄露隐私信息！🚨

> [!TIP]
> 如果本地有 [Node.js](https://nodejs.org/zh-cn/download) 运行环境，可以运行以下命令启动，无需下载 Docker 镜像。

```bash
# 安装依赖并运行
pnpm install && pnpm start
```

## 项目背景

犹记得我使用过的最后一部小米手机是 [红米 Note 4X](https://www.mi.com/redminote4x) —— 当年的千元机性价比之王，陪我走过了大学的青春岁月，记录了许多美好回忆。不过毕业之后，我就再没用过小米手机。

直到有一天，我在邮箱里收到了「小米云服务存储数据即将清空」的通知邮件。

![](screenshots/email.webp)

原以为小米云服务里的数据是永久保存的，原来长时间不用会被清空。

幸好我有经常看邮件的习惯，不然一个月之后就追悔莫及了。

遗憾的是，官方并没有提供「批量导出笔记」的功能。

没办法，只能自己造轮子了～

## 常见问题

### Markdown 格式的笔记保存在哪里？

笔记数据同步到本地后，会将 Markdown 格式的笔记文件保存到 `public/data/markdown` 目录下，笔记中的图片、录音等文件，则保存在 `public/data/assets` 目录下。

转换成 Markdown 格式后的笔记，可能和原始小米笔记的排版有些许出入。为了尽可能还原笔记的排版，推荐使用网页版查看笔记内容。

### 401 Unauthorized Error: 获取笔记列表失败

你还没有设置 cookie 或者 cookie 已过期。

请刷新网页，按教程重新获取 cookie 后，更新到 [env](./env) 文件中重新运行。

### 找不到命令 / Command not found

对于 Windows 操作系统用户，推荐下载 [Git for Windows](https://git-scm.com/downloads)，然后使用 Git Bash 终端运行教程中的命令。
使用 CMD 命令提示符或 PowerShell 运行可能会有兼容性问题，导致异常发生。

### Docker 启动 `idootop/mi-note-web` 后没有反应

`idootop/mi-note-web` 镜像比较特殊，启动后没有任何输出提示，但实际上是可以正常访问的。访问 http://localhost:3000 网页后，控制台则会出现日志输出。

## License

MIT License © 2022-PRESENT [Del Wang](https://del.wang)
