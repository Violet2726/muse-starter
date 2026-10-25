# LLM 辩论与意见动力学文献集

一份围绕多智能体辩论（MAD）的会议论文索引：辩论何时有效、何时坍缩为偏见共识，
以及从众、谄媚、说服、自我验证、投票聚合与错误相关等相邻机制研究。
共 79 篇，来自 NeurIPS、ICML、ICLR、ACL、AAAI，覆盖 2023–2026 年。
线上地址：https://muse-starter.vercel.app

## 项目结构（数据与展示分离）

```
index.html        页面骨架（搜索、筛选、排序、阅读面板、列表容器）
styles.css        全部样式，含亮色 / 暗色两套主题变量
app.js            全部交互逻辑：渲染、筛选、排序、已读记录、导入导出、主题切换
data/papers.json  全部论文数据（见下）
```

不再把数据嵌在单个 HTML 里：改数据只改 `data/papers.json`，改样子只改
`styles.css`，改交互只改 `app.js`。

## 数据格式（`data/papers.json`，每篇一条）

| 字段 | 含义 |
| --- | --- |
| `id` | 内部序号 0–78 |
| `no` | 清单序号 1–79；已读记录与导入导出文件都用这个编号，与旧版单页兼容 |
| `title` / `venue` / `year` / `track` / `decision` / `display` | 标题、会议、年份、Track、录用原文、展示组（spotlight / poster / oral / regular） |
| `theme` / `themeName` | 主题代码与中文名（主题按题名归类，仅供检索参考） |
| `url` | 会议官方页面链接 |
| `authors` | 作者；官方页未列出的留空，不拼凑 |
| `intro` | 阅读论文内容后撰写的中文介绍 |
| `highlight` | 一句话亮点 |
| `basis` | 介绍依据：`abstract`（论文摘要）或 `fulltext`（论文全文） |

## 阅读记录与主题

- 已读勾选存在浏览器本地存储，键名 `llm-debate-read-v1`，与旧版单页共用，
  升级后原有勾选不丢失；导出文件格式也与旧版一致（`reading-record.json`）。
- 主题切换键名 `llm-debate-theme-v1`，跟随系统或手动切换，刷新后保持。

## 新增一篇论文

1. 在 `data/papers.json` 末尾追加一条（`no` 顺延，`id` = `no` - 1）。
2. 阅读论文摘要或全文后写 `intro` 与 `highlight`，并如实填 `basis`。
3. 提交到 `main` 分支，Vercel 自动重新部署。

## 部署

本仓库直连 Vercel 项目 `muse-starter`：推送到 `main` 即触发生产部署，
无需手动操作。不要在这里放密钥、Token 或其他私密信息。
