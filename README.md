# AI 圆桌 · 原生会话版

在 DeepSeek Harness 的原生聊天窗口中，让 2–4 个模型按顺序讨论。你担任主持人，每轮选择一名或多名成员；一位模型完成回答和工具调用后，再由下一位发言。

本仓库已切换为 `dsh-plugin-ai-roundtable-native` 原生会话实现。GitHub 仓库名称仍为 `dsh-plugin-ai-roundtable`，插件包名及运行时标识保留 `native` 后缀。旧版圆桌数据不会自动读取或迁移，升级前请导出需要保留的讨论。

## 功能

- 使用本体聊天窗口、工作区、历史列表、标题、重命名和归档。
- 复用本体输入框、附件、命令、权限审批、工具执行、流式回答、思考、Markdown 和上下文压缩。
- 按服务商分组选择模型及思考强度，自动检测连接，支持取消与重试检测。
- 成员固定配色，每轮可选择任意成员组合，按配置顺序发言。
- 单个成员失败或超时后继续后续成员，可单独重试失败成员。
- 原生停止按钮取消剩余发言，原生分支继承成员和已有历史索引。
- 支持 JSON 与 Markdown 导出，包含会话内容及工具结果。

各模型共享同一场会话的工作区、上下文及权限。插件通过宿主工具管线执行任务，圆桌轮转本身不会增加操作授权。

## 兼容性

已验证目标为 **Windows DeepSeek Harness 0.2.0-rc.2**，宿主构建 commit：`04f392c9ddd144fa426da2045178797da6db6c11`。

本插件依赖宿主内部会话接口和界面结构，其他版本及平台尚未验证。客户端 bundle 已提交，安装使用无需构建。模型及 API 凭据在 Harness 内配置，插件不提供模型服务，也不内置密钥。

## 安装

1. 下载或克隆仓库到固定目录，例如 `C:/Plugins/dsh-plugin-ai-roundtable`。
2. 在需要加载插件的 Harness profile 的 `cordis.patch.yml` 中加入下列项目。已有 `insert` 列表时，将插件项合并进去，路径改为实际的绝对路径：

   ```yaml
   - insert:
       - id: ai-roundtable-native
         name: 'C:/Plugins/dsh-plugin-ai-roundtable/lib/index.js'
   ```

3. 保存后重启 Harness。

仓库内的 `cordis.patch.yml` 使用包名加载，仅适用于包已能被宿主解析的环境。直接从下载目录安装时，请使用上述绝对路径形式。当前未发布 npm 包。

从旧版升级时，先备份原 profile 配置和讨论数据，移除旧插件加载项，再添加原生版，避免同时启用两个圆桌界面。旧数据请保留备份。

## 使用

1. 在本体中点击“新聊天”，选择工作区。
2. 打开输入区的“AI 圆桌”开关，点击“选择模型”，按发言顺序选择 2–4 个成员。
3. 设置思考强度并检查连接状态，输入问题后发送。
4. 后续通过发送按钮右侧的成员区选择本轮发言目标；全部取消时会阻止发送并保留草稿及附件。

首次发送前可以重新配置或关闭圆桌，发送后固定成员。更换成员需要新建圆桌，本体 `/model` 命令不会修改圆桌名单。

连接检测会调用所选模型并产生服务用量，输出上限为 512 token。重新勾选、修改思考强度或重新打开选择窗口时会重新检测；失败不会自动重试付费请求。

## 配置与数据

可在插件加载项添加 `config`：

```yaml
- insert:
    - id: ai-roundtable-native
      name: 'C:/Plugins/dsh-plugin-ai-roundtable/lib/index.js'
      config:
        callTimeoutMs: 600000
        # 可选：控制记录的保存目录
        # dataDir: 'C:/HarnessData/roundtable-native'
```

`callTimeoutMs` 是每名成员一次发言（含工具执行）的最长时间，默认为 600000 毫秒，取值为 1–3600000 毫秒。

控制索引默认保存到 `$DSH_HOME/roundtable-native`；未设置 `DSH_HOME` 时使用用户目录下的 `.dsh/roundtable-native`。索引保存成员、路由、目标及轮次状态，不复制正文或凭据。正文、思考、工具和标题由本体会话日志保存。导出文件可能包含讨论内容、工作区信息与工具结果，分享前应检查。

重启或卸载后不会自动补跑未完成成员。卸载时移除 profile 中的插件加载项并重启；如需删除历史，请另外备份并管理宿主会话和控制索引。

## 开发与验证

需要 Node.js 22 或更高版本，无需安装第三方构建依赖：

```powershell
node scripts/build-client.mjs
node --test --test-isolation=none tests/*.test.mjs
node scripts/run-native-tests.mjs
```

前两条命令可独立运行。原生集成测试需要目标 Windows 桌面版安装在 `%LOCALAPPDATA%/Programs/DeepSeek Harness`，通过其 Electron 的 Node 模式读取真实宿主模块；不启动日常桌面窗口，不读取用户账号配置，模型响应由本地可控实现提供。测试产物写入 `.test-results`。

隔离 Web 界面验证入口为 `scripts/start-test-web.mjs`，需使用安装版 Electron 的 Node 模式运行。它将 `DSH_HOME` 设为本目录 `.test-home-ui`，使用本地测试模型和工作区，端口为 3146。`tests/fixture` 仅供开发验证，不应作为日常插件安装。

自动测试覆盖原生绑定与回滚、顺序及组合、共享上下文、工具、停止、失败、重试、超时、分支、图片能力和恢复。实际服务商差异及真实权限审批弹窗仍需在具体环境中验证。

进一步阅读：[设计说明](docs/design.md)、[验证记录](docs/verification.md)、[圆桌补充提示词](docs/roundtable-system-supplement.txt)。

## 许可证

[MIT](LICENSE)
