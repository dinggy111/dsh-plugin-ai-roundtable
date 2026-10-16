# AI 圆桌 · DeepSeek Harness

让多个模型围绕同一个问题讨论，由你决定谁来回答、何时追问。

AI 圆桌为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的原生聊天窗口增加多模型讨论能力。选择 **2–4 个已配置的模型**，让它们按顺序回应，或只选择其中几位补充、复核、提出不同意见。

模型使用宿主已有的服务和凭据。你始终是主持人：插件不会自动安排辩论轮次或替你决定下一步。每位模型完成自己的回答和工具调用后，才轮到下一位。

## 功能

- **多模型讨论**：固定 2–4 名成员，每轮选择任意成员组合，按配置顺序发言，各自使用支持的思考强度。
- **模型可用性检测**：选择模型后自动发送小型探测请求，显示等待时间、独立结果及具体错误，支持取消和重试。
- **原生输入与回答**：保留本体输入框、附件、命令、草稿、流式回答、思考、Markdown、公式及工具卡片。
- **原生工作区与工具**：复用本体的工作区、会话权限、审批和工具执行管线；参与模型共享当前会话的工作区和权限。
- **讨论管理**：复用本体标题、历史、重命名、归档和分支，支持 Markdown 或 JSON 导出。
- **失败处理与停止**：单个成员失败或超时后继续后续成员，可单独重试；原生停止按钮取消本批剩余发言。
- **上下文与界面**：复用本体上下文计量及压缩，成员固定配色，回复显示模型名称，界面跟随宿主主题。

## 安装

需要已安装的 DeepSeek Harness，以及至少两个已配置的模型。插件本身不提供模型账号或 API 密钥。已验证目标是 Windows 官方桌面版 **0.2.0-rc.2**；其他宿主版本和平台需要另外验证。

本插件尚未发布到 npm，已包含构建后的客户端文件，使用者无需运行构建。

### Windows 桌面版按路径加载

下载或克隆源码到固定目录，确认目录直接包含 `package.json`、`cordis.patch.yml` 和 `lib`。

在桌面应用实际使用的 profile 的 `cordis.patch.yml` 中添加以下配置，将路径替换为插件的实际位置：

```yaml
- insert:
    - id: ai-roundtable
      name: 'C:/plugins/dsh-plugin-ai-roundtable/lib/index.js'
```

完全退出并重新打开桌面应用。已有 `insert` 列表时，将插件项合并进去；若此前已加载旧版圆桌，先备份配置并移除旧加载项，避免重复启用。

### 从 GitHub 或本地目录安装到 CLI profile

使用 Node.js CLI 时要求 Node.js 22 或更新版本，插件安装命令还需要 `pnpm`。以下是 Web profile 的 bundle 安装方式：

```powershell
npx @deepseek-ai/dsh plugin --profile web add 'git+https://github.com/dinggy111/dsh-plugin-ai-roundtable.git'
```

也可从固定本地目录安装：

```powershell
npx @deepseek-ai/dsh plugin --profile web add 'C:/plugins/dsh-plugin-ai-roundtable'
```

安装后停止并重启对应的 Web 宿主：

```powershell
npx @deepseek-ai/dsh web
```

Git 地址默认安装当时的默认分支，也可在末尾加 `#提交SHA` 固定版本。独立 CLI Web 宿主的兼容性尚未完成验证，请先核对宿主版本；这里的安装命令不代表所有 Web 版本均受支持。官方桌面版的 `desktop` profile 由 Electron 应用管理，请使用前面的按路径加载方式。

## 使用

1. 点击本体“新聊天”，选择工作区，在输入区打开 **AI 圆桌** 开关。
2. 点击“选择模型”，按期望的发言顺序选择 2–4 个成员，调整思考强度并查看检测结果。
3. 输入问题，选择本轮发言的模型并发送；多个模型会按成员配置顺序回答。
4. 继续追问、只让某位模型复核，或展开原生工具卡片查看执行过程。
5. 需要时停止当前轮次，在顶部“AI 圆桌”菜单导出讨论记录。

例如，先让全部模型评估一个方案，再只让其中一个检查成本假设，最后让全部模型根据补充信息重新给出结论。

首次发送前可以重新配置或关闭圆桌；发送后固定成员，更换成员请新建圆桌。本体 `/model` 命令不会修改圆桌名单。全部取消发言目标时会阻止发送并保留草稿及附件。

连接检测会调用所选模型，输出上限为 512 token。重新勾选、修改思考强度或重新打开选择窗口时会重新检测；失败不会自动重试付费请求。

## 配置

通常无需添加配置。以下为按路径加载时的示例：

```yaml
- insert:
    - id: ai-roundtable
      name: 'C:/plugins/dsh-plugin-ai-roundtable/lib/index.js'
      config:
        dataDir: 'C:/data/roundtable-native'
        callTimeoutMs: 600000
```

| 配置 | 默认行为 |
| --- | --- |
| `dataDir` | 控制索引保存到 `$DSH_HOME/roundtable-native`；未设置 `DSH_HOME` 时使用用户目录下的 `.dsh/roundtable-native` |
| `callTimeoutMs` | 每名成员一次发言（含工具调用）最多 600000 毫秒，取值为 1–3600000 毫秒 |

工作区、工具和权限在本体会话中设置，不使用旧版的 `workspace`、`tools` 或 `probeTimeoutMs` 配置。目录更名不会自动修改已有数据路径；保留 `roundtable-native` 默认目录以继续读取原生版已有索引。

## 数据与权限

- 正文、思考、工具和标题由本体会话日志保存；插件只保存成员、路由、目标和轮次索引，不复制正文或凭据。
- 正式发言、标题生成和模型检测会调用你配置的服务，产生相应服务用量。参与模型按宿主上下文规则接收历史讨论及工具结果。
- 参与模型共享当前会话的工作区和权限。可使用哪些工具、能否写文件或执行命令，由本体配置、模式及审批决定，圆桌轮转本身不会增加授权。
- JSON 导出包含完整原生会话日志及圆桌索引，Markdown 包含用户与模型正文和工具结果；分享前请检查私人内容、路径和工具输出。
- 包名已从 `dsh-plugin-ai-roundtable-native` 改为 `dsh-plugin-ai-roundtable`，旧版独立圆桌讨论记录不会自动读取或迁移。升级前请导出需要保留的讨论。

## 兼容性与限制

| 环境 | 验证情况 |
| --- | --- |
| Windows 官方桌面版 | DeepSeek Harness `0.2.0-rc.2`，按路径加载；宿主构建 commit `04f392c9ddd144fa426da2045178797da6db6c11` |
| 完整界面验证 | 使用安装版宿主模块启动的隔离 Web profile 和本地可控模型 |
| 独立 CLI Web、其他平台或版本 | 尚未完成验证 |
| Node.js | 要求 `>=22` |

本插件依赖宿主内部会话接口及界面结构，升级宿主后应重新验证接入。每场圆桌支持 2–4 个固定成员，模型顺序发言；重启或卸载后不会自动补跑未完成成员。

可用性检测只是一次小型请求的结果，不保证后续长回答或工具调用一定成功。图片输入能力会在发送前检查；实际服务商差异及真实权限审批弹窗仍需在具体环境中验证。

## 卸载

通过 bundle 安装到 CLI profile 时：

```powershell
npx @deepseek-ai/dsh plugin --profile web remove dsh-plugin-ai-roundtable
```

按路径加载时删除对应的配置行，之后重启宿主。卸载不会主动删除本体历史或圆桌索引；删除数据前请分别备份。

## 开发

源码仓库包含自动化测试和构建脚本，无需安装第三方构建依赖：

```powershell
node scripts/build-client.mjs
node --test --test-isolation=none tests/*.test.mjs
node scripts/run-native-tests.mjs
```

修改 `lib/client/` 后需重新构建并同步提交 `lib/client.js`，Git 安装直接使用这份文件。前两条命令可以独立运行；原生集成检查需要目标桌面版安装在 `%LOCALAPPDATA%/Programs/DeepSeek Harness`，通过 Electron 的 Node 模式读取真实宿主模块，不启动日常桌面窗口、不读取账号配置，使用本地可控模型，产物写入 `.test-results`。

隔离界面验证入口是 `scripts/start-test-web.mjs`，需以安装版 Electron 的 Node 模式运行。它将 `DSH_HOME` 设为本目录 `.test-home-ui`，使用本地测试模型和工作区，端口为 3146。不要把 `tests/fixture` 作为日常插件安装。

源码、测试和可复用脚本保留在仓库；日志、一次性报告、个人配置、宿主提取内容和本地开发记录不进入版本控制。

进一步阅读：[设计说明](docs/design.md)、[验证记录](docs/verification.md)、[圆桌补充提示词](docs/roundtable-system-supplement.txt)。

## 问题反馈

请在 [Issues](https://github.com/dinggy111/dsh-plugin-ai-roundtable/issues) 中提供宿主版本、操作系统和复现步骤。粘贴报错或截图前，去掉 API 密钥、登录 token 和私人讨论内容。

## 许可证

[MIT](LICENSE)
