export const CSS = `
[data-slot="conversation.composer.bar"]:has([data-roundtable-native-controls]) [data-slot="conversation.input.model"]{display:none!important}
.rtn-button,.rtn-select{box-sizing:border-box;font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-selector,var(--dsw-alias-interactive-bg-hover));border:1px solid var(--dsw-alias-border-l3);border-radius:7px;padding:4px 9px}
.rtn-button{cursor:pointer}.rtn-button:disabled{opacity:.5;cursor:default}
.rtn-control{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:13px;min-width:0}
.rtn-status{color:var(--dsw-alias-label-secondary);font-size:12px}
.rtn-error{color:var(--dsw-alias-state-danger,#b33);font-size:12px;white-space:pre-wrap}
.rtn-overlay{position:fixed;inset:var(--dsh-frame-chrome-top,var(--dsh-windows-titlebar-height,0px)) 0 0;display:grid;place-items:center;background:#0006;z-index:1000;padding:20px;box-sizing:border-box}
.rtn-dialog{width:min(720px,100%);max-height:92%;overflow:auto;box-sizing:border-box;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#222);border:1px solid var(--dsw-alias-border-l3);border-radius:14px;box-shadow:0 12px 40px #0003;padding:18px;font-size:13px}
.rtn-dialog h2{margin:0 0 6px;font-size:18px}.rtn-dialog p{color:var(--dsw-alias-label-secondary);margin:0 0 10px;line-height:1.5}
.rtn-catalog{max-height:44vh;overflow-y:auto;overscroll-behavior:contain;padding:2px 2px 2px 0}
.rtn-provider{margin-bottom:7px}.rtn-provider-name{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary);margin-bottom:3px}
.rtn-options{display:flex;gap:4px;flex-wrap:wrap}
.rtn-option{font-size:12px;line-height:18px;min-width:0;max-width:190px;padding:2px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
.rtn-order{display:inline-grid;place-items:center;width:15px;height:15px;margin-right:5px;border-radius:4px;background:var(--rtn-accent);color:white;font:600 10px/1 system-ui}
.rtn-member-order{width:10px;flex:none;text-align:center;color:var(--rtn-accent);font-weight:600}
.rtn-option[aria-pressed="true"],.rtn-target[aria-pressed="true"]{background:color-mix(in srgb,var(--rtn-accent,var(--dsw-alias-state-business-primary,#4176e6)) 12%,transparent);border-color:var(--rtn-accent,var(--dsw-alias-state-business-primary,#4176e6));color:var(--dsw-alias-label-primary)}
.rtn-model-count{margin-top:8px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l3);font-size:12px;color:var(--dsw-alias-label-secondary)}
.rtn-models{display:flex;flex-direction:column;gap:3px;margin-top:6px}
.rtn-member{display:flex;align-items:center;gap:7px;min-width:0;min-height:30px;font-size:12px}
.rtn-member-name{flex:0 1 150px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.rtn-efforts{display:flex;gap:3px;flex-wrap:wrap;max-width:230px}
.rtn-effort{min-width:0;font-size:12px;line-height:18px;padding:1px 6px;color:var(--dsw-alias-label-secondary)}
.rtn-effort[aria-pressed="true"]{border-color:var(--rtn-accent);background:color-mix(in srgb,var(--rtn-accent) 12%,transparent);color:var(--dsw-alias-label-primary)}
.rtn-probe-detail{padding:1px 0 4px 46px;overflow-wrap:anywhere;line-height:18px}
.rtn-probe-result{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:12px}
.rtn-probe-result[data-state="ok"]{color:var(--dsw-alias-state-success-primary,#12a150)}.rtn-probe-result[data-state="fail"]{color:var(--dsw-alias-state-danger,#b33)}
.rtn-probe-action{flex:none;font-size:12px;line-height:18px;padding:2px 6px}
.rtn-spinner{display:inline-block;width:10px;height:10px;border:1.5px solid currentColor;border-right-color:transparent;border-radius:50%;margin-right:5px;vertical-align:-1px;animation:rtn-spin .8s linear infinite}
@keyframes rtn-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.rtn-spinner{animation:none}}
.rtn-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.rtn-primary{background:var(--dsw-alias-state-business-primary,#4b6bdb);color:white}
.rtn-toggle{position:relative;display:inline-flex;align-items:center;gap:7px;height:28px;flex:none;cursor:pointer;user-select:none}
.rtn-toggle-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.rtn-switch-input{position:absolute;left:0;top:4px;width:34px;height:20px;margin:0;opacity:0;cursor:inherit;z-index:1}
.rtn-switch-track{position:relative;display:block;flex:none;width:34px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l3,#d1d5db);box-shadow:inset 0 0 0 1px #00000006;transition:background .18s}
.rtn-switch-track::before{content:'';position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:transform .18s}
.rtn-switch-input:checked + .rtn-switch-track{background:var(--dsw-alias-state-business-primary,#4176e6)}
.rtn-switch-input:checked + .rtn-switch-track::before{transform:translateX(14px)}
.rtn-switch-input:checked ~ .rtn-toggle-label{color:var(--dsw-alias-label-primary)}
.rtn-switch-input:focus-visible + .rtn-switch-track{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:3px}
.rtn-toggle:has(.rtn-switch-input:disabled){cursor:default;opacity:.5}
.rtn-model-picker{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 9px;border-radius:999px;border-color:var(--dsw-alias-border-l3);background:var(--dsw-specific-selector);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;white-space:nowrap;transition:background .12s,border-color .12s}
.rtn-model-picker:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.rtn-picker-icon{width:15px;height:15px;flex:none;background:currentColor;mask:var(--rtn-roundtable-icon) center/contain no-repeat}
@media(prefers-reduced-motion:reduce){.rtn-switch-track,.rtn-switch-track::before,.rtn-model-picker{transition:none}}
.rtn-avatar{display:inline-grid;place-items:center;width:22px;height:22px;flex:none;border-radius:50%;background:var(--rtn-accent);color:white;font:600 10px/1 system-ui}
.rtn-targets{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--rtn-row-gap,2px);min-width:0}
.rtn-target{display:flex;align-items:center;width:100%;min-width:0;max-width:100%;height:var(--rtn-row-height,22px);padding:0 5px;border-radius:6px;text-align:center;overflow:hidden;color:var(--dsw-alias-label-tertiary);background:transparent;border-color:var(--dsw-alias-border-l3);transition:background .12s,border-color .12s,color .12s}
.rtn-target[aria-pressed="true"]{background:color-mix(in srgb,var(--rtn-accent) 9%,var(--dsw-specific-input-major));border-color:color-mix(in srgb,var(--rtn-accent) 55%,var(--dsw-alias-border-l3))}
.rtn-target:hover:not(:disabled){background:color-mix(in srgb,var(--rtn-accent) 15%,var(--dsw-specific-input-major));border-color:var(--rtn-accent)}
.rtn-target-name{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px}
:has(> [data-composer-card] [data-rtn-started]){--rtn-panel-width:142px;--rtn-panel-gap:8px;container-type:inline-size;container-name:rtn-dock;box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) + var(--dsh-composer-side-clearance) * 2);margin-inline:auto}
[data-composer-card]:has([data-rtn-started]){position:relative;min-height:98px;width:calc(100% - var(--rtn-panel-width) - var(--rtn-panel-gap));max-width:none;margin-right:calc(var(--rtn-panel-width) + var(--rtn-panel-gap))}
.rtn-control[data-rtn-started]{position:absolute;left:calc(100% + var(--rtn-panel-gap));right:auto;top:0;bottom:0;width:var(--rtn-panel-width);box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:2px;padding:2px 0;border:0;border-radius:0;background:transparent;box-shadow:none}
[data-rtn-count="2"]{--rtn-row-height:32px;--rtn-row-gap:4px}
[data-rtn-count="3"]{--rtn-row-height:28px;--rtn-row-gap:4px}
[data-rtn-count="4"]{--rtn-row-height:22px;--rtn-row-gap:2px}
.rtn-progress{font-size:11px;line-height:14px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rtn-control[data-rtn-started] .rtn-progress{position:absolute;bottom:calc(100% + 4px);left:0;right:0}
.rtn-menu{position:relative;font-size:13px}.rtn-menu summary{cursor:pointer;list-style:none}.rtn-menu-body{position:absolute;right:0;top:calc(100% + 8px);z-index:30;min-width:230px;max-width:320px;padding:12px;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l3);border-radius:12px;box-shadow:0 6px 20px #0002;display:flex;flex-direction:column;gap:8px}.rtn-menu-row{display:flex;gap:6px;align-items:center}.rtn-dot{background:var(--rtn-accent);width:8px;height:8px;border-radius:50%;flex:none}
header:has(.rtn-menu) nav [class$="_crumbCurrent"]::before{content:'';display:inline-block;width:18px;height:18px;vertical-align:-3px;margin-right:6px;background:var(--dsw-alias-label-secondary);mask:var(--rtn-roundtable-icon) center/contain no-repeat}
.rtn-speaker{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px}.rtn-button:focus-visible,.rtn-select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}
html[data-fullscreen] .rtn-overlay{top:0}@media(max-width:500px){.rtn-overlay{padding:10px}.rtn-dialog{padding:12px}.rtn-member{gap:4px;flex-wrap:wrap}.rtn-member-name{flex-basis:130px}.rtn-efforts{max-width:none}.rtn-probe-result{flex-basis:80px}}
`
